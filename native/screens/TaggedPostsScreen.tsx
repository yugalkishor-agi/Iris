import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { postService } from '../services/post.service';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography } from '../styles/theme';
import { ScreenSkeleton } from '../components/ui/LoadingSkeleton';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3;

export default function TaggedPostsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const targetUserId = (route.params as any)?.userId || user?.userId;

  useEffect(() => {
    loadTaggedPosts();
  }, [targetUserId]);

  const loadTaggedPosts = async () => {
    if (!targetUserId) return;
    try {
      setLoading(true);
      const result = await postService.getPostsByTaggedUser(targetUserId, 60);
      setPosts(result.posts || []);
    } catch (error) {
      console.error('Failed to load tagged posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const renderPost = ({ item }: { item: any }) => {
    const image = item.thumbnailURL || item.mediaURLs?.[0] || '';
    if (!image) return null;
    return (
      <TouchableOpacity
        onPress={() => (navigation as any).navigate('PostView', { postId: item.postId })}
      >
        <Image source={{ uri: image }} style={styles.post} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Tagged Posts</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ScreenSkeleton variant="grid" rows={6} />
      ) : (
        <FlashList
          data={posts}
          numColumns={3}
          renderItem={renderPost}
          keyExtractor={(item) => item.postId}
          estimatedItemSize={ITEM_SIZE}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="pricetag-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No tagged posts found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary },
  post: { width: ITEM_SIZE, height: ITEM_SIZE },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  emptyText: { color: colors.text.secondary, fontSize: typography.fontSize.base },
});


