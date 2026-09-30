import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { postService } from '../services/post.service';
import { useAuth } from '../contexts/AuthContext';
import { ScreenSkeleton } from '../components/ui/LoadingSkeleton';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3;

export default function HashtagScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const hashtag = (route.params as any)?.hashtag || '';
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHashtagPosts();
  }, [hashtag]);

  const loadHashtagPosts = async () => {
    setLoading(true);
    try {
      const data = await postService.getPostsByHashtag(hashtag);
      setPosts(data.posts || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>#{hashtag}</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.info}>
        <Text style={styles.count}>{posts.length} posts</Text>
      </View>
      {loading ? <ScreenSkeleton variant="grid" rows={6} /> : (
        <FlashList estimatedItemSize={100}
          data={posts}
          numColumns={3}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => (navigation as any).navigate('PostView', { postId: item.postId })}>
              <Image source={{ uri: item.mediaURLs?.[0] }} style={styles.img} />
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.postId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 20, fontWeight: '700', color: '#3b82f6' },
  info: { padding: 16, alignItems: 'center' },
  count: { fontSize: 14, color: '#6b7280' },
  img: { width: ITEM_SIZE, height: ITEM_SIZE },
});



