import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { BackButton } from '../components/common/BackButton';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

interface ChatItem {
  chatId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarURL?: string;
  lastMessage: string;
  timestamp: string;
  isOnline: boolean;
  unreadCount: number;
  verified?: boolean;
}

export default function MessagesScreenNew() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatItem[]>([
    {
      chatId: '1',
      userId: 'user1',
      username: 'vishalkumar',
      displayName: 'Vishal Kumar',
      lastMessage: 'Hey! How are you?',
      timestamp: '4d ago',
      isOnline: true,
      unreadCount: 0,
      verified: true,
    },
  ]);

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => (navigation as any).navigate('Chat' as never, { chatId: item.chatId, userId: item.userId } as never)}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: item.avatarURL || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        {item.isOnline && <View style={styles.onlineBadge} />}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>
              <Text>{item.displayName}</Text>
            </Text>
            {item.verified && (
              <VerifiedBadge size={14} />
            )}
          </View>
          <Text style={styles.timestamp}>
            <Text>{item.timestamp}</Text>
          </Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          <Text>{item.lastMessage}</Text>
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>
            <Text>{item.unreadCount}</Text>
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>
          <Text>Messages</Text>
        </Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="notifications-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Gradient Title Section */}
      <View style={styles.titleSection}>
        <LinearGradient
          colors={['#4DD0E1', '#9C27B0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientContainer}
        >
          <Text style={styles.gradientTitle}>
            <Text>Messages</Text>
          </Text>
        </LinearGradient>
        <Text style={styles.subtitle}>
          <Text>Stay connected with friends</Text>
        </Text>
        <TouchableOpacity style={styles.newMessageButton}>
          <Ionicons name="create-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.text.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          placeholderTextColor={colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'chats' && styles.activeSegment]}
          onPress={() => setActiveTab('chats')}
        >
          <Text style={[styles.segmentText, activeTab === 'chats' && styles.activeSegmentText]}>
            <Text>Chats</Text>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'requests' && styles.activeSegment]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.segmentText, activeTab === 'requests' && styles.activeSegmentText]}>
            <Text>Requests</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <FlashList estimatedItemSize={100}
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.chatId}
        contentContainerStyle={styles.chatList as any}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.text.muted} />
            <Text style={styles.emptyText}>
              <Text>No messages yet</Text>
            </Text>
            <Text style={styles.emptySubtext}>
              <Text>Start a conversation with your friends</Text>
            </Text>
          </View>
        }
      />
    </SafeAreaView>
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
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    flex: 1,
    marginLeft: spacing.md,
  },
  headerIcon: {
    padding: spacing.xs,
  },
  titleSection: {
    padding: spacing.lg,
    position: 'relative',
  },
  gradientContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  gradientTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  newMessageButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    padding: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  activeSegment: {
    backgroundColor: colors.text.link,
  },
  segmentText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  activeSegmentText: {
    color: colors.background.primary,
    fontWeight: typography.fontWeight.semibold as any,
  },
  chatList: {
    paddingBottom: spacing.xl,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  displayName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  lastMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  unreadBadge: {
    backgroundColor: colors.text.link,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.background.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
});
