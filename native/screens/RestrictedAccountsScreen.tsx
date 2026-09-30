import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { settingsService } from '../services/settings.service';
import { userService } from '../services/user.service';
import { colors, spacing, typography } from '../styles/theme';
import { ScreenSkeleton, InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

export default function RestrictedAccountsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [restricted, setRestricted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRestricted();
  }, [user]);

  const loadRestricted = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const filters = await settingsService.getContentFilters(user.userId);
      const ids = filters.restrictedAccounts || [];
      const profiles = await Promise.all(ids.map((id) => userService.getUser(id)));
      setRestricted(profiles.filter((p): p is any => p !== null));
    } catch (error) {
      console.error('Failed to load restricted accounts:', error);
      setRestricted([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnrestrict = async (targetUserId: string) => {
    if (!user || processingId) return;
    Alert.alert('Unrestrict', 'Remove this account from restricted list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unrestrict',
        onPress: async () => {
          try {
            setProcessingId(targetUserId);
            const filters = await settingsService.getContentFilters(user.userId);
            const next = (filters.restrictedAccounts || []).filter((id) => id !== targetUserId);
            await settingsService.updateContentFilters(user.userId, { restrictedAccounts: next });
            setRestricted((prev) => prev.filter((u) => u.userId !== targetUserId));
          } catch (error) {
            console.error('Failed to unrestrict account:', error);
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Restricted Accounts</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.info}>
        <Text style={styles.infoText}>
          Restricted accounts can't see when you're online or if you've read their messages. They won't be notified.
        </Text>
      </View>

      {loading ? (
        <ScreenSkeleton variant="list" rows={6} />
      ) : (
        <FlashList estimatedItemSize={100}
          data={restricted}
          renderItem={({ item }) => (
            <View style={styles.user}>
              <TouchableOpacity
                style={styles.userInfo}
                onPress={() => (navigation as any).navigate('UserProfile', { userId: item.userId })}
              >
                <Image source={{ uri: item.avatarURL || '' }} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.displayName || item.username}</Text>
                  <Text style={styles.username}>@{item.username}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => handleUnrestrict(item.userId)}
                disabled={processingId === item.userId}
              >
                {processingId === item.userId ? (
                  <InlineLoadingSkeleton />
                ) : (
                  <Text style={styles.btnText}>Unrestrict</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.userId}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="hand-left-outline" size={64} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No restricted accounts</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary },
  info: { padding: spacing.lg, backgroundColor: colors.background.secondary },
  infoText: { fontSize: typography.fontSize.sm, color: colors.text.secondary, lineHeight: 20 },
  user: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  name: { flex: 1, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary },
  username: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: 2 },
  btn: { alignSelf: 'flex-start', backgroundColor: colors.accent.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginLeft: 62, minWidth: 96, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: typography.fontSize.base, color: colors.text.secondary, marginTop: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});



