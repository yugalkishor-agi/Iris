import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { postService } from '../services/post.service';
import { FlashList } from '@shopify/flash-list';

interface TrendingItem {
  id: string;
  type: 'hashtag' | 'location' | 'topic';
  title: string;
  subtitle: string;
  postsCount: number;
}

export default function TrendingScreen() {
  const navigation = useNavigation<any>();
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'hashtags' | 'locations'>('all');

  useEffect(() => {
    loadTrending();
  }, [filter]);

  const loadTrending = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual service
      const mockTrending: TrendingItem[] = [
        {
          id: '1',
          type: 'hashtag',
          title: '#photography',
          subtitle: 'Trending',
          postsCount: 1234567,
        },
        {
          id: '2',
          type: 'location',
          title: 'New York, USA',
          subtitle: 'Trending location',
          postsCount: 987654,
        },
        {
          id: '3',
          type: 'hashtag',
          title: '#nature',
          subtitle: 'Trending',
          postsCount: 765432,
        },
      ];
      setTrending(mockTrending);
    } catch (error) {
      console.error('Failed to load trending:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'hashtag':
        return 'pricetag';
      case 'location':
        return 'location';
      default:
        return 'trending-up';
    }
  };

  const handleItemPress = (item: TrendingItem) => {
    if (item.type === 'hashtag') {
      navigation.navigate('Hashtag' as never, { hashtag: item.title.slice(1) } as never);
    } else if (item.type === 'location') {
      navigation.navigate('Location' as never, { location: item.title } as never);
    }
  };

  const renderItem = ({ item, index }: { item: TrendingItem; index: number }) => (
    <TouchableOpacity
      style={styles.trendingItem}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <Text style={styles.rank}>#{index + 1}</Text>
        <View style={styles.iconContainer}>
          <Ionicons name={getIcon(item.type) as any} size={20} color={colors.accent.primary} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemSubtitle}>
            {item.postsCount.toLocaleString()} posts
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
    </TouchableOpacity>
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
        <Text style={styles.title}>Trending</Text>
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
          style={[styles.filterButton, filter === 'hashtags' && styles.activeFilter]}
          onPress={() => setFilter('hashtags')}
        >
          <Text style={[styles.filterText, filter === 'hashtags' && styles.activeFilterText]}>
            Hashtags
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'locations' && styles.activeFilter]}
          onPress={() => setFilter('locations')}
        >
          <Text style={[styles.filterText, filter === 'locations' && styles.activeFilterText]}>
            Locations
          </Text>
        </TouchableOpacity>
      </View>

      <FlashList estimatedItemSize={100}
        data={trending}
        renderItem={renderItem}
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
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  rank: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.secondary,
    width: 32,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.accent.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  itemSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
