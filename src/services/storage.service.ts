/**
 * Storage Service - Account-Aware Data Management
 * Handles user-specific and shared data with smart caching
 */

// Storage Keys
const STORAGE_KEYS = {
  // Shared across all accounts (never cleared)
  SHARED: {
    ACCOUNTS: 'iris_accounts',
    ENCRYPTION_KEY: 'iris_enc_key',
    LAST_SWITCH: 'iris_last_switch',
    THEME: 'iris_theme',
    LANGUAGE: 'iris_language',
    APP_SETTINGS: 'iris_app_settings',
    BIOMETRIC: 'iris_biometric_credentials',
    PIXABAY_CACHE: 'pixabay-cache-', // prefix
  },
  
  // User-specific (cleared on account switch)
  USER_SPECIFIC: {
    SEARCH_HISTORY: 'iris_search_history_', // + userId
    RECENT_SEARCHES: 'iris_recent_searches_', // + userId
    DRAFT_POST: 'iris_draft_post_', // + userId
    DRAFT_GLIMPSE: 'iris_draft_glimpse_', // + userId
    CACHED_FEED: 'iris_cached_feed_', // + userId
    CACHED_PROFILE: 'iris_cached_profile_', // + userId
    VIEWED_STORIES: 'iris_viewed_stories_', // + userId
    UPLOAD_QUEUE: 'iris_upload_queue_', // + userId
  },
  
  // Temporary (session-based)
  SESSION: {
    SPLASH_SHOWN: 'splashShown',
    QUICK_SWITCH_HINT: 'quickSwitchHintShown',
    ACCOUNT_SWITCHING: 'accountSwitching',
  }
};

export class StorageService {
  /**
   * Get user-specific key
   */
  private getUserKey(baseKey: string, userId: string): string {
    return `${baseKey}${userId}`;
  }

  // ==========================================
  // USER-SPECIFIC STORAGE
  // ==========================================

  /**
   * Set user-specific data
   */
  setUserData<T>(key: string, userId: string, data: T): void {
    const userKey = this.getUserKey(key, userId);
    localStorage.setItem(userKey, JSON.stringify(data));
  }

  /**
   * Get user-specific data
   */
  getUserData<T>(key: string, userId: string): T | null {
    const userKey = this.getUserKey(key, userId);
    const data = localStorage.getItem(userKey);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Clear all data for specific user
   */
  clearUserData(userId: string): void {
    const keysToRemove: string[] = [];
    
    // Find all user-specific keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(`_${userId}`)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove them
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleared ${keysToRemove.length} items for user:`, userId);
  }

  // ==========================================
  // SHARED STORAGE (Cached Data)
  // ==========================================

  /**
   * Set shared data (persists across accounts)
   */
  setSharedData<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * Get shared data
   */
  getSharedData<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  // ==========================================
  // SMART CACHE (With TTL)
  // ==========================================

  /**
   * Cache data with expiry time
   */
  setCachedData<T>(key: string, userId: string, data: T, ttlMinutes: number = 30): void {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttlMinutes * 60 * 1000)
    };
    
    this.setUserData(key, userId, cacheEntry);
  }

  /**
   * Get cached data if not expired
   */
  getCachedData<T>(key: string, userId: string): T | null {
    const cacheEntry = this.getUserData<{
      data: T;
      timestamp: number;
      expiresAt: number;
    }>(key, userId);
    
    if (!cacheEntry) return null;
    
    // Check if expired
    if (Date.now() > cacheEntry.expiresAt) {
      this.clearUserData(userId);
      return null;
    }
    
    return cacheEntry.data;
  }

  // ==========================================
  // ACCOUNT SWITCH HANDLER
  // ==========================================

  /**
   * Prepare for account switch
   * - Save current user data
   * - Clear old user cache
   * - Load new user cache
   */
  async handleAccountSwitch(fromUserId: string, toUserId: string): Promise<void> {
    console.log('🔄 Switching storage from', fromUserId, 'to', toUserId);
    
    // 1. Save any pending data for current user
    this.savePendingData(fromUserId);
    
    // 2. Don't clear - keep for fast switch back
    // Only clear expired cache
    this.clearExpiredCache(fromUserId);
    
    // 3. Pre-load cached data for new user
    this.preloadUserCache(toUserId);
    
    console.log('✅ Storage switch complete');
  }

  /**
   * Save pending drafts, queues etc
   */
  private savePendingData(userId: string): void {
    // Already saved through setUserData calls
    console.log('💾 Pending data already saved for:', userId);
  }

  /**
   * Clear only expired cache
   */
  private clearExpiredCache(userId: string): void {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(`_${userId}`)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.expiresAt && now > data.expiresAt) {
            keysToRemove.push(key);
          }
        } catch (error) {
          // Not cached data, skip
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.log(`🗑️ Cleared ${keysToRemove.length} expired items`);
    }
  }

  /**
   * Pre-load cache for fast startup
   */
  private preloadUserCache(userId: string): void {
    // Check if user has cached data
    const cachedFeed = this.getCachedData(STORAGE_KEYS.USER_SPECIFIC.CACHED_FEED, userId);
    const cachedProfile = this.getCachedData(STORAGE_KEYS.USER_SPECIFIC.CACHED_PROFILE, userId);
    
    if (cachedFeed || cachedProfile) {
      console.log('⚡ Pre-loaded cache for fast startup');
    } else {
      console.log('📭 No cache found, will load fresh data');
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Get storage size in MB
   */
  getStorageSize(): { total: number; perAccount: Record<string, number> } {
    let totalSize = 0;
    const perAccount: Record<string, number> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        const size = new Blob([value]).size;
        totalSize += size;
        
        // Track per account
        const match = key.match(/_([a-zA-Z0-9]+)$/);
        if (match) {
          const userId = match[1];
          perAccount[userId] = (perAccount[userId] || 0) + size;
        }
      }
    }
    
    return {
      total: totalSize / (1024 * 1024), // MB
      perAccount: Object.fromEntries(
        Object.entries(perAccount).map(([k, v]) => [k, v / (1024 * 1024)])
      )
    };
  }

  /**
   * Clear all app data (logout all)
   */
  clearAllData(): void {
    localStorage.clear();
    sessionStorage.clear();
    console.log('🧹 All storage cleared');
  }
}

// Export singleton instance
export const storageService = new StorageService();

// Export keys for direct access
export { STORAGE_KEYS };
