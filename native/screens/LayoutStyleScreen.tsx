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

interface LayoutStyle {
  id: string;
  name: string;
  description: string;
  preview: 'grid' | 'list' | 'card' | 'compact';
}

export default function LayoutStyleScreen() {
  const [selectedLayout, setSelectedLayout] = useState('grid');
  const navigation = useNavigation();

  const layoutStyles: LayoutStyle[] = [
    {
      id: 'grid',
      name: 'Grid View',
      description: 'Classic Instagram-style grid layout',
      preview: 'grid',
    },
    {
      id: 'list',
      name: 'List View',
      description: 'Vertical list with larger previews',
      preview: 'list',
    },
    {
      id: 'card',
      name: 'Card View',
      description: 'Cards with detailed information',
      preview: 'card',
    },
    {
      id: 'compact',
      name: 'Compact View',
      description: 'Dense layout for more content',
      preview: 'compact',
    },
  ];

  useEffect(() => {
    loadLayoutStyle();
  }, []);

  const loadLayoutStyle = async () => {
    try {
      const savedLayout = await AsyncStorage.getItem('layoutStyle');
      if (savedLayout) {
        setSelectedLayout(savedLayout);
      }
    } catch (error) {
      console.error('Failed to load layout style:', error);
    }
  };

  const handleLayoutChange = async (layoutId: string) => {
    try {
      setSelectedLayout(layoutId);
      await AsyncStorage.setItem('layoutStyle', layoutId);
      // In production, this would trigger a global layout update
    } catch (error) {
      console.error('Failed to save layout style:', error);
    }
  };

  const renderPreview = (layout: LayoutStyle) => {
    const isSelected = selectedLayout === layout.id;
    
    return (
      <TouchableOpacity
        key={layout.id}
        style={[
          styles.layoutOption,
          isSelected && styles.selectedLayout
        ]}
        onPress={() => handleLayoutChange(layout.id)}
        activeOpacity={0.8}
      >
        <View style={styles.previewContainer}>
          {renderLayoutPreview(layout.preview)}
          {isSelected && (
            <View style={styles.selectedOverlay}>
              <Ionicons name="checkmark-circle" size={24} color={colors.accent.primary} />
            </View>
          )}
        </View>
        
        <Text style={styles.layoutName}>{layout.name}</Text>
        <Text style={styles.layoutDescription}>{layout.description}</Text>
      </TouchableOpacity>
    );
  };

  const renderLayoutPreview = (previewType: LayoutStyle['preview']) => {
    const itemColor = colors.background.tertiary;
    
    switch (previewType) {
      case 'grid':
        return (
          <View style={styles.gridPreview}>
            {Array.from({ length: 9 }).map((_, index) => (
              <View key={index} style={[styles.gridItem, { backgroundColor: itemColor }]} />
            ))}
          </View>
        );
      
      case 'list':
        return (
          <View style={styles.listPreview}>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={styles.listItem}>
                <View style={[styles.listImage, { backgroundColor: itemColor }]} />
                <View style={styles.listContent}>
                  <View style={[styles.listTitle, { backgroundColor: itemColor }]} />
                  <View style={[styles.listSubtitle, { backgroundColor: itemColor }]} />
                </View>
              </View>
            ))}
          </View>
        );
      
      case 'card':
        return (
          <View style={styles.cardPreview}>
            {Array.from({ length: 2 }).map((_, index) => (
              <View key={index} style={[styles.cardItem, { backgroundColor: itemColor }]}>
                <View style={[styles.cardImage, { backgroundColor: colors.background.secondary }]} />
                <View style={styles.cardContent}>
                  <View style={[styles.cardTitle, { backgroundColor: colors.background.secondary }]} />
                  <View style={[styles.cardSubtitle, { backgroundColor: colors.background.secondary }]} />
                </View>
              </View>
            ))}
          </View>
        );
      
      case 'compact':
        return (
          <View style={styles.compactPreview}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={index} style={styles.compactItem}>
                <View style={[styles.compactImage, { backgroundColor: itemColor }]} />
                <View style={[styles.compactText, { backgroundColor: itemColor }]} />
              </View>
            ))}
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Layout Style</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="grid" size={24} color={colors.accent.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Choose your layout</Text>
            <Text style={styles.infoDescription}>
              Select how you want content to be displayed throughout the app. This affects posts, profiles, and explore pages.
            </Text>
          </View>
        </View>

        <View style={styles.currentLayoutSection}>
          <Text style={styles.sectionTitle}>Current Layout</Text>
          <View style={styles.currentLayoutCard}>
            <View style={styles.currentPreview}>
              {renderLayoutPreview(layoutStyles.find(l => l.id === selectedLayout)?.preview || 'grid')}
            </View>
            <View style={styles.currentLayoutInfo}>
              <Text style={styles.currentLayoutName}>
                {layoutStyles.find(l => l.id === selectedLayout)?.name}
              </Text>
              <Text style={styles.currentLayoutDescription}>
                {layoutStyles.find(l => l.id === selectedLayout)?.description}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.layoutsSection}>
          <Text style={styles.sectionTitle}>Available Layouts</Text>
          <View style={styles.layoutsGrid}>
            {layoutStyles.map(renderPreview)}
          </View>
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={20} color={colors.text.secondary} />
          <Text style={styles.noteText}>
            Layout changes will apply immediately throughout the app. You can change this setting anytime.
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
  currentLayoutSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  currentLayoutCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  currentPreview: {
    width: 80,
    height: 80,
  },
  currentLayoutInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  currentLayoutName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  currentLayoutDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  layoutsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  layoutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  layoutOption: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLayout: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primary + '10',
  },
  previewContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
    width: 100,
    height: 100,
  },
  selectedOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 2,
  },
  layoutName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  layoutDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  // Grid Preview
  gridPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    gap: 2,
  },
  gridItem: {
    width: '31%',
    height: '31%',
    borderRadius: 2,
  },
  // List Preview
  listPreview: {
    width: '100%',
    height: '100%',
    gap: 4,
  },
  listItem: {
    flexDirection: 'row',
    flex: 1,
    gap: 6,
  },
  listImage: {
    width: 24,
    height: 24,
    borderRadius: 2,
  },
  listContent: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    height: 8,
    borderRadius: 1,
  },
  listSubtitle: {
    height: 6,
    width: '70%',
    borderRadius: 1,
  },
  // Card Preview
  cardPreview: {
    width: '100%',
    height: '100%',
    gap: 4,
  },
  cardItem: {
    flex: 1,
    borderRadius: 4,
    padding: 4,
  },
  cardImage: {
    height: 20,
    borderRadius: 2,
    marginBottom: 4,
  },
  cardContent: {
    gap: 2,
  },
  cardTitle: {
    height: 6,
    borderRadius: 1,
  },
  cardSubtitle: {
    height: 4,
    width: '60%',
    borderRadius: 1,
  },
  // Compact Preview
  compactPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    gap: 3,
  },
  compactItem: {
    width: '30%',
    height: '45%',
    alignItems: 'center',
    gap: 2,
  },
  compactImage: {
    width: '100%',
    height: '70%',
    borderRadius: 2,
  },
  compactText: {
    width: '80%',
    height: 4,
    borderRadius: 1,
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
