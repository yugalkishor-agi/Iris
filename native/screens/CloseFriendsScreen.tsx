import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import type { User } from '../types/database';

export default function CloseFriendsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [closeFriends, setCloseFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCloseFriends();
  }, [user]);

  const loadCloseFriends = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const cfIds = await userService.getCloseFriends(user.userId);
      const users = await Promise.all(cfIds.map(id => userService.getUser(id)));
      setCloseFriends(users.filter((u): u is User => u !== null));
    } catch (error) {
      console.error('Failed to load close friends:', error);
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
        <Text style={styles.headerTitle}>Close Friends</Text>
        <View style={{ width: 28 }} />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={styles.loading} />
      ) : (
        <FlatList
          data={closeFriends}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item}>
              <Image source={{ uri: item.avatarURL }} style={styles.avatar} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.displayName}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
              <Ionicons name="star" size={24} color="#10b981" />
            </TouchableOpacity>
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
  headerTitle: { fontSize: 18, fontWeight: '600' },
  loading: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  username: { fontSize: 14, color: '#6b7280', marginTop: 2 },
});
