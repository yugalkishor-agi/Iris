/**
 * Story Capture Utilities
 * 
 * Provides image composition for stories with overlays:
 * - Web: Uses Canvas API
 * - Native (Android/iOS): Uses NativeStoryRenderer + react-native-view-shot
 */

import { Platform, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Stage dimensions (same as editor)
const STAGE_W = 375;
const STAGE_H = 667;

export interface CaptureOptions {
  format: 'jpg' | 'png';
  quality: number;
  width?: number;
  height?: number;
}

/**
 * Create a composite image with overlays
 * 
 * On Web: Uses Canvas API to draw background + overlays
 * On Native: Returns original image - we now store overlays as metadata and
 * render them using NativeStoryRenderer in the viewer
 * 
 * For story capture on native, use the StoryCaptureBridge component instead.
 */
export async function createCompositeImage(
  backgroundImageUri: string,
  textElements: any[],
  stickers: any[],
  drawings: any[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Check if we're in a web environment
      if (typeof document === 'undefined') {
        // Native environment - return original image
        // Overlays are stored as metadata and rendered in the viewer
        console.log('[StoryCaptureUtils] Native platform: using metadata-based overlay rendering');
        resolve(backgroundImageUri);
        return;
      }

      // Web environment - use Canvas API for composite
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Set canvas size to match stage
      canvas.width = screenWidth;
      canvas.height = screenHeight;

      // Load background image
      const backgroundImage = new Image();
      backgroundImage.crossOrigin = 'anonymous';

      backgroundImage.onload = () => {
        // Draw background image
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        // Calculate scale for positioning
        const scale = Math.min(screenWidth / STAGE_W, screenHeight / STAGE_H);

        // Draw text elements
        textElements.forEach(element => {
          ctx.save();

          // Get normalized position (handle both 0-1 and >1 pixel values)
          let valX = element.x ?? 0.5;
          let valY = element.y ?? 0.5;
          if (valX > 1) valX = valX / STAGE_W;
          if (valY > 1) valY = valY / STAGE_H;

          // Calculate final position
          const x = valX * STAGE_W * scale + (screenWidth - STAGE_W * scale) / 2;
          const y = valY * STAGE_H * scale + (screenHeight - STAGE_H * scale) / 2;
          const rotation = element.rotation ?? 0;
          const elScale = element.scale ?? 1;

          ctx.translate(x, y);
          ctx.rotate(rotation * Math.PI / 180);
          ctx.scale(elScale, elScale);

          ctx.fillStyle = element.color || '#FFFFFF';
          ctx.font = `bold ${element.fontSize || element.size || 24}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Add text shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          ctx.fillText(element.text, 0, 0);
          ctx.restore();
        });

        // Draw stickers
        stickers.forEach(sticker => {
          const kind = sticker.kind || sticker.type || '';
          const content = sticker.content;
          const data = sticker.data || content || {};

          // Get normalized position (handle both 0-1 and >1 pixel values)
          let valX = sticker.x ?? 0.5;
          let valY = sticker.y ?? 0.5;
          if (valX > 1) valX = valX / STAGE_W;
          if (valY > 1) valY = valY / STAGE_H;

          // Calculate final position
          const x = valX * STAGE_W * scale + (screenWidth - STAGE_W * scale) / 2;
          const y = valY * STAGE_H * scale + (screenHeight - STAGE_H * scale) / 2;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((sticker.rotation ?? 0) * Math.PI / 180);
          ctx.scale(sticker.scale ?? 1, sticker.scale ?? 1);

          if (kind === 'emoji') {
            ctx.font = '48px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(content || sticker.emoji || '😀', 0, 0);
          } else if (kind === 'location' || kind === 'mention' || kind === 'hashtag') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
            ctx.beginPath();
            ctx.roundRect(-60, -16, 120, 32, 16);
            ctx.fill();

            ctx.fillStyle = '#111';
            ctx.font = '600 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const prefix = kind === 'location' ? '📍 ' : kind === 'mention' ? '@' : '#';
            const text = data.handle || data.tag || content || '';
            ctx.fillText(prefix + text, 0, 0);
          } else if (kind === 'poll' || kind === 'slider' || kind === 'question' || kind === 'quiz') {
            // Draw widget box
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.beginPath();
            ctx.roundRect(-90, -40, 180, 80, 16);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = '700 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const title = data.question || data.text || kind;
            ctx.fillText(title, 0, 0);
          }

          ctx.restore();
        });

        // Draw drawings (SVG paths)
        drawings.forEach(drawing => {
          if (drawing.points && drawing.points.length >= 4) {
            ctx.save();
            ctx.strokeStyle = drawing.stroke || '#fff';
            ctx.lineWidth = drawing.strokeWidth || 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(drawing.points[0] * scale, drawing.points[1] * scale);
            for (let i = 2; i < drawing.points.length; i += 2) {
              ctx.lineTo(drawing.points[i] * scale, drawing.points[i + 1] * scale);
            }
            ctx.stroke();
            ctx.restore();
          }
        });

        // Convert to blob and create URL
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/jpeg', 0.9);
      };

      backgroundImage.onerror = () => {
        reject(new Error('Failed to load background image'));
      };

      backgroundImage.src = backgroundImageUri;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Convert blob URL to Blob for upload
 */
export async function blobUrlToFile(blobUrl: string, _filename: string): Promise<Blob> {
  try {
    const response = await fetch(blobUrl);
    return await response.blob();
  } catch (error) {
    console.error('Failed to convert blob URL to file:', error);
    throw new Error('Failed to prepare image for upload');
  }
}

/**
 * Prepare story data for native rendering
 * This normalizes the element data to match NativeStoryRenderer expectations
 */
export function prepareNativeRenderData(
  mediaURL: string,
  mediaType: 'image' | 'video',
  textElements: any[],
  stickers: any[],
  drawings: any[],
  filters?: any
) {
  return {
    mediaURL,
    mediaType,
    textElements: textElements.map(el => ({
      id: el.id || String(Date.now()),
      x: el.x ?? 0.5,
      y: el.y ?? 0.5,
      text: el.text || '',
      fontSize: el.fontSize || el.size || 24,
      fontFamily: el.fontFamily,
      fontWeight: el.fontWeight || 'bold',
      color: el.color || '#fff',
      rotation: el.rotation ?? 0,
      scale: el.scale ?? 1,
      scaleX: el.scaleX ?? el.scale ?? 1,
      scaleY: el.scaleY ?? el.scale ?? 1,
    })),
    stickers: stickers.map(st => ({
      id: st.id || String(Date.now()),
      kind: st.kind || st.type,
      type: st.type || st.kind,
      x: st.x ?? 0.5,
      y: st.y ?? 0.5,
      rotation: st.rotation ?? 0,
      scale: st.scale ?? 1,
      scaleX: st.scaleX ?? st.scale ?? 1,
      scaleY: st.scaleY ?? st.scale ?? 1,
      content: st.content,
      data: st.data || st.content,
      src: st.src,
      emoji: st.emoji,
    })),
    drawings: drawings.map(dr => ({
      id: dr.id || String(Date.now()),
      svgData: dr.svgData,
      points: dr.points,
      stroke: dr.stroke || '#fff',
      strokeWidth: dr.strokeWidth || 3,
    })),
    filters,
    stageWidth: STAGE_W,
    stageHeight: STAGE_H,
  };
}
