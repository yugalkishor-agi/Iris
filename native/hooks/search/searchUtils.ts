import { SearchUser } from './searchTypes';

export function formatCompactCount(value?: number) {
  const count = Number(value || 0);
  if (count < 1000) return String(count);
  if (count < 1000000) {
    const short = (count / 1000).toFixed(count >= 100000 ? 0 : 1);
    return `${short.replace(/\.0$/, '')}K`;
  }
  const short = (count / 1000000).toFixed(count >= 10000000 ? 0 : 1);
  return `${short.replace(/\.0$/, '')}M`;
}

export function isImagePreviewUri(value: any) {
  const uri = String(value || '').trim();
  if (!uri) return false;
  if (/^data:image\//i.test(uri)) return true;
  return /\.(jpg|jpeg|png|webp|gif|avif)(\?|#|$)/i.test(uri);
}

export function getGlimpsePreview(item: any) {
  const candidates = [
    item?.previewURL,
    item?.coverImageURL,
    item?.coverImageUrl,
    item?.thumbnailURL,
    item?.thumbnailUrl,
    item?.mediaThumbnailURL,
    item?.mediaThumbnailUrl,
    item?.posterURL,
    item?.posterUrl,
    item?.coverURL,
    item?.coverUrl,
    item?.previewImageURL,
    item?.previewImageUrl,
    Array.isArray(item?.mediaURLs) ? item.mediaURLs.find((entry: any) => isImagePreviewUri(entry)) : '',
  ];

  return candidates.find((entry) => isImagePreviewUri(entry)) || '';
}

export function getGlimpseViews(item: any) {
  return Number(item?.stats?.viewsCount || item?.viewsCount || 0);
}

export function getGlimpseLikes(item: any) {
  return Number(item?.stats?.likesCount || item?.likesCount || 0);
}

export function getUserFollowerCount(user: SearchUser | null | undefined) {
  return Number(user?.stats?.followersCount || (user as any)?.followersCount || 0);
}

export function normalizeUser(user: any): SearchUser | null {
  const resolvedUserId = String(user?.userId || user?.uid || user?.id || '').trim();
  if (!resolvedUserId) return null;
  return {
    userId: resolvedUserId,
    username: String(user.username || user.usernameLowercase || ''),
    displayName: user.displayName || user.username || '',
    avatarURL: user.avatarURL || '',
    verified: !!user.verified,
    isPrivate: !!user.isPrivate,
    stats: {
      followersCount: Number(user?.stats?.followersCount || user?.followersCount || 0),
      postsCount: Number(user?.stats?.postsCount || user?.postsCount || 0),
    },
    matchedInterests: Array.isArray(user?.matchedInterests) ? user.matchedInterests : [],
    reason: typeof user?.reason === 'string' ? user.reason : '',
  };
}

export function scoreSearchText(text: string, query: string): number {
  const value = String(text || '').toLowerCase().trim();
  const q = String(query || '').toLowerCase().trim();
  if (!value || !q) return 0;
  if (value === q) return 1200;
  if (value.startsWith(q)) return 900;
  const parts = value.split(/[^a-z0-9_]+/).filter(Boolean);
  if (parts.some((part) => part.startsWith(q))) return 700;
  if (q.length >= 2 && value.includes(q)) return 220;
  return 0;
}

export function sortViralGlimpses(items: any[]) {
  return [...items].sort((a, b) => {
    const scoreA = getGlimpseViews(a) * 1.8 + getGlimpseLikes(a) * 2.4;
    const scoreB = getGlimpseViews(b) * 1.8 + getGlimpseLikes(b) * 2.4;
    return scoreB - scoreA;
  });
}
