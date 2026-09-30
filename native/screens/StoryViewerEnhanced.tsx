import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, SafeAreaView, StatusBar, Animated, Alert, Modal, ActivityIndicator, PanResponder, Keyboard, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { storyService } from '../services/story.service';
import { userService } from '../services/user.service';
import { Avatar } from '../components/ui/Avatar';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

interface StoryUser {
  userId: string;
  username: string;
  avatarURL?: string;
  stories: any[];
  hasActiveStory: boolean;
}

interface StoryViewerProps {
  route: {
    params: {
      userId: string;
      allUsers: StoryUser[];
      initialIndex?: number;
    };
  };
  navigation: any;
}

export default function StoryViewerEnhanced({ route, navigation }: StoryViewerProps) {
  const { userId, allUsers, initialIndex = 0 } = route.params;
  const { user: authUser } = useAuth();
  
  // Find initial user and story indices
  const initialUserIndex = allUsers.findIndex(u => u.userId === userId);
  
  // State
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [viewers, setViewers] = useState<any[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  
  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const currentUserData = allUsers[currentUserIndex];
  const currentStory = currentUserData?.stories[currentStoryIndex];
  const isOwnStory = authUser?.userId === currentUserData?.userId;

  // Progress animation
  useEffect(() => {
    if (isPaused || !currentStory) return;

    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        nextStory();
      }
    });

    return () => animation.stop();
  }, [currentStoryIndex, currentUserIndex, isPaused]);

  // Reset progress when story changes
  useEffect(() => {
    progressAnim.setValue(0);
    setProgress(0);
  }, [currentStoryIndex, currentUserIndex]);

  // Mark story as viewed
  useEffect(() => {
    const markAsViewed = async () => {
      if (!currentStory || !authUser) return;
      try {
        await storyService.viewStory(currentStory.storyId, authUser.userId);
      } catch (error) {
        console.error('Failed to mark story as viewed:', error);
      }
    };

    markAsViewed();
  }, [currentStory, authUser]);

  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 10 || Math.abs(gestureState.dx) > 10;
    },
    onPanResponderGrant: () => {
      setIsPaused(true);
    },
    onPanResponderMove: (_, gestureState) => {
      // Vertical swipe to close
      if (gestureState.dy > 0) {
        swipeAnim.setValue(gestureState.dy);
        scaleAnim.setValue(1 - gestureState.dy / 1000);
      }
      // Horizontal swipe for navigation
      if (Math.abs(gestureState.dx) > 50) {
        if (gestureState.dx > 0) {
          // Swipe right - previous story
          prevStory();
        } else {
          // Swipe left - next story
          nextStory();
        }
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      setIsPaused(false);
      
      if (gestureState.dy > 100) {
        // Close story viewer
        navigation.goBack();
      } else {
        // Reset animations
        Animated.parallel([
          Animated.spring(swipeAnim, { toValue: 0, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        ]).start();
      }
    },
  });

  const nextStory = () => {
    if (currentStoryIndex < currentUserData.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentUserIndex < allUsers.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      navigation.goBack();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      const prevUser = allUsers[currentUserIndex - 1];
      setCurrentStoryIndex(prevUser.stories.length - 1);
    }
  };

  const handleTap = (event: any) => {
    const { locationX } = event.nativeEvent;
    const threshold = width / 3;

    if (locationX < threshold) {
      prevStory();
    } else if (locationX > threshold * 2) {
      nextStory();
    } else {
      setIsPaused(!isPaused);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !authUser) return;

    try {
      // Save reply to story
      await storyService.replyToStory(currentStory.storyId, authUser.userId, replyText);
      
      Alert.alert('Reply Sent', `Your reply to ${currentUserData.username}'s story has been sent`);
      setReplyText('');
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert('Error', 'Failed to send reply');
    }
  };

  const handleEmojiReaction = async (emoji: string) => {
    try {
      // Placeholder: treat emoji reaction as a like action
      if (authUser?.userId) {
        await storyService.likeStory(currentStory.storyId, authUser.userId);
      }
      Alert.alert('Reaction Sent', `You reacted with ${emoji}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send reaction');
    }
  };

  const handleShare = async () => {
    try {
      const title = currentUserData?.username ? `Story by ${currentUserData.username}` : 'Story';
      const url = currentStory?.mediaURL || '';
      const message = `${title}${url ? `\n${url}` : ''}`;
      await Share.share({ message, url });
    } catch {}
  };

  const handleDeleteStory = async () => {
    if (!authUser || !currentStory) return;
    try {
      await storyService.deleteStory(currentStory.storyId, authUser.userId);
      Alert.alert('Deleted', 'Story deleted successfully');
      navigation.goBack();
    } catch {}
  };

  const loadViewers = async () => {
    if (!isOwnStory || !currentStory) return;
    
    setLoadingViewers(true);
    try {
      const viewerIds = await storyService.getStoryViews(currentStory.storyId);
      const viewerData = await Promise.all(
        viewerIds.map(id => userService.getUser(id))
      );
      setViewers(viewerData.filter(v => v !== null));
    } catch (error) {
      console.error('Failed to load viewers:', error);
    } finally {
      setLoadingViewers(false);
    }
  };

  const emojis = ['❤️', '😂', '😮', '😢', '😡', '👍'];

  if (!currentUserData || !currentStory) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <Animated.View
        style={[
          styles.storyContainer,
          {
            transform: [
              { translateY: swipeAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Progress Bars */}
        <View style={styles.progressContainer}>
          {currentUserData.stories.map((_, index) => (
            <View key={index} style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', index === currentStoryIndex ? '100%' : index < currentStoryIndex ? '100%' : '0%'],
                    }),
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
              source={currentUserData.avatarURL || null}
              size={40}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.username}>{currentUserData.username}</Text>
              <Text style={styles.timestamp}>
                {currentStory.createdAt ? new Date(currentStory.createdAt.toDate()).toLocaleTimeString() : ''}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.actionButton}>
              <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.actionButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Story Content */}
        <TouchableOpacity
          style={styles.storyContent}
          onPress={handleTap}
          activeOpacity={1}
        >
          <Image
            source={{ uri: currentStory.mediaURL }}
            style={styles.storyImage}
            contentFit="contain"
          />
        </TouchableOpacity>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {isOwnStory ? (
            <View style={styles.ownBottomBar}>
              <TouchableOpacity
                onPress={() => {
                  setShowViewers(true);
                  loadViewers();
                }}
                style={styles.viewsButton}
              >
                <Ionicons name="eye" size={16} color="#FFFFFF" />
                <Text style={styles.viewsText}>{currentStory.viewsCount || 0} views</Text>
              </TouchableOpacity>

              <View style={styles.ownActionsRow}>
                <TouchableOpacity onPress={handleShare} style={styles.ownAction}>
                  <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.ownActionText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert('Added to Highlights')} style={styles.ownAction}>
                  <Ionicons name="bookmark-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.ownActionText}>Highlight</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert('More', '', [
                      { text: 'View Insights', onPress: () => { setShowViewers(true); loadViewers(); } },
                      { text: 'Delete Story', style: 'destructive', onPress: handleDeleteStory },
                      { text: 'Cancel', style: 'cancel' },
                    ])
                  }
                  style={styles.ownAction}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
                  <Text style={styles.ownActionText}>More</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.emojiContainer}>
                {emojis.map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleEmojiReaction(emoji)}
                    style={styles.emojiButton}
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.replyContainer}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Send message"
                  placeholderTextColor="#FFFFFF80"
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                />
                {replyText.trim() ? (
                  <TouchableOpacity onPress={handleReply} style={styles.sendButton}>
                    <Ionicons name="send" size={20} color="#000000" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => handleEmojiReaction('❤️')} style={styles.heartButton}>
                    <Ionicons name="heart" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </Animated.View>

      {/* Viewers Modal */}
      <Modal visible={showViewers} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.viewersModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Viewers ({viewers.length})</Text>
              <TouchableOpacity onPress={() => setShowViewers(false)}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            
            {loadingViewers ? (
              <ActivityIndicator size="large" color="#007AFF" style={styles.modalLoader} />
            ) : (
              <FlashList estimatedItemSize={100}
                data={viewers}
                keyExtractor={(item) => item.userId}
                renderItem={({ item }) => (
                  <View style={styles.viewerItem}>
                    <Avatar
                      source={item.avatarURL || null}
                      size={44}
                    />
                    <View style={styles.viewerInfo}>
                      <Text style={styles.viewerName}>{item.username}</Text>
                      <Text style={styles.viewerTime}>Viewed recently</Text>
                    </View>
                  </View>
                )}
                style={styles.viewersList}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  storyContainer: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 4,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  storyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  bottomActions: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  viewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  viewsText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 6,
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  replyInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Own story bottom bar styles
  ownBottomBar: {
    flexDirection: 'column',
    gap: 12,
  },
  ownActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ownAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  ownActionText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  viewersModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalLoader: {
    padding: 32,
  },
  viewersList: {
    flex: 1,
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  viewerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  viewerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  viewerTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
