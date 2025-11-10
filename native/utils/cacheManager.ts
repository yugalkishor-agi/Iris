/**
 * Heavy Caching System for Iris
 * Implements multi-layer caching for optimal performance
 */

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items
}

class CacheManager {
  private memoryCache: Map<string, { data: any; timestamp: number; hits: number }> = new Map();
  private config: { [key: string]: CacheConfig } = {
    users: { ttl: 5 * 60 * 1000, maxSize: 100 }, // 5 minutes
    posts: { ttl: 2 * 60 * 1000, maxSize: 50 }, // 2 minutes
    stories: { ttl: 1 * 60 * 1000, maxSize: 30 }, // 1 minute
    glimpses: { ttl: 3 * 60 * 1000, maxSize: 40 }, // 3 minutes
    comments: { ttl: 1 * 60 * 1000, maxSize: 100 }, // 1 minute
    messages: { ttl: 30 * 1000, maxSize: 200 }, // 30 seconds
  };

  /**
   * Get item from cache
   */
  get<T>(key: string, category: string = 'default'): T | null {
    const cacheKey = `${category}:${key}`;
    const cached = this.memoryCache.get(cacheKey);

    if (!cached) return null;

    const config = this.config[category] || { ttl: 60000, maxSize: 50 };
    const isExpired = Date.now() - cached.timestamp > config.ttl;

    if (isExpired) {
      this.memoryCache.delete(cacheKey);
      return null;
    }

    // Update hit count
    cached.hits++;
    return cached.data as T;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: any, category: string = 'default'): void {
    const cacheKey = `${category}:${key}`;
    const config = this.config[category] || { ttl: 60000, maxSize: 50 };

    // Check cache size and evict if necessary
    const categoryItems = Array.from(this.memoryCache.keys()).filter(k => k.startsWith(`${category}:`));
    if (categoryItems.length >= config.maxSize) {
      // Evict least recently used item
      const lruKey = this.findLRU(categoryItems);
      if (lruKey) {
        this.memoryCache.delete(lruKey);
      }
    }

    this.memoryCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Delete item from cache
   */
  delete(key: string, category: string = 'default'): void {
    const cacheKey = `${category}:${key}`;
    this.memoryCache.delete(cacheKey);
  }

  /**
   * Clear entire category
   */
  clearCategory(category: string): void {
    const keysToDelete = Array.from(this.memoryCache.keys()).filter(k => k.startsWith(`${category}:`));
    keysToDelete.forEach(key => this.memoryCache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.memoryCache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    const stats: any = {
      totalItems: this.memoryCache.size,
      categories: {},
    };

    for (const category in this.config) {
      const categoryItems = Array.from(this.memoryCache.keys()).filter(k => k.startsWith(`${category}:`));
      stats.categories[category] = {
        count: categoryItems.length,
        maxSize: this.config[category].maxSize,
        ttl: this.config[category].ttl,
      };
    }

    return stats;
  }

  /**
   * Find least recently used item
   */
  private findLRU(keys: string[]): string | null {
    let lruKey: string | null = null;
    let minHits = Infinity;
    let oldestTimestamp = Infinity;

    keys.forEach(key => {
      const cached = this.memoryCache.get(key);
      if (cached) {
        if (cached.hits < minHits || (cached.hits === minHits && cached.timestamp < oldestTimestamp)) {
          minHits = cached.hits;
          oldestTimestamp = cached.timestamp;
          lruKey = key;
        }
      }
    });

    return lruKey;
  }

  /**
   * Prefetch data for better UX
   */
  async prefetch<T>(
    key: string,
    category: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cached = this.get<T>(key, category);
    if (cached) return cached;

    const data = await fetchFn();
    this.set(key, data, category);
    return data;
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

/**
 * IndexedDB Cache for larger data
 */
class IndexedDBCache {
  private dbName = 'IrisCache';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media', { keyPath: 'url' });
        }
        if (!db.objectStoreNames.contains('feeds')) {
          db.createObjectStore('feeds', { keyPath: 'id' });
        }
      };
    });
  }

  async set(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName: string, key: string): Promise<any> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDBCache = new IndexedDBCache();
