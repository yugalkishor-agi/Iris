import { Image } from 'react-native';
/**
 * Image Filter Service
 * Handles image processing, filters, and adjustments
 */

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  exposure: number;
  highlights: number;
  shadows: number;
  temperature: number;
  tint: number;
  vignette: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  adjustments: Partial<ImageAdjustments>;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'original',
    name: 'Original',
    adjustments: {},
  },
  {
    id: 'vivid',
    name: 'Vivid',
    adjustments: {
      saturation: 20,
      contrast: 10,
      brightness: 5,
    },
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    adjustments: {
      contrast: 25,
      shadows: -15,
      highlights: -10,
      exposure: -5,
    },
  },
  {
    id: 'mono',
    name: 'Mono',
    adjustments: {
      saturation: -100,
      contrast: 15,
      brightness: -5,
    },
  },
  {
    id: 'vintage',
    name: 'Vintage',
    adjustments: {
      temperature: 15,
      vignette: 30,
      exposure: -5,
      contrast: -10,
      saturation: -20,
    },
  },
  {
    id: 'cool',
    name: 'Cool',
    adjustments: {
      temperature: -20,
      tint: 5,
      highlights: 10,
    },
  },
  {
    id: 'warm',
    name: 'Warm',
    adjustments: {
      temperature: 20,
      tint: -5,
      shadows: 10,
    },
  },
  {
    id: 'fade',
    name: 'Fade',
    adjustments: {
      exposure: 10,
      highlights: -20,
      contrast: -10,
      saturation: -15,
    },
  },
  {
    id: 'noir',
    name: 'Noir',
    adjustments: {
      saturation: -100,
      contrast: 30,
      brightness: -10,
      vignette: 40,
    },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    adjustments: {
      temperature: 25,
      saturation: -30,
      contrast: 10,
      vignette: 20,
    },
  },
];

class ImageFilterService {
  /**
   * Apply adjustments to image (placeholder implementation)
   * In a real app, this would use libraries like:
   * - react-native-image-filter-kit
   * - react-native-image-editor
   * - expo-image-manipulator
   */
  async applyAdjustments(
    imageUri: string,
    adjustments: ImageAdjustments
  ): Promise<string> {
    try {
      // Placeholder: In reality, you would process the image
      console.log('Applying adjustments:', adjustments);
      
      // For now, return the original URI
      // TODO: Implement actual image processing
      return imageUri;
    } catch (error) {
      console.error('Error applying adjustments:', error);
      throw error;
    }
  }

  /**
   * Apply a filter preset to image
   */
  async applyFilter(imageUri: string, filterId: string): Promise<string> {
    try {
      const filter = FILTER_PRESETS.find(f => f.id === filterId);
      if (!filter) {
        throw new Error(`Filter ${filterId} not found`);
      }

      const adjustments: ImageAdjustments = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        blur: 0,
        exposure: 0,
        highlights: 0,
        shadows: 0,
        temperature: 0,
        tint: 0,
        vignette: 0,
        ...filter.adjustments,
      };

      return await this.applyAdjustments(imageUri, adjustments);
    } catch (error) {
      console.error('Error applying filter:', error);
      throw error;
    }
  }

  /**
   * Crop image to specified dimensions
   */
  async cropImage(
    imageUri: string,
    cropData: {
      x: number;
      y: number;
      width: number;
      height: number;
    }
  ): Promise<string> {
    try {
      // Placeholder implementation
      console.log('Cropping image:', cropData);
      
      // TODO: Implement actual image cropping
      return imageUri;
    } catch (error) {
      console.error('Error cropping image:', error);
      throw error;
    }
  }

  /**
   * Rotate image by specified degrees
   */
  async rotateImage(imageUri: string, degrees: number): Promise<string> {
    try {
      // Placeholder implementation
      console.log('Rotating image by:', degrees);
      
      // TODO: Implement actual image rotation
      return imageUri;
    } catch (error) {
      console.error('Error rotating image:', error);
      throw error;
    }
  }

  /**
   * Flip image horizontally or vertically
   */
  async flipImage(
    imageUri: string,
    direction: 'horizontal' | 'vertical'
  ): Promise<string> {
    try {
      // Placeholder implementation
      console.log('Flipping image:', direction);
      
      // TODO: Implement actual image flipping
      return imageUri;
    } catch (error) {
      console.error('Error flipping image:', error);
      throw error;
    }
  }

  /**
   * Resize image to specified dimensions
   */
  async resizeImage(
    imageUri: string,
    width: number,
    height: number,
    quality: number = 0.8
  ): Promise<string> {
    try {
      // Placeholder implementation
      console.log('Resizing image:', { width, height, quality });
      
      // TODO: Implement actual image resizing
      return imageUri;
    } catch (error) {
      console.error('Error resizing image:', error);
      throw error;
    }
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(imageUri: string): Promise<{
    width: number;
    height: number;
  }> {
    try {
      return new Promise((resolve, reject) => {
        Image.getSize(
          imageUri,
          (width, height) => {
            resolve({ width, height });
          },
          reject
        );
      });
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return { width: 0, height: 0 };
    }
  }

  /**
   * Generate thumbnail from image
   */
  async generateThumbnail(
    imageUri: string,
    size: number = 150
  ): Promise<string> {
    try {
      return await this.resizeImage(imageUri, size, size, 0.7);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  }

  /**
   * Convert adjustments to CSS filter string (for web preview)
   */
  adjustmentsToCSSFilter(adjustments: ImageAdjustments): string {
    const filters: string[] = [];

    if (adjustments.brightness !== 0) {
      filters.push(`brightness(${100 + adjustments.brightness}%)`);
    }

    if (adjustments.contrast !== 0) {
      filters.push(`contrast(${100 + adjustments.contrast}%)`);
    }

    if (adjustments.saturation !== 0) {
      filters.push(`saturate(${100 + adjustments.saturation}%)`);
    }

    if (adjustments.blur > 0) {
      filters.push(`blur(${adjustments.blur / 10}px)`);
    }

    if (adjustments.temperature !== 0) {
      // Approximate temperature with hue-rotate
      filters.push(`hue-rotate(${adjustments.temperature / 5}deg)`);
    }

    return filters.join(' ');
  }

  /**
   * Validate image URI
   */
  isValidImageUri(uri: string): boolean {
    if (!uri) return false;
    
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const lowerUri = uri.toLowerCase();
    
    return validExtensions.some(ext => lowerUri.includes(ext)) ||
           uri.startsWith('data:image/') ||
           uri.startsWith('file://') ||
           uri.startsWith('content://');
  }

  /**
   * Get filter preset by ID
   */
  getFilterPreset(filterId: string): FilterPreset | null {
    return FILTER_PRESETS.find(f => f.id === filterId) || null;
  }

  /**
   * Merge adjustments with filter preset
   */
  mergeAdjustments(
    baseAdjustments: Partial<ImageAdjustments>,
    filterAdjustments: Partial<ImageAdjustments>
  ): ImageAdjustments {
    return {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      blur: 0,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      temperature: 0,
      tint: 0,
      vignette: 0,
      ...baseAdjustments,
      ...filterAdjustments,
    };
  }
}

export const imageFilterService = new ImageFilterService();
