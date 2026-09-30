import AsyncStorage from '@react-native-async-storage/async-storage';
/**
 * Storage Service - Account-Aware Data Management
 * Handles user-specific and shared data with smart caching
 */

const STORAGE_KEYS = {
  SHARED: {
    ACCOUNTS: 'iris_accounts',
    ENCRYPTION_KEY: 'iris_enc_key',
    LAST_SWITCH: 'iris_last_switch',
    THEME: 'iris_theme',
    LANGUAGE: 'iris_language',
    APP_SETTINGS: 'iris_app_settings',
    BIOMETRIC: 'iris_biometric_credentials',
    PIXABAY_CACHE: 'pixabay-cache-',
  },
  USER_SPECIFIC: {
    SEARCH_HISTORY: 'iris_search_history_',
    RECENT_SEARCHES: 'iris_recent_searches_',
    DRAFT_POST: 'iris_draft_post_',
    DRAFT_GLIMPSE: 'iris_draft_glimpse_',
    CACHED_FEED: 'iris_cached_feed_',
    CACHED_PROFILE: 'iris_cached_profile_',
    VIEWED_STORIES: 'iris_viewed_stories_',
    UPLOAD_QUEUE: 'iris_upload_queue_',
  },
  SESSION: {
    SPLASH_SHOWN: 'splashShown',
    QUICK_SWITCH_HINT: 'quickSwitchHintShown',
    ACCOUNT_SWITCHING: 'accountSwitching',
  }
};

interface CachedStorageEntry<T> {
  data: T;
  timestamp: number;
  updatedAt: number;
  expiresAt: number;
  staleAt?: number;
  version: number;
}

const memoryStore = new Map<string, string>();

function memSet(key: string, value: string) {
  memoryStore.set(key, value);
  try { void AsyncStorage.setItem(key, value); } catch {}
}

function memGet(key: string): string | null {
  if (memoryStore.has(key)) return memoryStore.get(key) || null;
  try {
    void AsyncStorage.getItem(key).then((value) => {
      if (value != null) memoryStore.set(key, value);
    });
  } catch {}
  return null;
}

function memRemove(keys: string[]) {
  keys.forEach((key) => memoryStore.delete(key));
  try { void AsyncStorage.multiRemove(keys); } catch {}
}

function memClearAll() {
  memoryStore.clear();
  try { void AsyncStorage.clear(); } catch {}
}

export class StorageService {
  private getUserKey(baseKey: string, userId: string): string {
    return `${baseKey}${userId}`;
  }

  setUserData<T>(key: string, userId: string, data: T): void {
    memSet(this.getUserKey(key, userId), JSON.stringify(data));
  }

  getUserData<T>(key: string, userId: string): T | null {
    const raw = memGet(this.getUserKey(key, userId));
    return raw ? JSON.parse(raw) : null;
  }

  deleteUserDataKey(key: string, userId: string): void {
    memRemove([this.getUserKey(key, userId)]);
  }

  clearUserData(userId: string): void {
    const suffix = `_${userId}`;
    const keysToRemove: string[] = [];
    memoryStore.forEach((_, key) => {
      if (key.endsWith(suffix)) keysToRemove.push(key);
    });
    memRemove(keysToRemove);
    console.log(`Cleared ${keysToRemove.length} items for user:`, userId);
  }

  setSharedData<T>(key: string, data: T): void {
    memSet(key, JSON.stringify(data));
  }

  getSharedData<T>(key: string): T | null {
    const raw = memGet(key);
    return raw ? JSON.parse(raw) : null;
  }

  setCachedData<T>(key: string, userId: string, data: T, ttlMinutes: number = 30): void {
    const now = Date.now();
    const ttlMs = ttlMinutes * 60 * 1000;
    const cacheEntry: CachedStorageEntry<T> = {
      data,
      timestamp: now,
      updatedAt: now,
      expiresAt: now + ttlMs,
      staleAt: now + Math.max(15 * 1000, ttlMs * 0.5),
      version: 1,
    };
    this.setUserData(key, userId, cacheEntry);
  }

  getCachedEntry<T>(key: string, userId: string): CachedStorageEntry<T> | null {
    const cacheEntry = this.getUserData<CachedStorageEntry<T> | {
      data: T;
      timestamp: number;
      expiresAt: number;
    }>(key, userId);

    if (!cacheEntry) return null;

    const normalized: CachedStorageEntry<T> = {
      data: cacheEntry.data,
      timestamp: cacheEntry.timestamp,
      updatedAt: (cacheEntry as CachedStorageEntry<T>).updatedAt ?? cacheEntry.timestamp,
      expiresAt: cacheEntry.expiresAt,
      staleAt: (cacheEntry as CachedStorageEntry<T>).staleAt,
      version: (cacheEntry as CachedStorageEntry<T>).version ?? 1,
    };

    if (Date.now() > normalized.expiresAt) {
      this.deleteUserDataKey(key, userId);
      return null;
    }

    return normalized;
  }

  getCachedData<T>(key: string, userId: string): T | null {
    return this.getCachedEntry<T>(key, userId)?.data ?? null;
  }

  patchCachedData<T>(
    key: string,
    userId: string,
    updater: (current: T | null) => T | null,
    ttlMinutes: number = 30
  ): T | null {
    const current = this.getCachedEntry<T>(key, userId);
    const next = updater(current?.data ?? null);
    if (next === null) {
      this.deleteUserDataKey(key, userId);
      return null;
    }
    this.setCachedData(key, userId, next, ttlMinutes);
    return next;
  }

  async handleAccountSwitch(fromUserId: string, toUserId: string): Promise<void> {
    console.log('Switching storage from', fromUserId, 'to', toUserId);
    this.savePendingData(fromUserId);
    this.clearExpiredCache(fromUserId);
    this.preloadUserCache(toUserId);
    console.log('Storage switch complete');
  }

  private savePendingData(userId: string): void {
    console.log('Pending data already saved for:', userId);
  }

  private clearExpiredCache(userId: string): void {
    const now = Date.now();
    const suffix = `_${userId}`;
    const keysToRemove: string[] = [];
    memoryStore.forEach((value, key) => {
      if (!key.endsWith(suffix)) return;
      try {
        const data = JSON.parse(value || '{}');
        if (data.expiresAt && now > data.expiresAt) keysToRemove.push(key);
      } catch {}
    });
    memRemove(keysToRemove);
    if (keysToRemove.length > 0) console.log(`Cleared ${keysToRemove.length} expired items`);
  }

  private preloadUserCache(userId: string): void {
    const cachedFeed = this.getCachedData(STORAGE_KEYS.USER_SPECIFIC.CACHED_FEED, userId);
    const cachedProfile = this.getCachedData(STORAGE_KEYS.USER_SPECIFIC.CACHED_PROFILE, userId);

    if (cachedFeed || cachedProfile) {
      console.log('Pre-loaded cache for fast startup');
    } else {
      console.log('No cache found, will load fresh data');
    }
  }

  getStorageSize(): { total: number; perAccount: Record<string, number> } {
    let totalSize = 0;
    const perAccount: Record<string, number> = {};
    memoryStore.forEach((value, key) => {
      const size = new Blob([value]).size;
      totalSize += size;
      const match = key.match(/_([a-zA-Z0-9]+)$/);
      if (match) {
        const userId = match[1];
        perAccount[userId] = (perAccount[userId] || 0) + size;
      }
    });
    return {
      total: totalSize / (1024 * 1024),
      perAccount: Object.fromEntries(Object.entries(perAccount).map(([key, value]) => [key, value / (1024 * 1024)])),
    };
  }

  clearAllData(): void {
    memClearAll();
    console.log('All storage cleared');
  }
}

export const storageService = new StorageService();
export { STORAGE_KEYS };
