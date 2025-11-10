# Complete Field Definitions

## 👤 Users Collection

### `users/{userId}`

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `userId` | string | ✅ | Document ID, same as Firebase Auth UID | "aBc123XyZ" |
| `username` | string | ✅ | Unique username, 3-30 chars, indexed | "john_doe" |
| `email` | string | ✅ | User email from Firebase Auth | "john@example.com" |
| `displayName` | string | ✅ | Display name, 1-50 chars | "John Doe" |
| `avatarURL` | string | ❌ | Supabase storage URL | "https://..." |
| `bio` | string | ❌ | Profile bio, max 200 chars | "Designer & traveler" |
| `website` | string | ❌ | Personal website URL | "https://johndoe.com" |
| `location` | string | ❌ | User location | "San Francisco, CA" |
| `verified` | boolean | ✅ | Verification badge status | true |
| `accountType` | string | ✅ | Account type enum | "personal" |
| `isPrivate` | boolean | ✅ | Private account flag | false |
| `isOnline` | boolean | ✅ | Online status | true |
| `lastSeen` | Timestamp | ✅ | Last activity timestamp | Timestamp |
| `stats` | object | ✅ | Denormalized statistics | {...} |
| `stats.postsCount` | number | ✅ | Total posts | 42 |
| `stats.storiesCount` | number | ✅ | Active stories count | 3 |
| `stats.followersCount` | number | ✅ | Follower count | 1250 |
| `stats.followingCount` | number | ✅ | Following count | 380 |
| `stats.highlightsCount` | number | ✅ | Highlights count | 5 |
| `settings` | object | ✅ | User preferences | {...} |
| `settings.theme` | string | ✅ | Theme preference | "dark" |
| `settings.language` | string | ✅ | Language code | "en" |
| `settings.notificationsEnabled` | boolean | ✅ | Notifications toggle | true |
| `settings.showOnlineStatus` | boolean | ✅ | Show online status | true |
| `settings.allowMessageRequests` | boolean | ✅ | Allow DMs from non-followers | false |
| `createdAt` | Timestamp | ✅ | Account creation date | Timestamp |
| `updatedAt` | Timestamp | ✅ | Last profile update | Timestamp |

### `users/{userId}/followers/{followerId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | ✅ | ID of the follower |
| `followedAt` | Timestamp | ✅ | When they followed |
| `isCloseFriend` | boolean | ✅ | Close friend status |

### `users/{userId}/following/{followingId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | ✅ | ID of followed user |
| `followedAt` | Timestamp | ✅ | When user followed them |
| `notificationsEnabled` | boolean | ✅ | Notifications for this user |

### `users/{userId}/closeFriends/{friendId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | ✅ | Friend's user ID |
| `addedAt` | Timestamp | ✅ | When added to close friends |

### `users/{userId}/blockedUsers/{blockedUserId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | ✅ | Blocked user ID |
| `blockedAt` | Timestamp | ✅ | When blocked |
| `reason` | string | ❌ | Optional reason for blocking |

### `users/{userId}/mutedUsers/{mutedUserId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | ✅ | Muted user ID |
| `mutedAt` | Timestamp | ✅ | When muted |
| `mutedUntil` | Timestamp | ❌ | Expiry time (null = permanent) |

### `users/{userId}/savedCollections/{collectionId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `collectionId` | string | ✅ | Collection ID |
| `name` | string | ✅ | Collection name |
| `coverImageURL` | string | ❌ | Cover image from Supabase |
| `isPrivate` | boolean | ✅ | Private collection flag |
| `postsCount` | number | ✅ | Number of saved posts |
| `createdAt` | Timestamp | ✅ | Creation timestamp |
| `updatedAt` | Timestamp | ✅ | Last update timestamp |

### `users/{userId}/savedCollections/{collectionId}/posts/{postId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `postId` | string | ✅ | Saved post ID |
| `savedAt` | Timestamp | ✅ | When saved |

### `users/{userId}/devices/{deviceId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `deviceId` | string | ✅ | Device identifier |
| `fcmToken` | string | ✅ | Firebase Cloud Messaging token |
| `deviceType` | string | ✅ | "ios" \| "android" \| "web" |
| `deviceName` | string | ✅ | Device name |
| `lastActive` | Timestamp | ✅ | Last activity |
| `ipAddress` | string | ✅ | IP address |
| `location` | string | ❌ | Geographic location |
| `trusted` | boolean | ✅ | Trusted device flag |

---

## 📝 Posts Collection

### `posts/{postId}`

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `postId` | string | ✅ | Document ID | "post_abc123" |
| `postType` | string | ✅ | Type of post | "image" |
| `authorId` | string | ✅ | Creator user ID, indexed | "user123" |
| `authorUsername` | string | ✅ | Denormalized username | "john_doe" |
| `authorAvatarURL` | string | ✅ | Denormalized avatar | "https://..." |
| `caption` | string | ❌ | Post caption, max 2200 chars | "Beautiful sunset!" |
| `mediaURLs` | array | ✅ | Array of Supabase URLs | ["https://..."] |
| `mediaType` | string | ✅ | "image" \| "video" | "image" |
| `thumbnailURL` | string | ❌ | Video thumbnail URL | "https://..." |
| `aspectRatio` | number | ✅ | Width/height ratio | 1.0 |
| `location` | string | ❌ | Tagged location | "Paris, France" |
| `tags` | array | ✅ | Hashtags (without #) | ["travel", "sunset"] |
| `mentions` | array | ✅ | Mentioned user IDs | ["user456"] |
| `stats` | object | ✅ | Engagement statistics | {...} |
| `stats.likesCount` | number | ✅ | Like count | 125 |
| `stats.commentsCount` | number | ✅ | Comment count | 23 |
| `stats.savesCount` | number | ✅ | Save count | 45 |
| `stats.sharesCount` | number | ✅ | Share count | 8 |
| `stats.viewsCount` | number | ✅ | View count | 1250 |
| `commentsEnabled` | boolean | ✅ | Allow comments | true |
| `hideLikesCount` | boolean | ✅ | Hide like count from others | false |
| `createdAt` | Timestamp | ✅ | Post creation time | Timestamp |
| `updatedAt` | Timestamp | ✅ | Last update time | Timestamp |
| `engagement` | number | ✅ | Total engagement score | 156 |
| `lastEngagementAt` | Timestamp | ✅ | Last interaction time | Timestamp |

### `posts/{postId}/likes/{userId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | ✅ | User who liked |
| `likedAt` | Timestamp | ✅ | Like timestamp |

### `posts/{postId}/comments/{commentId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `commentId` | string | ✅ | Comment ID |
| `postId` | string | ✅ | Parent post ID |
| `authorId` | string | ✅ | Comment author ID |
| `authorUsername` | string | ✅ | Denormalized username |
| `authorAvatarURL` | string | ✅ | Denormalized avatar |
| `text` | string | ✅ | Comment text, max 500 chars |
| `mentions` | array | ✅ | Mentioned user IDs |
| `likesCount` | number | ✅ | Like count |
| `repliesCount` | number | ✅ | Reply count |
| `isPinned` | boolean | ✅ | Pinned by post owner |
| `isEdited` | boolean | ✅ | Edited flag |
| `createdAt` | Timestamp | ✅ | Creation time |
| `updatedAt` | Timestamp | ✅ | Last update time |

### `posts/{postId}/comments/{commentId}/replies/{replyId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `replyId` | string | ✅ | Reply ID |
| `parentCommentId` | string | ✅ | Parent comment ID |
| `authorId` | string | ✅ | Reply author ID |
| `authorUsername` | string | ✅ | Denormalized username |
| `authorAvatarURL` | string | ✅ | Denormalized avatar |
| `text` | string | ✅ | Reply text, max 500 chars |
| `mentions` | array | ✅ | Mentioned user IDs |
| `likesCount` | number | ✅ | Like count |
| `createdAt` | Timestamp | ✅ | Creation time |
| `updatedAt` | Timestamp | ✅ | Last update time |

### `posts/{postId}/saves/{userId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | ✅ | User who saved |
| `savedAt` | Timestamp | ✅ | Save timestamp |
| `collectionId` | string | ❌ | Collection ID (if saved to collection) |

### `posts/{postId}/shares/{shareId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shareId` | string | ✅ | Share ID |
| `sharedBy` | string | ✅ | User ID who shared |
| `sharedTo` | string | ❌ | Recipient user ID (for DMs) |
| `shareType` | string | ✅ | "dm" \| "story" \| "external" |
| `sharedAt` | Timestamp | ✅ | Share timestamp |

---

## 📖 Stories Collection

### `stories/{storyId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `storyId` | string | ✅ | Story ID |
| `authorId` | string | ✅ | Creator user ID |
| `authorUsername` | string | ✅ | Denormalized username |
| `authorAvatarURL` | string | ✅ | Denormalized avatar |
| `mediaURL` | string | ✅ | Supabase media URL |
| `mediaType` | string | ✅ | "image" \| "video" |
| `duration` | number | ✅ | Duration in seconds |
| `thumbnailURL` | string | ❌ | Video thumbnail |
| `textOverlay` | object | ❌ | Text overlay data |
| `textOverlay.text` | string | ❌ | Overlay text |
| `textOverlay.position` | object | ❌ | {x, y} coordinates |
| `textOverlay.fontSize` | number | ❌ | Font size |
| `textOverlay.color` | string | ❌ | Text color |
| `audience` | string | ✅ | "public" \| "followers" \| "closeFriends" |
| `allowReplies` | boolean | ✅ | Allow replies |
| `allowSharing` | boolean | ✅ | Allow sharing |
| `viewsCount` | number | ✅ | View count |
| `repliesCount` | number | ✅ | Reply count |
| `createdAt` | Timestamp | ✅ | Creation time |
| `expiresAt` | Timestamp | ✅ | Expiry time (24h from creation) |
| `isHighlighted` | boolean | ✅ | Added to highlights |
| `highlightId` | string | ❌ | Highlight ID if highlighted |

### `stories/{storyId}/views/{userId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | ✅ | Viewer user ID |
| `viewedAt` | Timestamp | ✅ | View timestamp |

### `stories/{storyId}/replies/{replyId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `replyId` | string | ✅ | Reply ID |
| `storyId` | string | ✅ | Parent story ID |
| `authorId` | string | ✅ | Reply author ID |
| `text` | string | ✅ | Reply text |
| `createdAt` | Timestamp | ✅ | Creation time |

---

## 🌟 Highlights Collection

### `highlights/{highlightId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `highlightId` | string | ✅ | Highlight ID |
| `userId` | string | ✅ | Owner user ID |
| `name` | string | ✅ | Highlight name |
| `coverImageURL` | string | ✅ | Cover image from Supabase |
| `storiesCount` | number | ✅ | Number of stories |
| `createdAt` | Timestamp | ✅ | Creation time |
| `updatedAt` | Timestamp | ✅ | Last update time |

### `highlights/{highlightId}/stories/{storyId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `storyId` | string | ✅ | Story ID reference |
| `addedAt` | Timestamp | ✅ | When added to highlight |
| `order` | number | ✅ | Display order |

---

## 💬 Conversations Collection

### `conversations/{conversationId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `conversationId` | string | ✅ | Conversation ID |
| `type` | string | ✅ | "direct" \| "group" |
| `groupName` | string | ❌ | Group name (if group) |
| `groupAvatarURL` | string | ❌ | Group avatar (if group) |
| `groupAdmins` | array | ❌ | Admin user IDs (if group) |
| `participantIds` | array | ✅ | All participant IDs |
| `participantCount` | number | ✅ | Number of participants |
| `lastMessage` | object | ✅ | Last message preview |
| `lastMessage.text` | string | ✅ | Message text |
| `lastMessage.senderId` | string | ✅ | Sender ID |
| `lastMessage.senderUsername` | string | ✅ | Sender username |
| `lastMessage.mediaType` | string | ❌ | Media type if present |
| `lastMessage.timestamp` | Timestamp | ✅ | Message timestamp |
| `unreadCounts` | object | ✅ | Unread count per user |
| `mutedBy` | array | ✅ | User IDs who muted chat |
| `createdAt` | Timestamp | ✅ | Creation time |
| `updatedAt` | Timestamp | ✅ | Last update time |
| `lastMessageAt` | Timestamp | ✅ | Last message time |

### `conversations/{conversationId}/messages/{messageId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messageId` | string | ✅ | Message ID |
| `conversationId` | string | ✅ | Parent conversation ID |
| `senderId` | string | ✅ | Sender user ID |
| `senderUsername` | string | ✅ | Denormalized username |
| `senderAvatarURL` | string | ✅ | Denormalized avatar |
| `text` | string | ❌ | Message text |
| `mediaURL` | string | ❌ | Media URL from Supabase |
| `mediaType` | string | ❌ | "image" \| "video" \| "audio" \| "file" |
| `thumbnailURL` | string | ❌ | Media thumbnail |
| `replyToMessageId` | string | ❌ | Replied message ID |
| `replyToText` | string | ❌ | Replied message preview |
| `status` | string | ✅ | "sending" \| "sent" \| "delivered" \| "read" \| "failed" |
| `readBy` | array | ✅ | User IDs who read message |
| `isForwarded` | boolean | ✅ | Forwarded flag |
| `isEdited` | boolean | ✅ | Edited flag |
| `isDeleted` | boolean | ✅ | Deleted flag |
| `createdAt` | Timestamp | ✅ | Send time |
| `updatedAt` | Timestamp | ✅ | Last update time |
| `deliveredAt` | Timestamp | ❌ | Delivery time |
| `readAt` | Timestamp | ❌ | Read time |

### `conversations/{conversationId}/messages/{messageId}/reactions/{userId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | ✅ | User who reacted |
| `emoji` | string | ✅ | Emoji reaction |
| `reactedAt` | Timestamp | ✅ | Reaction timestamp |

### `conversations/{conversationId}/participants/{userId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | ✅ | Participant user ID |
| `role` | string | ✅ | "admin" \| "member" |
| `joinedAt` | Timestamp | ✅ | Join timestamp |
| `lastReadAt` | Timestamp | ✅ | Last read timestamp |
| `notificationsEnabled` | boolean | ✅ | Notifications toggle |

---

## 🔔 Notifications Collection

### `notifications/{notificationId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notificationId` | string | ✅ | Notification ID |
| `userId` | string | ✅ | Recipient user ID |
| `type` | string | ✅ | Notification type |
| `actorId` | string | ✅ | User who triggered notification |
| `actorUsername` | string | ✅ | Denormalized username |
| `actorAvatarURL` | string | ✅ | Denormalized avatar |
| `refType` | string | ✅ | "post" \| "comment" \| "story" \| "message" |
| `refId` | string | ✅ | Referenced item ID |
| `refPreview` | string | ❌ | Preview text |
| `refMediaURL` | string | ❌ | Preview media URL |
| `isRead` | boolean | ✅ | Read status |
| `createdAt` | Timestamp | ✅ | Creation time |
| `readAt` | Timestamp | ❌ | Read time |

**Notification Types:**
- `like` - Someone liked your post
- `comment` - Someone commented on your post
- `follow` - Someone followed you
- `mention` - Someone mentioned you
- `dm` - New direct message
- `story_view` - Someone viewed your story
- `story_reply` - Someone replied to your story

---

## 🚨 Reports Collection

### `reports/{reportId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reportId` | string | ✅ | Report ID |
| `reporterId` | string | ✅ | User who reported |
| `targetType` | string | ✅ | "user" \| "post" \| "comment" \| "story" \| "message" |
| `targetId` | string | ✅ | Reported item ID |
| `targetUserId` | string | ✅ | Owner of reported content |
| `reason` | string | ✅ | Report reason |
| `description` | string | ❌ | Additional details |
| `status` | string | ✅ | "pending" \| "reviewed" \| "resolved" \| "dismissed" |
| `reviewedBy` | string | ❌ | Admin user ID |
| `reviewNotes` | string | ❌ | Admin notes |
| `createdAt` | Timestamp | ✅ | Report time |
| `reviewedAt` | Timestamp | ❌ | Review time |
| `resolvedAt` | Timestamp | ❌ | Resolution time |

**Report Reasons:**
- `spam` - Spam content
- `harassment` - Harassment or bullying
- `hate_speech` - Hate speech
- `violence` - Violence or threats
- `nudity` - Nudity or sexual content
- `other` - Other reason

---

## 📊 Analytics Collection

### `analytics/{analyticsId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `analyticsId` | string | ✅ | Analytics ID |
| `type` | string | ✅ | "post" \| "story" \| "profile" |
| `referenceId` | string | ✅ | Post/story/user ID |
| `date` | string | ✅ | Date in YYYY-MM-DD format |
| `views` | number | ✅ | View count |
| `likes` | number | ✅ | Like count |
| `comments` | number | ✅ | Comment count |
| `shares` | number | ✅ | Share count |
| `saves` | number | ✅ | Save count |
| `reach` | number | ✅ | Unique viewers |
| `engagement` | number | ✅ | Total interactions |
| `viewersByGender` | object | ❌ | Gender breakdown |
| `viewersByAge` | object | ❌ | Age range breakdown |
| `viewersByLocation` | object | ❌ | Location breakdown |
| `createdAt` | Timestamp | ✅ | Creation time |
| `updatedAt` | Timestamp | ✅ | Last update time |
