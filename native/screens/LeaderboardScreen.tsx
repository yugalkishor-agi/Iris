import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { colors, spacing, typography } from '../styles/theme';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaders();
  }, []);

  const loadLeaders = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(query(collection(db, 'users'), orderBy('stats.followersCount', 'desc'), limit(50)));
      const data = snap.docs.map((d, idx) => {
        const u: any = d.data();
        return {
          id: d.id,
          rank: idx + 1,
          name: u.displayName || u.username || 'User',
          username: u.username || '',
          avatar: u.avatarURL || '',
          points: Number(u.stats?.followersCount || 0),
        };
      });
      setLeaders(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLeaders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Leaderboard</Text>
        <TouchableOpacity onPress={loadLeaders}>
          <Ionicons name="refresh" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          data={leaders}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => (navigation as any).navigate('UserProfile', { userId: item.id })}
            >
              <Text style={styles.rank}>#{item.rank}</Text>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
              <Text style={styles.points}>{item.points}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="trophy-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No leaderboard data</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary },
  item: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  rank: { fontSize: 18, fontWeight: '700', color: colors.accent.primary, width: 40 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: colors.background.secondary },
  name: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary },
  username: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: 2 },
  points: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold as any, color: '#10b981' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyText: { color: colors.text.secondary, fontSize: typography.fontSize.base },
});
