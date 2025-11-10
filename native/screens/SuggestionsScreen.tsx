import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { suggestionService } from '../services/suggestion.service';
import { userService } from '../services/user.service';

export default function SuggestionsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSuggestions();
  }, [user]);

  const loadSuggestions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await suggestionService.getSuggestedUsers(user.userId, 20);
      setSuggestions(data);
    } finally {
      setLoading(false);
    }
  };

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
      {loading ? <ActivityIndicator size="large" color="#3b82f6" style={{ flex: 1 }} /> : (
        <FlatList
          data={suggestions}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <TouchableOpacity style={styles.user} onPress={() => navigation.navigate('Profile' as never, { userId: item.userId } as never)}>
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
