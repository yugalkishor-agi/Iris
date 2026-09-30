import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { settingsService } from '../services/settings.service';
import { useColors, spacing, typography, borderRadius } from '../styles/theme';

type FontSizeValue = 'small' | 'medium' | 'large';

const FONT_OPTIONS: Array<{ id: FontSizeValue; label: string; previewSize: number }> = [
  { id: 'small', label: 'Small', previewSize: 14 },
  { id: 'medium', label: 'Medium', previewSize: 16 },
  { id: 'large', label: 'Large', previewSize: 18 },
];

export default function FontSizeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const themeColors = useColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const [fontSize, setFontSize] = useState<FontSizeValue>('medium');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.userId) {
          const userSettings: any = await settingsService.getUserSettings(user.userId);
          if (userSettings?.fontSize && ['small', 'medium', 'large'].includes(userSettings.fontSize)) {
            setFontSize(userSettings.fontSize as FontSizeValue);
            return;
          }
        }

        const local = await AsyncStorage.getItem('iris-font-size');
        if (local && ['small', 'medium', 'large'].includes(local)) {
          setFontSize(local as FontSizeValue);
        }
      } catch (error) {
        console.error('Failed to load font size:', error);
      }
    };
    load();
  }, [user?.userId]);

  const saveFontSize = async (value: FontSizeValue) => {
    if (saving || value === fontSize) return;
    setSaving(true);
    const previous = fontSize;
    setFontSize(value);

    try {
      await AsyncStorage.setItem('iris-font-size', value);
      if (user?.userId) {
        await settingsService.updateSettings(user.userId, { fontSize: value } as any);
      }
    } catch (error) {
      console.error('Failed to save font size:', error);
      setFontSize(previous);
    } finally {
      setSaving(false);
    }
  };

  const previewSize = FONT_OPTIONS.find((option) => option.id === fontSize)?.previewSize || 16;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Font Size</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.preview}>
          <Text style={[styles.previewText, { fontSize: previewSize }]}>
            This is how text will appear in the app.
          </Text>
        </View>

        {FONT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.option, fontSize === option.id && styles.selectedOption]}
            onPress={() => saveFontSize(option.id)}
            disabled={saving}
          >
            <Text style={[styles.optionText, { fontSize: option.previewSize }]}>
              {option.label}
            </Text>
            {fontSize === option.id ? (
              <Ionicons name="checkmark-circle" size={22} color={themeColors.accent.primary} />
            ) : (
              <Ionicons name="ellipse-outline" size={20} color={themeColors.text.secondary} />
            )}
          </TouchableOpacity>
        ))}

        {saving && (
          <View style={styles.savingRow}>
            <InlineLoadingSkeleton />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.subtle,
    },
    title: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold as any,
      color: themeColors.text.primary,
    },
    placeholder: {
      width: 24,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    preview: {
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      backgroundColor: themeColors.background.secondary,
      borderWidth: 1,
      borderColor: themeColors.border.light,
    },
    previewText: {
      color: themeColors.text.primary,
      textAlign: 'center',
    },
    option: {
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: themeColors.border.light,
      backgroundColor: themeColors.background.secondary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectedOption: {
      borderColor: themeColors.accent.primary,
      backgroundColor: `${themeColors.accent.primary}18`,
    },
    optionText: {
      color: themeColors.text.primary,
      fontWeight: typography.fontWeight.semibold as any,
    },
    savingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    savingText: {
      color: themeColors.text.secondary,
      fontSize: typography.fontSize.sm,
    },
  });

