import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/post.service';
import { glimpseService } from '../services/glimpse.service';
import { settingsService } from '../services/settings.service';
import { colors, spacing, typography } from '../styles/theme';
import { ScreenSkeleton } from '../components/ui/LoadingSkeleton';
import { FlashList } from '@shopify/flash-list';

type LogItem = {
  id: string;
  type: 'login' | 'post' | 'glimpse';
  message: string;
  time: Date;
};

export default function ActivityLogScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [activities, setActivities] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivityLog();
  }, [user?.userId]);

  const loadActivityLog = async () => {
    if (!user?.userId) return;
    try {
      setLoading(true);
      const [sessions, postsResult, glimpses] = await Promise.all([
        settingsService.getActiveSessions(user.userId),
        postService.getUserPosts(user.userId, 20),
        glimpseService.getUserGlimpses(user.userId, 20),
      ]);

      const logs: LogItem[] = [
        ...(sessions || []).map((s: any) => ({
          id: `session-${s.sessionId}`,
          type: 'login' as const,
          message: `Login on ${s.device || 'Unknown device'}`,
          time: normalizeDate(s.lastActive || s.createdAt),
        })),
        ...((postsResult?.posts || []).map((p: any) => ({
          id: `post-${p.postId}`,
          type: 'post' as const,
          message: 'Created a new post',
          time: normalizeDate(p.createdAt),
        }))),
        ...((glimpses || []).map((g: any) => ({
          id: `glimpse-${g.storyId || g.glimpseId}`,
          type: 'glimpse' as const,
          message: 'Published a glimpse',
          time: normalizeDate(g.createdAt),
        }))),
      ];

      setActivities(logs.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 100));
    } catch (error) {
      console.error('Failed to load activity log:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: LogItem['type']) => {
    if (type === 'login') return 'log-in-outline';
    if (type === 'post') return 'image-outline';
    return 'film-outline';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Activity Log</Text>
        <TouchableOpacity onPress={loadActivityLog}>
          <Ionicons name="refresh" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ScreenSkeleton variant="cards" rows={6} />
      ) : (
        <FlashList estimatedItemSize={100}
          data={activities}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.iconBox}>
                <Ionicons name={getIcon(item.type) as any} size={20} color={colors.accent.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.msg}>{item.message}</Text>
                <Text style={styles.time}>{formatRelative(item.time)}</Text>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="time-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No activity yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function normalizeDate(value: any): Date {
  if (!value) return new Date(0);
  if (typeof value?.toDate === 'function') return value.toDate();
  return new Date(value);
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / (1000 * 60));
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
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
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background.secondary, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  msg: { fontSize: typography.fontSize.base, color: colors.text.primary },
  time: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  emptyText: { color: colors.text.secondary, fontSize: typography.fontSize.base },
});


