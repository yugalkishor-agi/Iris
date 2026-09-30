// ActiveUsersList.tsx
// Purpose: Horizontal scroll of online/active users
// Extracted from: MessagesScreenEnhanced.tsx — Session 002

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { colors, spacing, typography } from '../../styles/theme';
import type { User } from '../../types/database';
import { FlashList } from '@shopify/flash-list';

interface ActiveUsersListProps {
  users: User[];
  loading?: boolean;
  onUserPress: (user: User) => void;
}

const ActiveUsersList = memo(({ users, loading, onUserPress }: ActiveUsersListProps) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.text.secondary} />
      </View>
    );
  }

  if (users.length === 0) {
    return null;
  }

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => onUserPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Avatar source={item.avatarURL} size={56} />
        <View style={styles.onlineIndicator} />
      </View>
      <Text style={styles.userName} numberOfLines={1}>
        {item.displayName || item.username}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlashList estimatedItemSize={100}
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.userId}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent as any}
        ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
      />
    </View>
  );
});

ActiveUsersList.displayName = 'ActiveUsersList';

export default ActiveUsersList;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    paddingVertical: spacing.md,
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  userItem: {
    alignItems: 'center',
    width: 70,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.xs,
  },
  onlineIndicator: {
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
  userName: {
    fontSize: 12,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
