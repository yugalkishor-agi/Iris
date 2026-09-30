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
import { useAuth } from '../contexts/AuthContext';
import { settingsService, type PrivacySettings } from '../services/settings.service';

export default function PrivacySettingsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [allowMentions, setAllowMentions] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [showOnline, setShowOnline] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const settings = await settingsService.getPrivacySettings(user.userId);
      setIsPrivate(settings.isPrivate || false);
      setAllowComments(settings.whoCanComment !== 'off');
      setAllowMentions(settings.mentionPermission !== 'none');
      setAllowMessages(settings.whoCanMessage === 'everyone');
      setShowActivity(settings.showActivityStatus !== false);
      setShowOnline(settings.hideOnlineStatus !== true);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateSetting = async (update: Partial<PrivacySettings>) => {
    if (!user) return;

    try {
      await settingsService.updatePrivacySettings(user.userId, update);
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const renderSetting = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (val: boolean) => void
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
        <Text style={styles.title}>Privacy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Privacy</Text>
          {renderSetting(
            'lock-closed-outline',
            'Private Account',
            'Only followers can see your posts',
            isPrivate,
            (val) => {
              setIsPrivate(val);
              updateSetting({ isPrivate: val });
            }
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interactions</Text>
          {renderSetting(
            'chatbubble-outline',
            'Allow Comments',
            'Let people comment on your posts',
            allowComments,
            (val) => {
              setAllowComments(val);
              updateSetting({ whoCanComment: val ? 'everyone' : 'off' });
            }
          )}
          {renderSetting(
            'at-outline',
            'Allow Mentions',
            'Let people mention you',
            allowMentions,
            (val) => {
              setAllowMentions(val);
              updateSetting({ mentionPermission: val ? 'everyone' : 'none' });
            }
          )}
          {renderSetting(
            'mail-outline',
            'Allow Messages',
            'Let people send you messages',
            allowMessages,
            (val) => {
              setAllowMessages(val);
              updateSetting({ whoCanMessage: val ? 'everyone' : 'followers' });
            }
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Status</Text>
          {renderSetting(
            'time-outline',
            'Show Activity Status',
            'Show when you were last active',
            showActivity,
            (val) => {
              setShowActivity(val);
              updateSetting({ showActivityStatus: val });
            }
          )}
          {renderSetting(
            'radio-button-on-outline',
            'Show Online Status',
            'Show when you are online',
            showOnline,
            (val) => {
              setShowOnline(val);
              updateSetting({ hideOnlineStatus: !val });
            }
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Options</Text>
          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate('BlockedUsers' as never)}
          >
            <Ionicons name="ban-outline" size={20} color={colors.text.primary} />
            <Text style={styles.optionText}>Blocked Accounts</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate('MutedAccounts' as never)}
          >
            <Ionicons name="volume-mute-outline" size={20} color={colors.text.primary} />
            <Text style={styles.optionText}>Muted Accounts</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate('CloseFriends' as never)}
          >
            <Ionicons name="star-outline" size={20} color={colors.text.primary} />
            <Text style={styles.optionText}>Close Friends</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.md,
  },
  optionText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
});
