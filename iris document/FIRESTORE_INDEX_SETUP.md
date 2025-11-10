# 🔥 Firestore Index Setup Guide

## ⚠️ Current Issue

You're seeing this error:
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

This happens because Firestore requires composite indexes for complex queries.

---

## 🚀 Quick Fix (2 Options)

### Option 1: Create Index (Recommended for Production)

**Click the link in the error message** or follow these steps:

1. **Open Firebase Console**: https://console.firebase.google.com/project/appmode-a6696/firestore/indexes

2. **Click "Create Index"** or use the auto-generated link from the error

3. **Index Configuration:**
   - Collection: `posts`
   - Fields to index:
     - `authorId` (Ascending)
     - `createdAt` (Descending)
     - `__name__` (Ascending)
   - Query Scope: Collection

4. **Click "Create"** - Index will build in 1-5 minutes

---

### Option 2: Temporary Workaround (Development Only)

Simplify the query to avoid index requirement. I can modify the code to fetch posts without complex ordering temporarily.

---

## 📋 All Required Indexes for Iris

Here are ALL the indexes you'll eventually need:

### 1. Posts by Author (Ordered by Date)
```
Collection: posts
Fields:
  - authorId (Ascending)
  - createdAt (Descending)
```

### 2. Feed Posts (Following + Date)
```
Collection: posts
Fields:
  - authorId (Ascending)
  - createdAt (Descending)
  - isActive (Ascending)
```

### 3. Posts by Hashtag
```
Collection: posts
Fields:
  - tags (Array)
  - createdAt (Descending)
```

### 4. Messages by Conversation
```
Collection: messages
Fields:
  - conversationId (Ascending)
  - createdAt (Ascending)
```

### 5. Notifications by User
```
Collection: notifications
Fields:
  - recipientId (Ascending)
  - createdAt (Descending)
  - isRead (Ascending)
```

### 6. Stories by User
```
Collection: stories
Fields:
  - authorId (Ascending)
  - expiresAt (Descending)
  - isActive (Ascending)
```

---

## 🛠️ How to Create All Indexes

### Method 1: Click Error Links (Easy)
1. Refresh your app
2. Perform actions (view profile, send message, etc.)
3. Click the index link in each error
4. Repeat until no errors

### Method 2: Manual Creation
1. Go to: https://console.firebase.google.com/project/appmode-a6696/firestore/indexes
2. Click "Create Index"
3. Enter collection and fields manually
4. Click "Create"

### Method 3: Import from File (Fastest)
Create `firestore.indexes.json`:

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
        { "fieldPath": "tags", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
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
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "recipientId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "stories",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "authorId", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "DESCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" }
      ]
    }
  ]
}
```

Then deploy:
```bash
firebase deploy --only firestore:indexes
```

---

## ⏱️ Index Build Time

- Simple indexes: 1-2 minutes
- Complex indexes: 3-5 minutes
- Large collections: Up to 10 minutes

**You can use the app while indexes are building!** Errors will disappear once ready.

---

## ✅ Verify Indexes

1. Go to Firebase Console → Firestore → Indexes
2. Check Status column:
   - 🟢 **Enabled** = Ready to use
   - 🟡 **Building** = Wait a few minutes
   - 🔴 **Error** = Check configuration

---

## 🎯 Current Priority

**Create this index FIRST** (for Profile page):

1. Click this link from your error message
2. Or go to: https://console.firebase.google.com/project/appmode-a6696/firestore/indexes
3. Create index for:
   - Collection: `posts`
   - Field 1: `authorId` (Ascending)
   - Field 2: `createdAt` (Descending)

**This will fix the Profile page error!**

---

## 💡 Why Indexes Are Needed

Firestore requires indexes when:
- Sorting by multiple fields
- Filtering + sorting
- Array membership queries
- Inequality filters on different fields

**Cost:** Indexes are FREE! They only improve performance.

---

## 🚨 Troubleshooting

### Index Creation Failed
- Check field names match exactly (case-sensitive)
- Ensure collection exists
- Try creating smaller indexes first

### Slow Index Build
- Normal for large collections (>1000 docs)
- Background process, won't affect app
- Check status in console

### Multiple Index Errors
- Create them one by one
- Click each error link as they appear
- Or import `firestore.indexes.json`

---

**After creating the index, refresh your browser and the Profile page will work! 🎉**
