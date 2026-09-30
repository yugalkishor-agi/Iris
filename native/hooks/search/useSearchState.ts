import { useState, useEffect } from 'react';
import { InteractionManager } from 'react-native';

export function useSearchState() {
  const [query, setQuery] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  return {
    query,
    setQuery,
    isReady,
    loading,
    setLoading,
    refreshing,
    setRefreshing,
    isSearchFocused,
    setIsSearchFocused,
  };
}
