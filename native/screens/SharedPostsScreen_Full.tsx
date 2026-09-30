import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/ui/Avatar';
import { colors, spacing, typography } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { messageService } from '../services/message.service';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

interface SharedPost {
  shareId: string;
  postId: string;
  sharedWith: string;
  sharedWithUsername: string;
  sharedWithAvatar?: string;
  thumbnailURL: string;
  createdAt: any;
}

export default function SharedPostsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [sharedPosts, setSharedPosts] = useState<SharedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedPosts();
  }, []);

  const loadSharedPosts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Find user's conversations
      const convs = await messageService.getUserConversations(user.userId, 25);
      const results: SharedPost[] = [];

      for (const conv of convs) {
        const otherId = (conv as any).participantIds?.find((id: string) => id !== user.userId) || '';
        const otherUsername = (conv as any).participantUsernames?.[otherId] || otherId;
        const otherAvatar = (conv as any).participantAvatars?.[otherId] || undefined;

        const msgsRef = collection(db, 'conversations', conv.conversationId, 'messages');
        const qMsgs = query(
          msgsRef,
          where('type', '==', 'shared_post'),
          where('senderId', '==', user.userId),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snap = await getDocs(qMsgs);
        snap.docs.forEach((m) => {
          const d = m.data() as any;
          const sc = d.sharedContent || {};
          results.push({
            shareId: d.messageId || m.id,
            postId: sc.contentId || d.postId || '',
            sharedWith: otherId,
            sharedWithUsername: otherUsername,
            sharedWithAvatar: otherAvatar,
            thumbnailURL: sc.thumbnailURL || sc.coverImage || d.mediaURL || '',
            createdAt: d.createdAt,
          });
        });
      }

      results.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      setSharedPosts(results);
    } catch (error) {
      console.error('Failed to load shared posts:', error);
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

  const renderSharedPost = ({ item }: { item: SharedPost }) => (
    <TouchableOpacity
      style={styles.sharedItem}
      onPress={() => navigation.navigate('PostView', { postId: item.postId })}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.thumbnailURL }}
        style={styles.thumbnail}
        contentFit="cover"
      />

      <View style={styles.sharedInfo}>
        <Text style={styles.sharedText} numberOfLines={1}>
          Shared with{' '}
          <Text style={styles.username}>@{item.sharedWithUsername}</Text>
        </Text>
        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>

      <Avatar
        source={item.sharedWithAvatar}
        size={40}
        fallbackText={item.sharedWithUsername}
      />
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
        <Text style={styles.title}>Shared Posts</Text>
        <View style={styles.placeholder} />
      </View>

      <FlashList estimatedItemSize={100}
        data={sharedPosts}
        renderItem={renderSharedPost}
        keyExtractor={(item) => item.shareId}
        contentContainerStyle={styles.list as any}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="paper-plane-outline" size={64} color={colors.text.secondary} />
            <Text style={styles.emptyTitle}>No shared posts</Text>
            <Text style={styles.emptyText}>
              Posts you've shared will appear here
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
  sharedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  sharedInfo: {
    flex: 1,
  },
  sharedText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  username: {
    fontWeight: typography.fontWeight.semibold as any,
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
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
