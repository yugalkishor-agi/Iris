import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { liveStreamService } from '../../services/liveStream.service';
import { FlashList } from '@shopify/flash-list';

const { width, height } = Dimensions.get('window');

interface LiveStreamViewerProps {
  streamId: string;
  streamerInfo: {
    userId: string;
    username: string;
    displayName: string;
    avatarURL: string;
    verified?: boolean;
  };
  onClose: () => void;
}

interface LiveComment {
  id: string;
  userId: string;
  username: string;
  avatarURL: string;
  text: string;
  timestamp: number;
  isSuper?: boolean;
  amount?: number;
}

interface LiveReaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
  timestamp: number;
}

export function LiveStreamViewer({ streamId, streamerInfo, onClose }: LiveStreamViewerProps) {
  const { user } = useAuth();
  const [isLive, setIsLive] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [reactions, setReactions] = useState<LiveReaction[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [streamStats, setStreamStats] = useState({
    duration: 0,
    likes: 0,
    shares: 0,
  });

  const commentsRef = useRef<FlashList<any>>(null);
  const controlsTimer = useRef<NodeJS.Timeout>();
  const heartAnimations = useRef<Animated.Value[]>([]);

  useEffect(() => {
    // Initialize live stream connection
    connectToStream();
    startStatsTimer();
    
    return () => {
      disconnectFromStream();
    };
  }, [streamId]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    if (showControls) {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
      controlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, [showControls]);

  const connectToStream = async () => {
    try {
      // Connect to live stream service
      await liveStreamService.joinStream(streamId, user?.userId || '');
      
      // Listen for real-time updates
      liveStreamService.onViewerCountUpdate((count) => {
        setViewerCount(count);
      });
      
      liveStreamService.onNewComment((comment) => {
        setComments(prev => [...prev, comment].slice(-50)); // Keep last 50 comments
        // Auto-scroll to bottom
        setTimeout(() => {
          commentsRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
      
      liveStreamService.onNewReaction((reaction) => {
        addReactionAnimation(reaction);
      });
      
      liveStreamService.onStreamEnd(() => {
        setIsLive(false);
        Alert.alert('Stream Ended', 'This live stream has ended.');
      });
      
    } catch (error) {
      console.error('Failed to connect to stream:', error);
      Alert.alert('Error', 'Failed to connect to live stream');
    }
  };

  const disconnectFromStream = async () => {
    try {
      await liveStreamService.leaveStream(streamId, user?.userId || '');
    } catch (error) {
      console.error('Failed to disconnect from stream:', error);
    }
  };

  const startStatsTimer = () => {
    const interval = setInterval(() => {
      setStreamStats(prev => ({
        ...prev,
        duration: prev.duration + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  };

  const addReactionAnimation = (reaction: LiveReaction) => {
    setReactions(prev => [...prev, reaction]);
    
    // Create floating animation
    const animValue = new Animated.Value(0);
    heartAnimations.current.push(animValue);
    
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Remove reaction after animation
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
      heartAnimations.current = heartAnimations.current.filter(anim => anim !== animValue);
    });
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !user) return;

    try {
      const comment: LiveComment = {
        id: Date.now().toString(),
        userId: user.userId,
        username: user.username,
        avatarURL: user.avatarURL || '',
        text: commentText.trim(),
        timestamp: Date.now(),
      };

      await liveStreamService.sendComment(streamId, comment);
      setCommentText('');
    } catch (error) {
      console.error('Failed to send comment:', error);
      Alert.alert('Error', 'Failed to send comment');
    }
  };

  const handleSendReaction = async (emoji: string) => {
    if (!user) return;

    try {
      const reaction: LiveReaction = {
        id: Date.now().toString(),
        emoji,
        x: Math.random() * (width - 50),
        y: height * 0.7,
        timestamp: Date.now(),
      };

      await liveStreamService.sendReaction(streamId, reaction);
      addReactionAnimation(reaction);
    } catch (error) {
      console.error('Failed to send reaction:', error);
    }
  };

  const handleFollow = async () => {
    if (!user) return;

    try {
      if (isFollowing) {
        await liveStreamService.unfollowStreamer(user.userId, streamerInfo.userId);
      } else {
        await liveStreamService.followStreamer(user.userId, streamerInfo.userId);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    }
  };

  const handleShare = () => {
    Alert.alert('Coming Soon', 'Live stream sharing coming soon!');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderComment = ({ item }: { item: LiveComment }) => (
    <View style={[styles.commentItem, item.isSuper && styles.superComment]}>
      <Avatar source={item.avatarURL} size={20} fallbackText={item.username} />
      <View style={styles.commentContent}>
        <Text style={styles.commentUsername}>{item.username}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
        {item.isSuper && (
          <Text style={styles.superAmount}>${item.amount}</Text>
        )}
      </View>
    </View>
  );

  const renderReaction = (reaction: LiveReaction, index: number) => {
    const animValue = heartAnimations.current[index] || new Animated.Value(0);
    
    return (
      <Animated.View
        key={reaction.id}
        style={[
          styles.reactionAnimation,
          {
            left: reaction.x,
            bottom: reaction.y,
            opacity: animValue,
            transform: [
              {
                translateY: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -200],
                }),
              },
              {
                scale: animValue.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1.2, 0.8],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Live Stream Video Area */}
      <TouchableOpacity 
        style={styles.videoContainer}
        onPress={() => setShowControls(!showControls)}
        activeOpacity={1}
      >
        <View style={styles.videoPlaceholder}>
          <Ionicons name="videocam" size={48} color="white" />
          <Text style={styles.videoPlaceholderText}>Live Stream</Text>
        </View>

        {/* Floating Reactions */}
        {reactions.map(renderReaction)}
      </TouchableOpacity>

      {/* Top Controls */}
      {showControls && (
        <View style={styles.topControls}>
          <TouchableOpacity onPress={onClose} style={styles.controlButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.streamInfo}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.viewerCount}>{viewerCount.toLocaleString()} viewers</Text>
            <Text style={styles.duration}>{formatDuration(streamStats.duration)}</Text>
          </View>

          <TouchableOpacity onPress={handleShare} style={styles.controlButton}>
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Streamer Info */}
      <View style={styles.streamerInfo}>
        <Avatar 
          source={streamerInfo.avatarURL} 
          size={40} 
          fallbackText={streamerInfo.displayName} 
        />
        <View style={styles.streamerDetails}>
          <View style={styles.streamerNameRow}>
            <Text style={styles.streamerName}>{streamerInfo.displayName}</Text>
            {streamerInfo.verified && (
              <VerifiedBadge size={16} />
            )}
          </View>
          <Text style={styles.streamerUsername}>@{streamerInfo.username}</Text>
        </View>

        {user?.userId !== streamerInfo.userId && (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleFollow}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <FlashList estimatedItemSize={100}
          ref={commentsRef}
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          style={styles.commentsList}
          showsVerticalScrollIndicator={false}
          inverted={false}
        />
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Reaction Buttons */}
        <View style={styles.reactionButtons}>
          {['❤️', '😂', '😍', '👏', '🔥'].map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.reactionButton}
              onPress={() => handleSendReaction(emoji)}
            >
              <Text style={styles.reactionButtonEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor={colors.text.secondary}
            value={commentText}
            onChangeText={setCommentText}
            returnKeyType="send"
            onSubmitEditing={handleSendComment}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !commentText.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleSendComment}
            disabled={!commentText.trim()}
          >
            <Ionicons name="send" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stream Stats */}
      <View style={styles.streamStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={16} color="#ef4444" />
          <Text style={styles.statText}>{streamStats.likes.toLocaleString()}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="share-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.statText}>{streamStats.shares.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  videoPlaceholderText: {
    color: 'white',
    fontSize: typography.fontSize.lg,
    marginTop: spacing.md,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 100,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamInfo: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  liveText: {
    color: 'white',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as any,
  },
  viewerCount: {
    color: 'white',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  duration: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.fontSize.xs,
  },
  streamerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.8)',
    gap: spacing.md,
  },
  streamerDetails: {
    flex: 1,
  },
  streamerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streamerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: 'white',
  },
  streamerUsername: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  followButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  followButtonText: {
    color: 'white',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  followingButtonText: {
    color: 'rgba(255,255,255,0.7)',
  },
  commentsSection: {
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  commentsList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  superComment: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: 'white',
  },
  commentText: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  superAmount: {
    fontSize: typography.fontSize.xs,
    color: '#FFD700',
    fontWeight: typography.fontWeight.bold as any,
  },
  bottomControls: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: 34, // Safe area
  },
  reactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionButtonEmoji: {
    fontSize: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: 'white',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  streamStats: {
    position: 'absolute',
    bottom: 120,
    right: spacing.lg,
    gap: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statText: {
    color: 'white',
    fontSize: typography.fontSize.xs,
  },
  reactionAnimation: {
    position: 'absolute',
    zIndex: 50,
  },
  reactionEmoji: {
    fontSize: 24,
  },
});
