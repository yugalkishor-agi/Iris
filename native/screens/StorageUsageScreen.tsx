import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { cacheService } from '../services/cache.service';
import { useColors, spacing, typography, borderRadius } from '../styles/theme';

const BREAKDOWN = [
  { key: 'user', label: 'User Profiles', prefix: 'user:', icon: 'person-circle' as const, color: '#3b82f6' },
  { key: 'post', label: 'Posts', prefix: 'post:', icon: 'images' as const, color: '#a855f7' },
  { key: 'feed', label: 'Feed Pages', prefix: 'feed:', icon: 'newspaper' as const, color: '#f59e0b' },
  { key: 'following', label: 'Following Lists', prefix: 'following:', icon: 'people' as const, color: '#10b981' },
];

export default function StorageUsageScreen() {
  const navigation = useNavigation();
  const themeColors = useColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [version, setVersion] = useState(0);

  const totalEntries = cacheService.getSize();
  const breakdown = useMemo(() => {
    const stats = cacheService.getPrefixStats(BREAKDOWN.map((item) => item.prefix));
    return BREAKDOWN.map((item) => ({
      ...item,
      count: stats.find((stat) => stat.prefix === item.prefix)?.count || 0,
    }));
  }, [version, totalEntries]);

  const known = breakdown.reduce((sum, item) => sum + item.count, 0);
  const other = Math.max(totalEntries - known, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Storage Usage</Text>
        <TouchableOpacity onPress={() => setVersion((prev) => prev + 1)}>
          <Ionicons name="refresh" size={20} color={themeColors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content as any}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>In-memory Cache</Text>
          <Text style={styles.summaryValue}>{totalEntries}</Text>
          <Text style={styles.summaryMeta}>total entries</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: totalEntries > 0 ? '100%' : '0%' }]} />
          </View>
        </View>

        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>Breakdown</Text>

          {breakdown.map((item) => (
            <View key={item.key} style={styles.item}>
              <View style={styles.itemLeft}>
                <Ionicons name={item.icon} size={22} color={item.color} />
                <Text style={styles.itemName}>{item.label}</Text>
              </View>
              <Text style={styles.itemValue}>{item.count} entries</Text>
            </View>
          ))}

          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Ionicons name="cube" size={22} color={themeColors.text.secondary} />
              <Text style={styles.itemName}>Other</Text>
            </View>
            <Text style={styles.itemValue}>{other} entries</Text>
          </View>
        </View>
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
      padding: spacing.lg,
      gap: spacing.md,
    },
    summaryCard: {
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: themeColors.border.light,
      backgroundColor: themeColors.background.secondary,
      padding: spacing.lg,
      alignItems: 'center',
    },
    summaryTitle: {
      fontSize: typography.fontSize.sm,
      color: themeColors.text.secondary,
    },
    summaryValue: {
      fontSize: 42,
      color: themeColors.accent.primary,
      fontWeight: typography.fontWeight.bold as any,
      marginTop: spacing.xs,
    },
    summaryMeta: {
      fontSize: typography.fontSize.sm,
      color: themeColors.text.secondary,
      marginBottom: spacing.md,
    },
    progressBar: {
      width: '100%',
      height: 8,
      backgroundColor: themeColors.border.light,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: themeColors.accent.primary,
    },
    breakdownCard: {
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: themeColors.border.light,
      backgroundColor: themeColors.background.secondary,
      padding: spacing.lg,
    },
    sectionTitle: {
      fontSize: typography.fontSize.base,
      color: themeColors.text.primary,
      fontWeight: typography.fontWeight.semibold as any,
      marginBottom: spacing.sm,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.subtle,
    },
    itemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    itemName: {
      fontSize: typography.fontSize.base,
      color: themeColors.text.primary,
    },
    itemValue: {
      fontSize: typography.fontSize.sm,
      color: themeColors.text.secondary,
      fontWeight: typography.fontWeight.semibold as any,
    },
  });
