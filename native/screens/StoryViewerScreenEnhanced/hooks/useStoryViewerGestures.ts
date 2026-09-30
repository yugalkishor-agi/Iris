import { useRef, useCallback } from 'react';
import { useWindowDimensions } from 'react-native';
import { useStoryViewerStore } from '../useStoryViewerStore';

export function useStoryViewerGestures(
  navigation: any,
  handleNext: () => Promise<void>,
  handlePrevious: () => Promise<void>,
  handleDoubleTap: () => Promise<void>,
  interactingRef: React.MutableRefObject<boolean>
) {
  const { width } = useWindowDimensions();
  const setIsPaused = useStoryViewerStore(s => s.setIsPaused);
  const showInsights = useStoryViewerStore(s => s.showInsights);
  const showMoreMenu = useStoryViewerStore(s => s.showMoreMenu);
  const isTyping = useStoryViewerStore(s => s.isTyping);

  const lastTapRef = useRef<number>(0);
  const mediaTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = (event: any) => {
    if (interactingRef.current) { interactingRef.current = false; return; }
    const { locationX } = event.nativeEvent;
    if (locationX >= width * 0.45) {
      void handleNext();
    } else {
      void handlePrevious();
    }
  };

  const handleMediaPress = (event: any) => {
    if (interactingRef.current) { interactingRef.current = false; return; }
    const now = Date.now();
    const tapX = event?.nativeEvent?.locationX ?? (width / 2);

    if (now - lastTapRef.current < 280) {
      if (mediaTapTimerRef.current) {
        try { clearTimeout(mediaTapTimerRef.current); } catch { }
        mediaTapTimerRef.current = null;
      }
      lastTapRef.current = 0;
      void handleDoubleTap();
      return;
    }

    lastTapRef.current = now;
    if (mediaTapTimerRef.current) {
      try { clearTimeout(mediaTapTimerRef.current); } catch { }
      mediaTapTimerRef.current = null;
    }
    mediaTapTimerRef.current = setTimeout(() => {
      handleTap({ nativeEvent: { locationX: tapX } });
      mediaTapTimerRef.current = null;
    }, 240);
  };

  const handleLongPress = () => {
    setIsPaused(true);
  };

  const handlePressIn = () => {
    setIsPaused(true);
  };

  const togglePausePlayback = () => {
    setIsPaused((prev) => !prev);
  };

  const handlePressOut = () => {
    setIsPaused(false);
  };

  const handleGlobalTouchStart = useCallback(() => {
    if (showInsights || showMoreMenu || isTyping) return;
    setIsPaused(true);
  }, [showInsights, showMoreMenu, isTyping, setIsPaused]);

  const handleGlobalTouchEnd = useCallback(() => {
    if (showInsights || showMoreMenu || isTyping) return;
    setIsPaused(false);
  }, [showInsights, showMoreMenu, isTyping, setIsPaused]);

  const handleSwipeDown = (event: any) => {
    const { translationY } = event.nativeEvent;
    if (translationY > 100) {
      navigation.goBack();
    }
  };

  return {
    handleMediaPress,
    handleLongPress,
    handlePressIn,
    handlePressOut,
    handleGlobalTouchStart,
    handleGlobalTouchEnd,
    handleSwipeDown,
    togglePausePlayback
  };
}
