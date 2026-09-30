import { useEffect, useLayoutEffect } from 'react';
import { cacheIntegration } from '../../services/cacheIntegration.service';
import type { Post, Story } from './homeFeedTypes';

interface UseHomeBootstrapCacheParams {
  cacheKey: string;
  currentUserId: string | null;
  seedBaseFeedPosts: (posts: Post[]) => void;
  hydrateFeedLikedState: (posts: Post[]) => void;
  setStories: (val: Story[] | ((prev: Story[]) => Story[])) => void;
  setFollowingIds: (val: string[] | ((prev: string[]) => string[])) => void;
  setHasMyStory: (val: boolean | ((prev: boolean) => boolean)) => void;
  setIsMyStoryViewed: (val: boolean | ((prev: boolean) => boolean)) => void;
  setLoading: (val: boolean | ((prev: boolean) => boolean)) => void;
}

const applyCachedHome = (
  cached: any,
  params: Omit<UseHomeBootstrapCacheParams, 'cacheKey'>,
) => {
  if (!cached || typeof cached !== 'object') return;
  const seededPosts = Array.isArray(cached.posts) ? cached.posts : [];
  const seededStories = Array.isArray(cached.stories) ? cached.stories : [];
  if (seededPosts.length === 0 && seededStories.length === 0) return;

  params.seedBaseFeedPosts(seededPosts);
  if (params.currentUserId && seededPosts.length > 0) {
    params.hydrateFeedLikedState(seededPosts);
  }
  params.setStories((prev) => (prev.length > 0 ? prev : seededStories));
  if (Array.isArray(cached.followingIds)) params.setFollowingIds(cached.followingIds);
  if (typeof cached.hasMyStory === 'boolean') params.setHasMyStory(cached.hasMyStory);
  if (typeof cached.isMyStoryViewed === 'boolean') params.setIsMyStoryViewed(cached.isMyStoryViewed);
  params.setLoading(false);
};

export const useHomeBootstrapCache = (params: UseHomeBootstrapCacheParams) => {
  useLayoutEffect(() => {
    if (!params.cacheKey) return;
    applyCachedHome(cacheIntegration.peekCachedData(params.cacheKey), params);
  }, [params.cacheKey, params.currentUserId, params.hydrateFeedLikedState]);

  useEffect(() => {
    if (!params.cacheKey) return;
    let active = true;
    cacheIntegration.getCachedData(params.cacheKey)
      .then((cached) => {
        if (active) applyCachedHome(cached, params);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [params.cacheKey, params.currentUserId, params.hydrateFeedLikedState]);
};
