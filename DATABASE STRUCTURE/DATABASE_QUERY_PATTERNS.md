# Query Patterns & Optimization

## 🎯 Query Design Principles

1. **Use denormalized data** to avoid joins
2. **Limit results** to reduce reads
3. **Use composite indexes** for complex queries
4. **Implement pagination** for large datasets
5. **Cache frequently accessed data** on client

---

## 📱 Common Query Patterns

### 1. User Profile Feed

**Goal:** Load user's posts fast (<100ms)

```typescript
// Query
db.collection('posts')
  .where('authorId', '==', userId)
  .orderBy('createdAt', 'desc')
  .limit(12)
  .get()

// Cost: 12 reads
// Latency: <50ms (with index)
```

**Index Required:**
```
Collection: posts
Fields: authorId (Ascending), createdAt (Descending)
```

**Optimization:**
- Use denormalized author data (no user lookup needed)
- Paginate with `startAfter()` for infinite scroll

---

### 2. Home Feed (Following)

**Goal:** Show posts from followed users

```typescript
// Step 1: Get following list (cached)
const followingSnapshot = await db
  .collection('users/{userId}/following')
  .get();

const followingIds = followingSnapshot.docs.map(doc => doc.id);

// Step 2: Fetch posts (Firestore limit: 10 IDs per query)
const chunkSize = 10;
const postPromises = [];

for (let i = 0; i < followingIds.length; i += chunkSize) {
  const chunk = followingIds.slice(i, i + chunkSize);
  
  postPromises.push(
    db.collection('posts')
      .where('authorId', 'in', chunk)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()
  );
}

const postSnapshots = await Promise.all(postPromises);
const posts = postSnapshots.flatMap(snap => snap.docs);

// Sort and merge
posts.sort((a, b) => b.data().createdAt - a.data().createdAt);
const feed = posts.slice(0, 20);

// Cost: N/10 queries × 20 reads = ~20-40 reads
// Latency: <100ms (parallel queries)
```

**Optimization:**
- Cache following list (update only on follow/unfollow)
- Implement cursor-based pagination
- Preload next page in background

---

### 3. Search Users

**Goal:** Search by username

```typescript
// Query
db.collection('users')
  .where('username', '>=', searchTerm)
  .where('username', '<=', searchTerm + '\uf8ff')
  .limit(20)
  .get()

// Cost: 1-20 reads (depends on results)
// Latency: <30ms (with index)
```

**Index Required:**
```
Collection: users
Fields: username (Ascending)
```

**Advanced:** Use Algolia or Elasticsearch for fuzzy search

---

### 4. Post Comments (Paginated)

**Goal:** Load comments with pinned comment first

```typescript
// Step 1: Get pinned comment
const pinnedQuery = await db
  .collection('posts/{postId}/comments')
  .where('isPinned', '==', true)
  .limit(1)
  .get();

// Step 2: Get regular comments
const commentsQuery = await db
  .collection('posts/{postId}/comments')
  .where('isPinned', '==', false)
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get();

// Cost: 1-21 reads
// Latency: <50ms
```

**Index Required:**
```
Collection: posts/{postId}/comments
Fields: isPinned (Ascending), createdAt (Descending)
```

---

### 5. Comment Replies (Load on Demand)

**Goal:** Fetch replies when user taps "View replies"

```typescript
// Query
db.collection('posts/{postId}/comments/{commentId}/replies')
  .orderBy('createdAt', 'asc')
  .limit(10)
  .get()

// Cost: 1-10 reads
// Latency: <30ms
```

**Smart:** Replies load only when requested, not with parent comment

---

### 6. Message Inbox

**Goal:** Show user's conversations sorted by recent activity

```typescript
// Query
db.collection('conversations')
  .where('participantIds', 'array-contains', userId)
  .orderBy('lastMessageAt', 'desc')
  .limit(50)
  .get()

// Cost: 1-50 reads
// Latency: <50ms
```

**Index Required:**
```
Collection: conversations
Fields: participantIds (Array), lastMessageAt (Descending)
```

**Optimization:**
- Use denormalized `lastMessage` object (no message lookup)
- Cache inbox, update with real-time listener

---

### 7. Chat Messages (Real-time)

**Goal:** Listen to new messages in active conversation

```typescript
// Initial load (last 50 messages)
const initialMessages = await db
  .collection('conversations/{conversationId}/messages')
  .orderBy('createdAt', 'desc')
  .limit(50)
  .get();

// Real-time listener (only new messages)
const lastMessageTime = initialMessages.docs[0]?.data().createdAt || new Date();

db.collection('conversations/{conversationId}/messages')
  .where('createdAt', '>', lastMessageTime)
  .orderBy('createdAt', 'asc')
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        displayMessage(change.doc.data());
      }
    });
  });

// Initial cost: 50 reads
// Real-time cost: 1 read per new message
// Latency: <20ms per message
```

**Smart:** Scoped listener (1 conversation only) keeps costs low

---

### 8. Notifications (Unread)

**Goal:** Fetch unread notifications

```typescript
// Query
db.collection('notifications')
  .where('userId', '==', userId)
  .where('isRead', '==', false)
  .orderBy('createdAt', 'desc')
  .limit(50)
  .get()

// Cost: 1-50 reads
// Latency: <30ms
```

**Index Required:**
```
Collection: notifications
Fields: userId (Ascending), isRead (Ascending), createdAt (Descending)
```

**Real-time:**
```typescript
db.collection('notifications')
  .where('userId', '==', userId)
  .where('createdAt', '>', now)
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        showNotification(change.doc.data());
      }
    });
  });
```

---

### 9. Stories Feed

**Goal:** Show stories from followed users

```typescript
// Get following list (cached)
const followingIds = [...]; // from cache

// Fetch active stories
const now = new Date();
const storiesPromises = followingIds.slice(0, 10).map(userId =>
  db.collection('stories')
    .where('authorId', '==', userId)
    .where('expiresAt', '>', now)
    .orderBy('expiresAt', 'asc')
    .orderBy('createdAt', 'desc')
    .get()
);

const stories = await Promise.all(storiesPromises);

// Cost: 10 queries (1 per user) × stories per user
// Latency: <80ms (parallel)
```

**Index Required:**
```
Collection: stories
Fields: authorId (Ascending), expiresAt (Ascending), createdAt (Descending)
```

---

### 10. Explore/Trending Posts

**Goal:** Show posts with high engagement

```typescript
// Query
db.collection('posts')
  .orderBy('engagement', 'desc')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get()

// Cost: 20 reads
// Latency: <50ms
```

**Index Required:**
```
Collection: posts
Fields: engagement (Descending), createdAt (Descending)
```

**Algorithm:** Update `engagement` score periodically (Cloud Function)

---

### 11. Hashtag Search

**Goal:** Find posts by hashtag

```typescript
// Query
db.collection('posts')
  .where('tags', 'array-contains', 'travel')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get()

// Cost: 1-20 reads
// Latency: <50ms
```

**Index Required:**
```
Collection: posts
Fields: tags (Array), createdAt (Descending)
```

**Limitation:** Can only query 1 tag at a time (Firestore restriction)

---

### 12. Check if User Liked Post

**Goal:** Show correct like button state

```typescript
// Query
const likeDoc = await db
  .collection('posts/{postId}/likes')
  .doc(userId)
  .get();

const hasLiked = likeDoc.exists;

// Cost: 1 read (cached after first load)
// Latency: <10ms
```

**Optimization:** Cache like state locally, sync with server

---

## 🔍 Composite Indexes Needed

### Required Indexes

```javascript
// 1. User posts
{
  collectionGroup: "posts",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "authorId", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}

// 2. Post comments
{
  collectionGroup: "comments",
  queryScope: "COLLECTION_GROUP",
  fields: [
    { fieldPath: "isPinned", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}

// 3. Conversations inbox
{
  collectionGroup: "conversations",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "participantIds", arrayConfig: "CONTAINS" },
    { fieldPath: "lastMessageAt", order: "DESCENDING" }
  ]
}

// 4. Notifications
{
  collectionGroup: "notifications",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "userId", order: "ASCENDING" },
    { fieldPath: "isRead", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}

// 5. Trending posts
{
  collectionGroup: "posts",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "engagement", order: "DESCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}

// 6. Active stories
{
  collectionGroup: "stories",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "authorId", order: "ASCENDING" },
    { fieldPath: "expiresAt", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}

// 7. Hashtag posts
{
  collectionGroup: "posts",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "tags", arrayConfig: "CONTAINS" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}
```

---

## 📊 Pagination Patterns

### Cursor-based Pagination

```typescript
// Initial page
const firstPage = await db.collection('posts')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get();

// Next page
const lastDoc = firstPage.docs[firstPage.docs.length - 1];

const nextPage = await db.collection('posts')
  .orderBy('createdAt', 'desc')
  .startAfter(lastDoc)
  .limit(20)
  .get();

// Cost: 20 reads per page
```

**Benefits:**
- Efficient for large datasets
- No skipped items
- Works with real-time updates

---

### Infinite Scroll Implementation

```typescript
class FeedLoader {
  private lastDoc: any = null;
  private loading = false;
  private hasMore = true;

  async loadMore() {
    if (this.loading || !this.hasMore) return;
    
    this.loading = true;
    
    let query = db.collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(20);
    
    if (this.lastDoc) {
      query = query.startAfter(this.lastDoc);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty || snapshot.docs.length < 20) {
      this.hasMore = false;
    }
    
    this.lastDoc = snapshot.docs[snapshot.docs.length - 1];
    this.loading = false;
    
    return snapshot.docs.map(doc => doc.data());
  }
}
```

---

## ⚡ Performance Best Practices

### 1. Batch Reads

```typescript
// ❌ Bad: Multiple individual reads
for (const userId of userIds) {
  await db.collection('users').doc(userId).get(); // N reads, slow
}

// ✅ Good: Batch read
const userRefs = userIds.map(id => db.collection('users').doc(id));
const userDocs = await db.getAll(...userRefs); // 1 batch, fast
```

### 2. Denormalize Display Data

```typescript
// ❌ Bad: Fetch user for each post
posts.forEach(async post => {
  const user = await db.collection('users').doc(post.authorId).get();
  post.authorName = user.data().username; // Extra read
});

// ✅ Good: Use denormalized data
posts.forEach(post => {
  post.authorName = post.authorUsername; // No extra read
});
```

### 3. Use Real-time Listeners Wisely

```typescript
// ❌ Bad: Listen to entire collection
db.collection('messages').onSnapshot(...); // Expensive

// ✅ Good: Scope to specific conversation
db.collection('conversations/{id}/messages')
  .where('createdAt', '>', now)
  .onSnapshot(...); // Efficient
```

### 4. Implement Client-side Caching

```typescript
class CachedQuery {
  private cache = new Map();
  private cacheTime = 5 * 60 * 1000; // 5 minutes

  async get(key: string, queryFn: () => Promise<any>) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
      return cached.data; // Return cached
    }
    
    const data = await queryFn(); // Fetch fresh
    this.cache.set(key, { data, timestamp: Date.now() });
    
    return data;
  }
}
```

### 5. Preload Next Page

```typescript
// Load current page
const currentPage = await loadPosts(lastDoc, 20);
displayPosts(currentPage);

// Preload next page in background
setTimeout(async () => {
  const nextDoc = currentPage[currentPage.length - 1];
  const nextPage = await loadPosts(nextDoc, 20);
  cacheNextPage(nextPage); // Cache for instant display
}, 1000);
```

---

## 📈 Query Cost Analysis

### Feed Load (20 posts)
- **Query:** 1 read
- **Posts:** 20 reads
- **Denormalized data:** 0 reads (no user lookups)
- **Total:** 20 reads = **$0.0012**

### Comment Section (pinned + 20 comments)
- **Pinned:** 1 read
- **Comments:** 20 reads
- **Total:** 21 reads = **$0.00126**

### Messages (50 messages + real-time)
- **Initial:** 50 reads = $0.003
- **Real-time:** 1 read per message = $0.00006 each

### Daily Active User (1000 actions)
- **Feed loads:** 10 × 20 = 200 reads
- **Comment views:** 5 × 21 = 105 reads
- **Messages:** 50 + 20 = 70 reads
- **Notifications:** 20 reads
- **Total:** ~400 reads = **$0.024/day**

**Monthly cost per user:** ~$0.72  
**10K users:** ~$7,200/month (reads only)

---

## 🎯 Optimization Summary

| Strategy | Latency Impact | Cost Savings |
|----------|----------------|--------------|
| Denormalization | -50ms | 30-40% |
| Composite indexes | -70ms | 0% |
| Client caching | -80ms | 50-60% |
| Pagination | N/A | 70-80% |
| Scoped listeners | -30ms | 60-70% |
| Batch operations | -40ms | 20-30% |

**Result:** <100ms latency, 60-70% cost reduction
