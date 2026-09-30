import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DataUsageScreen() {
  const navigation = useNavigation();
  const [autoPlayVideos, setAutoPlayVideos] = useState(true);
  const [highQualityUploads, setHighQualityUploads] = useState(false);
  const [reducedData, setReducedData] = useState(false);
  const [downloadOnWifiOnly, setDownloadOnWifiOnly] = useState(true);
  const [autoDownloadStories, setAutoDownloadStories] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('dataSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setAutoPlayVideos(parsed.autoPlayVideos ?? true);
        setHighQualityUploads(parsed.highQualityUploads ?? false);
        setReducedData(parsed.reducedData ?? false);
        setDownloadOnWifiOnly(parsed.downloadOnWifiOnly ?? true);
        setAutoDownloadStories(parsed.autoDownloadStories ?? false);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (key: string, value: boolean) => {
    try {
      const current = await AsyncStorage.getItem('dataSettings');
      const settings = current ? JSON.parse(current) : {};
      settings[key] = value;
      await AsyncStorage.setItem('dataSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const renderToggle = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (val: boolean) => void,
    key: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={colors.text.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={(val) => {
          onValueChange(val);
          saveSettings(key, val);
        }}
        trackColor={{ false: colors.border.medium, true: colors.accent.primary }}
        thumbColor={colors.interactive.primary}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Data Usage</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Media</Text>
          {renderToggle(
            'play-outline',
            'Auto-Play Videos',
            'Videos play automatically in feed',
            autoPlayVideos,
            setAutoPlayVideos,
            'autoPlayVideos'
          )}
          {renderToggle(
            'cloud-upload-outline',
            'High Quality Uploads',
            'Upload images and videos in high quality',
            highQualityUploads,
            setHighQualityUploads,
            'highQualityUploads'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Saver</Text>
          {renderToggle(
            'cellular-outline',
            'Reduced Data Mode',
            'Load lower quality images to save data',
            reducedData,
            setReducedData,
            'reducedData'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downloads</Text>
          {renderToggle(
            'wifi-outline',
            'Download on Wi-Fi Only',
            'Only download content when on Wi-Fi',
            downloadOnWifiOnly,
            setDownloadOnWifiOnly,
            'downloadOnWifiOnly'
          )}
          {renderToggle(
            'download-outline',
            'Auto-Download Stories',
            'Automatically download stories for offline viewing',
            autoDownloadStories,
            setAutoDownloadStories,
            'autoDownloadStories'
          )}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={24} color={colors.accent.primary} />
          <Text style={styles.infoText}>
            These settings help you control how much data the app uses
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: `${colors.accent.primary}15`,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.relaxed,
  },
});
