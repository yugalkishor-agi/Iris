import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const CACHE_DIR = FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}img_cache/` : null;
const INDEX_KEY = 'iris_image_cache_index_v1';

const hashUrl = (url: string) => {
  let hash = 0;
  for (let i = 0; i < url.length; i += 1) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const ensureDir = async () => {
  if (!CACHE_DIR) return;
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
};

class ImageCacheService {
  private index = new Map<string, string>();
  private inflight = new Map<string, Promise<string>>();
  private hydrated = false;
  private hydratePromise: Promise<void> | null = null;

  private async hydrateIndex(): Promise<void> {
    if (this.hydrated || Platform.OS === 'web' || !CACHE_DIR) {
      this.hydrated = true;
      return;
    }
    if (this.hydratePromise) {
      return this.hydratePromise;
    }

    this.hydratePromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(INDEX_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, string>;
          Object.entries(parsed).forEach(([remoteUrl, localUri]) => {
            if (remoteUrl && localUri) {
              this.index.set(remoteUrl, localUri);
            }
          });
        }
      } catch {
        this.index.clear();
      } finally {
        this.hydrated = true;
        this.hydratePromise = null;
      }
    })();

    return this.hydratePromise;
  }

  private async persistIndex(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(Object.fromEntries(this.index.entries())));
    } catch {
      // ignore index persistence failures
    }
  }

  private resolveFileUri(remoteUrl: string): string {
    const filename = hashUrl(remoteUrl);
    return `${CACHE_DIR}${filename}`;
  }

  private async hasLocalFile(localUri: string): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(localUri);
      return !!info.exists;
    } catch {
      return false;
    }
  }

  peekCachedUri(remoteUrl: string): string | null {
    if (!remoteUrl || Platform.OS === 'web' || !CACHE_DIR) return null;
    return this.index.get(remoteUrl) || null;
  }

  async getCachedUri(remoteUrl: string, options?: { background?: boolean }): Promise<string> {
    if (!remoteUrl) return remoteUrl;
    if (Platform.OS === 'web' || !CACHE_DIR) return remoteUrl;

    await this.hydrateIndex();

    const indexedUri = this.index.get(remoteUrl);
    if (indexedUri && await this.hasLocalFile(indexedUri)) {
      return indexedUri;
    }

    const fileUri = this.resolveFileUri(remoteUrl);
    if (await this.hasLocalFile(fileUri)) {
      this.index.set(remoteUrl, fileUri);
      void this.persistIndex();
      return fileUri;
    }

    if (options?.background) {
      void this.prefetch(remoteUrl);
      return remoteUrl;
    }

    return this.prefetch(remoteUrl);
  }

  async prefetch(remoteUrl: string): Promise<string> {
    if (!remoteUrl) return remoteUrl;
    if (Platform.OS === 'web' || !CACHE_DIR) return remoteUrl;

    await this.hydrateIndex();

    const indexedUri = this.index.get(remoteUrl);
    if (indexedUri && await this.hasLocalFile(indexedUri)) {
      return indexedUri;
    }

    const existingJob = this.inflight.get(remoteUrl);
    if (existingJob) {
      return existingJob;
    }

    const fileUri = this.resolveFileUri(remoteUrl);
    const job = (async () => {
      try {
        if (await this.hasLocalFile(fileUri)) {
          this.index.set(remoteUrl, fileUri);
          await this.persistIndex();
          return fileUri;
        }

        await ensureDir();
        const result = await FileSystem.downloadAsync(remoteUrl, fileUri);
        const resolved = result.uri || remoteUrl;
        if (resolved !== remoteUrl) {
          this.index.set(remoteUrl, resolved);
          await this.persistIndex();
        }
        return resolved;
      } catch {
        return remoteUrl;
      } finally {
        this.inflight.delete(remoteUrl);
      }
    })();

    this.inflight.set(remoteUrl, job);
    return job;
  }

  async prefetchBatch(remoteUrls: string[], limit = 6): Promise<void> {
    const urls = Array.from(new Set(remoteUrls.filter(Boolean)));
    if (urls.length === 0) return;

    for (let index = 0; index < urls.length; index += limit) {
      const chunk = urls.slice(index, index + limit);
      await Promise.allSettled(chunk.map((url) => this.prefetch(url)));
    }
  }

  async clear(): Promise<void> {
    this.index.clear();
    this.inflight.clear();
    this.hydrated = false;
    this.hydratePromise = null;
    try {
      await AsyncStorage.removeItem(INDEX_KEY);
    } catch {
      // ignore
    }
    if (!CACHE_DIR) return;
    try {
      const info = await FileSystem.getInfoAsync(CACHE_DIR);
      if (info.exists) {
        await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      }
    } catch {
      // ignore
    }
  }
}

export const imageCacheService = new ImageCacheService();