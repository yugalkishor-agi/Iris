export type AppNotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'follow_request'
  | 'mention'
  | 'story_view'
  | 'story_reply'
  | 'story_like'
  | 'collaboration_request'
  | 'dm';

export type FilterTab = 'all' | 'comments';
export type NotificationRefType = 'post' | 'glimpse' | 'story' | 'comment' | 'message' | 'user';

export interface AppNotification {
  notificationId: string;
  type: AppNotificationType;
  actorId: string;
  actorUsername: string;
  actorAvatarURL?: string;
  actorVerified?: boolean;
  message?: string;
  previewText?: string;
  createdAt: any;
  isRead: boolean;
  postId?: string;
  postImageURL?: string;
  requestId?: string;
  glimpseId?: string;
  refType?: NotificationRefType;
  refId?: string;
  commentId?: string;
  parentCommentId?: string;
  targetCommentId?: string;
}

export interface NotificationActor {
  userId: string;
  username: string;
  avatarURL?: string;
  verified?: boolean;
}

export interface NotificationGroup {
  key: string;
  bucketKey: string;
  bucketTitle: string;
  type: AppNotificationType;
  refType?: NotificationRefType;
  refId?: string;
  latestNotification: AppNotification;
  notifications: AppNotification[];
  actors: NotificationActor[];
  totalCount: number;
  isRead: boolean;
}

export type FeedItem =
  | { kind: 'header'; key: string; title: string }
  | { kind: 'group'; key: string; group: NotificationGroup };
