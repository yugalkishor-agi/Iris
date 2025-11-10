import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/post.service';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;

export default function SavedPostsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedPosts();
  }, [user]);

  const loadSavedPosts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const posts = await postService.getSavedPosts(user.userId);
      setSavedPosts(posts);
    } catch (error) {
      console.error('Failed to load saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPost = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.postItem}
      onPress={() => navigation.navigate('PostView' as never, { postId: item.postId } as never)}
    >
      <Image source={{ uri: item.mediaURLs?.[0] || 'https://via.placeholder.com/150' }} style={styles.postImage} />
      {item.mediaURLs?.length > 1 && (
        <View style={styles.multipleIcon}>
          <Ionicons name="copy" size={16} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : savedPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No saved posts yet</Text>
          <Text style={styles.emptyDescription}>Save posts to see them here</Text>
        </View>
      ) : (
        <FlatList
          data={savedPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.postId}
          numColumns={3}
          contentContainerStyle={styles.grid}
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
  multipleIcon: { position: 'absolute', top: 8, right: 8 },
});
