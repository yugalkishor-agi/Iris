import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Switch, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import { Avatar } from '../ui/Avatar';
import { userService } from '../../services/user.service';
import { useAuth } from '../../contexts/AuthContext';
import { FlashList } from '@shopify/flash-list';

interface StorySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: {
    allowReplies: boolean;
    allowSharing: boolean;
    audience: 'everyone' | 'closeFriends' | 'custom';
    hiddenFrom: string[];
    closeFriends: string[];
  };
  onSettingsChange: (settings: any) => void;
}

export function StorySettingsModal({ 
  visible, 
  onClose, 
  settings, 
  onSettingsChange 
}: StorySettingsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'closeFriends' | 'hideFrom'>('closeFriends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [closeFriendsList, setCloseFriendsList] = useState<any[]>([]);
  const [hideFromList, setHideFromList] = useState<any[]>([]);

  const handleSettingToggle = (key: string, value: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await userService.searchUsers(query, 10);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const addToCloseFriends = (userData: any) => {
    const newCloseFriends = [...settings.closeFriends, userData.userId];
    onSettingsChange({
      ...settings,
      closeFriends: newCloseFriends,
    });
    setCloseFriendsList(prev => [...prev, userData]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeFromCloseFriends = (userId: string) => {
    const newCloseFriends = settings.closeFriends.filter(id => id !== userId);
    onSettingsChange({
      ...settings,
      closeFriends: newCloseFriends,
    });
    setCloseFriendsList(prev => prev.filter(user => user.userId !== userId));
  };

  const addToHideFrom = (userData: any) => {
    const newHidden = [...settings.hiddenFrom, userData.userId];
    onSettingsChange({
      ...settings,
      hiddenFrom: newHidden,
    });
    setHideFromList(prev => [...prev, userData]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeFromHideFrom = (userId: string) => {
    const newHidden = settings.hiddenFrom.filter(id => id !== userId);
    onSettingsChange({
      ...settings,
      hiddenFrom: newHidden,
    });
    setHideFromList(prev => prev.filter(user => user.userId !== userId));
  };

  React.useEffect(() => {
    // hydrate lists from ids when modal opens
    if (!visible) return;
    (async () => {
      try {
        if (settings.closeFriends?.length) {
          const results = await Promise.all(settings.closeFriends.map(async (id) => (await userService.getUser(id)) || null));
          setCloseFriendsList(results.filter(Boolean));
        } else {
          setCloseFriendsList([]);
        }
      } catch {}
      try {
        if (settings.hiddenFrom?.length) {
          const results = await Promise.all(settings.hiddenFrom.map(async (id) => (await userService.getUser(id)) || null));
          setHideFromList(results.filter(Boolean));
        } else {
          setHideFromList([]);
        }
      } catch {}
    })();
  }, [visible]);

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {
        if (activeTab === 'closeFriends') {
          if (!settings.closeFriends.includes(item.userId)) addToCloseFriends(item);
        } else {
          if (!settings.hiddenFrom.includes(item.userId)) addToHideFrom(item);
        }
      }}
    >
      <Avatar source={item.avatarURL} size={40} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.displayName}</Text>
        <Text style={styles.userHandle}>@{item.username}</Text>
      </View>
      {activeTab === 'closeFriends' && settings.closeFriends.includes(item.userId) && (
        <TouchableOpacity onPress={() => removeFromCloseFriends(item.userId)}>
          <Text style={styles.removeButton}>Remove</Text>
        </TouchableOpacity>
      )}
      {activeTab === 'hideFrom' && settings.hiddenFrom.includes(item.userId) && (
        <TouchableOpacity onPress={() => removeFromHideFrom(item.userId)}>
          <Text style={styles.removeButton}>Remove</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Story Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Settings Options */}
        <View style={styles.settingsSection}>
          {/* Replies Setting */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.text.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Replies</Text>
                <Text style={styles.settingSubtitle}>Viewers can reply</Text>
              </View>
            </View>
            <Switch
              value={settings.allowReplies}
              onValueChange={(value) => handleSettingToggle('allowReplies', value)}
              trackColor={{ false: colors.border.medium, true: colors.accent.primary }}
              thumbColor={settings.allowReplies ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>

          {/* Sharing Setting */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="share-outline" size={20} color={colors.text.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Sharing</Text>
                <Text style={styles.settingSubtitle}>Viewers can share</Text>
              </View>
            </View>
            <Switch
              value={settings.allowSharing}
              onValueChange={(value) => handleSettingToggle('allowSharing', value)}
              trackColor={{ false: colors.border.medium, true: colors.accent.primary }}
              thumbColor={settings.allowSharing ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Audience Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'closeFriends' && styles.activeTab]}
            onPress={() => setActiveTab('closeFriends')}
          >
            <Ionicons name="people" size={16} color={activeTab === 'closeFriends' ? colors.accent.primary : colors.text.secondary} />
            <Text style={[styles.tabText, activeTab === 'closeFriends' && styles.activeTabText]}>
              Close Friends
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'hideFrom' && styles.activeTab]}
            onPress={() => setActiveTab('hideFrom')}
          >
            <Ionicons name="eye-off" size={16} color={activeTab === 'hideFrom' ? colors.accent.primary : colors.text.secondary} />
            <Text style={[styles.tabText, activeTab === 'hideFrom' && styles.activeTabText]}>
              Hide From
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users to add..."
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchUsers(text);
            }}
          />
        </View>

        {/* Dynamic section title */}
        <Text style={styles.sectionTitle}>
          {activeTab === 'closeFriends' ? `Close Friends (${settings.closeFriends.length})` : `Hidden From (${settings.hiddenFrom.length})`}
        </Text>

        {/* Users List */}
        <FlashList estimatedItemSize={100}
          data={searchQuery ? searchResults : (activeTab === 'closeFriends' ? closeFriendsList : hideFromList)}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.userId}
          style={styles.usersList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No users found' : (activeTab === 'closeFriends' ? 'No close friends added yet' : 'No one is hidden yet')}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  settingsSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  settingSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  usersList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  userHandle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  removeButton: {
    fontSize: typography.fontSize.sm,
    color: '#EF4444',
    fontWeight: typography.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
