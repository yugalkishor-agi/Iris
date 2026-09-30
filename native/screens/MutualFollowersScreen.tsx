import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../styles/theme';
import { userService } from '../services/user.service';
import { FlashList } from '@shopify/flash-list';

interface MutualFollower {
  userId: string;
  username: string;
  displayName?: string;
  avatarURL?: string;
  verified?: boolean;
  isFollowing?: boolean;
  followedAt?: any;
}

export default function MutualFollowersScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const { userId, username } = (route.params as any) || {};
  
  const [mutualFollowers, setMutualFollowers] = useState<MutualFollower[]>([]);
  const [filteredFollowers, setFilteredFollowers] = useState<MutualFollower[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userId && user) {
      loadMutualFollowers();
    }
  }, [userId, user]);

  useEffect(() => {
    filterFollowers();
  }, [mutualFollowers, searchQuery]);

  const loadMutualFollowers = async () => {
    if (!userId || !user) return;
    
    try {
      setLoading(true);
      
      // Get current user's following list
      const currentUserFollowing = await userService.getFollowing(user.userId);
      const currentUserFollowingSet = new Set(currentUserFollowing);
      
      // Get target user's followers
      const targetUserFollowers = await userService.getFollowers(userId);
      
      // Find mutual followers (people who follow target user AND current user follows them)
      const mutualFollowerIds = targetUserFollowers.filter(followerId => 
        currentUserFollowingSet.has(followerId)
      );
      
      // Get user data for mutual followers
      const mutualFollowersData: MutualFollower[] = [];
      
      for (const followerId of mutualFollowerIds) {
        try {
          const userData = await userService.getUser(followerId);
          if (userData) {
            mutualFollowersData.push({
              ...userData,
              isFollowing: true, // We know current user follows them
            });
          }
        } catch (error) {
          console.error('Error loading mutual follower data:', error);
        }
      }
      
      // Sort by username
      mutualFollowersData.sort((a, b) => a.username.localeCompare(b.username));
      
      setMutualFollowers(mutualFollowersData);
      setFollowingUsers(new Set(mutualFollowerIds));
    } catch (error) {
      console.error('Error loading mutual followers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFollowers = () => {
    if (!searchQuery.trim()) {
      setFilteredFollowers(mutualFollowers);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = mutualFollowers.filter(follower => 
      follower.username.toLowerCase().includes(query) ||
      follower.displayName?.toLowerCase().includes(query)
    );
    
    setFilteredFollowers(filtered);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMutualFollowers();
    setRefreshing(false);
  }, []);

  const handleFollowToggle = async (targetUserId: string) => {
    if (!user) return;
    
    try {
      const isCurrentlyFollowing = followingUsers.has(targetUserId);
      
      if (isCurrentlyFollowing) {
        await userService.unfollowUser(user.userId, targetUserId);
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetUserId);
          return newSet;
        });
      } else {
        await userService.followUser(user.userId, targetUserId);
        setFollowingUsers(prev => new Set(prev).add(targetUserId));
      }
      
      // Update followers list
      setMutualFollowers(prev => prev.map(follower => 
        follower.userId === targetUserId 
          ? { ...follower, isFollowing: !isCurrentlyFollowing }
          : follower
      ));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleUserPress = (userId: string) => {
    (navigation as any).navigate('UserProfile', { userId });
  };

  const renderFollowerItem = ({ item }: { item: MutualFollower }) => {
    const isCurrentUser = item.userId === user?.userId;
    const isFollowing = followingUsers.has(item.userId);
    
    return (
      <TouchableOpacity
        style={styles.followerItem}
        onPress={() => handleUserPress(item.userId)}
      >
        <View style={styles.userInfo}>
          <Avatar source={item.avatarURL} size={44} />
          
          <View style={styles.userDetails}>
            <View style={styles.usernameContainer}>
              <Text style={styles.username}>{item.username}</Text>
              {item.verified && (
                <VerifiedBadge size={16} />
              )}
            </View>
            
            {item.displayName && (
              <Text style={styles.displayName}>{item.displayName}</Text>
            )}
            
            <Text style={styles.mutualText}>
              Followed by you and @{username}
            </Text>
          </View>
        </View>
        
        {!isCurrentUser && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing && styles.followingButton,
            ]}
            onPress={() => handleFollowToggle(item.userId)}
          >
            <Text
              style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText,
              ]}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.followersCount}>
        {mutualFollowers.length} mutual {mutualFollowers.length === 1 ? 'follower' : 'followers'}
      </Text>
      <Text style={styles.headerDescription}>
        People you both follow
      </Text>
      
      {mutualFollowers.length > 0 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#8E8E93" />
      <Text style={styles.emptyTitle}>No mutual followers</Text>
      <Text style={styles.emptyMessage}>
        When you and @{username} follow the same people, they'll appear here.
      </Text>
    </View>
  );

  const renderSearchEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color="#8E8E93" />
      <Text style={styles.emptyTitle}>No results found</Text>
      <Text style={styles.emptyMessage}>
        Try searching for a different username.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mutual Followers</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading mutual followers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mutual Followers</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <FlashList estimatedItemSize={100}
        data={filteredFollowers}
        renderItem={renderFollowerItem}
        keyExtractor={(item) => item.userId}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          searchQuery.length > 0 ? renderSearchEmptyState : renderEmptyState
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={(
          filteredFollowers.length === 0 ? styles.emptyContainer : undefined
        ) as any}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 12,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  followersCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  headerDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  searchContainer: {
    marginTop: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 8,
  },
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 4,
  },
  displayName: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  mutualText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: colors.text.primary,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
})
;
