// Spotify Web API Integration for React Native
// Docs: https://developer.spotify.com/documentation/web-api/

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'your_spotify_client_id';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'your_spotify_client_secret';
const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1';

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  popularity: number;
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  tracks: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Get access token using client credentials flow
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      const data = await response.json();
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
        return data.access_token;
      }

      throw new Error('Failed to get access token');
    } catch (error) {
      console.error('Spotify authentication failed:', error);
      throw error;
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const queryParams = new URLSearchParams(params);
      const url = `${SPOTIFY_BASE_URL}${endpoint}?${queryParams}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Spotify API request failed:', error);
      throw error;
    }
  }

  /**
   * Search for tracks
   */
  async searchTracks(query: string, limit: number = 20, offset: number = 0): Promise<SpotifyTrack[]> {
    try {
      const response = await this.makeRequest('/search', {
        q: query,
        type: 'track',
        limit,
        offset,
      });

      return response.tracks?.items || [];
    } catch (error) {
      console.error('Failed to search tracks:', error);
      return [];
    }
  }

  /**
   * Get track by ID
   */
  async getTrack(trackId: string): Promise<SpotifyTrack | null> {
    try {
      const response = await this.makeRequest(`/tracks/${trackId}`);
      return response;
    } catch (error) {
      console.error('Failed to get track:', error);
      return null;
    }
  }

  /**
   * Get multiple tracks by IDs
   */
  async getTracks(trackIds: string[]): Promise<SpotifyTrack[]> {
    try {
      if (trackIds.length === 0) return [];
      
      const response = await this.makeRequest('/tracks', {
        ids: trackIds.join(','),
      });

      return response.tracks || [];
    } catch (error) {
      console.error('Failed to get tracks:', error);
      return [];
    }
  }

  /**
   * Get featured playlists
   */
  async getFeaturedPlaylists(limit: number = 20): Promise<SpotifyPlaylist[]> {
    try {
      const response = await this.makeRequest('/browse/featured-playlists', {
        limit,
      });

      return response.playlists?.items || [];
    } catch (error) {
      console.error('Failed to get featured playlists:', error);
      return [];
    }
  }

  /**
   * Get new releases
   */
  async getNewReleases(limit: number = 20): Promise<any[]> {
    try {
      const response = await this.makeRequest('/browse/new-releases', {
        limit,
      });

      return response.albums?.items || [];
    } catch (error) {
      console.error('Failed to get new releases:', error);
      return [];
    }
  }

  /**
   * Get categories
   */
  async getCategories(limit: number = 20): Promise<any[]> {
    try {
      const response = await this.makeRequest('/browse/categories', {
        limit,
      });

      return response.categories?.items || [];
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  /**
   * Get recommendations based on seed tracks/artists/genres
   */
  async getRecommendations(options: {
    seed_tracks?: string[];
    seed_artists?: string[];
    seed_genres?: string[];
    limit?: number;
  }): Promise<SpotifyTrack[]> {
    try {
      const params: Record<string, any> = {
        limit: options.limit || 20,
      };

      if (options.seed_tracks?.length) {
        params.seed_tracks = options.seed_tracks.join(',');
      }
      if (options.seed_artists?.length) {
        params.seed_artists = options.seed_artists.join(',');
      }
      if (options.seed_genres?.length) {
        params.seed_genres = options.seed_genres.join(',');
      }

      const response = await this.makeRequest('/recommendations', params);
      return response.tracks || [];
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }

  /**
   * Get available genres for recommendations
   */
  async getAvailableGenres(): Promise<string[]> {
    try {
      const response = await this.makeRequest('/recommendations/available-genre-seeds');
      return response.genres || [];
    } catch (error) {
      console.error('Failed to get available genres:', error);
      return [];
    }
  }

  /**
   * Format track duration (ms to MM:SS)
   */
  formatDuration(durationMs: number): string {
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get track artwork URL
   */
  getTrackArtwork(track: SpotifyTrack, size: 'small' | 'medium' | 'large' = 'medium'): string {
    const images = track.album.images;
    if (!images.length) return '';

    switch (size) {
      case 'small':
        return images[images.length - 1]?.url || images[0]?.url;
      case 'large':
        return images[0]?.url;
      case 'medium':
      default:
        return images[Math.floor(images.length / 2)]?.url || images[0]?.url;
    }
  }

  /**
   * Format track for display
   */
  formatTrackForDisplay(track: SpotifyTrack) {
    return {
      id: track.id,
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album.name,
      duration: this.formatDuration(track.duration_ms),
      durationMs: track.duration_ms,
      artwork: this.getTrackArtwork(track, 'medium'),
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls.spotify,
      popularity: track.popularity,
    };
  }
}

// Singleton instance
export const spotifyService = new SpotifyService();

// Export convenience functions
export const searchSpotifyTracks = (query: string, limit?: number) => 
  spotifyService.searchTracks(query, limit);

export const getSpotifyTrack = (trackId: string) => 
  spotifyService.getTrack(trackId);

export const getFeaturedPlaylists = (limit?: number) => 
  spotifyService.getFeaturedPlaylists(limit);

export const getNewReleases = (limit?: number) => 
  spotifyService.getNewReleases(limit);

export const getRecommendations = (options: any) => 
  spotifyService.getRecommendations(options);
