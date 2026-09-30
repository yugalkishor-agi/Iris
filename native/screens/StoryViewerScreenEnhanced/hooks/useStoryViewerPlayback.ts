import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useStoryViewerStore } from '../useStoryViewerStore';
import { Asset } from 'expo-asset';
import { Image } from 'expo-image';

const STORY_DURATION = 5000;

export function useStoryViewerPlayback(
  currentStoryData: any,
  handleNext: () => Promise<void>
) {
  const isPaused = useStoryViewerStore(s => s.isPaused);
  const isTyping = useStoryViewerStore(s => s.isTyping);
  const showInsights = useStoryViewerStore(s => s.showInsights);
  const showMoreMenu = useStoryViewerStore(s => s.showMoreMenu);
  const questionModal = useStoryViewerStore(s => s.questionModal);
  const questionRepliesModal = useStoryViewerStore(s => s.questionRepliesModal);
  const showDeleteDialog = useStoryViewerStore(s => s.showDeleteDialog);

  const setProgress = useStoryViewerStore(s => s.setProgress);
  const stories = useStoryViewerStore(s => s.stories);
  const currentStory = useStoryViewerStore(s => s.currentStory);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const shouldPausePlayback = isPaused || showInsights || showMoreMenu || isTyping || questionModal?.visible || questionRepliesModal?.visible || showDeleteDialog;

  // Image progress animation
  useEffect(() => {
    if (!currentStoryData) return;
    if (currentStoryData.mediaType === 'video') return;
    if (shouldPausePlayback) return;

    const duration = currentStoryData?.duration || STORY_DURATION;
    const animation = Animated.timing(progressAnim, {
      toValue: 100,
      duration,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        void handleNext();
      }
    });

    return () => animation.stop();
  }, [currentStory, currentStoryData, shouldPausePlayback, handleNext, progressAnim]);

  // Preloading
  useEffect(() => {
    const next = stories[currentStory + 1];
    if (!next) return;
    if (next.thumbnailURL) {
      Image.prefetch(next.thumbnailURL).catch(() => { });
    }
    if (next.mediaType === 'image' && next.mediaURL) {
      Image.prefetch(next.mediaURL).catch(() => { });
    } else if (next.mediaType === 'video' && next.mediaURL) {
      (async () => {
        try {
          await Asset.fromURI(next.mediaURL).downloadAsync();
        } catch { }
      })();
    }
  }, [currentStory, stories]);

  // Reset progress when story changes
  useEffect(() => {
    progressAnim.setValue(0);
    setProgress(0);
  }, [currentStory, progressAnim, setProgress]);

  return {
    progressAnim,
    shouldPausePlayback
  };
}
