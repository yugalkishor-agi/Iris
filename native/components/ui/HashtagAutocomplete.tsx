import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../ui/LoadingSkeleton';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import { searchService } from '../../services/search.service';
import { FlashList } from '@shopify/flash-list';

interface Hashtag {
  tag: string;
  count: number;
  trending?: boolean;
}

interface HashtagAutocompleteProps {
  query: string;
  onSelect: (hashtag: string) => void;
  visible: boolean;
  maxResults?: number;
}

export function HashtagAutocomplete({ 
  query, 
  onSelect, 
  visible, 
  maxResults = 5 
}: HashtagAutocompleteProps) {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && query.length > 0) {
      searchHashtags(query);
    } else {
      setHashtags([]);
    }
  }, [query, visible]);

    const searchHashtags = async (searchQuery: string) => {
    try {
      setLoading(true);

      const cleanQuery = searchQuery.replace(/^#/, '').trim();
      if (!cleanQuery) {
        setHashtags([]);
        return;
      }

      const results = await searchService.searchHashtags(cleanQuery, maxResults);
      const mapped: Hashtag[] = results.map((item) => ({
        tag: item.hashtag,
        count: item.postsCount,
        trending: item.trending,
      }));

      // Keep typed hashtag as first option if not present in results.
      if (!mapped.some((item) => item.tag.toLowerCase() === cleanQuery.toLowerCase())) {
        mapped.unshift({ tag: cleanQuery, count: 0, trending: false });
      }

      setHashtags(mapped.slice(0, maxResults));
    } catch (error) {
      console.error('Failed to search hashtags:', error);
      setHashtags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagSelect = (hashtag: string) => {
    onSelect(hashtag);
    setHashtags([]);
  };

  const formatCount = (count: number) => {
    if (count === 0) return 'New';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const renderHashtag = ({ item }: { item: Hashtag }) => (
    <TouchableOpacity
      style={styles.hashtagItem}
      onPress={() => handleHashtagSelect(item.tag)}
      activeOpacity={0.7}
    >
      <View style={styles.hashtagIcon}>
        <Ionicons name="pricetag" size={16} color={colors.accent.primary} />
      </View>
      <View style={styles.hashtagInfo}>
        <View style={styles.hashtagRow}>
          <Text style={styles.hashtagText} numberOfLines={1}>
            #{item.tag}
          </Text>
          {item.trending && (
            <View style={styles.trendingBadge}>
              <Ionicons name="trending-up" size={12} color={colors.accent.primary} />
              <Text style={styles.trendingText}>Trending</Text>
            </View>
          )}
        </View>
        <Text style={styles.hashtagCount}>
          {formatCount(item.count)} posts
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!visible || (!loading && hashtags.length === 0)) {
    return null;
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <InlineLoadingSkeleton />
          <Text style={styles.loadingText}>Searching hashtags...</Text>
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          data={hashtags}
          renderItem={renderHashtag}
          keyExtractor={(item) => item.tag}
          style={styles.hashtagsList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  hashtagsList: {
    maxHeight: 200,
  },
  hashtagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  hashtagIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hashtagInfo: {
    flex: 1,
  },
  hashtagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hashtagText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    flex: 1,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  trendingText: {
    fontSize: typography.fontSize.xs,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
  },
  hashtagCount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});


