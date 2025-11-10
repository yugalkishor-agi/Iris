// Giphy SDK Integration
// Official SDK: @giphy/js-fetch-api
// Docs: https://developers.giphy.com/docs/sdk

import { GiphyFetch } from '@giphy/js-fetch-api';

const GIPHY_API_KEY = '2Tlxrk2CQw5u8QdezcfVkp32bwwNfiyp';

// Initialize Giphy SDK
const gf = new GiphyFetch(GIPHY_API_KEY);

// Export Giphy SDK types (from installed SDK)
export type { GifsResult, GifResult } from '@giphy/js-fetch-api';

/**
 * Search for GIFs using Giphy SDK
 */
export async function searchGifs(
  query: string,
  limit = 20,
  offset = 0
) {
  try {
    const result = await gf.search(query, { 
      limit, 
      offset,
      rating: 'g',
      lang: 'en'
    });
    return result.data;
  } catch (error) {
    console.error('Failed to search Giphy GIFs:', error);
    return [];
  }
}

/**
 * Get trending GIFs using Giphy SDK
 */
export async function getTrendingGifs(limit = 20, offset = 0) {
  try {
    const result = await gf.trending({ 
      limit, 
      offset,
      rating: 'g'
    });
    return result.data;
  } catch (error) {
    console.error('Failed to get trending Giphy GIFs:', error);
    return [];
  }
}

/**
 * Search for stickers using Giphy SDK
 */
export async function searchStickers(
  query: string,
  limit = 20,
  offset = 0
) {
  try {
    const result = await gf.search(query, { 
      limit, 
      offset,
      rating: 'g',
      lang: 'en',
      type: 'stickers'
    });
    return result.data;
  } catch (error) {
    console.error('Failed to search Giphy stickers:', error);
    return [];
  }
}

/**
 * Get trending stickers using Giphy SDK
 */
export async function getTrendingStickers(limit = 20, offset = 0) {
  try {
    const result = await gf.trending({ 
      limit, 
      offset,
      rating: 'g',
      type: 'stickers'
    });
    return result.data;
  } catch (error) {
    console.error('Failed to get trending Giphy stickers:', error);
    return [];
  }
}

/**
 * Get GIF by ID using Giphy SDK
 */
export async function getGifById(gifId: string) {
  try {
    const result = await gf.gif(gifId);
    return result.data;
  } catch (error) {
    console.error('Failed to get GIF by ID:', error);
    return null;
  }
}

/**
 * Get random GIF using Giphy SDK
 */
export async function getRandomGif(tag?: string) {
  try {
    const result = await gf.random({ tag, rating: 'g' });
    return result.data;
  } catch (error) {
    console.error('Failed to get random GIF:', error);
    return null;
  }
}

// Export GiphyFetch instance for direct SDK usage
export { gf };
