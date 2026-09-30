import React, { useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { cacheService } from '../services/cache.service';
import { useColors, spacing, typography, borderRadius } from '../styles/theme';

type CacheBucket = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  prefix: string;
  count: number;
};

const BUCKET_DEFS: Omit<CacheBucket, 'count'>[] = [
  { key: 'user', label: 'User Cache', icon: 'person-circle', prefix: 'user:' },
  { key: 'post', label: 'Post Cache', icon: 'images', prefix: 'post:' },
  { key: 'feed', label: 'Feed Cache', icon: 'newspaper', prefix: 'feed:' },
  { key: 'following', label: 'Following Cache', icon: 'people', prefix: 'following:' },
];

export default function CacheManagementScreen() {
  const navigation = useNavigation();
  const themeColors = useColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [version, setVersion] = useState(0);

  const buckets: CacheBucket[] = useMemo(() => {
    const stats = cacheService.getPrefixStats(BUCKET_DEFS.map((item) => item.prefix));
    return BUCKET_DEFS.map((item) => ({
      ...item,
      count: stats.find((stat) => stat.prefix === item.prefix)?.count || 0,
    }));
  }, [version]);

  const totalEntries = cacheService.getSize();
  const knownCount = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const otherCount = Math.max(totalEntries - knownCount, 0);

  const refresh = () => setVersion((prev) => prev + 1);

  const confirmClearBucket = (bucket: CacheBucket) => {
    Alert.alert(
      'Clear Cache',
      `Remove ${bucket.label.toLowerCase()} entries?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            const removed = cacheService.clearByPrefix(bucket.prefix);
            Alert.alert('Cache Cleared', `${removed} entries removed from ${bucket.label}.`);
            refresh();
          },
        },
      ]
    );
  };

  const clearAll = () => {
    Alert.alert(
      'Clear All Cache',
      'This will remove all in-memory cache entries.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            cacheService.clear();
            refresh();
            Alert.alert('Done', 'All cache entries cleared.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Cache Management</Text>
        <TouchableOpacity onPress={refresh}>
          <Ionicons name="refresh" size={20} color={themeColors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer as any}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Cached Entries</Text>
          <Text style={styles.summaryValue}>{totalEntries}</Text>
          <Text style={styles.summaryMeta}>Other entries: {otherCount}</Text>
        </View>

        {buckets.map((bucket) => (
          <View key={bucket.key} style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Ionicons name={bucket.icon} size={24} color={themeColors.accent.primary} />
              <View style={styles.itemTextBlock}>
                <Text style={styles.itemTitle}>{bucket.label}</Text>
                <Text style={styles.itemMeta}>{bucket.count} entries</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.clearButton, bucket.count === 0 && styles.clearButtonDisabled]}
              onPress={() => confirmClearBucket(bucket)}
              disabled={bucket.count === 0}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.clearAllButton} onPress={clearAll}>
          <Text style={styles.clearAllText}>Clear All Cache</Text>
        </TouchableOpacity>
      </ScrollView>
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
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    summaryCard: {
      backgroundColor: themeColors.background.secondary,
      borderWidth: 1,
      borderColor: themeColors.border.light,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      alignItems: 'center',
    },
    summaryTitle: {
      fontSize: typography.fontSize.sm,
      color: themeColors.text.secondary,
    },
    summaryValue: {
      fontSize: 40,
      color: themeColors.accent.primary,
      fontWeight: typography.fontWeight.bold as any,
      marginVertical: spacing.xs,
    },
    summaryMeta: {
      fontSize: typography.fontSize.sm,
      color: themeColors.text.secondary,
    },
    itemCard: {
      backgroundColor: themeColors.background.secondary,
      borderWidth: 1,
      borderColor: themeColors.border.light,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    itemTextBlock: {
      flex: 1,
    },
    itemTitle: {
      fontSize: typography.fontSize.base,
      color: themeColors.text.primary,
      fontWeight: typography.fontWeight.semibold as any,
    },
    itemMeta: {
      fontSize: typography.fontSize.sm,
      color: themeColors.text.secondary,
      marginTop: 2,
    },
    clearButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
      backgroundColor: themeColors.accent.primary,
    },
    clearButtonDisabled: {
      opacity: 0.4,
    },
    clearButtonText: {
      color: '#fff',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold as any,
    },
    clearAllButton: {
      marginTop: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: themeColors.accent.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
    },
    clearAllText: {
      color: '#fff',
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold as any,
    },
  });
