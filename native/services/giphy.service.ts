// Giphy API Integration for React Native
// Uses Giphy REST API for GIF and sticker search

const GIPHY_API_KEY = '2Tlxrk2CQw5u8QdezcfVkp32bwwNfiyp';
const GIPHY_BASE_URL = 'https://api.giphy.com/v1';

// Giphy GIF object interface
export interface GiphyGif {
  id: string;
  title: string;
  url: string;
  images: {
    original: {
      url: string;
      width: string;
      height: string;
      size: string;
    };
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    fixed_width: {
      url: string;
      width: string;
      height: string;
    };
    preview_gif: {
      url: string;
      width: string;
      height: string;
    };
    downsized: {
      url: string;
      width: string;
      height: string;
      size: string;
    };
    downsized_medium: {
      url: string;
      width: string;
      height: string;
      size: string;
    };
  };
  rating: string;
  username: string;
  user?: {
    avatar_url: string;
    display_name: string;
    username: string;
  };
}

export interface GiphyResponse {
  data: GiphyGif[];
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
}

export interface GiphySearchOptions {
  limit?: number;
  offset?: number;
  rating?: 'g' | 'pg' | 'pg-13' | 'r';
  lang?: string;
}

class GiphyService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = GIPHY_API_KEY;
    this.baseUrl = GIPHY_BASE_URL;
  }

  /**
   * Make API request to Giphy
   */
  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const queryParams = new URLSearchParams({
        api_key: this.apiKey,
        ...params,
      });

      const url = `${this.baseUrl}${endpoint}?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Giphy API request failed:', error);
      throw error;
    }
  }

  /**
   * Search for GIFs
   */
  async searchGifs(
    query: string,
    options: GiphySearchOptions = {}
  ): Promise<GiphyGif[]> {
    try {
      const {
        limit = 20,
        offset = 0,
        rating = 'g',
        lang = 'en'
      } = options;

      const response = await this.makeRequest('/gifs/search', {
        q: query,
        limit,
        offset,
        rating,
        lang,
      });

      return response.data || [];
    } catch (error) {
      console.error('Failed to search GIFs:', error);
      return [];
    }
  }

  /**
   * Get trending GIFs
   */
  async getTrendingGifs(options: GiphySearchOptions = {}): Promise<GiphyGif[]> {
    try {
      const {
        limit = 20,
        offset = 0,
        rating = 'g'
      } = options;

      const response = await this.makeRequest('/gifs/trending', {
        limit,
        offset,
        rating,
      });

      return response.data || [];
    } catch (error) {
      console.error('Failed to get trending GIFs:', error);
      return [];
    }
  }

  /**
   * Search for stickers
   */
  async searchStickers(
    query: string,
    options: GiphySearchOptions = {}
  ): Promise<GiphyGif[]> {
    try {
      const {
        limit = 20,
        offset = 0,
        rating = 'g',
        lang = 'en'
      } = options;

      const response = await this.makeRequest('/stickers/search', {
        q: query,
        limit,
        offset,
        rating,
        lang,
      });

      return response.data || [];
    } catch (error) {
      console.error('Failed to search stickers:', error);
      return [];
    }
  }

  /**
   * Get trending stickers
   */
  async getTrendingStickers(options: GiphySearchOptions = {}): Promise<GiphyGif[]> {
    try {
      const {
        limit = 20,
        offset = 0,
        rating = 'g'
      } = options;

      const response = await this.makeRequest('/stickers/trending', {
        limit,
        offset,
        rating,
      });

      return response.data || [];
    } catch (error) {
      console.error('Failed to get trending stickers:', error);
      return [];
    }
  }

  /**
   * Get GIF by ID
   */
  async getGifById(gifId: string): Promise<GiphyGif | null> {
    try {
      const response = await this.makeRequest(`/gifs/${gifId}`);
      return response.data || null;
    } catch (error) {
      console.error('Failed to get GIF by ID:', error);
      return null;
    }
  }

  /**
   * Get random GIF
   */
  async getRandomGif(tag?: string, rating: string = 'g'): Promise<GiphyGif | null> {
    try {
      const params: Record<string, any> = { rating };
      if (tag) params.tag = tag;

      const response = await this.makeRequest('/gifs/random', params);
      return response.data || null;
    } catch (error) {
      console.error('Failed to get random GIF:', error);
      return null;
    }
  }

  /**
   * Get GIF categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await this.makeRequest('/gifs/categories');
      return response.data?.map((cat: any) => cat.name) || [];
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  /**
   * Search suggestions based on query
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      const response = await this.makeRequest('/gifs/search/tags', {
        q: query,
      });
      return response.data?.map((item: any) => item.name) || [];
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  /**
   * Get GIFs by IDs (batch)
   */
  async getGifsByIds(gifIds: string[]): Promise<GiphyGif[]> {
    try {
      if (gifIds.length === 0) return [];

      const response = await this.makeRequest('/gifs', {
        ids: gifIds.join(','),
      });

      return response.data || [];
    } catch (error) {
      console.error('Failed to get GIFs by IDs:', error);
      return [];
    }
  }

  /**
   * Get optimal GIF URL based on size preference
   */
  getOptimalGifUrl(gif: GiphyGif, size: 'small' | 'medium' | 'large' = 'medium'): string {
    switch (size) {
      case 'small':
        return gif.images.fixed_height?.url || gif.images.downsized?.url || gif.images.original.url;
      case 'large':
        return gif.images.original.url;
      case 'medium':
      default:
        return gif.images.downsized_medium?.url || gif.images.fixed_width?.url || gif.images.original.url;
    }
  }

  /**
   * Get preview GIF URL (smaller, faster loading)
   */
  getPreviewUrl(gif: GiphyGif): string {
    return gif.images.preview_gif?.url || gif.images.fixed_height?.url || gif.images.original.url;
  }

  /**
   * Get a WebP preview URL when available (Android-first optimization)
   */
  getWebpPreviewUrl(gif: GiphyGif): string {
    const g: any = gif as any;
    return (
      g?.images?.preview_webp?.url ||
      g?.images?.fixed_height_small?.webp ||
      g?.images?.fixed_width_small?.webp ||
      g?.images?.downsized_small?.webp ||
      g?.images?.original?.webp ||
      ''
    );
  }

  /**
   * Get an MP4 URL for better performance in React Native (used with expo-av Video)
   */
  getMp4Url(gif: GiphyGif): string {
    const g: any = gif;
    return (
      g?.images?.preview_mp4?.url ||
      g?.images?.downsized_small?.mp4 ||
      g?.images?.original_mp4?.mp4 ||
      g?.images?.looping?.mp4 ||
      g?.images?.original?.mp4 ||
      ''
    );
  }

  /**
   * Check if GIF is appropriate (based on rating)
   */
  isAppropriate(gif: GiphyGif, maxRating: 'g' | 'pg' | 'pg-13' | 'r' = 'pg'): boolean {
    const ratings = ['g', 'pg', 'pg-13', 'r'];
    const gifRatingIndex = ratings.indexOf(gif.rating.toLowerCase());
    const maxRatingIndex = ratings.indexOf(maxRating);
    
    return gifRatingIndex <= maxRatingIndex;
  }

  /**
   * Format GIF for display
   */
  formatGifForDisplay(gif: GiphyGif) {
    return {
      id: gif.id,
      title: gif.title,
      url: this.getOptimalGifUrl(gif, 'medium'),
      previewUrl: this.getPreviewUrl(gif),
      previewWebpUrl: this.getWebpPreviewUrl(gif),
      originalUrl: gif.images.original.url,
      width: parseInt(gif.images.original.width),
      height: parseInt(gif.images.original.height),
      rating: gif.rating,
      username: gif.username,
      user: gif.user,
    };
  }
}

// Singleton instance
export const giphyService = new GiphyService();

// Export convenience functions
export const searchGifs = (query: string, options?: GiphySearchOptions) => 
  giphyService.searchGifs(query, options);

export const getTrendingGifs = (options?: GiphySearchOptions) => 
  giphyService.getTrendingGifs(options);

export const searchStickers = (query: string, options?: GiphySearchOptions) => 
  giphyService.searchStickers(query, options);

export const getTrendingStickers = (options?: GiphySearchOptions) => 
  giphyService.getTrendingStickers(options);

export const getGifById = (gifId: string) => 
  giphyService.getGifById(gifId);

export const getRandomGif = (tag?: string, rating?: string) => 
  giphyService.getRandomGif(tag, rating);

export const getMp4Url = (gif: GiphyGif) => giphyService.getMp4Url(gif);
