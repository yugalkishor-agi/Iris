// Pixabay API Service - Free stock images and videos
// Docs: https://pixabay.com/api/docs/

const PIXABAY_API_KEY = '48398278-030ec45c4c9e10d84bf53a856'; // Public demo key

export interface PixabayImage {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  likes: number;
  user: string;
  userImageURL: string;
}

export interface PixabayVideo {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  duration: number;
  videos: {
    large: { url: string; width: number; height: number; size: number };
    medium: { url: string; width: number; height: number; size: number };
    small: { url: string; width: number; height: number; size: number };
    tiny: { url: string; width: number; height: number; size: number };
  };
  views: number;
  downloads: number;
  likes: number;
  user: string;
  userImageURL: string;
}

interface PixabayResponse<T> {
  total: number;
  totalHits: number;
  hits: T[];
}

/**
 * Search for images
 */
export async function searchImages(
  query: string,
  page = 1,
  perPage = 20
): Promise<PixabayImage[]> {
  try {
    const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
      query
    )}&image_type=photo&per_page=${perPage}&page=${page}`;

    const response = await fetch(url);
    const data: PixabayResponse<PixabayImage> = await response.json();

    return data.hits || [];
  } catch (error) {
    console.error('Failed to search Pixabay images:', error);
    return [];
  }
}

/**
 * Search for videos
 */
export async function searchVideos(
  query: string,
  page = 1,
  perPage = 20
): Promise<PixabayVideo[]> {
  try {
    const url = `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
      query
    )}&per_page=${perPage}&page=${page}`;

    const response = await fetch(url);
    const data: PixabayResponse<PixabayVideo> = await response.json();

    return data.hits || [];
  } catch (error) {
    console.error('Failed to search Pixabay videos:', error);
    return [];
  }
}

/**
 * Get popular images (no search query)
 */
export async function getPopularImages(page = 1, perPage = 20): Promise<PixabayImage[]> {
  try {
    const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&order=popular&per_page=${perPage}&page=${page}`;

    const response = await fetch(url);
    const data: PixabayResponse<PixabayImage> = await response.json();

    return data.hits || [];
  } catch (error) {
    console.error('Failed to get popular Pixabay images:', error);
    return [];
  }
}
