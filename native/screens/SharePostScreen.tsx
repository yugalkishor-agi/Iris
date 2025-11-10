import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function SharePostScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const users = [
    { id: '1', name: 'John', avatar: 'https://via.placeholder.com/40' },
    { id: '2', name: 'Jane', avatar: 'https://via.placeholder.com/40' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="close" size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.title}>Share</Text>
        <View style={{ width: 28 }} />
      </View>
      <TextInput style={styles.search} placeholder="Search..." value={search} onChangeText={setSearch} />
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.user}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <Text style={styles.name}>{item.name}</Text>
            <TouchableOpacity style={styles.sendBtn}><Text style={styles.sendText}>Send</Text></TouchableOpacity>
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
  search: { padding: 12, margin: 16, backgroundColor: '#f3f4f6', borderRadius: 8 },
  user: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  name: { flex: 1, fontSize: 15, fontWeight: '600' },
  sendBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
  sendText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
