import { create } from 'zustand';
import type { EditorTab, TextLayer, VisualLayer, TextAlignMode, TextVariant, TextAnimationOption, TextEffectOption, TextBackgroundOption, AssetPickerMode, TextComposerTool, TextStyleState, GiphyGif } from './types';
import { PRESETS, DEFAULT_TEXT_STYLE } from './constants';

interface EditorState {
  activeTab: EditorTab;
  setActiveTab: (val: EditorTab | ((prev: EditorTab) => EditorTab)) => void;
  selectedPresetId: string;
  setSelectedPresetId: (val: string | ((prev: string) => string)) => void;
  presetStrength: any;
  setPresetStrength: (val: any | ((prev: any) => any)) => void;
  textLayers: TextLayer[];
  setTextLayers: (val: TextLayer[] | ((prev: TextLayer[]) => TextLayer[])) => void;
  visualLayers: VisualLayer[];
  setVisualLayers: (val: VisualLayer[] | ((prev: VisualLayer[]) => VisualLayer[])) => void;
  selectedTextId: string | null;
  setSelectedTextId: (val: string | null | ((prev: string | null) => string | null)) => void;
  selectedVisualId: string | null;
  setSelectedVisualId: (val: string | null | ((prev: string | null) => string | null)) => void;
  canvasSize: any;
  setCanvasSize: (val: any | ((prev: any) => any)) => void;
  stageWindowOffset: any;
  setStageWindowOffset: (val: any | ((prev: any) => any)) => void;
  warmth: any;
  setWarmth: (val: any | ((prev: any) => any)) => void;
  tint: any;
  setTint: (val: any | ((prev: any) => any)) => void;
  fade: any;
  setFade: (val: any | ((prev: any) => any)) => void;
  vignette: any;
  setVignette: (val: any | ((prev: any) => any)) => void;
  darkness: any;
  setDarkness: (val: any | ((prev: any) => any)) => void;
  lightness: any;
  setLightness: (val: any | ((prev: any) => any)) => void;
  saving: any;
  setSaving: (val: any | ((prev: any) => any)) => void;
  captureMode: any;
  setCaptureMode: (val: any | ((prev: any) => any)) => void;
  composerVisible: any;
  setComposerVisible: (val: any | ((prev: any) => any)) => void;
  composerTargetId: string | null;
  setComposerTargetId: (val: string | null | ((prev: string | null) => string | null)) => void;
  composerText: any;
  setComposerText: (val: any | ((prev: any) => any)) => void;
  composerColor: any;
  setComposerColor: (val: any | ((prev: any) => any)) => void;
  composerFontSize: any;
  setComposerFontSize: (val: any | ((prev: any) => any)) => void;
  composerVariant: TextVariant;
  setComposerVariant: (val: TextVariant | ((prev: TextVariant) => TextVariant)) => void;
  composerAlign: TextAlignMode;
  setComposerAlign: (val: TextAlignMode | ((prev: TextAlignMode) => TextAlignMode)) => void;
  composerFontFamily: any;
  setComposerFontFamily: (val: any | ((prev: any) => any)) => void;
  composerStrokeWidth: any;
  setComposerStrokeWidth: (val: any | ((prev: any) => any)) => void;
  composerStrokeColor: any;
  setComposerStrokeColor: (val: any | ((prev: any) => any)) => void;
  composerShadowStrength: any;
  setComposerShadowStrength: (val: any | ((prev: any) => any)) => void;
  composerBgOpacity: any;
  setComposerBgOpacity: (val: any | ((prev: any) => any)) => void;
  composerLetterSpacing: any;
  setComposerLetterSpacing: (val: any | ((prev: any) => any)) => void;
  composerLineHeightMult: any;
  setComposerLineHeightMult: (val: any | ((prev: any) => any)) => void;
  composerTool: TextComposerTool;
  setComposerTool: (val: TextComposerTool | ((prev: TextComposerTool) => TextComposerTool)) => void;
  composerAnimation: TextAnimationOption;
  setComposerAnimation: (val: TextAnimationOption | ((prev: TextAnimationOption) => TextAnimationOption)) => void;
  composerEffect: TextEffectOption;
  setComposerEffect: (val: TextEffectOption | ((prev: TextEffectOption) => TextEffectOption)) => void;
  composerBackground: TextBackgroundOption;
  setComposerBackground: (val: TextBackgroundOption | ((prev: TextBackgroundOption) => TextBackgroundOption)) => void;
  keyboardVisible: any;
  setKeyboardVisible: (val: any | ((prev: any) => any)) => void;
  keyboardHeight: any;
  setKeyboardHeight: (val: any | ((prev: any) => any)) => void;
  assetPickerVisible: any;
  setAssetPickerVisible: (val: any | ((prev: any) => any)) => void;
  assetPickerMode: AssetPickerMode;
  setAssetPickerMode: (val: AssetPickerMode | ((prev: AssetPickerMode) => AssetPickerMode)) => void;
  assetQuery: any;
  setAssetQuery: (val: any | ((prev: any) => any)) => void;
  assetItems: GiphyGif[];
  setAssetItems: (val: GiphyGif[] | ((prev: GiphyGif[]) => GiphyGif[])) => void;
  assetLoading: any;
  setAssetLoading: (val: any | ((prev: any) => any)) => void;
  lookToastLabel: any;
  setLookToastLabel: (val: any | ((prev: any) => any)) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTab: 'text',
  setActiveTab: (val) => set((state) => ({ activeTab: typeof val === 'function' ? (val as any)(state.activeTab) : val })),
  selectedPresetId: PRESETS[0].id,
  setSelectedPresetId: (val) => set((state) => ({ selectedPresetId: typeof val === 'function' ? (val as any)(state.selectedPresetId) : val })),
  presetStrength: 1,
  setPresetStrength: (val) => set((state) => ({ presetStrength: typeof val === 'function' ? (val as any)(state.presetStrength) : val })),
  textLayers: [],
  setTextLayers: (val) => set((state) => ({ textLayers: typeof val === 'function' ? (val as any)(state.textLayers) : val })),
  visualLayers: [],
  setVisualLayers: (val) => set((state) => ({ visualLayers: typeof val === 'function' ? (val as any)(state.visualLayers) : val })),
  selectedTextId: null,
  setSelectedTextId: (val) => set((state) => ({ selectedTextId: typeof val === 'function' ? (val as any)(state.selectedTextId) : val })),
  selectedVisualId: null,
  setSelectedVisualId: (val) => set((state) => ({ selectedVisualId: typeof val === 'function' ? (val as any)(state.selectedVisualId) : val })),
  canvasSize: { width: 0, height: 0 },
  setCanvasSize: (val) => set((state) => ({ canvasSize: typeof val === 'function' ? (val as any)(state.canvasSize) : val })),
  stageWindowOffset: { x: 0, y: 0 },
  setStageWindowOffset: (val) => set((state) => ({ stageWindowOffset: typeof val === 'function' ? (val as any)(state.stageWindowOffset) : val })),
  warmth: 0,
  setWarmth: (val) => set((state) => ({ warmth: typeof val === 'function' ? (val as any)(state.warmth) : val })),
  tint: 0,
  setTint: (val) => set((state) => ({ tint: typeof val === 'function' ? (val as any)(state.tint) : val })),
  fade: 0,
  setFade: (val) => set((state) => ({ fade: typeof val === 'function' ? (val as any)(state.fade) : val })),
  vignette: 0,
  setVignette: (val) => set((state) => ({ vignette: typeof val === 'function' ? (val as any)(state.vignette) : val })),
  darkness: 0,
  setDarkness: (val) => set((state) => ({ darkness: typeof val === 'function' ? (val as any)(state.darkness) : val })),
  lightness: 0,
  setLightness: (val) => set((state) => ({ lightness: typeof val === 'function' ? (val as any)(state.lightness) : val })),
  saving: false,
  setSaving: (val) => set((state) => ({ saving: typeof val === 'function' ? (val as any)(state.saving) : val })),
  captureMode: false,
  setCaptureMode: (val) => set((state) => ({ captureMode: typeof val === 'function' ? (val as any)(state.captureMode) : val })),
  composerVisible: false,
  setComposerVisible: (val) => set((state) => ({ composerVisible: typeof val === 'function' ? (val as any)(state.composerVisible) : val })),
  composerTargetId: null,
  setComposerTargetId: (val) => set((state) => ({ composerTargetId: typeof val === 'function' ? (val as any)(state.composerTargetId) : val })),
  composerText: '',
  setComposerText: (val) => set((state) => ({ composerText: typeof val === 'function' ? (val as any)(state.composerText) : val })),
  composerColor: DEFAULT_TEXT_STYLE.color,
  setComposerColor: (val) => set((state) => ({ composerColor: typeof val === 'function' ? (val as any)(state.composerColor) : val })),
  composerFontSize: DEFAULT_TEXT_STYLE.fontSize,
  setComposerFontSize: (val) => set((state) => ({ composerFontSize: typeof val === 'function' ? (val as any)(state.composerFontSize) : val })),
  composerVariant: DEFAULT_TEXT_STYLE.variant,
  setComposerVariant: (val) => set((state) => ({ composerVariant: typeof val === 'function' ? (val as any)(state.composerVariant) : val })),
  composerAlign: DEFAULT_TEXT_STYLE.align,
  setComposerAlign: (val) => set((state) => ({ composerAlign: typeof val === 'function' ? (val as any)(state.composerAlign) : val })),
  composerFontFamily: DEFAULT_TEXT_STYLE.fontFamily,
  setComposerFontFamily: (val) => set((state) => ({ composerFontFamily: typeof val === 'function' ? (val as any)(state.composerFontFamily) : val })),
  composerStrokeWidth: DEFAULT_TEXT_STYLE.strokeWidth,
  setComposerStrokeWidth: (val) => set((state) => ({ composerStrokeWidth: typeof val === 'function' ? (val as any)(state.composerStrokeWidth) : val })),
  composerStrokeColor: DEFAULT_TEXT_STYLE.strokeColor,
  setComposerStrokeColor: (val) => set((state) => ({ composerStrokeColor: typeof val === 'function' ? (val as any)(state.composerStrokeColor) : val })),
  composerShadowStrength: DEFAULT_TEXT_STYLE.shadowStrength,
  setComposerShadowStrength: (val) => set((state) => ({ composerShadowStrength: typeof val === 'function' ? (val as any)(state.composerShadowStrength) : val })),
  composerBgOpacity: DEFAULT_TEXT_STYLE.bgOpacity,
  setComposerBgOpacity: (val) => set((state) => ({ composerBgOpacity: typeof val === 'function' ? (val as any)(state.composerBgOpacity) : val })),
  composerLetterSpacing: DEFAULT_TEXT_STYLE.letterSpacing,
  setComposerLetterSpacing: (val) => set((state) => ({ composerLetterSpacing: typeof val === 'function' ? (val as any)(state.composerLetterSpacing) : val })),
  composerLineHeightMult: DEFAULT_TEXT_STYLE.lineHeightMult,
  setComposerLineHeightMult: (val) => set((state) => ({ composerLineHeightMult: typeof val === 'function' ? (val as any)(state.composerLineHeightMult) : val })),
  composerTool: 'font',
  setComposerTool: (val) => set((state) => ({ composerTool: typeof val === 'function' ? (val as any)(state.composerTool) : val })),
  composerAnimation: 'none',
  setComposerAnimation: (val) => set((state) => ({ composerAnimation: typeof val === 'function' ? (val as any)(state.composerAnimation) : val })),
  composerEffect: 'default',
  setComposerEffect: (val) => set((state) => ({ composerEffect: typeof val === 'function' ? (val as any)(state.composerEffect) : val })),
  composerBackground: 'none',
  setComposerBackground: (val) => set((state) => ({ composerBackground: typeof val === 'function' ? (val as any)(state.composerBackground) : val })),
  keyboardVisible: false,
  setKeyboardVisible: (val) => set((state) => ({ keyboardVisible: typeof val === 'function' ? (val as any)(state.keyboardVisible) : val })),
  keyboardHeight: 0,
  setKeyboardHeight: (val) => set((state) => ({ keyboardHeight: typeof val === 'function' ? (val as any)(state.keyboardHeight) : val })),
  assetPickerVisible: false,
  setAssetPickerVisible: (val) => set((state) => ({ assetPickerVisible: typeof val === 'function' ? (val as any)(state.assetPickerVisible) : val })),
  assetPickerMode: 'sticker',
  setAssetPickerMode: (val) => set((state) => ({ assetPickerMode: typeof val === 'function' ? (val as any)(state.assetPickerMode) : val })),
  assetQuery: '',
  setAssetQuery: (val) => set((state) => ({ assetQuery: typeof val === 'function' ? (val as any)(state.assetQuery) : val })),
  assetItems: [],
  setAssetItems: (val) => set((state) => ({ assetItems: typeof val === 'function' ? (val as any)(state.assetItems) : val })),
  assetLoading: false,
  setAssetLoading: (val) => set((state) => ({ assetLoading: typeof val === 'function' ? (val as any)(state.assetLoading) : val })),
  lookToastLabel: PRESETS[0].label,
  setLookToastLabel: (val) => set((state) => ({ lookToastLabel: typeof val === 'function' ? (val as any)(state.lookToastLabel) : val })),
}));
