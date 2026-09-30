import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

interface LiveStream {
  streamId: string;
  title: string;
  streamerUsername: string;
  streamerAvatarURL: string;
  viewerCount: number;
  thumbnailURL: string;
  isLive: boolean;
  category: string;
}

export default function LiveStreamScreenEnhanced() {
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadActiveStreams();
  }, []);

  const loadActiveStreams = async () => {
    try {
      setLoading(true);
      
      // Mock live streams data - in production, this would come from a live streaming service
      const mockStreams: LiveStream[] = [
        {
          streamId: 'stream1',
          title: 'Just chatting with friends!',
          streamerUsername: 'sarah_streams',
          streamerAvatarURL: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
          viewerCount: 1247,
          thumbnailURL: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop',
          isLive: true,
          category: 'Just Chatting',
        },
        {
          streamId: 'stream2',
          title: 'Cooking dinner live!',
          streamerUsername: 'chef_mike',
          streamerAvatarURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          viewerCount: 892,
          thumbnailURL: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop',
          isLive: true,
          category: 'Cooking',
        },
        {
          streamId: 'stream3',
          title: 'Gaming session - Join me!',
          streamerUsername: 'gamer_alex',
          streamerAvatarURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          viewerCount: 2156,
          thumbnailURL: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop',
          isLive: true,
          category: 'Gaming',
        },
      ];

      setActiveStreams(mockStreams);
    } catch (error) {
      console.error('Failed to load streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const startStream = () => {
    Alert.alert(
      'Start Live Stream',
      'Are you ready to go live?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Go Live', 
          onPress: () => {
            setIsStreaming(true);
            // In production, this would initialize the streaming service
            Alert.alert('Live Stream Started', 'You are now live!');
          }
        },
      ]
    );
  };

  const joinStream = (stream: LiveStream) => {
    (navigation as any).navigate('LiveStream', { streamId: stream.streamId });
  };

  const renderStream = ({ item }: { item: LiveStream }) => (
    <TouchableOpacity
      style={styles.streamCard}
      onPress={() => joinStream(item)}
      activeOpacity={0.8}
    >
      <View style={styles.streamThumbnail}>
        <Image source={{ uri: item.thumbnailURL }} style={styles.thumbnailImage} />
        <View style={styles.liveIndicator}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <View style={styles.viewerCount}>
          <Ionicons name="eye" size={12} color="white" />
          <Text style={styles.viewerText}>{item.viewerCount.toLocaleString()}</Text>
        </View>
      </View>
      
      <View style={styles.streamInfo}>
        <View style={styles.streamerInfo}>
          <Avatar source={item.streamerAvatarURL} size={32} />
          <View style={styles.streamerDetails}>
            <Text style={styles.streamTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.streamerName}>{item.streamerUsername}</Text>
            <Text style={styles.category}>{item.category}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Live</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live</Text>
        <TouchableOpacity onPress={startStream} style={styles.goLiveButton}>
          <Ionicons name="videocam" size={20} color="white" />
          <Text style={styles.goLiveText}>Go Live</Text>
        </TouchableOpacity>
      </View>

      {isStreaming && (
        <View style={styles.streamingBanner}>
          <View style={styles.streamingIndicator} />
          <Text style={styles.streamingText}>You are live!</Text>
          <TouchableOpacity onPress={() => setIsStreaming(false)}>
            <Text style={styles.endStreamText}>End Stream</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlashList estimatedItemSize={100}
        data={activeStreams}
        renderItem={renderStream}
        keyExtractor={(item) => item.streamId}
        contentContainerStyle={styles.streamsList as any}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-off" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>No live streams right now</Text>
            <Text style={styles.emptySubtext}>Be the first to go live!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  goLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E91E63',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  goLiveText: {
    color: 'white',
    fontWeight: typography.fontWeight.semibold as any,
  },
  streamingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E91E63',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  streamingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  streamingText: {
    flex: 1,
    color: 'white',
    fontWeight: typography.fontWeight.semibold as any,
  },
  endStreamText: {
    color: 'white',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamsList: {
    padding: spacing.lg,
  },
  streamCard: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
  },
  streamThumbnail: {
    position: 'relative',
    height: 180,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.tertiary,
  },
  liveIndicator: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: '#E91E63',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  liveText: {
    color: 'white',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as any,
  },
  viewerCount: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  viewerText: {
    color: 'white',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as any,
  },
  streamInfo: {
    padding: spacing.md,
  },
  streamerInfo: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  streamerDetails: {
    flex: 1,
  },
  streamTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: 2,
  },
  streamerName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  category: {
    fontSize: typography.fontSize.xs,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.semibold as any,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.secondary,
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
});
