import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService } from '../services/analytics.service';
import { postService } from '../services/post.service';
import { glimpseService } from '../services/glimpse.service';

const formatNumber = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${Math.max(0, Math.round(value))}`;
};

export default function InsightsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState({
    accountsReached: 0,
    interactions: 0,
    followers: 0,
    reachedGrowth: 0,
    interactionsGrowth: 0,
    followersChange: 0,
  });

  const loadInsights = useCallback(async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [profileInsights, postsResult, glimpses] = await Promise.all([
        analyticsService.getProfileInsights(user.userId, '30d'),
        postService.getUserPosts(user.userId, 100),
        glimpseService.getUserGlimpses(user.userId, 100),
      ]);

      const posts = postsResult?.posts || [];
      const allContent = [...posts, ...(glimpses || [])] as any[];

      const interactions = allContent.reduce((sum, item) => {
        const likes = Number(item?.stats?.likesCount || item?.likesCount || 0);
        const comments = Number(item?.stats?.commentsCount || item?.commentsCount || 0);
        const shares = Number(item?.stats?.sharesCount || item?.sharesCount || 0);
        return sum + likes + comments + shares;
      }, 0);

      const accountsReached = Math.round((profileInsights.totalFollowers * profileInsights.reachRate) / 100);
      const followersChange = Math.round(
        (profileInsights.totalFollowers * profileInsights.followersGrowth) / 100
      );

      setInsights({
        accountsReached,
        interactions,
        followers: profileInsights.totalFollowers,
        reachedGrowth: profileInsights.reachRate,
        interactionsGrowth: profileInsights.engagementRate,
        followersChange,
      });
    } catch (error) {
      console.error('Error loading insights:', error);
      setInsights({
        accountsReached: 0,
        interactions: 0,
        followers: 0,
        reachedGrowth: 0,
        interactionsGrowth: 0,
        followersChange: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const cards = useMemo(
    () => [
      {
        title: 'Accounts Reached',
        value: formatNumber(insights.accountsReached),
        change: `${insights.reachedGrowth >= 0 ? '+' : ''}${insights.reachedGrowth.toFixed(1)}% in 30d`,
      },
      {
        title: 'Content Interactions',
        value: formatNumber(insights.interactions),
        change: `${insights.interactionsGrowth >= 0 ? '+' : ''}${insights.interactionsGrowth.toFixed(1)}% engagement`,
      },
      {
        title: 'Total Followers',
        value: formatNumber(insights.followers),
        change: `${insights.followersChange >= 0 ? '+' : ''}${formatNumber(insights.followersChange)} this period`,
      },
    ],
    [insights]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Insights</Text>
        <TouchableOpacity onPress={() => { setRefreshing(true); loadInsights(); }}>
          <Ionicons name="refresh" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content as any}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadInsights(); }} />}
        >
          {cards.map((card) => (
            <View key={card.title} style={styles.card}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.bigNumber}>{card.value}</Text>
              <Text style={styles.change}>{card.change}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 18, fontWeight: '600' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  bigNumber: { fontSize: 32, fontWeight: '700', color: '#000', marginBottom: 4 },
  change: { fontSize: 13, color: '#10b981' },
});
