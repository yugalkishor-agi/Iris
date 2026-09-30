import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/ui/Avatar';
import { colors, spacing, typography } from '../styles/theme';
import { storyService } from '../services/story.service';
import { Image } from 'expo-image';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StoryViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { storyId, userId } = route.params as any;
  const [stories, setStories] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadStories();
  }, [userId]);

  useEffect(() => {
    if (!paused && stories.length > 0) {
      startProgress();
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, paused, stories]);

  const loadStories = async () => {
    try {
      setLoading(true);
      const userStories = await storyService.getUserActiveStories(userId);
      setStories(userStories);
      const initialIndex = userStories.findIndex((s: any) => s.storyId === storyId);
      if (initialIndex !== -1) setCurrentIndex(initialIndex);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const startProgress = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) handleNext();
    });
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => setPaused(true),
    onPanResponderRelease: (_, gesture) => {
      setPaused(false);
      if (gesture.dx > 50) {
        handlePrevious();
      } else if (gesture.dx < -50) {
        handleNext();
      }
    },
  });

  if (loading || stories.length === 0) {
    return <View style={styles.container} />;
  }

  const currentStory = stories[currentIndex];

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Image
        source={{ uri: currentStory.mediaURL }}
        style={styles.storyImage}
        contentFit="cover"
      />

      <View style={styles.overlay}>
        {/* Progress bars */}
        <View style={styles.progressContainer}>
          {stories.map((_, index) => (
            <View key={index} style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width:
                      index < currentIndex
                        ? '100%'
                        : index === currentIndex
                        ? progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          })
                        : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar
              source={currentStory.authorAvatarURL}
              size={36}
              fallbackText={currentStory.authorUsername}
            />
            <View style={styles.userDetails}>
              <Text style={styles.username}>{currentStory.authorUsername}</Text>
              <Text style={styles.time}>
                {getTimeAgo(currentStory.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => setPaused(!paused)}>
              <Ionicons
                name={paused ? 'play' : 'pause'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation areas */}
        <TouchableOpacity
          style={styles.leftArea}
          onPress={handlePrevious}
          activeOpacity={1}
        />
        <TouchableOpacity
          style={styles.rightArea}
          onPress={handleNext}
          activeOpacity={1}
        />
      </View>
    </View>
  );
}

function getTimeAgo(timestamp: any): string {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
    gap: 4,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userDetails: {
    justifyContent: 'center',
  },
  username: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: '#fff',
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  leftArea: {
    position: 'absolute',
    left: 0,
    top: 100,
    bottom: 0,
    width: SCREEN_WIDTH * 0.3,
  },
  rightArea: {
    position: 'absolute',
    right: 0,
    top: 100,
    bottom: 0,
    width: SCREEN_WIDTH * 0.3,
  },
});
