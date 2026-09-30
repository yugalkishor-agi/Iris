import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface AccentColor {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  light: string;
}

export default function AccentColorScreen() {
  const [selectedColor, setSelectedColor] = useState('default');
  const navigation = useNavigation();

  const accentColors: AccentColor[] = [
    {
      id: 'default',
      name: 'Default Blue',
      primary: '#4DD0E1',
      secondary: '#26C6DA',
      light: '#B2EBF2',
    },
    {
      id: 'purple',
      name: 'Purple',
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      light: '#DDD6FE',
    },
    {
      id: 'pink',
      name: 'Pink',
      primary: '#EC4899',
      secondary: '#DB2777',
      light: '#FBCFE8',
    },
    {
      id: 'red',
      name: 'Red',
      primary: '#EF4444',
      secondary: '#DC2626',
      light: '#FECACA',
    },
    {
      id: 'orange',
      name: 'Orange',
      primary: '#F97316',
      secondary: '#EA580C',
      light: '#FED7AA',
    },
    {
      id: 'yellow',
      name: 'Yellow',
      primary: '#F59E0B',
      secondary: '#D97706',
      light: '#FEF3C7',
    },
    {
      id: 'green',
      name: 'Green',
      primary: '#10B981',
      secondary: '#059669',
      light: '#D1FAE5',
    },
    {
      id: 'teal',
      name: 'Teal',
      primary: '#14B8A6',
      secondary: '#0D9488',
      light: '#CCFBF1',
    },
    {
      id: 'indigo',
      name: 'Indigo',
      primary: '#6366F1',
      secondary: '#4F46E5',
      light: '#E0E7FF',
    },
  ];

  useEffect(() => {
    loadAccentColor();
  }, []);

  const loadAccentColor = async () => {
    try {
      const savedColor = await AsyncStorage.getItem('accentColor');
      if (savedColor) {
        setSelectedColor(savedColor);
      }
    } catch (error) {
      console.error('Failed to load accent color:', error);
    }
  };

  const handleColorChange = async (colorId: string) => {
    try {
      setSelectedColor(colorId);
      await AsyncStorage.setItem('accentColor', colorId);
      // In production, this would trigger a global theme update
    } catch (error) {
      console.error('Failed to save accent color:', error);
    }
  };

  const renderColorOption = (color: AccentColor) => {
    const isSelected = selectedColor === color.id;
    
    return (
      <TouchableOpacity
        key={color.id}
        style={[
          styles.colorOption,
          isSelected && { borderColor: color.primary, borderWidth: 3 }
        ]}
        onPress={() => handleColorChange(color.id)}
        activeOpacity={0.8}
      >
        <View style={styles.colorPreview}>
          <View style={[styles.colorCircle, { backgroundColor: color.primary }]} />
          <View style={[styles.colorCircle, { backgroundColor: color.secondary }]} />
          <View style={[styles.colorCircle, { backgroundColor: color.light }]} />
        </View>
        <Text style={styles.colorName}>{color.name}</Text>
        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: color.primary }]}>
            <Ionicons name="checkmark" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const selectedColorData = accentColors.find(c => c.id === selectedColor) || accentColors[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accent Color</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="color-palette" size={24} color={selectedColorData.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Personalize your experience</Text>
            <Text style={styles.infoDescription}>
              Choose an accent color that will be used throughout the app for buttons, links, and highlights.
            </Text>
          </View>
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.mockInterface}>
              <View style={styles.mockHeader}>
                <Text style={styles.mockHeaderTitle}>Iris</Text>
                <TouchableOpacity style={[styles.mockButton, { backgroundColor: selectedColorData.primary }]}>
                  <Text style={styles.mockButtonText}>Follow</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.mockContent}>
                <Text style={styles.mockText}>
                  This is how your selected accent color will look in the app interface.
                </Text>
                <TouchableOpacity style={styles.mockLink}>
                  <Text style={[styles.mockLinkText, { color: selectedColorData.primary }]}>
                    Learn more
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.mockTabs}>
                <View style={[styles.mockTab, styles.mockTabActive, { borderBottomColor: selectedColorData.primary }]}>
                  <Text style={[styles.mockTabText, { color: selectedColorData.primary }]}>Posts</Text>
                </View>
                <View style={styles.mockTab}>
                  <Text style={styles.mockTabText}>Glimpses</Text>
                </View>
                <View style={styles.mockTab}>
                  <Text style={styles.mockTabText}>Tagged</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.colorsGrid}>
          {accentColors.map(renderColorOption)}
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={20} color={colors.text.secondary} />
          <Text style={styles.noteText}>
            Your accent color choice will be saved and applied throughout the app immediately.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  previewSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  previewTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  previewCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  mockInterface: {
    gap: spacing.lg,
  },
  mockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mockHeaderTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  mockButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  mockButtonText: {
    color: 'white',
    fontWeight: typography.fontWeight.semibold as any,
  },
  mockContent: {
    gap: spacing.sm,
  },
  mockText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: 20,
  },
  mockLink: {
    alignSelf: 'flex-start',
  },
  mockLinkText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
  },
  mockTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  mockTab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  mockTabActive: {
    borderBottomWidth: 2,
  },
  mockTabText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.secondary,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  colorOption: {
    width: (width - spacing.lg * 2 - spacing.md * 2) / 3,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorPreview: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    gap: 4,
  },
  colorCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  colorName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  noteText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
