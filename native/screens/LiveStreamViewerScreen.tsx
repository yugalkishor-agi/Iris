import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Dimensions, Alert, SafeAreaView } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { colors, spacing, typography } from '../styles/theme';
import { Avatar } from '../components/ui/Avatar';
import { FlashList } from '@shopify/flash-list';

const { width, height } = Dimensions.get('window');

interface LiveComment {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarURL?: string;
  text: string;
  timestamp: Date;
  isSuper?: boolean;
}

interface LiveStream {
  id: string;
  title: string;
  streamURL: string;
  thumbnailURL?: string;
  streamer: {
    userId: string;
    username: string;
    displayName: string;
    avatarURL?: string;
    verified?: boolean;
  };
  stats: {
    viewersCount: number;
    likesCount: number;
    duration: number;
  };
  isLive: boolean;
  category: string;
  startedAt: Date;
}

export default function LiveStreamViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { streamId } = route.params as any;
  
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const videoRef = useRef<Video>(null);
  const commentsListRef = useRef<FlashList<any>>(null);

  useEffect(() => {
    loadStream();
  }, [streamId]);

  const loadStream = async () => {
    try {
      setLoading(true);
      // No mock data. If a live stream backend exists, fetch it here.
      // Until integrated, show empty state.
      setStream(null);
    } catch (error) {
      console.error('Failed to load stream:', error);
      Alert.alert('Error', 'Failed to load live stream');
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!user || !newComment.trim()) return;
    
    try {
      const comment: LiveComment = {
        id: Date.now().toString(),
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
        avatarURL: user.avatarURL,
        text: newComment.trim(),
        timestamp: new Date(),
      };
      
      setComments(prev => [...prev, comment]);
      setNewComment('');
      
      // Scroll to bottom
      setTimeout(() => {
        commentsListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // In real app, send to live stream service
      console.log('💬 Sent comment:', comment.text);
    } catch (error) {
      console.error('Failed to send comment:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !stream) return;
    
    try {
      if (isFollowing) {
        await userService.unfollowUser(user.userId, stream.streamer.userId);
        setIsFollowing(false);
      } else {
        await userService.followUser(user.userId, stream.streamer.userId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const handleLike = () => {
    if (!stream) return;
    
    setStream(prev => prev ? {
      ...prev,
      stats: {
        ...prev.stats,
        likesCount: prev.stats.likesCount + 1,
      }
    } : null);
  };

  const renderComment = ({ item }: { item: LiveComment }) => (
    <View style={[styles.commentItem, item.isSuper && styles.superComment]}>
      <Avatar source={item.avatarURL} size={24} />
      <View style={styles.commentContent}>
        <Text style={styles.commentText}>
          <Text style={styles.commentUsername}>{item.displayName}</Text>
          <Text style={styles.commentMessage}> {item.text}</Text>
        </Text>
      </View>
      {item.isSuper && (
        <Ionicons name="star" size={16} color="#FFD700" />
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading live stream...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!stream) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="videocam-off-outline" size={48} color="#fff" />
          <Text style={[styles.loadingText, { marginTop: 8 }]}>No active live stream</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Video Stream */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: stream.streamURL }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
        />
        
        {/* Stream Overlay */}
        <View style={styles.streamOverlay}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.streamInfo}>
              <View style={styles.liveIndicator}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <Text style={styles.viewersCount}>
                {formatCount(stream.stats.viewersCount)} watching
              </Text>
            </View>
            
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="paper-plane-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Streamer Info */}
          <View style={styles.streamerInfo}>
            <TouchableOpacity 
              style={styles.streamerProfile}
              onPress={() => (navigation as any).navigate('UserProfile', { userId: stream.streamer.userId })}
            >
              <Avatar source={stream.streamer.avatarURL} size={40} />
              <View style={styles.streamerText}>
                <View style={styles.streamerNameRow}>
                  <Text style={styles.streamerName}>{stream.streamer.displayName}</Text>
                  {stream.streamer.verified && (
                    <VerifiedBadge size={16} />
                  )}
                </View>
                <Text style={styles.streamTitle} numberOfLines={1}>{stream.title}</Text>
              </View>
            </TouchableOpacity>
            
            {stream.streamer.userId !== user?.userId && (
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
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Ionicons name="heart-outline" size={28} color="#fff" />
            <Text style={styles.actionText}>{formatCount(stream.stats.likesCount)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowComments(!showComments)}
          >
            <Ionicons name="chatbubble-outline" size={28} color="#fff" />
            <Text style={styles.actionText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Comments Section */}
      {showComments && (
        <KeyboardAvoidingView 
          style={styles.commentsSection}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <FlashList estimatedItemSize={100}
            ref={commentsListRef}
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            style={styles.commentsList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => commentsListRef.current?.scrollToEnd({ animated: true })}
          />
          
          <View style={styles.commentInput}>
            <TextInput
              style={styles.textInput}
              placeholder="Say something..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={200}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
              onPress={handleSendComment}
              disabled={!newComment.trim()}
            >
              <Ionicons name="paper-plane" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const formatCount = (count: number) => {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: typography.fontSize.base,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  streamOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: spacing.xs,
  },
  streamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: spacing.sm,
  },
  liveIndicator: {
    backgroundColor: '#ff3040',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as any,
  },
  viewersCount: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
  },
  shareButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: spacing.xs,
  },
  streamerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: spacing.md,
    borderRadius: 12,
  },
  streamerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  streamerText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  streamerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streamerName: {
    color: '#fff',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
  },
  streamTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  followButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  followingButtonText: {
    color: 'rgba(255,255,255,0.8)',
  },
  actionButtons: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 25,
    padding: spacing.sm,
  },
  actionText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    marginTop: 4,
    fontWeight: typography.fontWeight.medium as any,
  },
  commentsSection: {
    height: height * 0.4,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: spacing.sm,
    borderRadius: 8,
  },
  superComment: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  commentContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  commentText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  commentUsername: {
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.semibold as any,
  },
  commentMessage: {
    color: '#fff',
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.9)',
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: '#fff',
    fontSize: typography.fontSize.base,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: 20,
    padding: spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

