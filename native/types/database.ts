import { Timestamp } from 'firebase/firestore';

// ==========================================
// USER TYPES
// ==========================================

export interface User {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  avatarURL?: string;
  bio?: string;
  website?: string;
  location?: string;
  phoneNumber?: string;
  phone?: string; // Alias for phoneNumber
  birthday?: Timestamp | string | Date;
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
  appLanguage?: string; // App language preference
  accentColor?: string; // Custom accent color
  timeFormat?: '12h' | '24h'; // Time format preference
  dateFormat?: string; // Date format preference
  experimentalFeatures?: boolean; // Enable experimental features
  notificationsEnabled: boolean;
  showOnlineStatus: boolean;
  allowMessageRequests: boolean;
}

export interface Follower {
  userId: string;
  followedAt: Timestamp;
  isCloseFriend: boolean;
}

export interface Following {
  userId: string;
  followedAt: Timestamp;
  notificationsEnabled: boolean;
}

// ==========================================
// POST TYPES
// ==========================================

export interface Post {
  postId: string;
  postType: 'image' | 'video' | 'carousel' | 'text';
  authorId: string;
  authorUsername: string;
  authorAvatarURL: string;
  authorVerified?: boolean;
  caption?: string;
  mediaURLs: string[];
  mediaType: 'image' | 'video';
  thumbnailURL?: string;
  aspectRatio: number;
  location?: string;
  tags: string[];
  mentions: string[];
  taggedUsers: Array<{
    userId: string;
    username: string;
    x: number;
    y: number;
  }>;
  collaborators?: Array<{
    userId: string;
    username: string;
    avatarURL?: string;
  }>;
  altText?: string;
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

export interface Like {
  userId: string;
  likedAt: Timestamp;
}

export interface Comment {
  commentId: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorAvatarURL: string;
  authorVerified?: boolean;
  text: string;
  parentCommentId?: string; // If this is a reply, ID of parent comment
  mentions: string[];
  likesCount: number;
  repliesCount: number;
  isPinned: boolean;
  isEdited: boolean;
  likedByAuthor?: boolean; // True if post author liked this comment
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Reply {
  replyId: string;
  parentCommentId: string;
  authorId: string;
  authorUsername: string;
  authorAvatarURL: string;
  text: string;
  mentions: string[];
  likesCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==========================================
// STORY TYPES
// ==========================================

export interface Story {
  storyId: string;
  authorId: string;
  authorUsername: string;
  authorAvatarURL: string;
  authorVerified?: boolean;
  mediaURL: string;
  mediaType: 'image' | 'video';
  duration: number;
  thumbnailURL?: string;
  coverImageURL?: string; // Cover image for glimpses (both images and videos)
  textOverlay?: TextOverlay;
  backgroundMusic?: {
    trackId: string;
    trackTitle: string;
    artistName: string;
    coverArtURL?: string;
    clipStart: number;
    clipEnd: number;
    customAudio?: boolean;
    customAudioUrl?: string;
  };
  audience: 'public' | 'followers' | 'closeFriends';
  allowReplies: boolean;
  allowSharing: boolean;
  hiddenFrom: string[];
  viewsCount: number;
  likesCount: number;
  repliesCount: number;
  stats?: {
    viewsCount: number;
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
  };
  caption?: string;
  mentions?: string[];
  tags?: string[];
  taggedUsers?: Array<{ userId: string; username: string }>;
  collaborators?: Array<{
    userId: string;
    username: string;
    avatarURL: string;
    status: 'pending' | 'accepted';
    addedAt: Timestamp;
  }>;
  // Repost fields
  isRepost?: boolean;
  repostOf?: string; // Original story ID
  originalAuthorId?: string;
  originalAuthorUsername?: string;
  originalAuthorVerified?: boolean;
  originalMediaURL?: string;
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

export interface Highlight {
  highlightId: string;
  userId: string;
  name: string; // Internal name for management
  title: string; // Display title shown below circle in profile
  coverImageURL: string;
  storiesCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==========================================
// MESSAGE TYPES
// ==========================================

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
  mutedBy?: string[];
  pinnedBy?: string[];
  deletedBy?: string[];
  restrictedBy?: string[]; // Users who moved this chat to requests (messages won't show "seen")
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
  type?: 'text' | 'media' | 'shared_post' | 'shared_glimpse' | 'shared_story' | 'story_reply' | 'glimpse_collab_request';
  text?: string;
  mediaURL?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'file';
  thumbnailURL?: string;
  replyToMessageId?: string;
  replyToText?: string;
  replyTo?: {
    messageId: string;
    text: string;
    senderId: string;
    senderUsername: string;
  };
  reactions?: { [userId: string]: string };
  storyReply?: {
    storyId: string;
    mediaURL: string;
    authorUsername: string;
    authorAvatar?: string;
    authorVerified?: boolean;
  };
  sharedContent?: {
    type: 'post' | 'glimpse' | 'story';
    id: string;
    authorId: string;
    authorUsername: string;
    authorAvatarURL: string;
    coverImageURL: string;
    caption?: string;
    mediaType?: 'image' | 'video';
  };
  // Collab request metadata
  glimpseId?: string;
  glimpseMediaURL?: string;
  glimpseCaption?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'pending' | 'accepted' | 'rejected';
  readBy?: string[];
  isForwarded?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  deliveredAt?: Timestamp;
  readAt?: Timestamp;
  isRead?: boolean;
  acceptedAt?: Timestamp;
  rejectedAt?: Timestamp;
}

// ==========================================
// NOTIFICATION TYPES
// ==========================================

export interface Notification {
  notificationId: string;
  userId: string;
  type: NotificationType;
  actorId: string;
  actorUsername: string;
  actorAvatarURL: string;
  actorVerified?: boolean;
  refType: 'post' | 'comment' | 'story' | 'message';
  refId: string;
  refPreview?: string;
  refMediaURL?: string;
  isRead: boolean;
  createdAt: Timestamp;
  readAt?: Timestamp;
  // For aggregated story likes
  storyId?: string;
  likersData?: Array<{
    userId: string;
    username: string;
    avatarURL: string;
    verified?: boolean;
    likedAt: Timestamp;
  }>;
  totalLikesCount?: number;
  // For collaboration requests
  postId?: string;
  glimpseId?: string;
  requestId?: string;
}

export type NotificationType =
  | 'like'
  | 'comment'
  | 'comment_reply'
  | 'comment_like'
  | 'follow'
  | 'follow_request'
  | 'mention'
  | 'dm'
  | 'story_view'
  | 'story_reply'
  | 'story_like'
  | 'collaboration_request';

// ==========================================
// REPORT TYPES
// ==========================================

export interface Report {
  reportId: string;
  reporterId: string;
  targetType: 'user' | 'post' | 'comment' | 'story' | 'message';
  targetId: string;
  targetUserId: string;
  reason: ReportReason;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  resolvedAt?: Timestamp;
}

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'nudity'
  | 'other';

// ==========================================
// ANALYTICS TYPES
// ==========================================

export interface Analytics {
  analyticsId: string;
  type: 'post' | 'story' | 'profile';
  referenceId: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  engagement: number;
  viewersByGender?: { male: number; female: number; other: number };
  viewersByAge?: { [ageRange: string]: number };
  viewersByLocation?: { [country: string]: number };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==========================================
// COLLECTION TYPES
// ==========================================

export interface Collection {
  collectionId: string;
  userId: string;
  name: string;
  description?: string;
  coverImage?: string;
  isPrivate: boolean;
  postCount: number;
  postIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CollectionPost {
  postId: string;
  collectionId: string;
  savedAt: Timestamp;
}

// ==========================================
// HELPER TYPES
// ==========================================

export interface CreateUserData {
  username: string;
  email: string;
  displayName: string;
  avatarURL?: string;
  bio?: string;
}

export interface CreatePostData {
  authorId: string;
  authorUsername: string;
  authorAvatarURL: string;
  caption?: string;
  mediaURLs: string[];
  mediaType: 'image' | 'video';
  postType: 'image' | 'video' | 'carousel' | 'text';
  thumbnailURL?: string;
  aspectRatio: number;
  location?: string;
  tags?: string[];
  mentions?: string[];
  taggedUsers?: Array<{
    userId: string;
    username: string;
    x: number;
    y: number;
  }>;
  altText?: string;
}

export interface CreateMessageData {
  senderId: string;
  senderUsername: string;
  senderAvatarURL?: string;
  text?: string;
  type?: 'text' | 'shared_post' | 'shared_glimpse' | 'shared_story' | 'story_reply' | 'glimpse_collab_request';
  mediaURL?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'file';
  thumbnailURL?: string;
  replyToMessageId?: string;
  replyToText?: string;
  storyReply?: {
    storyId: string;
    mediaURL: string;
    authorUsername: string;
    authorAvatar?: string;
    authorVerified?: boolean;
  };
  sharedContent?: any;
  glimpseId?: string;
  status?: string;
}
