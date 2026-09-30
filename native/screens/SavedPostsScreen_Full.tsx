import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { collectionService } from '../services/collection.service';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const itemSize = (width - spacing.lg * 2 - spacing.xs * 2) / 3;

interface SavedPost {
  postId: string;
  mediaURLs: string[];
  mediaType: 'image' | 'video';
  savedAt: any;
}

export default function SavedPostsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const loadSavedPosts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const posts = await collectionService.getAllSavedPosts(user.userId);
      setSavedPosts(posts as unknown as SavedPost[]);
    } catch (error) {
      console.error('Failed to load saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostPress = (post: SavedPost) => {
    (navigation as any).navigate('PostView', { postId: post.postId });
  };

  const renderPost = ({ item }: { item: SavedPost }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => handlePostPress(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.mediaURLs[0] }}
        style={styles.gridImage}
        contentFit="cover"
      />
      {item.mediaType === 'video' && (
        <View style={styles.videoBadge}>
          <Ionicons name="play" size={16} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bookmark-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyTitle}>No saved posts</Text>
      <Text style={styles.emptyText}>
        Posts you save will appear here
      </Text>
    </View>
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
        <Text style={styles.title}>Saved</Text>
        <TouchableOpacity>
          <Ionicons name="add" size={28} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <FlashList estimatedItemSize={100}
        data={savedPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.postId}
        numColumns={3}
        contentContainerStyle={(
          savedPosts.length === 0 ? styles.emptyContent : styles.grid
        ) as any}
        ListEmptyComponent={renderEmpty}
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
  grid: {
    padding: spacing.xs,
  },
  emptyContent: {
    flexGrow: 1,
  },
  gridItem: {
    width: itemSize,
    height: itemSize,
    margin: spacing.xs,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.background.tertiary,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.full,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
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
