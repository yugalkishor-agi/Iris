// glimpseEditorConstants.ts
// Purpose: Constants for NativeGlimpseEditor
// Extracted from: NativeGlimpseEditor.tsx — Session 001

import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type {
  GlimpseOverlayAnimation,
  GlimpseOverlayEffect,
  GlimpseOverlayBackground,
} from './glimpseEditorTypes';

type EditorTool = 'text' | 'effects' | 'voice' | 'clips' | 'overlay' | 'music' | 'download';

export const FONT_OPTIONS: Array<{ id: string; label: string; value: string }> = [
  { id: 'clean', label: 'Clean', value: Platform.OS === 'ios' ? 'AvenirNext-Regular' : 'sans-serif' },
  { id: 'studio', label: 'Studio', value: Platform.OS === 'ios' ? 'HelveticaNeue-Medium' : 'sans-serif-medium' },
  { id: 'bold', label: 'Bold', value: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif-black' },
  { id: 'editorial', label: 'Editorial', value: Platform.OS === 'ios' ? 'Georgia-Bold' : 'serif' },
  { id: 'mono', label: 'Mono', value: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  { id: 'poster', label: 'Poster', value: Platform.OS === 'ios' ? 'AvenirNextCondensed-Heavy' : 'sans-serif-condensed' },
  { id: 'story', label: 'Story', value: Platform.OS === 'ios' ? 'Baskerville-SemiBold' : 'serif-monospace' },
];

export const TEXT_COLORS = [
  '#FFFFFF', '#F5D76E', '#FF8A5B', '#FB7185', '#D8B4FE',
  '#7DD3FC', '#22D3EE', '#34D399', '#F59E0B', '#F97316',
];

export const TEXT_ANIMATIONS: Array<{ id: GlimpseOverlayAnimation; label: string }> = [
  { id: 'none', label: 'Still' },
  { id: 'fadeScale', label: 'Fade + Scale' },
  { id: 'slideUp', label: 'Slide Up' },
  { id: 'typewriter', label: 'Typewriter' },
  { id: 'bounce', label: 'Bounce' },
];

export const TEXT_EFFECTS: Array<{ id: GlimpseOverlayEffect; label: string }> = [
  { id: 'clean', label: 'Clean' },
  { id: 'outline', label: 'Outline' },
  { id: 'shadow', label: 'Deep Shadow' },
  { id: 'glow', label: 'Glow' },
];

export const TEXT_BACKGROUNDS: Array<{ id: GlimpseOverlayBackground; label: string }> = [
  { id: 'none', label: 'Transparent' },
  { id: 'black', label: 'Black' },
  { id: 'white', label: 'White' },
];

export const TOOLS: Array<{ id: EditorTool; icon: keyof typeof Ionicons.glyphMap; label: string }> = [
  { id: 'text', icon: 'text-outline', label: 'Text' },
  { id: 'effects', icon: 'sparkles-outline', label: 'Effects' },
  { id: 'voice', icon: 'mic-outline', label: 'Voice' },
  { id: 'clips', icon: 'film-outline', label: 'Clips' },
  { id: 'overlay', icon: 'layers-outline', label: 'Overlay' },
  { id: 'music', icon: 'musical-notes-outline', label: 'Song' },
  { id: 'download', icon: 'download-outline', label: 'Export' },
];

export const STICKER_PRESETS = ['*', '+', '!!', '<3', 'XO', '//', '##', '>>'];

// Sizing constants
export const OVERLAY_STAGE_WIDTH = 280;
export const OVERLAY_STAGE_HEIGHT = 420;
export const OVERLAY_MIN_SIZE = 72;
export const OVERLAY_MAX_SIZE = 220;
export const MAX_VOICEOVER_MS = 6000;
