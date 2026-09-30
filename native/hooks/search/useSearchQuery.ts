import { useState, useRef, useCallback, useEffect } from 'react';
import { searchService } from '../../services/search.service';
import { userService } from '../../services/user.service';
import { SearchUser, SearchHashtag, SearchPostResult } from './searchTypes';
import { normalizeUser, scoreSearchText } from './searchUtils';

export function useSearchQuery(
  userId: string | undefined,
  query: string,
  persistRecentSearch: (value: string) => Promise<void>
) {
  const [userResults, setUserResults] = useState<SearchUser[]>([]);
  const [tagResults, setTagResults] = useState<SearchHashtag[]>([]);
  const [postResults, setPostResults] = useState<SearchPostResult[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTokenRef = useRef(0);

  const runSearch = useCallback(
    async (value: string) => {
      const token = ++searchTokenRef.current;
      const clean = value.trim();
      if (!clean) {
        setUserResults([]);
        setTagResults([]);
        setPostResults([]);
        return;
      }

      try {
        const [users, hashtags, posts] = await Promise.all([
          userService.searchUsers(clean, 32).catch((err) => {
            console.warn('Search screen: User search failed:', err);
            return [];
          }),
          searchService.searchHashtags(clean, 20).catch((err) => {
            console.warn('Search screen: Hashtag search failed:', err);
            return [];
          }),
          searchService.searchPosts(clean, 32).then((result) => result.posts || []).catch((err) => {
            console.warn('Search screen: Post search failed:', err);
            return [];
          }),
        ]);

        if (token !== searchTokenRef.current) return;

        const normalizedQuery = clean.toLowerCase();
        const normalizedUsers = ((users || []).map(normalizeUser).filter(Boolean) as SearchUser[])
          .filter((entry) => entry.userId !== userId);

        const normalizedTags = (hashtags || []).filter((entry: SearchHashtag) =>
          scoreSearchText(String(entry?.hashtag || '').toLowerCase(), normalizedQuery) > 0
        );

        const normalizedPosts = ((posts || []) as SearchPostResult[]).filter((entry) => {
          const authorScore = scoreSearchText(String(entry?.authorUsername || '').toLowerCase(), normalizedQuery);
          const caption = String(entry?.caption || '').toLowerCase();
          const captionScore =
            normalizedQuery.length >= 3
              ? caption
                  .split(/[^a-z0-9_]+/)
                  .filter(Boolean)
                  .some((tokenPart) => tokenPart.startsWith(normalizedQuery))
              : false;
          return authorScore > 0 || captionScore;
        });

        setUserResults(normalizedUsers);
        setTagResults(normalizedTags);
        setPostResults(normalizedPosts);
        void persistRecentSearch(clean);
      } catch (error) {
        if (token === searchTokenRef.current) {
          console.error('Search screen query failed:', error);
        }
      }
    },
    [persistRecentSearch, userId]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, 220);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  return {
    userResults,
    tagResults,
    postResults,
  };
}
