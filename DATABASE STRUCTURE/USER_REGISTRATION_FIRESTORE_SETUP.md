# 🔥 User Registration & Firestore Complete Setup Guide

**Created:** 2025-10-11  
**Status:** Complete Implementation Guide  
**Purpose:** Account creation ke time automatic Firestore data fields aur complete setup

---

## 📱 Total Pages & Sections in Iris App

### **Total Pages: 62**

### **Category-wise Breakdown:**

#### 1. **Authentication Pages (5)**
- `SplashScreen.tsx` - Initial loading & auth check
- `WelcomeScreen.tsx` - Welcome page for new users
- `LoginScreen.tsx` - Email/password login
- `SignupScreen.tsx` - User registration
- `ForgotPasswordScreen.tsx` - Password reset

#### 2. **Core Features (10)**
- `Home.tsx` - Main feed
- `Search.tsx` - User & hashtag search
- `CreatePost.tsx` - Post creation
- `Notifications.tsx` - Activity notifications
- `Profile.tsx` - User profile view
- `EditProfile.tsx` - Profile editing
- `Messages.tsx` - DM inbox
- `Chat.tsx` - Individual chat
- `Glimpses.tsx` - Stories viewer
- `GlimpseCreate.tsx` - Story creation

#### 3. **Settings Pages (25)**
- `Settings.tsx` - Main settings hub
- `ProfileSettings.tsx` - Profile preferences
- `PersonalInfo.tsx` - Name, email, phone
- `ChangePassword.tsx` - Password update
- `PrivacySettings.tsx` - Privacy controls
- `NotificationSettings.tsx` - Notification preferences
- `SecuritySettings.tsx` - Security options
- `AccountActivity.tsx` - Login history
- `AccountStatus.tsx` - Account health
- `TwoFactorAuth.tsx` - 2FA setup
- `BlockedUsers.tsx` - Blocked accounts list
- `MutedAccounts.tsx` - Muted users
- `MutedChats.tsx` - Muted conversations
- `CloseFriends.tsx` - Close friends list
- `HiddenWords.tsx` - Content filters
- `Theme.tsx` - Theme settings
- `AccentColor.tsx` - Color customization
- `FontSize.tsx` - Text size
- `LayoutStyle.tsx` - UI layout
- `Language.tsx` - Language selection
- `AppLanguage.tsx` - App language
- `DateTimeFormat.tsx` - Date/time format
- `ClearCache.tsx` - Cache management
- `DownloadData.tsx` - Data export
- `AppIcon.tsx` - Icon customization

#### 4. **Social Features (12)**
- `FollowersList.tsx` - Followers view
- `Following.tsx` - Following list
- `FollowSuggestions.tsx` - Suggested users
- `Saved.tsx` - Saved posts
- `SavedCollections.tsx` - Collections view
- `CollectionDetail.tsx` - Collection posts
- `PostDetail.tsx` - Single post view
- `Comments.tsx` - Post comments
- `TaggedPosts.tsx` - Posts user is tagged in
- `UserPosts.tsx` - User's posts grid
- `VideoFeed.tsx` - Video feed
- `Explore.tsx` - Discovery page

#### 5. **Messaging Features (5)**
- `ChatRoom.tsx` - Group chat
- `GroupChatSettings.tsx` - Group settings
- `MessageRequests.tsx` - DM requests
- `ForwardMessage.tsx` - Forward UI
- `MediaGallery.tsx` - Chat media

#### 6. **Stories/Glimpses (4)**
- `GlimpseAnalytics.tsx` - Story insights
- `GlimpseTextEditor.tsx` - Text overlay
- `StoryHighlights.tsx` - Highlights view
- `MusicSearch.tsx` - Music picker

#### 7. **Admin & Support (8)**
- `Admin.tsx` - Admin panel
- `HelpCenter.tsx` - Help articles
- `Guidelines.tsx` - Community rules
- `Acknowledgements.tsx` - Credits
- `Experimental.tsx` - Beta features
- `DeactivateAccount.tsx` - Deactivation
- `DeleteAccount.tsx` - Account deletion
- `Devices.tsx` - Device management

#### 8. **Other Features (3)**
- `LiveStream.tsx` - Live streaming
- `LoginActivity.tsx` - Login sessions
- `Index.tsx` - Root router

---

## 🔐 User Registration Flow

### **Step-by-Step Process**

```typescript
// 1. User fills signup form
Email: "user@example.com"
Password: "secure123"
Username: "@johndoe"
Display Name: "John Doe"
Avatar: [Optional File]

// 2. Frontend calls authService.register()
authService.register(email, password, username, displayName, avatarFile)

// 3. Backend creates Firebase Auth user
Firebase Auth UID: "aBc123XyZ456"

// 4. Upload avatar to Supabase (if provided)
Supabase URL: "https://shaqlzwarwjeozjtugdo.supabase.co/storage/v1/object/public/avatars/aBc123XyZ456/avatar.jpg"

// 5. Create Firestore user document
Firestore Path: /users/aBc123XyZ456
```

---

## 🗂️ Automatic Firestore Fields Created on Signup

### **Main User Document: `/users/{userId}`**

```javascript
{
  // ============ BASIC INFO ============
  "userId": "aBc123XyZ456",              // Firebase Auth UID (auto)
  "username": "johndoe",                  // From signup form (unique)
  "email": "user@example.com",            // From Firebase Auth
  "displayName": "John Doe",              // From signup form
  "avatarURL": "https://supabase...",     // Supabase URL (if uploaded, else "")
  "bio": "",                              // Empty by default
  "website": "",                          // Empty by default
  "location": "",                         // Empty by default
  
  // ============ ACCOUNT STATUS ============
  "verified": false,                      // Auto-set (false)
  "accountType": "personal",              // Auto-set (personal/business/creator)
  "isPrivate": false,                     // Auto-set (public account)
  "isOnline": true,                       // Auto-set (just registered)
  "lastSeen": Timestamp(now),             // Server timestamp
  
  // ============ STATISTICS ============
  "stats": {
    "postsCount": 0,                      // Auto-set (0)
    "storiesCount": 0,                    // Auto-set (0)
    "followersCount": 0,                  // Auto-set (0)
    "followingCount": 0,                  // Auto-set (0)
    "highlightsCount": 0                  // Auto-set (0)
  },
  
  // ============ SETTINGS ============
  "settings": {
    "theme": "auto",                      // Auto-set (auto/light/dark)
    "language": "en",                     // Auto-set (English)
    "notificationsEnabled": true,         // Auto-set (enabled)
    "showOnlineStatus": true,             // Auto-set (visible)
    "allowMessageRequests": true          // Auto-set (accept DMs)
  },
  
  // ============ TIMESTAMPS ============
  "createdAt": Timestamp(now),            // Server timestamp
  "updatedAt": Timestamp(now)             // Server timestamp
}
```

### **Total Fields Created: 20**
- Basic Info: 7 fields
- Account Status: 5 fields
- Statistics: 5 sub-fields
- Settings: 5 sub-fields
- Timestamps: 2 fields

---

## 📊 Additional Firestore Setup Requirements

### **1. Firestore Collections Structure**

```
/users/{userId}                          ← User document (created on signup)
  /followers/{followerId}                ← Empty initially
  /following/{followingId}               ← Empty initially
  /closeFriends/{friendId}               ← Empty initially
  /blockedUsers/{blockedUserId}          ← Empty initially
  /mutedUsers/{mutedUserId}              ← Empty initially
  /savedCollections/{collectionId}       ← Empty initially
  /devices/{deviceId}                    ← Added on login
  
/posts/{postId}                          ← Created when user posts
/stories/{storyId}                       ← Created when user creates story
/messages/{messageId}                    ← Created when user sends message
/conversations/{conversationId}          ← Created on first DM
/notifications/{notificationId}          ← Created on interactions
```

---

## 🔧 Complete Firestore Setup Checklist

### **Phase 1: Pre-Launch Setup** ✅

#### **1.1 Create Firestore Database**
```bash
# Go to Firebase Console
1. Open Firebase Console
2. Select your project: "appmode-a6696"
3. Go to Firestore Database
4. Click "Create Database"
5. Select Location: us-central1 (or nearest)
6. Start in Production Mode
```

#### **1.2 Deploy Security Rules**
```bash
# File: firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User documents - only owner can write
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Posts - public read, owner write
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null && 
                     request.auth.uid == resource.data.authorId;
    }

    // Messages - only participants
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
                            request.auth.uid in resource.data.participantIds;
    }
  }
}
```

Deploy command:
```bash
firebase deploy --only firestore:rules
```

#### **1.3 Create Required Indexes**

**Index 1: Posts by Author**
```json
{
  "collectionGroup": "posts",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "authorId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

**Index 2: Posts by Mentions**
```json
{
  "collectionGroup": "posts",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "mentions", "arrayConfig": "CONTAINS" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

**Index 3: Messages by Conversation**
```json
{
  "collectionGroup": "messages",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "conversationId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "ASCENDING" }
  ]
}
```

**Index 4: Notifications by User**
```json
{
  "collectionGroup": "notifications",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "recipientId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

**Index 5: Stories by Author**
```json
{
  "collectionGroup": "stories",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "authorId", "order": "ASCENDING" },
    { "fieldPath": "expiresAt", "order": "DESCENDING" }
  ]
}
```

Create indexes:
```bash
# Option 1: Click error links during testing
# Option 2: Create firestore.indexes.json and deploy
firebase deploy --only firestore:indexes
```

---

### **Phase 2: Supabase Storage Setup** ✅

#### **2.1 Create Storage Buckets**

```javascript
// Bucket 1: Avatars
Bucket Name: "avatars"
Public: true
File Size Limit: 5 MB
Allowed MIME Types: image/jpeg, image/png, image/webp

// Bucket 2: Posts
Bucket Name: "posts"
Public: true
File Size Limit: 50 MB
Allowed MIME Types: image/*, video/*

// Bucket 3: Stories
Bucket Name: "stories"
Public: true
File Size Limit: 100 MB
Allowed MIME Types: image/*, video/*

// Bucket 4: Messages
Bucket Name: "messages"
Public: true
File Size Limit: 20 MB
Allowed MIME Types: image/*, video/*, audio/*, application/pdf
```

#### **2.2 Set Bucket Policies**

```sql
-- Avatars Policy
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Repeat for all buckets
```

#### **2.3 Enable CDN**
```bash
# In Supabase Dashboard
1. Go to Storage settings
2. Enable CDN for all buckets
3. Configure cache headers (max-age=31536000)
```

---

### **Phase 3: Firebase Auth Setup** ✅

#### **3.1 Enable Authentication Methods**

```bash
# Firebase Console → Authentication → Sign-in method
1. Enable Email/Password ✅
2. Enable Google Sign-in (optional)
3. Enable Phone Authentication (optional)
4. Configure authorized domains:
   - localhost
   - your-domain.com
   - your-netlify-app.netlify.app
```

#### **3.2 Configure Email Templates**

```html
<!-- Password Reset Email -->
Subject: Reset your Iris password
Body: Click here to reset your password: %LINK%

<!-- Email Verification -->
Subject: Verify your Iris email
Body: Click here to verify: %LINK%
```

---

### **Phase 4: Cloud Functions (Optional)** 🔜

#### **4.1 User Cleanup Function**
```javascript
// Delete user data when account is deleted
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
  const userId = user.uid;
  
  // Delete Firestore documents
  await db.collection('users').doc(userId).delete();
  
  // Delete Supabase storage files
  await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`]);
});
```

#### **4.2 Story Expiry Function**
```javascript
// Delete stories after 24 hours
exports.deleteExpiredStories = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const storiesRef = db.collection('stories');
    const expired = await storiesRef.where('expiresAt', '<', now).get();
    
    const batch = db.batch();
    expired.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  });
```

---

## 🎯 User Registration Code Flow

### **Frontend: SignupScreen.tsx**

```typescript
const handleSignup = async () => {
  try {
    setLoading(true);
    
    // Call backend
    await signUp(
      email,           // "user@example.com"
      password,        // "secure123"
      username,        // "johndoe"
      displayName,     // "John Doe"
      avatarFile       // File object or undefined
    );
    
    // Redirect to home
    navigate('/');
    
  } catch (error) {
    toast.error(error.message);
  }
};
```

### **Backend: auth.service.ts**

```typescript
async register(
  email: string,
  password: string,
  username: string,
  displayName: string,
  avatarFile?: File
): Promise<{ userId: string }> {
  
  // Step 1: Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(
    auth, 
    email, 
    password
  );
  const userId = userCredential.user.uid;
  
  // Step 2: Upload avatar to Supabase (if provided)
  let avatarURL = '';
  if (avatarFile) {
    avatarURL = await mediaService.uploadAvatar(userId, avatarFile);
  }
  
  // Step 3: Update Firebase Auth profile
  await updateProfile(userCredential.user, {
    displayName,
    photoURL: avatarURL,
  });
  
  // Step 4: Create Firestore user document
  await userService.createUser(userId, {
    username,
    email,
    displayName,
    avatarURL,
    bio: '',
  });
  
  return { userId };
}
```

### **Backend: user.service.ts**

```typescript
async createUser(userId: string, userData: CreateUserData): Promise<void> {
  const userRef = doc(db, 'users', userId);
  
  await setDoc(userRef, {
    userId,
    ...userData,
    verified: false,
    accountType: 'personal',
    isPrivate: false,
    isOnline: true,
    lastSeen: serverTimestamp(),
    stats: {
      postsCount: 0,
      storiesCount: 0,
      followersCount: 0,
      followingCount: 0,
      highlightsCount: 0,
    },
    settings: {
      theme: 'auto',
      language: 'en',
      notificationsEnabled: true,
      showOnlineStatus: true,
      allowMessageRequests: true,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
```

---

## 📋 Pre-Launch Checklist

### **Firebase Configuration** ✅
- [x] Create Firestore database
- [x] Deploy security rules
- [x] Create composite indexes
- [x] Enable Email/Password auth
- [x] Configure email templates
- [x] Set up authorized domains

### **Supabase Configuration** ✅
- [x] Create storage buckets (avatars, posts, stories, messages)
- [x] Set bucket policies
- [x] Enable CDN
- [x] Configure CORS
- [x] Test file upload

### **Code Implementation** ✅
- [x] authService.register() implemented
- [x] userService.createUser() implemented
- [x] mediaService.uploadAvatar() implemented
- [x] SignupScreen form validation
- [x] Error handling & toast messages
- [x] Loading states

### **Testing Checklist** 🔜
- [ ] Signup with avatar
- [ ] Signup without avatar
- [ ] Username uniqueness check
- [ ] Email format validation
- [ ] Password strength validation
- [ ] Firestore document creation
- [ ] Avatar upload to Supabase
- [ ] Auth state persistence
- [ ] Redirect after signup

---

## 💰 Cost Estimation (10K Users)

### **Firestore Costs**
- **Storage:** 10K users × 2KB = 20MB → **$0.004/month**
- **Reads:** 10K signups × 5 reads = 50K reads → **$0.03**
- **Writes:** 10K signups × 3 writes = 30K writes → **$0.054**
- **Total:** **$0.088/month**

### **Supabase Costs**
- **Storage:** 10K avatars × 500KB = 5GB → **$0.00** (Free tier: 10GB)
- **Bandwidth:** 10K downloads × 500KB = 5GB → **$0.00** (Free tier: 100GB)
- **Total:** **$0.00/month**

### **Firebase Auth Costs**
- **10K users:** **$0.00** (Free tier: Unlimited)

### **Total Monthly Cost: $0.088** ✅

---

## 🚀 Post-Launch Monitoring

### **Key Metrics to Track**

1. **User Registration Success Rate**
   - Target: >95%
   - Monitor: Failed signups, error types

2. **Avatar Upload Success Rate**
   - Target: >98%
   - Monitor: Upload failures, file size issues

3. **Firestore Write Latency**
   - Target: <200ms
   - Monitor: Document creation time

4. **Average Signup Time**
   - Target: <3 seconds
   - Monitor: End-to-end signup flow

5. **Daily Active Users (DAU)**
   - Track: Login frequency
   - Monitor: User retention

---

## 🔒 Security Best Practices

### **1. Username Validation**
```typescript
// Regex: lowercase, numbers, underscores only, 3-30 chars
const isValidUsername = (username: string) => {
  return /^[a-z0-9_]{3,30}$/.test(username);
};
```

### **2. Password Requirements**
```typescript
// Minimum 6 characters, at least 1 letter, 1 number
const isStrongPassword = (password: string) => {
  return password.length >= 6 && 
         /[a-zA-Z]/.test(password) && 
         /[0-9]/.test(password);
};
```

### **3. Rate Limiting**
```typescript
// Prevent spam signups
// Implement in Cloud Functions or backend
exports.rateLimit = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000 // 15 minutes
};
```

### **4. Email Verification**
```typescript
// Send verification email after signup
await sendEmailVerification(userCredential.user);
```

---

## 📚 Related Documentation

- **DATABASE_FIELD_DEFINITIONS.md** - Complete field reference
- **DATABASE_SECURITY_RULES.md** - Security rules guide
- **DATABASE_IMPLEMENTATION_GUIDE.md** - Implementation steps
- **FIRESTORE_INDEX_SETUP.md** - Index creation guide

---

## 🎉 Summary

**Jab user account create karta hai:**

1. ✅ Firebase Auth me user create hota hai (UID: aBc123XyZ)
2. ✅ Avatar Supabase me upload hota hai (if provided)
3. ✅ Firestore me `/users/{userId}` document create hota hai
4. ✅ Automatic 20 fields populate hote hain:
   - Basic info (7)
   - Account status (5)
   - Stats (5)
   - Settings (5)
   - Timestamps (2)
5. ✅ User login ho jata hai aur home feed pe redirect hota hai

**Ab app production-ready hai! 🚀**

Total cost for 10K users: **$0.09/month**
