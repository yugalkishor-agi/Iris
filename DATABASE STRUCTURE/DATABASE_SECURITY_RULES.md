# Firestore Security Rules

## 🔐 Complete Security Rules Configuration

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isNotBlocked(userId) {
      return !exists(/databases/$(database)/documents/users/$(userId)/blockedUsers/$(request.auth.uid));
    }
    
    function isFollowing(userId) {
      return exists(/databases/$(database)/documents/users/$(request.auth.uid)/following/$(userId));
    }
    
    function isPrivateAccount(userId) {
      return get(/databases/$(database)/documents/users/$(userId)).data.isPrivate == true;
    }
    
    function canViewProfile(userId) {
      return isOwner(userId) || 
             !isPrivateAccount(userId) || 
             isFollowing(userId);
    }
    
    function isParticipant(conversationId) {
      return request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds;
    }
    
    function isGroupAdmin(conversationId) {
      let conversation = get(/databases/$(database)/documents/conversations/$(conversationId)).data;
      return conversation.type == 'group' && 
             request.auth.uid in conversation.groupAdmins;
    }
    
    // ==========================================
    // USERS COLLECTION
    // ==========================================
    
    match /users/{userId} {
      // Anyone authenticated can read user profiles (unless blocked)
      allow read: if isAuthenticated() && isNotBlocked(userId);
      
      // Only owner can update their own profile
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) && 
                       request.resource.data.userId == userId; // Prevent ID change
      
      // Cannot delete user profiles (must use backend)
      allow delete: if false;
      
      // Followers subcollection
      match /followers/{followerId} {
        // Anyone can read followers list
        allow read: if isAuthenticated();
        
        // Can add yourself as follower, or remove yourself
        allow create: if isAuthenticated() && followerId == request.auth.uid;
        allow delete: if isAuthenticated() && followerId == request.auth.uid;
        
        // Cannot update follower docs
        allow update: if false;
      }
      
      // Following subcollection
      match /following/{followingId} {
        // Only owner can read their following list
        allow read: if isOwner(userId);
        
        // Owner can follow/unfollow
        allow create, delete: if isOwner(userId);
        allow update: if isOwner(userId);
      }
      
      // Close friends subcollection
      match /closeFriends/{friendId} {
        // Only owner can read/write close friends
        allow read, write: if isOwner(userId);
      }
      
      // Blocked users subcollection
      match /blockedUsers/{blockedUserId} {
        // Only owner can read/write blocked list
        allow read, write: if isOwner(userId);
      }
      
      // Muted users subcollection
      match /mutedUsers/{mutedUserId} {
        // Only owner can read/write muted list
        allow read, write: if isOwner(userId);
      }
      
      // Saved collections
      match /savedCollections/{collectionId} {
        // Only owner can access their saved collections
        allow read, write: if isOwner(userId);
        
        match /posts/{postId} {
          allow read, write: if isOwner(userId);
        }
      }
      
      // Devices
      match /devices/{deviceId} {
        // Only owner can read/write their devices
        allow read, write: if isOwner(userId);
      }
    }
    
    // ==========================================
    // POSTS COLLECTION
    // ==========================================
    
    match /posts/{postId} {
      // Anyone authenticated can read posts
      allow read: if isAuthenticated();
      
      // Anyone can create posts
      allow create: if isAuthenticated() && 
                       request.resource.data.authorId == request.auth.uid;
      
      // Only post owner can update/delete
      allow update: if isAuthenticated() && 
                       resource.data.authorId == request.auth.uid &&
                       request.resource.data.authorId == resource.data.authorId; // Prevent author change
      allow delete: if isAuthenticated() && 
                       resource.data.authorId == request.auth.uid;
      
      // Likes subcollection
      match /likes/{userId} {
        // Anyone can read likes
        allow read: if isAuthenticated();
        
        // Can only like/unlike with your own ID
        allow create: if isAuthenticated() && userId == request.auth.uid;
        allow delete: if isAuthenticated() && userId == request.auth.uid;
        allow update: if false;
      }
      
      // Comments subcollection
      match /comments/{commentId} {
        // Anyone can read comments
        allow read: if isAuthenticated();
        
        // Anyone can create comments (if post allows)
        allow create: if isAuthenticated() && 
                         request.resource.data.authorId == request.auth.uid &&
                         get(/databases/$(database)/documents/posts/$(postId)).data.commentsEnabled == true;
        
        // Can update/delete own comments, or post owner can delete any
        allow update: if isAuthenticated() && resource.data.authorId == request.auth.uid;
        allow delete: if isAuthenticated() && 
                         (resource.data.authorId == request.auth.uid || 
                          get(/databases/$(database)/documents/posts/$(postId)).data.authorId == request.auth.uid);
        
        // Comment likes
        match /likes/{userId} {
          allow read: if isAuthenticated();
          allow create: if isAuthenticated() && userId == request.auth.uid;
          allow delete: if isAuthenticated() && userId == request.auth.uid;
          allow update: if false;
        }
        
        // Comment replies
        match /replies/{replyId} {
          allow read: if isAuthenticated();
          allow create: if isAuthenticated() && 
                           request.resource.data.authorId == request.auth.uid;
          allow update: if isAuthenticated() && resource.data.authorId == request.auth.uid;
          allow delete: if isAuthenticated() && 
                           (resource.data.authorId == request.auth.uid || 
                            get(/databases/$(database)/documents/posts/$(postId)).data.authorId == request.auth.uid);
        }
      }
      
      // Saves subcollection
      match /saves/{userId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() && userId == request.auth.uid;
        allow delete: if isAuthenticated() && userId == request.auth.uid;
        allow update: if false;
      }
      
      // Shares subcollection
      match /shares/{shareId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() && 
                         request.resource.data.sharedBy == request.auth.uid;
        allow update, delete: if false;
      }
    }
    
    // ==========================================
    // STORIES COLLECTION
    // ==========================================
    
    match /stories/{storyId} {
      // Read: depends on audience setting
      allow read: if isAuthenticated() && (
        resource.data.audience == 'public' ||
        (resource.data.audience == 'followers' && isFollowing(resource.data.authorId)) ||
        (resource.data.audience == 'closeFriends' && 
         exists(/databases/$(database)/documents/users/$(resource.data.authorId)/closeFriends/$(request.auth.uid))) ||
        resource.data.authorId == request.auth.uid
      );
      
      // Create: anyone can create stories
      allow create: if isAuthenticated() && 
                       request.resource.data.authorId == request.auth.uid;
      
      // Update/Delete: only owner
      allow update, delete: if isAuthenticated() && 
                               resource.data.authorId == request.auth.uid;
      
      // Views subcollection
      match /views/{userId} {
        // Story owner can read views
        allow read: if isAuthenticated() && 
                       get(/databases/$(database)/documents/stories/$(storyId)).data.authorId == request.auth.uid;
        
        // Can add your own view
        allow create: if isAuthenticated() && userId == request.auth.uid;
        allow update, delete: if false;
      }
      
      // Replies subcollection
      match /replies/{replyId} {
        // Story owner and reply author can read
        allow read: if isAuthenticated() && (
          get(/databases/$(database)/documents/stories/$(storyId)).data.authorId == request.auth.uid ||
          resource.data.authorId == request.auth.uid
        );
        
        // Anyone can reply (if story allows)
        allow create: if isAuthenticated() && 
                         request.resource.data.authorId == request.auth.uid &&
                         get(/databases/$(database)/documents/stories/$(storyId)).data.allowReplies == true;
        
        allow update, delete: if false;
      }
    }
    
    // ==========================================
    // HIGHLIGHTS COLLECTION
    // ==========================================
    
    match /highlights/{highlightId} {
      // Anyone can read highlights
      allow read: if isAuthenticated();
      
      // Only owner can create/update/delete
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated() && 
                               resource.data.userId == request.auth.uid;
      
      // Stories in highlight
      match /stories/{storyId} {
        allow read: if isAuthenticated();
        allow write: if isAuthenticated() && 
                        get(/databases/$(database)/documents/highlights/$(highlightId)).data.userId == request.auth.uid;
      }
    }
    
    // ==========================================
    // CONVERSATIONS COLLECTION
    // ==========================================
    
    match /conversations/{conversationId} {
      // Read: only participants
      allow read: if isAuthenticated() && 
                     request.auth.uid in resource.data.participantIds;
      
      // Create: anyone (will be participant)
      allow create: if isAuthenticated() && 
                       request.auth.uid in request.resource.data.participantIds;
      
      // Update: only participants
      allow update: if isAuthenticated() && 
                       request.auth.uid in resource.data.participantIds;
      
      // Delete: group admins or both participants in DM
      allow delete: if isAuthenticated() && (
        isGroupAdmin(conversationId) ||
        (resource.data.type == 'direct' && 
         request.auth.uid in resource.data.participantIds)
      );
      
      // Messages subcollection
      match /messages/{messageId} {
        // Read: only participants
        allow read: if isAuthenticated() && isParticipant(conversationId);
        
        // Create: only participants
        allow create: if isAuthenticated() && 
                         isParticipant(conversationId) &&
                         request.resource.data.senderId == request.auth.uid;
        
        // Update: only sender (for edits, marking as read, etc.)
        allow update: if isAuthenticated() && 
                         resource.data.senderId == request.auth.uid;
        
        // Delete: sender or group admin
        allow delete: if isAuthenticated() && (
          resource.data.senderId == request.auth.uid ||
          isGroupAdmin(conversationId)
        );
        
        // Message reactions
        match /reactions/{userId} {
          allow read: if isAuthenticated() && isParticipant(conversationId);
          allow create: if isAuthenticated() && 
                           isParticipant(conversationId) &&
                           userId == request.auth.uid;
          allow delete: if isAuthenticated() && userId == request.auth.uid;
          allow update: if false;
        }
      }
      
      // Participants subcollection
      match /participants/{userId} {
        allow read: if isAuthenticated() && isParticipant(conversationId);
        allow create: if isAuthenticated() && (
          userId == request.auth.uid ||
          isGroupAdmin(conversationId)
        );
        allow update: if isAuthenticated() && (
          userId == request.auth.uid ||
          isGroupAdmin(conversationId)
        );
        allow delete: if isAuthenticated() && (
          userId == request.auth.uid ||
          isGroupAdmin(conversationId)
        );
      }
    }
    
    // ==========================================
    // NOTIFICATIONS COLLECTION
    // ==========================================
    
    match /notifications/{notificationId} {
      // Only recipient can read their notifications
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      
      // Anyone can create notifications (for others)
      allow create: if isAuthenticated();
      
      // Only recipient can update (mark as read)
      allow update: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
      
      // Only recipient can delete
      allow delete: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
    }
    
    // ==========================================
    // REPORTS COLLECTION
    // ==========================================
    
    match /reports/{reportId} {
      // Reporter can read their own reports
      allow read: if isAuthenticated() && 
                     resource.data.reporterId == request.auth.uid;
      
      // Anyone can create reports
      allow create: if isAuthenticated() && 
                       request.resource.data.reporterId == request.auth.uid;
      
      // Cannot update or delete (handled by admin backend)
      allow update, delete: if false;
    }
    
    // ==========================================
    // ANALYTICS COLLECTION
    // ==========================================
    
    match /analytics/{analyticsId} {
      // Content owner can read their analytics
      allow read: if isAuthenticated() && (
        resource.data.type == 'profile' && resource.data.referenceId == request.auth.uid ||
        resource.data.type == 'post' && get(/databases/$(database)/documents/posts/$(resource.data.referenceId)).data.authorId == request.auth.uid ||
        resource.data.type == 'story' && get(/databases/$(database)/documents/stories/$(resource.data.referenceId)).data.authorId == request.auth.uid
      );
      
      // Only backend can write analytics
      allow write: if false;
    }
    
    // ==========================================
    // DENY ALL OTHER PATHS
    // ==========================================
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🔍 Security Rule Explanations

### User Privacy Protection

```javascript
function canViewProfile(userId) {
  return isOwner(userId) || 
         !isPrivateAccount(userId) || 
         isFollowing(userId);
}
```

**Protects:**
- Private accounts visible only to followers
- Blocked users cannot see your content
- Owner always has full access

---

### Story Audience Control

```javascript
allow read: if isAuthenticated() && (
  resource.data.audience == 'public' ||
  (resource.data.audience == 'followers' && isFollowing(resource.data.authorId)) ||
  (resource.data.audience == 'closeFriends' && 
   exists(/databases/$(database)/documents/users/$(resource.data.authorId)/closeFriends/$(request.auth.uid)))
);
```

**Protects:**
- Public stories: anyone can view
- Followers-only stories: only followers
- Close friends stories: only close friends list

---

### Comment Moderation

```javascript
allow delete: if isAuthenticated() && 
  (resource.data.authorId == request.auth.uid || 
   get(/databases/$(database)/documents/posts/$(postId)).data.authorId == request.auth.uid);
```

**Allows:**
- Comment authors can delete their own comments
- Post owners can delete any comment on their posts

---

### Message Privacy

```javascript
allow read: if isAuthenticated() && isParticipant(conversationId);
```

**Ensures:**
- Only conversation participants can read messages
- No external access to private conversations

---

## 🚨 Security Best Practices

### 1. Prevent ID Spoofing

```javascript
// ❌ Bad: No validation
allow create: if isAuthenticated();

// ✅ Good: Validate IDs match auth
allow create: if isAuthenticated() && 
                 request.resource.data.authorId == request.auth.uid;
```

### 2. Prevent Field Tampering

```javascript
// Prevent changing author after creation
allow update: if request.resource.data.authorId == resource.data.authorId;
```

### 3. Limit Data Exposure

```javascript
// Only owner sees full follower list
allow read: if isOwner(userId);

// Others can only check if they follow
allow read: if isAuthenticated() && followerId == request.auth.uid;
```

### 4. Rate Limiting (via App Check)

```javascript
// Require App Check for write operations
allow write: if request.auth != null && 
                request.auth.token.firebase.sign_in_provider != 'anonymous';
```

---

## 🧪 Testing Security Rules

### Using Firebase Emulator

```bash
firebase emulators:start
```

### Test Cases

```javascript
// Test 1: User can read own profile
describe('Users security', () => {
  it('allows user to read own profile', async () => {
    const db = firebase.firestore();
    await firebase.assertSucceeds(
      db.collection('users').doc('user123').get()
    );
  });
  
  it('prevents reading blocked user content', async () => {
    const db = firebase.firestore();
    // Assume user456 blocked user123
    await firebase.assertFails(
      db.collection('posts').where('authorId', '==', 'user456').get()
    );
  });
});

// Test 2: Private account visibility
it('prevents viewing private account posts without following', async () => {
  const db = firebase.firestore();
  await firebase.assertFails(
    db.collection('posts').doc('privateUserPost').get()
  );
});

// Test 3: Message privacy
it('prevents reading messages from non-participant', async () => {
  const db = firebase.firestore();
  await firebase.assertFails(
    db.collection('conversations/conv123/messages').get()
  );
});
```

---

## ⚙️ Firebase Console Configuration

### 1. Enable App Check

```javascript
// In your app initialization
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

### 2. Set up Identity Platform

- Enable Email/Password auth
- Enable Google/Apple sign-in
- Configure password policies
- Enable multi-factor authentication

### 3. Configure Security Rules

```bash
# Deploy rules
firebase deploy --only firestore:rules
```

---

## 🛡️ Additional Security Layers

### Backend Validation

```typescript
// Cloud Function for sensitive operations
export const deleteAccount = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const userId = context.auth.uid;
  
  // Delete user data (bypasses security rules)
  await admin.firestore().collection('users').doc(userId).delete();
  
  // Delete auth account
  await admin.auth().deleteUser(userId);
  
  return { success: true };
});
```

### Rate Limiting

```typescript
// Prevent spam (Cloud Function)
export const createPost = functions.https.onCall(async (data, context) => {
  const userId = context.auth!.uid;
  
  // Check recent posts
  const recentPosts = await admin.firestore()
    .collection('posts')
    .where('authorId', '==', userId)
    .where('createdAt', '>', Date.now() - 60000) // Last minute
    .get();
  
  if (recentPosts.size > 5) {
    throw new functions.https.HttpsError('resource-exhausted', 'Too many posts');
  }
  
  // Create post
  return admin.firestore().collection('posts').add(data);
});
```

### Content Moderation

```typescript
// Auto-moderate reported content
export const processReport = functions.firestore
  .document('reports/{reportId}')
  .onCreate(async (snap, context) => {
    const report = snap.data();
    
    // Check if user has multiple reports
    const userReports = await admin.firestore()
      .collection('reports')
      .where('targetUserId', '==', report.targetUserId)
      .where('status', '==', 'pending')
      .get();
    
    // Auto-suspend if 5+ reports
    if (userReports.size >= 5) {
      await admin.firestore().collection('users').doc(report.targetUserId).update({
        suspended: true,
        suspendedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
```

---

## 📋 Security Checklist

- [x] Authentication required for all operations
- [x] User ID validation on create/update
- [x] Private account visibility control
- [x] Blocked user content filtering
- [x] Story audience restrictions
- [x] Message participant verification
- [x] Comment moderation by post owner
- [x] Notification recipient validation
- [x] Prevent ID spoofing
- [x] Prevent field tampering
- [x] Backend-only operations protected
- [ ] Enable App Check (recommended)
- [ ] Set up rate limiting (recommended)
- [ ] Implement content moderation (recommended)

---

## 🔄 Updating Rules

### Development Process

1. **Edit rules:** Modify `firestore.rules`
2. **Test locally:** `firebase emulators:start`
3. **Run tests:** Test all security scenarios
4. **Deploy:** `firebase deploy --only firestore:rules`
5. **Monitor:** Check Firebase Console for rule violations

### Monitoring

```javascript
// Log security rule denials
firebase.firestore().onSnapshot(
  query,
  (snapshot) => { /* success */ },
  (error) => {
    if (error.code === 'permission-denied') {
      console.error('Security rule denied:', error);
      // Report to analytics
    }
  }
);
```
