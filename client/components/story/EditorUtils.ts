// Utility functions for the story editor

import type { EditorState, Stroke, Layer, TextLayer, EmojiLayer } from './EditorTypes';

/**
 * Get CSS filter string based on filter ID and intensity
 * Using CSS filters for GPU acceleration
 */
export function getFilterStyle(filterId: string, intensity: number = 100): string {
  const i = intensity / 100;
  switch (filterId) {
    case 'vintage':
      return `sepia(${40 * i}%) contrast(${110 * i}%)`;
    case 'bright':
      return `brightness(${105 + (15 * i)}%) contrast(${95 + (5 * i)}%)`;
    case 'bw':
      return `grayscale(${100 * i}%)`;
    case 'warm':
      return `sepia(${20 * i}%) saturate(${120 * i}%)`;
    case 'cool':
      return `hue-rotate(${-20 * i}deg) saturate(${110 * i}%)`;
    case 'vivid':
      return `saturate(${150 * i}%) contrast(${110 * i}%)`;
    case 'sepia':
      return `sepia(${60 * i}%)`;
    case 'dramatic':
      return `contrast(${130 * i}%) brightness(${90 + (5 * i)}%) saturate(${120 * i}%)`;
    case 'soft':
      return `brightness(${105 + (5 * i)}%) saturate(${80 + (10 * i)}%) contrast(${95 - (5 * i)}%)`;
    case 'fade':
      return `opacity(${100 - (20 * i)}%) saturate(${90 - (10 * i)}%)`;
    case 'glow':
      return `brightness(${110 + (10 * i)}%) blur(${0.5 * i}px) saturate(${130 * i}%)`;
    case 'sunset':
      return `sepia(${30 * i}%) hue-rotate(${-15 * i}deg) saturate(${130 * i}%)`;
    case 'arctic':
      return `hue-rotate(${180 * i}deg) saturate(${110 * i}%) brightness(${105 + (5 * i)}%)`;
    case 'neon':
      return `saturate(${200 * i}%) hue-rotate(${30 * i}deg) contrast(${120 * i}%)`;
    case 'noir':
      return `grayscale(${100 * i}%) contrast(${140 * i}%) brightness(${90 + (5 * i)}%)`;
    case 'pastel':
      return `saturate(${60 + (20 * i)}%) brightness(${110 + (10 * i)}%)`;
    case 'film':
      return `sepia(${25 * i}%) contrast(${105 + (10 * i)}%) saturate(${90 + (10 * i)}%)`;
    case 'chrome':
      return `saturate(${50 + (30 * i)}%) contrast(${120 * i}%) grayscale(${30 * i}%)`;
    case 'dream':
      return `brightness(${110 + (10 * i)}%) saturate(${130 * i}%) hue-rotate(${10 * i}deg) blur(${0.3 * i}px)`;
    
    // Portrait filters
    case 'clarendon':
      return `contrast(${100 + (20 * i)}%) saturate(${100 + (25 * i)}%)`;
    case 'rise':
      return `brightness(${100 + (10 * i)}%) contrast(${100 + (10 * i)}%) saturate(${100 - (10 * i)}%) sepia(${20 * i}%)`;
    case 'juno':
      return `sepia(${30 * i}%) contrast(${100 + (15 * i)}%) brightness(${100 + (10 * i)}%)`;
    case 'valencia':
      return `sepia(${15 * i}%) contrast(${100 + (8 * i)}%) brightness(${100 + (5 * i)}%) saturate(${100 + (15 * i)}%)`;
    
    // Vibrant
    case 'saturated':
      return `saturate(${100 + (50 * i)}%)`;
    case 'hdr':
      return `contrast(${100 + (30 * i)}%) saturate(${100 + (20 * i)}%)`;
    
    // Cool tones
    case 'blue-tint':
      return `hue-rotate(${180 * i}deg) saturate(${100 + (10 * i)}%)`;
    case 'icy':
      return `brightness(${100 + (15 * i)}%) contrast(${100 + (10 * i)}%) hue-rotate(${180 * i}deg)`;
    
    // Warm tones
    case 'golden':
      return `sepia(${40 * i}%) saturate(${100 + (20 * i)}%) hue-rotate(${-20 * i}deg)`;
    case 'sunrise':
      return `brightness(${100 + (15 * i)}%) sepia(${25 * i}%) saturate(${100 + (15 * i)}%)`;
    
    // Mono
    case 'grayscale':
      return `grayscale(${100 * i}%)`;
    case 'high-contrast':
      return `grayscale(${100 * i}%) contrast(${100 + (40 * i)}%)`;
    
    // Mood
    case 'moody':
      return `contrast(${100 + (20 * i)}%) brightness(${100 - (15 * i)}%) saturate(${100 - (10 * i)}%)`;
    case 'vignette':
      return `contrast(${100 + (10 * i)}%) brightness(${100 - (5 * i)}%)`;
    case 'contrast':
      return `contrast(${100 + (50 * i)}%)`;
    
    default:
      return 'none';
  }
}

/**
 * Simplify stroke path using Ramer-Douglas-Peucker algorithm
 * Reduces point count for better performance
 */
export function simplifyStroke(stroke: Stroke, tolerance: number = 2): Stroke {
  if (stroke.points.length < 3) return stroke;

  const simplified = ramerDouglasPeucker(stroke.points, tolerance);
  return { ...stroke, points: simplified };
}

function ramerDouglasPeucker(points: { x: number; y: number }[], tolerance: number) {
  if (points.length < 3) return points;

  let maxDistance = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const distance = perpendicularDistance(points[i], points[0], points[end]);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = ramerDouglasPeucker(points.slice(0, index + 1), tolerance);
    const right = ramerDouglasPeucker(points.slice(index), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[end]];
}

function perpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  
  if (mag === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  
  const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag);
  const intersectionX = lineStart.x + u * dx;
  const intersectionY = lineStart.y + u * dy;
  
  return Math.hypot(point.x - intersectionX, point.y - intersectionY);
}

/**
 * Render stroke on canvas with optimization
 */
export function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  scale: number = 1
) {
  if (stroke.points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Use path2D for better performance
  const path = new Path2D();
  path.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let i = 1; i < stroke.points.length; i++) {
    path.lineTo(stroke.points[i].x, stroke.points[i].y);
  }

  ctx.stroke(path);
  ctx.restore();
}

/**
 * Compress image blob for upload
 * Target: under 5MB for photos
 */
export async function compressImage(
  blob: Blob,
  maxSizeMB: number = 5,
  quality: number = 0.92
): Promise<Blob> {
  if (blob.size <= maxSizeMB * 1024 * 1024) {
    return blob;
  }

  // Create image from blob
  const img = await createImageBitmap(blob);
  
  // Calculate new dimensions if needed
  const maxDimension = 1920;
  let width = img.width;
  let height = img.height;

  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = width * ratio;
    height = height * ratio;
  }

  // Create canvas and draw
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return blob;

  ctx.drawImage(img, 0, 0, width, height);

  // Convert to blob with compression
  return new Promise((resolve) => {
    canvas.toBlob(
      (compressedBlob) => {
        resolve(compressedBlob || blob);
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Export editor state to composited image
 */
export async function compositeAndExport(
  editorState: EditorState,
  baseImage: HTMLImageElement,
  targetWidth: number = 1080,
  targetHeight: number = 1920
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Calculate scale factors
  const scaleX = targetWidth / baseImage.width;
  const scaleY = targetHeight / baseImage.height;
  const scale = Math.max(scaleX, scaleY);

  // Draw base image with filter
  ctx.save();
  if (editorState.filter !== 'none') {
    ctx.filter = getFilterStyle(editorState.filter, editorState.filterIntensity);
  }
  
  // Center and scale image
  const scaledWidth = baseImage.width * scale;
  const scaledHeight = baseImage.height * scale;
  const offsetX = (targetWidth - scaledWidth) / 2;
  const offsetY = (targetHeight - scaledHeight) / 2;
  
  ctx.drawImage(baseImage, offsetX, offsetY, scaledWidth, scaledHeight);
  ctx.restore();

  // Draw all strokes
  editorState.drawingLayer.strokes.forEach(stroke => {
    renderStroke(ctx, stroke, scale);
  });

  // Draw all layers
  editorState.layers.forEach(layer => {
    ctx.save();
    ctx.translate(layer.x * scale, layer.y * scale);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(layer.scale, layer.scale);

    if (layer.type === 'text') {
      renderTextLayer(ctx, layer as TextLayer);
    } else if (layer.type === 'emoji') {
      renderEmojiLayer(ctx, layer as EmojiLayer);
    }

    ctx.restore();
  });

  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      'image/jpeg',
      0.92
    );
  });
}

function renderTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer) {
  // Measure text
  ctx.font = `${layer.fontSize}px ${layer.font}`;
  const metrics = ctx.measureText(layer.content);

  // Draw background
  if (layer.backgroundColor !== 'transparent') {
    ctx.fillStyle = layer.backgroundColor;
    ctx.globalAlpha = layer.backgroundOpacity;
    ctx.fillRect(-10, -layer.fontSize, metrics.width + 20, layer.fontSize + 10);
    ctx.globalAlpha = 1;
  }

  // Apply text effects
  if (layer.textEffect === 'shadow') {
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
  } else if (layer.textEffect === 'glow') {
    ctx.shadowColor = layer.color;
    ctx.shadowBlur = 10;
  }

  // Draw outline if needed
  if (layer.textEffect === 'outline') {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeText(layer.content, 0, 0);
  }

  // Draw text
  ctx.fillStyle = layer.color;
  ctx.textAlign = layer.alignment;
  ctx.textBaseline = 'top';
  ctx.fillText(layer.content, 0, 0);
}

function renderEmojiLayer(ctx: CanvasRenderingContext2D, layer: EmojiLayer) {
  ctx.font = '64px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(layer.content, 0, 0);
}

/**
 * Deep clone editor state for history
 */
export function cloneEditorState(state: EditorState): EditorState {
  return {
    layers: state.layers.map(layer => ({ ...layer })),
    drawingLayer: state.drawingLayer ? {
      type: state.drawingLayer.type,
      strokes: state.drawingLayer.strokes.map(stroke => ({
        points: stroke.points.map(p => ({ x: p.x, y: p.y, pressure: p.pressure })),
        color: stroke.color,
        width: stroke.width,
        opacity: stroke.opacity ?? 1,
        tool: stroke.tool
      }))
    } : { type: 'drawing' as const, strokes: [] },
    selectedLayerId: state.selectedLayerId,
    filter: state.filter,
    filterIntensity: state.filterIntensity,
    imageState: state.imageState ? { ...state.imageState } : { zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 }
  };
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Check if point is inside a layer's bounds
 */
export function isPointInLayer(
  x: number,
  y: number,
  layer: Layer,
  tolerance: number = 20
): boolean {
  const dx = Math.abs(x - layer.x);
  const dy = Math.abs(y - layer.y);
  return dx < tolerance && dy < tolerance;
}

/**
 * Generate thumbnail from canvas
 */
export async function generateThumbnail(
  canvas: HTMLCanvasElement,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<Blob | null> {
  const thumbCanvas = document.createElement('canvas');
  const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
  
  thumbCanvas.width = canvas.width * scale;
  thumbCanvas.height = canvas.height * scale;
  
  const ctx = thumbCanvas.getContext('2d');
  if (!ctx) return null;
  
  ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
  
  return new Promise((resolve) => {
    thumbCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
  });
}
