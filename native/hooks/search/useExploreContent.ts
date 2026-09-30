import { useState, useCallback, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cacheIntegration } from '../../services/cacheIntegration.service';
import { searchService } from '../../services/search.service';
import { glimpseService } from '../../services/glimpse.service';
import { userService } from '../../services/user.service';
import { buildSearchBootstrapCacheKey } from '../../services/appWarmup.service';
import { SearchBootstrap, SearchCreatorGlimpse, SEARCH_CACHE_TTL_MS, SEARCH_RECENT_LIMIT } from './searchTypes';
import {
  getGlimpsePreview,
  getGlimpseViews,
  getGlimpseLikes,
  getUserFollowerCount,
  normalizeUser,
  sortViralGlimpses,
} from './searchUtils';

export function useExploreContent(
  userId: string | undefined,
  recentSearchesKey: string,
  setRecentSearches: (searches: string[]) => void,
  setLoading: (val: boolean) => void,
  setRefreshing: (val: boolean) => void,
  isReady: boolean
) {
  const [trendingTags, setTrendingTags] = useState<Array<{ tag: string; postCount: number }>>([]);
  const [exploreGlimpses, setExploreGlimpses] = useState<any[]>([]);
  const [risingCreatorGlimpses, setRisingCreatorGlimpses] = useState<SearchCreatorGlimpse[]>([]);

  const loadTokenRef = useRef(0);
  const bootstrapCacheKey = userId ? buildSearchBootstrapCacheKey(userId) : '';

  const discoverGlimpses = useMemo(() => {
    if (exploreGlimpses.length === 0) return [] as any[];

    const byId = new Map<string, any>();
    exploreGlimpses.forEach((entry) => {
      const id = String(entry?.glimpseId || entry?.storyId || '');
      if (!id) return;
      byId.set(id, entry);
    });

    const prioritized = risingCreatorGlimpses
      .map((entry) => byId.get(String(entry?.glimpseId || '')))
      .filter(Boolean) as any[];

    const seen = new Set(prioritized.map((entry) => String(entry?.glimpseId || entry?.storyId || '')));
    const rest = exploreGlimpses.filter((entry) => {
      const id = String(entry?.glimpseId || entry?.storyId || '');
      return !id || !seen.has(id);
    });

    return [...prioritized, ...rest];
  }, [exploreGlimpses, risingCreatorGlimpses]);

  const discoverColumns = useMemo(() => {
    const left: any[] = [];
    const right: any[] = [];
    discoverGlimpses.forEach((item, index) => {
      if (index % 2 === 0) left.push(item);
      else right.push(item);
    });
    return { left, right };
  }, [discoverGlimpses]);

  const buildRisingCreatorGlimpses = useCallback(
    async (glimpses: any[]) => {
      const authorIds = Array.from(
        new Set(
          (glimpses || [])
            .map((item) => String(item?.authorId || ''))
            .filter((entry) => entry.length > 0 && entry !== userId)
        )
      );

      const usersById = await userService.getUsersByIds(authorIds.slice(0, 22));
      const strongestByAuthor = new Map<string, any>();

      (glimpses || []).forEach((entry) => {
        const authorId = String(entry?.authorId || '');
        if (!authorId || authorId === userId) return;

        const current = strongestByAuthor.get(authorId);
        const currentScore = current ? getGlimpseViews(current) * 1.8 + getGlimpseLikes(current) * 2.5 : -1;
        const nextScore = getGlimpseViews(entry) * 1.8 + getGlimpseLikes(entry) * 2.5;
        if (!current || nextScore > currentScore) {
          strongestByAuthor.set(authorId, entry);
        }
      });

      return Array.from(strongestByAuthor.entries())
        .map(([authorId, strongest]) => {
          const normalized = normalizeUser(usersById[authorId]);
          const previewURL = getGlimpsePreview(strongest);
          if (!normalized || !previewURL) return null;

          const followersCount = getUserFollowerCount(normalized);
          const discoveryScore =
            getGlimpseViews(strongest) * 1.8 +
            getGlimpseLikes(strongest) * 2.5 +
            (followersCount <= 1800 ? 2200 : 0) +
            (followersCount <= 500 ? 1200 : 0);

          return {
            glimpseId: String(strongest?.glimpseId || strongest?.storyId || ''),
            authorId,
            authorUsername: normalized.username,
            authorAvatarURL: normalized.avatarURL,
            authorVerified: normalized.verified,
            followersCount,
            previewURL,
            viewsCount: getGlimpseViews(strongest),
            likesCount: getGlimpseLikes(strongest),
            caption: String(strongest?.caption || ''),
            reason:
              followersCount <= 1200
                ? 'New creator picking up speed'
                : 'Fresh creator clip gaining traction',
            __score: discoveryScore,
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b.__score - a.__score)
        .slice(0, 8)
        .map(({ __score, ...entry }: any) => entry) as SearchCreatorGlimpse[];
    },
    [userId]
  );

  useLayoutEffect(() => {
    if (!bootstrapCacheKey) return;
    const cached = cacheIntegration.peekCachedData(bootstrapCacheKey) as SearchBootstrap | null;
    if (!cached) return;

    if (Array.isArray(cached.recentSearches) && cached.recentSearches.length > 0) {
      setRecentSearches(cached.recentSearches.slice(0, SEARCH_RECENT_LIMIT));
    }
    if (Array.isArray(cached.trendingHashtags) && cached.trendingHashtags.length > 0) {
      setTrendingTags(cached.trendingHashtags.slice(0, 10));
    }
    if (Array.isArray(cached.exploreGlimpses) && cached.exploreGlimpses.length > 0) {
      const normalized = sortViralGlimpses(cached.exploreGlimpses).slice(0, 18);
      setExploreGlimpses(normalized);
      if (Array.isArray(cached.risingCreatorGlimpses) && cached.risingCreatorGlimpses.length > 0) {
        setRisingCreatorGlimpses(cached.risingCreatorGlimpses);
      }
    }
    setLoading(false);
  }, [bootstrapCacheKey, setRecentSearches, setLoading]);

  const loadBootstrap = useCallback(async () => {
    if (!userId || !bootstrapCacheKey) return null;
    try {
      const cached = (await cacheIntegration.getCachedData(bootstrapCacheKey)) as SearchBootstrap | null;
      if (!cached) return null;

      if (Array.isArray(cached.recentSearches) && cached.recentSearches.length > 0) {
        setRecentSearches(cached.recentSearches.slice(0, SEARCH_RECENT_LIMIT));
      }
      if (Array.isArray(cached.trendingHashtags) && cached.trendingHashtags.length > 0) {
        setTrendingTags(cached.trendingHashtags.slice(0, 10));
      }
      if (Array.isArray(cached.exploreGlimpses) && cached.exploreGlimpses.length > 0) {
        const normalized = sortViralGlimpses(cached.exploreGlimpses).slice(0, 18);
        setExploreGlimpses(normalized);
        if (Array.isArray(cached.risingCreatorGlimpses) && cached.risingCreatorGlimpses.length > 0) {
          setRisingCreatorGlimpses(cached.risingCreatorGlimpses);
        } else {
          void buildRisingCreatorGlimpses(normalized).then(setRisingCreatorGlimpses).catch(() => undefined);
        }
      }
      return cached;
    } catch {
      return null;
    }
  }, [bootstrapCacheKey, buildRisingCreatorGlimpses, userId, setRecentSearches]);

  const loadFresh = useCallback(
    async (force = false, hasHydratedState = false) => {
      if (!userId || !bootstrapCacheKey) return;

      const token = ++loadTokenRef.current;
      if (force) setRefreshing(true);
      else if (!hasHydratedState) setLoading(true);

      try {
        const [trending, glimpses, cachedRecents] = await Promise.all([
          searchService.getTrendingHashtags(10),
          glimpseService.getExploreGlimpses(26),
          recentSearchesKey ? AsyncStorage.getItem(recentSearchesKey) : Promise.resolve(null),
        ]);

        if (token !== loadTokenRef.current) return;

        let nextRecentSearches = (() => {
          if (!cachedRecents) return [] as string[];
          try {
            const parsed = JSON.parse(cachedRecents);
            return Array.isArray(parsed)
              ? parsed.filter((entry) => typeof entry === 'string').slice(0, SEARCH_RECENT_LIMIT)
              : [];
          } catch {
            return [];
          }
        })();

        if (nextRecentSearches.length === 0 && userId) {
          try {
            const fallbackRecent = searchService.getRecentSearches(userId);
            if (Array.isArray(fallbackRecent) && fallbackRecent.length > 0) {
              nextRecentSearches = fallbackRecent
                .filter((entry) => typeof entry === 'string' && entry.trim().length > 0)
                .slice(0, SEARCH_RECENT_LIMIT);
            }
          } catch {}
        }

        const nextGlimpses = sortViralGlimpses(glimpses || []).slice(0, 18);
        const nextCreators = await buildRisingCreatorGlimpses(nextGlimpses);

        setTrendingTags(trending || []);
        setExploreGlimpses(nextGlimpses);
        setRecentSearches(nextRecentSearches);
        setRisingCreatorGlimpses(nextCreators);

        await cacheIntegration.cacheData(
          bootstrapCacheKey,
          {
            exploreGlimpses: nextGlimpses,
            risingCreatorGlimpses: nextCreators,
            trendingHashtags: trending || [],
            recentSearches: nextRecentSearches,
            warmedAt: Date.now(),
          },
          SEARCH_CACHE_TTL_MS
        );
      } finally {
        if (token === loadTokenRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [bootstrapCacheKey, buildRisingCreatorGlimpses, recentSearchesKey, userId, setRecentSearches, setLoading, setRefreshing]
  );

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      const cached = await loadBootstrap();
      if (!cancelled) {
        void loadFresh(!cached, Boolean(cached));
      }
    };

    if (isReady) {
      void boot();
    }

    return () => {
      cancelled = true;
    };
  }, [loadBootstrap, loadFresh, userId, isReady, setLoading]);

  return {
    trendingTags,
    exploreGlimpses,
    discoverGlimpses,
    discoverColumns,
    loadFresh
  };
}
