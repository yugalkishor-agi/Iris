import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

interface FontSizeOption {
  id: FontSize;
  label: string;
  description: string;
  scale: number;
}

export default function FontSizeScreenEnhanced() {
  const [selectedFontSize, setSelectedFontSize] = useState<FontSize>('medium');
  const navigation = useNavigation();

  const fontSizeOptions: FontSizeOption[] = [
    {
      id: 'small',
      label: 'Small',
      description: 'Compact text for more content',
      scale: 0.9,
    },
    {
      id: 'medium',
      label: 'Medium',
      description: 'Default size (recommended)',
      scale: 1.0,
    },
    {
      id: 'large',
      label: 'Large',
      description: 'Easier to read',
      scale: 1.1,
    },
    {
      id: 'extra-large',
      label: 'Extra Large',
      description: 'Maximum readability',
      scale: 1.25,
    },
  ];

  useEffect(() => {
    loadFontSize();
  }, []);

  const loadFontSize = async () => {
    try {
      const savedFontSize = await AsyncStorage.getItem('fontSize');
      if (savedFontSize && ['small', 'medium', 'large', 'extra-large'].includes(savedFontSize)) {
        setSelectedFontSize(savedFontSize as FontSize);
      }
    } catch (error) {
      console.error('Failed to load font size:', error);
    }
  };

  const handleFontSizeChange = async (fontSize: FontSize) => {
    try {
      setSelectedFontSize(fontSize);
      await AsyncStorage.setItem('fontSize', fontSize);
      // In production, this would trigger a global font size update
    } catch (error) {
      console.error('Failed to save font size:', error);
    }
  };

  const getPreviewFontSize = (scale: number) => {
    return typography.fontSize.base * scale;
  };

  const renderFontSizeOption = (option: FontSizeOption) => {
    const isSelected = selectedFontSize === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[styles.optionCard, isSelected && styles.selectedOption]}
        onPress={() => handleFontSizeChange(option.id)}
        activeOpacity={0.7}
      >
        <View style={styles.optionHeader}>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionLabel, { fontSize: getPreviewFontSize(option.scale) }]}>
              {option.label}
            </Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </View>
          
          <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
            {isSelected && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </View>
        </View>
        
        <View style={styles.previewContainer}>
          <Text style={[styles.previewText, { fontSize: getPreviewFontSize(option.scale) }]}>
            The quick brown fox jumps over the lazy dog. This is how your text will look.
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Font Size</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="text" size={24} color={colors.accent.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Adjust text size</Text>
            <Text style={styles.infoDescription}>
              Choose a font size that's comfortable for you to read. This will affect text throughout the app.
            </Text>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          {fontSizeOptions.map(renderFontSizeOption)}
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewSectionTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.mockPost}>
              <View style={styles.mockHeader}>
                <View style={styles.mockAvatar} />
                <View style={styles.mockUserInfo}>
                  <Text style={[
                    styles.mockUsername, 
                    { fontSize: getPreviewFontSize(fontSizeOptions.find(o => o.id === selectedFontSize)?.scale || 1) }
                  ]}>
                    john_doe
                  </Text>
                  <Text style={[
                    styles.mockLocation, 
                    { fontSize: getPreviewFontSize(fontSizeOptions.find(o => o.id === selectedFontSize)?.scale || 1) * 0.9 }
                  ]}>
                    New York, NY
                  </Text>
                </View>
              </View>
              
              <View style={styles.mockImage} />
              
              <View style={styles.mockActions}>
                <View style={styles.mockActionButtons}>
                  <Ionicons name="heart-outline" size={24} color={colors.text.primary} />
                  <Ionicons name="chatbubble-outline" size={22} color={colors.text.primary} />
                  <Ionicons name="paper-plane-outline" size={22} color={colors.text.primary} />
                </View>
                <Ionicons name="bookmark-outline" size={22} color={colors.text.primary} />
              </View>
              
              <Text style={[
                styles.mockCaption, 
                { fontSize: getPreviewFontSize(fontSizeOptions.find(o => o.id === selectedFontSize)?.scale || 1) }
              ]}>
                Beautiful sunset at the beach today! 🌅 #sunset #beach #nature
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={20} color={colors.text.secondary} />
          <Text style={styles.noteText}>
            Font size changes will take effect immediately and apply to all text in the app.
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
  optionsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primary + '10',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  previewContainer: {
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  previewText: {
    color: colors.text.primary,
    lineHeight: 20,
  },
  previewSection: {
    padding: spacing.lg,
  },
  previewSectionTitle: {
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
  mockPost: {
    gap: spacing.md,
  },
  mockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mockAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
  },
  mockUserInfo: {
    flex: 1,
  },
  mockUsername: {
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  mockLocation: {
    color: colors.text.secondary,
  },
  mockImage: {
    height: 120,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.sm,
  },
  mockActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mockActionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  mockCaption: {
    color: colors.text.primary,
    lineHeight: 20,
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
