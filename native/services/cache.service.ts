/**
 * Client-side caching service for optimizing Firestore reads
 * Implements hybrid caching strategy with TTL and monitoring
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  expirations: number;
  hitRate: string;
  total: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;
  private expirations = 0;

  // Default TTLs in milliseconds
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly USER_PROFILE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly FOLLOWING_LIST_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly POST_TTL = 2 * 60 * 1000; // 2 minutes

  // ==========================================
  // CORE CACHE OPERATIONS
  // ==========================================

  /**
   * Get cached data or fetch fresh
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      this.hits++;
      return cached.data as T;
    }

    if (cached) {
      this.expirations++;
    } else {
      this.misses++;
    }

    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate multiple keys matching pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.expirations = 0;
  }

  // ==========================================
  // DOMAIN-SPECIFIC CACHE METHODS
  // ==========================================

  /**
   * Cache user profile
   */
  async getUserProfile<T>(
    userId: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    return this.get(`user:${userId}`, fetchFn, this.USER_PROFILE_TTL);
  }

  /**
   * Invalidate user profile
   */
  invalidateUserProfile(userId: string): void {
    this.invalidate(`user:${userId}`);
  }

  /**
   * Cache following list
   */
  async getFollowingList(
    userId: string,
    fetchFn: () => Promise<string[]>
  ): Promise<string[]> {
    return this.get(`following:${userId}`, fetchFn, this.FOLLOWING_LIST_TTL);
  }

  /**
   * Invalidate following list
   */
  invalidateFollowingList(userId: string): void {
    this.invalidate(`following:${userId}`);
  }

  /**
   * Cache post
   */
  async getPost<T>(
    postId: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    return this.get(`post:${postId}`, fetchFn, this.POST_TTL);
  }

  /**
   * Invalidate post
   */
  invalidatePost(postId: string): void {
    this.invalidate(`post:${postId}`);
  }

  /**
   * Cache feed posts
   */
  async getFeedPosts<T>(
    userId: string,
    page: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    return this.get(`feed:${userId}:${page}`, fetchFn, this.POST_TTL);
  }

  /**
   * Invalidate feed
   */
  invalidateFeed(userId: string): void {
    this.invalidatePattern(`^feed:${userId}:`);
  }

  // ==========================================
  // METRICS & MONITORING
  // ==========================================

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : '0.00';

    return {
      hits: this.hits,
      misses: this.misses,
      expirations: this.expirations,
      hitRate: `${hitRate}%`,
      total,
    };
  }

  /**
   * Log cache metrics
   */
  logMetrics(): void {
    const metrics = this.getMetrics();
    console.log('📊 Cache Performance:', metrics);

    // Alert if hit rate is low
    const hitRate = parseFloat(metrics.hitRate);
    if (hitRate < 80 && metrics.total > 100) {
      console.warn('⚠️ Cache hit rate below 80%! Consider adjusting TTL or strategy.');
    }
  }

  /**
   * Get cache size
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.hits = 0;
    this.misses = 0;
    this.expirations = 0;
  }

  // ==========================================
  // ADAPTIVE TTL (EXPERIMENTAL)
  // ==========================================

  /**
   * Adjust TTL based on hit rate
   */
  getAdaptiveTTL(currentTTL: number): number {
    const metrics = this.getMetrics();
    const hitRate = parseFloat(metrics.hitRate);

    if (hitRate < 80 && metrics.total > 100) {
      // Increase TTL by 20% if hit rate is low
      return Math.min(currentTTL * 1.2, 15 * 60 * 1000); // Max 15 min
    } else if (hitRate > 95 && metrics.total > 100) {
      // Decrease TTL by 10% if hit rate is very high (might be stale)
      return Math.max(currentTTL * 0.9, 2 * 60 * 1000); // Min 2 min
    }

    return currentTTL;
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Log metrics every 5 minutes in development
if (import.meta.env.DEV) {
  setInterval(() => {
    cacheService.logMetrics();
  }, 5 * 60 * 1000);
}
