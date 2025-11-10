import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock analytics data
    setTimeout(() => {
      setStats({
        totalPosts: 127,
        totalLikes: 3542,
        totalComments: 892,
        totalViews: 15234,
        followers: 1245,
        following: 432,
        engagement: 6.8,
        topPost: { id: '1', likes: 432, image: 'https://via.placeholder.com/100' },
      });
      setLoading(false);
    }, 500);
  }, [user]);

  if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overview</Text>
          <View style={styles.grid}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.totalPosts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
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
              <View style={[styles.engagementFill, { width: `${stats.engagement * 10}%` }]} />
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  stat: { width: '47%', alignItems: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#3b82f6' },
  statLabel: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  engagement: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  engagementBar: { flex: 1, height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  engagementFill: { height: '100%', backgroundColor: '#3b82f6' },
  engagementValue: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  audience: { flexDirection: 'row', alignItems: 'center' },
  audienceItem: { flex: 1, alignItems: 'center' },
  audienceValue: { fontSize: 28, fontWeight: '700' },
  audienceLabel: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  divider: { width: 1, height: 40, backgroundColor: '#e5e7eb' },
});
