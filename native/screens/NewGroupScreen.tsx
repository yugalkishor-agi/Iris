import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { messageService } from '../services/message.service';
import { mediaService } from '../services/media.service.native';
import { Avatar } from '../components/ui/Avatar';
import { ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import type { User } from '../types/database';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const MIN_OTHER_MEMBERS = 2;

export default function NewGroupScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();

  const preselectedUserId = (route.params as any)?.userId;
  const preselectedUserIds = ((route.params as any)?.userIds || []) as string[];
  const suggestedNameParam = ((route.params as any)?.suggestedName || '') as string;

  const [groupName, setGroupName] = useState(suggestedNameParam);
  const [nameTouched, setNameTouched] = useState(Boolean(suggestedNameParam.trim()));
  const [groupIcon, setGroupIcon] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [following, setFollowing] = useState<User[]>([]);
  const [selectedFallbackUsers, setSelectedFallbackUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const loadFollowing = useCallback(async () => {
    if (!user?.userId) {
      setFollowing([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const followingIds = await userService.getFollowing(user.userId, 120);
      const users = await Promise.all(
        followingIds.map(async (targetUserId) => {
          try {
            return await userService.getUser(targetUserId);
          } catch {
            return null;
          }
        })
      );

      const loaded = users
        .filter((item): item is User => Boolean(item?.userId))
        .filter((item) => item.userId !== user.userId);

      loaded.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
      setFollowing(loaded);
    } catch (error) {
      console.error('Failed to load following:', error);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadFollowing();
  }, [loadFollowing]);

  useEffect(() => {
    const seed = new Set<string>();
    if (preselectedUserId && preselectedUserId !== user?.userId) seed.add(preselectedUserId);
    preselectedUserIds.forEach((id) => {
      if (id && id !== user?.userId) seed.add(id);
    });

    if (seed.size > 0) {
      setSelectedUsers(seed);
    }
  }, [preselectedUserId, preselectedUserIds.join('|'), user?.userId]);

  useEffect(() => {
    if (selectedUsers.size === 0) return;

    const knownIds = new Set<string>([
      ...following.map((entry) => entry.userId),
      ...Object.keys(selectedFallbackUsers),
    ]);

    const missingIds = Array.from(selectedUsers).filter((id) => !knownIds.has(id));
    if (missingIds.length === 0) return;

    let cancelled = false;
    Promise.all(
      missingIds.map(async (id) => {
        try {
          const result = await userService.getUser(id);
          return result;
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (cancelled) return;
      const next: Record<string, User> = {};
      results.forEach((item) => {
        if (item?.userId) {
          next[item.userId] = item;
        }
      });
      if (Object.keys(next).length > 0) {
        setSelectedFallbackUsers((prev) => ({ ...prev, ...next }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedUsers, following, selectedFallbackUsers]);

  const allKnownUsers = useMemo(() => {
    const map = new Map<string, User>();
    following.forEach((entry) => map.set(entry.userId, entry));
    Object.values(selectedFallbackUsers).forEach((entry) => map.set(entry.userId, entry));
    return map;
  }, [following, selectedFallbackUsers]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return following;
    const q = search.trim().toLowerCase();
    return following.filter(
      (entry) =>
        entry.username.toLowerCase().includes(q) ||
        (entry.displayName || '').toLowerCase().includes(q)
    );
  }, [search, following]);

  const selectedList = useMemo(
    () => Array.from(selectedUsers).map((id) => allKnownUsers.get(id)).filter((entry): entry is User => Boolean(entry)),
    [selectedUsers, allKnownUsers]
  );

  const computedSuggestedName = useMemo(() => {
    if (suggestedNameParam) return suggestedNameParam;
    const names = selectedList.map((entry) => entry.username || entry.displayName).filter(Boolean);
    if (names.length === 0) return '';
    if (names.length <= 2) return names.join(', ');
    return `${names[0]}, ${names[1]} and others`;
  }, [selectedList, suggestedNameParam]);

  useEffect(() => {
    if (!nameTouched && computedSuggestedName) {
      setGroupName(computedSuggestedName);
    }
  }, [computedSuggestedName, nameTouched]);

  const previewMemberLabel = useMemo(() => {
    if (selectedList.length === 0) return 'Pick people to shape the group vibe.';
    if (selectedList.length === 1) return `${selectedList[0].username} is ready to join.`;
    if (selectedList.length === 2) return `${selectedList[0].username} and ${selectedList[1].username} are in.`;
    return `${selectedList[0].username}, ${selectedList[1].username} and ${selectedList.length - 2} others are in.`;
  }, [selectedList]);

  const toggleUser = (userId: string) => {
    if (!userId || userId === user?.userId) return;

    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handlePickIcon = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo access to choose a group image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setGroupIcon(result.assets[0].uri);
    }
  };

  const handleCreateGroup = async () => {
    if (!user?.userId) return;

    const memberIds = Array.from(selectedUsers).filter((id) => id && id !== user.userId);
    if (memberIds.length < MIN_OTHER_MEMBERS) {
      Alert.alert('Select Members', `Select at least ${MIN_OTHER_MEMBERS} members to create a group.`);
      return;
    }

    setCreating(true);
    try {
      const finalGroupName = groupName.trim() || computedSuggestedName || 'New group';
      let uploadedGroupIconUrl: string | undefined;

      if (groupIcon) {
        if (/^https?:\/\//i.test(groupIcon)) {
          uploadedGroupIconUrl = groupIcon;
        } else {
          try {
            uploadedGroupIconUrl = await mediaService.uploadAvatar(user.userId, {
              uri: groupIcon,
              type: 'image',
              mimeType: 'image/jpeg',
            });
          } catch (uploadError) {
            console.error('Failed to upload group icon, continuing without it:', uploadError);
          }
        }
      }

      const conversationId = await messageService.createGroupConversation(
        user.userId,
        memberIds,
        finalGroupName,
        uploadedGroupIconUrl
      );

      Alert.alert('Group created', `${finalGroupName} is ready.`);
      (navigation as any).replace('GroupInfo', { conversationId });
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.has(item.userId);
    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => toggleUser(item.userId)}
        activeOpacity={0.82}
      >
        <Avatar source={item.avatarURL} size={52} fallbackText={item.displayName || item.username} />
        <View style={styles.userMeta}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.displayName}>{item.displayName || 'Iris user'}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected ? <Ionicons name="checkmark" size={16} color="#ffffff" /> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={22} color="#f8fafc" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Create group chat</Text>
          <Text style={styles.headerSubtitle}>{selectedUsers.size} selected</Text>
        </View>
        <TouchableOpacity
          onPress={handleCreateGroup}
          disabled={creating || selectedUsers.size < MIN_OTHER_MEMBERS}
          style={[styles.createButton, (creating || selectedUsers.size < MIN_OTHER_MEMBERS) && styles.createButtonDisabled]}
        >
          {creating ? <ButtonLoadingSkeleton /> : <Text style={styles.createButtonText}>Create</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <TouchableOpacity onPress={handlePickIcon} style={styles.heroAvatarButton} activeOpacity={0.82}>
          {groupIcon ? (
            <Image source={{ uri: groupIcon }} style={styles.groupIcon} />
          ) : (
            <View style={styles.heroAvatarPlaceholder}>
              <Ionicons name="camera" size={22} color="#7dd3fc" />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.heroInputs}>
          <TextInput
            style={styles.groupNameInput}
            placeholder="Group name"
            placeholderTextColor="#64748b"
            value={groupName}
            onChangeText={(value) => {
              setNameTouched(true);
              setGroupName(value);
            }}
          />
          <Text style={styles.heroHint}>Select at least {MIN_OTHER_MEMBERS} members. Name is optional.</Text>
          <View style={styles.heroPreviewRow}>
            <View style={styles.heroPreviewStack}>
              {selectedList.slice(0, 4).map((item, index) => (
                <Avatar
                  key={item.userId}
                  source={item.avatarURL}
                  size={30}
                  fallbackText={item.displayName || item.username}
                  style={StyleSheet.flatten([
                    styles.heroPreviewAvatar,
                    index > 0 ? styles.heroPreviewAvatarOverlap : null,
                  ])}
                />
              ))}
            </View>
            <Text style={styles.heroPreviewText}>{previewMemberLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchShell}>
        <Ionicons name="search" size={18} color="#7c8aa5" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people"
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {selectedList.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.selectedStrip}
          contentContainerStyle={styles.selectedStripContent as any}
        >
          {selectedList.map((item) => (
            <TouchableOpacity key={item.userId} style={styles.selectedChip} onPress={() => toggleUser(item.userId)}>
              <Avatar source={item.avatarURL} size={26} fallbackText={item.displayName || item.username} />
              <Text style={styles.selectedChipText}>{item.username}</Text>
              <Ionicons name="close" size={14} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#38bdf8" />
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="people-outline" size={48} color="#334155" />
          <Text style={styles.emptyTitle}>{search ? 'No users found' : 'No following yet'}</Text>
          <Text style={styles.emptyText}>Follow people to start a group chat.</Text>
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent as any}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.12)',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#94a3b8',
  },
  createButton: {
    minWidth: 82,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5865f2',
    paddingHorizontal: 16,
  },
  createButtonDisabled: {
    opacity: 0.45,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  heroCard: {
    margin: 16,
    borderRadius: 22,
    backgroundColor: '#0c1323',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroAvatarButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  groupIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  heroAvatarPlaceholder: {
    flex: 1,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14,165,233,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.2)',
  },
  heroInputs: {
    flex: 1,
    marginLeft: 14,
  },
  groupNameInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    paddingVertical: 2,
  },
  heroHint: {
    marginTop: 6,
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
  },
  heroPreviewRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroPreviewStack: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 46,
  },
  heroPreviewAvatar: {
    borderWidth: 2,
    borderColor: '#0c1323',
  },
  heroPreviewAvatarOverlap: {
    marginLeft: -8,
  },
  heroPreviewText: {
    flex: 1,
    marginLeft: 10,
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  searchShell: {
    marginHorizontal: 16,
    marginBottom: 12,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: '#0c1323',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 15,
    paddingLeft: 10,
  },
  selectedStrip: {
    maxHeight: 56,
  },
  selectedStripContent: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#0c1323',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  selectedChipText: {
    marginLeft: 8,
    marginRight: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 14,
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 8,
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#0c1323',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  userItemSelected: {
    borderColor: 'rgba(88,101,242,0.45)',
    backgroundColor: 'rgba(88,101,242,0.12)',
  },
  userMeta: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  displayName: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 3,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2,6,23,0.4)',
  },
  checkboxSelected: {
    backgroundColor: '#5865f2',
    borderColor: '#5865f2',
  },
});







