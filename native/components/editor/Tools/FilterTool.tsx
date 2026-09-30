import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useEditorStore } from '../../../stores/editorStore';
import { FILTER_PRESETS } from '../../../utils/skiaFilters';

interface FilterPreset {
  name: string;
  filters: any;
}

const PRESETS: FilterPreset[] = [
  { name: 'Normal', filters: FILTER_PRESETS.normal },
  { name: 'Vivid', filters: FILTER_PRESETS.vivid },
  { name: 'Dramatic', filters: FILTER_PRESETS.dramatic },
  { name: 'Warm', filters: FILTER_PRESETS.warm },
  { name: 'Cool', filters: FILTER_PRESETS.cool },
  { name: 'Mono', filters: FILTER_PRESETS.mono },
  { name: 'Fade', filters: FILTER_PRESETS.fade },
];

export function FilterTool() {
  const filters = useEditorStore(state => state.filters);
  const setFilter = useEditorStore(state => state.setFilter);
  const resetFilters = useEditorStore(state => state.resetFilters);
  const setActiveTool = useEditorStore(state => state.setActiveTool);

  const applyPreset = (preset: any) => {
    Object.keys(preset).forEach(key => {
      setFilter(key as any, preset[key]);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetFilters}
          >
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTool('none')}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Presets */}
      <View style={styles.section}>
        <Text style={styles.label}>Presets</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.presetsScroll}
        >
          <View style={styles.presets}>
            {PRESETS.map(preset => (
              <TouchableOpacity
                key={preset.name}
                style={styles.presetButton}
                onPress={() => applyPreset(preset.filters)}
              >
                <View style={styles.presetPreview}>
                  <Text style={styles.presetIcon}>🖼️</Text>
                </View>
                <Text style={styles.presetName}>{preset.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Manual Controls */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Brightness */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Brightness</Text>
            <Text style={styles.sliderValue}>
              {Math.round(filters.brightness * 100)}
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={-1}
            maximumValue={1}
            value={filters.brightness}
            onValueChange={value => setFilter('brightness', value)}
            minimumTrackTintColor="#EC4899"
            maximumTrackTintColor="#2A2A2A"
            thumbTintColor="#EC4899"
          />
        </View>

        {/* Contrast */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Contrast</Text>
            <Text style={styles.sliderValue}>
              {Math.round(filters.contrast * 100)}
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={2}
            value={filters.contrast}
            onValueChange={value => setFilter('contrast', value)}
            minimumTrackTintColor="#EC4899"
            maximumTrackTintColor="#2A2A2A"
            thumbTintColor="#EC4899"
          />
        </View>

        {/* Saturation */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Saturation</Text>
            <Text style={styles.sliderValue}>
              {Math.round(filters.saturation * 100)}
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={2}
            value={filters.saturation}
            onValueChange={value => setFilter('saturation', value)}
            minimumTrackTintColor="#EC4899"
            maximumTrackTintColor="#2A2A2A"
            thumbTintColor="#EC4899"
          />
        </View>

        {/* Temperature */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>Temperature</Text>
            <Text style={styles.sliderValue}>
              {Math.round(filters.temperature * 100)}
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={-1}
            maximumValue={1}
            value={filters.temperature}
            onValueChange={value => setFilter('temperature', value)}
            minimumTrackTintColor="#EC4899"
            maximumTrackTintColor="#2A2A2A"
            thumbTintColor="#EC4899"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  resetText: {
    color: '#EC4899',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A0A0',
    marginBottom: 8,
  },
  presetsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  presets: {
    flexDirection: 'row',
    gap: 12,
  },
  presetButton: {
    alignItems: 'center',
    gap: 6,
  },
  presetPreview: {
    width: 70,
    height: 70,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetIcon: {
    fontSize: 32,
  },
  presetName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0A0A0',
  },
  scrollView: {
    maxHeight: 300,
  },
  sliderSection: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EC4899',
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
