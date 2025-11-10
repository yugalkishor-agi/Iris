# Cost Optimization Strategies

## 💰 Firestore Pricing Model

### Read/Write/Delete Operations
- **Document reads:** $0.06 per 100,000 reads
- **Document writes:** $0.18 per 100,000 writes
- **Document deletes:** $0.02 per 100,000 deletes

### Storage
- **Stored data:** $0.18 per GB/month
- **Network egress:** $0.12 per GB (after 10 GB/day)

### Example Costs
| Operation | Unit Cost |
|-----------|-----------|
| 1 million reads | $0.60 |
| 1 million writes | $1.80 |
| 100 GB storage | $18/month |

---

## 🎯 Optimization Strategies

### 1. Denormalization (60-70% cost reduction)

**Problem:** Multiple reads to display single item

```typescript
// ❌ BAD: 21 reads to display 20 posts
posts.forEach(async post => {
  const userDoc = await db.collection('users').doc(post.authorId).get(); // +1 read per post
  post.username = userDoc.data().username;
  post.avatar = userDoc.data().avatarURL;
});
// Total: 20 posts + 20 user lookups = 40 reads
// Cost: $0.0024
```

```typescript
// ✅ GOOD: 20 reads total (denormalized data)
posts.forEach(post => {
  post.username = post.authorUsername; // Already in post document
  post.avatar = post.authorAvatarURL;  // Already in post document
});
// Total: 20 reads
// Cost: $0.0012 (50% savings)
```

**Savings per 1M feed loads:** $600

---

### 2. Client-Side Caching (50-60% cost reduction)

**Strategy:** Cache frequently accessed data locally

```typescript
class FirestoreCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  async get(docRef: DocumentReference, forceRefresh = false): Promise<DocumentData> {
    const cacheKey = docRef.path;
    const cached = this.cache.get(cacheKey);

    // Return cached if fresh
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data; // 0 reads, $0 cost
    }

    // Fetch from Firestore
    const doc = await docRef.get(); // 1 read, $0.0000006 cost
    const data = doc.data()!;

    // Update cache
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  invalidate(docRef: DocumentReference) {
    this.cache.delete(docRef.path);
  }
}

// Usage
const cache = new FirestoreCache();
const user = await cache.get(userRef); // First: reads from Firestore
const user2 = await cache.get(userRef); // Subsequent: returns from cache (no read)
```

**Impact:**
- User profiles: 80% hit rate → 80% cost reduction
- Static data: 95% hit rate → 95% cost reduction

**Savings per 1M user profile views:** $480

---

### 3. Pagination (70-80% cost reduction)

**Problem:** Loading all documents at once

```typescript
// ❌ BAD: Load all posts (could be thousands)
const allPosts = await db.collection('posts')
  .where('authorId', '==', userId)
  .get();
// Cost: 1000 posts = $0.006
```

```typescript
// ✅ GOOD: Load 20 at a time
const firstPage = await db.collection('posts')
  .where('authorId', '==', userId)
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get();
// Cost: 20 posts = $0.00012 (95% savings)

// Load more on demand
const nextPage = await db.collection('posts')
  .where('authorId', '==', userId)
  .orderBy('createdAt', 'desc')
  .startAfter(lastDoc)
  .limit(20)
  .get();
```

**Savings:** 95% reduction for initial loads

---

### 4. Scoped Real-time Listeners (60-70% cost reduction)

**Problem:** Listening to entire collections

```typescript
// ❌ BAD: Listen to all messages (triggers on every change)
db.collection('conversations/{id}/messages')
  .onSnapshot(snapshot => {
    // Charged for ALL documents on EVERY change
  });
// Cost: 1000 messages × 10 updates = 10,000 reads/day = $0.006/day
```

```typescript
// ✅ GOOD: Listen only to new messages
const lastMessage = messages[messages.length - 1];

db.collection('conversations/{id}/messages')
  .where('createdAt', '>', lastMessage.createdAt)
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        // Only new messages
      }
    });
  });
// Cost: 10 new messages = 10 reads/day = $0.00006/day (99% savings)
```

**Savings per 1K active users:** $5.40/day = $162/month

---

### 5. Batch Operations (20-30% cost reduction)

**Write Efficiency**

```typescript
// ❌ BAD: Individual writes
for (const post of posts) {
  await db.collection('posts').doc(post.id).update({
    viewsCount: increment(1)
  });
  // 20 separate writes = 20 write operations
}
// Cost: 20 writes = $0.000036
```

```typescript
// ✅ GOOD: Batch write
const batch = db.batch();

posts.forEach(post => {
  const ref = db.collection('posts').doc(post.id);
  batch.update(ref, { viewsCount: increment(1) });
});

await batch.commit(); // Still 20 writes, but atomic and faster
// Cost: Same, but guaranteed consistency
```

**Note:** Batch operations don't reduce write costs, but improve consistency and reduce latency.

---

### 6. Aggregate Fields (Eliminate Count Queries)

**Problem:** Counting subcollection items

```typescript
// ❌ BAD: Query subcollection to count
const likesSnapshot = await db
  .collection('posts/{postId}/likes')
  .get();

const likesCount = likesSnapshot.size; // Reads ALL like documents
// Cost: 1000 likes = $0.0006
```

```typescript
// ✅ GOOD: Use denormalized count
const post = await db.collection('posts').doc(postId).get();
const likesCount = post.data().stats.likesCount; // 1 read
// Cost: 1 read = $0.0000006 (99.9% savings)

// Update count atomically when liking
const batch = db.batch();
batch.set(db.collection('posts/{postId}/likes').doc(userId), {
  userId,
  likedAt: serverTimestamp()
});
batch.update(db.collection('posts').doc(postId), {
  'stats.likesCount': increment(1)
});
await batch.commit();
```

**Savings per 1M like count checks:** $599.40

---

### 7. Query Only Required Fields

**Strategy:** Use `select()` to fetch specific fields

```typescript
// ❌ BAD: Fetch entire document
const posts = await db.collection('posts')
  .limit(20)
  .get();
// Downloads: ~50KB per post × 20 = 1MB
// Cost: 20 reads + 1MB bandwidth
```

```typescript
// ✅ GOOD: Fetch only needed fields
const posts = await db.collection('posts')
  .select('authorId', 'authorUsername', 'authorAvatarURL', 'caption', 'mediaURLs', 'stats', 'createdAt')
  .limit(20)
  .get();
// Downloads: ~10KB per post × 20 = 200KB
// Cost: 20 reads + 0.2MB bandwidth (80% bandwidth savings)
```

**Note:** Firestore charges per document read, not data size. However, this reduces bandwidth costs and improves latency.

---

### 8. TTL for Ephemeral Data (Storage cost reduction)

**Auto-delete expired content**

```typescript
// Stories expire after 24 hours
const storyDoc = {
  // ... story data
  createdAt: serverTimestamp(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h from now
};

// Cloud Function runs daily
export const cleanupExpiredStories = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const expiredStories = await admin.firestore()
      .collection('stories')
      .where('expiresAt', '<', new Date())
      .limit(500)
      .get();

    const batch = admin.firestore().batch();
    expiredStories.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return null;
  });
```

**Savings:**
- 10K stories/day × 30 days = 300K documents
- Without cleanup: 300K × 5KB = 1.5GB = $0.27/month
- With cleanup: Average 10K active stories × 5KB = 50MB = $0.009/month
- **Savings: $0.26/month per 10K daily stories**

---

### 9. Supabase for Media (Massive storage savings)

**Problem:** Storing media in Firestore

```typescript
// ❌ BAD: Store images as base64 in Firestore
const postDoc = {
  image: "data:image/jpeg;base64,/9j/4AAQSkZJRg..." // ~2MB
};
// Storage cost: 2MB = $0.00036/month per image
// 1M images = $360/month
```

```typescript
// ✅ GOOD: Store in Supabase, reference URL in Firestore
// Upload to Supabase
const { data, error } = await supabase.storage
  .from('posts')
  .upload(`${userId}/${postId}.jpg`, imageFile);

// Store URL in Firestore
const postDoc = {
  mediaURL: data.path // Just ~100 bytes
};
// Firestore storage: 100 bytes = $0.000000018/month
// Supabase storage: 2MB = $0.00004/month (90% cheaper)
// 1M images on Supabase = $40/month (vs $360 on Firestore)
```

**Savings: $320/month per 1M images**

---

### 10. Lazy Loading Subcollections

**Strategy:** Don't load subcollections until needed

```typescript
// ❌ BAD: Load everything at once
const post = await db.collection('posts').doc(postId).get();
const likes = await db.collection('posts/{postId}/likes').get(); // Maybe not needed
const comments = await db.collection('posts/{postId}/comments').get(); // Maybe not needed
// Cost: 1 + 100 + 50 = 151 reads
```

```typescript
// ✅ GOOD: Load on demand
const post = await db.collection('posts').doc(postId).get();
// Cost: 1 read

// Show counts from denormalized data
displayLikeCount(post.data().stats.likesCount); // 0 additional reads

// Load likes only when user clicks
button.onClick = async () => {
  const likes = await db.collection('posts/{postId}/likes')
    .limit(20)
    .get();
  displayLikes(likes);
  // Cost: 20 reads (only when needed)
};
```

**Savings:** 80-90% reduction for users who don't interact

---

## 📊 Real-world Cost Analysis

### Scenario: 10,000 Daily Active Users

#### Without Optimization
```
Feed loads (20 posts):
  - Posts: 20 reads
  - User lookups: 20 reads
  - Total per feed: 40 reads × 5 loads/day = 200 reads/user/day

Comments viewed (5 posts):
  - Comments: 50 reads × 5 = 250 reads/user/day

Messages:
  - Conversations: 50 reads
  - Messages: 100 reads
  - Total: 150 reads/user/day

Notifications:
  - Checks: 10 × 20 = 200 reads/user/day

Total reads per user per day: 800 reads
Total for 10K users: 8,000,000 reads/day
Monthly reads: 240,000,000 reads

Cost: 240M × $0.0000006 = $144/month
```

#### With Full Optimization
```
Feed loads (denormalized, cached):
  - Posts: 20 reads × 5 loads × 30% cache miss = 30 reads/user/day

Comments (paginated, cached):
  - First view only: 20 reads × 2 posts = 40 reads/user/day

Messages (scoped listeners):
  - Initial: 50 reads/user/day (one-time)
  - Updates: 10 reads/user/day

Notifications (real-time, scoped):
  - New only: 10 reads/user/day

Total reads per user per day: 140 reads
Total for 10K users: 1,400,000 reads/day
Monthly reads: 42,000,000 reads

Cost: 42M × $0.0000006 = $25.20/month

Savings: $118.80/month (82.5% reduction)
```

---

## 💡 Best Practices Summary

### Priority 1 (High Impact)
1. ✅ **Denormalize frequently accessed data** (60-70% savings)
2. ✅ **Use Supabase for media storage** (90% media storage savings)
3. ✅ **Implement client-side caching** (50-60% savings)
4. ✅ **Use scoped real-time listeners** (60-70% savings)

### Priority 2 (Medium Impact)
5. ✅ **Paginate all list queries** (70-80% savings on lists)
6. ✅ **Aggregate counts in parent documents** (99% savings on counts)
7. ✅ **Lazy load subcollections** (80-90% savings)

### Priority 3 (Lower Impact)
8. ✅ **Use batch operations** (consistency, not cost)
9. ✅ **Auto-delete ephemeral data** (storage savings)
10. ✅ **Query only required fields** (bandwidth savings)

---

## 🎯 Implementation Checklist

- [ ] Set up Supabase storage buckets
- [ ] Implement caching layer in client
- [ ] Add denormalized fields to all collections
- [ ] Update write operations to maintain denormalized data
- [ ] Implement pagination for all list views
- [ ] Scope all real-time listeners
- [ ] Create Cloud Functions for:
  - [ ] Story cleanup (daily)
  - [ ] Notification cleanup (weekly)
  - [ ] Analytics aggregation (daily)
- [ ] Set up monitoring for:
  - [ ] Read/write operations per endpoint
  - [ ] Cache hit rates
  - [ ] Query performance
- [ ] Implement lazy loading for subcollections
- [ ] Add composite indexes for all queries

---

## 📈 Monitoring & Alerting

### Track Key Metrics

```typescript
// Log expensive operations
const trackQuery = async (queryName: string, queryFn: () => Promise<any>) => {
  const start = Date.now();
  const result = await queryFn();
  const duration = Date.now() - start;
  const reads = result.size || 1;

  // Log to analytics
  analytics.logEvent('firestore_query', {
    query_name: queryName,
    duration_ms: duration,
    reads: reads,
    cost_usd: reads * 0.0000006
  });

  // Alert on expensive queries
  if (reads > 100) {
    console.warn(`Expensive query: ${queryName} - ${reads} reads`);
  }

  return result;
};

// Usage
const posts = await trackQuery('home_feed', () =>
  db.collection('posts').limit(20).get()
);
```

### Set Budget Alerts

In Firebase Console:
1. Go to **Usage and Billing**
2. Set **Budget alerts** at:
   - 50% of budget
   - 80% of budget
   - 100% of budget
3. Configure email notifications

### Expected Costs (Optimized)

| Users | Reads/Month | Storage | Total/Month |
|-------|-------------|---------|-------------|
| 1K | 4.2M | 5GB | $3.42 |
| 10K | 42M | 50GB | $34.20 |
| 100K | 420M | 500GB | $342 |
| 1M | 4.2B | 5TB | $3,420 |

**Note:** These are read costs only. Add ~30% for writes and deletes.

---

## 🔄 Optimization Workflow

### 1. Measure
- Enable Firebase Performance Monitoring
- Log query metrics
- Track read/write operations

### 2. Analyze
- Identify most expensive queries
- Check cache hit rates
- Review denormalization opportunities

### 3. Optimize
- Add caching where needed
- Denormalize frequently joined data
- Scope real-time listeners
- Implement pagination

### 4. Monitor
- Track cost reduction
- Ensure functionality maintained
- Watch for performance issues

### 5. Iterate
- Continuously review metrics
- Optimize new features
- Update as usage patterns change

---

## 🎓 Key Takeaways

1. **Denormalization is your best friend** - Duplicate data to avoid joins
2. **Cache aggressively** - Network requests are expensive
3. **Paginate everything** - Don't load what you don't need
4. **Scope listeners** - Listen only to what matters
5. **Use Supabase for media** - Massive storage cost savings
6. **Count in parent docs** - Never query subcollections just to count
7. **Monitor constantly** - You can't optimize what you don't measure

**Target:** <100ms latency, <$0.001/user/day ($0.30/user/month)
