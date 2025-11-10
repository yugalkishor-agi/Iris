# Iris Database Structure - Optimized Design

> **Version:** 2.0  
> **Last Updated:** 2025-10-11  
> **Target Latency:** <100ms for most queries  
> **Cost Strategy:** Minimize Firestore reads/writes through smart denormalization  

---

## 🎯 Design Philosophy

### Core Principles
1. **Feature-Aligned**: Each feature = its own collection/subcollection
2. **Performance-First**: Denormalized stats for <100ms latency
3. **Cost-Effective**: Batch operations, shallow queries, scoped listeners
4. **Text vs Media**: Firestore for data, Supabase for media files
5. **Scalable**: Subcollections prevent 1MB document limit

### Technology Stack
- **Firestore**: All textual/relational data
- **Supabase Storage**: Images, videos, audio files
- **Firebase Auth**: User authentication
- **Firebase Cloud Messaging**: Push notifications

---

## 📊 Collections Overview

```
firestore/
├── users/{userId}
│   ├── followers/{followerId}
│   ├── following/{followingId}
│   ├── closeFriends/{friendId}
│   ├── blockedUsers/{blockedUserId}
│   ├── mutedUsers/{mutedUserId}
│   ├── savedCollections/{collectionId}
│   │   └── posts/{postId}
│   └── devices/{deviceId}
│
├── posts/{postId}
│   ├── likes/{userId}
│   ├── comments/{commentId}
│   │   ├── likes/{userId}
│   │   └── replies/{replyId}
│   ├── saves/{userId}
│   └── shares/{shareId}
│
├── stories/{storyId}
│   ├── views/{userId}
│   └── replies/{replyId}
│
├── highlights/{highlightId}
│   └── stories/{storyId}
│
├── conversations/{conversationId}
│   ├── messages/{messageId}
│   │   └── reactions/{userId}
│   └── participants/{userId}
│
├── notifications/{notificationId}
│
├── reports/{reportId}
│
└── analytics/{analyticsId}
```

---

## 👤 1. Users Collection

### `users/{userId}`

Primary user profile data. Keep lightweight for fast queries.

```typescript
{
  // Identity
  userId: string;              // Same as document ID
  username: string;            // Unique, indexed
  email: string;               // From Firebase Auth
  displayName: string;
  
  // Profile
  avatarURL: string;           // Supabase Storage URL
  bio: string;                 // Max 200 chars
  website: string;
  location: string;
  
  // Status
  verified: boolean;
  accountType: "personal" | "professional" | "business";
  isPrivate: boolean;
  isOnline: boolean;
  lastSeen: Timestamp;
  
  // Stats (Denormalized for fast access)
  stats: {
    postsCount: number;
    storiesCount: number;
    followersCount: number;
    followingCount: number;
    highlightsCount: number;
  };
  
  // Settings
  settings: {
    theme: "light" | "dark" | "auto";
    language: string;
    notificationsEnabled: boolean;
    showOnlineStatus: boolean;
    allowMessageRequests: boolean;
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `username` (unique, ascending)
- `email` (unique, ascending)
- `createdAt` (descending)

**Query Examples:**
```typescript
// Get user profile (single doc read)
db.collection('users').doc(userId).get()

// Search users by username (indexed)
db.collection('users')
  .where('username', '>=', searchTerm)
  .where('username', '<=', searchTerm + '\uf8ff')
  .limit(20)
  .get()
```

**Subcollections:**
- `followers/{followerId}` - Who follows this user
- `following/{followingId}` - Who this user follows
- `closeFriends/{friendId}` - Close friends list
- `blockedUsers/{blockedUserId}` - Blocked users
- `mutedUsers/{mutedUserId}` - Muted users
- `savedCollections/{collectionId}` - Saved post collections
- `devices/{deviceId}` - User devices for push notifications

---

## 📝 2. Posts Collection

### `posts/{postId}`

Main post document. Keep lightweight for feed queries.

```typescript
{
  // Identity
  postId: string;
  postType: "image" | "video" | "carousel" | "text";
  
  // Author
  authorId: string;            // Indexed
  authorUsername: string;      // Denormalized for feed display
  authorAvatarURL: string;     // Denormalized
  
  // Content
  caption: string;
  mediaURLs: string[];         // Supabase Storage URLs
  mediaType: "image" | "video";
  thumbnailURL?: string;       // For videos
  aspectRatio: number;         // For layout
  
  // Metadata
  location?: string;
  tags: string[];              // Hashtags
  mentions: string[];          // @mentioned userIds
  
  // Stats (Denormalized)
  stats: {
    likesCount: number;
    commentsCount: number;
    savesCount: number;
    sharesCount: number;
    viewsCount: number;
  };
  
  // Settings
  commentsEnabled: boolean;
  hideLikesCount: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Algorithm (for feed ranking)
  engagement: number;          // Calculated: likes + comments + shares
  lastEngagementAt: Timestamp;
}
```

**Indexes:**
- `authorId` + `createdAt` (desc)
- `createdAt` (desc)
- `tags` (array) + `createdAt` (desc)
- `engagement` (desc)

**Subcollections:**
- `likes/{userId}` - Post likes
- `comments/{commentId}` - Comments with nested replies
- `saves/{userId}` - Who saved this post
- `shares/{shareId}` - Share tracking

---

## 📖 3. Stories Collection

### `stories/{storyId}`

Ephemeral stories (24h lifespan).

```typescript
{
  storyId: string;
  authorId: string;            // Indexed
  authorUsername: string;      // Denormalized
  authorAvatarURL: string;     // Denormalized
  
  // Content
  mediaURL: string;            // Supabase
  mediaType: "image" | "video";
  duration: number;            // Seconds
  thumbnailURL?: string;
  
  // Overlay
  textOverlay?: {
    text: string;
    position: { x: number, y: number };
    fontSize: number;
    color: string;
  };
  
  // Settings
  audience: "public" | "followers" | "closeFriends";
  allowReplies: boolean;
  allowSharing: boolean;
  
  // Stats
  viewsCount: number;
  repliesCount: number;
  
  // Timestamps
  createdAt: Timestamp;
  expiresAt: Timestamp;        // Auto-delete after 24h
  
  // Highlight
  isHighlighted: boolean;
  highlightId?: string;
}
```

**Subcollections:**
- `views/{userId}` - Story views
- `replies/{replyId}` - Story replies

---

## 💬 4. Conversations Collection

### `conversations/{conversationId}`

DM and group chat metadata.

```typescript
{
  conversationId: string;
  type: "direct" | "group";
  
  // Group specifics
  groupName?: string;
  groupAvatarURL?: string;
  groupAdmins?: string[];      // userIds
  
  // Participants
  participantIds: string[];    // All members
  participantCount: number;
  
  // Last message (denormalized for inbox display)
  lastMessage: {
    text: string;
    senderId: string;
    senderUsername: string;
    mediaType?: "image" | "video" | "audio";
    timestamp: Timestamp;
  };
  
  // Status
  unreadCounts: {
    [userId: string]: number;  // Unread count per user
  };
  
  // Settings
  mutedBy: string[];           // userIds who muted this chat
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessageAt: Timestamp;    // For inbox sorting
}
```

**Subcollections:**
- `messages/{messageId}` - Individual messages
- `participants/{userId}` - Participant metadata

---

## 🔔 5. Notifications Collection

### `notifications/{notificationId}`

User notifications.

```typescript
{
  notificationId: string;
  
  // Recipient
  userId: string;              // Indexed
  
  // Type & Content
  type: "like" | "comment" | "follow" | "mention" | "dm" | "story_view" | "story_reply";
  
  // Actor
  actorId: string;             // Who triggered this notification
  actorUsername: string;       // Denormalized
  actorAvatarURL: string;      // Denormalized
  
  // Reference
  refType: "post" | "comment" | "story" | "message";
  refId: string;               // ID of referenced item
  refPreview?: string;         // E.g., comment text, post caption
  refMediaURL?: string;        // Thumbnail
  
  // Status
  isRead: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  readAt?: Timestamp;
}
```

**Indexes:**
- `userId` + `createdAt` (desc)
- `userId` + `isRead` + `createdAt` (desc)

---

## 📋 Additional Collections

- **`highlights/{highlightId}`** - Permanent story collections
- **`reports/{reportId}`** - User-generated reports (spam, abuse)
- **`analytics/{analyticsId}`** - Aggregate analytics data

---

## 📚 Related Documentation

For detailed information, see:
- [Complete Field Definitions](./DATABASE_FIELD_DEFINITIONS.md)
- [Security Rules](./DATABASE_SECURITY_RULES.md)
- [Query Patterns & Optimization](./DATABASE_QUERY_PATTERNS.md)
- [Cost Optimization Strategies](./DATABASE_COST_OPTIMIZATION.md)
- [Implementation Guide](./DATABASE_IMPLEMENTATION_GUIDE.md)

---

**Next Steps:**
1. Review field definitions for each collection
2. Implement Firestore security rules
3. Set up Supabase storage buckets
4. Create composite indexes
5. Implement batch write patterns
