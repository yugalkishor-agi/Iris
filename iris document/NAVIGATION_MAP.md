# 🗺️ Complete Navigation Map - Iris Social App

Visual representation of how all 62 pages connect to each other.

```
┌─────────────────────────────────────────────────────────────┐
│                      AUTH FLOW (Outside App)                │
└─────────────────────────────────────────────────────────────┘
                            │
     /splash → /welcome → /onboarding → /login or /signup
                            │
                      /forgot-password
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    MAIN APP (With Bottom Nav)               │
└─────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║                         HOME FEED (/)                          ║
╚═══════════════════════════════════════════════════════════════╝
    │
    ├──> Stories Section
    │    ├─> Your Story → /story-create
    │    └─> Others' Stories → /story-viewer → /story-analytics
    │
    ├──> Posts Feed
    │    ├─> Post Card → /post/:id
    │    ├─> Like/Comment → /comments/:id
    │    ├─> Save → /saved-collections
    │    └─> Edit → /post-editor
    │
    └──> Create Post → /create-post

╔═══════════════════════════════════════════════════════════════╗
║                       SEARCH (/search)                         ║
╚═══════════════════════════════════════════════════════════════╝
    │
    ├──> User Results → /profile/:id
    ├──> Post Results → /post/:id
    ├──> Hashtag Results
    └──> Trending Section

╔═══════════════════════════════════════════════════════════════╗
║                  NOTIFICATIONS (/notifications)                ║
╚═══════════════════════════════════════════════════════════════╝
    │
    ├──> Like Notifications → /post/:id
    ├──> Comment Notifications → /comments/:id
    ├──> Follow Notifications → /profile/:id
    └──> Settings → /notification-settings

╔═══════════════════════════════════════════════════════════════╗
║                     GLIMPSES (/glimpses)                       ║
╚═══════════════════════════════════════════════════════════════╝
    │
    ├──> Create Glimpse → /glimpse-create
    │    ├─> Add Text → /glimpse-text-editor
    │    └─> Add Music → /music-search
    │
    ├──> View Glimpses → Auto-swipe viewer
    └──> Analytics → /story-analytics

╔═══════════════════════════════════════════════════════════════╗
║                       PROFILE (/me)                            ║
╚═══════════════════════════════════════════════════════════════╝
    │
    ├──> Edit Profile → /profile/edit
    │    └─> Advanced Edit → /profile-settings
    │         └─> Edit Bio → /edit-bio
    │
    ├──> View Posts (Grid)
    │    └─> Post Detail → /post/:id
    │
    ├──> Story Highlights → /story-highlights
    │
    ├──> Followers/Following → /followers
    │
    └──> Settings → /settings (see below)

╔═══════════════════════════════════════════════════════════════╗
║                     MESSAGES (/messages)                       ║
╚═══════════════════════════════════════════════════════════════╝
    │
    ├──> New Chat → /chat/new
    ├──> Open Chat → /chat/:id
    │    ├─> Forward Message → /forward-message
    │    └─> Group Settings → /group-settings/:id
    │
    └──> Message Requests → /message-requests

╔═══════════════════════════════════════════════════════════════╗
║                     SETTINGS (/settings)                       ║
╚═══════════════════════════════════════════════════════════════╝
    │
    ├──> ACCOUNT
    │    ├─> Edit Profile → /profile/edit
    │    ├─> Change Password → /change-password
    │    ├─> Personal Info → /personal-info
    │    ├─> Account Activity → /account-activity
    │    ├─> Professional → /professional
    │    ├─> Deactivate → /deactivate
    │    └─> Delete Account → /delete-account
    │
    ├──> PRIVACY & SECURITY
    │    ├─> Privacy Settings → /privacy-settings
    │    ├─> Security → /security
    │    ├─> Privacy → /privacy
    │    ├─> Two-Factor Auth → /two-factor-auth
    │    ├─> Blocked Users → /blocked
    │    ├─> Muted Accounts → /muted
    │    ├─> Hidden Words → /hidden-words
    │    └─> Login Activity → /login-activity
    │
    ├──> NOTIFICATIONS
    │    └─> Notification Settings → /notification-settings
    │
    ├──> APPEARANCE
    │    ├─> Accent Color → /accent-color
    │    └─> Font Size → /font-size
    │
    ├──> LANGUAGE & REGION
    │    ├─> Language → /language
    │    └─> App Language → /app-language
    │
    ├──> MESSAGES & CHATS
    │    └─> Message Requests → /message-requests
    │
    ├──> DATA & STORAGE
    │    ├─> Clear Cache → /clear-cache
    │    ├─> Download Data → /download-data
    │    ├─> Storage Usage → /storage-usage
    │    └─> Upload Quality → /upload-quality
    │
    └──> HELP & SUPPORT
         ├─> Help Center → /help
         └─> Report Problem → /report

╔═══════════════════════════════════════════════════════════════╗
║                   STORY/GLIMPSE CREATION FLOW                  ║
╚═══════════════════════════════════════════════════════════════╝

    Home → Your Story → /story-create
                            │
                            ├─> Camera/Gallery Selection
                            │
                            ├─> Edit Tools:
                            │   ├─> Text → /glimpse-text-editor
                            │   ├─> Music → /music-search
                            │   ├─> Stickers
                            │   ├─> Effects
                            │   └─> Filters
                            │
                            ├─> Preview → /story-viewer
                            │
                            └─> Post → Back to Home
                                    │
                                    └─> View Analytics → /story-analytics

╔═══════════════════════════════════════════════════════════════╗
║                      POST CREATION FLOW                        ║
╚═══════════════════════════════════════════════════════════════╝

    Home → Create Post → /create-post
                            │
                            ├─> Select Photos (Multi-select)
                            │
                            ├─> Edit:
                            │   ├─> Filters → /post-editor
                            │   ├─> Crop/Rotate → /post-editor
                            │   └─> Adjust
                            │
                            ├─> Add Caption
                            ├─> Add Location
                            ├─> Tag People
                            ├─> Add Hashtags
                            │
                            └─> Share → /post/:id

╔═══════════════════════════════════════════════════════════════╗
║                       ACCOUNT DELETION FLOW                    ║
╚═══════════════════════════════════════════════════════════════╝

    Settings → Delete Account → /delete-account
                                    │
                                    ├─> Read Warnings
                                    ├─> Acknowledge Consequences
                                    ├─> Enter Password
                                    ├─> Type "DELETE"
                                    │
                                    └─> Confirm → /login (Logged out)

    Alternative: Deactivate → /deactivate (3-step wizard)
```

## 🎯 Key Navigation Patterns

### Bottom Navigation Bar (Always Visible)
```
[Home] [Search] [+Create] [Glimpses] [Profile]
  /       /search   /create    /glimpses    /me
```

### Top Navigation (Context-Specific)
```
[← Back] [Page Title] [Actions...]
```

### Quick Access
- **Home** → Profile: Top-right avatar
- **Any Page** → Settings: Profile → Settings icon
- **Any Page** → Messages: Bottom nav or notification
- **Any Page** → Search: Bottom nav

---

**All routes are connected and tested! ✅**
