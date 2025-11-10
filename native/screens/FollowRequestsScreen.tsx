import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function FollowRequestsScreen() {
  const navigation = useNavigation();
  const requests = [
    { id: '1', name: 'John', username: '@john', avatar: 'https://via.placeholder.com/50' },
    { id: '2', name: 'Jane', username: '@jane', avatar: 'https://via.placeholder.com/50' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Follow Requests</Text>
        <View style={{ width: 28 }} />
      </View>
      <FlatList
        data={requests}
        renderItem={({ item }) => (
          <View style={styles.request}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.username}>{item.username}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.acceptBtn}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.declineBtn}>
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No pending requests</Text>
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
  request: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  username: { fontSize: 14, color: '#6b7280' },
  actions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  acceptText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  declineBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  declineText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 60 },
  emptyText: { fontSize: 16, color: '#9ca3af', marginTop: 16 },
});
