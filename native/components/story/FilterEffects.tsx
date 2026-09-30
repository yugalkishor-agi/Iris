import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

interface FilterEffectsProps {
  visible: boolean;
  onClose: () => void;
  imageUri: string;
  onApplyFilter: (filter: any) => void;
}

interface FilterType {
  id: string;
  name: string;
  icon: string;
  description: string;
  cssFilter?: string;
  color?: string;
}

export function FilterEffects({ visible, onClose, imageUri, onApplyFilter }: FilterEffectsProps) {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [brightness, setBrightness] = useState<number>(0);   // -1..1
  const [contrast, setContrast] = useState<number>(1);       // 0..2
  const [saturation, setSaturation] = useState<number>(1);   // 0..3

  const applyPreset = (id: string) => {
    // Map presets to approximate EQ values
    let vals: { b: number; c: number; s: number } = { b: 0, c: 1, s: 1 };
    switch (id) {
      case 'none':
        vals = { b: 0, c: 1, s: 1 }; break;
      case 'bw':
        vals = { b: 0, c: 1.1, s: 0 }; break;
      case 'dramatic':
        vals = { b: 0.1, c: 1.5, s: 1.3 }; break;
      case 'vintage':
        vals = { b: 0.1, c: 1.2, s: 1.1 }; break;
      case 'cool':
        vals = { b: 0, c: 1.05, s: 1.2 }; break;
      case 'warm':
        vals = { b: 0.1, c: 1.1, s: 1.3 }; break;
      case 'fade':
        vals = { b: 0.2, c: 0.8, s: 0.8 }; break;
      case 'sharp':
        vals = { b: 0.05, c: 1.3, s: 1.2 }; break;
      case 'neon':
        vals = { b: 0.2, c: 1.1, s: 2 }; break;
      case 'retro':
        vals = { b: 0.05, c: 1.2, s: 1.5 }; break;
      case 'sunset':
        vals = { b: 0.15, c: 1.15, s: 1.4 }; break;
      case 'blur':
        // Blur not supported via eq; use mild softening by slight brightness and lower contrast
        vals = { b: 0.1, c: 0.95, s: 1.05 }; break;
      default:
        vals = { b: 0, c: 1, s: 1 }; break;
    }
    setBrightness(vals.b); setContrast(vals.c); setSaturation(vals.s);
    onApplyFilter({ brightness: vals.b, contrast: vals.c, saturation: vals.s });
  };

  const filters: FilterType[] = [
    {
      id: 'none',
      name: 'Original',
      icon: 'image-outline',
      description: 'No filter',
      cssFilter: 'none',
    },
    {
      id: 'vintage',
      name: 'Vintage',
      icon: 'camera-outline',
      description: 'Warm vintage look',
      cssFilter: 'sepia(0.5) contrast(1.2) brightness(1.1)',
      color: '#D4A574',
    },
    {
      id: 'bw',
      name: 'B&W',
      icon: 'contrast-outline',
      description: 'Black and white',
      cssFilter: 'grayscale(1) contrast(1.1)',
      color: '#888888',
    },
    {
      id: 'dramatic',
      name: 'Dramatic',
      icon: 'flash-outline',
      description: 'High contrast',
      cssFilter: 'contrast(1.5) brightness(1.1) saturate(1.3)',
      color: '#FF6B6B',
    },
    {
      id: 'cool',
      name: 'Cool',
      icon: 'snow-outline',
      description: 'Cool blue tones',
      cssFilter: 'hue-rotate(180deg) saturate(1.2)',
      color: '#4ECDC4',
    },
    {
      id: 'warm',
      name: 'Warm',
      icon: 'sunny-outline',
      description: 'Warm orange tones',
      cssFilter: 'hue-rotate(30deg) saturate(1.3) brightness(1.1)',
      color: '#FFB347',
    },
    {
      id: 'fade',
      name: 'Fade',
      icon: 'moon-outline',
      description: 'Faded look',
      cssFilter: 'brightness(1.2) contrast(0.8) saturate(0.8)',
      color: '#C8A2C8',
    },
    {
      id: 'sharp',
      name: 'Sharp',
      icon: 'diamond-outline',
      description: 'Enhanced sharpness',
      cssFilter: 'contrast(1.3) brightness(1.05) saturate(1.2)',
      color: '#32CD32',
    },
    {
      id: 'blur',
      name: 'Blur',
      icon: 'water-outline',
      description: 'Soft blur effect',
      cssFilter: 'blur(1px) brightness(1.1)',
      color: '#87CEEB',
    },
    {
      id: 'neon',
      name: 'Neon',
      icon: 'bulb-outline',
      description: 'Vibrant neon',
      cssFilter: 'saturate(2) brightness(1.2) contrast(1.1)',
      color: '#FF1493',
    },
    {
      id: 'retro',
      name: 'Retro',
      icon: 'tv-outline',
      description: '80s retro vibe',
      cssFilter: 'hue-rotate(270deg) saturate(1.5) contrast(1.2)',
      color: '#DA70D6',
    },
    {
      id: 'sunset',
      name: 'Sunset',
      icon: 'partly-sunny-outline',
      description: 'Golden hour',
      cssFilter: 'hue-rotate(15deg) saturate(1.4) brightness(1.15)',
      color: '#FF8C00',
    },
  ];

  const handleFilterSelect = (filter: FilterType) => {
    setSelectedFilter(filter.id);
    applyPreset(filter.id);
  };

  const renderFilterPreview = (filter: FilterType) => (
    <TouchableOpacity
      key={filter.id}
      style={[
        styles.filterItem,
        selectedFilter === filter.id && styles.selectedFilter,
      ]}
      onPress={() => handleFilterSelect(filter)}
    >
      <View
        style={[styles.filterPreview, { backgroundColor: filter.color || colors.background.secondary }]}
        renderToHardwareTextureAndroid
        needsOffscreenAlphaCompositing
        collapsable={false}
      >
        <Image
          source={{ uri: imageUri }}
          style={[styles.previewImage, { backfaceVisibility: 'hidden' }]}
          contentFit="cover"
          fadeDuration={0}
        />
        <View style={[styles.filterOverlay, { backgroundColor: filter.color || 'transparent' }]} />
        <View style={styles.filterIcon}>
          <Ionicons name={filter.icon as any} size={20} color="#FFFFFF" />
        </View>
      </View>
      <Text style={styles.filterName}>{filter.name}</Text>
      <Text style={styles.filterDescription}>{filter.description}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0} style={{ width: '100%' }}>
        <View style={styles.modal}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity 
              onPress={() => { onApplyFilter({ brightness, contrast, saturation }); onClose(); }} 
              style={[styles.headerButton, styles.doneButton]}
            >
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Preview */}
          <View style={styles.previewContainer} renderToHardwareTextureAndroid needsOffscreenAlphaCompositing collapsable={false}>
            <Image
              source={{ uri: imageUri }}
              style={[styles.mainPreview, { backfaceVisibility: 'hidden' }]}
              contentFit="cover"
              fadeDuration={0}
            />
            {selectedFilter && selectedFilter !== 'none' && (
              <View style={[
                styles.filterEffect,
                { backgroundColor: filters.find(f => f.id === selectedFilter)?.color || 'transparent' }
              ]} />
            )}
          </View>

          {/* Filter Grid */}
          <ScrollView 
            style={styles.filtersContainer} 
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.filtersGrid}>
              {filters.map(renderFilterPreview)}
            </View>
          </ScrollView>

          {/* Numeric controls */}
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={{ color: colors.text.primary, fontWeight: '600' }}>Brightness</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setBrightness(b => Math.max(-1, Math.round((b - 0.1) * 10) / 10))} style={{ padding: 8 }}>
                  <Ionicons name="remove" size={18} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={{ width: 44, textAlign: 'center', color: colors.text.secondary }}>{brightness.toFixed(1)}</Text>
                <TouchableOpacity onPress={() => setBrightness(b => Math.min(1, Math.round((b + 0.1) * 10) / 10))} style={{ padding: 8 }}>
                  <Ionicons name="add" size={18} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={{ color: colors.text.primary, fontWeight: '600' }}>Contrast</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setContrast(c => Math.max(0, Math.round((c - 0.1) * 10) / 10))} style={{ padding: 8 }}>
                  <Ionicons name="remove" size={18} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={{ width: 44, textAlign: 'center', color: colors.text.secondary }}>{contrast.toFixed(1)}</Text>
                <TouchableOpacity onPress={() => setContrast(c => Math.min(2, Math.round((c + 0.1) * 10) / 10))} style={{ padding: 8 }}>
                  <Ionicons name="add" size={18} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
              <Text style={{ color: colors.text.primary, fontWeight: '600' }}>Saturation</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setSaturation(s => Math.max(0, Math.round((s - 0.1) * 10) / 10))} style={{ padding: 8 }}>
                  <Ionicons name="remove" size={18} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={{ width: 44, textAlign: 'center', color: colors.text.secondary }}>{saturation.toFixed(1)}</Text>
                <TouchableOpacity onPress={() => setSaturation(s => Math.min(3, Math.round((s + 0.1) * 10) / 10))} style={{ padding: 8 }}>
                  <Ionicons name="add" size={18} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Filter Info */}
          {selectedFilter && (
            <View style={styles.filterInfo}>
              <View style={styles.filterInfoContent}>
                <Ionicons 
                  name={filters.find(f => f.id === selectedFilter)?.icon as any} 
                  size={24} 
                  color={colors.accent.primary} 
                />
                <View style={styles.filterInfoText}>
                  <Text style={styles.filterInfoName}>
                    {filters.find(f => f.id === selectedFilter)?.name}
                  </Text>
                  <Text style={styles.filterInfoDescription}>
                    {filters.find(f => f.id === selectedFilter)?.description}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: height * 0.85,
    minHeight: height * 0.65,
    alignSelf: 'stretch',
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.medium,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  doneButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  doneText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.semibold,
  },
  previewContainer: {
    height: 200,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  mainPreview: {
    width: '100%',
    height: '100%',
  },
  filterEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  filtersContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  filterItem: {
    width: (width - spacing.lg * 2 - spacing.md * 2) / 3,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  selectedFilter: {
    transform: [{ scale: 1.05 }],
  },
  filterPreview: {
    width: '100%',
    height: 80,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
  filterIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  filterDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  filterInfo: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  filterInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  filterInfoText: {
    flex: 1,
  },
  filterInfoName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  filterInfoDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});
