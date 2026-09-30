import type { FilterState } from '../stores/editorStore';

/**
 * Create a color matrix for image filters
 * Color matrix is a 5x4 matrix (20 values) that transforms RGBA values
 */

export function createBrightnessMatrix(value: number): number[] {
  // value: -1 (dark) to 1 (bright)
  const adjust = value;
  
  return [
    1, 0, 0, 0, adjust,
    0, 1, 0, 0, adjust,
    0, 0, 1, 0, adjust,
    0, 0, 0, 1, 0,
  ];
}

export function createContrastMatrix(value: number): number[] {
  // value: 0 (no contrast) to 2 (high contrast)
  const factor = value;
  const translate = (1 - factor) / 2;
  
  return [
    factor, 0, 0, 0, translate,
    0, factor, 0, 0, translate,
    0, 0, factor, 0, translate,
    0, 0, 0, 1, 0,
  ];
}

export function createSaturationMatrix(value: number): number[] {
  // value: 0 (grayscale) to 2 (over-saturated)
  const lumR = 0.3086;
  const lumG = 0.6094;
  const lumB = 0.0820;
  const s = value - 1; // Convert to -1 to 1 range
  
  return [
    lumR + (1 - lumR) * (1 + s), lumG - lumG * (1 + s), lumB - lumB * (1 + s), 0, 0,
    lumR - lumR * (1 + s), lumG + (1 - lumG) * (1 + s), lumB - lumB * (1 + s), 0, 0,
    lumR - lumR * (1 + s), lumG - lumG * (1 + s), lumB + (1 - lumB) * (1 + s), 0, 0,
    0, 0, 0, 1, 0,
  ];
}

export function createTemperatureMatrix(value: number): number[] {
  // value: -1 (cool/blue) to 1 (warm/orange)
  const r = 1 + value * 0.3;
  const g = 1;
  const b = 1 - value * 0.3;
  
  return [
    r, 0, 0, 0, 0,
    0, g, 0, 0, 0,
    0, 0, b, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

/**
 * Multiply two color matrices
 */
function multiplyMatrices(a: number[], b: number[]): number[] {
  const result: number[] = [];
  
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      let sum = 0;
      
      if (col < 4) {
        // Matrix multiplication for color channels
        for (let i = 0; i < 4; i++) {
          sum += a[row * 5 + i] * b[i * 5 + col];
        }
      } else {
        // Translation column
        for (let i = 0; i < 4; i++) {
          sum += a[row * 5 + i] * b[i * 5 + 4];
        }
        sum += a[row * 5 + 4];
      }
      
      result.push(sum);
    }
  }
  
  return result;
}

/**
 * Create identity matrix (no filter)
 */
export function createIdentityMatrix(): number[] {
  return [
    1, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

/**
 * Combine all filters into a single color matrix
 */
export function createFilterMatrix(filters: FilterState): number[] {
  let matrix = createIdentityMatrix();
  
  // Apply brightness
  if (filters.brightness !== 0) {
    const brightnessMatrix = createBrightnessMatrix(filters.brightness);
    matrix = multiplyMatrices(matrix, brightnessMatrix);
  }
  
  // Apply contrast
  if (filters.contrast !== 1) {
    const contrastMatrix = createContrastMatrix(filters.contrast);
    matrix = multiplyMatrices(matrix, contrastMatrix);
  }
  
  // Apply saturation
  if (filters.saturation !== 1) {
    const saturationMatrix = createSaturationMatrix(filters.saturation);
    matrix = multiplyMatrices(matrix, saturationMatrix);
  }
  
  // Apply temperature
  if (filters.temperature !== 0) {
    const temperatureMatrix = createTemperatureMatrix(filters.temperature);
    matrix = multiplyMatrices(matrix, temperatureMatrix);
  }
  
  return matrix;
}

/**
 * Preset filters (Instagram-style)
 */
export const FILTER_PRESETS = {
  normal: {
    brightness: 0,
    contrast: 1,
    saturation: 1,
    blur: 0,
    temperature: 0,
  },
  vivid: {
    brightness: 0.1,
    contrast: 1.2,
    saturation: 1.4,
    blur: 0,
    temperature: 0.1,
  },
  dramatic: {
    brightness: -0.1,
    contrast: 1.5,
    saturation: 0.8,
    blur: 0,
    temperature: -0.1,
  },
  warm: {
    brightness: 0.05,
    contrast: 1.1,
    saturation: 1.2,
    blur: 0,
    temperature: 0.4,
  },
  cool: {
    brightness: 0.05,
    contrast: 1.1,
    saturation: 1.1,
    blur: 0,
    temperature: -0.3,
  },
  mono: {
    brightness: 0,
    contrast: 1.2,
    saturation: 0,
    blur: 0,
    temperature: 0,
  },
  fade: {
    brightness: 0.1,
    contrast: 0.8,
    saturation: 0.9,
    blur: 0,
    temperature: 0,
  },
};
