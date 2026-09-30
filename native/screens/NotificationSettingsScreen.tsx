import { InlineLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { settingsService } from '../services/settings.service';
import { spacing, typography, useColors } from '../styles/theme';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const intro = useRef(new Animated.Value(0)).current;
  const [prefs, setPrefs] = useState({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    stories: true,
    liveVideos: true,
    reels: true,
    messages: true,
    messageRequests: true,
    reminders: true,
    productUpdates: false,
  });
  const [loading, setLoading] = useState(false);
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});

  const pushEnabled =
    prefs.likes &&
    prefs.comments &&
    prefs.follows &&
    prefs.mentions &&
    prefs.stories &&
    prefs.liveVideos &&
    prefs.reels &&
    prefs.messages &&
    prefs.messageRequests;
  const enabledCount = Object.values(prefs).filter(Boolean).length;

  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [intro]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const p = await settingsService.getNotificationPreferences(user.userId);
        setPrefs((prev) => ({ ...prev, ...(p as any) }));
      } catch {
        // ignore for now
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.userId]);

  const updatePref = async (key: keyof typeof prefs, value: boolean) => {
    if (savingKeys[key]) return;

    setSavingKeys((prev) => ({ ...prev, [key]: true }));
    setPrefs((prev) => ({ ...prev, [key]: value }));
    try {
      if (user) {
        await settingsService.updateNotificationPreferences(user.userId, { [key]: value } as any);
      }
    } catch {
      setPrefs((prev) => ({ ...prev, [key]: !value }));
    } finally {
      setSavingKeys((prev) => ({ ...prev, [key]: false }));
    }
  };

  const updateAllPrefs = async (value: boolean) => {
    if (savingKeys.all) return;

    const next = {
      likes: value,
      comments: value,
      follows: value,
      mentions: value,
      stories: value,
      liveVideos: value,
      reels: value,
      messages: value,
      messageRequests: value,
      reminders: value,
      productUpdates: prefs.productUpdates,
    };
    setSavingKeys((prev) => ({ ...prev, all: true }));
    setPrefs((prev) => ({ ...prev, ...next }));
    try {
      if (user) await settingsService.updateNotificationPreferences(user.userId, next as any);
    } catch {
      // keep optimistic state even if backend fails; next refresh will reconcile
    } finally {
      setSavingKeys((prev) => ({ ...prev, all: false }));
    }
  };

  const Toggle = ({
    icon,
    label,
    value,
    onChange,
    settingKey,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
    settingKey: string;
  }) => {
    const isSaving = !!savingKeys[settingKey];

    return (
      <View style={[styles.item, isSaving && styles.itemDisabled]}>
        <View style={styles.itemLeft}>
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={18} color={c.accent.primary} />
          </View>
          <Text style={styles.itemTitle}>{label}</Text>
        </View>
        {isSaving ? (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Saving</Text>
          </View>
        ) : (
          <Switch
            value={!!value}
            onValueChange={onChange}
            disabled={isSaving}
            trackColor={{ false: c.border.light, true: `${c.accent.primary}40` }}
            thumbColor={value ? '#FFFFFF' : c.text.secondary}
          />
        )}
      </View>
    );
  };

  const translateY = intro.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={24} color={c.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerButton}>
          {loading ? <InlineLoadingSkeleton /> : null}
        </View>
      </View>

      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer as any}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: intro, transform: [{ translateY }] }}>
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Signal-first delivery</Text>
            <Text style={styles.heroText}>High-signal alerts stay easy to control, and repeated taps will not spam extra writes.</Text>
            <View style={styles.heroPillRow}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>{enabledCount}/11 live</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>{pushEnabled ? 'Priority on' : 'Limited'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Global</Text>
            <View style={styles.card}>
              <Toggle icon="notifications" label="Push Notifications" value={pushEnabled} onChange={updateAllPrefs} settingKey="all" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Posts & Media</Text>
            <View style={styles.card}>
              <Toggle icon="heart" label="Likes" value={prefs.likes} onChange={(v) => updatePref('likes', v)} settingKey="likes" />
              <Toggle icon="chatbubble" label="Comments" value={prefs.comments} onChange={(v) => updatePref('comments', v)} settingKey="comments" />
              <Toggle icon="at" label="Mentions" value={prefs.mentions} onChange={(v) => updatePref('mentions', v)} settingKey="mentions" />
              <Toggle icon="images" label="Stories" value={prefs.stories} onChange={(v) => updatePref('stories', v)} settingKey="stories" />
              <Toggle icon="videocam" label="Live Videos" value={prefs.liveVideos} onChange={(v) => updatePref('liveVideos', v)} settingKey="liveVideos" />
              <Toggle icon="play" label="Glimpses" value={prefs.reels} onChange={(v) => updatePref('reels', v)} settingKey="reels" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>People & Messages</Text>
            <View style={styles.card}>
              <Toggle icon="person-add" label="New Followers" value={prefs.follows} onChange={(v) => updatePref('follows', v)} settingKey="follows" />
              <Toggle icon="mail" label="Message Requests" value={prefs.messageRequests} onChange={(v) => updatePref('messageRequests', v)} settingKey="messageRequests" />
              <Toggle icon="chatbubbles" label="Message Notifications" value={prefs.messages} onChange={(v) => updatePref('messages', v)} settingKey="messages" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System</Text>
            <View style={styles.card}>
              <Toggle icon="alarm" label="Reminders" value={prefs.reminders} onChange={(v) => updatePref('reminders', v)} settingKey="reminders" />
              <Toggle icon="information-circle" label="Product Updates" value={prefs.productUpdates} onChange={(v) => updatePref('productUpdates', v)} settingKey="productUpdates" />
            </View>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.border.subtle,
  },
  headerButton: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '700' as any, color: c.text.primary },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  heroCard: {
    backgroundColor: c.background.tertiary,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: c.border.subtle,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700' as any,
    color: c.text.primary,
    marginBottom: 6,
  },
  heroText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: c.text.secondary,
    marginBottom: spacing.md,
  },
  heroPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  heroPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: c.background.secondary,
    borderWidth: 1,
    borderColor: c.border.subtle,
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: '700' as any,
    color: c.text.primary,
  },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700' as any,
    color: c.text.muted,
    paddingHorizontal: 4,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  card: {
    backgroundColor: c.background.tertiary,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.border.subtle,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 68,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.border.subtle,
  },
  itemDisabled: {
    opacity: 0.62,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.md },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    backgroundColor: `${c.accent.primary}16`,
  },
  itemTitle: { fontSize: typography.fontSize.base, fontWeight: '600' as any, color: c.text.primary },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: `${c.accent.primary}18`,
    borderWidth: 1,
    borderColor: `${c.accent.primary}36`,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700' as any,
    color: c.accent.primary,
  },
});
