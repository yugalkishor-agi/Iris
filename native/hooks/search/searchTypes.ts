export type SearchUser = {
  userId: string;
  username: string;
  displayName?: string;
  avatarURL?: string;
  verified?: boolean;
  isPrivate?: boolean;
  stats?: {
    followersCount?: number;
    postsCount?: number;
  };
  matchedInterests?: string[];
  reason?: string;
};

export type SearchHashtag = {
  hashtag: string;
  postsCount: number;
  trending?: boolean;
};

export type SearchPostResult = {
  postId: string;
  mediaURLs?: string[];
  thumbnailURL?: string;
  caption?: string;
  authorUsername?: string;
  stats?: {
    likesCount?: number;
  };
};

export type SearchCreatorGlimpse = {
  glimpseId: string;
  authorId: string;
  authorUsername: string;
  authorAvatarURL?: string;
  authorVerified?: boolean;
  followersCount: number;
  previewURL: string;
  viewsCount: number;
  likesCount: number;
  caption?: string;
  reason: string;
};

export type SearchBootstrap = {
  exploreGlimpses?: any[];
  risingCreatorGlimpses?: SearchCreatorGlimpse[];
  trendingHashtags?: Array<{ tag: string; postCount: number }>;
  recentSearches?: string[];
  warmedAt?: number;
};

export const SEARCH_RECENT_LIMIT = 8;
export const SEARCH_CACHE_TTL_MS = 2 * 60 * 1000;
