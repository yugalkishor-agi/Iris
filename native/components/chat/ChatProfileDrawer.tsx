import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/user.service';

interface ChatProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
  otherUser: {
    userId: string;
    username: string;
    displayName?: string;
    avatarURL?: string;
    verified?: boolean;
    bio?: string;
  };
  onViewProfile: () => void;
  onCreateGroup: () => void;
  onMute: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onReport: () => void;
  onDelete: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  isPinned?: boolean;
  isMuted?: boolean;
  conversationId?: string;
}

export function ChatProfileDrawer({
  visible,
  onClose,
  otherUser,
  onViewProfile,
  onCreateGroup,
  onMute,
  onBlock,
  onUnblock,
  onReport,
  onDelete,
  onPin,
  onUnpin,
  isPinned = false,
  isMuted = false,
  conversationId,
}: ChatProfileDrawerProps) {
  const { user } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);

  // Check if user is blocked
  useEffect(() => {
    const checkBlocked = async () => {
      if (!user || !visible) return;
      try {
        const blocked = await userService.isBlocked(user.userId, otherUser.userId);
        setIsBlocked(blocked);
      } catch (error) {
        console.error('Failed to check blocked status:', error);
      }
    };
    checkBlocked();
  }, [user, otherUser.userId, visible]);

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block @${otherUser.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: onBlock },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Chat',
      'This will delete all messages. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Report User',
      `Report @${otherUser.username} for inappropriate content?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: onReport },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat Info</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* User Profile Section */}
          <View style={styles.profileSection}>
            <Avatar
              source={otherUser.avatarURL}
              size={96}
              style={styles.avatar}
            />

            <View style={styles.nameContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.displayName}>
                  {otherUser.displayName || otherUser.username}
                </Text>
                {otherUser.verified && (
                  <VerifiedBadge size={20} />
                )}
              </View>
              <Text style={styles.username}>@{otherUser.username}</Text>
              {otherUser.bio && (
                <Text style={styles.bio}>{otherUser.bio}</Text>
              )}
            </View>

            <TouchableOpacity style={styles.viewProfileButton} onPress={onViewProfile}>
              <Ionicons name="person-outline" size={20} color="#007AFF" />
              <Text style={styles.viewProfileText}>View Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Chat Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CHAT SETTINGS</Text>

            {/* Pin/Unpin Chat */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={isPinned ? onUnpin : onPin}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons
                  name={isPinned ? "pin" : "pin-outline"}
                  size={22}
                  color={isPinned ? "#FFCC00" : "#007AFF"}
                />
              </View>
              <Text style={styles.menuText}>
                {isPinned ? 'Unpin Chat' : 'Pin Chat'}
              </Text>
            </TouchableOpacity>

            {/* Mute/Unmute */}
            <View style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <Ionicons
                  name={isMuted ? "notifications-off-outline" : "notifications-outline"}
                  size={22}
                  color={isMuted ? "#FF9500" : "#007AFF"}
                />
              </View>
              <Text style={styles.menuText}>Mute Notifications</Text>
              <Switch
                value={isMuted}
                onValueChange={onMute}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Create Group */}
            <TouchableOpacity style={styles.menuItem} onPress={onCreateGroup}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="people-outline" size={22} color="#34C759" />
              </View>
              <Text style={styles.menuText}>Create Group with {otherUser.username}</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DANGER ZONE</Text>

            {/* Block/Unblock */}
            {isBlocked ? (
              <TouchableOpacity style={styles.menuItem} onPress={onUnblock}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="ban-outline" size={22} color="#34C759" />
                </View>
                <Text style={[styles.menuText, styles.successText]}>Unblock User</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.menuItem} onPress={handleBlock}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="ban-outline" size={22} color="#FF3B30" />
                </View>
                <Text style={[styles.menuText, styles.dangerText]}>Block {otherUser.username}</Text>
              </TouchableOpacity>
            )}

            {/* Report */}
            <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="flag-outline" size={22} color="#FF3B30" />
              </View>
              <Text style={[styles.menuText, styles.dangerText]}>Report</Text>
            </TouchableOpacity>

            {/* Delete Chat */}
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="trash-outline" size={22} color="#FF3B30" />
              </View>
              <Text style={[styles.menuText, styles.dangerText]}>Delete Chat</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 48,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    borderWidth: 3,
    borderColor: '#E5E5EA',
  },
  nameContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
  },
  username: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 280,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  viewProfileText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  divider: {
    height: 8,
    backgroundColor: '#F2F2F7',
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingVertical: 8,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  dangerText: {
    color: '#FF3B30',
  },
  successText: {
    color: '#34C759',
  },
});
