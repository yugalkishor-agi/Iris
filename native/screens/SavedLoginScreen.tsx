import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function SavedLoginScreen() {
  const navigation = useNavigation();
  const logins = [
    { id: '1', device: 'iPhone 13', lastUsed: '2 days ago' },
    { id: '2', device: 'iPad Pro', lastUsed: '1 week ago' },
  ];

  const handleRemove = (device: string) => {
    Alert.alert('Remove', `Remove saved login from ${device}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive' },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Login Info</Text>
        <View style={{ width: 28 }} />
      </View>
      <FlatList
        data={logins}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.device}>{item.device}</Text>
              <Text style={styles.lastUsed}>Last used {item.lastUsed}</Text>
            </View>
            <TouchableOpacity onPress={() => handleRemove(item.device)}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No saved logins</Text>
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
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  device: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  lastUsed: { fontSize: 14, color: '#6b7280' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
});
