import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import type { User } from '../types/database';

export default function FollowersListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user: currentUser } = useAuth();
  
  const userId = (route.params as any)?.userId || currentUser?.userId;
  
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadFollowers();
  }, [userId]);

  const loadFollowers = async () => {
    if (!userId || !currentUser) return;
    
    setLoading(true);
    try {
      const followerIds = await userService.getFollowers(userId);
      const userDetails = await Promise.all(
        followerIds.map(id => userService.getUser(id))
      );
      setFollowers(userDetails.filter((u): u is User => u !== null));
      
      // Check which ones current user is following
      const followingIds = await userService.getFollowing(currentUser.userId);
      setFollowingUsers(new Set(followingIds));
    } catch (error) {
      console.error('Failed to load followers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser || actionLoading) return;
    
    setActionLoading(targetUserId);
    try {
      const isFollowing = followingUsers.has(targetUserId);
      
      if (isFollowing) {
        await userService.unfollowUser(currentUser.userId, targetUserId);
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetUserId);
          return newSet;
        });
      } else {
        await userService.followUser(currentUser.userId, targetUserId);
        setFollowingUsers(prev => new Set(prev).add(targetUserId));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFollower = async (targetUserId: string) => {
    if (!currentUser || actionLoading) return;
    
    Alert.alert(
      'Remove Follower',
      "Remove this follower? They won't be notified.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(targetUserId);
            try {
              await userService.unfollowUser(targetUserId, currentUser.userId);
              setFollowers(prev => prev.filter(u => u.userId !== targetUserId));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove follower');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const filteredFollowers = followers.filter(u =>
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFollower = ({ item }: { item: User }) => {
    const isFollowing = followingUsers.has(item.userId);
    const isLoading = actionLoading === item.userId;
    const isOwnProfile = userId === currentUser?.userId;

    return (
      <View style={styles.userItem}>
        <TouchableOpacity
          style={styles.userMain}
          onPress={() => navigation.navigate('Profile' as never, { userId: item.userId } as never)}
        >
          <Image
            source={{ uri: item.avatarURL || 'https://via.placeholder.com/50' }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.displayName}>{item.displayName}</Text>
            <Text style={styles.username}>@{item.username}</Text>
            {item.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
          </View>
        </TouchableOpacity>
        
        {item.userId !== currentUser?.userId && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={() => handleFollow(item.userId)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? '#3b82f6' : '#fff'} />
              ) : (
                <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                  {isFollowing ? 'Following' : 'Follow Back'}
                </Text>
              )}
            </TouchableOpacity>
            
            {isOwnProfile && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => handleRemoveFollower(item.userId)}
                disabled={isLoading}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Followers</Text>
        <Text style={styles.count}>{followers.length}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search followers..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Followers List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : filteredFollowers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No users found' : 'No followers yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFollowers}
          renderItem={renderFollower}
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 12,
  },
  count: {
    fontSize: 14,
    color: '#6b7280',
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
    textAlign: 'center',
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
  userMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  username: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  bio: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  followingButtonText: {
    color: '#374151',
  },
  menuButton: {
    padding: 4,
  },
});
