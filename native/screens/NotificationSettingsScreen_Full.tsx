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
import { settingsService } from '../services/settings.service';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [likesNotif, setLikesNotif] = useState(true);
  const [commentsNotif, setCommentsNotif] = useState(true);
  const [followsNotif, setFollowsNotif] = useState(true);
  const [messagesNotif, setMessagesNotif] = useState(true);
  const [storiesNotif, setStoriesNotif] = useState(true);
  const [mentionsNotif, setMentionsNotif] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const settings = await settingsService.getNotificationPreferences(user.userId);
      setLikesNotif(settings.likes !== false);
      setCommentsNotif(settings.comments !== false);
      setFollowsNotif(settings.follows !== false);
      setMessagesNotif(settings.messages !== false);
      setStoriesNotif(settings.stories !== false);
      setMentionsNotif(settings.mentions !== false);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    if (!user) return;
    // 'pushEnabled' is a local-only master toggle with no persisted field.
    if (key === 'pushEnabled') return;

    try {
      await settingsService.updateNotificationPreferences(user.userId, {
        [key]: value,
      });
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const renderToggle = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (val: boolean) => void,
    key: string
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
        onValueChange={(val) => {
          onValueChange(val);
          updateSetting(key, val);
        }}
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
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          {renderToggle(
            'notifications-outline',
            'Push Notifications',
            'Enable all push notifications',
            pushEnabled,
            setPushEnabled,
            'pushEnabled'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          {renderToggle(
            'heart-outline',
            'Likes',
            'When someone likes your post',
            likesNotif,
            setLikesNotif,
            'likes'
          )}
          {renderToggle(
            'chatbubble-outline',
            'Comments',
            'When someone comments on your post',
            commentsNotif,
            setCommentsNotif,
            'comments'
          )}
          {renderToggle(
            'at-outline',
            'Mentions',
            'When someone mentions you',
            mentionsNotif,
            setMentionsNotif,
            'mentions'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social</Text>
          {renderToggle(
            'person-add-outline',
            'Follows',
            'When someone follows you',
            followsNotif,
            setFollowsNotif,
            'follows'
          )}
          {renderToggle(
            'film-outline',
            'Stories',
            'When people you follow post stories',
            storiesNotif,
            setStoriesNotif,
            'stories'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Messages</Text>
          {renderToggle(
            'mail-outline',
            'Direct Messages',
            'When you receive a message',
            messagesNotif,
            setMessagesNotif,
            'messages'
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
});
