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
import { Avatar } from '../components/ui/Avatar';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';

interface SettingItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  screen?: string;
  color?: string;
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, signOut: logout } = useAuth();

  const accountSettings: SettingItem[] = [
    { icon: 'person-outline', title: 'Edit Profile', screen: 'EditProfile' },
    { icon: 'lock-closed-outline', title: 'Privacy', screen: 'PrivacySettings' },
    { icon: 'shield-outline', title: 'Security', screen: 'SecuritySettings' },
    { icon: 'notifications-outline', title: 'Notifications', screen: 'NotificationSettings' },
  ];

  const contentSettings: SettingItem[] = [
    { icon: 'bookmark-outline', title: 'Saved', screen: 'SavedPosts' },
    { icon: 'archive-outline', title: 'Archive', screen: 'Archive' },
    { icon: 'time-outline', title: 'Your Activity', screen: 'ActivityLog' },
  ];

  const appSettings: SettingItem[] = [
    { icon: 'color-palette-outline', title: 'Appearance', screen: 'AppearanceSettings' },
    { icon: 'language-outline', title: 'Language', screen: 'LanguageSettings' },
    { icon: 'server-outline', title: 'Data Usage', screen: 'DataUsage' },
    { icon: 'accessibility-outline', title: 'Accessibility', screen: 'Accessibility' },
  ];

  const supportSettings: SettingItem[] = [
    { icon: 'help-circle-outline', title: 'Help Center', screen: 'HelpCenter' },
    { icon: 'information-circle-outline', title: 'About', screen: 'About' },
    { icon: 'document-text-outline', title: 'Terms of Service', screen: 'Terms' },
    { icon: 'shield-checkmark-outline', title: 'Privacy Policy', screen: 'PrivacyPolicy' },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.title}
      style={styles.settingItem}
      onPress={() => item.screen && navigation.navigate(item.screen as never)}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <Ionicons
          name={item.icon}
          size={24}
          color={item.color || colors.text.primary}
        />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.text.secondary}
      />
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {items.map(renderSettingItem)}
      </View>
    </View>
  );

  const handleLogout = async () => {
    await logout();
    navigation.navigate('Login' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Profile */}
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => navigation.navigate('Profile' as never)}
          activeOpacity={0.7}
        >
          <Avatar
            source={user?.avatarURL}
            size={64}
            fallbackText={user?.username}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.displayName || user?.username}
            </Text>
            <Text style={styles.profileUsername}>@{user?.username}</Text>
            <Text style={styles.viewProfile}>View Profile</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.text.secondary}
          />
        </TouchableOpacity>

        {/* Settings Sections */}
        {renderSection('Account', accountSettings)}
        {renderSection('Content & Activity', contentSettings)}
        {renderSection('App Settings', appSettings)}
        {renderSection('Support & About', supportSettings)}

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color={colors.accent.error} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Iris v1.0.0</Text>
          <Text style={styles.footerText}>Made with ❤️</Text>
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
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  profileUsername: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  viewProfile: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    marginTop: spacing.xs,
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
  sectionContent: {
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  settingSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
  },
  logoutText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.accent.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
});
