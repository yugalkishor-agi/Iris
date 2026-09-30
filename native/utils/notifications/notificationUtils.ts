import { AppNotification, AppNotificationType, NotificationActor, NotificationGroup } from '../../hooks/notifications/notificationTypes';

export function normalizeTime(value: any): number {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (value?.seconds) return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function getBucketMeta(timestamp: any): { key: string; title: string; order: number } {
  const createdAt = new Date(normalizeTime(timestamp));
  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const createdDayStart = startOfLocalDay(createdAt);
  const diffDays = Math.floor((todayStart - createdDayStart) / 86400000);

  if (diffDays <= 0) {
    return { key: 'today', title: 'Today', order: todayStart };
  }

  if (diffDays === 1) {
    return { key: 'yesterday', title: 'Yesterday', order: todayStart - 86400000 };
  }

  if (diffDays < 7) {
    return { key: 'this-week', title: 'This week', order: todayStart - diffDays * 86400000 };
  }

  const monthDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), 1);
  const isCurrentYear = monthDate.getFullYear() === now.getFullYear();
  const title = monthDate.toLocaleDateString('en-US', {
    month: 'long',
    ...(isCurrentYear ? {} : { year: 'numeric' }),
  });

  return {
    key: `month-${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`,
    title,
    order: monthDate.getTime(),
  };
}

export function formatNotificationTime(timestamp: any): string {
  const now = Date.now();
  const value = normalizeTime(timestamp);
  const diffMinutes = Math.floor((now - value) / 60000);

  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w`;

  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getNotificationIcon(type: AppNotificationType) {
  switch (type) {
    case 'like':
    case 'story_like':
      return 'heart';
    case 'comment':
      return 'chatbubble';
    case 'follow':
    case 'follow_request':
      return 'person-add';
    case 'mention':
      return 'at';
    case 'collaboration_request':
      return 'sparkles';
    case 'story_view':
      return 'eye';
    case 'story_reply':
      return 'paper-plane';
    default:
      return 'notifications';
  }
}

export function getNotificationTone(type: AppNotificationType) {
  switch (type) {
    case 'like':
    case 'story_like':
      return '#FF375F';
    case 'comment':
      return '#4DA3FF';
    case 'follow':
    case 'follow_request':
      return '#60A5FA';
    case 'mention':
      return '#F59E0B';
    case 'collaboration_request':
      return '#A78BFA';
    case 'story_view':
      return '#34D399';
    case 'story_reply':
      return '#22C55E';
    default:
      return '#8E8E93';
  }
}

export function buildAggregationKey(notification: AppNotification): string {
  const primaryTarget = notification.refId || notification.postId || notification.glimpseId || '';
  const commentTarget = notification.targetCommentId || notification.parentCommentId || notification.commentId || '';

  switch (notification.type) {
    case 'like':
    case 'story_like':
      return [notification.type, notification.refType || '', primaryTarget, commentTarget].join(':');
    case 'comment': {
      const replyScope = notification.parentCommentId || notification.targetCommentId ? 'reply' : 'comment';
      return [notification.type, notification.refType || '', primaryTarget, commentTarget, replyScope].join(':');
    }
    case 'mention':
      return [notification.type, notification.refType || '', primaryTarget, commentTarget].join(':');
    case 'follow':
    case 'follow_request':
      return [notification.type, notification.actorId].join(':');
    case 'collaboration_request':
      return [notification.type, notification.requestId || '', primaryTarget].join(':');
    case 'story_view':
    case 'story_reply':
      return [notification.type, primaryTarget, commentTarget].join(':');
    default:
      return [notification.type, notification.notificationId].join(':');
  }
}

export function buildGroupActors(notifications: AppNotification[]): NotificationActor[] {
  const seen = new Set<string>();
  const actors: NotificationActor[] = [];

  notifications.forEach((notification) => {
    if (!notification.actorId || seen.has(notification.actorId)) return;
    seen.add(notification.actorId);
    actors.push({
      userId: notification.actorId,
      username: notification.actorUsername,
      avatarURL: notification.actorAvatarURL,
      verified: notification.actorVerified,
    });
  });

  return actors.slice(0, 3);
}

export function getActorHeadline(actors: NotificationActor[], totalCount: number) {
  if (actors.length === 0) return 'Someone';
  if (totalCount <= 1 || actors.length === 1) return actors[0].username;
  if (totalCount === 2 && actors.length >= 2) return `${actors[0].username} and ${actors[1].username}`;
  if (actors.length >= 2) return `${actors[0].username}, ${actors[1].username} and ${Math.max(totalCount - 2, 1)} others`;
  return actors[0].username;
}

export function extractPreviewSnippet(notification: AppNotification): string | null {
  const raw = (notification.previewText || notification.message || '').trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  if (lower.startsWith('commented:')) return raw.slice(10).trim() || null;
  if (lower.startsWith('replied to your comment:')) return raw.slice(24).trim() || null;
  if (lower.startsWith('replied:')) return raw.slice(8).trim() || null;
  if (lower === 'commented on your post' || lower === 'liked your post') return null;
  if (lower === 'liked your comment' || lower === 'replied to your comment') return null;
  return raw;
}

export function buildGroupBodyWithPreview(suffix: string, preview: string | null): { suffix: string; preview: string | null } {
  if (!preview) return { suffix, preview: null };
  const compact = preview.trim();
  if (!compact) return { suffix, preview: null };
  if (compact.toLowerCase() === suffix.trim().toLowerCase()) {
    return { suffix, preview: null };
  }
  return { suffix, preview: compact };
}

export function sanitizePreviewImageURL(value: unknown): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === 'null' || lower === 'undefined') return null;
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('file://') || raw.startsWith('content://')) {
    return raw;
  }
  return null;
}

export function getGroupBody(group: NotificationGroup): { suffix: string; preview: string | null } {
  const latest = group.latestNotification;
  const preview = extractPreviewSnippet(latest);

  switch (latest.type) {
    case 'like':
      if (latest.commentId || latest.parentCommentId || latest.targetCommentId || latest.refType === 'comment') {
        return buildGroupBodyWithPreview('liked your comment', preview);
      }
      if (latest.refType === 'glimpse') return buildGroupBodyWithPreview('liked your glimpse', preview);
      if (latest.refType === 'story') return buildGroupBodyWithPreview('liked your story', preview);
      return buildGroupBodyWithPreview('liked your post', preview);
    case 'comment':
      if (latest.parentCommentId || latest.targetCommentId || (latest.message || '').toLowerCase().includes('replied')) {
        return buildGroupBodyWithPreview('replied to your comment', preview);
      }
      if (latest.refType === 'glimpse') return buildGroupBodyWithPreview('commented on your glimpse', preview);
      return buildGroupBodyWithPreview('commented on your post', preview);
    case 'follow':
      return { suffix: 'started following you', preview: null };
    case 'mention':
      if (latest.refType === 'comment') return buildGroupBodyWithPreview('mentioned you in a comment', preview);
      if (latest.refType === 'glimpse') return buildGroupBodyWithPreview('mentioned you in a glimpse', preview);
      if (latest.refType === 'story') return buildGroupBodyWithPreview('mentioned you in a story', preview);
      return buildGroupBodyWithPreview('mentioned you in a post', preview);
    case 'story_view':
      return { suffix: 'viewed your story', preview: null };
    case 'story_reply':
      return buildGroupBodyWithPreview('replied to your story', preview);
    case 'story_like':
      return { suffix: 'liked your story', preview: null };
    case 'collaboration_request':
      return buildGroupBodyWithPreview(latest.refType === 'glimpse' ? 'wants to collaborate on your glimpse' : 'wants to collaborate on your post', preview);
    case 'follow_request':
      return { suffix: 'requested to follow you', preview: null };
    default:
      return buildGroupBodyWithPreview(latest.message || 'sent you an update', preview);
  }
}

export function shouldOpenCommentThread(notification: AppNotification) {
  if (notification.type === 'comment') return !!notification.refId;
  if (notification.type === 'like') return !!notification.commentId || !!notification.parentCommentId || !!notification.targetCommentId;
  if (notification.type === 'mention' && notification.refType === 'comment') return !!notification.refId;
  return false;
}
