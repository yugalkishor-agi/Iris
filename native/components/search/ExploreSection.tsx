import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Pressable, RefreshControl, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CachedImage } from '../ui/CachedImage';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import { formatCompactCount, getGlimpsePreview, getGlimpseViews, getGlimpseLikes } from '../../hooks/search/searchUtils';
import { SearchCreatorGlimpse } from '../../hooks/search/searchTypes';

interface ExploreSectionProps {
  trendingTags: Array<{ tag: string; postCount: number }>;
  discoverColumns: { left: any[]; right: any[] };
  setQuery: (val: string) => void;
  openGlimpse: (glimpse: any) => void;
  beginPreview: (glimpse: SearchCreatorGlimpse) => void;
  endPreview: () => void;
  refreshing: boolean;
  loadFresh: (force?: boolean) => void;
}

export function ExploreSection({
  trendingTags,
  discoverColumns,
  setQuery,
  openGlimpse,
  beginPreview,
  endPreview,
  refreshing,
  loadFresh,
}: ExploreSectionProps) {
  const { width } = useWindowDimensions();
  const tileWidth = Math.floor((width - spacing.lg * 2 - spacing.md) / 2);
  const suppressPreviewTapRef = useRef<string | null>(null);

  const buildPreviewPayload = useCallback((item: any): SearchCreatorGlimpse | null => {
    const previewURL = getGlimpsePreview(item);
    const glimpseId = String(item?.glimpseId || item?.storyId || '');
    if (!previewURL || !glimpseId) return null;
    return {
      glimpseId,
      authorId: String(item?.authorId || ''),
      authorUsername: String(item?.authorUsername || 'creator'),
      authorAvatarURL: item?.authorAvatarURL || '',
      authorVerified: !!item?.authorVerified,
      followersCount: Number(item?.followersCount || 0),
      previewURL,
      viewsCount: getGlimpseViews(item),
      likesCount: getGlimpseLikes(item),
      caption: String(item?.caption || ''),
      reason: typeof item?.reason === 'string' ? item.reason : 'Preview',
    };
  }, []);

  const handleBeginPreview = (item: any) => {
    const previewItem = buildPreviewPayload(item);
    if (previewItem) {
      suppressPreviewTapRef.current = previewItem.glimpseId;
      beginPreview(previewItem);
    }
  };

  const handleEndPreview = () => {
    endPreview();
    setTimeout(() => {
      suppressPreviewTapRef.current = null;
    }, 120);
  };

  const renderDiscoverTile = (item: any, index: number) => {
    const preview = getGlimpsePreview(item);
    const tall = index % 5 === 0 || index % 5 === 3;
    return (
      <Pressable
        key={String(item?.glimpseId || item?.storyId || index)}
        style={[styles.discoverTile, { width: tileWidth, height: tall ? tileWidth * 1.42 : tileWidth * 1.08 }]}
        onPress={() => {
          const previewId = String(item?.glimpseId || item?.storyId || '');
          if (suppressPreviewTapRef.current === previewId) return;
          openGlimpse(item);
        }}
        onLongPress={() => handleBeginPreview(item)}
        onPressOut={handleEndPreview}
        delayLongPress={180}
      >
        {preview ? <CachedImage uri={preview} style={styles.discoverImage} resizeMode="cover" /> : <View style={styles.discoverFallback} />}
        <View style={styles.discoverShade} />
        <View style={styles.discoverBadge}>
          <Ionicons name="play" size={12} color="#FFFFFF" />
          <Text style={styles.discoverBadgeText}>{formatCompactCount(getGlimpseViews(item))}</Text>
        </View>
        <View style={styles.discoverFooter}>
          <Text style={styles.discoverUsername} numberOfLines={1}>
            @{item?.authorUsername || 'creator'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons 
              name={item?.isLiked ? "heart" : "heart-outline"} 
              size={12} 
              color={item?.isLiked ? "#ef4444" : "rgba(255,255,255,0.7)"} 
              style={{ marginRight: 3 }} 
            />
            <Text style={styles.discoverLikes}>{formatCompactCount(getGlimpseLikes(item))}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadFresh(true)} tintColor="#67E8F9" />}
      contentContainerStyle={styles.scrollContent as any}
    >
      {trendingTags.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending now</Text>
            <Text style={styles.sectionCaption}>What people are searching</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRow as any}>
            {trendingTags.map((tag) => (
              <TouchableOpacity
                key={tag.tag}
                activeOpacity={0.84}
                style={styles.trendChip}
                onPress={() => setQuery(tag.tag)}
              >
                <Text style={styles.trendChipTitle}>{tag.tag}</Text>
                <Text style={styles.trendChipMeta}>{formatCompactCount(tag.postCount)} posts</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.masonryRow}>
          <View style={styles.masonryColumn}>
            {discoverColumns.left.map((item, index) => renderDiscoverTile(item, index * 2))}
          </View>
          <View style={styles.masonryColumn}>
            {discoverColumns.right.map((item, index) => renderDiscoverTile(item, index * 2 + 1))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 148,
  },
  section: {
    marginTop: 18,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 31,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  sectionCaption: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: typography.fontSize.sm,
    marginTop: 4,
  },
  tagRow: {
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  trendChip: {
    width: 138,
    minHeight: 88,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
    backgroundColor: '#0C1018',
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.12)',
  },
  trendChipTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  trendChipMeta: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: 13,
    fontWeight: '600',
  },
  masonryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  masonryColumn: {
    flex: 1,
    gap: spacing.md,
  },
  discoverTile: {
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#080B10',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  discoverImage: {
    ...StyleSheet.absoluteFillObject,
  },
  discoverFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#10151D',
  },
  discoverShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  discoverBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(8,11,16,0.76)',
  },
  discoverBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  discoverFooter: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  discoverUsername: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  discoverLikes: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '600',
  },
});
