import { useCallback } from 'react';
import { postService } from '../../services/post.service';
import type { Post } from './homeFeedTypes';

interface UseHomeFeedHydrationParams {
  currentUserId: string | null;
  mutateBaseFeedPosts: (updater: (current: Post[]) => Post[]) => void;
}

export const useHomeFeedHydration = ({
  currentUserId,
  mutateBaseFeedPosts,
}: UseHomeFeedHydrationParams) => {
  const hydrateLikedByPreview = useCallback(async (items: Post[], followings: string[]) => {
    const followingSet = new Set(followings || []);
    const candidates = items.filter((item) => item.likesCount > 0).slice(0, 6);
    if (candidates.length === 0 || followingSet.size === 0) return items;

    const previewMap = new Map<string, Post['likedByPreview']>();
    await Promise.all(candidates.map(async (item) => {
      try {
        const likeUsers = await postService.getPostLikes(item.postId, 12);
        const preview = (likeUsers || [])
          .filter((likeUser: any) => followingSet.has(likeUser.userId))
          .slice(0, 3)
          .map((likeUser: any) => ({
            userId: likeUser.userId,
            username: likeUser.username,
            displayName: likeUser.displayName,
            avatarURL: likeUser.avatarURL,
          }));
        if (preview.length > 0) previewMap.set(item.postId, preview);
      } catch (error) {
        console.error('Failed to load like preview for post:', item.postId, error);
      }
    }));

    return items.map((item) => ({
      ...item,
      likedByPreview: previewMap.get(item.postId) || item.likedByPreview || [],
    }));
  }, []);

  const hydrateFeedLikedState = useCallback(async (items: Post[]) => {
    if (!currentUserId || !Array.isArray(items) || items.length === 0) return;
    try {
      const likedIds = await postService.getUserLikedPosts(currentUserId, items.map((item) => item.postId));
      const likedSet = new Set(likedIds || []);
      mutateBaseFeedPosts((prev) => {
        let changed = false;
        const next = prev.map((post) => {
          const shouldBeLiked = likedSet.has(post.postId);
          if (post.isLiked === shouldBeLiked) return post;
          changed = true;
          return { ...post, isLiked: shouldBeLiked };
        });
        return changed ? next : prev;
      });
    } catch (error) {
      console.error('Failed to hydrate cached feed liked state:', error);
    }
  }, [currentUserId, mutateBaseFeedPosts]);

  return { hydrateLikedByPreview, hydrateFeedLikedState };
};
