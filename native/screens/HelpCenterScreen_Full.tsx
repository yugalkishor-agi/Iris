import React from 'react';
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

export default function HelpCenterScreen() {
  const navigation = useNavigation();

  const helpTopics = [
    {
      icon: 'person-outline' as const,
      title: 'Account & Profile',
      description: 'Manage your account settings',
    },
    {
      icon: 'lock-closed-outline' as const,
      title: 'Privacy & Safety',
      description: 'Control your privacy settings',
    },
    {
      icon: 'chatbubble-outline' as const,
      title: 'Messages & Comments',
      description: 'Help with messaging features',
    },
    {
      icon: 'image-outline' as const,
      title: 'Posts & Stories',
      description: 'Learn about posting content',
    },
    {
      icon: 'notifications-outline' as const,
      title: 'Notifications',
      description: 'Manage notification settings',
    },
    {
      icon: 'bug-outline' as const,
      title: 'Report a Problem',
      description: 'Let us know about issues',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Help Center</Text>
        <TouchableOpacity>
          <Ionicons name="search-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.banner}>
          <Ionicons name="help-circle" size={48} color={colors.accent.primary} />
          <Text style={styles.bannerTitle}>How can we help?</Text>
          <Text style={styles.bannerText}>
            Find answers to common questions and get support
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Topics</Text>
          {helpTopics.map((topic, index) => (
            <TouchableOpacity
              key={index}
              style={styles.topicItem}
              activeOpacity={0.7}
            >
              <View style={styles.topicIcon}>
                <Ionicons name={topic.icon} size={24} color={colors.accent.primary} />
              </View>
              <View style={styles.topicInfo}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicDescription}>{topic.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <TouchableOpacity style={styles.contactItem}>
            <Ionicons name="mail-outline" size={24} color={colors.text.primary} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactText}>support@iris.app</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem}>
            <Ionicons name="chatbubbles-outline" size={24} color={colors.text.primary} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactText}>Available 24/7</Text>
            </View>
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
  content: {
    flex: 1,
  },
  banner: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.xl,
  },
  bannerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  bannerText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
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
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.md,
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.accent.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: 2,
  },
  topicDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: 2,
  },
  contactText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
  },
});
