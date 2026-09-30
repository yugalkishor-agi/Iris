const fs = require('fs');

const missingCode = `
export interface NativePostImageEditorProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onSave: (payload: any) => void;
  headerAccessory?: React.ReactNode;
}

export type EditorTab = 'text' | 'image' | 'sticker' | 'grade' | 'filter';
export type TextAlignMode = 'left' | 'center' | 'right';
export type TextVariant = 'standard' | 'classic' | 'modern' | 'neon' | 'typewriter';
export type TextAnimationOption = 'none' | 'fadeScale' | 'slideUp' | 'bounce' | 'scaleDown' | 'fadeIn' | 'fadeOut' | 'slideDown' | 'typewriter' | 'zoomIn' | 'zoomOut' | 'blurClear' | 'glowPulse' | 'tilt' | 'shake';
export type TextEffectOption = 'default' | 'outline' | 'shadow' | 'glow';
export type TextBackgroundOption = 'none' | 'black' | 'white';
export type AssetPickerMode = 'sticker' | 'giphy' | 'gif';
export type TextComposerTool = 'font' | 'color' | 'animation' | 'effect' | 'background';

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
  kind: 'image' | 'sticker';
  uri?: string;
  sticker?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  width: number;
  height: number;
}

export interface TextStyleState extends Omit<TextLayer, 'id' | 'text' | 'x' | 'y' | 'scale' | 'rotation' | 'width' | 'height'> {}

export const DEFAULT_TEXT_SIZE = 36;
export const MIN_TEXT_SIZE = 12;
export const MAX_TEXT_SIZE = 120;
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

export const FONT_OPTIONS = [{ id: '1', label: 'System', value: 'System' }];
export const PREMIUM_TEXT_COLORS = ['#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55'];
export const TEXT_ANIMATION_OPTIONS = [{ id: 'none', label: 'None' }];
export const TEXT_EFFECT_OPTIONS = [{ id: 'default', label: 'None' }, { id: 'outline', label: 'Outline' }, { id: 'shadow', label: 'Shadow' }, { id: 'glow', label: 'Glow' }];
export const TEXT_BACKGROUND_OPTIONS = [{ id: 'none', label: 'None' }, { id: 'black', label: 'Black' }, { id: 'white', label: 'White' }];
export const STYLE_VARIANTS = [{ id: 'standard', label: 'Standard' }];

export const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
export const round2 = (val: number) => Math.round(val * 100) / 100;
export const normalizeComposerTextColor = (c: string) => c;
export const buildPresetGrade = (presetId: string, strength: number) => ({});
export const cycleAlign = (a: TextAlignMode): TextAlignMode => a === 'left' ? 'center' : (a === 'center' ? 'right' : 'left');
export const fitTextLayout = (t: string, s: any) => ({ width: 100, height: 100, fontSize: 36 });
export const resolveAlignedX = () => 0;
export const waitForNextPaint = () => new Promise(r => requestAnimationFrame(r));
export const getVariantContainerStyle = () => ({});
export const getVariantTextStyle = () => ({});
export const getTextShadowStyle = () => ({});
export const getContrastText = (c: string) => '#000000';

export function EditorVisualLayer(props: any) {
  return <View style={{ position: 'absolute', left: props.layer.x, top: props.layer.y, width: props.layer.width, height: props.layer.height, transform: [{ scale: props.layer.scale }, { rotate: \`\${props.layer.rotation}deg\`}] }}>
    {props.layer.kind === 'sticker' ? <Text style={{fontSize: 40}}>{props.layer.sticker}</Text> : (props.layer.uri ? <FastImage source={{uri: props.layer.uri}} style={{width: '100%', height: '100%'}} /> : null)}
  </View>;
}

export function EditorTextLayer(props: any) {
  return <View style={{ position: 'absolute', left: props.layer.x, top: props.layer.y, width: props.layer.width, height: props.layer.height, transform: [{ scale: props.layer.scale }, { rotate: \`\${props.layer.rotation}deg\`}] }}>
    <Text style={{ fontSize: props.layer.fontSize, color: props.layer.color, textAlign: props.layer.align }}>{props.layer.text}</Text>
  </View>;
}

export function TextBackdrop({ visible, onPress }: any) {
  if (!visible) return null;
  return <Pressable style={StyleSheet.absoluteFill} onPress={onPress} />;
}

export const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function StickerAssetSheet(props: any) {
  if (!props.visible) return null;
  return <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 300, backgroundColor: 'black' }}><Text style={{color: 'white'}}>Sticker Sheet Placeholder</Text></View>;
}

`;

let content = fs.readFileSync('u:/i/NativePostImageEditor_backup.tsx', 'utf8');

// Fix syntax
content = content.replace(/setH\.TextLayers/g, 'setTextLayers');
content = content.replace(/setH\.VisualLayers/g, 'setVisualLayers');
content = content.replace(/H\./g, '');

const match = content.match(/export function NativePostImageEditor/);
if (match) {
  const codeIndex = match.index;
  const goodImports = `import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Keyboard, KeyboardAvoidingView, Modal, PanResponder, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, Pressable, TouchableOpacity, View, ImageBackground, useWindowDimensions, Dimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import { giphyService } from '../../services/giphy.service';
import type { GiphyGif } from '../../services/giphy.service';
import { borderRadius, spacing, typography } from '../../styles/theme';

`;
  
  content = goodImports + missingCode + content.substring(codeIndex);
}

fs.writeFileSync('u:/i/native/components/media/NativePostImageEditor.tsx', content, 'utf8');
console.log('Fully reconstructed NativePostImageEditor.tsx');
