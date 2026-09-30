import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useMemo, useState } from 'react';
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
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { settingsService } from '../services/settings.service';
import { useColors, spacing, typography, borderRadius } from '../styles/theme';

type ThemePreference = 'light' | 'dark' | 'auto';

export default function ThemeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { preference, setPreference } = useTheme();
  const themeColors = useColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [saving, setSaving] = useState(false);

  const themeOptions: Array<{ id: ThemePreference; name: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { id: 'light', name: 'Light', icon: 'sunny-outline' },
    { id: 'dark', name: 'Dark', icon: 'moon-outline' },
    { id: 'auto', name: 'System Default', icon: 'phone-portrait-outline' },
  ];

  const handleThemeChange = async (value: ThemePreference) => {
    if (saving || preference === value) return;
    setSaving(true);
    try {
      setPreference(value);
      if (user?.userId) {
        await settingsService.updateSettings(user.userId, { theme: value } as any);
      }
    } catch (error) {
      console.error('Failed to update theme:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Theme</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {themeOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.option, preference === option.id && styles.selectedOption]}
            onPress={() => handleThemeChange(option.id)}
            disabled={saving}
          >
            <View style={styles.optionLeft}>
              <Ionicons name={option.icon} size={22} color={themeColors.accent.primary} />
              <Text style={styles.optionText}>{option.name}</Text>
            </View>

            {preference === option.id ? (
              <Ionicons name="checkmark-circle" size={22} color={themeColors.accent.primary} />
            ) : (
              <Ionicons name="ellipse-outline" size={20} color={themeColors.text.secondary} />
            )}
          </TouchableOpacity>
        ))}

        {saving && (
          <View style={styles.savingRow}>
            <InlineLoadingSkeleton />
            <Text style={styles.savingText}>Saving preference...</Text>
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
      gap: spacing.sm,
    },
    option: {
      backgroundColor: themeColors.background.secondary,
      borderWidth: 1,
      borderColor: themeColors.border.light,
      borderRadius: borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    selectedOption: {
      borderColor: themeColors.accent.primary,
      backgroundColor: `${themeColors.accent.primary}18`,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    optionText: {
      fontSize: typography.fontSize.base,
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

