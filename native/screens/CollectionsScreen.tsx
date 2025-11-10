import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 2;

export default function CollectionsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock collections
    setTimeout(() => {
      setCollections([
        { id: '1', name: 'Travel', count: 24, coverImage: 'https://via.placeholder.com/200' },
        { id: '2', name: 'Food', count: 18, coverImage: 'https://via.placeholder.com/200' },
        { id: '3', name: 'Fitness', count: 12, coverImage: 'https://via.placeholder.com/200' },
        { id: '4', name: 'Art', count: 30, coverImage: 'https://via.placeholder.com/200' },
      ]);
      setLoading(false);
    }, 500);
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Collections</Text>
        <TouchableOpacity>
          <Ionicons name="add" size={28} color="#000" />
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator size="large" color="#3b82f6" style={{ flex: 1 }} /> : (
        <FlatList
          data={collections}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.collection}>
              <Image source={{ uri: item.coverImage }} style={styles.cover} />
              <View style={styles.overlay}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.count}>{item.count} posts</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
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
  grid: { padding: 16 },
  collection: { width: ITEM_SIZE, height: ITEM_SIZE, margin: 8, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  cover: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#fff' },
  count: { fontSize: 13, color: '#d1d5db', marginTop: 2 },
});
