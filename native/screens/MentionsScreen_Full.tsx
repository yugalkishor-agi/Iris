import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { Avatar } from '../components/ui/Avatar';
import { colors, spacing, typography } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notification.service';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

interface Mention {
  mentionId: string;
  postId: string;
  type: 'post' | 'comment' | 'story';
  authorId?: string;
  authorUsername: string;
  authorAvatarURL?: string;
  authorVerified?: boolean;
  text: string;
  thumbnailURL?: string;
  createdAt: any;
}

export default function MentionsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMentions();
  }, []);

  const loadMentions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userMentions = await notificationService.getMentions(user.userId);
      setMentions(userMentions);
    } catch (error) {
      console.error('Failed to load mentions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleMentionPress = (mention: Mention) => {
    if (mention.type === 'post' || mention.type === 'comment') {
      (navigation as any).navigate('PostView', { postId: mention.postId });
    } else if (mention.type === 'story') {
      // Open story viewer for the author
      (navigation as any).navigate('StoryViewerEnhanced', { userId: mention.authorId });
    }
  };

  const renderMention = ({ item }: { item: Mention }) => (
    <TouchableOpacity
      style={styles.mentionItem}
      onPress={() => handleMentionPress(item)}
      activeOpacity={0.7}
    >
      <Avatar
        source={item.authorAvatarURL}
        size={48}
        fallbackText={item.authorUsername}
      />

      <View style={styles.mentionContent}>
        <Text style={styles.mentionText} numberOfLines={2}>
          <Text style={styles.username}>@{item.authorUsername}</Text>
          {item.authorVerified ? ' ' : ''}
          {item.authorVerified ? (
            // Inline verification badge
            <VerifiedBadge size={14} />
          ) : null}
          {' mentioned you in a '}
          <Text style={styles.type}>{item.type}</Text>
        </Text>
        {item.text && (
          <Text style={styles.excerpt} numberOfLines={1}>
            {item.text}
          </Text>
        )}
        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>

      {item.thumbnailURL && (
        <Image
          source={{ uri: item.thumbnailURL }}
          style={styles.thumbnail}
          contentFit="cover"
        />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mentions</Text>
        <View style={styles.placeholder} />
      </View>

      <FlashList estimatedItemSize={100}
        data={mentions}
        renderItem={renderMention}
        keyExtractor={(item) => item.mentionId}
        contentContainerStyle={styles.list as any}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="at-outline" size={64} color={colors.text.secondary} />
            <Text style={styles.emptyTitle}>No mentions yet</Text>
            <Text style={styles.emptyText}>
              When people mention you, they'll appear here
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  placeholder: {
    width: 24,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  mentionItem: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  mentionContent: {
    flex: 1,
  },
  mentionText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.normal,
  },
  username: {
    fontWeight: typography.fontWeight.semibold as any,
  },
  type: {
    fontWeight: typography.fontWeight.medium as any,
  },
  excerpt: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
