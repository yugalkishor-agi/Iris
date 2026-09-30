import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { Image } from 'expo-image';

export default function AboutScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer as any}>
        <View style={styles.logoSection}>
          <View style={styles.logo}>
            <Ionicons name="camera" size={48} color={colors.accent.primary} />
          </View>
          <Text style={styles.appName}>Iris</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>
            Share moments, connect with friends
          </Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemTitle}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemTitle}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemTitle}>Community Guidelines</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemTitle}>Open Source Licenses</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.item}>
            <Ionicons name="logo-twitter" size={24} color={colors.text.primary} />
            <Text style={styles.socialText}>Follow us on Twitter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item}>
            <Ionicons name="logo-instagram" size={24} color={colors.text.primary} />
            <Text style={styles.socialText}>Follow us on Instagram</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item}>
            <Ionicons name="globe-outline" size={24} color={colors.text.primary} />
            <Text style={styles.socialText}>Visit our website</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>
          © 2025 Iris. All rights reserved.
        </Text>
        <Text style={styles.madeWith}>
          Made with ❤️
        </Text>
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
  contentContainer: {
    paddingBottom: spacing.xxl,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.accent.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  version: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: typography.fontSize.base,
    color: colors.text.muted,
    textAlign: 'center',
  },
  section: {
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  itemTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    flex: 1,
  },
  socialText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    flex: 1,
    marginLeft: spacing.md,
  },
  copyright: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  madeWith: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
