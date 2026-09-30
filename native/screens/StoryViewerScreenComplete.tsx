import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  Share,
  Animated,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { storyService } from '../services/story.service';
import { userService } from '../services/user.service';
import { messageService } from '../services/message.service';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

interface ViewerStory {
  storyId: string;
  authorId: string;
  authorUsername: string;
  authorAvatarURL?: string;
  authorVerified?: boolean;
  mediaURL: string;
  mediaType: 'image' | 'video';
  duration?: number;
  textOverlay?: {
    text: string;
    position: { x: number; y: number };
    fontSize: number;
    color: string;
  };
  backgroundMusic?: {
    trackTitle: string;
    artistName: string;
  };
  audience: 'public' | 'followers' | 'closeFriends';
  viewsCount: number;
  likesCount: number;
  repliesCount: number;
  createdAt: any;
  expiresAt: any;
  isLiked?: boolean;
  hasViewed?: boolean;
}

export default function StoryViewerScreenComplete() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const storyId = (route.params as any)?.storyId;
  const stories = (route.params as any)?.stories || [];
  const initialIndex = (route.params as any)?.index || 0;

  // State
  const adaptStory = (s: any): ViewerStory => ({
    storyId: s.storyId,
    authorId: s.authorId,
    authorUsername: s.authorUsername,
    authorAvatarURL: s.authorAvatarURL,
    authorVerified: s.authorVerified ?? false,
    mediaURL: s.mediaURL,
    mediaType: s.mediaType,
    duration: typeof s.duration === 'number' ? s.duration : 5,
    textOverlay: s.textOverlay,
    backgroundMusic: s.backgroundMusic,
    audience: s.audience ?? 'public',
    viewsCount: (s.stats?.viewsCount ?? s.viewsCount) || 0,
    likesCount: (s.stats?.likesCount ?? s.likesCount) || 0,
    repliesCount: (s.stats?.repliesCount ?? s.repliesCount) || 0,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    isLiked: s.isLiked ?? false,
    hasViewed: s.hasViewed ?? false,
  });

  const initialStories = Array.isArray(stories) ? (stories as any[]).map(adaptStory) : [];
  const [currentStories, setCurrentStories] = useState<ViewerStory[]>(initialStories);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(!stories.length);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  // Progress and timing
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const storyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs
  const videoRef = useRef<Video>(null);
  const replyInputRef = useRef<TextInput>(null);

  // Load story if not provided
  useEffect(() => {
    if (!currentStories.length && storyId) {
      loadStory();
    }
  }, [storyId]);

  // Initialize story progress
  useEffect(() => {
    if (currentStories.length > 0) {
      startStoryProgress();
      markStoryAsViewed();
    }
  }, [currentIndex, currentStories]);

  // Focus effect
  useFocusEffect(
    useCallback(() => {
      setPaused(false);
      startStoryProgress();
      return () => {
        setPaused(true);
        stopStoryProgress();
      };
    }, [currentIndex])
  );

  const loadStory = async () => {
    if (!storyId) return;
    
    try {
      setLoading(true);
      const story = await storyService.getStory(storyId);
      if (story) {
        setCurrentStories([adaptStory(story as any)]);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Failed to load story:', error);
      Alert.alert('Error', 'Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const startStoryProgress = () => {
    if (paused || !currentStories[currentIndex]) return;
    
    stopStoryProgress();
    
    const currentStory = currentStories[currentIndex];
    const duration = currentStory.mediaType === 'video'
      ? ((currentStory.duration ?? 5) * 1000)
      : 5000;
    
    progressAnim.setValue(0);
    
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished && !paused) {
        handleNextStory();
      }
    });

    // Listen to progress
    const listener = progressAnim.addListener(({ value }) => {
      setProgress(value);
    });

    return () => {
      progressAnim.removeListener(listener);
      animation.stop();
    };
  };

  const stopStoryProgress = () => {
    progressAnim.stopAnimation();
    if (storyTimer.current) {
      clearTimeout(storyTimer.current);
    }
  };

  const markStoryAsViewed = async () => {
    const currentStory = currentStories[currentIndex];
    if (!currentStory || !user || currentStory.hasViewed) return;

    try {
      await storyService.viewStory(currentStory.storyId, user.userId);
      
      // Update local state
      setCurrentStories(prev => prev.map((story, index) => 
        index === currentIndex 
          ? { ...story, hasViewed: true, viewsCount: story.viewsCount + 1 }
          : story
      ));
    } catch (error) {
      console.error('Failed to mark story as viewed:', error);
    }
  };

  const handleTap = (event: any) => {
    const { locationX } = event.nativeEvent;
    const tapZone = width / 3;

    if (locationX < tapZone) {
      // Left tap - previous story
      handlePreviousStory();
    } else if (locationX > width - tapZone) {
      // Right tap - next story
      handleNextStory();
    } else {
      // Center tap - pause/play
      setPaused(!paused);
    }
  };

  const handleLongPress = () => {
    setPaused(true);
  };

  const handlePressOut = () => {
    setPaused(false);
  };

  const handlePreviousStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleNextStory = () => {
    if (currentIndex < currentStories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.goBack();
    }
  };

  const handleLike = async () => {
    const currentStory = currentStories[currentIndex];
    if (!currentStory || !user) return;

    const isCurrentlyLiked = liked[currentStory.storyId];
    
    try {
      if (isCurrentlyLiked) {
        await storyService.unlikeStory(currentStory.storyId, user.userId);
      } else {
        await storyService.likeStory(currentStory.storyId, user.userId);
      }
      
      setLiked(prev => ({
        ...prev,
        [currentStory.storyId]: !isCurrentlyLiked
      }));
      
      // Update story stats
      setCurrentStories(prev => prev.map((story, index) => 
        index === currentIndex
          ? {
              ...story,
              likesCount: story.likesCount + (isCurrentlyLiked ? -1 : 1)
            }
          : story
      ));
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleReply = () => {
    setShowReplyInput(true);
    setTimeout(() => {
      replyInputRef.current?.focus();
    }, 100);
  };

  const sendReply = async () => {
    const currentStory = currentStories[currentIndex];
    if (!currentStory || !user || !replyText.trim()) return;

    try {
      // Send story reply as DM
      const conversationId = await messageService.getOrCreateDirectConversation(
        user.userId,
        currentStory.authorId
      );

      await messageService.sendMessage(conversationId, {
        senderId: user.userId,
        senderUsername: user.username,
        senderAvatarURL: user.avatarURL,
        type: 'story_reply',
        text: replyText,
        storyReply: {
          storyId: currentStory.storyId,
          mediaURL: currentStory.mediaURL,
          authorUsername: currentStory.authorUsername,
          authorAvatar: currentStory.authorAvatarURL,
          authorVerified: currentStory.authorVerified,
        },
      });

      setReplyText('');
      setShowReplyInput(false);
      
      Alert.alert('Reply Sent', 'Your reply has been sent as a message.');
    } catch (error) {
      console.error('Failed to send reply:', error);
      Alert.alert('Error', 'Failed to send reply');
    }
  };

  const handleShare = async () => {
    const currentStory = currentStories[currentIndex];
    if (!currentStory) return;

    try {
      await Share.share({
        message: `Check out this story by @${currentStory.authorUsername}`,
        url: `https://iris.app/story/${currentStory.storyId}`,
      });
    } catch (error) {
      console.error('Failed to share story:', error);
    }
  };

  const handleProfilePress = () => {
    const currentStory = currentStories[currentIndex];
    if (!currentStory) return;
    
    (navigation as any).navigate('UserProfile', {
      userId: currentStory.authorId
    });
  };

  const renderStory = () => {
    const currentStory = currentStories[currentIndex];
    if (!currentStory) return null;

    return (
      <View style={styles.storyContainer}>
        {currentStory.mediaType === 'video' ? (
          <Video
            ref={videoRef}
            source={{ uri: currentStory.mediaURL }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay={!paused}
            isLooping={false}
            isMuted={muted}
            onPlaybackStatusUpdate={(status: any) => {
              if (status.didJustFinish) {
                handleNextStory();
              }
            }}
          />
        ) : (
          <Image
            source={{ uri: currentStory.mediaURL }}
            style={styles.media}
            contentFit="cover"
          />
        )}

        {/* Text overlay */}
        {currentStory.textOverlay && (
          <View
            style={[
              styles.textOverlay,
              {
                left: currentStory.textOverlay.position.x,
                top: currentStory.textOverlay.position.y,
              },
            ]}
          >
            <Text
              style={[
                styles.overlayText,
                {
                  fontSize: currentStory.textOverlay.fontSize,
                  color: currentStory.textOverlay.color,
                },
              ]}
            >
              {currentStory.textOverlay.text}
            </Text>
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.5)']}
          style={styles.gradient}
        />
      </View>
    );
  };

  const renderProgressBars = () => {
    return (
      <View style={styles.progressContainer}>
        {currentStories.map((_, index) => (
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
    );
  };

  const renderUI = () => {
    const currentStory = currentStories[currentIndex];
    if (!currentStory) return null;

    return (
      <View style={styles.uiContainer}>
        {/* Top UI */}
        <View style={styles.topUI}>
          {renderProgressBars()}
          
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.userInfo}
              onPress={handleProfilePress}
            >
              <Avatar
                source={currentStory.authorAvatarURL}
                size={32}
                style={styles.avatar}
              />
              <View style={styles.userDetails}>
                <View style={styles.usernameContainer}>
                  <Text style={styles.username}>
                    {currentStory.authorUsername}
                  </Text>
                  {currentStory.authorVerified && (
                    <VerifiedBadge size={14} />
                  )}
                </View>
                <Text style={styles.timeAgo}>2h ago</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setMuted(!muted)}
              >
                <Ionicons 
                  name={muted ? "volume-mute" : "volume-high"} 
                  size={20} 
                  color="white" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom UI */}
        <View style={styles.bottomUI}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLike}
            >
              <Ionicons
                name={liked[currentStory.storyId] ? "heart" : "heart-outline"}
                size={28}
                color={liked[currentStory.storyId] ? "#FF3B30" : "white"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleReply}
            >
              <Ionicons name="chatbubble-outline" size={26} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Ionicons name="paper-plane-outline" size={26} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading story...</Text>
      </View>
    );
  }

  if (!currentStories.length) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="time-outline" size={64} color="#8E8E93" />
        <Text style={styles.errorTitle}>Story not available</Text>
        <Text style={styles.errorMessage}>
          This story may have expired or been deleted.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <TouchableWithoutFeedback
        onPress={handleTap}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
      >
        <View style={styles.storyWrapper}>
          {renderStory()}
          {renderUI()}
        </View>
      </TouchableWithoutFeedback>

      {/* Reply Input */}
      {showReplyInput && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.replyContainer}
        >
          <View style={styles.replyInputContainer}>
            <TextInput
              ref={replyInputRef}
              style={styles.replyInput}
              placeholder="Reply to story..."
              placeholderTextColor="#8E8E93"
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { opacity: replyText.trim() ? 1 : 0.5 }
              ]}
              onPress={sendReply}
              disabled={!replyText.trim()}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  storyWrapper: {
    flex: 1,
  },
  storyContainer: {
    flex: 1,
    position: 'relative',
  },
  media: {
    width: width,
    height: height,
  },
  textOverlay: {
    position: 'absolute',
    padding: 8,
  },
  overlayText: {
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  uiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topUI: {
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 4,
  },
  progressBarContainer: {
    flex: 1,
    height: 2,
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
  },
  progressBarFill: {
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 8,
  },
  userDetails: {
    flex: 1,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  bottomUI: {
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    padding: 12,
  },
  replyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: 40,
  },
  replyInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
