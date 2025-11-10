import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function RestrictedAccountsScreen() {
  const navigation = useNavigation();
  const restricted = [
    { id: '1', name: 'User1', avatar: 'https://via.placeholder.com/50' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Restricted Accounts</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.info}>
        <Text style={styles.infoText}>
          Restricted accounts can't see when you're online or if you've read their messages. They won't be notified.
        </Text>
      </View>
      <FlatList
        data={restricted}
        renderItem={({ item }) => (
          <View style={styles.user}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <Text style={styles.name}>{item.name}</Text>
            <TouchableOpacity style={styles.btn}>
              <Text style={styles.btnText}>Unrestrict</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="hand-left-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No restricted accounts</Text>
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
  info: { padding: 16, backgroundColor: '#eff6ff' },
  infoText: { fontSize: 13, color: '#1e3a8a', lineHeight: 20 },
  user: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  name: { flex: 1, fontSize: 16, fontWeight: '600' },
  btn: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#9ca3af', marginTop: 16 },
});
