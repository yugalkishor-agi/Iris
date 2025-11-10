// Core types for the advanced story editor

export interface BaseLayer {
  id: string;
  type: 'text' | 'emoji' | 'sticker' | 'poll' | 'question' | 'slider' | 'music' | 'mention';
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  font: string;
  fontSize: number;
  color: string; // Supports hex colors AND CSS gradients
  backgroundColor: string;
  backgroundOpacity: number;
  backgroundMode?: 'none' | 'solid' | 'rounded'; // New: background style
  alignment: 'left' | 'center' | 'right';
  textEffect: string;
  animation: string;
  entranceAnimation?: 'none' | 'slideIn' | 'fadeIn' | 'bounceIn' | 'zoomIn' | 'popIn'; // New
  letterSpacing?: number; // in pixels
  lineHeight?: number; // multiplier (1.0 = normal)
  opacity?: number; // 0-1
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  fontWeight?: number; // 100-900
  shadowIntensity?: number; // 0-100
  strokeWidth?: number; // outline thickness
  backdropBlur?: number; // background blur in px
  curved?: boolean; // curved text
  curveAmount?: number; // curve intensity
}

export interface EmojiLayer extends BaseLayer {
  type: 'emoji';
  content: string;
}

export interface InteractiveLayer extends BaseLayer {
  type: 'poll' | 'question' | 'slider' | 'music' | 'mention';
  data: any;
}

export type Layer = TextLayer | EmojiLayer | InteractiveLayer;

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
  opacity: number;
  tool: 'marker' | 'highlighter' | 'neon' | 'chalk' | 'arrow' | 'eraser';
}

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface DrawingLayer {
  type: 'drawing';
  strokes: Stroke[];
}

export interface ImageState {
  zoom: number; // 1x to 4x
  offsetX: number;
  offsetY: number;
  rotation: number; // 0-360 degrees
}

export interface EditorState {
  layers: Layer[];
  drawingLayer: DrawingLayer;
  selectedLayerId: string | null;
  filter: string;
  filterIntensity: number;
  imageState: ImageState;
}

export interface StoryMetadata {
  filter: string;
  filterIntensity: number;
  layers: Layer[];
  visibility: 'everyone' | 'followers' | 'close_friends';
  allowReplies: boolean;
  allowSharing: boolean;
}

// Constants - Instagram-style fonts
export const FONTS = [
  { name: 'Classic', value: 'Arial, Helvetica, sans-serif', style: 'clean' },
  { name: 'Modern', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', style: 'contemporary' },
  { name: 'Neon', value: 'Impact, "Arial Black", sans-serif', style: 'bold-outlined' },
  { name: 'Typewriter', value: '"Courier New", Courier, monospace', style: 'retro' },
  { name: 'Signature', value: '"Brush Script MT", cursive', style: 'handwritten' },
  { name: 'Editor', value: 'Georgia, "Times New Roman", serif', style: 'editorial' },
  { name: 'Bubble', value: '"Comic Sans MS", cursive', style: 'playful-rounded' },
  { name: 'Squeeze', value: 'Impact, Haettenschweiler, sans-serif', style: 'compressed' },
  { name: 'Poster', value: '"Arial Black", Gadget, sans-serif', style: 'display' },
  { name: 'Deco', value: 'Palatino, "Palatino Linotype", serif', style: 'decorative' },
];

export const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#FF1493'
];

export const TEXT_GRADIENTS = [
  { name: 'Sunset', value: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' },
  { name: 'Fire', value: 'linear-gradient(135deg, #F83600 0%, #FE8C00 100%)' },
  { name: 'Rainbow', value: 'linear-gradient(135deg, #FF0080 0%, #FF8C00 25%, #40E0D0 50%, #FF0080 75%, #7B68EE 100%)' },
  { name: 'Neon', value: 'linear-gradient(135deg, #00F5FF 0%, #FF00FF 100%)' },
  { name: 'Gold', value: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)' },
  { name: 'Purple', value: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' },
  { name: 'Green', value: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)' },
];

export const TEXT_ANIMATIONS = [
  { name: 'None', value: 'none' },
  { name: 'Fade In', value: 'fadeIn' },
  { name: 'Slide Up', value: 'slideUp' },
  { name: 'Bounce', value: 'bounce' },
  { name: 'Zoom', value: 'zoom' },
  { name: 'Pulse', value: 'pulse' },
];

export const TEXT_EFFECTS_EXTENDED = [
  { name: 'None', value: 'none' },
  { name: 'Shadow', value: 'shadow' },
  { name: 'Outline', value: 'outline' },
  { name: 'Glow', value: 'glow' },
  { name: 'Neon', value: 'neon' },
  { name: '3D', value: '3d' },
  { name: 'Retro', value: 'retro' },
  { name: 'Glitch', value: 'glitch' },
];

export const BG_COLORS = [
  'transparent', '#000000', '#FFFFFF', '#FF0000', '#00FF00',
  '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'
];

// Instagram-style filters (30+ filters)
export const FILTERS = [
  // Basic
  { name: 'Normal', id: 'none', category: 'basic' },
  
  // Portrait filters
  { name: 'Clarendon', id: 'clarendon', category: 'portrait' },
  { name: 'Rise', id: 'rise', category: 'portrait' },
  { name: 'Juno', id: 'juno', category: 'portrait' },
  { name: 'Valencia', id: 'valencia', category: 'portrait' },
  
  // Vintage/Retro
  { name: 'Vintage', id: 'vintage', category: 'retro' },
  { name: 'Sepia', id: 'sepia', category: 'retro' },
  { name: 'Film Grain', id: 'film', category: 'retro' },
  { name: 'Vignette', id: 'vignette', category: 'retro' },
  { name: 'Faded', id: 'fade', category: 'retro' },
  
  // Vibrant
  { name: 'Vivid', id: 'vivid', category: 'vibrant' },
  { name: 'Saturated', id: 'saturated', category: 'vibrant' },
  { name: 'Bright', id: 'bright', category: 'vibrant' },
  { name: 'Contrast', id: 'contrast', category: 'vibrant' },
  { name: 'HDR', id: 'hdr', category: 'vibrant' },
  
  // Cool tones
  { name: 'Cool', id: 'cool', category: 'cool' },
  { name: 'Arctic', id: 'arctic', category: 'cool' },
  { name: 'Blue Tint', id: 'blue-tint', category: 'cool' },
  { name: 'Icy', id: 'icy', category: 'cool' },
  
  // Warm tones
  { name: 'Warm', id: 'warm', category: 'warm' },
  { name: 'Sunset', id: 'sunset', category: 'warm' },
  { name: 'Golden Hour', id: 'golden', category: 'warm' },
  { name: 'Sunrise', id: 'sunrise', category: 'warm' },
  
  // Black & White
  { name: 'B&W', id: 'bw', category: 'mono' },
  { name: 'Noir', id: 'noir', category: 'mono' },
  { name: 'High Contrast', id: 'high-contrast', category: 'mono' },
  { name: 'Grayscale', id: 'grayscale', category: 'mono' },
  
  // Mood
  { name: 'Dreamy', id: 'dream', category: 'mood' },
  { name: 'Moody', id: 'moody', category: 'mood' },
  { name: 'Dramatic', id: 'dramatic', category: 'mood' },
  { name: 'Soft', id: 'soft', category: 'mood' },
  { name: 'Glow', id: 'glow', category: 'mood' },
  { name: 'Neon', id: 'neon', category: 'mood' },
  { name: 'Chrome', id: 'chrome', category: 'mood' },
  { name: 'Pastel', id: 'pastel', category: 'mood' },
];
