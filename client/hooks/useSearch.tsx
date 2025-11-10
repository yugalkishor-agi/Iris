import { useState } from 'react';
import { searchService } from '../../src/services/search.service';
import { useAuth } from '../contexts/AuthContext';
import type { User, Post } from '../../src/types/database';

export const useSearch = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = async (query: string): Promise<User[]> => {
    try {
      setLoading(true);
      setError(null);
      const results = await searchService.searchUsers(query);
      return results;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const searchPosts = async (query: string): Promise<Post[]> => {
    try {
      setLoading(true);
      setError(null);
      const { posts } = await searchService.searchPosts(query);
      return posts;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const searchHashtag = async (hashtag: string): Promise<Post[]> => {
    try {
      setLoading(true);
      setError(null);
      const { posts } = await searchService.searchHashtag(hashtag);
      return posts;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getTrendingHashtags = async () => {
    try {
      setLoading(true);
      setError(null);
      const hashtags = await searchService.getTrendingHashtags();
      return hashtags;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedUsers = async () => {
    if (!user) return [];

    try {
      setLoading(true);
      setError(null);
      const users = await searchService.getSuggestedUsers(user.userId);
      return users;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getExplorePosts = async (mediaType?: 'image' | 'video') => {
    try {
      setLoading(true);
      setError(null);
      const posts = await searchService.getExplorePosts(30, mediaType);
      return posts;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const saveSearch = (query: string) => {
    if (user) {
      searchService.saveRecentSearch(user.userId, query);
    }
  };

  const getRecentSearches = (): string[] => {
    if (!user) return [];
    return searchService.getRecentSearches(user.userId);
  };

  const clearRecentSearches = () => {
    if (user) {
      searchService.clearRecentSearches(user.userId);
    }
  };

  return {
    loading,
    error,
    searchUsers,
    searchPosts,
    searchHashtag,
    getTrendingHashtags,
    getSuggestedUsers,
    getExplorePosts,
    saveSearch,
    getRecentSearches,
    clearRecentSearches,
  };
};
