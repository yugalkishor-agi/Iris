import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 2 - 12;

export default function TrendingScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState('posts');

  const trendingPosts = [
    { id: '1', image: 'https://via.placeholder.com/200', likes: 5234 },
    { id: '2', image: 'https://via.placeholder.com/200', likes: 4521 },
  ];

  const trendingHashtags = [
    { id: '1', tag: 'photography', posts: 12500 },
    { id: '2', tag: 'travel', posts: 9800 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Trending</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'posts' && styles.activeTab]} onPress={() => setTab('posts')}>
          <Text style={[styles.tabText, tab === 'posts' && styles.activeTabText]}>Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'hashtags' && styles.activeTab]} onPress={() => setTab('hashtags')}>
          <Text style={[styles.tabText, tab === 'hashtags' && styles.activeTabText]}>Hashtags</Text>
        </TouchableOpacity>
      </View>
      {tab === 'posts' ? (
        <FlatList
          data={trendingPosts}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.post}>
              <Image source={{ uri: item.image }} style={styles.postImage} />
              <View style={styles.overlay}>
                <Ionicons name="heart" size={16} color="#fff" />
                <Text style={styles.likes}>{item.likes}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
        />
      ) : (
        <FlatList
          data={trendingHashtags}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.hashtagItem}>
              <Text style={styles.hashtag}>#{item.tag}</Text>
              <Text style={styles.count}>{item.posts.toLocaleString()} posts</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#3b82f6' },
  tabText: { fontSize: 15, color: '#6b7280' },
  activeTabText: { color: '#3b82f6', fontWeight: '600' },
  grid: { padding: 8 },
  post: { width: ITEM_SIZE, height: ITEM_SIZE, margin: 4, position: 'relative', borderRadius: 8, overflow: 'hidden' },
  postImage: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  likes: { color: '#fff', fontSize: 12, fontWeight: '600' },
  hashtagItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  hashtag: { fontSize: 18, fontWeight: '600', color: '#3b82f6', marginBottom: 4 },
  count: { fontSize: 14, color: '#6b7280' },
});
