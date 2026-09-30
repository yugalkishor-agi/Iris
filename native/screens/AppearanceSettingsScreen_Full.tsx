import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AppearanceSettingsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('dark');
  const [accentColor, setAccentColor] = useState('#3b82f6');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      const savedAccent = await AsyncStorage.getItem('accentColor');
      if (savedTheme) setTheme(savedTheme as any);
      if (savedAccent) setAccentColor(savedAccent);
    } catch (error) {
      console.error('Failed to load appearance settings:', error);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const handleAccentChange = async (color: string) => {
    setAccentColor(color);
    await AsyncStorage.setItem('accentColor', color);
  };

  const accentColors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Green', value: '#22c55e' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Appearance</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme</Text>
          <TouchableOpacity
            style={[styles.option, theme === 'light' && styles.selectedOption]}
            onPress={() => handleThemeChange('light')}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="sunny-outline" size={24} color={colors.text.primary} />
              <Text style={styles.optionText}>Light</Text>
            </View>
            {theme === 'light' && (
              <Ionicons name="checkmark" size={24} color={colors.accent.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, theme === 'dark' && styles.selectedOption]}
            onPress={() => handleThemeChange('dark')}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="moon-outline" size={24} color={colors.text.primary} />
              <Text style={styles.optionText}>Dark</Text>
            </View>
            {theme === 'dark' && (
              <Ionicons name="checkmark" size={24} color={colors.accent.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, theme === 'auto' && styles.selectedOption]}
            onPress={() => handleThemeChange('auto')}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="phone-portrait-outline" size={24} color={colors.text.primary} />
              <Text style={styles.optionText}>Auto (System)</Text>
            </View>
            {theme === 'auto' && (
              <Ionicons name="checkmark" size={24} color={colors.accent.primary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accent Color</Text>
          <View style={styles.colorGrid}>
            {accentColors.map((color) => (
              <TouchableOpacity
                key={color.value}
                style={[
                  styles.colorOption,
                  { backgroundColor: color.value },
                  accentColor === color.value && styles.selectedColor,
                ]}
                onPress={() => handleAccentChange(color.value)}
              >
                {accentColor === color.value && (
                  <Ionicons name="checkmark" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate('FontSize' as never)}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="text-outline" size={24} color={colors.text.primary} />
              <Text style={styles.optionText}>Font Size</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
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
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.secondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  selectedOption: {
    backgroundColor: `${colors.accent.primary}15`,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: colors.text.primary,
  },
});
