import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3;

export default function DraftsScreen() {
  const navigation = useNavigation();
  const drafts = [
    { id: '1', image: 'https://via.placeholder.com/150', caption: 'My vacation...', date: '2 days ago' },
    { id: '2', image: 'https://via.placeholder.com/150', caption: 'Sunset view', date: '1 week ago' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Drafts</Text>
        <View style={{ width: 28 }} />
      </View>
      <FlatList
        data={drafts}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.draft}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.overlay}>
              <Ionicons name="document-text" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No drafts</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  draft: { width: ITEM_SIZE, height: ITEM_SIZE, position: 'relative' },
  image: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 20 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 60, marginTop: 40 },
  emptyText: { fontSize: 16, color: '#9ca3af', marginTop: 16 },
});
