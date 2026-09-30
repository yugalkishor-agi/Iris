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

interface DateTimeFormat {
  id: string;
  name: string;
  dateFormat: string;
  timeFormat: string;
  example: string;
}

export default function DateTimeFormatScreen() {
  const [selectedFormat, setSelectedFormat] = useState('default');
  const navigation = useNavigation();

  const dateTimeFormats: DateTimeFormat[] = [
    {
      id: 'default',
      name: 'Default',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12-hour',
      example: '12/25/2023 at 2:30 PM',
    },
    {
      id: 'iso',
      name: 'ISO Standard',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24-hour',
      example: '2023-12-25 at 14:30',
    },
    {
      id: 'european',
      name: 'European',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24-hour',
      example: '25/12/2023 at 14:30',
    },
    {
      id: 'long_us',
      name: 'Long US Format',
      dateFormat: 'Month DD, YYYY',
      timeFormat: '12-hour',
      example: 'December 25, 2023 at 2:30 PM',
    },
    {
      id: 'short_us',
      name: 'Short US Format',
      dateFormat: 'MM/DD/YY',
      timeFormat: '12-hour',
      example: '12/25/23 at 2:30 PM',
    },
    {
      id: 'relative',
      name: 'Relative Time',
      dateFormat: 'Relative',
      timeFormat: 'Relative',
      example: '2 hours ago, Yesterday, Last week',
    },
  ];

  useEffect(() => {
    loadDateTimeFormat();
  }, []);

  const loadDateTimeFormat = async () => {
    try {
      const savedFormat = await AsyncStorage.getItem('dateTimeFormat');
      if (savedFormat) {
        setSelectedFormat(savedFormat);
      }
    } catch (error) {
      console.error('Failed to load date time format:', error);
    }
  };

  const handleFormatChange = async (formatId: string) => {
    try {
      setSelectedFormat(formatId);
      await AsyncStorage.setItem('dateTimeFormat', formatId);
      // In production, this would trigger a global date/time format update
    } catch (error) {
      console.error('Failed to save date time format:', error);
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const selectedFormatData = dateTimeFormats.find(f => f.id === selectedFormat);
    
    if (!selectedFormatData) return 'Invalid format';
    
    switch (selectedFormat) {
      case 'default':
        return now.toLocaleString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      case 'iso':
        return now.toISOString().slice(0, 16).replace('T', ' at ');
      case 'european':
        return now.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).replace(',', ' at');
      case 'long_us':
        return now.toLocaleString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      case 'short_us':
        return now.toLocaleString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: '2-digit',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      case 'relative':
        return 'Just now';
      default:
        return selectedFormatData.example;
    }
  };

  const renderFormatOption = (format: DateTimeFormat) => {
    const isSelected = selectedFormat === format.id;
    
    return (
      <TouchableOpacity
        key={format.id}
        style={[
          styles.formatOption,
          isSelected && styles.selectedFormat
        ]}
        onPress={() => handleFormatChange(format.id)}
        activeOpacity={0.7}
      >
        <View style={styles.formatInfo}>
          <Text style={styles.formatName}>{format.name}</Text>
          <Text style={styles.formatDetails}>
            Date: {format.dateFormat} • Time: {format.timeFormat}
          </Text>
          <Text style={styles.formatExample}>{format.example}</Text>
        </View>
        
        <View style={[
          styles.radioButton,
          isSelected && styles.radioButtonSelected
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
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
        <Text style={styles.headerTitle}>Date & Time Format</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="time" size={24} color={colors.accent.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Customize date and time display</Text>
            <Text style={styles.infoDescription}>
              Choose how dates and times are displayed throughout the app to match your preferences.
            </Text>
          </View>
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Current Format Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>Current time:</Text>
              <Text style={styles.previewValue}>{getCurrentDateTime()}</Text>
            </View>
            
            <View style={styles.mockPost}>
              <View style={styles.mockHeader}>
                <View style={styles.mockAvatar} />
                <View style={styles.mockUserInfo}>
                  <Text style={styles.mockUsername}>john_doe</Text>
                  <Text style={styles.mockTime}>{getCurrentDateTime()}</Text>
                </View>
              </View>
              <Text style={styles.mockCaption}>
                This is how timestamps will appear in posts and comments.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.formatsSection}>
          <Text style={styles.sectionTitle}>Available Formats</Text>
          <View style={styles.formatsList}>
            {dateTimeFormats.map(renderFormatOption)}
          </View>
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={20} color={colors.text.secondary} />
          <Text style={styles.noteText}>
            Date and time format changes will apply immediately throughout the app. This affects posts, comments, messages, and all other timestamps.
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
    gap: spacing.lg,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  previewLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  previewValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  mockPost: {
    gap: spacing.sm,
  },
  mockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  mockTime: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  mockCaption: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: 20,
  },
  formatsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  formatsList: {
    gap: spacing.md,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFormat: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primary + '10',
  },
  formatInfo: {
    flex: 1,
  },
  formatName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  formatDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  formatExample: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium as any,
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
