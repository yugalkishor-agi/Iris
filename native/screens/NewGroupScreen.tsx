import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { messageService } from '../services/message.service';
import type { User } from '../types/database';

export default function NewGroupScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const preselectedUserId = (route.params as any)?.userId;
  
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [following, setFollowing] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadFollowing();
  }, [user]);

  useEffect(() => {
    if (preselectedUserId && following.length > 0) {
      setSelectedUsers(new Set([preselectedUserId]));
    }
  }, [preselectedUserId, following]);

  useEffect(() => {
    if (search.trim()) {
      const filtered = following.filter(
        (u) =>
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          u.displayName?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(following);
    }
  }, [search, following]);

  const loadFollowing = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const followingIds = await userService.getFollowing(user.userId, 100);
      const users = await Promise.all(
        followingIds.map(async (userId) => {
          try {
            return await userService.getUser(userId);
          } catch (err) {
            return null;
          }
        })
      );
      const validUsers = users.filter((u): u is User => u !== null);
      setFollowing(validUsers);
      setFilteredUsers(validUsers);
    } catch (error) {
      console.error('Failed to load following:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handlePickIcon = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setGroupIcon(result.assets[0].uri);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || selectedUsers.size < 2) {
      Alert.alert('Select Members', 'A group needs at least 2 other members');
      return;
    }

    if (!groupName.trim()) {
      Alert.alert('Enter Group Name', 'Please provide a name for the group');
      return;
    }

    setCreating(true);
    try {
      const participantIds = Array.from(selectedUsers);
      
      const conversationId = await messageService.createGroupConversation(
        user.userId,
        participantIds,
        groupName,
        groupIcon || undefined
      );

      Alert.alert('Success', `${groupName} has been created successfully`);
      navigation.navigate('Chat' as never, { userId: conversationId } as never);
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderSelectedUser = (userId: string) => {
    const selectedUser = following.find((u) => u.userId === userId);
    if (!selectedUser) return null;

    return (
      <View key={userId} style={styles.selectedUserChip}>
        <Image
          source={{ uri: selectedUser.avatarURL || 'https://via.placeholder.com/24' }}
          style={styles.selectedUserAvatar}
        />
        <Text style={styles.selectedUserName}>{selectedUser.username}</Text>
        <TouchableOpacity onPress={() => toggleUser(userId)}>
          <Ionicons name="close" size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderUser = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.has(item.userId);

    return (
      <TouchableOpacity style={styles.userItem} onPress={() => toggleUser(item.userId)}>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
        </View>
        <Image
          source={{ uri: item.avatarURL || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          {item.displayName && (
            <Text style={styles.displayName}>{item.displayName}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>New Group</Text>
          <Text style={styles.headerSubtitle}>
            {selectedUsers.size} {selectedUsers.size === 1 ? 'member' : 'members'} selected
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleCreateGroup}
          disabled={creating || selectedUsers.size < 2 || !groupName.trim()}
          style={[styles.createButton, (creating || selectedUsers.size < 2 || !groupName.trim()) && styles.createButtonDisabled]}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Group Details */}
      <View style={styles.groupDetails}>
        <TouchableOpacity onPress={handlePickIcon} style={styles.iconButton}>
          {groupIcon ? (
            <Image source={{ uri: groupIcon }} style={styles.groupIcon} />
          ) : (
            <View style={styles.iconPlaceholder}>
              <Ionicons name="camera" size={24} color="#3b82f6" />
            </View>
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.groupNameInput}
          placeholder="Group name (required)"
          placeholderTextColor="#9ca3af"
          value={groupName}
          onChangeText={setGroupName}
        />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Selected Users */}
      {selectedUsers.size > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.selectedUsersContainer}
          contentContainerStyle={styles.selectedUsersContent}
        >
          {Array.from(selectedUsers).map(renderSelectedUser)}
        </ScrollView>
      )}

      {/* User List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>
            {search ? 'No users found' : 'No following'}
          </Text>
          <Text style={styles.emptyDescription}>
            Follow people to add them to groups
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  groupDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 16,
  },
  iconButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  groupIcon: {
    width: 64,
    height: 64,
  },
  iconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#3b82f6',
  },
  groupNameInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  selectedUsersContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#eff6ff',
  },
  selectedUsersContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingLeft: 4,
    paddingRight: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  selectedUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  selectedUserName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  listContainer: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  displayName: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
});
