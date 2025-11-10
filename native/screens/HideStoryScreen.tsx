import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function HideStoryScreen() {
  const navigation = useNavigation();
  const [hidden, setHidden] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  
  const users = [
    { id: '1', name: 'John', username: '@john', avatar: 'https://via.placeholder.com/50' },
    { id: '2', name: 'Jane', username: '@jane', avatar: 'https://via.placeholder.com/50' },
  ];

  const toggleHide = (userId: string) => {
    setHidden(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Hide Story From</Text>
        <TouchableOpacity><Text style={styles.done}>Done</Text></TouchableOpacity>
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput style={styles.searchInput} placeholder="Search..." value={search} onChangeText={setSearch} />
      </View>
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.user} onPress={() => toggleHide(item.id)}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.username}>{item.username}</Text>
            </View>
            <View style={[styles.checkbox, hidden.includes(item.id) && styles.checkboxChecked]}>
              {hidden.includes(item.id) && <Ionicons name="checkmark" size={18} color="#fff" />}
            </View>
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
  done: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  searchBox: { flexDirection: 'row', alignItems: 'center', padding: 12, margin: 16, backgroundColor: '#f3f4f6', borderRadius: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  user: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  username: { fontSize: 14, color: '#6b7280' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
});
