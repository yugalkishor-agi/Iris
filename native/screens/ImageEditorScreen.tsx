import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions} from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';

interface ImageEditorScreenProps {
  route: {
    params: {
      imageUri: string;
      onSave: (editedImageUri: string) => void;
    };
  };
}

const FILTERS = [
  { id: 'none', name: 'Original', filter: null },
  { id: 'vintage', name: 'Vintage', filter: 'sepia(0.8) contrast(1.2)' },
  { id: 'bw', name: 'B&W', filter: 'grayscale(1)' },
  { id: 'bright', name: 'Bright', filter: 'brightness(1.3) contrast(1.1)' },
  { id: 'warm', name: 'Warm', filter: 'sepia(0.3) saturate(1.4)' },
  { id: 'cool', name: 'Cool', filter: 'hue-rotate(180deg) saturate(1.2)' },
  { id: 'dramatic', name: 'Drama', filter: 'contrast(1.5) brightness(0.9)' },
  { id: 'soft', name: 'Soft', filter: 'blur(0.5px) brightness(1.1)' },
];

const ADJUSTMENTS = [
  { id: 'brightness', name: 'Brightness', icon: 'sunny-outline', min: 0.5, max: 2, default: 1 },
  { id: 'contrast', name: 'Contrast', icon: 'contrast-outline', min: 0.5, max: 2, default: 1 },
  { id: 'saturation', name: 'Saturation', icon: 'color-palette-outline', min: 0, max: 2, default: 1 },
  { id: 'blur', name: 'Blur', icon: 'radio-button-off-outline', min: 0, max: 5, default: 0 },
];

export default function ImageEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { imageUri, onSave } = (route.params as any) || {};
  
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [adjustments, setAdjustments] = useState({
    brightness: 1,
    contrast: 1,
    saturation: 1,
    blur: 0,
  });
  const [activeTab, setActiveTab] = useState<'filters' | 'adjust' | 'crop'>('filters');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Image transform values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  
  // Screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const imageContainerHeight = screenHeight * 0.6;

  const pinchHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startScale = scale.value;
    },
    onActive: (event, context) => {
      scale.value = context.startScale * (event as any).scale;
    },
    onEnd: () => {
      scale.value = withSpring(Math.max(0.5, Math.min(3, scale.value)));
    },
  });

  const panHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
    },
  });

  const animatedImageStyle = useAnimatedStyle((): any => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  const generateFilterStyle = () => {
    const filter = FILTERS.find(f => f.id === selectedFilter);
    let filterString = filter?.filter || '';
    
    // Add adjustments
    if (adjustments.brightness !== 1) {
      filterString += ` brightness(${adjustments.brightness})`;
    }
    if (adjustments.contrast !== 1) {
      filterString += ` contrast(${adjustments.contrast})`;
    }
    if (adjustments.saturation !== 1) {
      filterString += ` saturate(${adjustments.saturation})`;
    }
    if (adjustments.blur > 0) {
      filterString += ` blur(${adjustments.blur}px)`;
    }
    
    return filterString.trim();
  };

  const handleAdjustmentChange = (id: string, value: number) => {
    setAdjustments(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  const resetImage = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    rotation.value = withSpring(0);
    setSelectedFilter('none');
    setAdjustments({
      brightness: 1,
      contrast: 1,
      saturation: 1,
      blur: 0,
    });
  };

  const rotateImage = () => {
    rotation.value = withSpring(rotation.value + 90);
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsProcessing(true);
    try {
      // In a real implementation, you would:
      // 1. Capture the edited image using react-native-view-shot
      // 2. Apply filters using image processing library
      // 3. Save to device storage
      // 4. Return the new URI
      
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return the original URI for demo purposes
      onSave(imageUri);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving edited image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.sectionTitle}>Filters</Text>
      <View style={styles.filtersGrid}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterItem,
              selectedFilter === filter.id && styles.selectedFilterItem,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <View style={styles.filterPreview}>
              <Image
                source={{ uri: imageUri }}
                style={[
                  styles.filterPreviewImage,
                  ({ filter: filter.filter || 'none' } as any),
                ]}
              />
            </View>
            <Text style={styles.filterName}>{filter.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAdjustments = () => (
    <View style={styles.adjustmentsContainer}>
      <Text style={styles.sectionTitle}>Adjustments</Text>
      {ADJUSTMENTS.map((adjustment) => (
        <View key={adjustment.id} style={styles.adjustmentItem}>
          <View style={styles.adjustmentHeader}>
            <Ionicons name={adjustment.icon as any} size={20} color="#FFFFFF" />
            <Text style={styles.adjustmentName}>{adjustment.name}</Text>
            <Text style={styles.adjustmentValue}>
              {Math.round(adjustments[adjustment.id as keyof typeof adjustments] * 100)}%
            </Text>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  {
                    width: `${
                      ((adjustments[adjustment.id as keyof typeof adjustments] - adjustment.min) /
                        (adjustment.max - adjustment.min)) * 100
                    }%`,
                  },
                ]}
              />
              <TouchableOpacity
                style={[
                  styles.sliderThumb,
                  {
                    left: `${
                      ((adjustments[adjustment.id as keyof typeof adjustments] - adjustment.min) /
                        (adjustment.max - adjustment.min)) * 100
                    }%`,
                  },
                ]}
                onPressIn={() => {
                  // Handle slider interaction
                }}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderCropTools = () => (
    <View style={styles.cropContainer}>
      <Text style={styles.sectionTitle}>Transform</Text>
      <View style={styles.cropTools}>
        <TouchableOpacity style={styles.cropTool} onPress={rotateImage}>
          <Ionicons name="refresh-outline" size={24} color="#FFFFFF" />
          <Text style={styles.cropToolText}>Rotate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cropTool} onPress={resetImage}>
          <Ionicons name="refresh-circle-outline" size={24} color="#FFFFFF" />
          <Text style={styles.cropToolText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Photo</Text>
        <TouchableOpacity
          style={[styles.headerButton, isProcessing && styles.disabledButton]}
          onPress={handleSave}
          disabled={isProcessing}
        >
          <Text style={styles.saveButtonText}>
            {isProcessing ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image Container */}
      <View style={[styles.imageContainer, { height: imageContainerHeight }]}>
        <PinchGestureHandler onGestureEvent={pinchHandler as any}>
          <Animated.View style={styles.imageWrapper}>
            <PanGestureHandler onGestureEvent={panHandler}>
              <Animated.View style={[styles.imageWrapper, animatedImageStyle as any]}>
                <Image
                  source={{ uri: imageUri }}
                  style={[
                    styles.editableImage,
                    ({ filter: generateFilterStyle() } as any),
                  ]}
                  contentFit="contain"
                />
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </PinchGestureHandler>
      </View>

      {/* Tools Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'filters' && styles.activeTab]}
          onPress={() => setActiveTab('filters')}
        >
          <Ionicons
            name="color-filter-outline"
            size={20}
            color={activeTab === 'filters' ? '#007AFF' : '#8E8E93'}
          />
          <Text style={[styles.tabText, activeTab === 'filters' && styles.activeTabText]}>
            Filters
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'adjust' && styles.activeTab]}
          onPress={() => setActiveTab('adjust')}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeTab === 'adjust' ? '#007AFF' : '#8E8E93'}
          />
          <Text style={[styles.tabText, activeTab === 'adjust' && styles.activeTabText]}>
            Adjust
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'crop' && styles.activeTab]}
          onPress={() => setActiveTab('crop')}
        >
          <Ionicons
            name="crop-outline"
            size={20}
            color={activeTab === 'crop' ? '#007AFF' : '#8E8E93'}
          />
          <Text style={[styles.tabText, activeTab === 'crop' && styles.activeTabText]}>
            Transform
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tools Content */}
      <View style={styles.toolsContent}>
        {activeTab === 'filters' && renderFilters()}
        {activeTab === 'adjust' && renderAdjustments()}
        {activeTab === 'crop' && renderCropTools()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333333',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
  },
  imageWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editableImage: {
    width: '90%',
    height: '90%',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  activeTabText: {
    color: '#007AFF',
  },
  toolsContent: {
    backgroundColor: '#1C1C1E',
    maxHeight: 200,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  filtersContainer: {
    paddingVertical: 16,
  },
  filtersGrid: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  filterItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    padding: 8,
    borderRadius: 8,
  },
  selectedFilterItem: {
    backgroundColor: '#007AFF20',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  filterPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
  },
  filterPreviewImage: {
    width: '100%',
    height: '100%',
  },
  filterName: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  adjustmentsContainer: {
    paddingVertical: 16,
  },
  adjustmentItem: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  adjustmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adjustmentName: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  adjustmentValue: {
    fontSize: 14,
    color: '#8E8E93',
  },
  sliderContainer: {
    paddingHorizontal: 4,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginLeft: -8,
  },
  cropContainer: {
    paddingVertical: 16,
  },
  cropTools: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
  },
  cropTool: {
    alignItems: 'center',
    padding: 16,
  },
  cropToolText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
  },
});
