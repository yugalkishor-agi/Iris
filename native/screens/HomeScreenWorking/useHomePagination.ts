import { useCallback } from 'react';
import { postService } from '../../services/post.service';
import { transformFeedPost } from './homeFeedTransform';
import type { Post } from './homeFeedTypes';

interface UseHomePaginationParams {
  followingIds: string[];
  currentUserId: string | null;
  lastDoc: any;
  loadingMore: boolean;
  noMore: boolean;
  hiddenPostIds: string[];
  hydrateLikedByPreview: (items: Post[], followings: string[]) => Promise<Post[]>;
  rankFeedForUser: (items: Post[]) => Post[];
  mutateBaseFeedPosts: (updater: (current: Post[]) => Post[]) => void;
  setLastDoc: (val: any | ((prev: any) => any)) => void;
  setNoMore: (val: boolean | ((prev: boolean) => boolean)) => void;
  setLoadingMore: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const useHomePagination = ({
  followingIds,
  currentUserId,
  lastDoc,
  loadingMore,
  noMore,
  hiddenPostIds,
  hydrateLikedByPreview,
  rankFeedForUser,
  mutateBaseFeedPosts,
  setLastDoc,
  setNoMore,
  setLoadingMore,
}: UseHomePaginationParams) => {
  return useCallback(async () => {
    if (loadingMore || noMore || !currentUserId) return;
    if (!followingIds || followingIds.length === 0) return;

    try {
      setLoadingMore(true);
      const { posts: morePosts, lastDoc: nextLastDoc } = await postService.getFeedPosts(
        followingIds,
        currentUserId,
        20,
        lastDoc || undefined,
      );
      const transformedMore = (morePosts || [])
        .filter((post: any) => post.authorId !== currentUserId)
        .filter((post: any) => !hiddenPostIds.includes(post.postId))
        .map(transformFeedPost);
      const transformedMoreWithLikes = await hydrateLikedByPreview(transformedMore, followingIds);

      mutateBaseFeedPosts((prev) => {
        const map = new Map<string, Post>();
        prev.forEach((post) => map.set(post.postId, post));
        transformedMoreWithLikes.forEach((post) => map.set(post.postId, post));
        return rankFeedForUser(Array.from(map.values()));
      });

      setLastDoc(nextLastDoc || null);
      if (!nextLastDoc || (morePosts || []).length === 0) setNoMore(true);
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [
    currentUserId,
    followingIds,
    hiddenPostIds,
    hydrateLikedByPreview,
    lastDoc,
    loadingMore,
    mutateBaseFeedPosts,
    noMore,
    rankFeedForUser,
    setLastDoc,
    setLoadingMore,
    setNoMore,
  ]);
};
