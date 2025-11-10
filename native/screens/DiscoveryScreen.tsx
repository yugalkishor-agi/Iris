import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { postService } from '../services/post.service';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 2 - 12;

export default function DiscoveryScreen() {
  const navigation = useNavigation();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiscoveryPosts();
  }, []);

  const loadDiscoveryPosts = async () => {
    setLoading(true);
    try {
      const data = await postService.getExplorePosts(20);
      setPosts(data);
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
        <Text style={styles.title}>Discover</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search' as never)}>
          <Ionicons name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator size="large" color="#3b82f6" style={{ flex: 1 }} /> : (
        <FlatList
          data={posts}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.post} onPress={() => navigation.navigate('PostView' as never, { postId: item.postId } as never)}>
              <Image source={{ uri: item.mediaURLs?.[0] }} style={styles.img} />
              <View style={styles.overlay}>
                <Ionicons name="heart" size={16} color="#fff" />
                <Text style={styles.count}>{item.likesCount || 0}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.postId}
          contentContainerStyle={styles.grid}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  grid: { padding: 8 },
  post: { width: ITEM_SIZE, height: ITEM_SIZE, margin: 4, position: 'relative' },
  img: { width: '100%', height: '100%', borderRadius: 8 },
  overlay: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 12 },
  count: { color: '#fff', fontSize: 12, marginLeft: 4, fontWeight: '600' },
});
