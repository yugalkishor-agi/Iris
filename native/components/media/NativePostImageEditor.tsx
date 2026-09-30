import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, InteractionManager, Keyboard, KeyboardAvoidingView, Modal, PanResponder, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, Pressable, TouchableOpacity, View, useWindowDimensions, Dimensions } from 'react-native';
import type { KeyboardEvent as RNKeyboardEvent } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import { giphyService } from '../../services/giphy.service';
import type { GiphyGif } from '../../services/giphy.service';
import { borderRadius, spacing, typography } from '../../styles/theme';
import { useEditorStore } from "./NativePostImageEditor/useEditorStore";
import * as Types from "./NativePostImageEditor/types";
import { EditorTab, TextAlignMode, TextVariant, TextAnimationOption, TextEffectOption, TextBackgroundOption, AssetPickerMode, TextComposerTool, TextLayer, VisualLayer, TextStyleState, VisualLayerKind } from "./NativePostImageEditor/types";
import { PRESETS, DEFAULT_TEXT_STYLE, FONTS, FONT_SIZES, COLORS, DEFAULT_TEXT_SIZE, FONT_OPTIONS, PREMIUM_TEXT_COLORS, TEXT_ANIMATION_OPTIONS, TEXT_EFFECT_OPTIONS, TEXT_BACKGROUND_OPTIONS } from "./NativePostImageEditor/constants";
import { EditorVisualLayer } from './NativePostImageEditor/components/EditorVisualLayer';
import { EditorTextLayer } from './NativePostImageEditor/components/EditorTextLayer';
import { TextBackdrop } from './NativePostImageEditor/components/TextBackdrop';
import { StickerAssetSheet } from './NativePostImageEditor/components/StickerAssetSheet';
import { TextMiniSlider } from './NativePostImageEditor/components/TextMiniSlider';
import { GradeSlider } from './NativePostImageEditor/components/GradeSlider';
import { styles } from "./NativePostImageEditor/styles";
import { getVariantContainerStyle, getVariantTextStyle, getTextShadowStyle, getContrastText, round2, cycleAlign, composerToolIconColor, normalizeComposerTextColor } from "./NativePostImageEditor/utils";
import { Image } from 'expo-image';

export interface NativePostImageEditorProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onSave: (payload: any) => void;
  headerAccessory?: React.ReactNode;
}

export const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export interface PresetGrade {
  warmth: number;
  tint: number;
  fade: number;
  vignette: number;
  darkness: number;
  lightness: number;
}

// TODO: Original per-preset grade math was lost in refactor. This is a neutral
// placeholder that preserves the grade shape; "none" stays neutral and other
// presets get a mild strength-scaled warmth shift. Revisit for real look values.
export const buildPresetGrade = (preset: { id: string; label: string }, strength: number): PresetGrade => {
  const base: PresetGrade = { warmth: 0, tint: 0, fade: 0, vignette: 0, darkness: 0, lightness: 0 };
  if (!preset || preset.id === 'none') {
    return base;
  }
  const direction = preset.id === 'cool' ? -1 : 1;
  return { ...base, warmth: round2(0.25 * strength * direction) };
};

export const fitTextLayout = (
  text: string,
  fontSize: number,
  width?: number,
  lineHeightMult?: number,
) => ({ width: width ?? 100, height: 100, fontSize });

export const resolveAlignedX = (
  align?: TextAlignMode,
  layerWidth?: number,
  canvasWidth?: number,
) => {
  if (align === 'center' && canvasWidth != null && layerWidth != null) {
    return (canvasWidth - layerWidth) / 2;
  }
  if (align === 'right' && canvasWidth != null && layerWidth != null) {
    return canvasWidth - layerWidth;
  }
  return 0;
};
export const waitForNextPaint = () => new Promise(r => requestAnimationFrame(r));
export const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function NativePostImageEditor({ visible, imageUri, onClose, onSave, headerAccessory }: NativePostImageEditorProps) {
  const { width, height } = useWindowDimensions();
  const canvasRef = useRef<View>(null);
  const composerInputRef = useRef<TextInput>(null);
  const activeTab = useEditorStore(s => s.activeTab);
    const setActiveTab = useEditorStore(s => s.setActiveTab);
  const selectedPresetId = useEditorStore(s => s.selectedPresetId);
    const setSelectedPresetId = useEditorStore(s => s.setSelectedPresetId);
  const presetStrength = useEditorStore(s => s.presetStrength);
    const setPresetStrength = useEditorStore(s => s.setPresetStrength);
  const textLayers = useEditorStore(s => s.textLayers);
    const setTextLayers = useEditorStore(s => s.setTextLayers);
  const visualLayers = useEditorStore(s => s.visualLayers);
    const setVisualLayers = useEditorStore(s => s.setVisualLayers);
  const selectedTextId = useEditorStore(s => s.selectedTextId);
    const setSelectedTextId = useEditorStore(s => s.setSelectedTextId);
  const selectedVisualId = useEditorStore(s => s.selectedVisualId);
    const setSelectedVisualId = useEditorStore(s => s.setSelectedVisualId);
  const canvasSize = useEditorStore(s => s.canvasSize);
    const setCanvasSize = useEditorStore(s => s.setCanvasSize);
  const stageWindowOffset = useEditorStore(s => s.stageWindowOffset);
    const setStageWindowOffset = useEditorStore(s => s.setStageWindowOffset);
  const warmth = useEditorStore(s => s.warmth);
    const setWarmth = useEditorStore(s => s.setWarmth);
  const tint = useEditorStore(s => s.tint);
    const setTint = useEditorStore(s => s.setTint);
  const fade = useEditorStore(s => s.fade);
    const setFade = useEditorStore(s => s.setFade);
  const vignette = useEditorStore(s => s.vignette);
    const setVignette = useEditorStore(s => s.setVignette);
  const darkness = useEditorStore(s => s.darkness);
    const setDarkness = useEditorStore(s => s.setDarkness);
  const lightness = useEditorStore(s => s.lightness);
    const setLightness = useEditorStore(s => s.setLightness);
  const saving = useEditorStore(s => s.saving);
    const setSaving = useEditorStore(s => s.setSaving);
  const captureMode = useEditorStore(s => s.captureMode);
    const setCaptureMode = useEditorStore(s => s.setCaptureMode);
  const composerVisible = useEditorStore(s => s.composerVisible);
    const setComposerVisible = useEditorStore(s => s.setComposerVisible);
  const composerTargetId = useEditorStore(s => s.composerTargetId);
    const setComposerTargetId = useEditorStore(s => s.setComposerTargetId);
  const composerText = useEditorStore(s => s.composerText);
    const setComposerText = useEditorStore(s => s.setComposerText);
  const composerColor = useEditorStore(s => s.composerColor);
    const setComposerColor = useEditorStore(s => s.setComposerColor);
  const composerFontSize = useEditorStore(s => s.composerFontSize);
    const setComposerFontSize = useEditorStore(s => s.setComposerFontSize);
  const composerVariant = useEditorStore(s => s.composerVariant);
    const setComposerVariant = useEditorStore(s => s.setComposerVariant);
  const composerAlign = useEditorStore(s => s.composerAlign);
    const setComposerAlign = useEditorStore(s => s.setComposerAlign);
  const composerFontFamily = useEditorStore(s => s.composerFontFamily);
    const setComposerFontFamily = useEditorStore(s => s.setComposerFontFamily);
  const composerStrokeWidth = useEditorStore(s => s.composerStrokeWidth);
    const setComposerStrokeWidth = useEditorStore(s => s.setComposerStrokeWidth);
  const composerStrokeColor = useEditorStore(s => s.composerStrokeColor);
    const setComposerStrokeColor = useEditorStore(s => s.setComposerStrokeColor);
  const composerShadowStrength = useEditorStore(s => s.composerShadowStrength);
    const setComposerShadowStrength = useEditorStore(s => s.setComposerShadowStrength);
  const composerBgOpacity = useEditorStore(s => s.composerBgOpacity);
    const setComposerBgOpacity = useEditorStore(s => s.setComposerBgOpacity);
  const composerLetterSpacing = useEditorStore(s => s.composerLetterSpacing);
    const setComposerLetterSpacing = useEditorStore(s => s.setComposerLetterSpacing);
  const composerLineHeightMult = useEditorStore(s => s.composerLineHeightMult);
    const setComposerLineHeightMult = useEditorStore(s => s.setComposerLineHeightMult);
  const composerTool = useEditorStore(s => s.composerTool);
    const setComposerTool = useEditorStore(s => s.setComposerTool);
  const composerAnimation = useEditorStore(s => s.composerAnimation);
    const setComposerAnimation = useEditorStore(s => s.setComposerAnimation);
  const composerEffect = useEditorStore(s => s.composerEffect);
    const setComposerEffect = useEditorStore(s => s.setComposerEffect);
  const composerBackground = useEditorStore(s => s.composerBackground);
    const setComposerBackground = useEditorStore(s => s.setComposerBackground);
  const keyboardVisible = useEditorStore(s => s.keyboardVisible);
    const setKeyboardVisible = useEditorStore(s => s.setKeyboardVisible);
  const keyboardHeight = useEditorStore(s => s.keyboardHeight);
    const setKeyboardHeight = useEditorStore(s => s.setKeyboardHeight);
  const assetPickerVisible = useEditorStore(s => s.assetPickerVisible);
    const setAssetPickerVisible = useEditorStore(s => s.setAssetPickerVisible);
  const assetPickerMode = useEditorStore(s => s.assetPickerMode);
    const setAssetPickerMode = useEditorStore(s => s.setAssetPickerMode);
  const assetQuery = useEditorStore(s => s.assetQuery);
    const setAssetQuery = useEditorStore(s => s.setAssetQuery);
  const assetItems = useEditorStore(s => s.assetItems);
    const setAssetItems = useEditorStore(s => s.setAssetItems);
  const assetLoading = useEditorStore(s => s.assetLoading);
    const setAssetLoading = useEditorStore(s => s.setAssetLoading);
  const lookToastLabel = useEditorStore(s => s.lookToastLabel);
    const setLookToastLabel = useEditorStore(s => s.setLookToastLabel);
  const chromeAnim = useRef(new Animated.Value(1)).current;
  const composerMotion = useRef(new Animated.Value(0)).current;
  const composerFontAnim = useRef(new Animated.Value(DEFAULT_TEXT_SIZE)).current;
  const lookToastAnim = useRef(new Animated.Value(0)).current;

  const selectedText = useMemo(
    () => textLayers.find((layer) => layer.id === selectedTextId) ?? null,
    [selectedTextId, textLayers],
  );

  const selectedVisual = useMemo(
    () => visualLayers.find((layer) => layer.id === selectedVisualId) ?? null,
    [selectedVisualId, visualLayers],
  );

  const effectiveStyle = useMemo(() => {
    if (selectedText) {
      return {
        fontSize: selectedText.fontSize,
        color: selectedText.color,
        align: selectedText.align,
        variant: selectedText.variant,
        fontFamily: selectedText.fontFamily,
        strokeWidth: selectedText.strokeWidth,
        strokeColor: selectedText.strokeColor,
        shadowStrength: selectedText.shadowStrength,
        bgOpacity: selectedText.bgOpacity,
        letterSpacing: selectedText.letterSpacing,
        lineHeightMult: selectedText.lineHeightMult,
        effect: selectedText.effect,
      } as TextStyleState;
    }
    return {
      fontSize: composerFontSize,
      color: composerColor,
      align: composerAlign,
      variant: composerVariant,
      fontFamily: composerFontFamily,
      strokeWidth: composerStrokeWidth,
      strokeColor: composerStrokeColor,
      shadowStrength: composerShadowStrength,
      bgOpacity: composerBgOpacity,
      letterSpacing: composerLetterSpacing,
      lineHeightMult: composerLineHeightMult,
      effect: composerEffect,
    } as TextStyleState;
  }, [composerAlign, composerBgOpacity, composerColor, composerFontFamily, composerFontSize, composerLetterSpacing, composerLineHeightMult, composerShadowStrength, composerStrokeColor, composerStrokeWidth, composerVariant, selectedText]);

  const canvasImageUri = imageUri;

  const handleComposerTextChange = useCallback((value: string) => {
    setComposerText(value.replace(/[\r\n]+/g, ' '));
  }, []);

  const applyComposerColor = useCallback((nextColor: string) => {
    setComposerColor(normalizeComposerTextColor(nextColor, composerBackground));
  }, [composerBackground]);

  const imageHeight = Math.min(height * 0.78, width * 1.42);
  const safeCanvasWidth = canvasSize.width || width - spacing.xl * 2;
  const safeCanvasHeight = canvasSize.height || imageHeight;
  const showChrome = !captureMode && !composerVisible && !keyboardVisible;
  const showActionRail = showChrome;
  const gradePanelVisible = showChrome && activeTab === 'grade';
  const showSelectionDock = showChrome && activeTab !== 'grade' && (selectedText !== null || selectedVisual !== null);
  const lookSwipeEnabled = showChrome && !assetPickerVisible && selectedText === null && selectedVisual === null;
  const showStageSwipeZone = lookSwipeEnabled || gradePanelVisible;
  const canStartSwipe = showStageSwipeZone && textLayers.length === 0 && visualLayers.length === 0;
  const assetColumns = width >= 520 ? 4 : width >= 380 ? 3 : 2;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event: RNKeyboardEvent) => {
      setKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    Animated.timing(chromeAnim, {
      toValue: showChrome ? 1 : 0,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [chromeAnim, showChrome]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setActiveTab('text');
    setSelectedPresetId(PRESETS[0].id);
    setPresetStrength(1);
    setTextLayers([]);
    setVisualLayers([]);
    setSelectedTextId(null);
    setSelectedVisualId(null);
    setWarmth(0);
    setTint(0);
    setFade(0);
    setVignette(0);
    setDarkness(0);
    setLightness(0);
    setComposerVisible(false);
    setComposerTargetId(null);
    setComposerText('');
    setComposerColor(DEFAULT_TEXT_STYLE.color);
    setComposerFontSize(DEFAULT_TEXT_STYLE.fontSize);
    setComposerVariant(DEFAULT_TEXT_STYLE.variant);
    setComposerAlign(DEFAULT_TEXT_STYLE.align);
    setComposerFontFamily(DEFAULT_TEXT_STYLE.fontFamily);
    setComposerStrokeWidth(DEFAULT_TEXT_STYLE.strokeWidth);
    setComposerStrokeColor(DEFAULT_TEXT_STYLE.strokeColor);
    setComposerShadowStrength(DEFAULT_TEXT_STYLE.shadowStrength);
    setComposerBgOpacity(DEFAULT_TEXT_STYLE.bgOpacity);
    setComposerLetterSpacing(DEFAULT_TEXT_STYLE.letterSpacing);
    setComposerLineHeightMult(DEFAULT_TEXT_STYLE.lineHeightMult);
    setComposerEffect(DEFAULT_TEXT_STYLE.effect);
    setComposerTool('font');
    setComposerAnimation('none');
    setComposerBackground('none');
    setKeyboardHeight(0);
    setCaptureMode(false);
    setAssetPickerVisible(false);
    setAssetPickerMode('sticker');
    setAssetQuery('');
    setAssetItems([]);
  }, [imageUri, visible]);

  const syncStageWindowOffset = useCallback(() => {
    requestAnimationFrame(() => {
      const node = canvasRef.current as any;
      if (!node || typeof node.measureInWindow !== 'function') {
        return;
      }
      node.measureInWindow((x: number, y: number) => {
        setStageWindowOffset({ x, y });
      });
    });
  }, []);

  useEffect(() => {
    if (!composerVisible) {
      return;
    }

    let cancelled = false;
    const focusInput = () => {
      if (cancelled) {
        return;
      }
      syncStageWindowOffset();
      requestAnimationFrame(() => {
        if (cancelled) {
          return;
        }
        composerInputRef.current?.focus();
      });
    };

    const interactionTask = InteractionManager.runAfterInteractions(focusInput);
    const timers = [60, 160, 300, 520].map((delay) => setTimeout(focusInput, delay));

    return () => {
      cancelled = true;
      interactionTask.cancel?.();
      timers.forEach(clearTimeout);
    };
  }, [composerVisible, syncStageWindowOffset]);

  useEffect(() => {
    composerMotion.stopAnimation();
    if (!composerVisible || composerAnimation === 'none') {
      composerMotion.setValue(1);
      return;
    }

    composerMotion.setValue(0);
    const oneShot = Animated.timing(composerMotion, {
      toValue: 1,
      duration: composerAnimation === 'typewriter' ? 680 : 520,
      easing: composerAnimation === 'slideUp' || composerAnimation === 'slideDown' ? Easing.out(Easing.cubic) : Easing.inOut(Easing.sin),
      useNativeDriver: false,
    });

    const loop = Animated.loop(Animated.sequence([
      Animated.timing(composerMotion, { toValue: 1, duration: 540, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(composerMotion, { toValue: 0, duration: 540, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));

    const shouldLoop = composerAnimation === 'fadeOut' || composerAnimation === 'glowPulse' || composerAnimation === 'shake';
    const animation = shouldLoop ? loop : oneShot;
    animation.start();

    return () => {
      animation.stop();
    };
  }, [composerAnimation, composerMotion, composerVisible]);

  useEffect(() => {
    if (!composerVisible || composerAnimation !== 'bounce' || !composerText.length) {
      return;
    }
    composerMotion.stopAnimation();
    composerMotion.setValue(0);
    Animated.sequence([
      Animated.timing(composerMotion, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(composerMotion, { toValue: 0, duration: 160, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [composerAnimation, composerMotion, composerText, composerVisible]);

  useEffect(() => {
    if (!assetPickerVisible) {
      return;
    }

    let active = true;
    const timeoutId = setTimeout(async () => {
      setAssetLoading(true);
      try {
        const trimmed = assetQuery.trim();
        const results = trimmed.length
          ? assetPickerMode === 'gif'
            ? await giphyService.searchGifs(trimmed, { limit: 30 })
            : await giphyService.searchStickers(trimmed, { limit: 30 })
          : assetPickerMode === 'gif'
            ? await giphyService.getTrendingGifs({ limit: 24 })
            : await giphyService.getTrendingStickers({ limit: 24 });
        if (active) {
          setAssetItems(results);
        }
      } catch (error) {
        console.error('Failed to load editor assets:', error);
        if (active) {
          setAssetItems([]);
        }
      } finally {
        if (active) {
          setAssetLoading(false);
        }
      }
    }, assetQuery.trim().length ? 260 : 0);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [assetPickerMode, assetPickerVisible, assetQuery]);

  const updateLayer = useCallback((id: string, updates: Partial<TextLayer>) => {
    setTextLayers((prev) => prev.map((layer) => (layer.id === id ? { ...layer, ...updates } : layer)));
  }, []);

  const updateVisualLayer = useCallback((id: string, updates: Partial<VisualLayer>) => {
    setVisualLayers((prev) => prev.map((layer) => (layer.id === id ? { ...layer, ...updates } : layer)));
  }, []);

  const updateCurrentStyle = useCallback((updates: Partial<TextStyleState>) => {
    if (selectedTextId) {
      updateLayer(selectedTextId, updates as Partial<TextLayer>);
      return;
    }

    if (updates.color !== undefined) setComposerColor(updates.color);
    if (updates.fontSize !== undefined) setComposerFontSize(updates.fontSize);
    if (updates.variant !== undefined) setComposerVariant(updates.variant);
    if (updates.align !== undefined) setComposerAlign(updates.align);
    if (updates.fontFamily !== undefined) setComposerFontFamily(updates.fontFamily);
    if (updates.strokeWidth !== undefined) setComposerStrokeWidth(updates.strokeWidth);
    if (updates.strokeColor !== undefined) setComposerStrokeColor(updates.strokeColor);
    if (updates.shadowStrength !== undefined) setComposerShadowStrength(updates.shadowStrength);
    if (updates.bgOpacity !== undefined) setComposerBgOpacity(updates.bgOpacity);
    if (updates.letterSpacing !== undefined) setComposerLetterSpacing(updates.letterSpacing);
    if (updates.lineHeightMult !== undefined) setComposerLineHeightMult(updates.lineHeightMult);
    if (updates.effect !== undefined) setComposerEffect(updates.effect);
  }, [selectedTextId, updateLayer]);

  const selectLayer = useCallback((id: string) => {
    setSelectedVisualId(null);
    setSelectedTextId(id);
    setActiveTab('text');
    setTextLayers((prev) => {
      const index = prev.findIndex((layer) => layer.id === id);
      if (index === -1 || index === prev.length - 1) {
        return prev;
      }
      const next = [...prev];
      const [layer] = next.splice(index, 1);
      next.push(layer);
      return next;
    });
  }, []);

  const selectVisualLayer = useCallback((id: string) => {
    setSelectedTextId(null);
    setSelectedVisualId(id);
    setVisualLayers((prev) => {
      const index = prev.findIndex((layer) => layer.id === id);
      if (index === -1 || index === prev.length - 1) {
        return prev;
      }
      const next = [...prev];
      const [layer] = next.splice(index, 1);
      next.push(layer);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTextId(null);
    setSelectedVisualId(null);
  }, []);

  const triggerLookToast = useCallback((label: string) => {
    setLookToastLabel(label);
    lookToastAnim.stopAnimation();
    lookToastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(lookToastAnim, { toValue: 1, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(720),
      Animated.timing(lookToastAnim, { toValue: 0, duration: 220, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [lookToastAnim]);

  const applyPreset = useCallback((presetId: string, strength = 1) => {
    const preset = PRESETS.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }
    const nextStrength = clamp(strength, 0, 1);
    const grade = buildPresetGrade(preset, nextStrength);
    setSelectedPresetId(preset.id);
    setPresetStrength(nextStrength);
    setWarmth(grade.warmth);
    setTint(grade.tint);
    setFade(grade.fade);
    setVignette(grade.vignette);
    setDarkness(grade.darkness);
    setLightness(grade.lightness);
    triggerLookToast(preset.label);
  }, [triggerLookToast]);

  const cyclePreset = useCallback((direction: 1 | -1) => {
    const currentIndex = PRESETS.findIndex((item) => item.id === selectedPresetId);
    const startIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (startIndex + direction + PRESETS.length) % PRESETS.length;
    applyPreset(PRESETS[nextIndex].id, presetStrength);
  }, [applyPreset, presetStrength, selectedPresetId]);

  const gradeSwipeResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => canStartSwipe,
    onStartShouldSetPanResponderCapture: () => canStartSwipe,
    onMoveShouldSetPanResponder: (_, gestureState) => showStageSwipeZone && Math.abs(gestureState.dx) > 6,
    onMoveShouldSetPanResponderCapture: (_, gestureState) => showStageSwipeZone && Math.abs(gestureState.dx) > 6,
    onPanResponderTerminationRequest: () => true,
    onPanResponderRelease: (_, gestureState) => {
      if (!showStageSwipeZone) {
        return;
      }
      if (gestureState.dx <= -26) {
        cyclePreset(1);
      } else if (gestureState.dx >= 26) {
        cyclePreset(-1);
      }
    },
    onPanResponderTerminate: () => {},
  }), [canStartSwipe, cyclePreset, showStageSwipeZone]);

  const handlePresetStrengthChange = useCallback((value: number) => {
    const nextValue = round2(clamp(value, 0, 1));
    setPresetStrength(nextValue);
    if (selectedPresetId === 'custom') {
      return;
    }
    const preset = PRESETS.find((item) => item.id === selectedPresetId);
    if (!preset) {
      return;
    }
    const grade = buildPresetGrade(preset, nextValue);
    setWarmth(grade.warmth);
    setTint(grade.tint);
    setFade(grade.fade);
    setVignette(grade.vignette);
    setDarkness(grade.darkness);
    setLightness(grade.lightness);
  }, [selectedPresetId]);

  const updateGrade = useCallback((field: 'warmth' | 'tint' | 'fade' | 'vignette' | 'darkness' | 'lightness', value: number) => {
    setSelectedPresetId('custom');
    const nextValue = round2(value);
    if (field === 'warmth') setWarmth(nextValue);
    if (field === 'tint') setTint(nextValue);
    if (field === 'fade') setFade(nextValue);
    if (field === 'vignette') setVignette(nextValue);
    if (field === 'darkness') setDarkness(nextValue);
    if (field === 'lightness') setLightness(nextValue);
  }, []);
  const resetGrade = useCallback(() => {
    setSelectedPresetId(PRESETS[0].id);
    setPresetStrength(1);
    setWarmth(0);
    setTint(0);
    setFade(0);
    setVignette(0);
    setDarkness(0);
    setLightness(0);
  }, []);

  const createVisualLayer = useCallback((config: {
    kind: VisualLayerKind;
    uri: string;
    previewUri?: string;
    aspectRatio?: number;
    title?: string;
  }) => {
    const aspectRatio = clamp(config.aspectRatio ?? 1, 0.35, 4);
    const maxWidthByCanvas = Math.max(110, safeCanvasWidth - 36);
    const maxWidthByHeight = Math.max(110, (safeCanvasHeight - 36) * aspectRatio);
    const hardMaxWidth = Math.min(maxWidthByCanvas, maxWidthByHeight);
    let layerWidth = config.kind === 'image'
      ? clamp(safeCanvasWidth * 0.46, 136, Math.min(hardMaxWidth, 280))
      : clamp(safeCanvasWidth * 0.3, 90, Math.min(hardMaxWidth, 184));

    if (layerWidth > hardMaxWidth) {
      layerWidth = hardMaxWidth;
    }

    let layerHeight = layerWidth / aspectRatio;
    const maxHeight = Math.max(84, safeCanvasHeight - 36);
    if (layerHeight > maxHeight) {
      layerHeight = maxHeight;
      layerWidth = layerHeight * aspectRatio;
    }

    const nextLayer: VisualLayer = {
      id: `visual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      kind: config.kind,
      uri: config.uri,
      previewUri: config.previewUri,
      scale: 1,
      width: layerWidth,
      height: layerHeight,
      x: clamp((safeCanvasWidth - layerWidth) / 2, 18, Math.max(18, safeCanvasWidth - layerWidth - 18)),
      y: clamp((safeCanvasHeight - layerHeight) / 2, 18, Math.max(18, safeCanvasHeight - layerHeight - 18)),
      rotation: 0,
      fit: config.kind === 'image' ? 'cover' : 'contain',
      borderRadius: config.kind === 'image' ? 24 : 0,
      title: config.title,
    };

    setVisualLayers((prev) => [...prev, nextLayer]);
    setSelectedTextId(null);
    setSelectedVisualId(nextLayer.id);
  }, [safeCanvasHeight, safeCanvasWidth]);

  const closeAssetPicker = useCallback(() => {
    setAssetPickerVisible(false);
    setAssetQuery('');
  }, []);

  const openAssetPicker = useCallback((mode: AssetPickerMode) => {
    setActiveTab('sticker');
    setSelectedTextId(null);
    setSelectedVisualId(null);
    setAssetPickerMode(mode);
    setAssetQuery('');
    setAssetPickerVisible(true);
  }, []);

  const handlePickOverlayImage = useCallback(async () => {
    setActiveTab('image');
    setSelectedTextId(null);
    setSelectedVisualId(null);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow gallery access to place overlay images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset: any = result.assets[0];
        createVisualLayer({
          kind: 'image',
          uri: asset.uri,
          aspectRatio: (asset.width || 1) / Math.max(1, asset.height || 1),
          title: asset.fileName || 'Overlay',
        });
      }
    } catch (error) {
      console.error('Failed to pick overlay image:', error);
      Alert.alert('Error', 'Could not add the overlay image.');
    }
  }, [createVisualLayer]);

  const handleSelectAsset = useCallback((item: GiphyGif) => {
    const widthValue = parseInt(item.images.original.width, 10) || 1;
    const heightValue = parseInt(item.images.original.height, 10) || 1;
    const layerKind: VisualLayerKind = assetPickerMode === 'sticker' ? 'sticker' : 'gif';
    createVisualLayer({
      kind: layerKind,
      uri: giphyService.getOptimalGifUrl(item, 'medium'),
      previewUri: giphyService.getPreviewUrl(item),
      aspectRatio: widthValue / Math.max(1, heightValue),
      title: item.title,
    });
    closeAssetPicker();
  }, [assetPickerMode, closeAssetPicker, createVisualLayer]);

  const applyComposerAnimation = useCallback((option: TextAnimationOption) => {
    setComposerAnimation(option);
    setComposerStrokeWidth(0);
    setComposerLetterSpacing(0);
    setComposerShadowStrength(0.3);

    if (option === 'none') return;
    if (option === 'scaleDown') {
      setComposerShadowStrength(0.22);
      return;
    }
    if (option === 'fadeScale' || option === 'fadeIn' || option === 'fadeOut') {
      setComposerShadowStrength(0.24);
      return;
    }
    if (option === 'slideUp' || option === 'slideDown') {
      setComposerLetterSpacing(0.16);
      setComposerShadowStrength(0.26);
      return;
    }
    if (option === 'typewriter') {
      setComposerLetterSpacing(0.6);
      setComposerShadowStrength(0.18);
      return;
    }
    if (option === 'bounce') {
      setComposerShadowStrength(0.46);
      return;
    }
    if (option === 'zoomIn' || option === 'zoomOut' || option === 'blurClear') {
      setComposerShadowStrength(0.34);
      return;
    }
    if (option === 'glowPulse') {
      setComposerShadowStrength(0.88);
      setComposerStrokeWidth(0.45);
      return;
    }
    if (option === 'tilt') {
      setComposerLetterSpacing(0.24);
      return;
    }
    if (option === 'shake') {
      setComposerStrokeWidth(0.24);
    }
  }, []);

  const applyComposerEffect = useCallback((option: TextEffectOption) => {
    setComposerEffect(option);
    if (option === 'default') {
      setComposerVariant('classic');
      setComposerStrokeWidth(0);
      setComposerShadowStrength(0.28);
      setComposerBgOpacity(0);
      setComposerBackground('none');
      return;
    }
    if (option === 'outline') {
      setComposerVariant('outline');
      setComposerStrokeWidth(1.2);
      setComposerStrokeColor('#FFFFFF');
      setComposerShadowStrength(0.22);
      setComposerBgOpacity(0);
      setComposerBackground('none');
      return;
    }
    if (option === 'glass') {
      setComposerVariant('glass');
      setComposerStrokeWidth(0.24);
      setComposerShadowStrength(0.36);
      setComposerBgOpacity(0.18);
      setComposerBackground('none');
      return;
    }
    if (option === 'shadow') {
      setComposerVariant('classic');
      setComposerStrokeWidth(0.3);
      setComposerShadowStrength(0.8);
      setComposerBgOpacity(0);
      setComposerBackground('none');
      return;
    }
    if (option === 'neon') {
      setComposerVariant('classic');
      setComposerStrokeWidth(0.84);
      setComposerStrokeColor('#7DD3FC');
      setComposerShadowStrength(0.86);
      setComposerBgOpacity(0);
      setComposerBackground('none');
      return;
    }
    if (option === 'soft') {
      setComposerVariant('classic');
      setComposerStrokeWidth(0);
      setComposerShadowStrength(0.18);
      setComposerBgOpacity(0);
      setComposerBackground('none');
      return;
    }
    if (option === 'marker') {
      setComposerVariant('classic');
      setComposerStrokeWidth(0);
      setComposerShadowStrength(0.14);
      setComposerBgOpacity(0.82);
      setComposerBackground('black');
      setComposerColor((current) => normalizeComposerTextColor(current, 'black'));
      return;
    }
    if (option === 'cutout') {
      setComposerVariant('filled');
      setComposerStrokeWidth(0.18);
      setComposerStrokeColor('#0F172A');
      setComposerShadowStrength(0.1);
      setComposerBgOpacity(0.96);
      setComposerBackground('white');
      setComposerColor((current) => normalizeComposerTextColor(current, 'white'));
      return;
    }
    if (option === 'paper') {
      setComposerVariant('filled');
      setComposerStrokeWidth(0);
      setComposerShadowStrength(0.2);
      setComposerBgOpacity(0.88);
      setComposerBackground('white');
      setComposerColor((current) => normalizeComposerTextColor(current, 'white'));
      return;
    }
    if (option === 'capsule') {
      setComposerVariant('filled');
      setComposerStrokeWidth(0.18);
      setComposerStrokeColor('#0F172A');
      setComposerShadowStrength(0.22);
      setComposerBgOpacity(1);
      setComposerBackground('white');
      setComposerColor((current) => normalizeComposerTextColor(current, 'white'));
      return;
    }
    if (option === 'halo') {
      setComposerVariant('classic');
      setComposerStrokeWidth(0.3);
      setComposerStrokeColor('#FFFFFF');
      setComposerShadowStrength(0.94);
      setComposerBgOpacity(0);
      setComposerBackground('none');
      return;
    }
    if (option === 'stamp') {
      setComposerVariant('filled');
      setComposerStrokeWidth(0.34);
      setComposerStrokeColor('#0B1220');
      setComposerShadowStrength(0.14);
      setComposerBgOpacity(0.92);
      setComposerBackground('white');
      setComposerColor((current) => normalizeComposerTextColor(current, 'white'));
    }
  }, []);

  const applyComposerBackground = useCallback((option: TextBackgroundOption) => {
    setComposerBackground(option);
    if (option === 'none') {
      setComposerBgOpacity(0);
      return;
    }
    if (option === 'black') {
      setComposerVariant('classic');
      setComposerBgOpacity(1);
      setComposerColor(normalizeComposerTextColor(composerColor, 'black'));
      return;
    }
    if (option === 'white') {
      setComposerVariant('filled');
      setComposerBgOpacity(1);
      setComposerColor(normalizeComposerTextColor(composerColor, 'white'));
    }
  }, [composerColor]);

  const alignIcon = composerAlign === 'left' ? 'text-outline' : composerAlign === 'center' ? 'reorder-three-outline' : 'menu-outline';

  const openComposer = useCallback((layer?: TextLayer | null) => {
    setSelectedVisualId(null);
    setActiveTab('text');
    if (layer) {
      const inferredBackground: TextBackgroundOption = layer.bgOpacity >= 0.74 ? (layer.variant === 'filled' ? 'white' : layer.variant === 'classic' ? 'black' : 'none') : 'none';
      setComposerTargetId(layer.id);
      setComposerText(layer.text);
      setComposerColor(normalizeComposerTextColor(layer.color, inferredBackground));
      setComposerFontSize(layer.fontSize);
      setComposerVariant(layer.variant);
      setComposerAlign(layer.align);
      setComposerFontFamily(layer.fontFamily);
      setComposerStrokeWidth(layer.strokeWidth);
      setComposerStrokeColor(layer.strokeColor);
      setComposerShadowStrength(layer.shadowStrength);
      setComposerBgOpacity(layer.bgOpacity);
      setComposerLetterSpacing(layer.letterSpacing);
      setComposerLineHeightMult(layer.lineHeightMult);
      setComposerEffect(layer.effect);
      setComposerBackground(inferredBackground);
    } else {
      setComposerTargetId(null);
      setComposerText('');
      setComposerColor(effectiveStyle.color);
      setComposerFontSize(effectiveStyle.fontSize);
      setComposerVariant(effectiveStyle.variant);
      setComposerAlign(effectiveStyle.align);
      setComposerFontFamily(effectiveStyle.fontFamily);
      setComposerStrokeWidth(effectiveStyle.strokeWidth);
      setComposerStrokeColor(effectiveStyle.strokeColor);
      setComposerShadowStrength(effectiveStyle.shadowStrength);
      setComposerBgOpacity(effectiveStyle.bgOpacity);
      setComposerLetterSpacing(effectiveStyle.letterSpacing);
      setComposerLineHeightMult(effectiveStyle.lineHeightMult);
      setComposerEffect(effectiveStyle.effect);
    }
    setComposerTool('font');
    setComposerAnimation('none');
    if (!layer) {
      setComposerBackground('none');
    }
    syncStageWindowOffset();
    setComposerVisible(true);
  }, [effectiveStyle, syncStageWindowOffset]);

  const closeComposer = useCallback(() => {
    Keyboard.dismiss();
    setComposerVisible(false);
    setComposerTargetId(null);
  }, []);

  const commitComposer = useCallback(() => {
    const value = composerText.trim();
    if (!value) {
      Alert.alert('Add text', 'Type something before placing it on the image.');
      return;
    }

    const resolvedComposerColor = normalizeComposerTextColor(composerColor, composerBackground);
    const composerInputBandWidth = clamp(safeCanvasWidth * 0.72, 180, Math.max(180, safeCanvasWidth - 56));
    const fittedLayout = fitTextLayout(value, composerFontSize, composerInputBandWidth - 24, composerLineHeightMult);
    const alignedX = clamp((safeCanvasWidth - composerInputBandWidth) / 2, 18, Math.max(18, safeCanvasWidth - composerInputBandWidth - 18));
    const anchoredY = clamp((safeCanvasHeight - fittedLayout.height) / 2, 18, Math.max(18, safeCanvasHeight - fittedLayout.height - 18));

    if (composerTargetId) {
      updateLayer(composerTargetId, {
        text: value,
        x: alignedX,
        y: anchoredY,
        width: composerInputBandWidth,
        height: fittedLayout.height,
        color: resolvedComposerColor,
        fontSize: Math.round(fittedLayout.fontSize),
        variant: composerVariant,
        align: composerAlign,
        fontFamily: composerFontFamily,
        strokeWidth: composerStrokeWidth,
        strokeColor: composerStrokeColor,
        shadowStrength: composerShadowStrength,
        bgOpacity: composerBgOpacity,
        letterSpacing: composerLetterSpacing,
        lineHeightMult: composerLineHeightMult,
        effect: composerEffect,
      });
      setSelectedTextId(composerTargetId);
    } else {
      const nextLayer: TextLayer = {
        id: `text_${Date.now()}`,
        text: value,
        x: alignedX,
        y: anchoredY,
        fontSize: Math.round(fittedLayout.fontSize),
        color: resolvedComposerColor,
        width: composerInputBandWidth,
        height: fittedLayout.height,
        scale: 1,
        rotation: 0,
        align: composerAlign,
        variant: composerVariant,
        fontFamily: composerFontFamily,
        strokeWidth: composerStrokeWidth,
        strokeColor: composerStrokeColor,
        shadowStrength: composerShadowStrength,
        bgOpacity: composerBgOpacity,
        letterSpacing: composerLetterSpacing,
        lineHeightMult: composerLineHeightMult,
        effect: composerEffect,
      };
      setTextLayers((prev) => [...prev, nextLayer]);
      setSelectedTextId(nextLayer.id);
    }

    setActiveTab('text');
    closeComposer();
  }, [
    closeComposer,
    composerAlign,
    composerBackground,
    composerBgOpacity,
    composerColor,
    composerFontFamily,
    composerFontSize,
    composerLetterSpacing,
    composerLineHeightMult,
    composerShadowStrength,
    composerEffect,
    composerStrokeColor,
    composerStrokeWidth,
    composerTargetId,
    composerText,
    composerVariant,
    safeCanvasHeight,
    safeCanvasWidth,
    textLayers,
    updateLayer,
  ]);

  const removeSelectedText = useCallback(() => {
    if (!selectedTextId) {
      return;
    }
    setTextLayers((prev) => prev.filter((layer) => layer.id !== selectedTextId));
    setSelectedTextId(null);
  }, [selectedTextId]);

  const duplicateSelectedText = useCallback(() => {
    if (!selectedText) {
      return;
    }
    const duplicate: TextLayer = {
      ...selectedText,
      id: `text_${Date.now()}`,
      x: clamp(selectedText.x + 22, 18, Math.max(18, canvasSize.width - selectedText.width - 18)),
      y: clamp(selectedText.y + 22, 18, Math.max(18, canvasSize.height - selectedText.height - 18)),
    };
    setTextLayers((prev) => [...prev, duplicate]);
    setSelectedTextId(duplicate.id);
  }, [canvasSize.height, canvasSize.width, selectedText]);

  const cycleSelectedTextScreenAlign = useCallback(() => {
    if (!selectedText) {
      return;
    }
    const nextAlign = cycleAlign(selectedText.align);
    const nextLayout = fitTextLayout(selectedText.text, selectedText.fontSize, safeCanvasWidth, selectedText.lineHeightMult);
    updateLayer(selectedText.id, {
      align: nextAlign,
      fontSize: Math.round(nextLayout.fontSize),
      width: nextLayout.width,
      height: nextLayout.height,
      x: resolveAlignedX(nextAlign, nextLayout.width, safeCanvasWidth),
    });
  }, [safeCanvasWidth, selectedText, updateLayer]);

  const removeSelectedVisual = useCallback(() => {
    if (!selectedVisualId) {
      return;
    }
    setVisualLayers((prev) => prev.filter((layer) => layer.id !== selectedVisualId));
    setSelectedVisualId(null);
  }, [selectedVisualId]);

  const duplicateSelectedVisual = useCallback(() => {
    if (!selectedVisual) {
      return;
    }
    const duplicate: VisualLayer = {
      ...selectedVisual,
      id: `visual_${Date.now()}`,
      x: clamp(selectedVisual.x + 22, 18, Math.max(18, safeCanvasWidth - selectedVisual.width - 18)),
      y: clamp(selectedVisual.y + 22, 18, Math.max(18, safeCanvasHeight - selectedVisual.height - 18)),
    };
    setVisualLayers((prev) => [...prev, duplicate]);
    setSelectedVisualId(duplicate.id);
  }, [safeCanvasHeight, safeCanvasWidth, selectedVisual]);

  const saveEdit = useCallback(async () => {
    if (!canvasRef.current) {
      Alert.alert('Error', 'Editor canvas unavailable. Please try again.');
      return;
    }

    try {
      setSaving(true);
      setCaptureMode(true);
      await waitForNextPaint();
      const uri = await captureRef(canvasRef, {
        format: 'jpg',
        quality: 0.92,
        result: 'tmpfile',
      });
      onSave(uri);
    } catch (error) {
      console.error('Native post editor save failed:', error);
      Alert.alert('Error', 'Failed to save image edit. Please try again.');
    } finally {
      setCaptureMode(false);
      setSaving(false);
    }
  }, [onSave]);

  const composerTargetLayer = composerTargetId ? textLayers.find((layer) => layer.id === composerTargetId) ?? null : null;
  const composerDisplayText = composerText.length ? composerText : 'Type text';
  const composerInputBandWidth = clamp(safeCanvasWidth * 0.72, 180, Math.max(180, safeCanvasWidth - 56));
  const composerFittedLayout = fitTextLayout(composerDisplayText, composerFontSize, composerInputBandWidth - 24, composerLineHeightMult);
  const composerResolvedFontSize = composerFittedLayout.fontSize;
  const composerEstimatedWidth = composerInputBandWidth;
  const composerEstimatedHeight = Math.max(72, composerFittedLayout.height);
  const composerPreviewLeft = clamp((safeCanvasWidth - composerEstimatedWidth) / 2, 22, Math.max(22, safeCanvasWidth - composerEstimatedWidth - 22));
  const composerPreviewTop = clamp((safeCanvasHeight - composerEstimatedHeight) / 2, 22, Math.max(22, safeCanvasHeight - composerEstimatedHeight - 22));
  const composerDockBottom = keyboardVisible ? spacing.xs : spacing.xl;

  const textChromeStyle = {
    opacity: chromeAnim,
    transform: [{
      translateY: chromeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 0],
      }),
    }],
  };

  const lookToastStyle = {
    opacity: lookToastAnim,
    transform: [{
      translateY: lookToastAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [10, 0],
      }),
    }],
  };

  const composerPreviewLayer: TextLayer = {
    id: 'composer_preview',
    text: composerText,
    x: composerPreviewLeft,
    y: composerPreviewTop,
    fontSize: composerFontSize,
    color: composerColor,
    width: composerEstimatedWidth,
    height: composerEstimatedHeight,
    scale: composerTargetLayer?.scale ?? 1,
    rotation: composerTargetLayer?.rotation ?? 0,
    align: composerAlign,
    variant: composerVariant,
    fontFamily: composerFontFamily,
    strokeWidth: composerStrokeWidth,
    strokeColor: composerStrokeColor,
    shadowStrength: composerShadowStrength,
    bgOpacity: composerBgOpacity,
    letterSpacing: composerLetterSpacing,
    lineHeightMult: composerLineHeightMult,
    effect: composerEffect,
  };

  useEffect(() => {
    Animated.timing(composerFontAnim, {
      toValue: composerResolvedFontSize,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [composerFontAnim, composerResolvedFontSize]);

  const composerAnimationStyle = (() => {
    switch (composerAnimation) {
      case 'scaleDown':
        return {
          transform: [{ scale: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [1.24, 1] }) }],
        };
      case 'fadeScale':
        return {
          opacity: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [0.28, 1] }),
          transform: [{ scale: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [1.18, 1] }) }],
        };
      case 'fadeIn':
        return { opacity: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [0.08, 1] }) };
      case 'fadeOut':
        return { opacity: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [1, 0.22] }) };
      case 'slideUp':
        return {
          opacity: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [0.14, 1] }),
          transform: [{ translateY: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        };
      case 'slideDown':
        return {
          opacity: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [0.14, 1] }),
          transform: [{ translateY: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
        };
      case 'typewriter':
        return {
          opacity: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
          transform: [{ translateX: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
        };
      case 'bounce':
        return {
          transform: [{ scale: composerMotion.interpolate({ inputRange: [0, 0.55, 1], outputRange: [1, 1.12, 1] }) }],
        };
      case 'zoomIn':
        return {
          opacity: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
          transform: [{ scale: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }) }],
        };
      case 'zoomOut':
        return {
          opacity: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [0.66, 1] }),
          transform: [{ scale: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [1.3, 1] }) }],
        };
      case 'blurClear':
        return {
          opacity: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
          transform: [{ scale: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [1.08, 1] }) }],
        };
      case 'glowPulse':
        return {
          opacity: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }),
          transform: [{ scale: composerMotion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }],
        };
      case 'tilt':
        return {
          transform: [{ rotate: composerMotion.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '0deg'] }) }],
        };
      case 'shake':
        return {
          transform: [{ translateX: composerMotion.interpolate({ inputRange: [0, 0.2, 0.45, 0.7, 1], outputRange: [0, -7, 7, -4, 0] }) }],
        };
      default:
        return {};
    }
  })();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View pointerEvents={composerVisible ? 'none' : 'auto'} style={[styles.header, composerVisible && styles.headerHidden]}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Post editor</Text>
            </View>

            <View style={styles.headerActions}>
              {headerAccessory}
              <TouchableOpacity style={[styles.saveButton, (saving || composerVisible) && styles.saveButtonDisabled]} onPress={saveEdit} disabled={saving || composerVisible}>
                {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Done</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.editorStage}>
            <View style={styles.stageShell}>
              <View
                ref={canvasRef}
                collapsable={false}
                renderToHardwareTextureAndroid
                needsOffscreenAlphaCompositing
                {...(showStageSwipeZone ? gradeSwipeResponder.panHandlers : {})}
                onLayout={(event) => {
                  const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
                  if (nextWidth !== canvasSize.width || nextHeight !== canvasSize.height) {
                    setCanvasSize({ width: nextWidth, height: nextHeight });
                  }
                  syncStageWindowOffset();
                }}
                style={[styles.canvas, { height: imageHeight }]}
              >
                <Image source={{ uri: canvasImageUri }} style={styles.canvasImage} contentFit="cover" />
                {warmth !== 0 ? <View style={[styles.overlay, { backgroundColor: warmth > 0 ? '#FF9B54' : '#4F7BFF', opacity: Math.abs(warmth) }]} /> : null}
                {tint !== 0 ? <View style={[styles.overlay, { backgroundColor: tint > 0 ? '#F472B6' : '#22C55E', opacity: Math.abs(tint) * 0.45 }]} /> : null}
                {fade > 0 ? <View style={[styles.overlay, { backgroundColor: '#FFFFFF', opacity: fade }]} /> : null}
                {darkness > 0 ? <View style={[styles.overlay, { backgroundColor: '#000000', opacity: darkness }]} /> : null}
                {lightness !== 0 ? <View style={[styles.overlay, { backgroundColor: lightness > 0 ? '#FFFFFF' : '#000000', opacity: Math.abs(lightness) * (lightness > 0 ? 0.45 : 0.35) }]} /> : null}
                {vignette > 0 ? (
                  <>
                    <LinearGradient colors={[`rgba(0,0,0,${round2(vignette * 0.9)})`, 'rgba(0,0,0,0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.vignetteTop} />
                    <LinearGradient colors={['rgba(0,0,0,0)', `rgba(0,0,0,${round2(vignette * 0.95)})`]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.vignetteBottom} />
                    <LinearGradient colors={[`rgba(0,0,0,${round2(vignette * 0.75)})`, 'rgba(0,0,0,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.vignetteLeft} />
                    <LinearGradient colors={['rgba(0,0,0,0)', `rgba(0,0,0,${round2(vignette * 0.75)})`]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.vignetteRight} />
                  </>
                ) : null}
                <View style={[styles.dimLayer, { opacity: captureMode ? 0 : composerVisible || selectedText ? 0.3 : 0 }]} />
                <View pointerEvents={showStageSwipeZone ? 'none' : 'auto'} style={StyleSheet.absoluteFill}>
                  <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={clearSelection} />
                </View>
                {gradePanelVisible ? (
                  <View style={styles.gradeSwipeZone} pointerEvents="none">
                    <View style={styles.stageTopOverlay}>
                      <View style={styles.stagePill}>
                        <Ionicons name="swap-horizontal-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.stagePillText}>{PRESETS.find((item) => item.id === selectedPresetId)?.label || 'Look'}</Text>
                      </View>
                    </View>
                  </View>
                ) : null}
                <Animated.View pointerEvents="none" style={[styles.lookToast, lookToastStyle]}>
                  <Text style={styles.lookToastText}>{lookToastLabel}</Text>
                </Animated.View>

                {visualLayers.map((layer) => (
                  <EditorVisualLayer
                    key={layer.id}
                    layer={layer}
                    selected={selectedVisualId === layer.id}
                    chromeVisible={!captureMode && !composerVisible}
                    canvasWidth={safeCanvasWidth}
                    canvasHeight={safeCanvasHeight}
                    stageWindowOffset={stageWindowOffset}
                    onSelect={selectVisualLayer}
                    onUpdate={updateVisualLayer}
                  />
                ))}

                {textLayers
                  .filter((layer) => !(composerVisible && composerTargetId === layer.id))
                  .map((layer) => (
                    <EditorTextLayer
                      key={layer.id}
                      layer={layer}
                      selected={selectedTextId === layer.id}
                      chromeVisible={!captureMode && !composerVisible}
                      canvasWidth={safeCanvasWidth}
                      canvasHeight={safeCanvasHeight}
                      stageWindowOffset={stageWindowOffset}
                      onSelect={selectLayer}
                      onUpdate={updateLayer}
                    />
                  ))}

                {composerVisible ? (
                  <View
                    style={[
                      styles.composerDraftLayer,
                      {
                        left: composerPreviewLayer.x,
                        top: composerPreviewLayer.y,
                        width: composerPreviewLayer.width,
                        transform: [{ rotate: `${composerPreviewLayer.rotation}deg` }],
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.composerDraftSurface,
                        getVariantContainerStyle(composerPreviewLayer),
                      ]}
                    >
                      <TextBackdrop layer={composerPreviewLayer} />
                      <AnimatedTextInput
                        ref={composerInputRef}
                        autoFocus
                        multiline={false}
                        numberOfLines={1}
                        scrollEnabled={false}
                        blurOnSubmit={false}
                        showSoftInputOnFocus
                        underlineColorAndroid="transparent"
                        selectionColor={getContrastText(composerColor)}
                        placeholder="Type text"
                        placeholderTextColor="rgba(255,255,255,0.52)"
                        maxLength={180}
                        value={composerText}
                        onChangeText={handleComposerTextChange}
                        style={[
                          styles.composerPreviewText,
                          styles.composerPreviewInput,
                          getVariantTextStyle(composerPreviewLayer),
                          composerAnimationStyle,
                          {
                            fontSize: composerFontAnim,
                            letterSpacing: composerLetterSpacing,
                            textAlign: composerAlign,
                            ...getTextShadowStyle(composerPreviewLayer),
                          },
                        ]}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            </View>

            {gradePanelVisible ? (
              <Animated.View pointerEvents="auto" {...gradeSwipeResponder.panHandlers} style={[styles.gradeSheet, textChromeStyle]}>
                <View style={styles.gradeSheetHeader}>
                  <View>
                    <Text style={styles.gradeSheetTitle}>Color grade</Text>
                    <Text style={styles.gradeSheetSubtitle}>Swipe on image for presets. Use sliders for manual grading.</Text>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gradeSheetScroll as any}>
                  <View style={styles.gradePanelContent}>
                    <GradeSlider label="Exposure" value={lightness} minimumValue={-0.2} maximumValue={0.28} onValueChange={(value) => updateGrade('lightness', value)} />
                    <GradeSlider label="Contrast" value={darkness} minimumValue={0} maximumValue={0.34} onValueChange={(value) => updateGrade('darkness', value)} />
                    <GradeSlider label="Temperature" value={warmth} minimumValue={-0.28} maximumValue={0.28} onValueChange={(value) => updateGrade('warmth', value)} />
                    <GradeSlider label="Tint" value={tint} minimumValue={-0.22} maximumValue={0.22} onValueChange={(value) => updateGrade('tint', value)} />
                    <GradeSlider label="Fade" value={fade} minimumValue={0} maximumValue={0.2} onValueChange={(value) => updateGrade('fade', value)} />
                    <GradeSlider label="Vignette" value={vignette} minimumValue={0} maximumValue={0.32} onValueChange={(value) => updateGrade('vignette', value)} />
                  </View>

                  <TouchableOpacity style={styles.resetButton} onPress={resetGrade}>
                    <Ionicons name="refresh" size={16} color="#DDEAFE" />
                    <Text style={styles.resetButtonText}>Reset tone</Text>
                  </TouchableOpacity>
                </ScrollView>
              </Animated.View>
            ) : null}

            {showSelectionDock ? (
              <Animated.View pointerEvents="auto" style={[styles.selectionDock, textChromeStyle]}>
                {selectedText ? (
                  <>
                    <TouchableOpacity style={styles.selectionPrimaryBtn} onPress={() => openComposer(selectedText)}>
                      <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.selectionPrimaryBtnText}>Edit text</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.selectionIconBtn} onPress={cycleSelectedTextScreenAlign}>
                      <Ionicons name={selectedText.align === 'left' ? 'text-outline' : selectedText.align === 'center' ? 'reorder-three-outline' : 'menu-outline'} size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.selectionIconBtn} onPress={duplicateSelectedText}>
                      <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.selectionIconBtn, styles.selectionIconBtnDanger]} onPress={removeSelectedText}>
                      <Ionicons name="trash-outline" size={18} color="#FFB4B4" />
                    </TouchableOpacity>
                  </>
                ) : selectedVisual ? (
                  <>
                    <View style={styles.selectionPillLabel}>
                      <Ionicons name={selectedVisual.kind === 'image' ? 'images-outline' : selectedVisual.kind === 'gif' ? 'film-outline' : 'sparkles-outline'} size={16} color="#FFFFFF" />
                      <Text style={styles.selectionPillText}>{selectedVisual.kind === 'image' ? 'Overlay selected' : selectedVisual.kind === 'gif' ? 'GIF selected' : 'Sticker selected'}</Text>
                    </View>
                    <TouchableOpacity style={styles.selectionIconBtn} onPress={duplicateSelectedVisual}>
                      <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.selectionIconBtn, styles.selectionIconBtnDanger]} onPress={removeSelectedVisual}>
                      <Ionicons name="trash-outline" size={18} color="#FFB4B4" />
                    </TouchableOpacity>
                  </>
                ) : null}
              </Animated.View>
            ) : null}

            <Animated.View pointerEvents={showActionRail ? 'auto' : 'none'} style={[styles.actionRail, textChromeStyle]}>
              <TouchableOpacity style={[styles.actionChip, activeTab === 'text' && styles.actionChipActive]} onPress={() => openComposer(selectedText ?? null)}>
                <View style={[styles.actionChipIconWrap, activeTab === 'text' && styles.actionChipIconWrapActive]}>
                  <Ionicons name="text-outline" size={18} color={activeTab === 'text' ? '#08111F' : '#FFFFFF'} />
                </View>
                <Text style={[styles.actionChipText, activeTab === 'text' && styles.actionChipTextActive]}>Text</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionChip, activeTab === 'image' && styles.actionChipActive]} onPress={handlePickOverlayImage}>
                <View style={[styles.actionChipIconWrap, activeTab === 'image' && styles.actionChipIconWrapActive]}>
                  <Ionicons name="images-outline" size={18} color={activeTab === 'image' ? '#08111F' : '#FFFFFF'} />
                </View>
                <Text style={[styles.actionChipText, activeTab === 'image' && styles.actionChipTextActive]}>Overlay</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionChip, activeTab === 'sticker' && styles.actionChipActive]} onPress={() => openAssetPicker('sticker')}>
                <View style={[styles.actionChipIconWrap, activeTab === 'sticker' && styles.actionChipIconWrapActive]}>
                  <Ionicons name="sparkles-outline" size={18} color={activeTab === 'sticker' ? '#08111F' : '#FFFFFF'} />
                </View>
                <Text style={[styles.actionChipText, activeTab === 'sticker' && styles.actionChipTextActive]}>Sticker</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionChip, activeTab === 'grade' && styles.actionChipActive]} onPress={() => setActiveTab((prev) => (prev === 'grade' ? 'text' : 'grade'))}>
                <View style={[styles.actionChipIconWrap, activeTab === 'grade' && styles.actionChipIconWrapActive]}>
                  <Ionicons name="color-filter-outline" size={18} color={activeTab === 'grade' ? '#08111F' : '#FFFFFF'} />
                </View>
                <Text style={[styles.actionChipText, activeTab === 'grade' && styles.actionChipTextActive]}>Grade</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
          {composerVisible ? (
            <>
              <View style={styles.composerTopRow}>
                <TouchableOpacity style={styles.composerTopBtn} onPress={closeComposer}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.composerTopDone} onPress={commitComposer}>
                  <Text style={styles.composerTopDoneText}>Done</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.composerKeyboardWrap, { bottom: composerDockBottom }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.composerChoiceRail as any}>
                  {composerTool === 'font'
                    ? FONT_OPTIONS.map((font) => {
                        const active = composerFontFamily === font.value;
                        return (
                          <TouchableOpacity key={font.id} style={[styles.composerChoiceChip, active && styles.composerChoiceChipActive]} onPress={() => setComposerFontFamily(font.value)}>
                            <Text style={[styles.composerChoiceText, { fontFamily: font.value }, active && styles.composerChoiceTextActive]}>{font.label}</Text>
                          </TouchableOpacity>
                        );
                      })
                    : null}

                  {composerTool === 'color'
                    ? PREMIUM_TEXT_COLORS.map((color) => (
                        <TouchableOpacity key={color} style={[styles.composerColorChip, { backgroundColor: color }, composerColor === color && styles.composerColorChipActive]} onPress={() => applyComposerColor(color)} />
                      ))
                    : null}

                  {composerTool === 'animation'
                    ? TEXT_ANIMATION_OPTIONS.map((item) => (
                        <TouchableOpacity key={item.id} style={[styles.composerChoiceChip, composerAnimation === item.id && styles.composerChoiceChipActive]} onPress={() => applyComposerAnimation(item.id)}>
                          <Text style={[styles.composerChoiceText, composerAnimation === item.id && styles.composerChoiceTextActive]}>{item.label}</Text>
                        </TouchableOpacity>
                      ))
                    : null}

                  {composerTool === 'effect'
                    ? TEXT_EFFECT_OPTIONS.map((item) => (
                        <TouchableOpacity key={item.id} style={[styles.composerChoiceChip, composerEffect === item.id && styles.composerChoiceChipActive]} onPress={() => applyComposerEffect(item.id)}>
                          <Text style={[styles.composerChoiceText, composerEffect === item.id && styles.composerChoiceTextActive]}>{item.label}</Text>
                        </TouchableOpacity>
                      ))
                    : null}

                  {composerTool === 'background'
                    ? TEXT_BACKGROUND_OPTIONS.map((item) => (
                        <TouchableOpacity key={item.id} style={[styles.composerChoiceChip, composerBackground === item.id && styles.composerChoiceChipActive]} onPress={() => applyComposerBackground(item.id)}>
                          <Text style={[styles.composerChoiceText, composerBackground === item.id && styles.composerChoiceTextActive]}>{item.label}</Text>
                        </TouchableOpacity>
                      ))
                    : null}
                </ScrollView>

                <View style={styles.composerToolBar}>
                  <TouchableOpacity style={[styles.composerToolBtn, composerTool === 'font' && styles.composerToolBtnActive]} onPress={() => setComposerTool('font')}>
                    <Ionicons name="text-outline" size={18} color={composerToolIconColor(composerTool === 'font')} />
                    <Text style={[styles.composerToolLabel, composerTool === 'font' && styles.composerToolLabelActive]}>Font</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.composerToolBtn, composerTool === 'color' && styles.composerToolBtnActive]} onPress={() => setComposerTool('color')}>
                    <Ionicons name="color-palette-outline" size={18} color={composerToolIconColor(composerTool === 'color')} />
                    <Text style={[styles.composerToolLabel, composerTool === 'color' && styles.composerToolLabelActive]}>Color</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.composerToolBtn, composerTool === 'animation' && styles.composerToolBtnActive]} onPress={() => setComposerTool('animation')}>
                    <Ionicons name="pulse-outline" size={18} color={composerToolIconColor(composerTool === 'animation')} />
                    <Text style={[styles.composerToolLabel, composerTool === 'animation' && styles.composerToolLabelActive]}>Motion</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.composerToolBtn, composerTool === 'effect' && styles.composerToolBtnActive]} onPress={() => setComposerTool('effect')}>
                    <Ionicons name="sparkles-outline" size={18} color={composerToolIconColor(composerTool === 'effect')} />
                    <Text style={[styles.composerToolLabel, composerTool === 'effect' && styles.composerToolLabelActive]}>Style</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.composerToolBtn} onPress={() => setComposerAlign(cycleAlign(composerAlign))}>
                    <Ionicons name={alignIcon} size={18} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.composerToolLabel}>Align</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.composerToolBtn, composerTool === 'background' && styles.composerToolBtnActive]} onPress={() => setComposerTool('background')}>
                    <Ionicons name="color-fill-outline" size={18} color={composerToolIconColor(composerTool === 'background')} />
                    <Text style={[styles.composerToolLabel, composerTool === 'background' && styles.composerToolLabelActive]}>BG</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : null}

          <StickerAssetSheet
            visible={assetPickerVisible}
            mode={assetPickerMode}
            query={assetQuery}
            items={assetItems}
            loading={assetLoading}
            columns={assetColumns}
            sheetWidth={width - spacing.lg * 2}
            onModeChange={setAssetPickerMode}
            onQueryChange={setAssetQuery}
            onClose={closeAssetPicker}
            onSelect={handleSelectAsset}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
