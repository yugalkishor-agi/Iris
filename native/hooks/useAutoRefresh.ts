import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AutoRefreshOptions {
  interval?: number; // Refresh interval in milliseconds
  onForeground?: boolean; // Refresh when app comes to foreground
  networkAware?: boolean; // Only refresh when connected
  cacheKey?: string; // Key for caching last refresh time
  minRefreshGap?: number; // Minimum gap between refreshes
  enabled?: boolean; // Enable/disable auto refresh
}

interface AutoRefreshReturn {
  isRefreshing: boolean;
  lastRefreshTime: number | null;
  forceRefresh: () => void;
  pauseRefresh: () => void;
  resumeRefresh: () => void;
}

export function useAutoRefresh(
  refreshFunction: () => Promise<void> | void,
  options: AutoRefreshOptions = {}
): AutoRefreshReturn {
  const {
    interval = 30000, // 30 seconds default
    onForeground = true,
    networkAware = true,
    cacheKey,
    minRefreshGap = 5000, // 5 seconds minimum gap
    enabled = true,
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastRefreshRef = useRef<number>(0);
  const refreshFunctionRef = useRef(refreshFunction);
  const isRefreshingRef = useRef(false);
  const isPausedRef = useRef(false);
  const isConnectedRef = useRef(true);

  useEffect(() => {
    refreshFunctionRef.current = refreshFunction;
  }, [refreshFunction]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  // Network state monitoring (simplified for now)
  useEffect(() => {
    // For now, assume always connected
    // TODO: Add proper network detection with @react-native-netinfo/netinfo
    setIsConnected(true);
  }, []);

  // Load last refresh time from cache
  useEffect(() => {
    if (!cacheKey) return;

    const loadLastRefreshTime = async () => {
      try {
        const cached = await AsyncStorage.getItem(`refresh_${cacheKey}`);
        if (cached) {
          const time = parseInt(cached, 10);
          setLastRefreshTime(time);
          lastRefreshRef.current = time;
        }
      } catch (error) {
        console.error('Failed to load last refresh time:', error);
      }
    };

    void loadLastRefreshTime();
  }, [cacheKey]);

  // Save last refresh time to cache
  const saveLastRefreshTime = useCallback(async (time: number) => {
    if (!cacheKey) return;

    try {
      await AsyncStorage.setItem(`refresh_${cacheKey}`, time.toString());
    } catch (error) {
      console.error('Failed to save last refresh time:', error);
    }
  }, [cacheKey]);

  // Execute refresh with checks
  const executeRefresh = useCallback(async (force = false) => {
    if (!enabled || isPausedRef.current || isRefreshingRef.current) return;

    if (networkAware && !isConnectedRef.current) {      return;
    }

    const now = Date.now();
    if (!force && (now - lastRefreshRef.current) < minRefreshGap) {      return;
    }

    try {
      isRefreshingRef.current = true;
      setIsRefreshing(true);
      await Promise.resolve(refreshFunctionRef.current());

      const refreshTime = Date.now();
      lastRefreshRef.current = refreshTime;
      setLastRefreshTime(refreshTime);
      await saveLastRefreshTime(refreshTime);    } catch (error) {
      console.error('Auto-refresh failed:', error);
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [enabled, networkAware, minRefreshGap, saveLastRefreshTime]);

  // Periodic refresh
  useEffect(() => {
    if (!enabled || isPaused || !interval) return;

    intervalRef.current = setInterval(() => {
      void executeRefresh();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, isPaused, interval, executeRefresh]);

  // App state change handler
  useEffect(() => {
    if (!onForeground) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {        void executeRefresh(true);
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription?.remove();
  }, [onForeground, executeRefresh]);

  const forceRefresh = useCallback(() => {
    void executeRefresh(true);
  }, [executeRefresh]);

  const pauseRefresh = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const resumeRefresh = useCallback(() => {
    setIsPaused(false);
  }, []);

  return {
    isRefreshing,
    lastRefreshTime,
    forceRefresh,
    pauseRefresh,
    resumeRefresh,
  };
}

// Specialized hooks for different content types
export function useFeedAutoRefresh(refreshFunction: () => Promise<void> | void) {
  return useAutoRefresh(refreshFunction, {
    interval: 30000, // 30 seconds
    cacheKey: 'feed',
    onForeground: true,
    networkAware: true,
  });
}

export function useStoriesAutoRefresh(refreshFunction: () => Promise<void> | void) {
  return useAutoRefresh(refreshFunction, {
    interval: 60000, // 1 minute
    cacheKey: 'stories',
    onForeground: true,
    networkAware: true,
  });
}

export function useMessagesAutoRefresh(refreshFunction: () => Promise<void> | void) {
  return useAutoRefresh(refreshFunction, {
    interval: 10000, // 10 seconds
    cacheKey: 'messages',
    onForeground: true,
    networkAware: true,
    minRefreshGap: 2000, // 2 seconds minimum
  });
}

export function useNotificationsAutoRefresh(refreshFunction: () => Promise<void> | void) {
  return useAutoRefresh(refreshFunction, {
    interval: 30000, // 30 seconds
    cacheKey: 'notifications',
    onForeground: true,
    networkAware: true,
  });
}

export function useProfileAutoRefresh(refreshFunction: () => Promise<void> | void) {
  return useAutoRefresh(refreshFunction, {
    interval: 300000, // 5 minutes
    cacheKey: 'profile',
    onForeground: true,
    networkAware: true,
  });
}

export function useSearchAutoRefresh(refreshFunction: () => Promise<void> | void) {
  return useAutoRefresh(refreshFunction, {
    interval: 120000, // 2 minutes
    cacheKey: 'search',
    onForeground: true,
    networkAware: true,
  });
}


