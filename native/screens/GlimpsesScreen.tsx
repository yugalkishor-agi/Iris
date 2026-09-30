import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, type ViewToken } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { CachedImage } from '../components/ui/CachedImage';
import { colors, spacing, typography } from '../styles/theme';
import { ScreenSkeleton } from '../components/ui/LoadingSkeleton';
import { glimpseService } from '../services/glimpse.service';
import { cacheIntegration } from '../services/cacheIntegration.service';
import { feedRankingService } from '../services/feedRanking.service';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const gridGap = 1;
const tileSize = (width - gridGap * 2) / 3;
const tileRowHeight = tileSize * 1.7 + gridGap;
const GLIMPSES_CACHE_KEY = 'glimpses_explore_grid_v2';
const GLIMPSES_MEMORY = {
  items: [] as any[],
  hydratedAt: 0,
};
const GLIMPSES_SOFT_REFRESH_COOLDOWN_MS = 45 * 1000;

function formatCompactCount(value?: number) {
  const count = value || 0;
  if (count < 1000) return String(count);
  if (count < 1000000) {
    const short = (count / 1000).toFixed(count >= 100000 ? 0 : 1);
    return short.replace(/\.0$/, '') + 'K';
  }
  const short = (count / 1000000).toFixed(count >= 10000000 ? 0 : 1);
  return short.replace(/\.0$/, '') + 'M';
}

function getItemTimestamp(item: any) {
  const timestamp = item?.createdAt || item?.postedAt || item?.timestamp || item?.updatedAt;
  if (!timestamp) return 0;
  if (typeof timestamp === 'number') return timestamp;
  if (timestamp?.toMillis) return timestamp.toMillis();
  if (typeof timestamp?.seconds === 'number') return timestamp.seconds * 1000;
  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getViewsCount(item: any) {
  return Number(item?.stats?.viewsCount || item?.viewsCount || 0);
}

function getLikesCount(item: any) {
  return Number(item?.stats?.likesCount || item?.likesCount || 0);
}

function getCommentsCount(item: any) {
  return Number(item?.stats?.commentsCount || item?.commentsCount || 0);
}

function compareTrendingGlimpses(a: any, b: any) {
  const byViews = getViewsCount(b) - getViewsCount(a);
  if (byViews !== 0) return byViews;

  const byLikes = getLikesCount(b) - getLikesCount(a);
  if (byLikes !== 0) return byLikes;

  const byComments = getCommentsCount(b) - getCommentsCount(a);
  if (byComments !== 0) return byComments;

  return getItemTimestamp(b) - getItemTimestamp(a);
}

function isProbablyImageUri(uri?: string) {
  if (!uri || typeof uri !== 'string') return false;
  if (uri.startsWith('data:image/')) return true;
  return /\.(jpg|jpeg|png|webp|gif|bmp|avif)(\?|#|$)/i.test(uri);
}

function getMediaUri(item: any) {
  const previewCandidates = [
    item?.thumbnailURL,
    item?.thumbnailUrl,
    item?.coverURL,
    item?.coverUrl,
    item?.posterURL,
    item?.posterUrl,
    item?.previewURL,
    item?.previewUrl,
    item?.imageURL,
    item?.imageUrl,
    item?.mediaThumbnailURL,
    item?.mediaThumbnailUrl,
    item?.coverImageURL,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  if (previewCandidates.length > 0) {
    return previewCandidates[0];
  }

  const mediaCandidates = [
    item?.mediaURL,
    item?.mediaUrl,
    ...(Array.isArray(item?.mediaURLs) ? item.mediaURLs : []),
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  const imageCandidate = mediaCandidates.find((value) => isProbablyImageUri(value));
  return imageCandidate || '';
}

function getVideoUri(item: any) {
  const mediaCandidates = [
    item?.mediaURL,
    item?.mediaUrl,
    ...(Array.isArray(item?.mediaURLs) ? item.mediaURLs : []),
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  const videoCandidate = mediaCandidates.find((value) => !isProbablyImageUri(value));
  return videoCandidate || '';
}

function isVideoGlimpse(item: any) {
  return item?.mediaType === 'video' || /\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(getVideoUri(item));
}

function normalizeGlimpsesForViewer(items: any[]) {
  return (items || [])
    .filter((item: any) => isVideoGlimpse(item))
    .map((g: any) => {
      const id = g.glimpseId || g.storyId || g.postId;
      const mediaURL = getVideoUri(g) || g.mediaURL || g.mediaUrl || g.mediaURLs?.[0];
      if (!id || !mediaURL) return null;

      return {
        ...g,
        glimpseId: id,
        storyId: id,
        mediaURL,
        mediaType: 'video',
        thumbnailURL: g.thumbnailURL || g.thumbnailUrl || g.coverImageURL || g.coverURL || g.posterURL,
        coverImageURL: g.coverImageURL || g.coverURL || g.thumbnailURL || g.posterURL,
        stats: {
          likesCount: g?.stats?.likesCount || g?.likesCount || 0,
          commentsCount: g?.stats?.commentsCount || g?.commentsCount || 0,
          sharesCount: g?.stats?.sharesCount || g?.sharesCount || 0,
          viewsCount: g?.stats?.viewsCount || g?.viewsCount || 0,
        },
      };
    })
    .filter(Boolean);
}

function GlimpseTile({ item, onPress, shouldAutoPreview }: { item: any; onPress: () => void; shouldAutoPreview: boolean }) {
  const previewUri = getMediaUri(item);
  const videoUri = getVideoUri(item);
  const [hasPreviewError, setHasPreviewError] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const showVideoPreview = shouldAutoPreview && isVideoGlimpse(item) && Boolean(videoUri) && !hasVideoError;
  const hasPreview = Boolean(previewUri) && !hasPreviewError;

  useEffect(() => {
    setHasPreviewError(false);
    setHasVideoError(false);
  }, [previewUri, videoUri]);

  return (
    <TouchableOpacity style={styles.tile} activeOpacity={0.92} onPress={onPress}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {showVideoPreview ? (
          <Video
            source={{ uri: videoUri }}
            style={styles.tileMedia}
            resizeMode={ResizeMode.COVER}
            shouldPlay={shouldAutoPreview}
            isLooping
            isMuted
            useNativeControls={false}
            onError={() => setHasVideoError(true)}
          />
        ) : hasPreview ? (
          <CachedImage
            uri={previewUri}
            style={styles.tileMedia}
            contentFit="cover"
            onError={() => setHasPreviewError(true)}
          />
        ) : (
          <View style={styles.mediaFallback}>
            <Ionicons name="play" size={24} color="rgba(255,255,255,0.78)" />
          </View>
        )}
      </View>

      <View style={styles.mediaShade} pointerEvents="none" />

      <View style={styles.mediaTypeBadge} pointerEvents="none">
        <Ionicons name="play" size={12} color="#fff" />
      </View>

      <View style={styles.mediaViewsBadge} pointerEvents="none">
        <Ionicons name="play-outline" size={11} color="#fff" />
        <Text style={styles.mediaViewsText}>{formatCompactCount(getViewsCount(item))}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function GlimpsesScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const [glimpses, setGlimpses] = useState<any[]>(GLIMPSES_MEMORY.items);
  const [loading, setLoading] = useState(GLIMPSES_MEMORY.items.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const glimpsesRef = useRef<any[]>(GLIMPSES_MEMORY.items);

  useEffect(() => {
    glimpsesRef.current = glimpses;
  }, [glimpses]);

  const prefetchMediaPreviews = useCallback((items: any[]) => {
    items
      .map((item: any) => getMediaUri(item))
      .filter((uri: string) => Boolean(uri))
      .slice(0, 15)
      .forEach((uri: string) => {
        Image.prefetch(uri).catch(() => undefined);
      });
  }, []);

  const loadGlimpses = useCallback(async (refresh: boolean = false) => {
    try {
      if (!refresh && GLIMPSES_MEMORY.items.length > 0 && Date.now() - GLIMPSES_MEMORY.hydratedAt < GLIMPSES_SOFT_REFRESH_COOLDOWN_MS) {
        if (glimpsesRef.current.length === 0) {
          setGlimpses(GLIMPSES_MEMORY.items);
        }
        setLoading(false);
        return;
      }

      if (!refresh && glimpses.length === 0 && GLIMPSES_MEMORY.items.length === 0) {
        setLoading(true);
      }

      const cached = await cacheIntegration.getCachedData(GLIMPSES_CACHE_KEY);
      if (Array.isArray(cached) && cached.length > 0 && glimpsesRef.current.length === 0 && GLIMPSES_MEMORY.items.length === 0) {
        GLIMPSES_MEMORY.items = cached;
        GLIMPSES_MEMORY.hydratedAt = Date.now();
        setGlimpses(cached);
        prefetchMediaPreviews(cached);
        setLoading(false);
      }

      const items = await glimpseService.getExploreGlimpses(36, user?.userId);
      const next = (items || [])
        .filter((item: any) => isVideoGlimpse(item))
        .sort(compareTrendingGlimpses);

      GLIMPSES_MEMORY.items = next;
      GLIMPSES_MEMORY.hydratedAt = Date.now();
      setGlimpses(next);
      await cacheIntegration.cacheData(GLIMPSES_CACHE_KEY, next, 10 * 60 * 1000);
      prefetchMediaPreviews(next);
    } catch (error) {
      console.error('Failed to load glimpses:', error);
    } finally {
      setLoading(false);
    }
  }, [prefetchMediaPreviews, user?.userId]);
  useEffect(() => {
    let active = true;
    if (active) {
      void loadGlimpses();
    }
    return () => {
      active = false;
    };
  }, [loadGlimpses]);

  useEffect(() => {
    if (!isFocused) {
      setActivePreviewId(null);
    }
  }, [isFocused]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGlimpses(true);
    setRefreshing(false);
  }, [loadGlimpses]);

  const handleOpenViewer = useCallback(async (item: any) => {
    const itemId = item?.glimpseId || item?.storyId || item?.postId;
    if (!itemId) return;

    const normalized = normalizeGlimpsesForViewer(glimpses.length > 0 ? glimpses : [item]);
    const currentIndex = normalized.findIndex((g: any) => (g.glimpseId || g.storyId) === itemId);

    if (user?.userId) {
      feedRankingService.recordOpen(user.userId, {
        postId: itemId,
        userId: item.authorId || item.userId || '',
        mediaType: item.mediaType,
        backgroundMusic: item.backgroundMusic,
        createdAt: item.createdAt,
        likesCount: item?.stats?.likesCount || item?.likesCount || 0,
        commentsCount: item?.stats?.commentsCount || item?.commentsCount || 0,
        sharesCount: item?.stats?.sharesCount || item?.sharesCount || 0,
        viewsCount: item?.stats?.viewsCount || item?.viewsCount || 0,
        authorFollowersCount: item?.authorFollowersCount || item?.followersCount || 0,
      });
    }

    (navigation as any).navigate('GlimpseViewer', {
      glimpseId: itemId,
      glimpses: normalized,
      index: currentIndex >= 0 ? currentIndex : 0,
    });
  }, [glimpses, navigation, user?.userId]);
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 70,
    minimumViewTime: 180,
  }), []);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const firstVisible = viewableItems.find((token) => token.isViewable && token.item);
    const nextId = firstVisible?.item?.glimpseId || firstVisible?.item?.storyId || firstVisible?.item?.postId || null;
    setActivePreviewId(nextId);
  }).current;

  if (loading && glimpses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Glimpses</Text>
          <View style={styles.headerButton} />
        </View>
        <ScreenSkeleton variant="grid" rows={6} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Glimpses</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.headerButton}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlashList estimatedItemSize={100}
        data={glimpses}
        renderItem={({ item }) => (
          <GlimpseTile
            item={item}
            onPress={() => handleOpenViewer(item)}
            shouldAutoPreview={isFocused && activePreviewId === (item.glimpseId || item.storyId || item.postId)}
          />
        )}
        keyExtractor={(item, index) => item.glimpseId || item.storyId || item.postId || `glimpse-${index}`}
        numColumns={3}
        contentContainerStyle={styles.gridContent as any}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}

                removeClippedSubviews
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.background.primary,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContent: {
    paddingBottom: spacing.xxl,
  },
  gridRow: {
    gap: gridGap,
  },
  tile: {
    width: tileSize,
    height: tileSize * 1.7,
    backgroundColor: '#0d0f14',
    overflow: 'hidden',
    marginBottom: gridGap,
  },
  tileMedia: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0d0f14',
  },
  mediaFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d0f14',
  },
  mediaShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  mediaTypeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  mediaViewsBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  mediaViewsText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});








