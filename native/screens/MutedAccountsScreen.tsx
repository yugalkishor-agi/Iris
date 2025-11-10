import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import type { User } from '../types/database';

export default function MutedAccountsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [mutedUsers, setMutedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMutedUsers();
  }, [user]);

  const loadMutedUsers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const muIds = await userService.getMutedUsers(user.userId);
      const users = await Promise.all(muIds.map(id => userService.getUser(id)));
      setMutedUsers(users.filter((u): u is User => u !== null));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Muted Accounts</Text>
        <View style={{ width: 28 }} />
      </View>
      {loading ? <ActivityIndicator size="large" color="#3b82f6" style={{ flex: 1 }} /> : (
        <FlatList
          data={mutedUsers}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Image source={{ uri: item.avatarURL }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.displayName}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
              <TouchableOpacity style={styles.btn}>
                <Text style={styles.btnText}>Unmute</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.userId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '600' },
  username: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  btn: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
});
