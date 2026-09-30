export interface ActivityItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'story_view' | 'glimpse_like';
  user: {
    userId: string;
    username: string;
    displayName: string;
    avatarURL?: string;
  };
  content?: {
    id: string;
    type: 'post' | 'glimpse' | 'story';
    mediaURL?: string;
    caption?: string;
  };
  timestamp: any;
  isRead: boolean;
}

export type ActivityFilter = 'all' | 'unread';
