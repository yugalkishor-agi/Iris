import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { settingsService } from '../services/settings.service';
import { userService } from '../services/user.service';
import { Avatar } from '../components/ui/Avatar';
import { borderRadius, spacing, typography, useColors } from '../styles/theme';

type NavTarget = string;

interface SettingsRowProps {
  icon: string;
  label: string;
  subtitle?: string;
  danger?: boolean;
  onPress: () => void;
}

interface ToggleRowProps {
  icon: string;
  label: string;
  subtitle?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const { theme, setPreference } = useTheme();
  const themeColors = useColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const [notifications, setNotifications] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user?.userId) return;
      try {
        const [userData, settings] = await Promise.all([
          userService.getUser(user.userId),
          settingsService.getUserSettings(user.userId),
        ]);
        setPrivateAccount(!!userData?.isPrivate);
        setNotifications(settings?.notificationsEnabled !== false);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadUserSettings();
  }, [user?.userId]);

  const navigate = (target: NavTarget) => {
    (navigation as any).navigate(target);
  };

  const handleTogglePrivateAccount = async (value: boolean) => {
    if (!user?.userId) return;
    setPrivateAccount(value);
    try {
      await userService.updateUser(user.userId, { isPrivate: value });
      await settingsService.updatePrivacySettings(user.userId, { isPrivate: value });
    } catch (error) {
      setPrivateAccount(!value);
      Alert.alert('Error', 'Failed to update private account setting.');
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (!user?.userId) return;
    setNotifications(value);
    try {
      await settingsService.updateSettings(user.userId, { notificationsEnabled: value });
    } catch (error) {
      setNotifications(!value);
      Alert.alert('Error', 'Failed to update notification setting.');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const SettingsRow = ({ icon, label, subtitle, danger, onPress }: SettingsRowProps) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon as any} size={20} color={danger ? '#ef4444' : themeColors.text.secondary} />
        <View style={styles.rowTextWrap}>
          <Text style={[styles.rowTitle, danger && styles.dangerText]}>{label}</Text>
          {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={themeColors.text.muted} />
    </TouchableOpacity>
  );

  const ToggleRow = ({ icon, label, subtitle, value, onChange }: ToggleRowProps) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon as any} size={20} color={themeColors.text.secondary} />
        <View style={styles.rowTextWrap}>
          <Text style={styles.rowTitle}>{label}</Text>
          {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: themeColors.border.light, true: `${themeColors.accent.primary}66` }}
        thumbColor={value ? themeColors.accent.primary : themeColors.text.secondary}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => (navigation as any).navigate('Main', { screen: 'Profile' })}
        >
          <Avatar source={user?.avatarURL} size={56} />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{user?.displayName || 'Profile'}</Text>
            <Text style={styles.profileHandle}>@{user?.username || 'user'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={themeColors.text.muted} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.group}>
          <ToggleRow
            icon="moon-outline"
            label="Dark Mode"
            subtitle="Switch between light and dark theme"
            value={theme === 'dark'}
            onChange={(value) => setPreference(value ? 'dark' : 'light')}
          />
          <ToggleRow
            icon="notifications-outline"
            label="Notifications"
            subtitle="Enable or disable all push notifications"
            value={notifications}
            onChange={handleToggleNotifications}
          />
          <ToggleRow
            icon="lock-closed-outline"
            label="Private Account"
            subtitle="Only approved followers can view your posts"
            value={privateAccount}
            onChange={handleTogglePrivateAccount}
          />
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.group}>
          <SettingsRow icon="person-outline" label="Edit Profile" onPress={() => navigate('EditProfile')} />
          <SettingsRow icon="mail-outline" label="Personal Information" subtitle="Email and phone" onPress={() => navigate('EmailPhone')} />
          <SettingsRow icon="key-outline" label="Change Password" onPress={() => navigate('ChangePassword')} />
          <SettingsRow icon="shield-checkmark-outline" label="Security" onPress={() => navigate('SecuritySettings')} />
          <SettingsRow icon="briefcase-outline" label="Account Settings" onPress={() => navigate('AccountSettings')} />
        </View>

        <Text style={styles.sectionTitle}>Privacy & Notifications</Text>
        <View style={styles.group}>
          <SettingsRow icon="lock-closed" label="Privacy" onPress={() => navigate('PrivacySettings')} />
          <SettingsRow icon="notifications" label="Notification Settings" onPress={() => navigate('NotificationSettings')} />
          <SettingsRow icon="color-palette-outline" label="Appearance" onPress={() => navigate('AppearanceSettings')} />
          <SettingsRow icon="language-outline" label="Language" onPress={() => navigate('LanguageSettings')} />
          <SettingsRow icon="bar-chart-outline" label="Data Usage" onPress={() => navigate('DataUsage')} />
        </View>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.group}>
          <SettingsRow icon="help-circle-outline" label="Help Center" onPress={() => navigate('HelpCenter')} />
          <SettingsRow icon="information-circle-outline" label="About" onPress={() => navigate('About')} />
          <SettingsRow icon="document-text-outline" label="Terms" onPress={() => navigate('Terms')} />
          <SettingsRow icon="shield-outline" label="Privacy Policy" onPress={() => navigate('PrivacyPolicy')} />
        </View>

        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <View style={styles.group}>
          <SettingsRow icon="close-circle-outline" label="Deactivate Account" danger onPress={() => navigate('DeactivateAccount')} />
          <SettingsRow icon="trash-outline" label="Delete Account" danger onPress={() => navigate('DeleteAccount')} />
          <SettingsRow icon="log-out-outline" label="Sign Out" danger onPress={handleSignOut} />
        </View>

        <View style={{ height: spacing.xxl }} />
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
      paddingVertical: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.subtle,
    },
    headerTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold as any,
      color: themeColors.text.primary,
    },
    content: {
      flex: 1,
    },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: themeColors.border.light,
      backgroundColor: themeColors.background.secondary,
      gap: spacing.md,
    },
    profileText: {
      flex: 1,
    },
    profileName: {
      fontSize: typography.fontSize.base,
      color: themeColors.text.primary,
      fontWeight: typography.fontWeight.semibold as any,
    },
    profileHandle: {
      marginTop: 2,
      fontSize: typography.fontSize.sm,
      color: themeColors.text.secondary,
    },
    sectionTitle: {
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
      marginHorizontal: spacing.lg,
      fontSize: typography.fontSize.sm,
      color: themeColors.text.secondary,
      textTransform: 'uppercase',
      fontWeight: typography.fontWeight.semibold as any,
    },
    group: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: themeColors.border.light,
      backgroundColor: themeColors.background.secondary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.subtle,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
      paddingRight: spacing.md,
    },
    rowTextWrap: {
      flex: 1,
    },
    rowTitle: {
      fontSize: typography.fontSize.base,
      color: themeColors.text.primary,
      fontWeight: typography.fontWeight.medium as any,
    },
    rowSubtitle: {
      marginTop: 2,
      fontSize: typography.fontSize.xs,
      color: themeColors.text.muted,
    },
    dangerText: {
      color: '#ef4444',
    },
  });
