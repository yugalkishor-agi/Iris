import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function HighlightsScreen() {
  const navigation = useNavigation();
  const highlights = [
    { id: '1', name: 'Travel', cover: 'https://via.placeholder.com/100' },
    { id: '2', name: 'Food', cover: 'https://via.placeholder.com/100' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.title}>Story Highlights</Text>
        <TouchableOpacity><Ionicons name="add" size={28} color="#000" /></TouchableOpacity>
      </View>
      <FlatList
        data={highlights}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item}>
            <Image source={{ uri: item.cover }} style={styles.cover} />
            <Text style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
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
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  cover: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '600' },
});
