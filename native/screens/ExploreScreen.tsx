import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 32) / 3;

export default function ExploreScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');

  const categories = ['All', 'People', 'Photos', 'Videos', 'Hashtags'];
  const [selected, setSelected] = useState('All');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.category, selected === cat && styles.categoryActive]}
            onPress={() => setSelected(cat)}
          >
            <Text style={[styles.categoryText, selected === cat && styles.categoryTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.grid}>
        {[1,2,3,4,5,6,7,8,9].map(i => (
          <Image key={i} source={{ uri: 'https://via.placeholder.com/150' }} style={styles.gridItem} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  categories: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  category: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  categoryActive: { backgroundColor: '#3b82f6' },
  categoryText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  categoryTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 1 },
  gridItem: { width: ITEM_SIZE, height: ITEM_SIZE, margin: 1 },
});
