/**
 * Audio Service - Handles audio preloading, caching, and playback optimization
 * Provides instant audio playback for stories, glimpses, and posts
 */

interface AudioCache {
  url: string;
  blob: Blob;
  metadata: AudioMetadata;
  timestamp: number;
}

interface AudioMetadata {
  trackId: string;
  title: string;
  artist: string;
  duration: number;
  streamUrl: string;
}

interface PreloadQueueItem {
  trackId: string;
  streamUrl: string;
  priority: number;
}

class AudioService {
  private cache: Map<string, AudioCache> = new Map();
  private preloadQueue: PreloadQueueItem[] = [];
  private activeAudio: HTMLAudioElement | null = null;
  private preloadedAudio: Map<string, HTMLAudioElement> = new Map();
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 50; // Max 50 songs in cache
  private readonly PRELOAD_COUNT = 3; // Preload next 3 songs
  private isPreloading = false;
  private networkSpeed: 'slow' | 'medium' | 'fast' = 'medium';

  constructor() {
    this.detectNetworkSpeed();
    this.initIndexedDB();
    this.cleanExpiredCache();
  }

  /**
   * Detect network speed for adaptive quality
   */
  private detectNetworkSpeed() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType;
      
      if (effectiveType === '4g') {
        this.networkSpeed = 'fast';
      } else if (effectiveType === '3g') {
        this.networkSpeed = 'medium';
      } else {
        this.networkSpeed = 'slow';
      }

      // Listen for network changes
      connection?.addEventListener('change', () => {
        this.detectNetworkSpeed();
      });
    }
  }

  /**
   * Initialize IndexedDB for audio caching
   */
  private async initIndexedDB() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('IrisAudioCache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('audio')) {
          db.createObjectStore('audio', { keyPath: 'trackId' });
        }
      };
    });
  }

  /**
   * Get audio from IndexedDB cache
   */
  private async getFromIndexedDB(trackId: string): Promise<AudioCache | null> {
    try {
      const db = await this.initIndexedDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['audio'], 'readonly');
        const store = transaction.objectStore('audio');
        const request = store.get(trackId);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  /**
   * Save audio to IndexedDB cache
   */
  private async saveToIndexedDB(trackId: string, cache: AudioCache) {
    try {
      const db = await this.initIndexedDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['audio'], 'readwrite');
        const store = transaction.objectStore('audio');
        const request = store.put({ trackId, ...cache });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB save error:', error);
    }
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache() {
    const now = Date.now();
    
    // Clean memory cache
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_EXPIRY) {
        this.cache.delete(key);
      }
    }

    // Limit cache size
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = sortedEntries.slice(0, sortedEntries.length - this.MAX_CACHE_SIZE);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }

    // Clean IndexedDB cache periodically
    this.cleanIndexedDBCache();
  }

  /**
   * Clean IndexedDB cache
   */
  private async cleanIndexedDBCache() {
    try {
      const db = await this.initIndexedDB();
      const transaction = db.transaction(['audio'], 'readwrite');
      const store = transaction.objectStore('audio');
      const request = store.openCursor();
      const now = Date.now();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const value = cursor.value;
          if (now - value.timestamp > this.CACHE_EXPIRY) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    } catch (error) {
      console.error('IndexedDB clean error:', error);
    }
  }

  /**
   * Fetch and cache audio
   */
  private async fetchAndCacheAudio(
    trackId: string,
    streamUrl: string,
    metadata: AudioMetadata
  ): Promise<string> {
    try {
      // Check memory cache first
      const cached = this.cache.get(trackId);
      if (cached) {
        return URL.createObjectURL(cached.blob);
      }

      // Check IndexedDB cache
      const indexedDBCache = await this.getFromIndexedDB(trackId);
      if (indexedDBCache) {
        this.cache.set(trackId, indexedDBCache);
        return URL.createObjectURL(indexedDBCache.blob);
      }

      // Fetch from network
      const response = await fetch(streamUrl);
      const blob = await response.blob();

      // Cache the audio
      const cacheEntry: AudioCache = {
        url: streamUrl,
        blob,
        metadata,
        timestamp: Date.now(),
      };

      this.cache.set(trackId, cacheEntry);
      await this.saveToIndexedDB(trackId, cacheEntry);

      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to fetch audio:', error);
      return streamUrl; // Fallback to direct URL
    }
  }

  /**
   * Preload audio in background
   */
  async preloadAudio(trackId: string, streamUrl: string, metadata: AudioMetadata) {
    if (this.preloadedAudio.has(trackId)) {
      return; // Already preloaded
    }

    try {
      const audioUrl = await this.fetchAndCacheAudio(trackId, streamUrl, metadata);
      const audio = new Audio(audioUrl);
      
      // Preload the audio
      audio.preload = 'auto';
      audio.load();

      // Store preloaded audio
      this.preloadedAudio.set(trackId, audio);

      // Remove old preloaded audio if exceeds limit
      if (this.preloadedAudio.size > this.PRELOAD_COUNT) {
        const iter = this.preloadedAudio.keys().next();
        if (!iter.done) {
          const firstKey = iter.value as string;
          const oldAudio = this.preloadedAudio.get(firstKey);
          oldAudio?.pause();
          this.preloadedAudio.delete(firstKey);
        }
      }
    } catch (error) {
      console.error('Preload failed:', error);
    }
  }

  /**
   * Add tracks to preload queue
   */
  addToPreloadQueue(tracks: Array<{ trackId: string; streamUrl: string; metadata: AudioMetadata }>) {
    tracks.forEach((track, index) => {
      this.preloadQueue.push({
        trackId: track.trackId,
        streamUrl: track.streamUrl,
        priority: index,
      });
    });

    this.processPreloadQueue();
  }

  /**
   * Process preload queue
   */
  private async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return;
    }

    this.isPreloading = true;

    // Sort by priority
    this.preloadQueue.sort((a, b) => a.priority - b.priority);

    // Preload top items
    const toPreload = this.preloadQueue.splice(0, this.PRELOAD_COUNT);
    
    await Promise.all(
      toPreload.map(item => 
        this.preloadAudio(item.trackId, item.streamUrl, {
          trackId: item.trackId,
          title: '',
          artist: '',
          duration: 0,
          streamUrl: item.streamUrl,
        })
      )
    );

    this.isPreloading = false;
  }

  /**
   * Play audio with instant start
   */
  async playAudio(
    trackId: string,
    streamUrl: string,
    metadata: AudioMetadata,
    onEnded?: () => void
  ): Promise<HTMLAudioElement> {
    // Stop current audio
    this.stopCurrentAudio();

    // Check if already preloaded
    let audio = this.preloadedAudio.get(trackId);

    if (!audio) {
      // Fetch and create audio element
      const audioUrl = await this.fetchAndCacheAudio(trackId, streamUrl, metadata);
      audio = new Audio(audioUrl);
    }

    // Set up audio
    audio.volume = 1.0;
    audio.loop = false;

    if (onEnded) {
      audio.onended = onEnded;
    }

    try {
      // Play audio
      await audio.play();
      this.activeAudio = audio;

      // Remove from preloaded
      this.preloadedAudio.delete(trackId);

      return audio;
    } catch (error: any) {
      // Silently handle autoplay errors - browser blocks audio without user interaction
      if (error.name === 'NotAllowedError') {
        console.log('Audio autoplay blocked - user interaction required');
        return audio; // Return audio element so it can be played on user interaction
      }
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Stop current audio
   */
  stopCurrentAudio() {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.activeAudio = null;
    }
  }

  /**
   * Pause current audio
   */
  pauseCurrentAudio() {
    if (this.activeAudio) {
      this.activeAudio.pause();
    }
  }

  /**
   * Resume current audio
   */
  resumeCurrentAudio() {
    if (this.activeAudio) {
      this.activeAudio.play();
    }
  }

  /**
   * Get current audio element
   */
  getCurrentAudio(): HTMLAudioElement | null {
    return this.activeAudio;
  }

  /**
   * Check if audio is cached
   */
  isCached(trackId: string): boolean {
    return this.cache.has(trackId) || this.preloadedAudio.has(trackId);
  }

  /**
   * Clear all cache
   */
  async clearCache() {
    this.cache.clear();
    this.preloadedAudio.forEach(audio => audio.pause());
    this.preloadedAudio.clear();
    this.stopCurrentAudio();

    // Clear IndexedDB
    try {
      const db = await this.initIndexedDB();
      const transaction = db.transaction(['audio'], 'readwrite');
      const store = transaction.objectStore('audio');
      store.clear();
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
    }
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Get network speed
   */
  getNetworkSpeed(): 'slow' | 'medium' | 'fast' {
    return this.networkSpeed;
  }
}

export const audioService = new AudioService();
