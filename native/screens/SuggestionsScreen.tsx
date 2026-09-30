import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { colors, spacing, typography } from '../styles/theme';
import { ScreenSkeleton } from '../components/ui/LoadingSkeleton';
import { Avatar } from '../components/ui/Avatar';
import type { User } from '../types/database';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

export default function SuggestionsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, [user]);

  const loadSuggestions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get suggested users based on followers and following
      const followingIds = await userService.getFollowing(user.userId);
      const followerIds = await userService.getFollowers(user.userId);
      
      // Simple suggestion algorithm - get users from followers' networks
      const allUserIds = [...followingIds, ...followerIds];
      const uniqueUserIds = Array.from(new Set(allUserIds))
        .filter(id => id !== user.userId)
        .slice(0, 20);
      
      // Fetch user details for suggestions
      const userPromises = uniqueUserIds.map(id => userService.getUser(id));
      const users = await Promise.all(userPromises);
      const validUsers = users.filter((u): u is User => u !== null);
      
      setSuggestions(validUsers);
      
      // Set following status
      setFollowing(new Set(followingIds));
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSuggestions();
    setRefreshing(false);
  }, []);

  const handleFollow = async (userId: string) => {
    if (!user) return;
    const isFollowing = following.has(userId);
    if (isFollowing) {
      await userService.unfollowUser(user.userId, userId);
      setFollowing(prev => { const s = new Set(prev); s.delete(userId); return s; });
    } else {
      await userService.followUser(user.userId, userId);
      setFollowing(prev => new Set(prev).add(userId));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Suggested for You</Text>
        <View style={{ width: 28 }} />
      </View>
      {loading ? <ScreenSkeleton variant="list" rows={6} /> : (
        <FlashList estimatedItemSize={100}
          data={suggestions}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <TouchableOpacity style={styles.user} onPress={() => (navigation as any).navigate('UserProfile', { userId: item.userId })}>
                <Image source={{ uri: item.avatarURL }} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.displayName}</Text>
                  <Text style={styles.username}>@{item.username}</Text>
                  {item.mutualCount > 0 && (
                    <Text style={styles.mutual}>Followed by {item.mutualCount} people you follow</Text>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, following.has(item.userId) && styles.btnFollowing]}
                onPress={() => handleFollow(item.userId)}
              >
                <Text style={[styles.btnText, following.has(item.userId) && styles.btnTextFollowing]}>
                  {following.has(item.userId) ? 'Following' : 'Follow'}
                </Text>
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
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  user: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  name: { fontSize: 15, fontWeight: '600' },
  username: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  mutual: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  btn: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8 },
  btnFollowing: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnTextFollowing: { color: '#374151' },
});



