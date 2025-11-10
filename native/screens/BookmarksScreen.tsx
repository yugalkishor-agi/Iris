import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3;

export default function BookmarksScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState('posts');

  const bookmarkedPosts = [
    { id: '1', image: 'https://via.placeholder.com/150' },
    { id: '2', image: 'https://via.placeholder.com/150' },
  ];

  const bookmarkedGlimpses = [
    { id: '1', image: 'https://via.placeholder.com/150' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Bookmarks</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'posts' && styles.activeTab]} onPress={() => setTab('posts')}>
          <Text style={[styles.tabText, tab === 'posts' && styles.activeTabText]}>Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'glimpses' && styles.activeTab]} onPress={() => setTab('glimpses')}>
          <Text style={[styles.tabText, tab === 'glimpses' && styles.activeTabText]}>Glimpses</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tab === 'posts' ? bookmarkedPosts : bookmarkedGlimpses}
        numColumns={3}
        renderItem={({ item }) => (
          <Image source={{ uri: item.image }} style={styles.item} />
        )}
        keyExtractor={(item) => item.id}
      />
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
  item: { width: ITEM_SIZE, height: ITEM_SIZE },
});
