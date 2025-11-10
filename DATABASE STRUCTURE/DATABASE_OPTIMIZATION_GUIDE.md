# Database Optimization Quick Reference

## ⚡ Performance Optimization Checklist

### 🎯 Critical Optimizations (Must Have)

#### 1. Denormalize Display Data
```typescript
// ❌ BAD: Extra query per post
post.authorData = await db.collection('users').doc(post.authorId).get();

// ✅ GOOD: Already in post
post.authorUsername  // Stored in post document
post.authorAvatarURL // Stored in post document
```
**Impact:** 50-70% cost reduction on feeds

#### 2. Use Aggregate Counts
```typescript
// ❌ BAD: Query entire subcollection
const likes = await db.collection('posts/{id}/likes').get();
const count = likes.size;

// ✅ GOOD: Use denormalized count
const count = post.stats.likesCount;
```
**Impact:** 99% cost reduction on counts

#### 3. Implement Pagination
```typescript
// ❌ BAD: Load everything
const posts = await db.collection('posts').get();

// ✅ GOOD: Load page by page
const posts = await db.collection('posts')
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get();
```
**Impact:** 70-95% cost reduction on initial loads

#### 4. Scope Real-time Listeners
```typescript
// ❌ BAD: Listen to all messages
db.collection('messages').onSnapshot(...);

// ✅ GOOD: Listen only to conversation
db.collection('conversations/{id}/messages')
  .where('createdAt', '>', lastMessage)
  .onSnapshot(...);
```
**Impact:** 90-99% cost reduction on listeners

#### 5. Store Media in Supabase
```typescript
// ❌ BAD: Store in Firestore
post.image = "base64string..."; // 2MB in Firestore

// ✅ GOOD: Store in Supabase
post.mediaURL = "https://supabase.co/..."; // 100 bytes in Firestore
```
**Impact:** 90% storage cost reduction

---

## 📊 Query Optimization Patterns

### Home Feed
```typescript
// Optimized: 20 reads, <100ms
const followingIds = getFromCache('followingIds');

const posts = await db.collection('posts')
  .where('authorId', 'in', followingIds.slice(0, 10))
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get();

// Use denormalized author data (no extra queries)
```

### Comments Section
```typescript
// Optimized: 21 reads max, <50ms
// 1. Get pinned comment
const pinned = await db.collection('posts/{id}/comments')
  .where('isPinned', '==', true)
  .limit(1)
  .get();

// 2. Get regular comments
const comments = await db.collection('posts/{id}/comments')
  .where('isPinned', '==', false)
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get();

// 3. Load replies on demand only
```

### Message Inbox
```typescript
// Optimized: 50 reads, <50ms
const conversations = await db.collection('conversations')
  .where('participantIds', 'array-contains', userId)
  .orderBy('lastMessageAt', 'desc')
  .limit(50)
  .get();

// Use denormalized lastMessage (no extra queries)
```

---

## 💾 Caching Strategy

### Cache Layer Implementation
```typescript
class Cache {
  private cache = new Map();
  private TTL = 5 * 60 * 1000; // 5 minutes

  async get(key: string, fetchFn: () => Promise<any>) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.time < this.TTL) {
      return cached.data; // Cache hit: 0 reads
    }
    
    const data = await fetchFn(); // Cache miss: 1 read
    this.cache.set(key, { data, time: Date.now() });
    return data;
  }
}
```

### What to Cache
- ✅ User profiles (5 min TTL)
- ✅ Following/followers lists (10 min TTL)
- ✅ Post metadata (2 min TTL)
- ✅ User settings (permanent until change)
- ❌ Real-time messages (never cache)
- ❌ Notifications (never cache)

---

## 🔄 Update Patterns

### Atomic Likes
```typescript
const batch = db.batch();

// Add like
batch.set(db.collection('posts/{id}/likes').doc(userId), {
  userId,
  likedAt: serverTimestamp()
});

// Update count
batch.update(db.collection('posts').doc(postId), {
  'stats.likesCount': increment(1),
  engagement: increment(1)
});

await batch.commit();
```

### Denormalized Updates
```typescript
// When user updates profile
const batch = db.batch();

// Update user document
batch.update(userRef, { username: newUsername });

// Update all posts (consider Cloud Function for large updates)
userPosts.forEach(post => {
  batch.update(post.ref, { authorUsername: newUsername });
});

await batch.commit();
```

---

## 📈 Index Strategy

### Required Composite Indexes

1. **Posts by author**
   - `authorId` (ASC) + `createdAt` (DESC)

2. **Trending posts**
   - `engagement` (DESC) + `createdAt` (DESC)

3. **Conversations inbox**
   - `participantIds` (ARRAY) + `lastMessageAt` (DESC)

4. **Unread notifications**
   - `userId` (ASC) + `isRead` (ASC) + `createdAt` (DESC)

5. **Hashtag search**
   - `tags` (ARRAY) + `createdAt` (DESC)

6. **Active stories**
   - `authorId` (ASC) + `expiresAt` (ASC) + `createdAt` (DESC)

---

## 💰 Cost Reduction Summary

| Strategy | Savings | Implementation |
|----------|---------|----------------|
| Denormalization | 60-70% | Store author data in posts |
| Caching | 50-60% | Implement client cache |
| Pagination | 70-80% | Limit all queries |
| Scoped listeners | 60-70% | Filter by timestamp |
| Supabase media | 90% | Upload to Supabase |
| Aggregate counts | 99% | Store counts in parent |

**Combined savings: 80-85%**

---

## 🎯 Performance Targets

| Operation | Latency | Reads | Cost |
|-----------|---------|-------|------|
| Load feed | <100ms | 20 | $0.0012 |
| View post | <50ms | 1 | $0.0000006 |
| Like post | <50ms | 2 | $0.0000012 |
| Load comments | <50ms | 21 | $0.00126 |
| Send message | <100ms | 3 | $0.0000018 |
| Check notifications | <30ms | 50 | $0.00003 |

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Not Using Denormalization
```typescript
// This requires N+1 queries
posts.forEach(async post => {
  post.user = await getUser(post.authorId); // Extra query!
});
```

### ❌ Mistake 2: Counting Subcollections
```typescript
// This reads ALL documents
const likesCount = (await db.collection('posts/{id}/likes').get()).size;
```

### ❌ Mistake 3: Unbounded Queries
```typescript
// This could read thousands of documents
const allPosts = await db.collection('posts').get();
```

### ❌ Mistake 4: Broad Listeners
```typescript
// This triggers on EVERY change
db.collection('messages').onSnapshot(...);
```

---

## ✅ Quick Wins

### Immediate Impact (< 1 hour)
1. Add `.limit()` to all queries
2. Scope real-time listeners
3. Cache user profiles

### Short Term (< 1 day)
4. Denormalize author data in posts
5. Add aggregate counts
6. Implement pagination

### Medium Term (< 1 week)
7. Move media to Supabase
8. Create composite indexes
9. Add client caching layer

---

## 📊 Monitoring

### Track These Metrics
```typescript
// Log expensive operations
if (reads > 100) {
  console.warn('Expensive query:', queryName, reads);
  analytics.track('expensive_query', { name: queryName, reads });
}

// Track cache hit rate
const hitRate = cacheHits / (cacheHits + cacheMisses);
console.log('Cache hit rate:', hitRate);
```

### Firebase Console Alerts
- Set budget at 80% of expected cost
- Alert on queries >100 reads
- Monitor index usage
- Track slow queries (>500ms)

---

## 🎓 Implementation Priority

### Phase 1: Foundation (Week 1)
- ✅ Add limits to all queries
- ✅ Implement pagination
- ✅ Create composite indexes

### Phase 2: Optimization (Week 2)
- ✅ Denormalize display data
- ✅ Add aggregate counts
- ✅ Scope listeners

### Phase 3: Advanced (Week 3)
- ✅ Client-side caching
- ✅ Supabase migration
- ✅ Monitoring setup

---

**Goal: <100ms latency, <$0.30/user/month**
