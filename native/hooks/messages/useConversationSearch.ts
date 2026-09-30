// useConversationSearch.ts
// Purpose: Search conversations, messages, and media
// Extracted from: MessagesScreenEnhanced.tsx — Session 002

import { useCallback, useEffect, useState } from 'react';
import type { Conversation, User } from '../../types/database';

type SearchScope = 'chats' | 'messages' | 'media';

interface SearchResult {
  conversationId: string;
  message?: any;
  otherUser?: User;
}

interface UseConversationSearchProps {
  currentUserId: string | null;
  conversations: Conversation[];
  conversationUsers: { [key: string]: User };
}

export function useConversationSearch({
  currentUserId,
  conversations,
  conversationUsers,
}: UseConversationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('chats');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = useCallback(
    async (query: string, scope: SearchScope) => {
      if (!currentUserId || !query.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);

      try {
        const normalizedQuery = query.toLowerCase().trim();

        if (scope === 'chats') {
          // Search conversation names/users
          const results = conversations
            .filter((convo) => {
              const user = conversationUsers[convo.conversationId];
              if (!user) return false;

              const displayName = user.displayName?.toLowerCase() || '';
              const username = user.username?.toLowerCase() || '';
              const groupName = convo.groupName?.toLowerCase() || '';

              return (
                displayName.includes(normalizedQuery) ||
                username.includes(normalizedQuery) ||
                groupName.includes(normalizedQuery)
              );
            })
            .map((convo) => ({
              conversationId: convo.conversationId,
              otherUser: conversationUsers[convo.conversationId],
            }));

          setSearchResults(results);
        } else if (scope === 'messages') {
          // TODO: Message content search is not yet implemented in SearchService.
          // searchService.searchMessages was removed during refactor and never reimplemented.
          // Return empty results for now instead of crashing on a missing method.
          setSearchResults([]);
        } else if (scope === 'media') {
          // TODO: Media message search is not yet implemented in SearchService.
          // searchService.searchMedia was removed during refactor and never reimplemented.
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId, conversations, conversationUsers]
  );

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      void performSearch(searchQuery, searchScope);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchScope, performSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchScope,
    setSearchScope,
    searchResults,
    loading,
    clearSearch,
  };
}
