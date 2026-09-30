import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/post.service';
import { userService } from '../services/user.service';
import { ScreenSkeleton } from '../components/ui/LoadingSkeleton';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;

export default function LikedPostsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLikedPosts();
  }, [user]);

  const loadLikedPosts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const followingIds = await userService.getFollowing(user.userId);
      const feedAuthors = Array.from(new Set([user.userId, ...followingIds])).slice(0, 10);
      const { posts } = await postService.getFeedPosts(feedAuthors, user.userId, 100);
      const likedIds = await postService.getUserLikedPosts(
        user.userId,
        posts.map((p) => p.postId).filter(Boolean)
      );
      setLikedPosts(posts.filter((p) => likedIds.includes(p.postId)));
    } catch (error) {
      console.error('Failed to load liked posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPost = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.postItem}
      onPress={() => (navigation as any).navigate('PostView', { postId: item.postId })}
    >
        <Image source={{ uri: item.mediaURLs?.[0] || '' }} style={styles.postImage} />
      <View style={styles.overlay}>
        <Ionicons name="heart" size={20} color="#fff" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liked Posts</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <ScreenSkeleton variant="grid" rows={6} />
      ) : likedPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No liked posts yet</Text>
          <Text style={styles.emptyDescription}>Posts you like will appear here</Text>
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          data={likedPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.postId}
          numColumns={3}
          contentContainerStyle={styles.grid as any}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#000', marginLeft: 12 },
  placeholder: { width: 36 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptyDescription: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  grid: { padding: 1 },
  postItem: { width: ITEM_WIDTH, height: ITEM_WIDTH, padding: 1, position: 'relative' },
  postImage: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 4 },
});



