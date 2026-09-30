import type { FeedControlSettings, Post } from './homeFeedTypes';

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function toPostMillis(value: any) {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function stableHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function applyFeedControlRanking(
  items: Post[],
  controls: FeedControlSettings,
  followingIds: string[],
  viewerRegion: string,
) {
  if (!Array.isArray(items) || items.length <= 1 || !controls.enabled) return items;
  const followingSet = new Set(followingIds || []);
  const regionToken = String(viewerRegion || '').trim().toLowerCase();
  const now = Date.now();

  return items
    .map((post, index) => {
      const id = String(post.postId || '');
      const ageHours = Math.max(0, (now - toPostMillis(post.createdAt)) / 3600000);
      const engagement = Math.log1p(
        Math.max(0, Number(post.likesCount || 0)) +
        Number(post.commentsCount || 0) * 2 +
        Number(post.sharesCount || 0) * 3
      );
      const isFriend = followingSet.has(post.userId);
      const isVideo = String(post.mediaType || '').toLowerCase() === 'video';
      const postLocation = String(post.location || '').trim().toLowerCase();
      const isLocal = isFriend || (!!regionToken && !!postLocation && (postLocation.includes(regionToken) || regionToken.includes(postLocation)));
      const freshnessWeight = clamp01(controls.newVsOldViral);
      let score = 0;
      score += ((controls.friendsVsPublic * 2) - 1) * (isFriend ? 38 : -38);
      score += ((controls.photosVsVideos * 2) - 1) * (isVideo ? -22 : 22);
      score += ((controls.localVsGlobal * 2) - 1) * (isLocal ? 16 : -16);
      score += freshnessWeight * clamp01((72 - ageHours) / 72) * 32;
      score += (1 - freshnessWeight) * clamp01(engagement / 10) * 28;
      if (post.isLiked) score -= 2.5;
      score += (stableHash(id) % 17) * 0.0001;
      return { post, score, index };
    })
    .sort((a, b) => Math.abs(b.score - a.score) > 0.0001 ? b.score - a.score : a.index - b.index)
    .map((entry) => entry.post);
}
