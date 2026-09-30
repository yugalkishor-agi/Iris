import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { settingsService } from '../services/settings.service';
import { useColors, spacing, typography, borderRadius } from '../styles/theme';
import { userService } from '../services/user.service';

export default function TwoFactorAuthScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const themeColors = useColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [appEnabled, setAppEnabled] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.userId) return;
      try {
        const userData: any = await userService.getUser(user.userId);
        const has2FA = !!userData?.twoFactorEnabled;
        setEnabled(has2FA);
        setAppEnabled(has2FA);
      } catch (error) {
        console.error('Failed to load 2FA state:', error);
      }
    };
    load();
  }, [user?.userId]);

  const updateSmsPreference = async (value: boolean) => {
    if (!user?.userId) return;
    setSmsEnabled(value);
    try {
      await settingsService.updateSettings(user.userId, { twoFactorSmsEnabled: value } as any);
    } catch (error) {
      setSmsEnabled(!value);
      Alert.alert('Error', 'Failed to update SMS authentication setting.');
    }
  };

  const updateApp2FA = async (value: boolean) => {
    if (!user?.userId) return;
    setLoading(true);
    setAppEnabled(value);
    try {
      if (value) {
        await settingsService.enable2FA(user.userId);
        setEnabled(true);
        Alert.alert('Two-Factor Enabled', 'Authenticator app based 2FA is now enabled.');
      } else {
        await settingsService.disable2FA(user.userId);
        setEnabled(false);
        Alert.alert('Two-Factor Disabled', 'Two-factor authentication has been disabled.');
      }
    } catch (error) {
      setAppEnabled(!value);
      Alert.alert('Error', 'Unable to update two-factor authentication right now.');
    } finally {
      setLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      await settingsService.enable2FA(user.userId);
      setEnabled(true);
      setAppEnabled(true);
      Alert.alert('Backup Codes Updated', 'New backup codes were generated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate backup codes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Two-Factor Authentication</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Method</Text>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="phone-portrait" size={20} color={themeColors.text.secondary} />
            <Text style={styles.rowTitle}>SMS Authentication</Text>
          </View>
          <Switch
            value={smsEnabled}
            onValueChange={updateSmsPreference}
            disabled={loading}
            trackColor={{ false: themeColors.border.light, true: `${themeColors.accent.primary}66` }}
            thumbColor={smsEnabled ? themeColors.accent.primary : themeColors.text.secondary}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="shield-checkmark" size={20} color={themeColors.text.secondary} />
            <Text style={styles.rowTitle}>Authenticator App</Text>
          </View>
          <Switch
            value={appEnabled}
            onValueChange={updateApp2FA}
            disabled={loading}
            trackColor={{ false: themeColors.border.light, true: `${themeColors.accent.primary}66` }}
            thumbColor={appEnabled ? themeColors.accent.primary : themeColors.text.secondary}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backup Codes</Text>

        <TouchableOpacity style={styles.actionRow} onPress={regenerateBackupCodes} disabled={loading}>
          <View style={styles.rowLeft}>
            <Ionicons name="key" size={20} color={themeColors.text.secondary} />
            <Text style={styles.rowTitle}>Generate Backup Codes</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={themeColors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('BackupCodes' as never)}>
          <View style={styles.rowLeft}>
            <Ionicons name="list" size={20} color={themeColors.text.secondary} />
            <Text style={styles.rowTitle}>View Saved Codes</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={themeColors.text.muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusText}>
          {enabled ? 'Two-factor authentication is active.' : 'Two-factor authentication is currently off.'}
        </Text>
      </View>
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
    placeholder: {
      width: 24,
    },
    section: {
      marginTop: spacing.xl,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: themeColors.border.light,
      backgroundColor: themeColors.background.secondary,
    },
    sectionTitle: {
      fontSize: typography.fontSize.sm,
      color: themeColors.text.secondary,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontWeight: typography.fontWeight.semibold as any,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: themeColors.border.subtle,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: themeColors.border.subtle,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    rowTitle: {
      fontSize: typography.fontSize.base,
      color: themeColors.text.primary,
    },
    statusCard: {
      marginTop: spacing.xl,
      marginHorizontal: spacing.lg,
      backgroundColor: themeColors.background.secondary,
      borderWidth: 1,
      borderColor: themeColors.border.light,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
    },
    statusText: {
      fontSize: typography.fontSize.sm,
      color: themeColors.text.secondary,
      lineHeight: 20,
    },
  });
