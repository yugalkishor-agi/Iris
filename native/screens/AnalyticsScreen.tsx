import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { postService } from '../services/post.service';
import { glimpseService } from '../services/glimpse.service';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { ScreenSkeleton } from '../components/ui/LoadingSkeleton';

type Stats = {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  followers: number;
  following: number;
  engagement: number;
};

export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [user?.userId]);

  const loadAnalytics = async () => {
    if (!user?.userId) return;
    try {
      setLoading(true);
      const [profile, postsResult, glimpses] = await Promise.all([
        userService.getUser(user.userId),
        postService.getUserPosts(user.userId, 100),
        glimpseService.getUserGlimpses(user.userId, 100),
      ]);

      const posts = postsResult?.posts || [];
      const allContent = [...posts, ...(glimpses || [])] as any[];

      const totalLikes = allContent.reduce((sum, item) => sum + Number(item?.stats?.likesCount || item?.likesCount || 0), 0);
      const totalComments = allContent.reduce((sum, item) => sum + Number(item?.stats?.commentsCount || item?.commentsCount || 0), 0);
      const totalViews = allContent.reduce((sum, item) => sum + Number(item?.stats?.viewsCount || item?.viewsCount || 0), 0);
      const interactions = totalLikes + totalComments;
      const engagement = totalViews > 0 ? Number(((interactions / totalViews) * 100).toFixed(1)) : 0;

      setStats({
        totalPosts: allContent.length,
        totalLikes,
        totalComments,
        totalViews,
        followers: profile?.stats?.followersCount || 0,
        following: profile?.stats?.followingCount || 0,
        engagement,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setStats({
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        totalViews: 0,
        followers: 0,
        following: 0,
        engagement: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ScreenSkeleton variant="cards" rows={6} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>Unable to load analytics</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <TouchableOpacity onPress={loadAnalytics}>
          <Ionicons name="refresh" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content as any}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overview</Text>
          <View style={styles.grid}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.totalPosts}</Text>
              <Text style={styles.statLabel}>Content</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.totalLikes}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.totalComments}</Text>
              <Text style={styles.statLabel}>Comments</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.totalViews}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Engagement</Text>
          <View style={styles.engagement}>
            <View style={styles.engagementBar}>
              <View style={[styles.engagementFill, { width: `${Math.min(stats.engagement, 100)}%` }]} />
            </View>
            <Text style={styles.engagementValue}>{stats.engagement}%</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Audience</Text>
          <View style={styles.audience}>
            <View style={styles.audienceItem}>
              <Text style={styles.audienceValue}>{stats.followers}</Text>
              <Text style={styles.audienceLabel}>Followers</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.audienceItem}>
              <Text style={styles.audienceValue}>{stats.following}</Text>
              <Text style={styles.audienceLabel}>Following</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.text.secondary, fontSize: typography.fontSize.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary },
  content: { padding: spacing.lg },
  card: { backgroundColor: colors.background.primary, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.lg },
  cardTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold as any, marginBottom: spacing.lg, color: colors.text.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stat: { width: '47%', alignItems: 'center', padding: spacing.md, backgroundColor: colors.background.secondary, borderRadius: 8 },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.accent.primary },
  statLabel: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: 4 },
  engagement: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  engagementBar: { flex: 1, height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  engagementFill: { height: '100%', backgroundColor: colors.accent.primary },
  engagementValue: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold as any, color: colors.accent.primary },
  audience: { flexDirection: 'row', alignItems: 'center' },
  audienceItem: { flex: 1, alignItems: 'center' },
  audienceValue: { fontSize: 28, fontWeight: '700', color: colors.text.primary },
  audienceLabel: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: 4 },
  divider: { width: 1, height: 40, backgroundColor: '#e5e7eb' },
});


