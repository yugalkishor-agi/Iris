import { useEffect, useRef, type MutableRefObject } from 'react';
import { InteractionManager } from 'react-native';
import { postService } from '../../services/post.service';
import type { Post } from './homeFeedTypes';

interface UseHomeLikedStateSyncParams {
  navigation: any;
  currentUserId: string | null;
  postsRef: MutableRefObject<Post[]>;
  mutateBaseFeedPosts: (updater: (current: Post[]) => Post[]) => void;
}

export const useHomeLikedStateSync = ({
  navigation,
  currentUserId,
  postsRef,
  mutateBaseFeedPosts,
}: UseHomeLikedStateSyncParams) => {
  const likesSyncTaskRef = useRef<{ cancel: () => void } | null>(null);
  const lastLikesSyncAtRef = useRef(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!currentUserId) return;
      const now = Date.now();
      if (now - lastLikesSyncAtRef.current < 5000) return;

      likesSyncTaskRef.current?.cancel?.();
      likesSyncTaskRef.current = InteractionManager.runAfterInteractions(() => {
        const visiblePosts = postsRef.current;
        if (!visiblePosts || visiblePosts.length === 0) {
          lastLikesSyncAtRef.current = Date.now();
          return;
        }

        void postService
          .getUserLikedPosts(currentUserId, visiblePosts.map((post) => post.postId))
          .then((likedIds) => {
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
            lastLikesSyncAtRef.current = Date.now();
          })
          .catch(() => undefined)
          .finally(() => {
            likesSyncTaskRef.current = null;
          });
      });
    });

    return () => {
      likesSyncTaskRef.current?.cancel?.();
      likesSyncTaskRef.current = null;
      unsubscribe();
    };
  }, [navigation, currentUserId, mutateBaseFeedPosts, postsRef]);
};
