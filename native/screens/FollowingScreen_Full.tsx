import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { Avatar } from '../components/ui/Avatar';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { FlashList } from '@shopify/flash-list';

interface FollowingUser {
  userId: string;
  username: string;
  displayName: string;
  avatarURL?: string;
  verified?: boolean;
  bio?: string;
}

export default function FollowingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params as any;
  const { user } = useAuth();
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [filteredFollowing, setFilteredFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFollowing();
  }, [userId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = following.filter(
        (f) =>
          f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFollowing(filtered);
    } else {
      setFilteredFollowing(following);
    }
  }, [searchQuery, following]);

  const loadFollowing = async () => {
    try {
      setLoading(true);
      const followingIds = await userService.getFollowing(userId);
      const followingUsers = await Promise.all(
        followingIds.map((id) => userService.getUser(id))
      );
      setFollowing(followingUsers.filter(Boolean) as FollowingUser[]);
    } catch (error) {
      console.error('Failed to load following:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (unfollowUserId: string) => {
    if (!user) return;
    try {
      await userService.unfollowUser(user.userId, unfollowUserId);
      setFollowing((prev) => prev.filter((u) => u.userId !== unfollowUserId));
    } catch (error) {
      console.error('Failed to unfollow:', error);
    }
  };

  const renderFollowing = ({ item }: { item: FollowingUser }) => {
    const isOwnProfile = item.userId === user?.userId;

    return (
      <TouchableOpacity
        style={styles.followingItem}
        onPress={() => (navigation as any).navigate('UserProfile', { userId: item.userId })}
        activeOpacity={0.7}
      >
        <Avatar
          source={item.avatarURL}
          size={48}
          fallbackText={item.displayName || item.username}
        />

        <View style={styles.followingInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName} numberOfLines={1}>
              {item.username}
            </Text>
            {item.verified ? <VerifiedBadge size={14} /> : null}
          </View>
          {item.bio && (
            <Text style={styles.bio} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>

        {!isOwnProfile && (
          <TouchableOpacity
            style={styles.followingButton}
            onPress={() => handleUnfollow(item.userId)}
            activeOpacity={0.7}
          >
            <Text style={styles.followingButtonText}>Following</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyTitle}>Not following anyone</Text>
      <Text style={styles.emptyText}>
        When you follow people, they'll appear here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Following</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlashList estimatedItemSize={100}
        data={filteredFollowing}
        renderItem={renderFollowing}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={(
          filteredFollowing.length === 0 ? styles.emptyContent : styles.list
        ) as any}
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  placeholder: {
    width: 24,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  emptyContent: {
    flexGrow: 1,
  },
  followingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  followingInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 4,
  },
  displayName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    flexShrink: 1,
  },
  username: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  bio: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    marginTop: 2,
  },
  followingButton: {
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  followingButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});


