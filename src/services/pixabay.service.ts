/**
 * Pixabay API Service
 * Free API for high-quality images for chat wallpapers
 */

const PIXABAY_API_KEY = '48398009-03c02e8efb36a1fe55752d9a0'; // Free demo key
const PIXABAY_API_URL = 'https://pixabay.com/api/';

interface PixabayImage {
  id: number;
  pageURL: string;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  user: string;
  tags: string;
}

interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}

export class PixabayService {
  /**
   * Fetch wallpaper images from Pixabay
   */
  async fetchWallpapers(query: string = 'abstract gradient', perPage: number = 20): Promise<PixabayImage[]> {
    try {
      const params = new URLSearchParams({
        key: PIXABAY_API_KEY,
        q: query,
        image_type: 'photo',
        orientation: 'vertical',
        category: 'backgrounds',
        per_page: perPage.toString(),
        safesearch: 'true',
        order: 'popular',
      });

      const response = await fetch(`${PIXABAY_API_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch images from Pixabay');
      }

      const data: PixabayResponse = await response.json();
      return data.hits;
    } catch (error) {
      console.error('Pixabay API error:', error);
      return [];
    }
  }

  /**
   * Get curated wallpaper collections
   */
  async getCuratedWallpapers(): Promise<PixabayImage[]> {
    const queries = [
      'gradient abstract',
      'colorful background',
      'nature landscape',
      'minimal wallpaper',
    ];

    try {
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      return await this.fetchWallpapers(randomQuery, 12);
    } catch (error) {
      console.error('Failed to fetch curated wallpapers:', error);
      return [];
    }
  }

  /**
   * Cache image locally for faster loading
   */
  async cacheImageLocally(imageUrl: string, imageId: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          localStorage.setItem(`pixabay-cache-${imageId}`, base64);
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to cache image:', error);
      return imageUrl; // Return original URL as fallback
    }
  }

  /**
   * Get cached image or fetch and cache
   */
  async getCachedImage(imageUrl: string, imageId: string): Promise<string> {
    const cached = localStorage.getItem(`pixabay-cache-${imageId}`);
    if (cached) {
      return cached;
    }
    return await this.cacheImageLocally(imageUrl, imageId);
  }
}

export const pixabayService = new PixabayService();
