import AsyncStorage from '@react-native-async-storage/async-storage';

export type RecentGif = {
  id: string;
  title?: string;
  previewUrl: string;
  previewWebpUrl?: string;
  mp4Url: string;
  width?: number;
  height?: number;
};

export type RecentSong = {
  id: string;
  title: string;
  artist?: string;
  artworkUrl?: string;
  streamUrl: string;
  duration?: number;
};

const KEYS = {
  recentGifs: 'story_recent_gifs',
  favoriteGifs: 'story_favorite_gifs',
  recentSongs: 'story_recent_songs',
  favoriteSongs: 'story_favorite_songs',
};

async function readList<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function writeList<T>(key: string, arr: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(arr));
  } catch {}
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    if (it && typeof it.id === 'string' && !seen.has(it.id)) {
      seen.add(it.id);
      out.push(it);
    }
  }
  return out;
}

// GIFs
export async function getRecentGifs(): Promise<RecentGif[]> {
  return readList<RecentGif>(KEYS.recentGifs);
}

export async function addRecentGif(item: RecentGif): Promise<void> {
  const list = await readList<RecentGif>(KEYS.recentGifs);
  const updated = dedupeById<RecentGif>([item, ...list]).slice(0, 50);
  await writeList(KEYS.recentGifs, updated);
}

export async function getFavoriteGifs(): Promise<RecentGif[]> {
  return readList<RecentGif>(KEYS.favoriteGifs);
}

export async function toggleFavoriteGif(item: RecentGif): Promise<boolean> {
  const list = await readList<RecentGif>(KEYS.favoriteGifs);
  const idx = list.findIndex((g) => g.id === item.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    await writeList(KEYS.favoriteGifs, list);
    return false;
  }
  const updated = dedupeById<RecentGif>([item, ...list]).slice(0, 200);
  await writeList(KEYS.favoriteGifs, updated);
  return true;
}

// Songs
export async function getRecentSongs(): Promise<RecentSong[]> {
  return readList<RecentSong>(KEYS.recentSongs);
}

export async function addRecentSong(item: RecentSong): Promise<void> {
  const list = await readList<RecentSong>(KEYS.recentSongs);
  const updated = dedupeById<RecentSong>([item, ...list]).slice(0, 50);
  await writeList(KEYS.recentSongs, updated);
}

export async function getFavoriteSongs(): Promise<RecentSong[]> {
  return readList<RecentSong>(KEYS.favoriteSongs);
}

export async function toggleFavoriteSong(item: RecentSong): Promise<boolean> {
  const list = await readList<RecentSong>(KEYS.favoriteSongs);
  const idx = list.findIndex((s) => s.id === item.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    await writeList(KEYS.favoriteSongs, list);
    return false;
  }
  const updated = dedupeById<RecentSong>([item, ...list]).slice(0, 200);
  await writeList(KEYS.favoriteSongs, updated);
  return true;
}
