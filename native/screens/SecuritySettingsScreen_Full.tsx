import React, { useState } from 'react';
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
import { useAuth } from '../contexts/AuthContext';

export default function SecuritySettingsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [biometricLogin, setBiometricLogin] = useState(false);

  const renderOption = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle?: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={styles.option}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.optionLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={colors.text.primary} />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>{title}</Text>
          {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
      )}
    </TouchableOpacity>
  );

  const renderToggle = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (val: boolean) => void
  ) => (
    <View style={styles.option}>
      <View style={styles.optionLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={colors.text.primary} />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
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
        <Text style={styles.title}>Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Login Security</Text>
          {renderToggle(
            'shield-checkmark-outline',
            'Two-Factor Authentication',
            'Add extra security to your account',
            twoFactorEnabled,
            setTwoFactorEnabled
          )}
          {renderToggle(
            'finger-print-outline',
            'Biometric Login',
            'Use fingerprint or face ID',
            biometricLogin,
            setBiometricLogin
          )}
          {renderToggle(
            'notifications-outline',
            'Login Alerts',
            'Get notified of new logins',
            loginAlerts,
            setLoginAlerts
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Access</Text>
          {renderOption(
            'key-outline',
            'Change Password',
            'Update your password',
            () => navigation.navigate('ChangePassword' as never)
          )}
          {renderOption(
            'time-outline',
            'Login Activity',
            'See where you\'re logged in',
            () => navigation.navigate('LoginActivity' as never)
          )}
          {renderOption(
            'apps-outline',
            'Apps and Websites',
            'Manage connected apps',
            () => navigation.navigate('AppsWebsites' as never)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          {renderOption(
            'download-outline',
            'Download Your Data',
            'Get a copy of your data',
            () => navigation.navigate('DownloadData' as never)
          )}
          {renderOption(
            'trash-outline',
            'Delete Account',
            'Permanently delete your account',
            () => navigation.navigate('DeleteAccount' as never)
          )}
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  optionLeft: {
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
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
});
