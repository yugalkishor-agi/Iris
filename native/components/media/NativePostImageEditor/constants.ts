import { TextAnimationOption, TextEffectOption, TextBackgroundOption, TextStyleState } from "./types";

export const DEFAULT_TEXT_SIZE = 36;
export const MIN_TEXT_SIZE = 12;
export const MAX_TEXT_SIZE = 120;

export const FONT_SIZES = [12, 16, 20, 24, 28, 36, 48, 64, 80, 96, 120];
export const COLORS = ['#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55'];

export const FONTS: { id: string; label: string; value: string }[] = [
  { id: '1', label: 'System', value: 'System' },
];

export const PRESETS = [
      { id: 'none', label: 'Original' },
      { id: 'warm', label: 'Warm' },
      { id: 'cool', label: 'Cool' }
    ];
export const DEFAULT_TEXT_STYLE: TextStyleState = {
      fontSize: 36,
      color: '#FFFFFF',
      align: 'center',
      variant: 'standard',
      fontFamily: 'System',
      strokeWidth: 0,
      strokeColor: 'transparent',
      shadowStrength: 0,
      bgOpacity: 0,
      letterSpacing: 0,
      lineHeightMult: 1,
      effect: 'default'
    };
export const FONT_OPTIONS = FONTS;
export const PREMIUM_TEXT_COLORS = COLORS;
export const TEXT_ANIMATION_OPTIONS: { id: TextAnimationOption; label: string }[] = [
  { id: 'none', label: 'None' },
];
export const TEXT_EFFECT_OPTIONS: { id: TextEffectOption; label: string }[] = [
  { id: 'default', label: 'None' },
  { id: 'outline', label: 'Outline' },
  { id: 'glass', label: 'Glass' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'neon', label: 'Neon' },
  { id: 'soft', label: 'Soft' },
  { id: 'marker', label: 'Marker' },
  { id: 'cutout', label: 'Cutout' },
  { id: 'paper', label: 'Paper' },
  { id: 'capsule', label: 'Capsule' },
  { id: 'halo', label: 'Halo' },
  { id: 'stamp', label: 'Stamp' },
];
export const TEXT_BACKGROUND_OPTIONS: { id: TextBackgroundOption; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'black', label: 'Black' },
  { id: 'white', label: 'White' },
];
export const STYLE_VARIANTS = [{ id: 'standard', label: 'Standard' }];
