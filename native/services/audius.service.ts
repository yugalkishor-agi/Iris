// Audius API Service - Free music streaming API
// Docs: https://audiusproject.github.io/api-docs/

const APP_NAME = 'IRIS';
let cachedHost: string | null = null;

interface AudiusTrack {
  id: string;
  title: string;
  user: {
    name: string;
    handle: string;
  };
  artwork?: {
    '150x150': string;
    '480x480': string;
    '1000x1000': string;
  };
  duration: number;
  genre: string;
  mood?: string;
  play_count: number;
}

interface AudiusSearchResponse {
  data: AudiusTrack[];
}

/**
 * Get a random API host from Audius network
 */
async function getAudiusHost(): Promise<string> {
  if (cachedHost) return cachedHost;
  
  try {
    const response = await fetch('https://api.audius.co');
    const data = await response.json();
    const hosts = data.data;
    
    // Select random host
    const randomHost = hosts[Math.floor(Math.random() * hosts.length)];
    cachedHost = randomHost;
    
    return randomHost;
  } catch (error) {
    console.error('Failed to get Audius host:', error);
    // Fallback to default host
    return 'https://discoveryprovider.audius.co';
  }
}

/**
 * Search for tracks by query
 */
export async function searchTracks(query: string, limit = 10): Promise<AudiusTrack[]> {
  try {
    const host = await getAudiusHost();
    const url = `${host}/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&app_name=${APP_NAME}`;
    
    const response = await fetch(url);
    const data: AudiusSearchResponse = await response.json();
    
    return data.data || [];
  } catch (error) {
    console.error('Failed to search tracks:', error);
    return [];
  }
}

/**
 * Get trending tracks
 */
export async function getTrendingTracks(limit = 10): Promise<AudiusTrack[]> {
  try {
    const host = await getAudiusHost();
    const url = `${host}/v1/tracks/trending?limit=${limit}&app_name=${APP_NAME}`;
    
    const response = await fetch(url);
    const data: AudiusSearchResponse = await response.json();
    
    return data.data || [];
  } catch (error) {
    console.error('Failed to get trending tracks:', error);
    return [];
  }
}

/**
 * Get streamable URL for a track
 */
export async function getTrackStreamUrl(trackId: string): Promise<string> {
  const host = await getAudiusHost();
  // Ensure host has protocol
  const hostWithProtocol = host.startsWith('http') ? host : `https://${host}`;
  return `${hostWithProtocol}/v1/tracks/${trackId}/stream?app_name=${APP_NAME}`;
}

/**
 * Format track duration (seconds to MM:SS)
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export type { AudiusTrack };
