# Iris App - Feature Roadmap & Optional Enhancements

## 📊 Current Status

### ✅ **Completed Core Features (26 items)**
All essential UI/UX components and screens are complete and production-ready.

### 🔄 **Optional/Advanced Features (30 items)**
Backend integration required for full functionality.

---

## 🎨 1. Post & Glimpse Editing (Advanced)

### Image Filters & Editing
- [ ] **Brightness, Contrast, Saturation filters**
  - Range sliders for each filter
  - Real-time preview
  - Reset to original button
  - Apply/Cancel actions

- [ ] **Crop & Rotate Tools**
  - Crop with aspect ratio options (1:1, 4:5, 16:9)
  - Free-form crop
  - 90° rotation buttons
  - Free rotation with degree input
  - Flip horizontal/vertical

- [ ] **Zoom & Pan**
  - Pinch to zoom
  - Drag to pan
  - Zoom slider (1x to 10x)
  - Fit to screen button

### Glimpse Enhancements
- [ ] **Stickers & GIFs**
  - Sticker library (emojis, reactions, custom)
  - GIF search integration (Giphy/Tenor)
  - Drag to position, pinch to resize
  - Rotation handle
  - Layer management (bring forward/back)

- [ ] **Text Overlay**
  - Multiple text boxes
  - Font selection (5-10 fonts)
  - Color picker
  - Text size slider
  - Alignment options (left/center/right)
  - Background color/opacity
  - Stroke/outline options

### Content Management
- [ ] **@ Mention Tagging**
  - Search users while typing @
  - Autocomplete dropdown
  - Tagged users list below post
  - Clickable tags to user profile
  - Tag removal option

- [ ] **Draft Saving**
  - Auto-save every 30 seconds
  - Manual save draft button
  - Drafts list page
  - Draft preview thumbnails
  - Delete draft option
  - Resume editing from draft

**Priority:** Medium  
**Backend Required:** Image processing API, Storage, User search API

---

## 📖 2. Stories / Glimpses Advanced Features

### Auto-Navigation
- [ ] **Auto-Swipe Stories**
  - Timer-based auto-advance (5-7 seconds)
  - Progress bar at top
  - Pause on tap and hold
  - Resume on release
  - Skip to next on swipe up
  - Previous on swipe down

### Analytics & Insights
- [ ] **Story Analytics**
  - View count with viewer list
  - Reach metrics
  - Engagement rate
  - Link clicks (if story has links)
  - Time spent viewing
  - Export analytics as CSV

### Story Highlights
- [ ] **Highlight Management**
  - Create new highlight from stories
  - Edit highlight cover image
  - Rename highlight
  - Reorder stories within highlight
  - Delete individual stories from highlight
  - Delete entire highlight

### Interactions
- [ ] **Reply to Stories**
  - Reply button below story
  - Opens DM with story context
  - Story preview in DM
  - Quick emoji reactions
  - Auto-notify story owner

**Priority:** Medium-Low  
**Backend Required:** Analytics service, Real-time updates, Storage

---

## 💬 3. Comments Section Enhancements

### Comment Management
- [ ] **Pin Comment** (Owner Only)
  - Pin icon on hover
  - Maximum 1 pinned comment
  - "Pinned by creator" label
  - Unpin option

- [ ] **Delete Comment**
  - Delete own comments (any user)
  - Delete any comment (post owner)
  - Confirmation dialog
  - Soft delete (can be restored within 24h)

### Comment Interactions
- [ ] **Like Comments**
  - Heart icon next to comment
  - Like count display
  - Fill animation on like
  - Unlike on double-tap
  - Liked by list (on count click)

- [ ] **@ Mention in Comments**
  - Autocomplete user search
  - Blue highlighted mention text
  - Clickable to user profile
  - Notification to mentioned user
  - Multiple mentions per comment

**Priority:** Medium  
**Backend Required:** Comment API, User search, Notifications

---

## 💬 4. Chat / Messaging Advanced Features

### Message Management
- [ ] **Forward Messages**
  - Long-press to select message
  - Forward button
  - Multi-select for bulk forward
  - Choose recipient(s)
  - Forward confirmation
  - "Forwarded" label on message

- [ ] **Reply to Specific Message**
  - Swipe right to reply (iOS style)
  - Click reply icon
  - Shows quoted message above input
  - Cancel reply option
  - Jump to original message on tap

### Real-Time Indicators
- [ ] **Typing Indicators**
  - "User is typing..." text
  - Animated dots (already implemented in UI)
  - WebSocket for real-time updates
  - Multiple users typing support

- [ ] **Message Status**
  - Sent (single checkmark)
  - Delivered (double checkmark)
  - Read (double checkmark, blue/primary color)
  - Failed (red exclamation)
  - Retry option for failed messages

### Rich Media
- [ ] **Stickers & GIFs**
  - Sticker panel (already has UI button)
  - Sticker packs (free & premium)
  - GIF search
  - Recent stickers/GIFs
  - Favorite stickers

- [ ] **Emoji Reactions** (Partially done)
  - Full emoji picker integration
  - Quick reactions on long-press
  - Multiple reactions per message
  - Reaction count
  - See who reacted

**Priority:** Medium-High  
**Backend Required:** WebSocket, Message queue, Real-time database

---

## 🔔 5. Notifications System

### Push Notifications
- [ ] **Push Notification Service**
  - Like notifications
  - Comment notifications
  - Follow notifications
  - Mention notifications
  - DM notifications
  - Story view notifications
  - Firebase Cloud Messaging integration

### Notification Center
- [ ] **Real-Time Updates**
  - WebSocket connection
  - Live notification badge
  - Sound/vibration on new notification
  - Auto-refresh notification list
  - Mark as read on view
  - Mark all as read option

### Notification Settings
- [ ] **Mute Notifications**
  - Mute specific users
  - Mute specific posts
  - Mute for time period (1h, 8h, 24h, forever)
  - Mute notification types
  - Do Not Disturb mode
  - Scheduled quiet hours

**Priority:** High  
**Backend Required:** FCM/Push service, WebSocket, Notification API

---

## 👤 6. Profile Enhancements

### Content Organization
- [ ] **Follower/Following Sorting**
  - Sort by: Name (A-Z), Recently followed, Mutual friends
  - Search within followers/following
  - Filter by verified accounts
  - Remove follower option
  - Bulk actions (select multiple)

### Bio & Profile
- [ ] **Rich Text Bio**
  - Emoji picker in bio editor
  - Clickable links (auto-detect URLs)
  - Bold/italic formatting (markdown-style)
  - Character limit (150-200 chars)
  - Link preview
  - @mention support in bio

### Saved Content
- [ ] **Saved Posts Collections**
  - Create collections (e.g., "Travel", "Food", "Inspiration")
  - Add posts to collections
  - Collection cover images
  - Private collections (only visible to user)
  - Share collection option
  - Reorder posts within collection
  - Collection search

**Priority:** Medium-Low  
**Backend Required:** Collections API, Storage, Search indexing

---

## 🔍 7. Search / Explore Enhancements

### Advanced Filters
- [ ] **Media Type Filter**
  - All posts (default)
  - Photos only
  - Videos only
  - Glimpses/Reels only
  - Filter toggle buttons
  - Combined filters

### Music & Audio
- [ ] **Trending Music Search**
  - Music library integration
  - Search by song name, artist
  - Trending sounds/music
  - "Use this sound" button
  - Songs used count
  - Preview audio before using

### Location Features
- [ ] **Location-Based Search**
  - Search by city, place, landmark
  - Map view of posts
  - Nearby posts (GPS-based)
  - Location autocomplete
  - Popular locations
  - Check-in to location

### People Discovery
- [ ] **Mutual Followers Suggestions**
  - "People you may know" section (already exists)
  - Based on mutual followers
  - Based on contacts (with permission)
  - Based on interests/hashtags
  - Dismiss suggestion option
  - "See all" suggestions page (already implemented)

**Priority:** Medium  
**Backend Required:** Search indexing, Music API, Location API, Recommendation engine

---

## 🔒 8. Settings / Privacy Advanced

### Security
- [ ] **Two-Factor Authentication (2FA)**
  - SMS-based 2FA
  - Authenticator app support (Google Authenticator, Authy)
  - Backup codes generation
  - 2FA setup wizard
  - Trusted devices list
  - Require 2FA on login from new device

### Privacy Controls
- [ ] **Blocked Users Management**
  - Blocked users list page
  - Unblock option
  - Block confirmation dialog
  - Blocked users can't see profile
  - Blocked users can't message
  - Report + Block option

- [ ] **Online Status Settings**
  - Hide last seen (per user or globally)
  - Hide online status
  - Show to: Everyone / Contacts / Nobody
  - Show to specific users only
  - Hide typing indicators
  - Hide read receipts

### Account Activity
- [ ] **Activity Log**
  - Login history (date, time, device, location)
  - Active sessions list
  - Logout from specific device
  - Logout from all devices
  - Suspicious activity alerts
  - Login notifications
  - Device management (trusted/untrusted)

**Priority:** High (Security features)  
**Backend Required:** Auth service, Session management, Activity tracking

---

## 🚀 Implementation Priority

### **Phase 1 - High Priority (Backend Critical)**
1. Push Notifications system
2. Two-Factor Authentication (2FA)
3. Real-time messaging indicators
4. Comment like & management features

### **Phase 2 - Medium Priority (Enhanced UX)**
1. Image filters & editing tools
2. Reply to messages (quote style)
3. Saved posts collections
4. Blocked users management
5. Media type filters in Explore

### **Phase 3 - Low Priority (Nice-to-Have)**
1. Stickers & GIFs for posts/messages
2. Story analytics
3. Location-based search
4. Trending music search
5. Rich text bio
6. Forward messages
7. Draft saving

---

## 📋 Technical Requirements

### Backend APIs Needed
- **Authentication:** Login, Signup, 2FA, Session management
- **Posts:** CRUD, Like, Save, Comment, Share
- **Users:** Profile, Follow, Search, Suggestions
- **Messages:** Send, Receive, Status, Typing indicators
- **Notifications:** Push service, Real-time updates
- **Media:** Upload, Processing, Filters, Storage
- **Search:** Full-text search, Filters, Autocomplete
- **Analytics:** Story views, Engagement metrics

### Third-Party Services
- **Firebase:** Authentication, Cloud Messaging (FCM), Realtime Database
- **Supabase:** Media storage (as per user rules)
- **WebSocket:** Real-time features (Socket.io or native WebSocket)
- **Image Processing:** Sharp, ImageMagick, or cloud-based (Cloudinary)
- **Music API:** Spotify API, SoundCloud, or custom library
- **Maps:** Google Maps API, Mapbox for location features
- **Analytics:** Google Analytics, Mixpanel, or custom solution

### State Management
- Consider Redux or Zustand for complex state
- React Query for API data fetching/caching
- Context API for theme, auth state

---

## 📝 Notes

- All UI components for basic functionality are **already implemented**
- Advanced features require **backend integration**
- Most features need **real-time** capabilities (WebSocket recommended)
- **Security** features should be prioritized
- **Performance optimization** needed for media processing
- **Testing** required for all new features (unit, integration, E2E)
- **Documentation** should be updated as features are implemented

---

## ✅ Completed Features (Reference)

See `IRIS_UI_IMPROVEMENTS.md` for detailed documentation of all completed features including:
- 15+ screens with modern UI
- Dark/Light theme system
- Instagram-style chat interface
- Advanced comment system with nested replies
- Profile with verification badges & highlights
- Comprehensive settings (40+ options)
- Glimpses with swipe navigation
- FAB integration
- Follow suggestions
- Message reactions (UI ready)
- And more...

---

**Last Updated:** 2025-10-09  
**Status:** Core UI Complete, Backend Integration Pending
