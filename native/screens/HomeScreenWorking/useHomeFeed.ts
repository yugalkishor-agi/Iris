import { useCallback, useEffect, useRef } from 'react';
import { applyFeedControlRanking } from './homeFeedRanking';
import type { FeedControlSettings, Post } from './homeFeedTypes';

interface UseHomeFeedParams {
  posts: Post[];
  followingIds: string[];
  feedControls: FeedControlSettings;
  viewerRegion: string;
  setPosts: (val: Post[] | ((prev: Post[]) => Post[])) => void;
}

export const useHomeFeed = ({
  posts,
  followingIds,
  feedControls,
  viewerRegion,
  setPosts,
}: UseHomeFeedParams) => {
  const baseFeedPostsRef = useRef<Post[]>([]);
  const postsRef = useRef<Post[]>(posts);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const rank = useCallback((items: Post[]) => {
    return feedControls.enabled
      ? applyFeedControlRanking(items, feedControls, followingIds, viewerRegion)
      : items;
  }, [feedControls, followingIds, viewerRegion]);

  const commitBaseFeedPosts = useCallback((items: Post[]) => {
    const source = Array.isArray(items) ? items : [];
    baseFeedPostsRef.current = source;
    setPosts(rank(source));
  }, [rank, setPosts]);

  const mutateBaseFeedPosts = useCallback((updater: (current: Post[]) => Post[]) => {
    const next = updater(baseFeedPostsRef.current || []);
    baseFeedPostsRef.current = next;
    setPosts(rank(next));
  }, [rank, setPosts]);

  const seedBaseFeedPosts = useCallback((seeded: Post[]) => {
    if (!Array.isArray(seeded) || seeded.length === 0) return;
    if (postsRef.current.length > 0 || baseFeedPostsRef.current.length > 0) return;
    baseFeedPostsRef.current = seeded;
    setPosts(rank(seeded));
  }, [rank, setPosts]);

  useEffect(() => {
    setPosts(rank(baseFeedPostsRef.current || []));
  }, [rank, setPosts]);

  return {
    baseFeedPostsRef,
    postsRef,
    commitBaseFeedPosts,
    mutateBaseFeedPosts,
    seedBaseFeedPosts,
  };
};
