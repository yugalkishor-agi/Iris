import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/ui/Avatar';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { FlashList } from '@shopify/flash-list';

export default function CloseFriendsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [closeFriends, setCloseFriends] = useState<any[]>([]);
  const [allFollowing, setAllFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [cfIds, followingIds] = await Promise.all([
        userService.getCloseFriends(user.userId),
        userService.getFollowing(user.userId),
      ]);

      const [cfUsers, followingUsers] = await Promise.all([
        Promise.all(cfIds.map(id => userService.getUser(id))),
        Promise.all(followingIds.map(id => userService.getUser(id))),
      ]);

      setCloseFriends(cfUsers.filter(Boolean));
      setAllFollowing(followingUsers.filter(Boolean));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (userId: string) => {
    if (!user) return;

    try {
      const isCloseFriend = closeFriends.some(cf => cf.userId === userId);
      
      if (isCloseFriend) {
        await userService.removeCloseFriend(user.userId, userId);
        setCloseFriends(prev => prev.filter(cf => cf.userId !== userId));
      } else {
        await userService.addCloseFriend(user.userId, userId);
        const newFriend = allFollowing.find(u => u.userId === userId);
        if (newFriend) {
          setCloseFriends(prev => [...prev, newFriend]);
        }
      }
    } catch (error) {
      console.error('Failed to toggle close friend:', error);
    }
  };

  const renderUser = ({ item }: { item: any }) => {
    const isCloseFriend = closeFriends.some(cf => cf.userId === item.userId);

    return (
      <View style={styles.userItem}>
        <TouchableOpacity
          style={styles.userLeft}
          onPress={() =>
            (navigation as any).navigate('Profile', { username: item.username })
          }
        >
          <Avatar source={item.avatarURL} size={48} fallbackText={item.username} />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.displayName || item.username}</Text>
            <Text style={styles.handle}>@{item.username}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, isCloseFriend && styles.activeButton]}
          onPress={() => handleToggle(item.userId)}
        >
          <Ionicons
            name={isCloseFriend ? 'checkmark' : 'add'}
            size={20}
            color={isCloseFriend ? colors.text.inverse : colors.text.primary}
          />
        </TouchableOpacity>
      </View>
    );
  };

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
        <Text style={styles.title}>Close Friends</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="star" size={24} color={colors.accent.success} />
        <Text style={styles.infoText}>
          Share stories and posts with your close friends only
        </Text>
      </View>

      <FlashList estimatedItemSize={100}
        data={allFollowing}
        renderItem={renderUser}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.list as any}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
            <Text style={styles.emptyTitle}>No following yet</Text>
            <Text style={styles.emptyText}>
              Follow people to add them to close friends
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: `${colors.accent.success}15`,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  handle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  activeButton: {
    backgroundColor: colors.accent.success,
    borderColor: colors.accent.success,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
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
