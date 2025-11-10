# 🔥 Required Firestore Indexes for Iris

**Created:** 2025-10-11  
**Status:** CRITICAL - Required for app to function  
**Purpose:** Composite indexes needed for complex queries

---

## ⚠️ IMPORTANT

These indexes MUST be created in Firebase Console before the app can work properly. Without them, queries will fail with "requires an index" error.

---

## 📋 How to Create Indexes

### Method 1: Click Error Links (Recommended)
1. Run the app in development
2. When you get "requires an index" error
3. Click the link in the error message
4. It will open Firebase Console with pre-filled index
5. Click "Create Index"

### Method 2: Manual Creation
1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Enter collection name and fields as shown below
4. Save

### Method 3: Deploy via CLI
```bash
# Create firestore.indexes.json file with indexes below
firebase deploy --only firestore:indexes
```

---

## 🔴 CRITICAL INDEXES (Must Create First)

### 1. Posts by Author + Date
**Why:** Profile page posts, user's post history  
**Collection:** `posts`  
**Fields:**
- `authorId` (Ascending)
- `createdAt` (Descending)

**Firebase Console:**
```
Collection ID: posts
Fields:
  authorId: Ascending
  createdAt: Descending
Query scope: Collection
```

**Error without this:**
```
The query requires an index. You can create it here: [link]
Profile.tsx → getUserPosts()
```

---

### 2. Posts by Mentions + Date
**Why:** Tagged posts on profile, mention search  
**Collection:** `posts`  
**Fields:**
- `mentions` (Array-contains)
- `createdAt` (Descending)

**Firebase Console:**
```
Collection ID: posts
Fields:
  mentions: Array-contains
  createdAt: Descending
Query scope: Collection
```

**Error without this:**
```
The query requires an index. You can create it here: [link]
Profile.tsx → getPostsByMention()
```

---

### 3. Notifications by User + Date
**Why:** User notification feed  
**Collection:** `notifications`  
**Fields:**
- `userId` (Ascending)
- `createdAt` (Descending)

**Firebase Console:**
```
Collection ID: notifications
Fields:
  userId: Ascending
  createdAt: Descending
Query scope: Collection
```

---

## 🟡 HIGH PRIORITY INDEXES

### 4. Posts by Tags + Date
**Why:** Hashtag search, trending hashtags  
**Collection:** `posts`  
**Fields:**
- `tags` (Array-contains)
- `createdAt` (Descending)

**Firebase Console:**
```
Collection ID: posts
Fields:
  tags: Array-contains
  createdAt: Descending
Query scope: Collection
```

---

### 5. Posts by Engagement + Date
**Why:** Explore page, trending posts  
**Collection:** `posts`  
**Fields:**
- `engagement` (Descending)
- `createdAt` (Descending)

**Firebase Console:**
```
Collection ID: posts
Fields:
  engagement: Descending
  createdAt: Descending
Query scope: Collection
```

---

### 6. Posts by Media Type + Engagement
**Why:** Explore filtered by photos/videos  
**Collection:** `posts`  
**Fields:**
- `mediaTypes` (Array-contains)
- `engagement` (Descending)

**Firebase Console:**
```
Collection ID: posts
Fields:
  mediaTypes: Array-contains
  engagement: Descending
Query scope: Collection
```

---

### 7. Stories by Author + Expiry
**Why:** User's active stories  
**Collection:** `stories`  
**Fields:**
- `authorId` (Ascending)
- `expiresAt` (Descending)

**Firebase Console:**
```
Collection ID: stories
Fields:
  authorId: Ascending
  expiresAt: Descending
Query scope: Collection
```

---

### 8. Messages by Conversation + Date
**Why:** Chat room messages  
**Collection:** `messages`  
**Fields:**
- `conversationId` (Ascending)
- `createdAt` (Ascending)

**Firebase Console:**
```
Collection ID: messages
Fields:
  conversationId: Ascending
  createdAt: Ascending
Query scope: Collection
```

---

### 9. Notifications by User + Read Status
**Why:** Unread count, filtering  
**Collection:** `notifications`  
**Fields:**
- `userId` (Ascending)
- `isRead` (Ascending)

**Firebase Console:**
```
Collection ID: notifications
Fields:
  userId: Ascending
  isRead: Ascending
Query scope: Collection
```

---

## 🟢 RECOMMENDED INDEXES (For Performance)

### 10. Users by Username Prefix
**Why:** Search users, autocomplete  
**Collection:** `users`  
**Fields:**
- `username` (Ascending)

**Note:** Single field index, usually auto-created

---

### 11. Posts Feed by Following
**Why:** Home feed from followed users  
**Collection:** `posts`  
**Fields:**
- `authorId` (in operator - needs special handling)
- `createdAt` (Descending)

**Note:** This uses `in` operator which Firestore handles automatically for up to 10 values

---

### 12. Suggested Users by Followers
**Why:** User suggestions  
**Collection:** `users`  
**Fields:**
- `isPrivate` (Ascending)
- `stats.followersCount` (Descending)
- `userId` (Ascending)

**Firebase Console:**
```
Collection ID: users
Fields:
  isPrivate: Ascending
  stats.followersCount: Descending
  userId: Ascending
Query scope: Collection
```

---

## 📄 firestore.indexes.json

Create this file in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "authorId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mentions", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tags", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "engagement", "order": "DESCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mediaTypes", "arrayConfig": "CONTAINS" },
        { "fieldPath": "engagement", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isRead", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "stories",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "authorId", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "conversationId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isPrivate", "order": "ASCENDING" },
        { "fieldPath": "stats.followersCount", "order": "DESCENDING" },
        { "fieldPath": "userId", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy:
```bash
firebase deploy --only firestore:indexes
```

---

## 🚀 Quick Start Guide

**Step 1:** Copy `firestore.indexes.json` above to project root

**Step 2:** Install Firebase CLI (if not installed)
```bash
npm install -g firebase-tools
firebase login
```

**Step 3:** Initialize Firebase (if not done)
```bash
firebase init firestore
# Select your project
```

**Step 4:** Deploy indexes
```bash
firebase deploy --only firestore:indexes
```

**Step 5:** Wait for indexes to build (5-10 minutes)

**Step 6:** Check status in Firebase Console → Indexes tab

---

## ⏱️ Index Build Times

| Index Type | Estimated Time | Priority |
|------------|---------------|----------|
| Posts by author | 2-3 min | 🔴 Critical |
| Posts by mentions | 2-3 min | 🔴 Critical |
| Notifications | 1-2 min | 🔴 Critical |
| Posts by tags | 3-5 min | 🟡 High |
| Posts by engagement | 3-5 min | 🟡 High |
| Stories | 1-2 min | 🟡 High |
| Messages | 2-3 min | 🟡 High |
| Users suggestions | 2-3 min | 🟢 Medium |

**Total build time:** ~20-30 minutes for all indexes

---

## 🐛 Troubleshooting

### Error: "The query requires an index"
**Solution:** Click the link in error message, it will auto-create the index

### Error: "Index already exists"
**Solution:** Check Firebase Console → Indexes, delete duplicate and recreate

### Error: "Index creation failed"
**Solution:** 
1. Check Firebase quota limits
2. Verify collection/field names match exactly
3. Wait a few minutes and retry

### Query still failing after creating index
**Solution:**
1. Index may still be building (check status)
2. Wait 5-10 minutes
3. Clear browser cache
4. Restart development server

---

## 📊 Index Monitoring

Check index status:
```bash
firebase firestore:indexes
```

View index usage:
- Firebase Console → Firestore → Usage tab
- Monitor query performance
- Identify slow queries

---

## 💰 Cost Impact

**Indexes have NO storage cost!**

Only costs:
- Document writes (indexes auto-update)
- Query reads (same with or without indexes)

**Performance benefit:** 10-100x faster queries ⚡

---

## ✅ Verification Checklist

After creating all indexes, test these features:

- [ ] Profile page loads user's posts
- [ ] Profile page shows tagged posts
- [ ] Notifications page loads
- [ ] Search works for hashtags
- [ ] Explore page shows trending posts
- [ ] Stories load on profile
- [ ] Chat messages load properly
- [ ] Suggested users appear

---

## 🎯 Summary

**Total Indexes Required:** 10  
**Critical (Must Have):** 3  
**High Priority:** 6  
**Recommended:** 1  

**Create these ASAP:**
1. Posts by author ← Profile page
2. Posts by mentions ← Tagged posts
3. Notifications by user ← Notifications page

**Without these indexes, the app will NOT work!** 🚨
