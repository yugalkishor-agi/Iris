import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  StatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { storyService } from '../../services/story.service';
import { StoryRenderer } from './StoryRenderer';
import { StoryOverlayRenderer, OverlaySticker, OverlayTextElement, OverlayDrawing } from './StoryOverlayRenderer';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

interface Story {
  storyId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarURL: string;
  verified?: boolean;
  mediaURL: string;
  mediaType: 'image' | 'video';
  caption?: string;
  createdAt: any;
  expiresAt: any;
  views: number;
  isViewed: boolean;
  // Unified widget data
  textElements?: OverlayTextElement[];
  stickers?: OverlaySticker[];
  drawings?: OverlayDrawing[];
  // Legacy/Merged support
  interactiveElements?: Array<{
    id: string;
    type: 'poll' | 'question' | 'slider' | 'music' | 'location' | 'mention';
    x: number;
    y: number;
    data: any;
  }>;
}

interface StoryViewerEnhancedProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onStoryChange?: (index: number) => void;
}

export function StoryViewerEnhanced({
  stories,
  initialIndex,
  onClose,
  onStoryChange
}: StoryViewerEnhancedProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Interaction states
  const [pollResults, setPollResults] = useState<Record<string, { counts: number[]; total: number }>>({});
  const [myPollVote, setMyPollVote] = useState<Record<string, number | null>>({});

  const [sliderStats, setSliderStats] = useState<Record<string, { avg: number; count: number }>>({});
  const [mySliderValue, setMySliderValue] = useState<Record<string, number | null>>({});
  const [sliderWidths, setSliderWidths] = useState<Record<string, number>>({});

  const [quizResults, setQuizResults] = useState<Record<string, { counts: number[]; total: number }>>({});
  const [myQuizAnswer, setMyQuizAnswer] = useState<Record<string, number | null>>({});

  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [activeQuestion, setActiveQuestion] = useState<{ stickerId: string | null; text: string }>({ stickerId: null, text: '' });

  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressTimer = useRef<NodeJS.Timeout>();

  const STORY_DURATION = 5000; // 5 seconds per story

  const currentStory = stories[currentIndex];
  // Determine if it's my story
  const isOwnStory = user?.userId === currentStory?.userId;

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => StatusBar.setHidden(false);
  }, []);

  useEffect(() => {
    startProgressTimer();
    markStoryAsViewed();
    loadWidgetData();
    onStoryChange?.(currentIndex);

    return () => {
      if (progressTimer.current) {
        clearTimeout(progressTimer.current);
      }
    };
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused) {
      pauseProgress();
    } else {
      resumeProgress();
    }
  }, [isPaused]);

  // Load interaction data for the current story
  const loadWidgetData = async () => {
    if (!currentStory || !user) return;

    // Normalize stickers to get IDs
    const stickers = getNormalizedStickers();

    // Load data for each sticker type
    stickers.forEach(async (sticker) => {
      if (sticker.type === 'poll') {
        // In a real app, we'd batch this or load from story aggregates
        // For now, load individually or rely on optimized service methods
        const res = await storyService.getPollResults(currentStory.storyId, sticker.id);
        setPollResults(prev => ({ ...prev, [sticker.id]: res }));
        // Ensure we check if user voted (requires a service method or checking local cache/collection)
        // For optimisic UI, we start null. Real implementation needs 'getUserPollVote'
      } else if (sticker.type === 'slider') {
        const stats = await storyService.getSliderStats(currentStory.storyId, sticker.id);
        setSliderStats(prev => ({ ...prev, [sticker.id]: stats }));
      } else if (sticker.type === 'quiz') {
        const res = await storyService.getPollResults(currentStory.storyId, sticker.id); // Quiz uses same storage structure often
        setQuizResults(prev => ({ ...prev, [sticker.id]: res }));
      } else if (sticker.type === 'question') {
        const count = await storyService.getQuestionReplyCount(currentStory.storyId, sticker.id);
        setQuestionCounts(prev => ({ ...prev, [sticker.id]: count }));
      }
    });
  };

  const startProgressTimer = () => {
    progressAnim.setValue(0);
    setProgress(0);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isPaused) {
        goToNextStory();
      }
    });
  };

  const pauseProgress = () => {
    progressAnim.stopAnimation((value) => {
      setProgress(value);
    });
  };

  const resumeProgress = () => {
    const remainingDuration = (1 - progress) * STORY_DURATION;

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingDuration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isPaused) {
        goToNextStory();
      }
    });
  };

  const markStoryAsViewed = async () => {
    if (!user || currentStory.isViewed) return;

    try {
      await storyService.viewStory(currentStory.storyId, user.userId);
    } catch (error) {
      console.error('Failed to mark story as viewed:', error);
    }
  };

  const goToNextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const goToPreviousStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      onClose();
    }
  };

  const handleTap = (event: any) => {
    // If active question input is open, don't navigate
    if (activeQuestion.stickerId) return;

    const { locationX } = event.nativeEvent;
    const tapZone = width / 3;

    if (locationX < tapZone) {
      goToPreviousStory();
    } else if (locationX > width - tapZone) {
      goToNextStory();
    } else {
      setIsPaused(!isPaused);
    }
  };

  const handleLongPress = () => {
    setIsPaused(true);
  };

  const handlePressOut = () => {
    if (!activeQuestion.stickerId) {
      setIsPaused(false);
    }
  };

  const handleReply = () => {
    Alert.alert('Coming Soon', 'Story replies coming soon!');
  };

  const handleShare = () => {
    Alert.alert('Coming Soon', 'Story sharing coming soon!');
  };

  // --- Interaction Handlers ---

  const handlePollVote = async (stickerId: string, optionIndex: number) => {
    if (!user) return;
    // Optimistic update
    setMyPollVote(prev => ({ ...prev, [stickerId]: optionIndex }));
    setPollResults(prev => {
      const w = prev[stickerId] || { counts: [], total: 0 };
      const newCounts = [...w.counts];
      newCounts[optionIndex] = (newCounts[optionIndex] || 0) + 1;
      return { ...prev, [stickerId]: { counts: newCounts, total: w.total + 1 } };
    });

    try {
      await storyService.submitPollVote(currentStory.storyId, stickerId, user.userId, optionIndex);
    } catch (e) {
      console.error("Poll vote failed", e);
      // Revert TODO
    }
  };

  const handleSliderSet = (stickerId: string, value: number) => {
    if (!user) return;
    // Set local value immediately to show thumb position
    setMySliderValue(prev => ({ ...prev, [stickerId]: value }));
    // We don't submit immediately, typically we wait for release, 
    // but StoryOverlayRenderer calls this onResponderRelease.

    // Update stats optimistically (simple avg update approximation)
    setSliderStats(prev => {
      const s = prev[stickerId] || { avg: 0.5, count: 0 };
      const newCount = s.count + 1;
      const newAvg = (s.avg * s.count + value) / newCount;
      return { ...prev, [stickerId]: { avg: newAvg, count: newCount } };
    });

    storyService.submitSliderValue(currentStory.storyId, stickerId, user.userId, value);
  };

  const handleSliderLayout = (stickerId: string, w: number) => {
    setSliderWidths(prev => ({ ...prev, [stickerId]: w }));
  };

  const handleQuizAnswer = async (stickerId: string, optionIndex: number) => {
    if (!user) return;
    setMyQuizAnswer(prev => ({ ...prev, [stickerId]: optionIndex }));
    setQuizResults(prev => {
      const w = prev[stickerId] || { counts: [], total: 0 };
      const newCounts = [...w.counts];
      newCounts[optionIndex] = (newCounts[optionIndex] || 0) + 1;
      return { ...prev, [stickerId]: { counts: newCounts, total: w.total + 1 } };
    });
    // Use submitPollVote/Quiz logic
    // storyService.submitQuizAnswer(currentStory.storyId, stickerId, user.userId, optionIndex);
  };

  const handleQuestionPress = (stickerId: string) => {
    setIsPaused(true);
    setActiveQuestion({ stickerId, text: '' });
  };

  const handleQuestionSubmit = async (stickerId: string) => {
    if (!user || !activeQuestion.text.trim()) return;
    const text = activeQuestion.text;
    setActiveQuestion({ stickerId: null, text: '' });
    setIsPaused(false);

    // Optimistic
    setQuestionCounts(prev => ({ ...prev, [stickerId]: (prev[stickerId] || 0) + 1 }));

    try {
      await storyService.submitQuestionReply(currentStory.storyId, stickerId, user.userId, text);
    } catch {
      Alert.alert("Error", "Failed to send reply");
    }
  };

  const getNormalizedStickers = (): OverlaySticker[] => {
    if (currentStory.stickers && currentStory.stickers.length > 0) {
      return currentStory.stickers;
    }
    // Fallback: map from interactiveElements
    if (currentStory.interactiveElements) {
      return currentStory.interactiveElements.map(el => ({
        id: el.id,
        type: el.type as any,
        content: el.data,
        x: el.x,
        y: el.y,
        // Assume default sizes for legacy data if needed, but usually data has it
      }));
    }
    return [];
  };

  const getNormalizedText = (): OverlayTextElement[] => {
    return currentStory.textElements || [];
  };

  const getNormalizedDrawings = (): OverlayDrawing[] => {
    return currentStory.drawings || [];
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'now';
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  return (
    <View style={styles.container}>
      {/* Progress bars */}
      <View style={styles.progressContainer}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground} />
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: index === currentIndex
                    ? progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    })
                    : index < currentIndex ? '100%' : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Story header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar
            source={currentStory.avatarURL}
            size={32}
            fallbackText={currentStory.displayName}
          />
          <View style={styles.userDetails}>
            <View style={styles.userNameRow}>
              <Text style={styles.username}>{currentStory.username}</Text>
              {currentStory.verified && (
                <VerifiedBadge size={14} />
              )}
            </View>
            <Text style={styles.timeAgo}>
              {formatTimeAgo(currentStory.createdAt)}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Story content */}
      <View style={styles.storyContent}>
        <StoryRenderer
          mediaURL={currentStory.mediaURL}
          mediaType={currentStory.mediaType}
          textElements={getNormalizedText() as any}
          stickers={getNormalizedStickers() as any}
          drawings={getNormalizedDrawings() as any}
          // Add other props as needed if StoryRenderer supports them (e.g. filters)

          onInteraction={(data) => {
            if (data.type === 'tap') {
              const { x, width: w } = data;
              // Map WebView x to Screen x logic
              if (x < w / 3) goToPreviousStory();
              else if (x > w * 2 / 3) goToNextStory();
              else setIsPaused(!isPaused);
            }
            else if (data.type === 'poll_vote') {
              handlePollVote(data.id, data.optionIndex);
            }
            else if (data.type === 'slider_change') {
              handleSliderSet(data.id, data.value);
            }
          }}
          onLoad={() => { }}
          onError={() => { }}
        />
      </View>

      {/* Story actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
          <Ionicons name="chatbubble-outline" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="paper-plane-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Pause indicator */}
      {isPaused && !activeQuestion.stickerId && (
        <View style={styles.pauseIndicator}>
          <Ionicons name="pause" size={48} color="white" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingTop: 50,
    gap: spacing.xs,
    zIndex: 100,
  },
  progressBarContainer: {
    flex: 1,
    height: 2,
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 1,
    opacity: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    zIndex: 100,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userDetails: {
    gap: 2,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  username: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: 'white',
  },
  timeAgo: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  closeButton: {
    padding: spacing.sm,
  },
  storyContent: {
    flex: 1,
  },
  storyImageContainer: {
    flex: 1,
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 90, // below interactions
    pointerEvents: 'none',
  },
  caption: {
    fontSize: typography.fontSize.base,
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 50,
    right: spacing.lg,
    gap: spacing.md,
    zIndex: 100,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }] as const,
    zIndex: 150,
  },
});
