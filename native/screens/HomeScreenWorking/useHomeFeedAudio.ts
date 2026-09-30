import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { feedAudioService } from '../../services/feedAudio.service';
import { useHomeScreenWorkingStore } from './useHomeScreenWorkingStore';
import type { Post } from './homeFeedTypes';

interface UseHomeFeedAudioParams {
  posts: Post[];
  isFocused: boolean;
  screenHeight: number;
  activeMusicPostId: string | null;
  mutedMusicPostIds: Record<string, boolean>;
  visibleMusicPostIdsRef: MutableRefObject<Set<string>>;
  postLayoutsRef: MutableRefObject<Record<string, { y: number; height: number }>>;
  scrollOffsetYRef: MutableRefObject<number>;
  activeMusicPostIdRef: MutableRefObject<string | null>;
  setActiveMusicPostId: (val: string | null | ((prev: string | null) => string | null)) => void;
  setMutedMusicPostIds: (val: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
}
export const useHomeFeedAudio = ({
  posts,
  isFocused,
  screenHeight,
  activeMusicPostId,
  mutedMusicPostIds,
  visibleMusicPostIdsRef,
  postLayoutsRef,
  scrollOffsetYRef,
  activeMusicPostIdRef,
  setActiveMusicPostId,
  setMutedMusicPostIds,
}: UseHomeFeedAudioParams) => {
  const recomputeActiveMusicPost = useCallback((): string | null => {
    const viewportTop = scrollOffsetYRef.current + 88;
    const viewportBottom = scrollOffsetYRef.current + screenHeight - 118;
    const viewportCenter = (viewportTop + viewportBottom) / 2;
    let bestPostId: string | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;

    visibleMusicPostIdsRef.current.forEach((postId) => {
      const layout = postLayoutsRef.current[postId];
      if (!layout || layout.height <= 0) return;
      const visibleTop = Math.max(layout.y, viewportTop);
      const visibleBottom = Math.min(layout.y + layout.height, viewportBottom);
      const visibleHeight = visibleBottom - visibleTop;
      if (visibleHeight <= Math.min(180, layout.height * 0.28)) return;
      const itemCenter = layout.y + layout.height / 2;
      const containsCenter = viewportCenter >= layout.y && viewportCenter <= layout.y + layout.height;
      const score = (containsCenter ? 100000 : 0) + (visibleHeight / Math.max(1, layout.height)) * 1000 - Math.abs(itemCenter - viewportCenter) - layout.y * 0.00001;
      if (score > bestScore) {
        bestScore = score;
        bestPostId = postId;
      }
    });

    const bestIndex = bestPostId ? posts.findIndex((post) => post.postId === bestPostId) : -1;
    const nextPost = bestIndex >= 0 ? posts.slice(bestIndex + 1).find((post) => !!post.backgroundMusic?.streamURL) : null;
    if (nextPost?.backgroundMusic?.streamURL) void feedAudioService.preload(nextPost.backgroundMusic.streamURL);
    return bestPostId;
  }, [postLayoutsRef, posts, screenHeight, scrollOffsetYRef, visibleMusicPostIdsRef]);

  const selectionFrameRef = useRef<number | null>(null);

  const scheduleRecomputeActiveMusicPost = useCallback(() => {
    if (selectionFrameRef.current != null) {
      cancelAnimationFrame(selectionFrameRef.current);
    }
    selectionFrameRef.current = requestAnimationFrame(() => {
      selectionFrameRef.current = null;
      const bestPostId = recomputeActiveMusicPost();
      if (bestPostId === activeMusicPostIdRef.current) return;
      activeMusicPostIdRef.current = bestPostId;
      setActiveMusicPostId(bestPostId);
    });
  }, [recomputeActiveMusicPost, activeMusicPostIdRef, setActiveMusicPostId]);

  useEffect(() => {
    return () => {
      if (selectionFrameRef.current != null) {
        cancelAnimationFrame(selectionFrameRef.current);
      }
    };
  }, []);
  const toggleMusicMuteForPost = useCallback((postId: string) => {
    const { posts, activeMusicPostId, mutedMusicPostIds } = useHomeScreenWorkingStore.getState();
    const targetPost = posts.find((post) => post.postId === postId && !!post.backgroundMusic?.streamURL);
    if (!targetPost?.backgroundMusic?.streamURL) return;
    if (activeMusicPostId !== postId) {
      activeMusicPostIdRef.current = postId;
      setMutedMusicPostIds((prev) => ({ ...prev, [postId]: false }));
      setActiveMusicPostId(postId);
      void feedAudioService.preload(targetPost.backgroundMusic.streamURL);
      return;
    }
    if (mutedMusicPostIds[postId]) {
      setMutedMusicPostIds((prev) => ({ ...prev, [postId]: false }));
      return;
    }
    activeMusicPostIdRef.current = null;
    setMutedMusicPostIds((prev) => ({ ...prev, [postId]: true }));
    setActiveMusicPostId(null);
  }, [activeMusicPostIdRef, setActiveMusicPostId, setMutedMusicPostIds]);

  useEffect(() => {
    if (!isFocused || !activeMusicPostId || !visibleMusicPostIdsRef.current.has(activeMusicPostId)) {
      void feedAudioService.stop('feed:active');
      return;
    }
    const activePost = posts.find((post) => post.postId === activeMusicPostId);
    const activeStream = activePost?.backgroundMusic?.streamURL;
    if (!activeStream) return;
    void feedAudioService.play({
      key: 'feed:active',
      uri: activeStream,
      positionMillis: Math.max(0, Math.floor(((activePost?.backgroundMusic?.clipStart as number) || 0) * 1000)),
      muted: !!mutedMusicPostIds[activeMusicPostId],
    });
    return () => void feedAudioService.stop('feed:active');
  }, [activeMusicPostId, isFocused, mutedMusicPostIds, posts, visibleMusicPostIdsRef]);

  return { recomputeActiveMusicPost, scheduleRecomputeActiveMusicPost, toggleMusicMuteForPost };
};
