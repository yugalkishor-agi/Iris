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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../components/ui/Avatar';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { useAuth } from '../contexts/AuthContext';
import { messageService } from '../services/message.service';
import { userService } from '../services/user.service';
import type { Conversation, User } from '../types/database';

type GroupConversation = Conversation & {
  createdBy?: string;
  groupDescription?: string;
};

function formatRemaining(untilMs: number): string {
  const remainingMs = untilMs - Date.now();
  if (remainingMs <= 0) return 'expired';
  const mins = Math.ceil(remainingMs / (60 * 1000));
  if (mins < 60) return `${mins}m left`;
  const hours = Math.ceil(mins / 60);
  if (hours < 24) return `${hours}h left`;
  const days = Math.ceil(hours / 24);
  return `${days}d left`;
}

export default function GroupInfoScreen() {
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
  const [joinRequestUsers, setJoinRequestUsers] = useState<User[]>([]);
  const [mutedEntries, setMutedEntries] = useState<Array<{ user: User; untilMs: number }>>([]);
  const [bannedEntries, setBannedEntries] = useState<Array<{ user: User; untilMs: number }>>([]);
  const [addMembersVisible, setAddMembersVisible] = useState(false);
  const [pendingVisible, setPendingVisible] = useState(false);
  const [mutedVisible, setMutedVisible] = useState(false);
  const [bannedVisible, setBannedVisible] = useState(false);
  const [memberActionsVisible, setMemberActionsVisible] = useState(false);
  const [memberActionTarget, setMemberActionTarget] = useState<User | null>(null);
  const [customMuteVisible, setCustomMuteVisible] = useState(false);
  const [customBanVisible, setCustomBanVisible] = useState(false);
  const [editIdentityVisible, setEditIdentityVisible] = useState(false);
  const [identityName, setIdentityName] = useState('');
  const [identityDescription, setIdentityDescription] = useState('');
  const [customMuteDays, setCustomMuteDays] = useState('');
  const [customMuteHours, setCustomMuteHours] = useState('');
  const [customMuteMinutes, setCustomMuteMinutes] = useState('60');
  const [customBanDays, setCustomBanDays] = useState('');
  const [customBanHours, setCustomBanHours] = useState('24');
  const [customBanMinutes, setCustomBanMinutes] = useState('');


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
      setJoinRequestUsers([]);
      setMutedEntries([]);
      setBannedEntries([]);
        return;
      }

      setGroup(conversation);
      const removedMembers = ((conversation as any)?.removedMembers || {}) as Record<string, { removedBy: string; removedAtMs: number }>;
      const participantIds = Array.isArray(conversation.participantIds) ? conversation.participantIds.filter((id) => !removedMembers[id]) : [];
      const joinRequests = Array.isArray((conversation as any)?.groupJoinRequests)
        ? ((conversation as any).groupJoinRequests as string[])
        : [];
      const muteMap = ((conversation as any)?.groupMemberMutes || {}) as Record<string, { mutedUntilMs?: number }>;
      const banMap = ((conversation as any)?.groupBans || {}) as Record<string, number>;
      const nowMs = Date.now();
      const activeMuteIds = Object.keys(muteMap).filter((id) => Number(muteMap[id]?.mutedUntilMs || 0) > nowMs);
      const activeBanIds = Object.keys(banMap).filter((id) => Number(banMap[id] || 0) > nowMs);

      const [memberUsers, followingIds, requestUsers, mutedUsers, bannedUsers] = await Promise.all([
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
        Promise.all(
          joinRequests.map(async (id) => {
            try {
              return await userService.getUser(id);
            } catch {
              return null;
            }
          })
        ),
        Promise.all(
          activeMuteIds.map(async (id) => {
            try {
              return await userService.getUser(id);
            } catch {
              return null;
            }
          })
        ),
        Promise.all(
          activeBanIds.map(async (id) => {
            try {
              return await userService.getUser(id);
            } catch {
              return null;
            }
          })
        ),
      ]);

      setMembers(memberUsers.filter((entry): entry is User => Boolean(entry?.userId)));
      setJoinRequestUsers(requestUsers.filter((entry): entry is User => Boolean(entry?.userId)));
      setMutedEntries(
        mutedUsers
          .filter((entry): entry is User => Boolean(entry?.userId))
          .map((entry) => ({ user: entry, untilMs: Number(muteMap[entry.userId]?.mutedUntilMs || 0) }))
          .filter((entry) => entry.untilMs > nowMs)
          .sort((a, b) => a.untilMs - b.untilMs)
      );
      setBannedEntries(
        bannedUsers
          .filter((entry): entry is User => Boolean(entry?.userId))
          .map((entry) => ({ user: entry, untilMs: Number(banMap[entry.userId] || 0) }))
          .filter((entry) => entry.untilMs > nowMs)
          .sort((a, b) => a.untilMs - b.untilMs)
      );

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
      setJoinRequestUsers([]);
      setMutedEntries([]);
      setBannedEntries([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user?.userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setIdentityName(group?.groupName || '');
    setIdentityDescription(group?.groupDescription || '');
  }, [group?.groupDescription, group?.groupName]);

  const adminIds = useMemo(() => (Array.isArray(group?.groupAdmins) ? group.groupAdmins : []), [group?.groupAdmins]);
  const canManageGroup = !!user?.userId && !!group && (adminIds.includes(user.userId) || group.createdBy === user.userId);
  const isOwner = !!user?.userId && group?.createdBy === user.userId;
  const joinApprovalEnabled = String((group as any)?.groupJoinMode || 'invite_only') === 'approval_required';
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
    const removedMembers = (((group as any)?.removedMembers) || {}) as Record<string, { removedBy: string; removedAtMs: number }>;
    const existing = new Set((group?.participantIds || []).filter((id) => Boolean(id) && !removedMembers[id]));
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


  const toDurationMinutes = useCallback((daysValue: string, hoursValue: string, minutesValue: string) => {
    const days = Math.max(0, Number(daysValue) || 0);
    const hours = Math.max(0, Number(hoursValue) || 0);
    const minutes = Math.max(0, Number(minutesValue) || 0);
    return Math.round(days * 24 * 60 + hours * 60 + minutes);
  }, []);

  const refreshGroup = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const handleSaveIdentity = useCallback(async () => {
    if (!conversationId || !user?.userId || !canManageGroup) return;
    const nextName = identityName.trim();
    if (!nextName) {
      Alert.alert('Invalid name', 'Group name cannot be empty.');
      return;
    }
    try {
      setMutating(true);
      await messageService.updateGroupConversation(conversationId, user.userId, {
        groupName: nextName,
        groupDescription: identityDescription.trim(),
      });
      setEditIdentityVisible(false);
      await refreshGroup();
    } catch (error: any) {
      Alert.alert('Update failed', String(error?.message || 'Try again.'));
    } finally {
      setMutating(false);
    }
  }, [canManageGroup, conversationId, identityDescription, identityName, refreshGroup, user?.userId]);

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

  const handleSetJoinApproval = useCallback(async (value: boolean) => {
    if (!conversationId || !user?.userId || !canManageGroup) return;
    const mode = value ? 'approval_required' : 'invite_only';
    try {
      setMutating(true);
      await messageService.updateGroupSecuritySettings(conversationId, user.userId, { groupJoinMode: mode });
      setGroup((prev) => (prev ? ({ ...prev, groupJoinMode: mode } as GroupConversation) : prev));
    } catch (error: any) {
      Alert.alert('Update failed', String(error?.message || 'Try again.'));
    } finally {
      setMutating(false);
    }
  }, [canManageGroup, conversationId, user?.userId]);

  const handleApproveJoinRequest = useCallback(async (memberId: string) => {
    if (!conversationId || !user?.userId || !canManageGroup) return;
    try {
      setMutating(true);
      await messageService.approveGroupJoinRequest(conversationId, user.userId, memberId);
      await refreshGroup();
    } catch (error: any) {
      Alert.alert('Approval failed', String(error?.message || 'Try again.'));
    } finally {
      setMutating(false);
    }
  }, [canManageGroup, conversationId, refreshGroup, user?.userId]);

  const handleRejectJoinRequest = useCallback(async (memberId: string) => {
    if (!conversationId || !user?.userId || !canManageGroup) return;
    try {
      setMutating(true);
      await messageService.rejectGroupJoinRequest(conversationId, user.userId, memberId);
      await refreshGroup();
    } catch (error: any) {
      Alert.alert('Rejection failed', String(error?.message || 'Try again.'));
    } finally {
      setMutating(false);
    }
  }, [canManageGroup, conversationId, refreshGroup, user?.userId]);

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

  const handleMemberMute = useCallback(async (member: User, durationMinutes: number) => {
    if (!conversationId || !user?.userId) return;
    try {
      setMutating(true);
      await messageService.setGroupMemberMute(conversationId, user.userId, member.userId, durationMinutes);
      await refreshGroup();
    } catch (error: any) {
      Alert.alert('Mute failed', String(error?.message || 'Try again.'));
    } finally {
      setMutating(false);
    }
  }, [conversationId, refreshGroup, user?.userId]);

  const handleMemberUnmute = useCallback(async (member: User) => {
    if (!conversationId || !user?.userId) return;
    try {
      setMutating(true);
      await messageService.clearGroupMemberMute(conversationId, user.userId, member.userId);
      await refreshGroup();
    } catch (error: any) {
      Alert.alert('Unmute failed', String(error?.message || 'Try again.'));
    } finally {
      setMutating(false);
    }
  }, [conversationId, refreshGroup, user?.userId]);

  const handleTemporaryBan = useCallback(async (member: User, durationHours: number) => {
    if (!conversationId || !user?.userId) return;
    try {
      setMutating(true);
      await messageService.temporarilyBanGroupMember(conversationId, user.userId, member.userId, durationHours);
      await refreshGroup();
    } catch (error: any) {
      Alert.alert('Ban failed', String(error?.message || 'Try again.'));
    } finally {
      setMutating(false);
    }
  }, [conversationId, refreshGroup, user?.userId]);

  const handleMemberUnban = useCallback(async (member: User) => {
    if (!conversationId || !user?.userId) return;
    try {
      setMutating(true);
      await messageService.clearGroupMemberBan(conversationId, user.userId, member.userId);
      await refreshGroup();
    } catch (error: any) {
      Alert.alert('Unban failed', String(error?.message || 'Try again.'));
    } finally {
      setMutating(false);
    }
  }, [conversationId, refreshGroup, user?.userId]);

  const handleApplyCustomMute = useCallback(async () => {
    if (!memberActionTarget) return;
    const duration = Math.min(Math.max(toDurationMinutes(customMuteDays, customMuteHours, customMuteMinutes), 1), 10080);
    if (!Number.isFinite(duration) || duration <= 0) {
      Alert.alert('Invalid duration', 'Enter a valid mute duration.');
      return;
    }
    setCustomMuteVisible(false);
    await handleMemberMute(memberActionTarget, duration);
  }, [customMuteDays, customMuteHours, customMuteMinutes, handleMemberMute, memberActionTarget, toDurationMinutes]);

  const handleApplyCustomBan = useCallback(async () => {
    if (!memberActionTarget) return;
    const totalMinutes = Math.min(Math.max(toDurationMinutes(customBanDays, customBanHours, customBanMinutes), 60), 24 * 30 * 60);
    const durationHours = Math.max(1, Math.ceil(totalMinutes / 60));
    setCustomBanVisible(false);
    await handleTemporaryBan(memberActionTarget, durationHours);
  }, [customBanDays, customBanHours, customBanMinutes, handleTemporaryBan, memberActionTarget, toDurationMinutes]);


  const handleDeleteGroup = useCallback(() => {
    if (!conversationId || !user?.userId || !isOwner) return;
    Alert.alert('Delete group', 'This will delete group for all members.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete group',
        style: 'destructive',
        onPress: async () => {
          try {
            setMutating(true);
            await messageService.deleteGroupConversation(conversationId, user.userId);
            (navigation as any).navigate('Messages');
          } catch (error: any) {
            Alert.alert('Delete failed', String(error?.message || 'Try again.'));
          } finally {
            setMutating(false);
          }
        },
      },
    ]);
  }, [conversationId, isOwner, navigation, user?.userId]);


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
    setMemberActionTarget(member);
    setMemberActionsVisible(true);
  }, []);

  const closeMemberActions = useCallback(() => {
    setMemberActionsVisible(false);
    setMemberActionTarget(null);
  }, []);

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

  const targetIsOwner = memberActionTarget?.userId === group.createdBy;
  const targetIsAdmin = !!memberActionTarget?.userId && adminIds.includes(memberActionTarget.userId);
  const targetIsSelf = memberActionTarget?.userId === user?.userId;
  const groupMemberMuteMap = (((group as any)?.groupMemberMutes || {}) as Record<string, { mutedUntilMs?: number }>);
  const targetMuteUntilMs = memberActionTarget?.userId ? Number(groupMemberMuteMap[memberActionTarget.userId]?.mutedUntilMs || 0) : 0;
  const targetIsMuted = targetMuteUntilMs > Date.now();

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
          <TouchableOpacity style={styles.identityButton} onPress={() => setEditIdentityVisible(true)} disabled={!canManageGroup}>
            <Ionicons name="color-wand-outline" size={16} color="#e2e8f0" />
            <Text style={styles.identityButtonText}>Edit group identity</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingLabel}>Join request approval</Text>
              <Text style={styles.settingHint}>ON = user request can come, OFF = request disabled.</Text>
            </View>
            <Switch
              value={joinApprovalEnabled}
              onValueChange={handleSetJoinApproval}
              disabled={!canManageGroup || mutating}
              trackColor={{ false: 'rgba(148,163,184,0.22)', true: '#8b5cf6' }}
              thumbColor="#f8fafc"
            />
          </View>

          <View style={styles.metricsRow}>
            <TouchableOpacity style={styles.metricChip} onPress={() => setPendingVisible(true)} disabled={!canManageGroup}>
              <Ionicons name="mail-open" size={12} color="#cbd5e1" />
              <Text style={styles.metricText}>{joinRequestUsers.length} pending</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.metricChip} onPress={() => setMutedVisible(true)} disabled={!canManageGroup}>
              <Ionicons name="mic-off" size={12} color="#cbd5e1" />
              <Text style={styles.metricText}>{mutedEntries.length} muted</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.metricChip} onPress={() => setBannedVisible(true)} disabled={!canManageGroup}>
              <Ionicons name="ban" size={12} color="#fca5a5" />
              <Text style={styles.metricText}>{bannedEntries.length} banned</Text>
            </TouchableOpacity>
          </View>
        </View>

        {canManageGroup ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Members Management</Text>
            <Text style={styles.settingHint}>Open add-members panel and search users.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setAddMembersVisible(true)}>
              <Ionicons name="person-add" size={16} color="#0b1020" />
              <Text style={styles.primaryButtonText}>Add members</Text>
            </TouchableOpacity>
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
              <View key={member.userId} style={styles.memberRow}>
                <TouchableOpacity style={styles.memberMainTap} onPress={() => (navigation as any).navigate('UserProfile', { userId: member.userId })} activeOpacity={0.82}>
                  <Avatar source={member.avatarURL} size={48} fallbackText={member.displayName || member.username} />
                  <View style={styles.memberMeta}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{member.displayName || member.username}</Text>
                      {member.verified ? <VerifiedBadge size={13} style={styles.memberVerifiedBadge} /> : null}
                      <View style={styles.rolePill}><Text style={styles.rolePillText}>{role}</Text></View>
                    </View>
                    <Text style={styles.memberUsername}>@{member.username}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.memberActionButton} onPress={() => openMemberActions(member)}>
                  <Ionicons name="ellipsis-horizontal" size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Exit</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleLeaveGroup}>
            <Ionicons name="exit-outline" size={18} color="#fecaca" />
            <Text style={styles.dangerButtonText}>Leave this group</Text>
          </TouchableOpacity>
          {isOwner ? (
            <TouchableOpacity style={[styles.dangerButton, styles.deleteGroupButton]} onPress={handleDeleteGroup}>
              <Ionicons name="trash-outline" size={18} color="#fecaca" />
              <Text style={styles.dangerButtonText}>Delete group</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={addMembersVisible} transparent animationType="slide" onRequestClose={() => setAddMembersVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheetCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add Members</Text>
              <TouchableOpacity onPress={() => setAddMembersVisible(false)}>
                <Ionicons name="close" size={20} color="#cbd5e1" />
              </TouchableOpacity>
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
            <ScrollView style={styles.modalList}>
              {candidates.slice(0, 40).map((entry) => {
                const selected = selectedAddIds.has(entry.userId);
                return (
                  <TouchableOpacity key={entry.userId} style={[styles.candidateRow, selected && styles.candidateRowSelected]} onPress={() => toggleCandidate(entry.userId)}>
                    <Avatar source={entry.avatarURL} size={42} fallbackText={entry.displayName || entry.username} />
                    <View style={styles.candidateMeta}>
                      <View style={styles.nameInlineRow}>
                        <Text style={styles.candidateName}>{entry.displayName || entry.username}</Text>
                        {entry.verified ? <VerifiedBadge size={12} style={styles.memberVerifiedBadge} /> : null}
                      </View>
                      <Text style={styles.candidateUsername}>@{entry.username}</Text>
                    </View>
                    <View style={[styles.candidateCheck, selected && styles.candidateCheckSelected]}>
                      {selected ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {candidates.length === 0 ? <Text style={styles.emptyHint}>No eligible people found.</Text> : null}
            </ScrollView>
            <TouchableOpacity style={styles.primaryButton} onPress={handleAddMembers} disabled={mutating || selectedAddIds.size === 0}>
              <Text style={styles.primaryButtonText}>Add {selectedAddIds.size}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={pendingVisible} transparent animationType="fade" onRequestClose={() => setPendingVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Pending Requests</Text>
              <TouchableOpacity onPress={() => setPendingVisible(false)}><Ionicons name="close" size={20} color="#cbd5e1" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {joinRequestUsers.length === 0 ? <Text style={styles.emptyHint}>No pending requests.</Text> : joinRequestUsers.map((entry) => (
                <View key={entry.userId} style={styles.requestRow}>
                  <TouchableOpacity style={styles.requestUser} onPress={() => (navigation as any).navigate("UserProfile", { userId: entry.userId })}>
                    <Avatar source={entry.avatarURL} size={40} fallbackText={entry.displayName || entry.username} />
                    <View style={styles.requestMeta}>
                      <View style={styles.nameInlineRow}>
                        <Text style={styles.candidateName}>{entry.displayName || entry.username}</Text>
                        {entry.verified ? <VerifiedBadge size={12} style={styles.memberVerifiedBadge} /> : null}
                      </View>
                      <Text style={styles.candidateUsername}>@{entry.username}</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.requestActions}>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectJoinRequest(entry.userId)}><Ionicons name="close" size={14} color="#fecaca" /></TouchableOpacity>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveJoinRequest(entry.userId)}><Ionicons name="checkmark" size={14} color="#0b1020" /></TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={mutedVisible} transparent animationType="fade" onRequestClose={() => setMutedVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Muted Users</Text>
              <TouchableOpacity onPress={() => setMutedVisible(false)}><Ionicons name="close" size={20} color="#cbd5e1" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {mutedEntries.length === 0 ? <Text style={styles.emptyHint}>No active mutes.</Text> : mutedEntries.map((entry) => (
                <View key={entry.user.userId} style={styles.requestRow}>
                  <TouchableOpacity style={styles.requestUser} onPress={() => (navigation as any).navigate("UserProfile", { userId: entry.user.userId })}>
                    <Avatar source={entry.user.avatarURL} size={40} fallbackText={entry.user.displayName || entry.user.username} />
                    <View style={styles.requestMeta}>
                      <Text style={styles.candidateName}>{entry.user.displayName || entry.user.username}</Text>
                      <Text style={styles.candidateUsername}>{formatRemaining(entry.untilMs)}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleMemberUnmute(entry.user)}><Text style={styles.actionText}>Unmute</Text></TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={bannedVisible} transparent animationType="fade" onRequestClose={() => setBannedVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Banned Users</Text>
              <TouchableOpacity onPress={() => setBannedVisible(false)}><Ionicons name="close" size={20} color="#cbd5e1" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {bannedEntries.length === 0 ? <Text style={styles.emptyHint}>No active bans.</Text> : bannedEntries.map((entry) => (
                <View key={entry.user.userId} style={styles.requestRow}>
                  <TouchableOpacity style={styles.requestUser} onPress={() => (navigation as any).navigate("UserProfile", { userId: entry.user.userId })}>
                    <Avatar source={entry.user.avatarURL} size={40} fallbackText={entry.user.displayName || entry.user.username} />
                    <View style={styles.requestMeta}>
                      <Text style={styles.candidateName}>{entry.user.displayName || entry.user.username}</Text>
                      <Text style={styles.candidateUsername}>{formatRemaining(entry.untilMs)}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleMemberUnban(entry.user)}><Text style={styles.actionText}>Unban</Text></TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={memberActionsVisible} transparent animationType="fade" onRequestClose={closeMemberActions}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{memberActionTarget?.displayName || memberActionTarget?.username || "Member"}</Text>
              <TouchableOpacity onPress={closeMemberActions}><Ionicons name="close" size={20} color="#cbd5e1" /></TouchableOpacity>
            </View>
            {memberActionTarget ? (
              <View style={styles.actionList}>
                <TouchableOpacity style={styles.sheetAction} onPress={() => { closeMemberActions(); (navigation as any).navigate('UserProfile', { userId: memberActionTarget.userId }); }}><Text style={styles.sheetActionText}>View profile</Text></TouchableOpacity>
                {canManageGroup && !targetIsOwner ? (
                  <TouchableOpacity style={styles.sheetAction} onPress={() => { closeMemberActions(); handleAdminToggle(memberActionTarget, !targetIsAdmin); }}><Text style={styles.sheetActionText}>{targetIsAdmin ? 'Remove admin' : 'Make admin'}</Text></TouchableOpacity>
                ) : null}
                {canManageGroup && !targetIsOwner && !targetIsSelf ? (
                  <>
                    {targetIsMuted ? (
                      <TouchableOpacity style={styles.sheetAction} onPress={() => { closeMemberActions(); handleMemberUnmute(memberActionTarget); }}><Text style={styles.sheetActionText}>Unmute</Text></TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.sheetAction} onPress={() => { setMemberActionsVisible(false); setCustomMuteDays(''); setCustomMuteHours(''); setCustomMuteMinutes('60'); setCustomMuteVisible(true); }}><Text style={styles.sheetActionText}>Mute member</Text></TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.sheetAction} onPress={() => { setMemberActionsVisible(false); setCustomBanDays(''); setCustomBanHours('24'); setCustomBanMinutes(''); setCustomBanVisible(true); }}><Text style={[styles.sheetActionText, styles.sheetActionDanger]}>Temporary ban</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.sheetAction} onPress={() => { closeMemberActions(); handleRemoveMember(memberActionTarget); }}><Text style={[styles.sheetActionText, styles.sheetActionDanger]}>Kick from group</Text></TouchableOpacity>
                  </>
                ) : null}
                {targetIsSelf ? (
                  <TouchableOpacity style={styles.sheetAction} onPress={() => { closeMemberActions(); handleLeaveGroup(); }}><Text style={[styles.sheetActionText, styles.sheetActionDanger]}>Leave group</Text></TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={editIdentityVisible} transparent animationType="fade" onRequestClose={() => setEditIdentityVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Group Identity</Text>
            <TextInput value={identityName} onChangeText={setIdentityName} placeholder="Group name" placeholderTextColor="#64748b" style={styles.modalInput} />
            <TextInput value={identityDescription} onChangeText={setIdentityDescription} placeholder="Description" placeholderTextColor="#64748b" style={[styles.modalInput, styles.modalInputTall]} multiline />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditIdentityVisible(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleSaveIdentity}><Text style={styles.modalConfirmText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={customMuteVisible} transparent animationType="fade" onRequestClose={() => setCustomMuteVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Mute For</Text>
            <View style={styles.durationRow}>
              <TextInput value={customMuteDays} onChangeText={setCustomMuteDays} keyboardType="number-pad" placeholder="Days" placeholderTextColor="#64748b" style={[styles.modalInput, styles.durationInput]} />
              <TextInput value={customMuteHours} onChangeText={setCustomMuteHours} keyboardType="number-pad" placeholder="Hours" placeholderTextColor="#64748b" style={[styles.modalInput, styles.durationInput]} />
              <TextInput value={customMuteMinutes} onChangeText={setCustomMuteMinutes} keyboardType="number-pad" placeholder="Min" placeholderTextColor="#64748b" style={[styles.modalInput, styles.durationInput]} />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setCustomMuteVisible(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleApplyCustomMute}><Text style={styles.modalConfirmText}>Mute</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={customBanVisible} transparent animationType="fade" onRequestClose={() => setCustomBanVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ban For</Text>
            <View style={styles.durationRow}>
              <TextInput value={customBanDays} onChangeText={setCustomBanDays} keyboardType="number-pad" placeholder="Days" placeholderTextColor="#64748b" style={[styles.modalInput, styles.durationInput]} />
              <TextInput value={customBanHours} onChangeText={setCustomBanHours} keyboardType="number-pad" placeholder="Hours" placeholderTextColor="#64748b" style={[styles.modalInput, styles.durationInput]} />
              <TextInput value={customBanMinutes} onChangeText={setCustomBanMinutes} keyboardType="number-pad" placeholder="Min" placeholderTextColor="#64748b" style={[styles.modalInput, styles.durationInput]} />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setCustomBanVisible(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleApplyCustomBan}><Text style={styles.modalConfirmText}>Ban</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  nameInlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  memberVerifiedBadge: { marginRight: 8 },
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
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  metricChip: {
    height: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    backgroundColor: 'rgba(15,23,42,0.62)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: { marginLeft: 6, color: '#cbd5e1', fontSize: 12, fontWeight: '700' },
  primaryButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButtonText: { marginLeft: 6, color: '#0b1020', fontSize: 14, fontWeight: '900' },
  memberMainTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  memberActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
  },
  deleteGroupButton: {
    marginTop: 10,
    backgroundColor: 'rgba(127,29,29,0.36)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(1,5,14,0.72)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    maxHeight: '86%',
    backgroundColor: '#070d1a',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 22,
  },
  modalCard: {
    marginHorizontal: 16,
    marginBottom: 22,
    borderRadius: 20,
    backgroundColor: '#070d1a',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    maxHeight: '82%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: { color: '#f8fafc', fontSize: 17, fontWeight: '800' },
  modalList: { maxHeight: 360 },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  requestUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  requestMeta: { flex: 1, marginLeft: 10 },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rejectBtn: {
    minWidth: 66,
    height: 32,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(127,29,29,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.26)',
    marginRight: 8,
  },
  approveBtn: {
    minWidth: 66,
    height: 32,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
  },
  actionText: { color: '#e2e8f0', fontSize: 12, fontWeight: '700' },
  actionList: {
    marginTop: 6,
  },
  sheetAction: {
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
  },
  sheetActionText: { color: '#f1f5f9', fontSize: 14, fontWeight: '700' },
  sheetActionDanger: { color: '#fca5a5' },
  modalInput: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalInputTall: {
    minHeight: 94,
    textAlignVertical: 'top',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  durationInput: {
    flex: 1,
    marginTop: 0,
    textAlign: 'center',
  },
  modalActions: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  modalCancel: {
    height: 36,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    backgroundColor: 'rgba(15,23,42,0.68)',
    marginRight: 8,
  },
  modalCancelText: { color: '#cbd5e1', fontSize: 13, fontWeight: '700' },
  modalConfirm: {
    height: 36,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
  },
  modalConfirmText: { color: '#0b1020', fontSize: 13, fontWeight: '900' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  loadingText: { color: '#94a3b8', fontSize: 14 },
  emptyText: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  emptyHint: { color: '#64748b', fontSize: 13, paddingVertical: 8 },
});





































