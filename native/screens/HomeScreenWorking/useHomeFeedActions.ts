import { useCallback, useRef, type MutableRefObject } from 'react';
import { collectionService } from '../../services/collection.service';
import { postService } from '../../services/post.service';
import { feedRankingService } from '../../services/feedRanking.service';
import type { Post } from './homeFeedTypes';

interface UseHomeFeedActionsParams {
  user: any;
  postsRef: MutableRefObject<Post[]>;
  mutateBaseFeedPosts: (updater: (current: Post[]) => Post[]) => void;
  setHiddenPostIds: (val: string[] | ((prev: string[]) => string[])) => void;
  deletePostLayout: (postId: string) => void;
}

export const useHomeFeedActions = ({
  user,
  postsRef,
  mutateBaseFeedPosts,
  setHiddenPostIds,
  deletePostLayout,
}: UseHomeFeedActionsParams) => {
  const likeIntentQueueRef = useRef<Map<string, boolean>>(new Map());
  const likeMutationInFlightRef = useRef<Set<string>>(new Set());

  const applyPostLikeState = useCallback((postId: string, nextLiked: boolean) => {
    mutateBaseFeedPosts((prev) => prev.map((post) => {
      if (post.postId !== postId || !!post.isLiked === nextLiked) return post;
      const nextLikes = Math.max(0, Number(post.likesCount || 0) + (nextLiked ? 1 : -1));
      return { ...post, isLiked: nextLiked, likesCount: nextLikes };
    }));
  }, [mutateBaseFeedPosts]);

  const flushLikeIntent = useCallback(async (postId: string) => {
    if (!user?.userId || likeMutationInFlightRef.current.has(postId)) return;
    while (true) {
      const desiredLiked = likeIntentQueueRef.current.get(postId);
      if (typeof desiredLiked !== 'boolean') return;
      const snapshotPost = postsRef.current.find((entry) => entry.postId === postId);
      const committedLiked = !!snapshotPost?.isLiked;
      if (committedLiked === desiredLiked) {
        likeIntentQueueRef.current.delete(postId);
        return;
      }
      likeMutationInFlightRef.current.add(postId);
      likeIntentQueueRef.current.delete(postId);
      try {
        const result = await postService.setPostLiked(postId, user.userId, desiredLiked);
        const resolvedLiked = !!result.liked;
        applyPostLikeState(postId, resolvedLiked);
        if (!committedLiked && resolvedLiked && snapshotPost) feedRankingService.recordLike(user.userId, snapshotPost);
      } catch (error) {
        console.error('Failed to like post:', error);
        applyPostLikeState(postId, committedLiked);
      } finally {
        likeMutationInFlightRef.current.delete(postId);
      }
      if (!likeIntentQueueRef.current.has(postId)) return;
    }
  }, [applyPostLikeState, postsRef, user?.userId]);

  const handleLikePress = useCallback(async (postId: string) => {
    if (!user?.userId) return;
    const current = postsRef.current.find((entry) => entry.postId === postId);
    const desiredLiked = !(current?.isLiked ?? false);
    likeIntentQueueRef.current.set(postId, desiredLiked);
    applyPostLikeState(postId, desiredLiked);
    await flushLikeIntent(postId);
  }, [applyPostLikeState, flushLikeIntent, postsRef, user?.userId]);

  const handleSavePress = useCallback(async (postId: string, saved: boolean) => {
    if (!user) return;
    try {
      if (saved) await collectionService.savePost(user.userId, postId);
      else await collectionService.unsavePostFromAllCollections(user.userId, postId);
      mutateBaseFeedPosts((prev) => prev.map((post) => post.postId === postId ? { ...post, isSaved: saved } : post));
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  }, [mutateBaseFeedPosts, user]);

  const handleShare = useCallback((postId: string, sharedCount: number) => {
    if (!sharedCount || sharedCount <= 0) return;
    mutateBaseFeedPosts((prev) => prev.map((post) => post.postId === postId ? { ...post, sharesCount: (post.sharesCount || 0) + sharedCount } : post));
  }, [mutateBaseFeedPosts]);

  const handleHide = useCallback((postId: string) => {
    setHiddenPostIds((prev) => prev.includes(postId) ? prev : [...prev, postId]);
    deletePostLayout(postId);
    mutateBaseFeedPosts((prev) => prev.filter((post) => post.postId !== postId));
  }, [deletePostLayout, mutateBaseFeedPosts, setHiddenPostIds]);

  return { handleLikePress, handleSavePress, handleShare, handleHide };
};
