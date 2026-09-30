import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, spacing, typography, useColors } from '../../styles/theme';

type FeatureGroup = {
  title: string;
  items: string[];
};

type ComingSoonScreenProps = {
  title: string;
  heading?: string;
  description?: string;
  groups: FeatureGroup[];
};

export default function ComingSoonScreen({
  title,
  heading = 'Coming soon',
  description = 'This section is planned for a future update and is intentionally disabled for now.',
  groups,
}: ComingSoonScreenProps) {
  const navigation = useNavigation();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer as any} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="time-outline" size={24} color={colors.accent.primary} />
          </View>
          <Text style={styles.heroTitle}>{heading}</Text>
          <Text style={styles.heroDescription}>{description}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Upcoming Features</Text>
          {groups.map((group) => (
            <View key={group.title} style={styles.groupBlock}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.items.map((item) => (
                <View key={`${group.title}:${item}`} style={styles.featureRow}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    },
    backButton: {
      width: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold as any,
      color: colors.text.primary,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    heroCard: {
      backgroundColor: colors.background.secondary,
      borderWidth: 1,
      borderColor: colors.border.light,
      borderRadius: 26,
      padding: spacing.xl,
      alignItems: 'flex-start',
    },
    heroIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: `${colors.accent.primary}18`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    heroTitle: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold as any,
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    heroDescription: {
      fontSize: typography.fontSize.base,
      lineHeight: 22,
      color: colors.text.secondary,
    },
    sectionCard: {
      backgroundColor: colors.background.secondary,
      borderWidth: 1,
      borderColor: colors.border.light,
      borderRadius: 24,
      padding: spacing.lg,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700' as any,
      color: colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
      marginBottom: spacing.md,
    },
    groupBlock: {
      marginBottom: spacing.lg,
    },
    groupTitle: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold as any,
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
    },
    featureDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent.primary,
      marginRight: spacing.sm,
      opacity: 0.9,
    },
    featureText: {
      flex: 1,
      fontSize: typography.fontSize.base,
      color: colors.text.secondary,
    },
  });
