import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/Avatar';
import { CachedImage } from '../ui/CachedImage';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { formatCompactCount, getUserFollowerCount } from '../../hooks/search/searchUtils';
import { SearchUser, SearchHashtag, SearchPostResult } from '../../hooks/search/searchTypes';

interface SearchResultsListProps {
  searchData: any[];
  inlineRecentSearches: string[];
  setQuery: (val: string) => void;
  openUser: (user: SearchUser) => void;
  openHashtag: (hashtag: string) => void;
  openPost: (post: SearchPostResult) => void;
}

export function SearchResultsList({
  searchData,
  inlineRecentSearches,
  setQuery,
  openUser,
  openHashtag,
  openPost,
}: SearchResultsListProps) {
  const renderUserResult = ({ item }: { item: SearchUser }) => (
    <TouchableOpacity style={styles.resultRow} activeOpacity={0.82} onPress={() => openUser(item)}>
      <Avatar source={item.avatarURL} size={52} />
      <View style={styles.resultBody}>
        <View style={styles.resultTitleRow}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.username}
          </Text>
          {item.verified ? <VerifiedBadge size={14} /> : null}
        </View>
        <Text style={styles.resultSubtitle} numberOfLines={1}>
          {item.displayName || item.reason || 'Creator on Iris'}
        </Text>
      </View>
      <Text style={styles.resultMeta}>{formatCompactCount(getUserFollowerCount(item))}</Text>
    </TouchableOpacity>
  );

  const renderTagResult = ({ item }: { item: SearchHashtag }) => (
    <TouchableOpacity style={styles.resultRow} activeOpacity={0.82} onPress={() => openHashtag(item.hashtag)}>
      <View style={styles.tagIcon}>
        <Ionicons name={item.trending ? 'trending-up' : 'pricetag'} size={18} color="#7DD3FC" />
      </View>
      <View style={styles.resultBody}>
        <Text style={styles.resultTitle}>#{item.hashtag}</Text>
        <Text style={styles.resultSubtitle}>{formatCompactCount(item.postsCount)} posts</Text>
      </View>
      {item.trending ? <Text style={styles.tagPill}>Trending</Text> : null}
    </TouchableOpacity>
  );

  const renderPostResult = ({ item }: { item: SearchPostResult }) => {
    const preview = item.thumbnailURL || item.mediaURLs?.[0] || '';
    return (
      <TouchableOpacity style={styles.resultRow} activeOpacity={0.82} onPress={() => openPost(item)}>
        <View style={styles.postThumbWrap}>
          {preview ? <CachedImage uri={preview} style={styles.postThumb} resizeMode="cover" /> : <View style={styles.postThumb} />}
        </View>
        <View style={styles.resultBody}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.authorUsername ? `@${item.authorUsername}` : 'Post'}
          </Text>
          <Text style={styles.resultSubtitle} numberOfLines={2}>
            {item.caption || 'Open post'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.resultsWrap}>
      <FlashList
        data={searchData}
        estimatedItemSize={72}
        getItemType={(item: any) => item.__kind || 'post'}
        keyExtractor={(item: any, index) => `${String(item.__kind || 'item')}:${String(item.userId || item.postId || item.hashtag || index)}`}
        renderItem={(info: any) => {
          if (info.item.__kind === 'user') return renderUserResult({ item: info.item });
          if (info.item.__kind === 'tag') return renderTagResult({ item: info.item });
          return renderPostResult({ item: info.item });
        }}
        contentContainerStyle={styles.resultsList as any}
        ListHeaderComponent={
          inlineRecentSearches.length > 0 ? (
            <View style={styles.resultsRecentBlock}>
              <Text style={styles.resultsRecentTitle}>Recent searches</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.resultsRecentRow as any}>
                {inlineRecentSearches.map((entry) => (
                  <TouchableOpacity key={entry} activeOpacity={0.82} style={styles.resultsRecentChip} onPress={() => setQuery(entry)}>
                    <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.66)" />
                    <Text style={styles.resultsRecentChipText}>{entry}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptySubtitle}>Try a username, hashtag, or caption keyword.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  resultsWrap: {
    flex: 1,
  },
  resultsList: {
    paddingTop: 8,
    paddingBottom: 140,
  },
  resultsRecentBlock: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
  },
  resultsRecentTitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  resultsRecentRow: {
    gap: 8,
  },
  resultsRecentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: '#0A0D12',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  resultsRecentChipText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    paddingTop: 96,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  resultBody: {
    flex: 1,
    marginLeft: 14,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '800',
    maxWidth: '88%',
  },
  resultSubtitle: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  resultMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 10,
  },
  tagIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C1118',
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.12)',
  },
  tagPill: {
    color: '#9DD7FF',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(77,130,242,0.14)',
    overflow: 'hidden',
  },
  postThumbWrap: {
    width: 52,
    height: 68,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0C1016',
  },
  postThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111827',
  },
});
