import { useCallback, useEffect, useRef, useState } from 'react';
import { postService } from '../services/post.service';
import { glimpseService } from '../services/glimpse.service';

type ContentType = 'post' | 'glimpse';

type ControllerState = {
  liked: boolean;
  likesCount: number;
  inFlight: boolean;
};

type UseLikeIntentControllerParams = {
  userId?: string | null;
  contentType: ContentType;
  contentId?: string | null;
  initialLiked: boolean;
  initialLikesCount: number;
  onChange?: (state: ControllerState) => void;
  onError?: (error: unknown) => void;
};

const clampCount = (value: number): number => Math.max(0, Number.isFinite(value) ? value : 0);

export function useLikeIntentController({
  userId,
  contentType,
  contentId,
  initialLiked,
  initialLikesCount,
  onChange,
  onError,
}: UseLikeIntentControllerParams) {
  const [liked, setLiked] = useState<boolean>(!!initialLiked);
  const [likesCount, setLikesCount] = useState<number>(clampCount(initialLikesCount));
  const [inFlight, setInFlight] = useState(false);

  const mountedRef = useRef(true);
  const committedLikedRef = useRef<boolean>(!!initialLiked);
  const committedCountRef = useRef<number>(clampCount(initialLikesCount));
  const optimisticLikedRef = useRef<boolean>(!!initialLiked);
  const optimisticCountRef = useRef<number>(clampCount(initialLikesCount));
  const inFlightRef = useRef(false);
  const queuedDesiredRef = useRef<boolean | null>(null);

  const emitState = useCallback((next: ControllerState) => {
    if (!mountedRef.current) return;
    setLiked(next.liked);
    setLikesCount(next.likesCount);
    setInFlight(next.inFlight);
    onChange?.(next);
  }, [onChange]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const safeLiked = !!initialLiked;
    const safeCount = clampCount(initialLikesCount);
    committedLikedRef.current = safeLiked;
    committedCountRef.current = safeCount;
    optimisticLikedRef.current = safeLiked;
    optimisticCountRef.current = safeCount;
    queuedDesiredRef.current = null;
    inFlightRef.current = false;
    emitState({ liked: safeLiked, likesCount: safeCount, inFlight: false });
  }, [contentId, contentType, emitState, initialLiked, initialLikesCount, userId]);

  const runMutation = useCallback(async (desiredLiked: boolean): Promise<boolean> => {
    if (!userId || !contentId) {
      throw new Error('Missing userId/contentId for like mutation');
    }

    if (contentType === 'post') {
      const result = await postService.setPostLiked(contentId, userId, desiredLiked);
      return !!result.liked;
    }

    const result = await glimpseService.setGlimpseLiked(contentId, userId, desiredLiked);
    return !!result.liked;
  }, [contentId, contentType, userId]);

  const drainQueue = useCallback(async (): Promise<void> => {
    if (inFlightRef.current) return;

    while (queuedDesiredRef.current !== null) {
      const desired = queuedDesiredRef.current;
      queuedDesiredRef.current = null;

      if (desired === committedLikedRef.current) {
        const state = {
          liked: committedLikedRef.current,
          likesCount: committedCountRef.current,
          inFlight: false,
        };
        optimisticLikedRef.current = state.liked;
        optimisticCountRef.current = state.likesCount;
        emitState(state);
        continue;
      }

      const previousCommittedLiked = committedLikedRef.current;
      const previousCommittedCount = committedCountRef.current;

      inFlightRef.current = true;
      emitState({
        liked: optimisticLikedRef.current,
        likesCount: optimisticCountRef.current,
        inFlight: true,
      });

      try {
        const resolvedLiked = await runMutation(desired);
        const delta = previousCommittedLiked === resolvedLiked ? 0 : (resolvedLiked ? 1 : -1);
        const nextCommittedCount = clampCount(previousCommittedCount + delta);

        committedLikedRef.current = resolvedLiked;
        committedCountRef.current = nextCommittedCount;

        if (queuedDesiredRef.current === null) {
          optimisticLikedRef.current = resolvedLiked;
          optimisticCountRef.current = nextCommittedCount;
          emitState({ liked: resolvedLiked, likesCount: nextCommittedCount, inFlight: false });
        }
      } catch (error) {
        committedLikedRef.current = previousCommittedLiked;
        committedCountRef.current = previousCommittedCount;

        if (queuedDesiredRef.current === null) {
          optimisticLikedRef.current = previousCommittedLiked;
          optimisticCountRef.current = previousCommittedCount;
          emitState({ liked: previousCommittedLiked, likesCount: previousCommittedCount, inFlight: false });
        }

        onError?.(error);
      } finally {
        inFlightRef.current = false;
        if (queuedDesiredRef.current !== null) {
          emitState({
            liked: optimisticLikedRef.current,
            likesCount: optimisticCountRef.current,
            inFlight: false,
          });
        }
      }
    }
  }, [emitState, onError, runMutation]);

  const setDesiredLiked = useCallback(async (desiredLiked: boolean): Promise<void> => {
    if (!userId || !contentId) return;

    const currentLiked = optimisticLikedRef.current;
    if (currentLiked !== desiredLiked) {
      const delta = desiredLiked ? 1 : -1;
      const nextCount = clampCount(optimisticCountRef.current + delta);
      optimisticLikedRef.current = desiredLiked;
      optimisticCountRef.current = nextCount;

      emitState({
        liked: desiredLiked,
        likesCount: nextCount,
        inFlight: inFlightRef.current,
      });
    }

    queuedDesiredRef.current = desiredLiked;
    if (!inFlightRef.current) {
      await drainQueue();
    }
  }, [contentId, drainQueue, emitState, userId]);

  const toggleLike = useCallback(async (): Promise<void> => {
    await setDesiredLiked(!optimisticLikedRef.current);
  }, [setDesiredLiked]);

  return {
    liked,
    likesCount,
    inFlight,
    toggleLike,
    setDesiredLiked,
  };
}
