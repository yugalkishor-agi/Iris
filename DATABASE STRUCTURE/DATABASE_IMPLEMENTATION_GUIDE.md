# Database Implementation Guide

## 🚀 Quick Start

This guide walks you through implementing the Iris database structure in your application.

---

## 📋 Prerequisites

### Firebase Setup
```bash
npm install firebase
npm install @firebase/firestore
```

### Supabase Setup
```bash
npm install @supabase/supabase-js
```

---

## ⚡ Smart Implementation Strategy

### Incremental Rollout Approach

**Don't optimize everything upfront.** Focus on core functionality first, then optimize based on real usage patterns.

#### Phase 1: Core CRUD (Week 1-2)
✅ **Implement first:**
- Basic user operations (create, read, update)
- Post creation and viewing
- Simple likes/comments
- Basic messaging

❌ **Skip for now:**
- Advanced denormalization
- Complex caching strategies
- Analytics aggregation

#### Phase 2: High-Traffic Optimization (Week 3-4)
✅ **Add denormalization where it matters:**
- Posts collection (most-read): Add `authorUsername`, `authorAvatarURL`
- Feed queries: Cache following list
- User profiles: Denormalize follower/following counts

✅ **Implement caching for:**
- User profiles (5 min TTL)
- Following/followers lists (10 min TTL)
- Feed posts (2 min TTL)

#### Phase 3: Fine-Tuning (Week 5+)
✅ **Based on monitoring data:**
- Identify hotspots from logs
- Add targeted denormalization
- Optimize slow queries
- Implement advanced caching

### Hybrid Cache Strategy

```typescript
class HybridCache {
  private clientCache = new Map();
  private readonly CLIENT_TTL = 5 * 60 * 1000; // 5 min

  async getFeed(userId: string) {
    // 1. Check client cache first
    const cached = this.clientCache.get(`feed_${userId}`);
    if (cached && Date.now() - cached.time < this.CLIENT_TTL) {
      return cached.data; // Instant, 0 reads
    }

    // 2. Fetch from Firestore with server aggregation
    const followingIds = await this.getCachedFollowing(userId);
    const posts = await db.collection('posts')
      .where('authorId', 'in', followingIds.slice(0, 10))
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    // 3. Cache client-side
    this.clientCache.set(`feed_${userId}`, {
      data: posts.docs.map(d => d.data()),
      time: Date.now()
    });

    return posts.docs.map(d => d.data());
  }
}
```

### Real-time vs Polling Strategy

**Use real-time listeners for:**
- ✅ Chat messages (critical UX)
- ✅ Notifications (need instant updates)
- ✅ Typing indicators (live status)

**Use polling for:**
- ✅ Like counts (poll every 10s when post is visible)
- ✅ Comment counts (poll every 30s)
- ✅ Follower counts (poll every 60s)

```typescript
// Polling example for like count
class PostLikePoller {
  private interval: any;

  startPolling(postId: string, callback: (count: number) => void) {
    this.interval = setInterval(async () => {
      const post = await db.collection('posts').doc(postId).get();
      callback(post.data()?.stats.likesCount || 0);
    }, 10000); // Every 10 seconds
  }

  stopPolling() {
    if (this.interval) clearInterval(this.interval);
  }
}

// Use when post is on screen
useEffect(() => {
  const poller = new PostLikePoller();
  poller.startPolling(postId, setLikeCount);
  return () => poller.stopPolling();
}, [postId]);
```

**Cost savings:** 90% reduction vs continuous listeners

### Supabase + CDN for Media

```typescript
// Configure Supabase with CDN
const supabaseUrl = 'https://shaqlzwarwjeozjtugdo.supabase.co';
const cdnUrl = 'https://cdn.supabase.co/shaqlzwarwjeozjtugdo'; // CDN endpoint

export const getMediaUrl = (path: string, useCDN = true) => {
  if (useCDN) {
    return `${cdnUrl}/storage/v1/object/public/${path}`;
  }
  return `${supabaseUrl}/storage/v1/object/public/${path}`;
};

// Usage
const avatarUrl = getMediaUrl('avatars/user123.jpg', true);
const postImageUrl = getMediaUrl('posts/post456.jpg', true);
```

**Benefit:** <50ms image load times globally

---

## 🔧 Step 1: Initialize Firebase

### `src/config/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD9PHBh208uc4lDO9F3lvBUFUotnzGd56k",
  authDomain: "appmode-a6696.firebaseapp.com",
  databaseURL: "https://appmode-a6696-default-rtdb.firebaseio.com",
  projectId: "appmode-a6696",
  storageBucket: "appmode-a6696.firebasestorage.app",
  messagingSenderId: "350506689842",
  appId: "1:350506689842:web:28faec26001e4f1331632b",
  measurementId: "G-SL94R1QEMC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connect to emulator in development
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

---

## 🗄️ Step 2: Initialize Supabase

### `src/config/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://shaqlzwarwjeozjtugdo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYXFsendhcndqZW96anR1Z2RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NzYwNzUsImV4cCI6MjA3NTA1MjA3NX0.3L-e6nEZp9owu91rUpcj6VVPzGQrPTCEEKNNq2U56Fg';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Create Storage Buckets

In Supabase Dashboard, create these buckets:
- `avatars` - User profile pictures
- `posts` - Post images/videos
- `stories` - Story media
- `messages` - Message media

---

## 📝 Step 3: Define TypeScript Types

### `src/types/database.ts`

```typescript
import { Timestamp } from 'firebase/firestore';

// User types
export interface User {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  avatarURL?: string;
  bio?: string;
  website?: string;
  location?: string;
  verified: boolean;
  accountType: 'personal' | 'professional' | 'business';
  isPrivate: boolean;
  isOnline: boolean;
  lastSeen: Timestamp;
  stats: UserStats;
  settings: UserSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserStats {
  postsCount: number;
  storiesCount: number;
  followersCount: number;
  followingCount: number;
  highlightsCount: number;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notificationsEnabled: boolean;
  showOnlineStatus: boolean;
  allowMessageRequests: boolean;
}

// Post types
export interface Post {
  postId: string;
  postType: 'image' | 'video' | 'carousel' | 'text';
  authorId: string;
  authorUsername: string;
  authorAvatarURL: string;
  caption?: string;
  mediaURLs: string[];
  mediaType: 'image' | 'video';
  thumbnailURL?: string;
  aspectRatio: number;
  location?: string;
  tags: string[];
  mentions: string[];
  stats: PostStats;
  commentsEnabled: boolean;
  hideLikesCount: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  engagement: number;
  lastEngagementAt: Timestamp;
}

export interface PostStats {
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  sharesCount: number;
  viewsCount: number;
}

// Story types
export interface Story {
  storyId: string;
  authorId: string;
  authorUsername: string;
  authorAvatarURL: string;
  mediaURL: string;
  mediaType: 'image' | 'video';
  duration: number;
  thumbnailURL?: string;
  textOverlay?: TextOverlay;
  audience: 'public' | 'followers' | 'closeFriends';
  allowReplies: boolean;
  allowSharing: boolean;
  viewsCount: number;
  repliesCount: number;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  isHighlighted: boolean;
  highlightId?: string;
}

export interface TextOverlay {
  text: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
}

// Conversation types
export interface Conversation {
  conversationId: string;
  type: 'direct' | 'group';
  groupName?: string;
  groupAvatarURL?: string;
  groupAdmins?: string[];
  participantIds: string[];
  participantCount: number;
  lastMessage: LastMessage;
  unreadCounts: { [userId: string]: number };
  mutedBy: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessageAt: Timestamp;
}

export interface LastMessage {
  text: string;
  senderId: string;
  senderUsername: string;
  mediaType?: 'image' | 'video' | 'audio';
  timestamp: Timestamp;
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderAvatarURL: string;
  text?: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'file';
  thumbnailURL?: string;
  replyToMessageId?: string;
  replyToText?: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  readBy: string[];
  isForwarded: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deliveredAt?: Timestamp;
  readAt?: Timestamp;
}

// Notification types
export interface Notification {
  notificationId: string;
  userId: string;
  type: NotificationType;
  actorId: string;
  actorUsername: string;
  actorAvatarURL: string;
  refType: 'post' | 'comment' | 'story' | 'message';
  refId: string;
  refPreview?: string;
  refMediaURL?: string;
  isRead: boolean;
  createdAt: Timestamp;
  readAt?: Timestamp;
}

export type NotificationType = 
  | 'like' 
  | 'comment' 
  | 'follow' 
  | 'mention' 
  | 'dm' 
  | 'story_view' 
  | 'story_reply';
```

---

## 🔨 Step 4: Create Database Service Layer

### `src/services/database.service.ts`

```typescript
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  increment,
  serverTimestamp,
  writeBatch,
  DocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User, Post, Story, Conversation, Message, Notification } from '@/types/database';

export class DatabaseService {
  // ==========================================
  // USER OPERATIONS
  // ==========================================
  
  async createUser(userId: string, userData: Partial<User>) {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      userId,
      stats: {
        postsCount: 0,
        storiesCount: 0,
        followersCount: 0,
        followingCount: 0,
        highlightsCount: 0
      },
      settings: {
        theme: 'auto',
        language: 'en',
        notificationsEnabled: true,
        showOnlineStatus: true,
        allowMessageRequests: true
      },
      verified: false,
      accountType: 'personal',
      isPrivate: false,
      isOnline: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...userData
    });
  }

  async getUser(userId: string): Promise<User | null> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() as User : null;
  }

  async updateUser(userId: string, updates: Partial<User>) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  async searchUsers(searchTerm: string, limitCount = 20) {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('username', '>=', searchTerm),
      where('username', '<=', searchTerm + '\uf8ff'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as User);
  }

  // ==========================================
  // FOLLOW OPERATIONS
  // ==========================================

  async followUser(followerId: string, followingId: string) {
    const batch = writeBatch(db);

    // Add to follower's following list
    const followingRef = doc(db, `users/${followerId}/following/${followingId}`);
    batch.set(followingRef, {
      userId: followingId,
      followedAt: serverTimestamp(),
      notificationsEnabled: true
    });

    // Add to following's followers list
    const followerRef = doc(db, `users/${followingId}/followers/${followerId}`);
    batch.set(followerRef, {
      userId: followerId,
      followedAt: serverTimestamp(),
      isCloseFriend: false
    });

    // Update follower count
    const followerUserRef = doc(db, 'users', followerId);
    batch.update(followerUserRef, {
      'stats.followingCount': increment(1)
    });

    // Update following count
    const followingUserRef = doc(db, 'users', followingId);
    batch.update(followingUserRef, {
      'stats.followersCount': increment(1)
    });

    // Create notification
    const notifRef = doc(collection(db, 'notifications'));
    batch.set(notifRef, {
      notificationId: notifRef.id,
      userId: followingId,
      type: 'follow',
      actorId: followerId,
      actorUsername: '', // Fill from user data
      actorAvatarURL: '', // Fill from user data
      refType: 'post',
      refId: '',
      isRead: false,
      createdAt: serverTimestamp()
    });

    await batch.commit();
  }

  async unfollowUser(followerId: string, followingId: string) {
    const batch = writeBatch(db);

    // Remove from following list
    const followingRef = doc(db, `users/${followerId}/following/${followingId}`);
    batch.delete(followingRef);

    // Remove from followers list
    const followerRef = doc(db, `users/${followingId}/followers/${followerId}`);
    batch.delete(followerRef);

    // Update counts
    const followerUserRef = doc(db, 'users', followerId);
    batch.update(followerUserRef, {
      'stats.followingCount': increment(-1)
    });

    const followingUserRef = doc(db, 'users', followingId);
    batch.update(followingUserRef, {
      'stats.followersCount': increment(-1)
    });

    await batch.commit();
  }

  // ==========================================
  // POST OPERATIONS
  // ==========================================

  async createPost(postData: Partial<Post>): Promise<string> {
    const postRef = doc(collection(db, 'posts'));
    const postId = postRef.id;

    await setDoc(postRef, {
      postId,
      stats: {
        likesCount: 0,
        commentsCount: 0,
        savesCount: 0,
        sharesCount: 0,
        viewsCount: 0
      },
      commentsEnabled: true,
      hideLikesCount: false,
      engagement: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastEngagementAt: serverTimestamp(),
      ...postData
    });

    // Update user's post count
    const userRef = doc(db, 'users', postData.authorId!);
    await updateDoc(userRef, {
      'stats.postsCount': increment(1)
    });

    return postId;
  }

  async likePost(postId: string, userId: string) {
    const batch = writeBatch(db);

    // Add like
    const likeRef = doc(db, `posts/${postId}/likes/${userId}`);
    batch.set(likeRef, {
      userId,
      likedAt: serverTimestamp()
    });

    // Update post stats
    const postRef = doc(db, 'posts', postId);
    batch.update(postRef, {
      'stats.likesCount': increment(1),
      engagement: increment(1),
      lastEngagementAt: serverTimestamp()
    });

    await batch.commit();
  }

  async unlikePost(postId: string, userId: string) {
    const batch = writeBatch(db);

    // Remove like
    const likeRef = doc(db, `posts/${postId}/likes/${userId}`);
    batch.delete(likeRef);

    // Update post stats
    const postRef = doc(db, 'posts', postId);
    batch.update(postRef, {
      'stats.likesCount': increment(-1),
      engagement: increment(-1),
      lastEngagementAt: serverTimestamp()
    });

    await batch.commit();
  }

  async getUserPosts(userId: string, limitCount = 12, lastDoc?: DocumentSnapshot) {
    const postsRef = collection(db, 'posts');
    let q = query(
      postsRef,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    return {
      posts: snapshot.docs.map(doc => doc.data() as Post),
      lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
  }

  // ==========================================
  // MESSAGE OPERATIONS
  // ==========================================

  async sendMessage(conversationId: string, messageData: Partial<Message>): Promise<string> {
    const batch = writeBatch(db);

    // Create message
    const messageRef = doc(collection(db, `conversations/${conversationId}/messages`));
    const messageId = messageRef.id;

    batch.set(messageRef, {
      messageId,
      conversationId,
      status: 'sent',
      readBy: [messageData.senderId],
      isForwarded: false,
      isEdited: false,
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...messageData
    });

    // Update conversation
    const conversationRef = doc(db, 'conversations', conversationId);
    batch.update(conversationRef, {
      lastMessage: {
        text: messageData.text || '',
        senderId: messageData.senderId,
        senderUsername: messageData.senderUsername,
        mediaType: messageData.mediaType,
        timestamp: serverTimestamp()
      },
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
    return messageId;
  }

  // ==========================================
  // NOTIFICATION OPERATIONS
  // ==========================================

  async createNotification(notificationData: Partial<Notification>) {
    const notifRef = doc(collection(db, 'notifications'));
    await setDoc(notifRef, {
      notificationId: notifRef.id,
      isRead: false,
      createdAt: serverTimestamp(),
      ...notificationData
    });
  }

  async markNotificationAsRead(notificationId: string) {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, {
      isRead: true,
      readAt: serverTimestamp()
    });
  }

  async getUserNotifications(userId: string, limitCount = 50) {
    const notifsRef = collection(db, 'notifications');
    const q = query(
      notifsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Notification);
  }
}

export const databaseService = new DatabaseService();
```

---

## 📤 Step 5: Create Media Upload Service

### `src/services/media.service.ts`

```typescript
import { supabase } from '@/config/supabase';

export class MediaService {
  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileName = `${userId}/${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  async uploadPostMedia(userId: string, postId: string, files: File[]): Promise<string[]> {
    const uploadPromises = files.map(async (file, index) => {
      const fileName = `${userId}/${postId}/${index}_${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('posts')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    });

    return Promise.all(uploadPromises);
  }

  async uploadStoryMedia(userId: string, file: File): Promise<string> {
    const fileName = `${userId}/${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('stories')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('stories')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  async deleteMedia(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  }
}

export const mediaService = new MediaService();
```

---

## 🔐 Step 6: Deploy Security Rules

### Deploy to Firebase

```bash
firebase deploy --only firestore:rules
```

---

## 📊 Step 7: Create Composite Indexes

### Via Firebase Console

Navigate to **Firestore → Indexes** and create:

1. **posts** collection:
   - `authorId` (Ascending) + `createdAt` (Descending)
   - `engagement` (Descending) + `createdAt` (Descending)
   - `tags` (Array) + `createdAt` (Descending)

2. **notifications** collection:
   - `userId` (Ascending) + `isRead` (Ascending) + `createdAt` (Descending)

3. **conversations** collection:
   - `participantIds` (Array) + `lastMessageAt` (Descending)

4. **stories** collection:
   - `authorId` (Ascending) + `expiresAt` (Ascending) + `createdAt` (Descending)

---

## 🎯 Step 8: Usage Examples

### Create a User

```typescript
import { databaseService } from '@/services/database.service';

await databaseService.createUser('user123', {
  username: 'john_doe',
  email: 'john@example.com',
  displayName: 'John Doe'
});
```

### Create a Post

```typescript
// Upload media
const mediaURLs = await mediaService.uploadPostMedia(userId, postId, files);

// Create post
const postId = await databaseService.createPost({
  authorId: currentUser.userId,
  authorUsername: currentUser.username,
  authorAvatarURL: currentUser.avatarURL,
  caption: 'Beautiful sunset!',
  mediaURLs,
  mediaType: 'image',
  postType: 'image',
  aspectRatio: 1.0,
  tags: ['sunset', 'travel'],
  mentions: []
});
```

### Like a Post

```typescript
await databaseService.likePost(postId, currentUserId);
```

### Send a Message

```typescript
await databaseService.sendMessage(conversationId, {
  senderId: currentUser.userId,
  senderUsername: currentUser.username,
  senderAvatarURL: currentUser.avatarURL,
  text: 'Hello!'
});
```

---

## 🧪 Automated Tests for Denormalized Updates

### Critical: Test Cascading Updates

When you update denormalized data, changes must propagate correctly. **Write integration tests to validate this.**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { databaseService } from '@/services/database.service';

describe('Denormalized Updates', () => {
  it('updates username across all posts', async () => {
    // Setup: Create user and posts
    const userId = 'test_user_123';
    await databaseService.createUser(userId, {
      username: 'old_username',
      email: 'test@example.com',
      displayName: 'Test User'
    });

    const postId1 = await databaseService.createPost({
      authorId: userId,
      authorUsername: 'old_username',
      caption: 'Post 1'
    });

    const postId2 = await databaseService.createPost({
      authorId: userId,
      authorUsername: 'old_username',
      caption: 'Post 2'
    });

    // Update username
    await databaseService.updateUsernameCascade(userId, 'new_username');

    // Verify: Check user document
    const user = await databaseService.getUser(userId);
    expect(user.username).toBe('new_username');

    // Verify: Check all posts updated
    const post1 = await db.collection('posts').doc(postId1).get();
    expect(post1.data()?.authorUsername).toBe('new_username');

    const post2 = await db.collection('posts').doc(postId2).get();
    expect(post2.data()?.authorUsername).toBe('new_username');

    // Cleanup
    await cleanupTestData(userId);
  });

  it('maintains like count consistency', async () => {
    const postId = 'test_post_123';
    const userId1 = 'user_1';
    const userId2 = 'user_2';

    // Like post
    await databaseService.likePost(postId, userId1);
    await databaseService.likePost(postId, userId2);

    // Check count matches subcollection size
    const post = await db.collection('posts').doc(postId).get();
    const likesSnapshot = await db.collection(`posts/${postId}/likes`).get();

    expect(post.data()?.stats.likesCount).toBe(likesSnapshot.size);
    expect(post.data()?.stats.likesCount).toBe(2);

    // Unlike
    await databaseService.unlikePost(postId, userId1);

    // Verify count decreased
    const updatedPost = await db.collection('posts').doc(postId).get();
    expect(updatedPost.data()?.stats.likesCount).toBe(1);
  });

  it('updates avatar URL across all content', async () => {
    const userId = 'test_user_456';
    const oldAvatarUrl = 'https://old-avatar.jpg';
    const newAvatarUrl = 'https://new-avatar.jpg';

    // Create user with old avatar
    await databaseService.createUser(userId, {
      username: 'testuser',
      avatarURL: oldAvatarUrl
    });

    // Create content
    const postId = await databaseService.createPost({
      authorId: userId,
      authorAvatarURL: oldAvatarUrl
    });

    const commentId = await databaseService.createComment(postId, {
      authorId: userId,
      authorAvatarURL: oldAvatarUrl,
      text: 'Test comment'
    });

    // Update avatar
    await databaseService.updateAvatarCascade(userId, newAvatarUrl);

    // Verify all updates
    const user = await databaseService.getUser(userId);
    expect(user.avatarURL).toBe(newAvatarUrl);

    const post = await db.collection('posts').doc(postId).get();
    expect(post.data()?.authorAvatarURL).toBe(newAvatarUrl);

    const comment = await db.collection(`posts/${postId}/comments`).doc(commentId).get();
    expect(comment.data()?.authorAvatarURL).toBe(newAvatarUrl);
  });
});
```

### Implement Cascade Update Methods

```typescript
// Add to DatabaseService class

async updateUsernameCascade(userId: string, newUsername: string) {
  const batch = writeBatch(db);

  // 1. Update user document
  const userRef = doc(db, 'users', userId);
  batch.update(userRef, {
    username: newUsername,
    updatedAt: serverTimestamp()
  });

  // 2. Update all posts
  const userPosts = await getDocs(
    query(collection(db, 'posts'), where('authorId', '==', userId))
  );
  userPosts.docs.forEach(postDoc => {
    batch.update(postDoc.ref, { authorUsername: newUsername });
  });

  // 3. Update all comments
  const userComments = await getDocs(
    query(
      collectionGroup(db, 'comments'),
      where('authorId', '==', userId)
    )
  );
  userComments.docs.forEach(commentDoc => {
    batch.update(commentDoc.ref, { authorUsername: newUsername });
  });

  // 4. Update all messages
  const userMessages = await getDocs(
    query(
      collectionGroup(db, 'messages'),
      where('senderId', '==', userId)
    )
  );
  userMessages.docs.forEach(messageDoc => {
    batch.update(messageDoc.ref, { senderUsername: newUsername });
  });

  await batch.commit();
}

async updateAvatarCascade(userId: string, newAvatarUrl: string) {
  // Similar implementation for avatar updates
  const batch = writeBatch(db);

  const userRef = doc(db, 'users', userId);
  batch.update(userRef, { avatarURL: newAvatarUrl });

  // Update posts, comments, messages with new avatar
  // ... (similar to username cascade)

  await batch.commit();
}
```

### Monitor Cache Efficiency

```typescript
class CacheMonitor {
  private hits = 0;
  private misses = 0;
  private expirations = 0;

  recordHit() {
    this.hits++;
  }

  recordMiss() {
    this.misses++;
  }

  recordExpiration() {
    this.expirations++;
  }

  getMetrics() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      expirations: this.expirations,
      hitRate: hitRate.toFixed(2) + '%',
      total
    };
  }

  logMetrics() {
    const metrics = this.getMetrics();
    console.log('Cache Performance:', metrics);

    // Alert if hit rate drops below 80%
    if (parseFloat(metrics.hitRate) < 80) {
      console.warn('⚠️ Cache hit rate below 80%! Consider adjusting TTL or cache strategy.');
      // Send to analytics
      analytics.track('low_cache_efficiency', metrics);
    }
  }
}

// Integrate with existing cache
class MonitoredCache {
  private cache = new Map();
  private monitor = new CacheMonitor();
  private TTL = 5 * 60 * 1000;

  async get(key: string, fetchFn: () => Promise<any>) {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.time < this.TTL) {
      this.monitor.recordHit();
      return cached.data;
    }

    if (cached) {
      this.monitor.recordExpiration();
    } else {
      this.monitor.recordMiss();
    }

    const data = await fetchFn();
    this.cache.set(key, { data, time: Date.now() });
    return data;
  }

  getMetrics() {
    return this.monitor.getMetrics();
  }
}

// Log metrics every 5 minutes
setInterval(() => {
  const metrics = cache.getMetrics();
  console.log('Cache metrics:', metrics);
  
  // Send to backend for monitoring
  fetch('/api/metrics/cache', {
    method: 'POST',
    body: JSON.stringify(metrics)
  });
}, 5 * 60 * 1000);
```

### TTL Optimization Based on Monitoring

```typescript
class AdaptiveCacheTTL {
  private baseTTL = 5 * 60 * 1000; // 5 minutes
  private hitRateThreshold = 80; // Target 80% hit rate

  adjustTTL(currentHitRate: number, currentTTL: number): number {
    if (currentHitRate < this.hitRateThreshold) {
      // Increase TTL by 20% if hit rate is low
      return Math.min(currentTTL * 1.2, 15 * 60 * 1000); // Max 15 min
    } else if (currentHitRate > 95) {
      // Decrease TTL by 10% if hit rate is very high (data might be stale)
      return Math.max(currentTTL * 0.9, 2 * 60 * 1000); // Min 2 min
    }
    return currentTTL;
  }
}
```

---

## ✅ Testing Checklist

- [ ] User creation and profile updates
- [ ] Follow/unfollow operations
- [ ] Post creation with media upload
- [ ] Like/unlike posts
- [ ] Comment creation and replies
- [ ] Story creation with 24h expiry
- [ ] Message sending and real-time updates
- [ ] Notification creation and marking as read
- [ ] Security rules enforcement
- [ ] Query performance (<100ms)
- [ ] Cost monitoring

---

## 🎓 Next Steps

1. Implement real-time listeners for chat and notifications
2. Set up Cloud Functions for:
   - Story cleanup (daily)
   - Notification cleanup (weekly)
   - Analytics aggregation
3. Add client-side caching layer
4. Implement comprehensive error handling
5. Set up monitoring and alerting
6. Load test with realistic user data

---

## 📚 Additional Resources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Firebase Security Rules Reference](https://firebase.google.com/docs/rules)
- [Query Patterns Guide](./DATABASE_QUERY_PATTERNS.md)
- [Cost Optimization Guide](./DATABASE_COST_OPTIMIZATION.md)

