import FastImage from 'react-native-fast-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import { giphyService } from '../../services/giphy.service';
import type { GiphyGif } from '../../services/giphy.service';
import { borderRadius, spacing, typography } from '../../styles/theme';
import * as H from './NativePostImageEditor.helpers';
export function NativePostImageEditor({ visible, imageUri, onClose, onSave, headerAccessory }: NativePostImageEditorProps) {
  const { width, height } = useWindowDimensions();
  const canvasRef = useRef<View>(null);
  const composerInputRef = useRef<TextInput>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>('text');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(H.PRESETS[0].id);
  const [presetStrength, setPresetStrength] = useState(1);
  const [textLayers, setH.TextLayers] = useState<H.TextLayer[]>([]);
  const [visualLayers, setH.VisualLayers] = useState<H.VisualLayer[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedVisualId, setSelectedVisualId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [stageWindowOffset, setStageWindowOffset] = useState({ x: 0, y: 0 });
  const [warmth, setWarmth] = useState(0);
  const [tint, setTint] = useState(0);
  const [fade, setFade] = useState(0);
  const [vignette, setVignette] = useState(0);
  const [darkness, setDarkness] = useState(0);
  const [lightness, setLightness] = useState(0);
  const [saving, setSaving] = useState(false);
  const [captureMode, setCaptureMode] = useState(false);
  const [composerVisible, setComposerVisible] = useState(false);
  const [composerTargetId, setComposerTargetId] = useState<string | null>(null);
  const [composerText, setComposerText] = useState('');
  const [composerColor, setComposerColor] = useState(H.DEFAULT_TEXT_STYLE.color);
  const [composerFontSize, setComposerFontSize] = useState(H.DEFAULT_TEXT_STYLE.fontSize);
  const [composerVariant, setComposerVariant] = useState<TextVariant>(H.DEFAULT_TEXT_STYLE.variant);
  const [composerAlign, setComposerAlign] = useState<TextAlignMode>(H.DEFAULT_TEXT_STYLE.align);
  const [composerFontFamily, setComposerFontFamily] = useState(H.DEFAULT_TEXT_STYLE.fontFamily);
  const [composerStrokeWidth, setComposerStrokeWidth] = useState(H.DEFAULT_TEXT_STYLE.strokeWidth);
  const [composerStrokeColor, setComposerStrokeColor] = useState(H.DEFAULT_TEXT_STYLE.strokeColor);
  const [composerShadowStrength, setComposerShadowStrength] = useState(H.DEFAULT_TEXT_STYLE.shadowStrength);
  const [composerBgOpacity, setComposerBgOpacity] = useState(H.DEFAULT_TEXT_STYLE.bgOpacity);
  const [composerLetterSpacing, setComposerLetterSpacing] = useState(H.DEFAULT_TEXT_STYLE.letterSpacing);
  const [composerLineHeightMult, setComposerLineHeightMult] = useState(H.DEFAULT_TEXT_STYLE.lineHeightMult);
  const [composerTool, setComposerTool] = useState<TextComposerTool>('font');
  const [composerAnimation, setComposerAnimation] = useState<TextAnimationOption>('none');
  const [composerEffect, setComposerEffect] = useState<TextEffectOption>('default');
  const [composerBackground, setComposerBackground] = useState<TextBackgroundOption>('none');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [assetPickerVisible, setAssetPickerVisible] = useState(false);
  const [assetPickerMode, setAssetPickerMode] = useState<AssetPickerMode>('sticker');
  const [assetQuery, setAssetQuery] = useState('');
  const [assetItems, setAssetItems] = useState<GiphyGif[]>([]);
  const [assetLoading, setAssetLoading] = useState(false);
  const [lookToastLabel, setLookToastLabel] = useState(H.PRESETS[0].label);
  const chromeAnim = useRef(new Animated.Value(1)).current;
  const composerMotion = useRef(new Animated.Value(0)).current;
  const composerFontAnim = useRef(new Animated.Value(H.DEFAULT_TEXT_SIZE)).current;
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
      } as H.TextStyleState;
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
    } as H.TextStyleState;
  }, [composerAlign, composerBgOpacity, composerColor, composerFontFamily, composerFontSize, composerLetterSpacing, composerLineHeightMult, composerShadowStrength, composerStrokeColor, composerStrokeWidth, composerVariant, selectedText]);

  const canvasImageUri = imageUri;

  const handleComposerTextChange = useCallback((value: string) => {
    setComposerText(value.replace(/[\r\n]+/g, ' '));
  }, []);

  const applyComposerColor = useCallback((nextColor: string) => {
    setComposerColor(H.normalizeComposerTextColor(nextColor, composerBackground));
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
    const showSub = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
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
    setSelectedPresetId(H.PRESETS[0].id);
    setPresetStrength(1);
    setH.TextLayers([]);
    setH.VisualLayers([]);
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
    setComposerColor(H.DEFAULT_TEXT_STYLE.color);
    setComposerFontSize(H.DEFAULT_TEXT_STYLE.fontSize);
    setComposerVariant(H.DEFAULT_TEXT_STYLE.variant);
    setComposerAlign(H.DEFAULT_TEXT_STYLE.align);
    setComposerFontFamily(H.DEFAULT_TEXT_STYLE.fontFamily);
    setComposerStrokeWidth(H.DEFAULT_TEXT_STYLE.strokeWidth);
    setComposerStrokeColor(H.DEFAULT_TEXT_STYLE.strokeColor);
    setComposerShadowStrength(H.DEFAULT_TEXT_STYLE.shadowStrength);
    setComposerBgOpacity(H.DEFAULT_TEXT_STYLE.bgOpacity);
    setComposerLetterSpacing(H.DEFAULT_TEXT_STYLE.letterSpacing);
    setComposerLineHeightMult(H.DEFAULT_TEXT_STYLE.lineHeightMult);
    setComposerEffect(H.DEFAULT_TEXT_STYLE.effect);
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

  const updateLayer = useCallback((id: string, updates: Partial<H.TextLayer>) => {
    setH.TextLayers((prev) => prev.map((layer) => (layer.id === id ? { ...layer, ...updates } : layer)));
  }, []);

  const updateH.VisualLayer = useCallback((id: string, updates: Partial<H.VisualLayer>) => {
    setH.VisualLayers((prev) => prev.map((layer) => (layer.id === id ? { ...layer, ...updates } : layer)));
  }, []);

  const updateCurrentStyle = useCallback((updates: Partial<H.TextStyleState>) => {
    if (selectedTextId) {
      updateLayer(selectedTextId, updates as Partial<H.TextLayer>);
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
    setH.TextLayers((prev) => {
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

  const selectH.VisualLayer = useCallback((id: string) => {
    setSelectedTextId(null);
    setSelectedVisualId(id);
    setH.VisualLayers((prev) => {
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
    const preset = H.PRESETS.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }
    const nextStrength = H.clamp(strength, 0, 1);
    const grade = H.buildPresetGrade(preset, nextStrength);
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
    const currentIndex = H.PRESETS.findIndex((item) => item.id === selectedPresetId);
    const startIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (startIndex + direction + H.PRESETS.length) % H.PRESETS.length;
    applyPreset(H.PRESETS[nextIndex].id, presetStrength);
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
    const nextValue = H.round2(H.clamp(value, 0, 1));
    setPresetStrength(nextValue);
    if (selectedPresetId === 'custom') {
      return;
    }
    const preset = H.PRESETS.find((item) => item.id === selectedPresetId);
    if (!preset) {
      return;
    }
    const grade = H.buildPresetGrade(preset, nextValue);
    setWarmth(grade.warmth);
    setTint(grade.tint);
    setFade(grade.fade);
    setVignette(grade.vignette);
    setDarkness(grade.darkness);
    setLightness(grade.lightness);
  }, [selectedPresetId]);

  const updateGrade = useCallback((field: 'warmth' | 'tint' | 'fade' | 'vignette' | 'darkness' | 'lightness', value: number) => {
    setSelectedPresetId('custom');
    const nextValue = H.round2(value);
    if (field === 'warmth') setWarmth(nextValue);
    if (field === 'tint') setTint(nextValue);
    if (field === 'fade') setFade(nextValue);
    if (field === 'vignette') setVignette(nextValue);
    if (field === 'darkness') setDarkness(nextValue);
    if (field === 'lightness') setLightness(nextValue);
  }, []);
  const resetGrade = useCallback(() => {
    setSelectedPresetId(H.PRESETS[0].id);
    setPresetStrength(1);
    setWarmth(0);
    setTint(0);
    setFade(0);
    setVignette(0);
    setDarkness(0);
    setLightness(0);
  }, []);

  const createH.VisualLayer = useCallback((config: {
    kind: H.VisualLayerKind;
    uri: string;
    previewUri?: string;
    aspectRatio?: number;
    title?: string;
  }) => {
    const aspectRatio = H.clamp(config.aspectRatio ?? 1, 0.35, 4);
    const maxWidthByCanvas = Math.max(110, safeCanvasWidth - 36);
    const maxWidthByHeight = Math.max(110, (safeCanvasHeight - 36) * aspectRatio);
    const hardMaxWidth = Math.min(maxWidthByCanvas, maxWidthByHeight);
    let layerWidth = config.kind === 'image'
      ? H.clamp(safeCanvasWidth * 0.46, 136, Math.min(hardMaxWidth, 280))
      : H.clamp(safeCanvasWidth * 0.3, 90, Math.min(hardMaxWidth, 184));

    if (layerWidth > hardMaxWidth) {
      layerWidth = hardMaxWidth;
    }

    let layerHeight = layerWidth / aspectRatio;
    const maxHeight = Math.max(84, safeCanvasHeight - 36);
    if (layerHeight > maxHeight) {
      layerHeight = maxHeight;
      layerWidth = layerHeight * aspectRatio;
    }

    const nextLayer: H.VisualLayer = {
      id: `visual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      kind: config.kind,
      uri: config.uri,
      previewUri: config.previewUri,
      width: layerWidth,
      height: layerHeight,
      x: H.clamp((safeCanvasWidth - layerWidth) / 2, 18, Math.max(18, safeCanvasWidth - layerWidth - 18)),
      y: H.clamp((safeCanvasHeight - layerHeight) / 2, 18, Math.max(18, safeCanvasHeight - layerHeight - 18)),
      rotation: 0,
      fit: config.kind === 'image' ? 'cover' : 'contain',
      borderRadius: config.kind === 'image' ? 24 : 0,
      title: config.title,
    };

    setH.VisualLayers((prev) => [...prev, nextLayer]);
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
        createH.VisualLayer({
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
  }, [createH.VisualLayer]);

  const handleSelectAsset = useCallback((item: GiphyGif) => {
    const widthValue = parseInt(item.images.original.width, 10) || 1;
    const heightValue = parseInt(item.images.original.height, 10) || 1;
    createH.VisualLayer({
      kind: assetPickerMode,
      uri: giphyService.getOptimalGifUrl(item, 'medium'),
      previewUri: giphyService.getPreviewUrl(item),
      aspectRatio: widthValue / Math.max(1, heightValue),
      title: item.title,
    });
    closeAssetPicker();
  }, [assetPickerMode, closeAssetPicker, createH.VisualLayer]);

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
      setComposerColor((current) => H.normalizeComposerTextColor(current, 'black'));
      return;
    }
    if (option === 'cutout') {
      setComposerVariant('filled');
      setComposerStrokeWidth(0.18);
      setComposerStrokeColor('#0F172A');
      setComposerShadowStrength(0.1);
      setComposerBgOpacity(0.96);
      setComposerBackground('white');
      setComposerColor((current) => H.normalizeComposerTextColor(current, 'white'));
      return;
    }
    if (option === 'paper') {
      setComposerVariant('filled');
      setComposerStrokeWidth(0);
      setComposerShadowStrength(0.2);
      setComposerBgOpacity(0.88);
      setComposerBackground('white');
      setComposerColor((current) => H.normalizeComposerTextColor(current, 'white'));
      return;
    }
    if (option === 'capsule') {
      setComposerVariant('filled');
      setComposerStrokeWidth(0.18);
      setComposerStrokeColor('#0F172A');
      setComposerShadowStrength(0.22);
      setComposerBgOpacity(1);
      setComposerBackground('white');
      setComposerColor((current) => H.normalizeComposerTextColor(current, 'white'));
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
      setComposerColor((current) => H.normalizeComposerTextColor(current, 'white'));
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
      setComposerColor(H.normalizeComposerTextColor(composerColor, 'black'));
      return;
    }
    if (option === 'white') {
      setComposerVariant('filled');
      setComposerBgOpacity(1);
      setComposerColor(H.normalizeComposerTextColor(composerColor, 'white'));
    }
  }, [composerColor]);

  const alignIcon = composerAlign === 'left' ? 'text-outline' : composerAlign === 'center' ? 'reorder-three-outline' : 'menu-outline';
  const composerToolIconColor = (active: boolean) => (active ? '#08111F' : 'rgba(255,255,255,0.9)');

  const openComposer = useCallback((layer?: H.TextLayer | null) => {
    setSelectedVisualId(null);
    setActiveTab('text');
    if (layer) {
      const inferredBackground: TextBackgroundOption = layer.bgOpacity >= 0.74 ? (layer.variant === 'filled' ? 'white' : layer.variant === 'classic' ? 'black' : 'none') : 'none';
      setComposerTargetId(layer.id);
      setComposerText(layer.text);
      setComposerColor(H.normalizeComposerTextColor(layer.color, inferredBackground));
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

    const resolvedComposerColor = H.normalizeComposerTextColor(composerColor, composerBackground);
    const composerInputBandWidth = H.clamp(safeCanvasWidth * 0.72, 180, Math.max(180, safeCanvasWidth - 56));
    const fittedLayout = fitTextLayout(value, composerFontSize, composerInputBandWidth - 24, composerLineHeightMult);
    const alignedX = H.clamp((safeCanvasWidth - composerInputBandWidth) / 2, 18, Math.max(18, safeCanvasWidth - composerInputBandWidth - 18));
    const anchoredY = H.clamp((safeCanvasHeight - fittedLayout.height) / 2, 18, Math.max(18, safeCanvasHeight - fittedLayout.height - 18));

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
      const nextLayer: H.TextLayer = {
        id: `text_${Date.now()}`,
        text: value,
        x: alignedX,
        y: anchoredY,
        fontSize: Math.round(fittedLayout.fontSize),
        color: resolvedComposerColor,
        width: composerInputBandWidth,
        height: fittedLayout.height,
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
      setH.TextLayers((prev) => [...prev, nextLayer]);
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
    setH.TextLayers((prev) => prev.filter((layer) => layer.id !== selectedTextId));
    setSelectedTextId(null);
  }, [selectedTextId]);

  const duplicateSelectedText = useCallback(() => {
    if (!selectedText) {
      return;
    }
    const duplicate: H.TextLayer = {
      ...selectedText,
      id: `text_${Date.now()}`,
      x: H.clamp(selectedText.x + 22, 18, Math.max(18, canvasSize.width - selectedText.width - 18)),
      y: H.clamp(selectedText.y + 22, 18, Math.max(18, canvasSize.height - selectedText.height - 18)),
    };
    setH.TextLayers((prev) => [...prev, duplicate]);
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
    setH.VisualLayers((prev) => prev.filter((layer) => layer.id !== selectedVisualId));
    setSelectedVisualId(null);
  }, [selectedVisualId]);

  const duplicateSelectedVisual = useCallback(() => {
    if (!selectedVisual) {
      return;
    }
    const duplicate: H.VisualLayer = {
      ...selectedVisual,
      id: `visual_${Date.now()}`,
      x: H.clamp(selectedVisual.x + 22, 18, Math.max(18, safeCanvasWidth - selectedVisual.width - 18)),
      y: H.clamp(selectedVisual.y + 22, 18, Math.max(18, safeCanvasHeight - selectedVisual.height - 18)),
    };
    setH.VisualLayers((prev) => [...prev, duplicate]);
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
  const composerInputBandWidth = H.clamp(safeCanvasWidth * 0.72, 180, Math.max(180, safeCanvasWidth - 56));
  const composerFittedLayout = fitTextLayout(composerDisplayText, composerFontSize, composerInputBandWidth - 24, composerLineHeightMult);
  const composerResolvedFontSize = composerFittedLayout.fontSize;
  const composerEstimatedWidth = composerInputBandWidth;
  const composerEstimatedHeight = Math.max(72, composerFittedLayout.height);
  const composerPreviewLeft = H.clamp((safeCanvasWidth - composerEstimatedWidth) / 2, 22, Math.max(22, safeCanvasWidth - composerEstimatedWidth - 22));
  const composerPreviewTop = H.clamp((safeCanvasHeight - composerEstimatedHeight) / 2, 22, Math.max(22, safeCanvasHeight - composerEstimatedHeight - 22));
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

  const composerPreviewLayer: H.TextLayer = {
    id: 'composer_preview',
    text: composerText,
    x: composerPreviewLeft,
    y: composerPreviewTop,
    fontSize: composerFontSize,
    color: composerColor,
    width: composerEstimatedWidth,
    height: composerEstimatedHeight,
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
                <FastImage source={{ uri: canvasImageUri }} style={styles.canvasImage} resizeMode="cover" />
                {warmth !== 0 ? <View style={[styles.overlay, { backgroundColor: warmth > 0 ? '#FF9B54' : '#4F7BFF', opacity: Math.abs(warmth) }]} /> : null}
                {tint !== 0 ? <View style={[styles.overlay, { backgroundColor: tint > 0 ? '#F472B6' : '#22C55E', opacity: Math.abs(tint) * 0.45 }]} /> : null}
                {fade > 0 ? <View style={[styles.overlay, { backgroundColor: '#FFFFFF', opacity: fade }]} /> : null}
                {darkness > 0 ? <View style={[styles.overlay, { backgroundColor: '#000000', opacity: darkness }]} /> : null}
                {lightness !== 0 ? <View style={[styles.overlay, { backgroundColor: lightness > 0 ? '#FFFFFF' : '#000000', opacity: Math.abs(lightness) * (lightness > 0 ? 0.45 : 0.35) }]} /> : null}
                {vignette > 0 ? (
                  <>
                    <LinearGradient colors={[`rgba(0,0,0,${H.round2(vignette * 0.9)})`, 'rgba(0,0,0,0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.vignetteTop} />
                    <LinearGradient colors={['rgba(0,0,0,0)', `rgba(0,0,0,${H.round2(vignette * 0.95)})`]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.vignetteBottom} />
                    <LinearGradient colors={[`rgba(0,0,0,${H.round2(vignette * 0.75)})`, 'rgba(0,0,0,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.vignetteLeft} />
                    <LinearGradient colors={['rgba(0,0,0,0)', `rgba(0,0,0,${H.round2(vignette * 0.75)})`]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.vignetteRight} />
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
                        <Text style={styles.stagePillText}>{H.PRESETS.find((item) => item.id === selectedPresetId)?.label || 'Look'}</Text>
                      </View>
                    </View>
                  </View>
                ) : null}
                <Animated.View pointerEvents="none" style={[styles.lookToast, lookToastStyle]}>
                  <Text style={styles.lookToastText}>{lookToastLabel}</Text>
                </Animated.View>

                {visualLayers.map((layer) => (
                  <EditorH.VisualLayer
                    key={layer.id}
                    layer={layer}
                    selected={selectedVisualId === layer.id}
                    chromeVisible={!captureMode && !composerVisible}
                    canvasWidth={safeCanvasWidth}
                    canvasHeight={safeCanvasHeight}
                    stageWindowOffset={stageWindowOffset}
                    onSelect={selectH.VisualLayer}
                    onUpdate={updateH.VisualLayer}
                  />
                ))}

                {textLayers
                  .filter((layer) => !(composerVisible && composerTargetId === layer.id))
                  .map((layer) => (
                    <EditorH.TextLayer
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

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gradeSheetScroll}>
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.composerChoiceRail}>
                  {composerTool === 'font'
                    ? H.FONT_OPTIONS.map((font) => {
                        const active = composerFontFamily === font.value;
                        return (
                          <TouchableOpacity key={font.id} style={[styles.composerChoiceChip, active && styles.composerChoiceChipActive]} onPress={() => setComposerFontFamily(font.value)}>
                            <Text style={[styles.composerChoiceText, { fontFamily: font.value }, active && styles.composerChoiceTextActive]}>{font.label}</Text>
                          </TouchableOpacity>
                        );
                      })
                    : null}

                  {composerTool === 'color'
                    ? H.PREMIUM_TEXT_COLORS.map((color) => (
                        <TouchableOpacity key={color} style={[styles.composerColorChip, { backgroundColor: color }, composerColor === color && styles.composerColorChipActive]} onPress={() => applyComposerColor(color)} />
                      ))
                    : null}

                  {composerTool === 'animation'
                    ? H.TEXT_ANIMATION_OPTIONS.map((item) => (
                        <TouchableOpacity key={item.id} style={[styles.composerChoiceChip, composerAnimation === item.id && styles.composerChoiceChipActive]} onPress={() => applyComposerAnimation(item.id)}>
                          <Text style={[styles.composerChoiceText, composerAnimation === item.id && styles.composerChoiceTextActive]}>{item.label}</Text>
                        </TouchableOpacity>
                      ))
                    : null}

                  {composerTool === 'effect'
                    ? H.TEXT_EFFECT_OPTIONS.map((item) => (
                        <TouchableOpacity key={item.id} style={[styles.composerChoiceChip, composerEffect === item.id && styles.composerChoiceChipActive]} onPress={() => applyComposerEffect(item.id)}>
                          <Text style={[styles.composerChoiceText, composerEffect === item.id && styles.composerChoiceTextActive]}>{item.label}</Text>
                        </TouchableOpacity>
                      ))
                    : null}

                  {composerTool === 'background'
                    ? H.TEXT_BACKGROUND_OPTIONS.map((item) => (
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

function TextMiniSlider({
  label,
  value,
  minimum,
  maximum,
  step,
  onChange,
}: {
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.textMiniSlider}>
      <View style={styles.textMiniSliderHead}>
        <Text style={styles.textMiniSliderLabel}>{label}</Text>
        <Text style={styles.textMiniSliderValue}>{H.round2(value)}</Text>
      </View>
      <Slider
        value={value}
        minimumValue={minimum}
        maximumValue={maximum}
        step={step}
        minimumTrackTintColor="#E2E8F0"
        maximumTrackTintColor="rgba(255,255,255,0.2)"
        thumbTintColor="#FFFFFF"
        onValueChange={onChange}
      />
    </View>
  );
}

function GradeSlider({ label, value, minimumValue, maximumValue, onValueChange }: { label: string; value: number; minimumValue: number; maximumValue: number; onValueChange: (value: number) => void }) {
  return (
    <View style={styles.gradeRow}>
      <View style={styles.inspectorHeaderRow}>
        <Text style={styles.inspectorLabel}>{label}</Text>
        <Text style={styles.inspectorValue}>{value.toFixed(2)}</Text>
      </View>
      <Slider value={value} minimumValue={minimumValue} maximumValue={maximumValue} minimumTrackTintColor="#60A5FA" maximumTrackTintColor="rgba(255,255,255,0.12)" thumbTintColor="#FFFFFF" onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#04070F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    zIndex: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerHidden: {
    opacity: 0,
  },
  headerEyebrow: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as any,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
  },
  headerSubtitle: {
    color: 'rgba(221,234,254,0.74)',
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  saveButton: {
    minWidth: 78,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold as any,
  },
  editorStage: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 92,
  },
  stageShell: {
    flex: 1,
    borderRadius: 34,
    backgroundColor: 'rgba(7,12,22,0.46)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 6,
  },
  canvas: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#0E162A',
  },
  canvasImage: {
    width: '100%',
    height: '100%',
  },
  lookToast: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: 78,
    alignItems: 'center',
    zIndex: 16,
  },
  lookToastText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(6,10,20,0.42)',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '28%',
  },
  vignetteBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
  },
  vignetteLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '24%',
  },
  vignetteRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '24%',
  },
  dimLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  gradeSwipeZone: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
  },
  stageTopOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(5, 10, 20, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stagePillText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as any,
  },
  layerWrap: {
    position: 'absolute',
  },
  layerSurface: {
    minWidth: 56,
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  textBackdropWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
  },
  textBackdropSwash: {
    position: 'absolute',
    borderWidth: 0,
  },
  textBackdropSwashMain: {
    top: -2,
    borderWidth: 1,
    left: -6,
    right: -4,
    bottom: -1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 32,
    transform: [{ rotate: '-1.5deg' }],
  },
  textBackdropSwashAccent: {
    top: 6,
    bottom: 6,
    left: 8,
    right: 14,
    borderRadius: 22,
    opacity: 0.52,
    transform: [{ rotate: '1.4deg' }],
  },
  textBackdropSwashTail: {
    top: 4,
    borderWidth: 1,
    bottom: 4,
    left: -10,
    width: 42,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 18,
    opacity: 0.94,
    transform: [{ rotate: '-4deg' }],
  },
  layerSurfaceSelected: {
    backgroundColor: 'rgba(9, 17, 31, 0.18)',
  },
  layerText: {
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.52)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 14,
  },
  layerStrokeText: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    bottom: 8,
    fontWeight: '900',
  },
  selectionOutline: {
    position: 'absolute',
    top: -7,
    left: -7,
    right: -7,
    bottom: -7,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.92)',
  },
  cornerDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
  },
  cornerTopLeft: { top: -11, left: -11 },
  cornerTopRight: { top: -11, right: -11 },
  cornerBottomLeft: { bottom: -11, left: -11 },
  cornerBottomRight: { bottom: -11, right: -11 },
  rotationStem: {
    position: 'absolute',
    top: -28,
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  rotationHandle: {
    position: 'absolute',
    top: -42,
    left: '50%',
    marginLeft: -13,
    width: 26,
    height: 26,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resizeHandle: {
    position: 'absolute',
    right: -18,
    bottom: -18,
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeRail: {
    position: 'absolute',
    left: spacing.md,
    top: 174,
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 5,
  },
  sizeRailLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sizeRailTrack: {
    width: 40,
    height: 164,
    borderRadius: 24,
    backgroundColor: 'rgba(6,10,20,0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sizeRailSlider: {
    width: 160,
    height: 40,
    transform: [{ rotate: '-90deg' }],
  },
  sizeRailValue: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold as any,
    minWidth: 28,
    textAlign: 'center',
  },
  contextHintWrap: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: 86,
    alignItems: 'center',
  },

  floatingModeRail: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    zIndex: 8,
  },
  floatingModeRailTop: {
    top: spacing.md,
  },
  floatingModeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(7,12,22,0.54)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  floatingModeChipActive: {
    backgroundColor: 'rgba(37,99,235,0.32)',
    borderColor: 'rgba(96,165,250,0.42)',
  },
  floatingModeChipText: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  floatingModeChipTextActive: {
    color: '#FFFFFF',
  },
  contextHintText: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(5,10,20,0.58)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  bottomSheet: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: 'rgba(8,14,26,0.88)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '46%',
  },
  bottomSheetFloating: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.lg,
    marginHorizontal: 0,
    marginBottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
  },
  textVariantOverlay: {
    position: 'absolute',
    left: 72,
    right: spacing.lg,
    top: 86,
    gap: spacing.sm,
    backgroundColor: 'rgba(6,10,20,0.24)',
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textVariantRail: {
    gap: spacing.sm,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  textVariantChip: {
    minWidth: 96,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: 'rgba(10,16,32,0.38)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  textVariantChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  textVariantChipText: {
    color: '#FFFFFF',
  },
  textVariantChipTextActive: {
    color: '#09111F',
  },
  textActionDock: {
    position: 'absolute',
    left: 72,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.sm,
    backgroundColor: 'rgba(7,12,22,0.3)',
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textColorRail: {
    gap: spacing.sm,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  textColorChip: {
    width: 32,
    height: 32,
  },
  textToolbarRow: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
  },
  textToolbarPrimary: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  textToolbarGhost: {
    width: 52,
    minWidth: 52,
    paddingHorizontal: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  textToolbarGhostActive: {
    backgroundColor: 'rgba(59,130,246,0.34)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.7)',
  },
  textFontRail: {
    gap: spacing.sm,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  textFontChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  textFontChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  textFontChipText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as any,
  },
  textFontChipTextActive: {
    color: '#09111F',
  },
  textProPanel: {
    marginTop: spacing.xs,
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    maxHeight: 230,
  },
  textMiniSlider: {
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  textMiniSliderHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  textMiniSliderLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as any,
  },
  textMiniSliderValue: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: typography.fontSize.xs,
  },
  modeRail: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  modeChipActive: {
    backgroundColor: 'rgba(37,99,235,0.22)',
    borderColor: 'rgba(96,165,250,0.26)',
  },
  modeChipText: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  modeChipTextActive: {
    color: '#FFFFFF',
  },
  variantRail: {
    gap: spacing.sm,
  },
  variantChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  variantChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  variantChipText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  variantChipTextActive: {
    color: '#09111F',
  },
  colorRail: {
    gap: spacing.sm,
  },
  colorChip: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  colorChipActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.06 }],
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toolbarButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: borderRadius.full,
    backgroundColor: '#2563EB',
  },
  toolbarButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold as any,
  },
  toolbarButtonGhost: {
    minWidth: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  toolbarButtonGhostText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  toolbarButtonDisabled: {
    opacity: 0.4,
  },
  presetRail: {
    gap: spacing.md,
  },
  presetCard: {
    width: 148,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: spacing.md,
  },
  presetCardActive: {
    backgroundColor: 'rgba(37,99,235,0.16)',
    borderColor: 'rgba(96,165,250,0.28)',
  },
  presetSwatch: {
    height: 72,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  presetSwatchBlend: {
    flex: 1,
    opacity: 0.72,
  },
  presetCardTitle: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold as any,
  },
  presetCardMeta: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.54)',
    fontSize: typography.fontSize.xs,
  },
  presetStrengthWrap: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  gradePanelContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  gradeRow: {
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  inspectorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  inspectorLabel: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  inspectorValue: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as any,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  resetButtonText: {
    color: '#DDEAFE',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  composerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,16,0.18)',
  },
  composerCanvasTapArea: {
    ...StyleSheet.absoluteFillObject,
  },
  composerTopRow: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composerTopBtn: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,15,28,0.54)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  composerTopDone: {
    minWidth: 90,
    height: 42,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: '#2563EB',
  },
  composerTopDoneText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold as any,
  },
  composerDraftLayer: {
    position: 'absolute',
    zIndex: 2,
  },
  composerDraftSurface: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  composerDraftOutline: {
    position: 'absolute',
    top: -7,
    left: -7,
    right: -7,
    bottom: -7,
    borderRadius: 18,
    borderWidth: 1.1,
    borderColor: 'rgba(255,255,255,0.78)',
  },
  composerPreviewSurfaceSunset: {
    backgroundColor: 'rgba(248,113,113,0.34)',
    borderColor: 'rgba(254,215,170,0.52)',
    borderWidth: 1,
  },
  composerPreviewText: {
    width: '100%',
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.52)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 14,
  },
  composerPreviewInput: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    margin: 0,
    minHeight: 52,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  composerPreviewPlaceholder: {
    color: 'rgba(255,255,255,0.52)',
  },
  composerKeyboardWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 4,
    gap: spacing.sm,
  },
  composerChoiceRail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minHeight: 60,
  },
  composerChoiceChip: {
    minWidth: 88,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,15,28,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  composerChoiceChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  composerChoiceText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  composerChoiceTextActive: {
    color: '#0B1220',
  },
  composerColorChip: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  composerColorChipActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.3 }],
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  composerToolBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: spacing.xs,
    backgroundColor: 'rgba(8,15,28,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 22,
    paddingHorizontal: spacing.xs,
    paddingVertical: 9,
  },
  composerToolBtn: {
    flex: 1,
    minWidth: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 2,
    paddingHorizontal: 2,
  },
  composerToolBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.92)',
  },
  composerToolText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold as any,
  },
  composerToolTextActive: {
    color: '#08111F',
  },
  composerToolLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold as any,
    letterSpacing: 0.2,
  },
  composerToolLabelActive: {
    color: '#08111F',
  },
  composerInput: {
    minHeight: 86,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlignVertical: 'top',
    fontSize: typography.fontSize.base,
  },
  composerFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  visualLayerWrap: {
    position: 'absolute',
  },
  visualLayerSurface: {
    width: '100%',
    height: '100%',
  },
  visualLayerSurfaceSelected: {
    transform: [{ scale: 1 }],
  },
  visualLayerShadow: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  visualLayerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  gradeSheet: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: 112,
    maxHeight: '48%',
    borderRadius: 28,
    backgroundColor: 'rgba(8,14,26,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    zIndex: 6,
  },
  gradeSheetHeader: {
    marginBottom: spacing.md,
  },
  gradeSheetTitle: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold as any,
  },
  gradeSheetSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.56)',
    fontSize: typography.fontSize.xs,
  },
  gradeSheetScroll: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  selectionDock: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 7,
  },
  selectionPrimaryBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(8,15,28,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  selectionPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  selectionPillLabel: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(8,15,28,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  selectionPillText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  selectionIconBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,15,28,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  selectionIconBtnDanger: {
    borderColor: 'rgba(255,180,180,0.22)',
  },
  actionRail: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    backgroundColor: 'rgba(8,15,28,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 8,
  },
  actionChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  actionChipActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  actionChipIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  actionChipIconWrapActive: {
    backgroundColor: '#FFFFFF',
  },
  actionChipText: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as any,
  },
  actionChipTextActive: {
    color: '#FFFFFF',
  },
  assetPickerBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2,6,16,0.42)',
  },
  assetPickerSheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#08111F',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  assetPickerHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginBottom: spacing.md,
  },
  assetPickerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  assetPickerTitleWrap: {
    flex: 1,
  },
  assetPickerTitle: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
  },
  assetPickerSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.55)',
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  assetPickerClose: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  assetModeRail: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  assetModeChip: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  assetModeChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  assetModeChipText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  assetModeChipTextActive: {
    color: '#08111F',
  },
  assetSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.md,
  },
  assetSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
  },
  assetGridContent: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  assetGridRow: {
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  assetTile: {
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  assetTileImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  assetTileBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(8,15,28,0.72)',
  },
  assetTileBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.fontWeight.bold as any,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  assetLoadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  assetEmptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  assetEmptyText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
});



















































































