import type { GiphyGif } from "../../../services/giphy.service";

export type { GiphyGif };

export type EditorTab = 'text' | 'image' | 'sticker' | 'grade' | 'filter';
export type TextAlignMode = 'left' | 'center' | 'right';
export type TextVariant = 'standard' | 'classic' | 'modern' | 'neon' | 'typewriter' | 'outline' | 'glass' | 'filled';
export type TextAnimationOption = 'none' | 'fadeScale' | 'slideUp' | 'bounce' | 'scaleDown' | 'fadeIn' | 'fadeOut' | 'slideDown' | 'typewriter' | 'zoomIn' | 'zoomOut' | 'blurClear' | 'glowPulse' | 'tilt' | 'shake';
export type TextEffectOption = 'default' | 'outline' | 'glass' | 'shadow' | 'neon' | 'soft' | 'marker' | 'cutout' | 'paper' | 'capsule' | 'halo' | 'stamp';
export type TextBackgroundOption = 'none' | 'black' | 'white';
export type AssetPickerMode = 'sticker' | 'giphy' | 'gif';
export type TextComposerTool = 'font' | 'color' | 'animation' | 'effect' | 'background';

export type VisualLayerKind = 'image' | 'sticker' | 'gif';

export interface TextLayer {
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    rotation: number;
    fontSize: number;
    color: string;
    align: TextAlignMode;
    variant: TextVariant;
    fontFamily: string;
    strokeWidth: number;
    strokeColor: string;
    shadowStrength: number;
    bgOpacity: number;
    letterSpacing: number;
    lineHeightMult: number;
    effect: TextEffectOption;
}

export interface VisualLayer {
    id: string;
    kind: VisualLayerKind;
    uri?: string;
    previewUri?: string;
    sticker?: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    width: number;
    height: number;
    fit?: 'cover' | 'contain';
    borderRadius?: number;
    title?: string;
}

export interface TextStyleState extends Omit<TextLayer, 'id' | 'text' | 'x' | 'y' | 'scale' | 'rotation' | 'width' | 'height'> {
}
