import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { messageService } from '../services/message.service';
import { userService } from '../services/user.service';
import type { Conversation, User } from '../types/database';

type GroupConversation = Conversation & {
  createdBy?: string;
  groupDescription?: string;
};

export default function GroupChatSettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const conversationId = ((route.params as any)?.conversationId || (route.params as any)?.groupId) as string | undefined;

  const [group, setGroup] = useState<GroupConversation | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [selectedAddIds, setSelectedAddIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);

  const loadData = useCallback(async () => {
    if (!conversationId || !user?.userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const conversation = (await messageService.getConversation(conversationId)) as GroupConversation | null;
      if (!conversation) {
        setGroup(null);
        setMembers([]);
        setFollowing([]);
        return;
      }

      setGroup(conversation);
      const participantIds = Array.isArray(conversation.participantIds) ? conversation.participantIds : [];

      const [memberUsers, followingIds] = await Promise.all([
        Promise.all(
          participantIds.map(async (id) => {
            try {
              return await userService.getUser(id);
            } catch {
              return null;
            }
          })
        ),
        userService.getFollowing(user.userId, 120).catch(() => []),
      ]);

      const nextMembers = memberUsers.filter((entry): entry is User => Boolean(entry?.userId));
      setMembers(nextMembers);

      const followingUsers = await Promise.all(
        followingIds.map(async (id) => {
          try {
            return await userService.getUser(id);
          } catch {
            return null;
          }
        })
      );

      setFollowing(followingUsers.filter((entry): entry is User => Boolean(entry?.userId)));
    } catch (error) {
      console.error('Failed to load group settings:', error);
      setGroup(null);
      setMembers([]);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user?.userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const adminIds = useMemo(() => (Array.isArray(group?.groupAdmins) ? group.groupAdmins : []), [group?.groupAdmins]);
  const canManageGroup = !!user?.userId && !!group && (adminIds.includes(user.userId) || group.createdBy === user.userId);
  const isMuted = !!user?.userId && Array.isArray(group?.mutedBy) ? group!.mutedBy!.includes(user.userId) : false;

  const sortedMembers = useMemo(() => {
    const list = [...members];
    list.sort((a, b) => {
      const aWeight = a.userId === group?.createdBy ? 0 : adminIds.includes(a.userId) ? 1 : 2;
      const bWeight = b.userId === group?.createdBy ? 0 : adminIds.includes(b.userId) ? 1 : 2;
      if (aWeight !== bWeight) return aWeight - bWeight;
      return (a.displayName || a.username || '').localeCompare(b.displayName || b.username || '');
    });
    return list;
  }, [adminIds, group?.createdBy, members]);

  const candidates = useMemo(() => {
    const existing = new Set((group?.participantIds || []).filter(Boolean));
    const query = search.trim().toLowerCase();
    return following.filter((entry) => {
      if (!entry?.userId || existing.has(entry.userId)) return false;
      if (!query) return true;
      return (
        entry.username.toLowerCase().includes(query) ||
        (entry.displayName || '').toLowerCase().includes(query)
      );
    });
  }, [following, group?.participantIds, search]);

  const selectedCandidates = useMemo(
    () => following.filter((entry) => selectedAddIds.has(entry.userId)),
    [following, selectedAddIds]
  );

  const toggleCandidate = useCallback((userId: string) => {
    setSelectedAddIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const refreshGroup = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const handleAddMembers = useCallback(async () => {
    if (!conversationId || !user?.userId || selectedAddIds.size === 0) return;

    try {
      setMutating(true);
      await messageService.addGroupMembers(conversationId, user.userId, Array.from(selectedAddIds));
      setSelectedAddIds(new Set());
      setSearch('');
      await refreshGroup();
    } catch (error: any) {
      console.error('Failed to add members:', error);
      Alert.alert('Unable to add members', String(error?.message || 'Try again.'));
    } finally {
      setMutating(false);
    }
  }, [conversationId, refreshGroup, selectedAddIds, user?.userId]);

  const handleToggleMute = useCallback(async (value: boolean) => {
    if (!conversationId || !user?.userId) return;

    try {
      setMutating(true);
      if (value) await messageService.muteConversation(conversationId, user.userId);
      else await messageService.unmuteConversation(conversationId, user.userId);

      setGroup((prev) => {
        if (!prev) return prev;
        const mutedBy = Array.isArray(prev.mutedBy) ? [...prev.mutedBy] : [];
        const nextMutedBy = value
          ? Array.from(new Set([...mutedBy, user.userId]))
          : mutedBy.filter((id) => id !== user.userId);
        return { ...prev, mutedBy: nextMutedBy };
      });
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      Alert.alert('Update failed', 'Could not update notifications.');
    } finally {
      setMutating(false);
    }
  }, [conversationId, user?.userId]);

  const handleAdminToggle = useCallback((member: User, makeAdmin: boolean) => {
    if (!conversationId || !user?.userId) return;
    const actionLabel = makeAdmin ? 'Make admin' : 'Remove admin';
    Alert.alert(actionLabel, `${actionLabel} for ${member.displayName || member.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: actionLabel,
        onPress: async () => {
          try {
            setMutating(true);
            await messageService.setGroupAdmin(conversationId, user.userId, member.userId, makeAdmin);
            await refreshGroup();
          } catch (error: any) {
            console.error('Failed to update admin state:', error);
            Alert.alert('Update failed', String(error?.message || 'Try again.'));
          } finally {
            setMutating(false);
          }
        },
      },
    ]);
  }, [conversationId, refreshGroup, user?.userId]);

  const handleRemoveMember = useCallback((member: User) => {
    if (!conversationId || !user?.userId) return;
    Alert.alert('Remove member', `Remove ${member.displayName || member.username} from the group?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setMutating(true);
            await messageService.removeGroupMember(conversationId, user.userId, member.userId);
            await refreshGroup();
          } catch (error: any) {
            console.error('Failed to remove member:', error);
            Alert.alert('Remove failed', String(error?.message || 'Try again.'));
          } finally {
            setMutating(false);
          }
        },
      },
    ]);
  }, [conversationId, refreshGroup, user?.userId]);

  const handleLeaveGroup = useCallback(() => {
    if (!conversationId || !user?.userId) return;
    Alert.alert('Leave group', 'You will stop receiving messages from this group.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            setMutating(true);
            await messageService.leaveGroupConversation(conversationId, user.userId);
            (navigation as any).navigate('Messages');
          } catch (error: any) {
            console.error('Failed to leave group:', error);
            Alert.alert('Unable to leave', String(error?.message || 'Try again.'));
          } finally {
            setMutating(false);
          }
        },
      },
    ]);
  }, [conversationId, navigation, user?.userId]);

  const renderRole = useCallback((member: User) => {
    if (member.userId === group?.createdBy) return 'Owner';
    if (adminIds.includes(member.userId)) return 'Admin';
    return 'Member';
  }, [adminIds, group?.createdBy]);

  const openMemberActions = useCallback((member: User) => {
    const isOwner = member.userId === group?.createdBy;
    const isAdmin = adminIds.includes(member.userId);
    const isSelf = member.userId === user?.userId;

    const actions: any[] = [{ text: 'Cancel', style: 'cancel' }];

    if (canManageGroup && !isOwner) {
      actions.push({
        text: isAdmin ? 'Remove admin' : 'Make admin',
        onPress: () => handleAdminToggle(member, !isAdmin),
      });
    }

    if (canManageGroup && !isOwner && !isSelf) {
      actions.push({
        text: 'Remove from group',
        style: 'destructive',
        onPress: () => handleRemoveMember(member),
      });
    }

    if (isSelf) {
      actions.push({
        text: 'Leave group',
        style: 'destructive',
        onPress: handleLeaveGroup,
      });
    }

    Alert.alert(member.displayName || member.username, `Role: ${renderRole(member)}`, actions);
  }, [adminIds, canManageGroup, group?.createdBy, handleAdminToggle, handleLeaveGroup, handleRemoveMember, renderRole, user?.userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading group controls...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={22} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Settings</Text>
          <View style={styles.headerGhost} />
        </View>
        <View style={styles.loadingWrap}>
          <Text style={styles.emptyText}>Group not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Settings</Text>
        <TouchableOpacity onPress={refreshGroup} style={styles.headerButton}>
          {mutating ? <ActivityIndicator size="small" color="#cbd5e1" /> : <Ionicons name="refresh" size={18} color="#cbd5e1" />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent as any} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#12162b', '#18142e', '#0b1220']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Avatar
            source={group.groupAvatarURL}
            size={78}
            fallbackText={group.groupName || 'G'}
            style={styles.heroAvatar}
            fallbackStyle={styles.heroAvatarFallback}
            fallbackTextStyle={styles.heroAvatarFallbackText}
          />
          <Text style={styles.heroTitle}>{group.groupName || 'Group chat'}</Text>
          <Text style={styles.heroSubtitle} numberOfLines={2}>
            {group.groupDescription || 'Tuned for fast group chats, media and clean control.'}
          </Text>
          <TouchableOpacity style={styles.identityButton} onPress={() => (navigation as any).navigate('GroupInfo', { conversationId })}>
            <Ionicons name="color-wand-outline" size={16} color="#e2e8f0" />
            <Text style={styles.identityButtonText}>Edit group identity</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingLabel}>Mute notifications</Text>
              <Text style={styles.settingHint}>Silence this group for your inbox only.</Text>
            </View>
            <Switch
              value={isMuted}
              onValueChange={handleToggleMute}
              disabled={mutating}
              trackColor={{ false: 'rgba(148,163,184,0.22)', true: '#8b5cf6' }}
              thumbColor="#f8fafc"
            />
          </View>
        </View>

        {canManageGroup ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Add members</Text>
              {selectedAddIds.size > 0 ? (
                <TouchableOpacity style={styles.addActionButton} onPress={handleAddMembers} disabled={mutating}>
                  <Text style={styles.addActionButtonText}>Add {selectedAddIds.size}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color="#64748b" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search people you follow"
                placeholderTextColor="#64748b"
                style={styles.searchInput}
              />
            </View>
            {selectedCandidates.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedStrip as any}>
                {selectedCandidates.map((entry) => (
                  <TouchableOpacity key={entry.userId} style={styles.selectedChip} onPress={() => toggleCandidate(entry.userId)}>
                    <Avatar source={entry.avatarURL} size={24} fallbackText={entry.displayName || entry.username} />
                    <Text style={styles.selectedChipText}>{entry.username}</Text>
                    <Ionicons name="close" size={12} color="#94a3b8" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
            <View style={styles.candidateList}>
              {candidates.slice(0, 10).map((entry) => {
                const selected = selectedAddIds.has(entry.userId);
                return (
                  <TouchableOpacity key={entry.userId} style={[styles.candidateRow, selected && styles.candidateRowSelected]} onPress={() => toggleCandidate(entry.userId)}>
                    <Avatar source={entry.avatarURL} size={42} fallbackText={entry.displayName || entry.username} />
                    <View style={styles.candidateMeta}>
                      <Text style={styles.candidateName}>{entry.displayName || entry.username}</Text>
                      <Text style={styles.candidateUsername}>@{entry.username}</Text>
                    </View>
                    <View style={[styles.candidateCheck, selected && styles.candidateCheckSelected]}>
                      {selected ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {candidates.length === 0 ? <Text style={styles.emptyHint}>No eligible people found.</Text> : null}
            </View>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Members</Text>
            <Text style={styles.sectionMeta}>{sortedMembers.length}</Text>
          </View>
          {sortedMembers.map((member) => {
            const role = renderRole(member);
            return (
              <TouchableOpacity key={member.userId} style={styles.memberRow} onPress={() => openMemberActions(member)} activeOpacity={0.82}>
                <Avatar source={member.avatarURL} size={48} fallbackText={member.displayName || member.username} />
                <View style={styles.memberMeta}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{member.displayName || member.username}</Text>
                    <View style={styles.rolePill}><Text style={styles.rolePillText}>{role}</Text></View>
                  </View>
                  <Text style={styles.memberUsername}>@{member.username}</Text>
                </View>
                <Ionicons name="ellipsis-horizontal" size={18} color="#94a3b8" />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Exit</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleLeaveGroup}>
            <Ionicons name="exit-outline" size={18} color="#fecaca" />
            <Text style={styles.dangerButtonText}>Leave this group</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
  },
  headerGhost: { width: 38, height: 38 },
  headerTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 28 },
  hero: {
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
  },
  heroAvatar: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.14)' },
  heroAvatarFallback: { backgroundColor: '#6d28d9' },
  heroAvatarFallbackText: { color: '#ffffff', fontWeight: '800' },
  heroTitle: { marginTop: 14, color: '#f8fafc', fontSize: 26, fontWeight: '800', textAlign: 'center' },
  heroSubtitle: { marginTop: 8, color: '#cbd5e1', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  identityButton: {
    marginTop: 16,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
  },
  identityButtonText: { marginLeft: 8, color: '#e2e8f0', fontWeight: '700', fontSize: 13 },
  sectionCard: {
    backgroundColor: '#0b1220',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    marginBottom: 14,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '800' },
  sectionMeta: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingCopy: { flex: 1, paddingRight: 16 },
  settingLabel: { color: '#f8fafc', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  settingHint: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
  searchWrap: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#111b2d',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, color: '#f8fafc', paddingLeft: 10, fontSize: 14 },
  selectedStrip: { paddingTop: 12, paddingBottom: 8 },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#111b2d',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    marginRight: 8,
  },
  selectedChipText: { marginHorizontal: 8, color: '#e2e8f0', fontSize: 12, fontWeight: '700' },
  addActionButton: {
    minWidth: 70,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addActionButtonText: { color: '#08111f', fontSize: 13, fontWeight: '800' },
  candidateList: { marginTop: 12 },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  candidateRowSelected: {
    opacity: 0.95,
  },
  candidateMeta: { flex: 1, marginLeft: 12, marginRight: 12 },
  candidateName: { color: '#f8fafc', fontSize: 15, fontWeight: '700' },
  candidateUsername: { marginTop: 2, color: '#94a3b8', fontSize: 13 },
  candidateCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  candidateCheckSelected: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  memberMeta: { flex: 1, marginLeft: 14, marginRight: 12 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
  memberName: { color: '#f8fafc', fontSize: 15, fontWeight: '700', marginRight: 8 },
  memberUsername: { color: '#94a3b8', fontSize: 13 },
  rolePill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(139,92,246,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.24)',
  },
  rolePillText: { color: '#d8b4fe', fontSize: 11, fontWeight: '800' },
  dangerButton: {
    height: 46,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(127,29,29,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
  },
  dangerButtonText: { marginLeft: 8, color: '#fecaca', fontSize: 14, fontWeight: '800' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  loadingText: { color: '#94a3b8', fontSize: 14 },
  emptyText: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  emptyHint: { color: '#64748b', fontSize: 13, paddingVertical: 8 },
});




