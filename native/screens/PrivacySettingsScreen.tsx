import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing, typography, useColors } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { settingsService } from '../services/settings.service';

export default function PrivacySettingsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const intro = useRef(new Animated.Value(0)).current;
  const [privacy, setPrivacy] = useState({
    isPrivate: false,
    showActivityStatus: true,
    showReadReceipts: true,
    hideLastSeen: false,
    hideOnlineStatus: false,
  });
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});

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
        const p = await settingsService.getPrivacySettings(user.userId);
        setPrivacy({
          isPrivate: !!p.isPrivate,
          showActivityStatus: !!p.showActivityStatus,
          showReadReceipts: !!p.showReadReceipts,
          hideLastSeen: !!p.hideLastSeen,
          hideOnlineStatus: !!p.hideOnlineStatus,
        });
      } catch {
        // ignore for now
      }
    };
    load();
  }, [user?.userId]);

  const privacyCount = Object.values(privacy).filter(Boolean).length;

  const update = async (key: keyof typeof privacy, value: boolean) => {
    if (savingKeys[key]) return;

    setSavingKeys((prev) => ({ ...prev, [key]: true }));
    setPrivacy((prev) => ({ ...prev, [key]: value }));
    try {
      if (user) {
        await settingsService.updatePrivacySettings(user.userId, { [key]: value } as any);
      }
    } catch {
      setPrivacy((prev) => ({ ...prev, [key]: !value }));
    } finally {
      setSavingKeys((prev) => ({ ...prev, [key]: false }));
    }
  };

  const ToggleRow = ({
    icon,
    title,
    value,
    onChange,
    settingKey,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value: boolean;
    onChange: (v: boolean) => void;
    settingKey: string;
  }) => {
    const isSaving = !!savingKeys[settingKey];

    return (
      <View style={[styles.row, isSaving && styles.rowDisabled]}>
        <View style={styles.left}>
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={18} color={c.accent.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
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

  const NavRow = ({ icon, title, routeName }: { icon: keyof typeof Ionicons.glyphMap; title: string; routeName: string }) => (
    <TouchableOpacity style={styles.row} onPress={() => (navigation as any).navigate(routeName)} activeOpacity={0.78}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={18} color={c.accent.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.text.muted} />
    </TouchableOpacity>
  );

  const translateY = intro.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={24} color={c.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={styles.headerButton} />
      </View>

      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer as any}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: intro, transform: [{ translateY }] }}>
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Private by choice</Text>
            <Text style={styles.heroText}>Control visibility, message signals, and activity state without repeated write churn.</Text>
            <View style={styles.heroPillRow}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>{privacy.isPrivate ? 'Private account' : 'Public account'}</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>{privacyCount}/5 active</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Privacy</Text>
            <View style={styles.card}>
              <ToggleRow icon="lock-closed" title="Private Account" value={privacy.isPrivate} onChange={(v) => update('isPrivate', v)} settingKey="isPrivate" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity</Text>
            <View style={styles.card}>
              <ToggleRow icon="pulse" title="Show Activity Status" value={privacy.showActivityStatus} onChange={(v) => update('showActivityStatus', v)} settingKey="showActivityStatus" />
              <ToggleRow icon="checkmark-done" title="Show Read Receipts" value={privacy.showReadReceipts} onChange={(v) => update('showReadReceipts', v)} settingKey="showReadReceipts" />
              <ToggleRow icon="time" title="Hide Last Seen" value={privacy.hideLastSeen} onChange={(v) => update('hideLastSeen', v)} settingKey="hideLastSeen" />
              <ToggleRow icon="wifi" title="Hide Online Status" value={privacy.hideOnlineStatus} onChange={(v) => update('hideOnlineStatus', v)} settingKey="hideOnlineStatus" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interactions</Text>
            <View style={styles.card}>
              <NavRow icon="chatbubble" title="Who Can Message You" routeName="MessagePrivacy" />
              <NavRow icon="pricetag" title="Who Can Tag You" routeName="TagPrivacy" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stories</Text>
            <View style={styles.card}>
              <NavRow icon="eye-off" title="Hide Story From" routeName="HideStory" />
              <NavRow icon="star" title="Close Friends" routeName="CloseFriends" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety</Text>
            <View style={styles.card}>
              <NavRow icon="ban" title="Blocked Users" routeName="BlockedUsers" />
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
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700' as any,
    color: c.text.primary,
  },
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
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: c.background.tertiary,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.border.subtle,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 68,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.border.subtle,
  },
  rowDisabled: {
    opacity: 0.62,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.md },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    backgroundColor: `${c.accent.primary}16`,
  },
  title: { fontSize: typography.fontSize.base, fontWeight: '600' as any, color: c.text.primary },
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
