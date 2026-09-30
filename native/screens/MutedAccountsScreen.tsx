import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import type { User } from '../types/database';
import { Avatar } from '../components/ui/Avatar';
import { ButtonLoadingSkeleton, ScreenSkeleton } from '../components/ui/LoadingSkeleton';
import { spacing, typography, useColors } from '../styles/theme';
import { FlashList } from '@shopify/flash-list';

export default function MutedAccountsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [mutedUsers, setMutedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadMutedUsers = useCallback(async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);
      const mutedIds = await userService.getMutedUsers(user.userId);
      const profiles = await Promise.all(mutedIds.map((id) => userService.getUser(id)));
      setMutedUsers(profiles.filter((item): item is User => item !== null));
    } catch (error) {
      console.error('Failed to load muted users:', error);
      setMutedUsers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    void loadMutedUsers();
  }, [loadMutedUsers]);

  const handleUnmute = async (targetUserId: string) => {
    if (!user?.userId || savingId) return;

    try {
      setSavingId(targetUserId);
      await userService.unmuteUser(user.userId, targetUserId);
      setMutedUsers((prev) => prev.filter((item) => item.userId !== targetUserId));
    } catch (error) {
      console.error('Failed to unmute user:', error);
      Alert.alert('Unmute failed', 'This account could not be unmuted right now.');
    } finally {
      setSavingId(null);
    }
  };

  const renderItem = ({ item }: { item: User }) => {
    const saving = savingId === item.userId;
    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.profileArea}
          onPress={() => navigation.navigate('Profile', { username: item.username })}
          activeOpacity={0.78}
        >
          <Avatar source={item.avatarURL} size={52} fallbackText={item.displayName || item.username} />
          <View style={styles.profileCopy}>
            <Text style={styles.displayName} numberOfLines={1}>{item.displayName || item.username}</Text>
            <Text style={styles.username} numberOfLines={1}>@{item.username}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, saving && styles.actionButtonDisabled]}
          onPress={() => handleUnmute(item.userId)}
          disabled={saving}
          activeOpacity={0.82}
        >
          {saving ? <ButtonLoadingSkeleton width={52} /> : <Text style={styles.actionText}>Unmute</Text>}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={24} color={c.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Muted Accounts</Text>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <ScreenSkeleton variant="list" rows={6} />
      ) : (
        <FlashList estimatedItemSize={100}
          data={mutedUsers}
          renderItem={renderItem}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={(mutedUsers.length === 0 ? styles.emptyContent : styles.listContent) as any}
          ListHeaderComponent={
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>Muted without blocking</Text>
              <Text style={styles.heroText}>Muted accounts stay out of your main social signal flow while their profile relationship remains intact.</Text>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>{mutedUsers.length} muted</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="volume-medium-outline" size={44} color={c.text.muted} />
              <Text style={styles.emptyTitle}>No muted accounts</Text>
              <Text style={styles.emptyText}>Accounts you mute from profiles will appear here for quick review.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
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
    headerButton: { width: 28, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: typography.fontSize.lg, fontWeight: '700' as any, color: c.text.primary },
    listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
    emptyContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
    heroCard: {
      backgroundColor: c.background.tertiary,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border.subtle,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    heroTitle: { fontSize: typography.fontSize.lg, fontWeight: '700' as any, color: c.text.primary, marginBottom: 6 },
    heroText: { fontSize: typography.fontSize.sm, lineHeight: 20, color: c.text.secondary, marginBottom: spacing.md },
    heroPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: c.background.secondary,
      borderWidth: 1,
      borderColor: c.border.subtle,
    },
    heroPillText: { fontSize: 12, fontWeight: '700' as any, color: c.text.primary },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 84,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: c.background.tertiary,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border.subtle,
    },
    profileArea: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.md },
    profileCopy: { flex: 1, marginLeft: spacing.md },
    displayName: { fontSize: typography.fontSize.base, fontWeight: '600' as any, color: c.text.primary },
    username: { marginTop: 2, fontSize: typography.fontSize.sm, color: c.text.secondary },
    actionButton: {
      minWidth: 88,
      height: 40,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${c.accent.primary}22`,
      borderWidth: 1,
      borderColor: `${c.accent.primary}4A`,
      paddingHorizontal: 14,
    },
    actionButtonDisabled: { opacity: 0.72 },
    actionText: { fontSize: typography.fontSize.sm, fontWeight: '700' as any, color: c.text.primary },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
    emptyTitle: { marginTop: spacing.md, fontSize: typography.fontSize.lg, fontWeight: '700' as any, color: c.text.primary },
    emptyText: { marginTop: spacing.sm, fontSize: typography.fontSize.sm, lineHeight: 20, color: c.text.secondary, textAlign: 'center' },
  });
