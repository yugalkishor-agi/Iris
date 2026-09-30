import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { borderRadius, spacing, typography } from '../../styles/theme';
import { Image } from 'expo-image';

type TextVariant = 'classic' | 'filled' | 'glass' | 'outline';
type TextAlignMode = 'left' | 'center' | 'right';

interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  backgroundColor?: string;
  rotation: number;
  opacity: number;
  width: number;
  height: number;
  align: TextAlignMode;
  variant: TextVariant;
}

interface TextOverlayEditorProps {
  imageUri?: string;
  videoUri?: string;
  onSave: (textLayers: TextLayer[]) => void;
  onCancel: () => void;
}

const TEXT_COLORS = ['#FFFFFF', '#F8FAFC', '#FACC15', '#FB7185', '#60A5FA', '#4ADE80', '#F97316', '#A78BFA', '#F472B6'];
const STYLE_VARIANTS: Array<{ id: TextVariant; label: string }> = [
  { id: 'classic', label: 'Classic' },
  { id: 'filled', label: 'Filled' },
  { id: 'glass', label: 'Glass' },
  { id: 'outline', label: 'Outline' },
];

const DEFAULT_FONT_SIZE = 34;
const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 96;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function estimateTextWidth(text: string, fontSize: number) {
  return Math.max(96, Math.min(320, text.length * fontSize * 0.52));
}

function getContrastText(hexColor: string) {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) {
    return '#0B1222';
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7 ? '#09111F' : '#FFFFFF';
}

function getVariantContainerStyle(layer: TextLayer) {
  switch (layer.variant) {
    case 'filled':
      return {
        backgroundColor: layer.color,
        borderWidth: 0,
      };
    case 'glass':
      return {
        backgroundColor: 'rgba(15, 23, 42, 0.42)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
      };
    case 'outline':
      return {
        backgroundColor: 'rgba(0,0,0,0.12)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.92)',
      };
    default:
      return {
        backgroundColor: 'transparent',
        borderWidth: 0,
      };
  }
}

function getVariantTextStyle(layer: TextLayer) {
  switch (layer.variant) {
    case 'filled':
      return {
        color: getContrastText(layer.color),
      };
    default:
      return {
        color: layer.color,
      };
  }
}

function cycleAlign(align: TextAlignMode): TextAlignMode {
  if (align === 'left') return 'center';
  if (align === 'center') return 'right';
  return 'left';
}

function labelForAlign(align: TextAlignMode) {
  if (align === 'left') return 'Left';
  if (align === 'center') return 'Center';
  return 'Right';
}

function EditorLayer({
  layer,
  isSelected,
  stageSize,
  stageWindowOffset,
  onSelect,
  onUpdate,
}: {
  layer: TextLayer;
  isSelected: boolean;
  stageSize: { width: number; height: number };
  stageWindowOffset: { x: number; y: number };
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TextLayer>) => void;
}) {
  const dragStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ fontSize: layer.fontSize });
  const rotateStartRef = useRef({ startAngle: 0, startRotation: layer.rotation });

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (Math.abs(width - layer.width) > 1 || Math.abs(height - layer.height) > 1) {
        onUpdate(layer.id, {
          width,
          height,
          x: clamp(layer.x, 18, Math.max(18, stageSize.width - width - 18)),
          y: clamp(layer.y, 18, Math.max(18, stageSize.height - height - 18)),
        });
      }
    },
    [layer.height, layer.id, layer.width, layer.x, layer.y, onUpdate, stageSize.height, stageSize.width],
  );

  const dragResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStartRef.current = { x: layer.x, y: layer.y };
          onSelect(layer.id);
        },
        onPanResponderMove: (_, gestureState) => {
          const maxX = Math.max(18, stageSize.width - Math.max(layer.width, 72) - 18);
          const maxY = Math.max(18, stageSize.height - Math.max(layer.height, 44) - 18);
          onUpdate(layer.id, {
            x: clamp(dragStartRef.current.x + gestureState.dx, 18, maxX),
            y: clamp(dragStartRef.current.y + gestureState.dy, 18, maxY),
          });
        },
      }),
    [layer.height, layer.id, layer.width, layer.x, layer.y, onSelect, onUpdate, stageSize.height, stageSize.width],
  );

  const resizeResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          resizeStartRef.current = { fontSize: layer.fontSize };
          onSelect(layer.id);
        },
        onPanResponderMove: (_, gestureState) => {
          const delta = (gestureState.dx + gestureState.dy) * 0.16;
          onUpdate(layer.id, {
            fontSize: Math.round(clamp(resizeStartRef.current.fontSize + delta, MIN_FONT_SIZE, MAX_FONT_SIZE)),
          });
        },
      }),
    [layer.fontSize, layer.id, onSelect, onUpdate],
  );

  const rotateResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (_, gestureState) => {
          const centerX = stageWindowOffset.x + layer.x + layer.width / 2;
          const centerY = stageWindowOffset.y + layer.y + layer.height / 2;
          rotateStartRef.current = {
            startAngle: Math.atan2(gestureState.moveY - centerY, gestureState.moveX - centerX),
            startRotation: layer.rotation,
          };
          onSelect(layer.id);
        },
        onPanResponderMove: (_, gestureState) => {
          const centerX = stageWindowOffset.x + layer.x + layer.width / 2;
          const centerY = stageWindowOffset.y + layer.y + layer.height / 2;
          const nextAngle = Math.atan2(gestureState.moveY - centerY, gestureState.moveX - centerX);
          const delta = ((nextAngle - rotateStartRef.current.startAngle) * 180) / Math.PI;
          onUpdate(layer.id, { rotation: Math.round(rotateStartRef.current.startRotation + delta) });
        },
      }),
    [layer.height, layer.id, layer.rotation, layer.width, layer.x, layer.y, onSelect, onUpdate, stageWindowOffset.x, stageWindowOffset.y],
  );

  return (
    <View
      style={[
        styles.layerWrap,
        {
          left: layer.x,
          top: layer.y,
          transform: [{ rotate: `${layer.rotation}deg` }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        {...dragResponder.panHandlers}
        onLayout={handleLayout}
        style={[
          styles.layerSurface,
          getVariantContainerStyle(layer),
          isSelected && styles.layerSurfaceSelected,
        ]}
      >
        <Text
          style={[
            styles.layerText,
            getVariantTextStyle(layer),
            {
              fontSize: layer.fontSize,
              lineHeight: Math.round(layer.fontSize * 1.08),
              textAlign: layer.align,
              fontFamily: layer.fontFamily,
              opacity: layer.opacity,
            },
          ]}
        >
          {layer.text}
        </Text>
      </View>

      {isSelected ? (
        <>
          <View pointerEvents="none" style={styles.selectionOutline} />
          <View pointerEvents="none" style={[styles.cornerDot, styles.cornerTopLeft]} />
          <View pointerEvents="none" style={[styles.cornerDot, styles.cornerTopRight]} />
          <View pointerEvents="none" style={[styles.cornerDot, styles.cornerBottomLeft]} />
          <View pointerEvents="none" style={[styles.cornerDot, styles.cornerBottomRight]} />
          <View pointerEvents="none" style={styles.rotationStem} />
          <View {...rotateResponder.panHandlers} style={styles.rotationHandle}>
            <Ionicons name="refresh" size={13} color="#09111F" />
          </View>
          <View {...resizeResponder.panHandlers} style={styles.resizeHandle}>
            <Ionicons name="expand-outline" size={13} color="#09111F" />
          </View>
        </>
      ) : null}
    </View>
  );
}

export default function TextOverlayEditor({
  imageUri,
  videoUri,
  onSave,
  onCancel,
}: TextOverlayEditorProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const stageRef = useRef<View>(null);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [composerVisible, setComposerVisible] = useState(false);
  const [composerTargetId, setComposerTargetId] = useState<string | null>(null);
  const [composerText, setComposerText] = useState('');
  const [draftColor, setDraftColor] = useState(TEXT_COLORS[0]);
  const [draftFontSize, setDraftFontSize] = useState(DEFAULT_FONT_SIZE);
  const [draftVariant, setDraftVariant] = useState<TextVariant>('classic');
  const [draftAlign, setDraftAlign] = useState<TextAlignMode>('center');
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [stageWindowOffset, setStageWindowOffset] = useState({ x: 0, y: 0 });

  const selectedLayer = useMemo(
    () => textLayers.find((layer) => layer.id === selectedLayerId) ?? null,
    [selectedLayerId, textLayers],
  );

  const syncStageWindowOffset = useCallback(() => {
    requestAnimationFrame(() => {
      const stageNode = stageRef.current as any;
      if (!stageNode || typeof stageNode.measureInWindow !== 'function') {
        return;
      }
      stageNode.measureInWindow((x: number, y: number) => {
        setStageWindowOffset({ x, y });
      });
    });
  }, []);

  useEffect(() => {
    syncStageWindowOffset();
  }, [screenHeight, screenWidth, syncStageWindowOffset]);

  const bringLayerToFront = useCallback((id: string) => {
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

  const selectLayer = useCallback((id: string) => {
    setSelectedLayerId(id);
    bringLayerToFront(id);
  }, [bringLayerToFront]);

  const updateLayer = useCallback((id: string, updates: Partial<TextLayer>) => {
    setTextLayers((prev) => prev.map((layer) => (layer.id === id ? { ...layer, ...updates } : layer)));
  }, []);

  const openComposer = useCallback((layer?: TextLayer | null) => {
    if (layer) {
      setComposerTargetId(layer.id);
      setComposerText(layer.text);
      setDraftColor(layer.color);
      setDraftFontSize(layer.fontSize);
      setDraftVariant(layer.variant);
      setDraftAlign(layer.align);
      setSelectedLayerId(layer.id);
    } else {
      setComposerTargetId(null);
      setComposerText('');
      setDraftColor(selectedLayer?.color ?? TEXT_COLORS[0]);
      setDraftFontSize(selectedLayer?.fontSize ?? DEFAULT_FONT_SIZE);
      setDraftVariant(selectedLayer?.variant ?? 'classic');
      setDraftAlign(selectedLayer?.align ?? 'center');
    }
    setComposerVisible(true);
  }, [selectedLayer]);

  const closeComposer = useCallback(() => {
    setComposerVisible(false);
    setComposerTargetId(null);
  }, []);

  const commitComposer = useCallback(() => {
    const value = composerText.trim();
    if (!value) {
      return;
    }

    if (composerTargetId) {
      updateLayer(composerTargetId, {
        text: value,
        color: draftColor,
        fontSize: Math.round(draftFontSize),
        align: draftAlign,
        variant: draftVariant,
      });
      setSelectedLayerId(composerTargetId);
    } else {
      const estimatedWidth = estimateTextWidth(value, draftFontSize);
      const nextLayer: TextLayer = {
        id: `${Date.now()}`,
        text: value,
        x: clamp((stageSize.width - estimatedWidth) / 2, 20, Math.max(20, stageSize.width - estimatedWidth - 20)),
        y: clamp(stageSize.height * 0.34, 20, Math.max(20, stageSize.height - draftFontSize * 1.6 - 20)),
        fontSize: Math.round(draftFontSize),
        color: draftColor,
        fontFamily: 'System',
        rotation: 0,
        opacity: 1,
        width: estimatedWidth,
        height: draftFontSize * 1.2,
        align: draftAlign,
        variant: draftVariant,
      };
      setTextLayers((prev) => [...prev, nextLayer]);
      setSelectedLayerId(nextLayer.id);
    }

    closeComposer();
  }, [closeComposer, composerTargetId, composerText, draftAlign, draftColor, draftFontSize, draftVariant, stageSize.height, stageSize.width, updateLayer]);

  const deleteSelectedLayer = useCallback(() => {
    if (!selectedLayerId) {
      return;
    }
    setTextLayers((prev) => prev.filter((layer) => layer.id !== selectedLayerId));
    setSelectedLayerId(null);
  }, [selectedLayerId]);

  const applyColor = useCallback((color: string) => {
    setDraftColor(color);
    if (selectedLayer) {
      updateLayer(selectedLayer.id, { color });
    }
  }, [selectedLayer, updateLayer]);

  const applyVariant = useCallback((variant: TextVariant) => {
    setDraftVariant(variant);
    if (selectedLayer) {
      updateLayer(selectedLayer.id, { variant });
    }
  }, [selectedLayer, updateLayer]);

  const changeFontSize = useCallback((value: number) => {
    const nextValue = Math.round(clamp(value, MIN_FONT_SIZE, MAX_FONT_SIZE));
    setDraftFontSize(nextValue);
    if (selectedLayer) {
      updateLayer(selectedLayer.id, { fontSize: nextValue });
    }
  }, [selectedLayer, updateLayer]);

  const toggleAlignment = useCallback(() => {
    const nextAlign = cycleAlign(selectedLayer?.align ?? draftAlign);
    setDraftAlign(nextAlign);
    if (selectedLayer) {
      updateLayer(selectedLayer.id, { align: nextAlign });
    }
  }, [draftAlign, selectedLayer, updateLayer]);

  const effectiveFontSize = selectedLayer?.fontSize ?? draftFontSize;
  const effectiveAlign = selectedLayer?.align ?? draftAlign;
  const effectiveVariant = selectedLayer?.variant ?? draftVariant;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <View style={styles.header}>
          <TouchableOpacity style={styles.topButton} onPress={onCancel}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerEyebrow}>Text</Text>
            <Text style={styles.headerTitle}>Edit overlay</Text>
          </View>
          <TouchableOpacity style={styles.doneButton} onPress={() => onSave(textLayers)}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>



        <View style={styles.editorStage}>
          <View
            ref={stageRef}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setStageSize({ width, height });
              syncStageWindowOffset();
            }}
            style={styles.mediaStageShell}
          >
            {videoUri ? (
              <Video
                source={{ uri: videoUri }}
                style={styles.mediaStage}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
              />
            ) : null}
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.mediaStage} contentFit="cover" />
            ) : null}
            <View style={[styles.dimLayer, { opacity: composerVisible || selectedLayer ? 0.44 : 0.28 }]} />

            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFill}
              onPress={() => setSelectedLayerId(null)}
            />

            {textLayers.map((layer) => (
              <EditorLayer
                key={layer.id}
                layer={layer}
                isSelected={selectedLayerId === layer.id}
                stageSize={stageSize}
                stageWindowOffset={stageWindowOffset}
                onSelect={selectLayer}
                onUpdate={updateLayer}
              />
            ))}
          </View>

          <View style={styles.contextHintWrap}>
            <Text style={styles.contextHintText}>
              {selectedLayer
                ? 'Drag the text box, use the bottom-right handle to resize, and the top handle to rotate.'
                : 'Add text, then tap the layer to move and control it.'}
            </Text>
          </View>
        </View>

        <View style={styles.sizeRail}>
          <Text style={styles.sizeRailLabel}>Size</Text>
          <View style={styles.sizeRailTrack}>
            <TouchableOpacity style={styles.sizeRailButton} onPress={() => changeFontSize(effectiveFontSize - 2)}>
              <Ionicons name="remove" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.sizeRailValue}>{Math.round(effectiveFontSize)}</Text>
            <TouchableOpacity style={styles.sizeRailButton} onPress={() => changeFontSize(effectiveFontSize + 2)}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSheet}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variantRail as any}>
            {STYLE_VARIANTS.map((variant) => (
              <TouchableOpacity
                key={variant.id}
                style={[styles.variantChip, effectiveVariant === variant.id && styles.variantChipActive]}
                onPress={() => applyVariant(variant.id)}
              >
                <Text style={[styles.variantChipText, effectiveVariant === variant.id && styles.variantChipTextActive]}>{variant.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRail as any}>
            {TEXT_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.colorChip, { backgroundColor: color }, (selectedLayer?.color ?? draftColor) === color && styles.colorChipActive]}
                onPress={() => applyColor(color)}
              />
            ))}
          </ScrollView>

          <View style={styles.toolbarRow}>
            <TouchableOpacity style={styles.toolbarButtonPrimary} onPress={() => openComposer(selectedLayer ?? null)}>
              <Ionicons name={selectedLayer ? 'create-outline' : 'add'} size={16} color="#FFFFFF" />
              <Text style={styles.toolbarButtonPrimaryText}>{selectedLayer ? 'Edit text' : 'Add text'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButtonGhost} onPress={toggleAlignment}>
              <Text style={styles.toolbarButtonGhostText}>{labelForAlign(effectiveAlign)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolbarButtonGhost, !selectedLayer && styles.toolbarButtonDisabled]}
              onPress={deleteSelectedLayer}
              disabled={!selectedLayer}
            >
              <Ionicons name="trash-outline" size={16} color="#FFB4B4" />
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={composerVisible} transparent animationType="fade" onRequestClose={closeComposer}>
          <View style={styles.composerBackdrop}>
            <View style={styles.composerSheet}>
              <View style={styles.composerHeader}>
                <TouchableOpacity style={styles.composerClose} onPress={closeComposer}>
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.composerHeaderTextWrap}>
                  <Text style={styles.composerTitle}>{composerTargetId ? 'Edit text' : 'Add text'}</Text>
                  <Text style={styles.composerSubtitle}>Keep the copy sharp. Clean lines read better on video and photo.</Text>
                </View>
              </View>

              <View style={styles.composerPreview}>
                <View style={[styles.composerPreviewSurface, getVariantContainerStyle({
                  id: 'preview',
                  text: composerText || 'Type something',
                  x: 0,
                  y: 0,
                  fontSize: draftFontSize,
                  color: draftColor,
                  fontFamily: 'System',
                  rotation: 0,
                  opacity: 1,
                  width: 0,
                  height: 0,
                  align: draftAlign,
                  variant: draftVariant,
                } as TextLayer)]}>
                  <Text
                    style={[
                      styles.composerPreviewText,
                      getVariantTextStyle({
                        id: 'preview',
                        text: composerText || 'Type something',
                        x: 0,
                        y: 0,
                        fontSize: draftFontSize,
                        color: draftColor,
                        fontFamily: 'System',
                        rotation: 0,
                        opacity: 1,
                        width: 0,
                        height: 0,
                        align: draftAlign,
                        variant: draftVariant,
                      } as TextLayer),
                      {
                        fontSize: draftFontSize,
                        lineHeight: Math.round(draftFontSize * 1.08),
                        textAlign: draftAlign,
                      },
                    ]}
                  >
                    {composerText || 'Type something'}
                  </Text>
                </View>
              </View>

              <TextInput
                autoFocus
                multiline
                maxLength={140}
                placeholder="Write text for your media"
                placeholderTextColor="rgba(255,255,255,0.34)"
                value={composerText}
                onChangeText={setComposerText}
                style={styles.composerInput}
              />

              <View style={styles.composerFooter}>
                <TouchableOpacity style={styles.toolbarButtonGhost} onPress={() => setDraftAlign(cycleAlign(draftAlign))}>
                  <Text style={styles.toolbarButtonGhostText}>{labelForAlign(draftAlign)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolbarButtonPrimary} onPress={commitComposer}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.toolbarButtonPrimaryText}>{composerTargetId ? 'Update' : 'Place text'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTextWrap: {
    alignItems: 'center',
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
  doneButton: {
    minWidth: 76,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: spacing.md,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold as any,
  },
  editorStage: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  mediaStageShell: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#0B1222',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  mediaStage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  dimLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  contextHintWrap: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.lg,
    alignItems: 'center',
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
  layerWrap: {
    position: 'absolute',
  },
  layerSurface: {
    minWidth: 56,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerSurfaceSelected: {
    backgroundColor: 'rgba(9, 17, 31, 0.18)',
  },
  layerText: {
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.58)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
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
  cornerTopLeft: {
    top: -11,
    left: -11,
  },
  cornerTopRight: {
    top: -11,
    right: -11,
  },
  cornerBottomLeft: {
    bottom: -11,
    left: -11,
  },
  cornerBottomRight: {
    bottom: -11,
    right: -11,
  },
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
    left: spacing.lg,
    top: 140,
    alignItems: 'center',
    gap: spacing.sm,
  },
  sizeRailLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sizeRailTrack: {
    borderRadius: 24,
    backgroundColor: 'rgba(8,12,22,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  sizeRailButton: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sizeRailValue: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold as any,
    minWidth: 28,
    textAlign: 'center',
  },
  bottomSheet: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    backgroundColor: '#070C16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
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
    borderColor: 'rgba(255,255,255,0.18)',
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
  composerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,16,0.84)',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  composerSheet: {
    borderRadius: 30,
    backgroundColor: '#0A1120',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.lg,
    gap: spacing.md,
  },
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  composerClose: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  composerHeaderTextWrap: {
    flex: 1,
  },
  composerTitle: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold as any,
  },
  composerSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.56)',
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  composerPreview: {
    borderRadius: 24,
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111A2D',
    padding: spacing.lg,
  },
  composerPreviewSurface: {
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  composerPreviewText: {
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.58)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  composerInput: {
    minHeight: 110,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    textAlignVertical: 'top',
    fontSize: typography.fontSize.base,
  },
  composerFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

