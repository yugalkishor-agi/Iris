import { TextLayer } from '../hooks/useTextOverlay';

/**
 * Utility functions for rendering text overlays on images/videos
 */

export interface RenderedTextOverlay {
  canvas: HTMLCanvasElement;
  dataUrl: string;
}

/**
 * Render text layers onto a canvas
 */
export const renderTextOverlays = async (
  backgroundImageUri: string,
  textLayers: TextLayer[],
  outputWidth: number = 1080,
  outputHeight: number = 1080
): Promise<RenderedTextOverlay> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const backgroundImage = new Image();
    backgroundImage.crossOrigin = 'anonymous';
    
    backgroundImage.onload = () => {
      try {
        // Draw background image
        ctx.drawImage(backgroundImage, 0, 0, outputWidth, outputHeight);

        // Draw text layers
        textLayers.forEach(layer => {
          ctx.save();

          // Set text properties
          ctx.font = `${layer.fontSize}px ${layer.fontFamily}`;
          ctx.fillStyle = layer.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = layer.opacity;

          // Apply transformations
          ctx.translate(layer.x, layer.y);
          ctx.rotate((layer.rotation * Math.PI) / 180);

          // Draw background if specified
          if (layer.backgroundColor) {
            const textMetrics = ctx.measureText(layer.text);
            const textWidth = textMetrics.width;
            const textHeight = layer.fontSize;
            
            ctx.fillStyle = layer.backgroundColor;
            ctx.fillRect(
              -textWidth / 2 - 10,
              -textHeight / 2 - 5,
              textWidth + 20,
              textHeight + 10
            );
            
            ctx.fillStyle = layer.color;
          }

          // Draw text with shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          ctx.fillText(layer.text, 0, 0);

          ctx.restore();
        });

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        resolve({
          canvas,
          dataUrl,
        });
      } catch (error) {
        reject(error);
      }
    };

    backgroundImage.onerror = () => {
      reject(new Error('Failed to load background image'));
    };

    backgroundImage.src = backgroundImageUri;
  });
};

/**
 * Convert canvas to blob for upload
 */
export const canvasToBlob = (canvas: HTMLCanvasElement, quality: number = 0.9): Promise<Blob> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/jpeg', quality);
  });
};

/**
 * Calculate optimal font size based on canvas dimensions
 */
export const calculateOptimalFontSize = (
  text: string,
  maxWidth: number,
  maxHeight: number,
  fontFamily: string = 'Arial'
): number => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  let fontSize = 12;
  let textWidth = 0;
  
  do {
    fontSize += 2;
    ctx.font = `${fontSize}px ${fontFamily}`;
    textWidth = ctx.measureText(text).width;
  } while (textWidth < maxWidth * 0.8 && fontSize < maxHeight * 0.1);
  
  return Math.max(12, fontSize - 2);
};

/**
 * Get text dimensions for a given font size
 */
export const getTextDimensions = (
  text: string,
  fontSize: number,
  fontFamily: string = 'Arial'
): { width: number; height: number } => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  
  return {
    width: metrics.width,
    height: fontSize,
  };
};

/**
 * Check if text fits within bounds
 */
export const doesTextFit = (
  text: string,
  fontSize: number,
  fontFamily: string,
  maxWidth: number,
  maxHeight: number
): boolean => {
  const dimensions = getTextDimensions(text, fontSize, fontFamily);
  return dimensions.width <= maxWidth && dimensions.height <= maxHeight;
};

/**
 * Wrap text to fit within specified width
 */
export const wrapText = (
  text: string,
  fontSize: number,
  fontFamily: string,
  maxWidth: number
): string[] => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${fontSize}px ${fontFamily}`;
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};
