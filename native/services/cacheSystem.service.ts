import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheItem<T> {
  data: T;
  namespace: string;
  key: string;
  timestamp: number;
  updatedAt: number;
  lastAccessedAt: number;
  ttl: number;
  staleAt: number;
  expiresAt: number;
  version: number;
  tags: string[];
}

export interface CacheSetOptions {
  ttl?: number;
  staleWhileRevalidateMs?: number;
  version?: number;
  tags?: string[];
}

interface CacheConfig {
  defaultTTL: number;
  defaultStaleWhileRevalidateMs: number;
  maxSize: number;
  enablePersistence: boolean;
}

class CacheSystem {
  private memoryCache: Map<string, CacheItem<any>> = new Map();
  private config: CacheConfig;
  private cacheStats = {
    hits: 0,
    misses: 0,
    staleHits: 0,
    expirations: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000,
      defaultStaleWhileRevalidateMs: 30 * 1000,
      maxSize: 1000,
      enablePersistence: true,
      ...config,
    };
  }

  private generateKey(namespace: string, key: string): string {
    return `cache:${namespace}:${key}`;
  }

  private resolveSetOptions(ttlOrOptions?: number | CacheSetOptions): Required<CacheSetOptions> {
    if (typeof ttlOrOptions === 'number') {
      return {
        ttl: ttlOrOptions,
        staleWhileRevalidateMs: this.config.defaultStaleWhileRevalidateMs,
        version: 1,
        tags: [],
      };
    }

    return {
      ttl: ttlOrOptions?.ttl ?? this.config.defaultTTL,
      staleWhileRevalidateMs: ttlOrOptions?.staleWhileRevalidateMs ?? this.config.defaultStaleWhileRevalidateMs,
      version: ttlOrOptions?.version ?? 1,
      tags: ttlOrOptions?.tags ?? [],
    };
  }

  private createItem<T>(namespace: string, key: string, data: T, ttlOrOptions?: number | CacheSetOptions): CacheItem<T> {
    const now = Date.now();
    const options = this.resolveSetOptions(ttlOrOptions);
    return {
      data,
      namespace,
      key,
      timestamp: now,
      updatedAt: now,
      lastAccessedAt: now,
      ttl: options.ttl,
      staleAt: now + Math.max(0, Math.min(options.ttl, options.staleWhileRevalidateMs)),
      expiresAt: now + options.ttl,
      version: options.version,
      tags: Array.from(new Set(options.tags.filter(Boolean))),
    };
  }

  private normalizePersistedItem<T>(cacheKey: string, item: any): CacheItem<T> | null {
    if (!item || typeof item !== 'object' || !('data' in item)) {
      return null;
    }

    const segments = cacheKey.split(':');
    const namespace = typeof item.namespace === 'string' ? item.namespace : segments[1] || 'generic';
    const key = typeof item.key === 'string' ? item.key : segments.slice(2).join(':');
    const timestamp = Number(item.timestamp || Date.now());
    const ttl = Number(item.ttl || ((item.expiresAt ? Number(item.expiresAt) - timestamp : this.config.defaultTTL) || this.config.defaultTTL));
    const expiresAt = Number(item.expiresAt || (timestamp + ttl));
    const staleAt = Number(item.staleAt || Math.min(expiresAt, timestamp + this.config.defaultStaleWhileRevalidateMs));

    return {
      data: item.data as T,
      namespace,
      key,
      timestamp,
      updatedAt: Number(item.updatedAt || timestamp),
      lastAccessedAt: Number(item.lastAccessedAt || timestamp),
      ttl,
      staleAt,
      expiresAt,
      version: Number(item.version || 1),
      tags: Array.isArray(item.tags) ? item.tags.filter((tag: unknown): tag is string => typeof tag === 'string') : [],
    };
  }

  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() > item.expiresAt;
  }

  private isStale(item: CacheItem<any>): boolean {
    return Date.now() > item.staleAt;
  }

  private touchItem<T>(item: CacheItem<T>): CacheItem<T> {
    return {
      ...item,
      lastAccessedAt: Date.now(),
    };
  }

  private async persistItem<T>(cacheKey: string, item: CacheItem<T>): Promise<void> {
    if (!this.config.enablePersistence) return;
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(item));
    } catch (error) {
      console.warn('Cache persistence error:', error);
    }
  }

  private cleanupExpired(): void {
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
        this.cacheStats.expirations++;
      }
    }
  }

  private enforceSizeLimit(): void {
    if (this.memoryCache.size <= this.config.maxSize) return;

    const entries = Array.from(this.memoryCache.entries()).sort((a, b) => {
      if (a[1].lastAccessedAt === b[1].lastAccessedAt) {
        return a[1].updatedAt - b[1].updatedAt;
      }
      return a[1].lastAccessedAt - b[1].lastAccessedAt;
    });

    const itemsToRemove = entries.slice(0, entries.length - this.config.maxSize);
    itemsToRemove.forEach(([key]) => {
      this.memoryCache.delete(key);
      this.cacheStats.evictions++;
    });
  }

  async getEntry<T>(
    namespace: string,
    key: string,
    options: { allowStale?: boolean } = {}
  ): Promise<CacheItem<T> | null> {
    const cacheKey = this.generateKey(namespace, key);
    const memoryItem = this.memoryCache.get(cacheKey);

    if (memoryItem) {
      if (this.isExpired(memoryItem)) {
        this.memoryCache.delete(cacheKey);
        this.cacheStats.expirations++;
      } else {
        const touched = this.touchItem(memoryItem);
        this.memoryCache.set(cacheKey, touched);
        this.cacheStats.hits++;
        if (this.isStale(touched)) {
          this.cacheStats.staleHits++;
          if (!options.allowStale) {
            this.cacheStats.misses++;
            return null;
          }
        }
        return touched as CacheItem<T>;
      }
    }

    if (this.config.enablePersistence) {
      try {
        const persistedData = await AsyncStorage.getItem(cacheKey);
        if (persistedData) {
          const normalized = this.normalizePersistedItem<T>(cacheKey, JSON.parse(persistedData));
          if (normalized && !this.isExpired(normalized)) {
            const touched = this.touchItem(normalized);
            this.memoryCache.set(cacheKey, touched);
            this.cacheStats.hits++;
            if (this.isStale(touched)) {
              this.cacheStats.staleHits++;
              if (!options.allowStale) {
                this.cacheStats.misses++;
                return null;
              }
            }
            return touched;
          }
          await AsyncStorage.removeItem(cacheKey);
        }
      } catch (error) {
        console.warn('Cache persistence error:', error);
      }
    }

    this.cacheStats.misses++;
    return null;
  }

  async get<T>(namespace: string, key: string, options?: { allowStale?: boolean }): Promise<T | null> {
    const entry = await this.getEntry<T>(namespace, key, options);
    return entry ? entry.data : null;
  }

  peek<T>(namespace: string, key: string): T | null {
    const cacheKey = this.generateKey(namespace, key);
    const entry = this.memoryCache.get(cacheKey);
    if (!entry || this.isExpired(entry)) {
      if (entry) {
        this.memoryCache.delete(cacheKey);
        this.cacheStats.expirations++;
      }
      return null;
    }
    const touched = this.touchItem(entry);
    this.memoryCache.set(cacheKey, touched);
    return touched.data as T;
  }

  async set<T>(namespace: string, key: string, data: T, ttlOrOptions?: number | CacheSetOptions): Promise<void> {
    const cacheKey = this.generateKey(namespace, key);
    const item = this.createItem(namespace, key, data, ttlOrOptions);
    this.memoryCache.set(cacheKey, item);
    this.cacheStats.sets++;
    await this.persistItem(cacheKey, item);
    this.cleanupExpired();
    this.enforceSizeLimit();
  }

  async patch<T>(
    namespace: string,
    key: string,
    updater: (current: T | null) => T | null,
    ttlOrOptions?: number | CacheSetOptions
  ): Promise<T | null> {
    const current = await this.get<T>(namespace, key, { allowStale: true });
    const next = updater(current);
    if (next === null) {
      await this.delete(namespace, key);
      return null;
    }
    await this.set(namespace, key, next, ttlOrOptions);
    return next;
  }

  async delete(namespace: string, key: string): Promise<void> {
    const cacheKey = this.generateKey(namespace, key);
    this.memoryCache.delete(cacheKey);
    this.cacheStats.deletes++;

    if (this.config.enablePersistence) {
      try {
        await AsyncStorage.removeItem(cacheKey);
      } catch (error) {
        console.warn('Cache persistence error:', error);
      }
    }
  }

  async clearNamespace(namespace: string): Promise<void> {
    const prefix = `cache:${namespace}:`;

    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }

    if (this.config.enablePersistence) {
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const namespacedKeys = allKeys.filter((key) => key.startsWith(prefix));
        await AsyncStorage.multiRemove(namespacedKeys);
      } catch (error) {
        console.warn('Cache persistence error:', error);
      }
    }
  }

  async clearAll(): Promise<void> {
    this.memoryCache.clear();

    if (this.config.enablePersistence) {
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const cacheKeys = allKeys.filter((key) => key.startsWith('cache:'));
        await AsyncStorage.multiRemove(cacheKeys);
      } catch (error) {
        console.warn('Cache persistence error:', error);
      }
    }
  }

  getStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    return {
      ...this.cacheStats,
      memorySize: this.memoryCache.size,
      hitRate: total > 0 ? this.cacheStats.hits / total : 0,
    };
  }

  async getOrSet<T>(
    namespace: string,
    key: string,
    fallbackFn: () => Promise<T>,
    ttlOrOptions?: number | CacheSetOptions,
    options?: { allowStale?: boolean }
  ): Promise<T> {
    const cached = await this.get<T>(namespace, key, options);
    if (cached !== null) {
      return cached;
    }

    const data = await fallbackFn();
    await this.set(namespace, key, data, ttlOrOptions);
    return data;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);

    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        this.cacheStats.deletes++;
      }
    }

    if (this.config.enablePersistence) {
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const matchingKeys = allKeys.filter((key) => regex.test(key));
        await AsyncStorage.multiRemove(matchingKeys);
      } catch (error) {
        console.warn('Cache persistence error:', error);
      }
    }
  }
}

export const mainCache = new CacheSystem({
  defaultTTL: 5 * 60 * 1000,
  defaultStaleWhileRevalidateMs: 30 * 1000,
  maxSize: 1000,
  enablePersistence: true,
});

export const userCache = new CacheSystem({
  defaultTTL: 10 * 60 * 1000,
  defaultStaleWhileRevalidateMs: 60 * 1000,
  maxSize: 500,
  enablePersistence: true,
});

export const postCache = new CacheSystem({
  defaultTTL: 3 * 60 * 1000,
  defaultStaleWhileRevalidateMs: 20 * 1000,
  maxSize: 2000,
  enablePersistence: true,
});

export const storyCache = new CacheSystem({
  defaultTTL: 90 * 1000,
  defaultStaleWhileRevalidateMs: 10 * 1000,
  maxSize: 500,
  enablePersistence: true,
});

export const suggestionCache = new CacheSystem({
  defaultTTL: 30 * 60 * 1000,
  defaultStaleWhileRevalidateMs: 2 * 60 * 1000,
  maxSize: 200,
  enablePersistence: true,
});

export const CACHE_TTL = {
  USER_PROFILE: 10 * 60 * 1000,
  USER_POSTS: 5 * 60 * 1000,
  FEED_POSTS: 3 * 60 * 1000,
  STORIES: 25 * 1000,
  NOTIFICATIONS: 2 * 60 * 1000,
  SUGGESTIONS: 30 * 60 * 1000,
  SEARCH_RESULTS: 5 * 60 * 1000,
  CONVERSATIONS: 1 * 60 * 1000,
  FOLLOWING_LIST: 10 * 60 * 1000,
  ACTIVE_USERS: 30 * 1000,
  GENERIC: 5 * 60 * 1000,
} as const;

export { CacheSystem };
