import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  PanResponder,
  Animated} from 'react-native';
// Note: @react-native-community/slider needs to be installed
// For now, we'll create a simple slider replacement
const Slider = ({ style, minimumValue, maximumValue, value, onValueChange, minimumTrackTintColor, maximumTrackTintColor, thumbStyle }: any) => (
  <View style={[{ height: 40, backgroundColor: '#E0E0E0', borderRadius: 20 }, style]}>
    <View style={{ 
      height: '100%', 
      width: `${((value - minimumValue) / (maximumValue - minimumValue)) * 100}%`, 
      backgroundColor: minimumTrackTintColor, 
      borderRadius: 20 
    }} />
  </View>
);
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  exposure: number;
  highlights: number;
  shadows: number;
  temperature: number;
  tint: number;
  vignette: number;
}

interface Filter {
  id: string;
  name: string;
  preview: string;
  adjustments: Partial<ImageAdjustments>;
}

const FILTERS: Filter[] = [
  { id: 'original', name: 'Original', preview: '📷', adjustments: {} },
  { id: 'vivid', name: 'Vivid', preview: '🌈', adjustments: { saturation: 20, contrast: 10 } },
  { id: 'dramatic', name: 'Dramatic', preview: '🎭', adjustments: { contrast: 25, shadows: -15, highlights: -10 } },
  { id: 'mono', name: 'Mono', preview: '⚫', adjustments: { saturation: -100, contrast: 15 } },
  { id: 'vintage', name: 'Vintage', preview: '📸', adjustments: { temperature: 15, vignette: 30, exposure: -5 } },
  { id: 'cool', name: 'Cool', preview: '❄️', adjustments: { temperature: -20, tint: 5 } },
  { id: 'warm', name: 'Warm', preview: '🔥', adjustments: { temperature: 20, tint: -5 } },
  { id: 'fade', name: 'Fade', preview: '🌫️', adjustments: { exposure: 10, highlights: -20, contrast: -10 } },
];

interface AdvancedImageEditorProps {
  imageUri: string;
  onSave: (editedImageUri: string, adjustments: ImageAdjustments) => void;
  onCancel: () => void;
}

export default function AdvancedImageEditor({
  imageUri,
  onSave,
  onCancel,
}: AdvancedImageEditorProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('original');
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    temperature: 0,
    tint: 0,
    vignette: 0,
  });
  const [activeTab, setActiveTab] = useState<'filters' | 'adjust'>('filters');
  const [selectedAdjustment, setSelectedAdjustment] = useState<keyof ImageAdjustments>('brightness');

  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const cropPan = useRef(new Animated.ValueXY()).current;

  const applyFilter = (filter: Filter) => {
    setSelectedFilter(filter.id);
    setAdjustments(prev => ({
      ...prev,
      ...filter.adjustments,
    }));
  };

  const updateAdjustment = (key: keyof ImageAdjustments, value: number) => {
    setAdjustments(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetAdjustments = () => {
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      blur: 0,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      temperature: 0,
      tint: 0,
      vignette: 0,
    });
    setSelectedFilter('original');
  };

  const handleSave = async () => {
    // In a real implementation, you would:
    // 1. Apply the adjustments to the image using a library like react-native-image-filter-kit
    // 2. Save the processed image to a temporary file
    // 3. Return the URI of the processed image
    
    // For now, we'll just return the original URI with adjustments
    onSave(imageUri, adjustments);
  };

  const renderFilterItem = (filter: Filter) => (
    <TouchableOpacity
      key={filter.id}
      style={[
        styles.filterItem,
        selectedFilter === filter.id && styles.selectedFilterItem,
      ]}
      onPress={() => applyFilter(filter)}
    >
      <View style={styles.filterPreview}>
        <Text style={styles.filterEmoji}>{filter.preview}</Text>
      </View>
      <Text style={[
        styles.filterName,
        selectedFilter === filter.id && styles.selectedFilterName,
      ]}>
        {filter.name}
      </Text>
    </TouchableOpacity>
  );

  const renderAdjustmentSlider = (
    key: keyof ImageAdjustments,
    label: string,
    min: number,
    max: number,
    icon: string
  ) => (
    <View style={styles.adjustmentItem}>
      <View style={styles.adjustmentHeader}>
        <View style={styles.adjustmentLabelContainer}>
          <Ionicons name={icon as any} size={20} color="#007AFF" />
          <Text style={styles.adjustmentLabel}>{label}</Text>
        </View>
        <Text style={styles.adjustmentValue}>
          {adjustments[key] > 0 ? '+' : ''}{adjustments[key]}
        </Text>
      </View>
      
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        value={adjustments[key]}
        onValueChange={(value: number) => updateAdjustment(key, Math.round(value))}
        minimumTrackTintColor="#007AFF"
        maximumTrackTintColor="#E0E0E0"
        thumbStyle={styles.sliderThumb}
      />
    </View>
  );

  const renderCropOverlay = () => {
    if (!cropMode) return null;

    return (
      <View style={styles.cropOverlay}>
        <View style={styles.cropGrid}>
          {/* Grid lines */}
          <View style={[styles.gridLine, styles.gridLineVertical, { left: '33.33%' }]} />
          <View style={[styles.gridLine, styles.gridLineVertical, { left: '66.66%' }]} />
          <View style={[styles.gridLine, styles.gridLineHorizontal, { top: '33.33%' }]} />
          <View style={[styles.gridLine, styles.gridLineHorizontal, { top: '66.66%' }]} />
        </View>
        
        {/* Corner handles */}
        <View style={[styles.cropHandle, styles.cropHandleTopLeft]} />
        <View style={[styles.cropHandle, styles.cropHandleTopRight]} />
        <View style={[styles.cropHandle, styles.cropHandleBottomLeft]} />
        <View style={[styles.cropHandle, styles.cropHandleBottomRight]} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Image Preview */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            {
              // Apply visual filters (simplified)
              opacity: 1 + (adjustments.exposure / 100),
            },
          ]}
          contentFit="contain"
        />
        
        {renderCropOverlay()}
      </View>

      {/* Tools Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'filters' && styles.activeTab]}
          onPress={() => setActiveTab('filters')}
        >
          <Ionicons name="color-filter" size={20} color={activeTab === 'filters' ? '#007AFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'filters' && styles.activeTabText]}>
            Filters
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'adjust' && styles.activeTab]}
          onPress={() => setActiveTab('adjust')}
        >
          <Ionicons name="options" size={20} color={activeTab === 'adjust' ? '#007AFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'adjust' && styles.activeTabText]}>
            Adjust
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tools Content */}
      <View style={styles.toolsContainer}>
        {activeTab === 'filters' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer as any}
          >
            {FILTERS.map(renderFilterItem)}
          </ScrollView>
        )}

        {activeTab === 'adjust' && (
          <ScrollView style={styles.adjustmentsContainer}>
            {renderAdjustmentSlider('brightness', 'Brightness', -100, 100, 'sunny')}
            {renderAdjustmentSlider('contrast', 'Contrast', -100, 100, 'contrast')}
            {renderAdjustmentSlider('saturation', 'Saturation', -100, 100, 'color-palette')}
            {renderAdjustmentSlider('exposure', 'Exposure', -100, 100, 'camera')}
            {renderAdjustmentSlider('highlights', 'Highlights', -100, 100, 'flashlight')}
            {renderAdjustmentSlider('shadows', 'Shadows', -100, 100, 'moon')}
            {renderAdjustmentSlider('temperature', 'Temperature', -100, 100, 'thermometer')}
            {renderAdjustmentSlider('blur', 'Blur', 0, 100, 'blur')}
            {renderAdjustmentSlider('vignette', 'Vignette', 0, 100, 'radio-button-off')}
          </ScrollView>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.controlButton} onPress={onCancel}>
          <Ionicons name="close" size={24} color="#666" />
          <Text style={styles.controlButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setCropMode(!cropMode)}
        >
          <Ionicons name="crop" size={24} color={cropMode ? '#007AFF' : '#666'} />
          <Text style={[styles.controlButtonText, cropMode && { color: '#007AFF' }]}>
            Crop
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={resetAdjustments}>
          <Ionicons name="refresh" size={24} color="#666" />
          <Text style={styles.controlButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.saveButton]}
          onPress={handleSave}
        >
          <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          <Text style={[styles.controlButtonText, { color: '#FFFFFF' }]}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: screenWidth,
    height: screenWidth,
    maxHeight: screenHeight * 0.6,
  },
  cropOverlay: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '20%',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cropGrid: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
  },
  gridLineHorizontal: {
    height: 1,
    width: '100%',
  },
  cropHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  cropHandleTopLeft: {
    top: -10,
    left: -10,
  },
  cropHandleTopRight: {
    top: -10,
    right: -10,
  },
  cropHandleBottomLeft: {
    bottom: -10,
    left: -10,
  },
  cropHandleBottomRight: {
    bottom: -10,
    right: -10,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
  },
  toolsContainer: {
    backgroundColor: '#1C1C1E',
    maxHeight: 200,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterItem: {
    alignItems: 'center',
    gap: 8,
  },
  selectedFilterItem: {
    opacity: 1,
  },
  filterPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFilterPreview: {
    borderColor: '#007AFF',
  },
  filterEmoji: {
    fontSize: 24,
  },
  filterName: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  selectedFilterName: {
    color: '#007AFF',
  },
  adjustmentsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  adjustmentItem: {
    marginBottom: 20,
  },
  adjustmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  adjustmentLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustmentLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  adjustmentValue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  slider: {
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#007AFF',
    width: 20,
    height: 20,
  },
  bottomControls: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    gap: 12,
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
  },
  controlButtonText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
});
