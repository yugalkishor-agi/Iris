import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { FlashList } from '@shopify/flash-list';

interface ActivityItem {
  id: string;
  type: 'login' | 'post' | 'like' | 'comment' | 'follow';
  description: string;
  timestamp: Date;
  device?: string;
  location?: string;
}

export default function ActivityLogScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'logins' | 'content'>('all');

  useEffect(() => {
    loadActivities();
  }, [filter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual service call
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'login',
          description: 'Logged in from iPhone',
          timestamp: new Date(),
          device: 'iPhone 14 Pro',
          location: 'New York, US',
        },
        {
          id: '2',
          type: 'post',
          description: 'Created a new post',
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: '3',
          type: 'like',
          description: 'Liked 5 posts',
          timestamp: new Date(Date.now() - 7200000),
        },
      ];
      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return 'log-in-outline';
      case 'post':
        return 'add-circle-outline';
      case 'like':
        return 'heart-outline';
      case 'comment':
        return 'chatbubble-outline';
      case 'follow':
        return 'person-add-outline';
      default:
        return 'time-outline';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderActivity = ({ item }: { item: ActivityItem }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <Ionicons
          name={getActivityIcon(item.type) as any}
          size={20}
          color={colors.accent.primary}
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityDescription}>{item.description}</Text>
        <Text style={styles.activityTime}>{formatTime(item.timestamp)}</Text>
        {item.device && (
          <Text style={styles.activityDetails}>
            {item.device} • {item.location}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Activity Log</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'logins' && styles.activeFilter]}
          onPress={() => setFilter('logins')}
        >
          <Text style={[styles.filterText, filter === 'logins' && styles.activeFilterText]}>
            Logins
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'content' && styles.activeFilter]}
          onPress={() => setFilter('content')}
        >
          <Text style={[styles.filterText, filter === 'content' && styles.activeFilterText]}>
            Content
          </Text>
        </TouchableOpacity>
      </View>

      <FlashList estimatedItemSize={100}
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list as any}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  placeholder: {
    width: 24,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
  },
  activeFilter: {
    backgroundColor: colors.accent.primary,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  activeFilterText: {
    color: colors.text.inverse,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  activityItem: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.md,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.accent.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  activityDetails: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
});
