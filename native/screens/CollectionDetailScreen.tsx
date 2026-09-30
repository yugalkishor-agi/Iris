import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { ScreenSkeleton } from '../components/ui/LoadingSkeleton';
import { collectionService } from '../services/collection.service';
import { useAuth } from '../contexts/AuthContext';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const imageSize = (width - spacing.md * 4) / 3;

export default function CollectionDetailScreen() {
  const [collection, setCollection] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { collectionId } = (route.params as any) || {};

  useEffect(() => {
    if (collectionId) loadCollection();
  }, [collectionId, user?.userId]);

  const loadCollection = async () => {
    if (!user?.userId || !collectionId) return;
    try {
      setLoading(true);
      const [collectionData, collectionPosts] = await Promise.all([
        collectionService.getCollection(user.userId, collectionId),
        collectionService.getCollectionPosts(user.userId, collectionId, 100),
      ]);
      setCollection(collectionData);
      setPosts(collectionPosts || []);
    } catch (error) {
      console.error('Failed to load collection:', error);
      setCollection(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostPress = (post: any) => {
    (navigation as any).navigate('PostView', { postId: post.postId });
  };

  const handleDeleteCollection = () => {
    if (!user?.userId || !collectionId) return;
    Alert.alert(
      'Delete Collection',
      'Are you sure you want to delete this collection? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await collectionService.deleteCollection(user.userId, collectionId);
              navigation.goBack();
            } catch (error) {
              console.error('Failed to delete collection:', error);
              Alert.alert('Error', 'Failed to delete collection');
            }
          },
        },
      ]
    );
  };

  const renderPost = ({ item }: { item: any }) => {
    const mediaURL = item.thumbnailURL || item.mediaURLs?.[0] || '';
    if (!mediaURL) return null;
    return (
      <TouchableOpacity style={styles.postItem} onPress={() => handlePostPress(item)} activeOpacity={0.8}>
        <Image source={{ uri: mediaURL }} style={styles.postImage} />
        {(item.mediaType === 'video' || /\.(mp4|mov|webm)$/i.test(mediaURL)) && (
          <View style={styles.videoOverlay}>
            <Ionicons name="play" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Collection</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScreenSkeleton variant="grid" rows={6} />
      </SafeAreaView>
    );
  }

  if (!collection) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Collection</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Collection not found</Text>
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
        <Text style={styles.headerTitle}>{collection.name}</Text>
        <TouchableOpacity onPress={handleDeleteCollection}>
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.collectionInfo}>
        {!!collection.coverImageURL && (
          <Image source={{ uri: collection.coverImageURL }} style={styles.coverImage} />
        )}
        <View style={styles.infoContent}>
          <Text style={styles.collectionName}>{collection.name}</Text>
          <View style={styles.collectionStats}>
            <Text style={styles.postCount}>
              {collection.postsCount || posts.length} {(collection.postsCount || posts.length) === 1 ? 'post' : 'posts'}
            </Text>
            {collection.isPrivate && (
              <View style={styles.privateIndicator}>
                <Ionicons name="lock-closed" size={12} color={colors.text.secondary} />
                <Text style={styles.privateText}>Private</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <FlashList estimatedItemSize={100}
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.postId}
        numColumns={3}
        contentContainerStyle={styles.postsGrid as any}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>No posts in this collection</Text>
            <Text style={styles.emptySubtext}>Save posts to this collection to see them here</Text>
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
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
  },
  collectionInfo: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  coverImage: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background.secondary,
  },
  infoContent: {
    gap: spacing.sm,
  },
  collectionName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  collectionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  postCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold as any,
  },
  privateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  privateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  postsGrid: {
    padding: 2,
  },
  postItem: {
    width: imageSize,
    height: imageSize,
    margin: 1,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.secondary,
  },
  videoOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
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


