import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchService } from '../../services/search.service';
import { SEARCH_RECENT_LIMIT } from './searchTypes';

export function useRecentSearches(userId?: string) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const recentSearchesKey = userId ? `recent_searches_${userId}` : '';

  const writeRecentSearches = useCallback(
    async (next: string[]) => {
      const trimmed = next.slice(0, SEARCH_RECENT_LIMIT);
      setRecentSearches(trimmed);

      if (recentSearchesKey) {
        try {
          await AsyncStorage.setItem(recentSearchesKey, JSON.stringify(trimmed));
        } catch {}
      }

      if (userId) {
        try {
          searchService.clearRecentSearches(userId);
          [...trimmed].reverse().forEach((entry) => searchService.saveRecentSearch(userId, entry));
        } catch {}
      }
    },
    [recentSearchesKey, userId]
  );

  const persistRecentSearch = useCallback(
    async (value: string) => {
      if (!recentSearchesKey) return;
      const clean = value.trim();
      if (!clean) return;

      const next = [clean, ...recentSearches.filter((entry) => entry.toLowerCase() !== clean.toLowerCase())].slice(
        0,
        SEARCH_RECENT_LIMIT
      );
      setRecentSearches(next);

      if (userId) {
        try {
          searchService.saveRecentSearch(userId, clean);
        } catch {}
      }

      try {
        await AsyncStorage.setItem(recentSearchesKey, JSON.stringify(next));
      } catch {}
    },
    [recentSearches, recentSearchesKey, userId]
  );

  const clearAllRecentSearches = useCallback(async () => {
    await writeRecentSearches([]);
  }, [writeRecentSearches]);

  const removeRecentSearch = useCallback(
    async (value: string) => {
      const next = recentSearches.filter((entry) => entry.toLowerCase() !== value.toLowerCase());
      await writeRecentSearches(next);
    },
    [recentSearches, writeRecentSearches]
  );

  return {
    recentSearches,
    setRecentSearches,
    recentSearchesKey,
    persistRecentSearch,
    clearAllRecentSearches,
    removeRecentSearch,
  };
}
