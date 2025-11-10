import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { postService } from '../services/post.service';
import { glimpseService } from '../services/glimpse.service';
import { mediaService } from '../services/media.service';

const { width } = Dimensions.get('window');
const imageSize = width / 3;

export default function ProfileScreen({ navigation, route }: any) {
  const { userId } = route?.params || {};
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userGlimpses, setUserGlimpses] = useState<any[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isOwnProfile = !userId || userId === currentUser?.userId;
  const displayUserId = userId || currentUser?.userId;

  useEffect(() => {
    if (displayUserId) {
      loadProfile();
    }
  }, [displayUserId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const user = await userService.getUser(displayUserId);
      setProfileUser(user);

      if (!isOwnProfile && currentUser) {
        const following = await userService.isFollowing(currentUser.userId, displayUserId);
        setIsFollowing(following);
      }

      const [posts, glimpses] = await Promise.all([
        postService.getUserPosts(displayUserId),
        glimpseService.getUserGlimpses(displayUserId, 50),
      ]);

      setUserPosts(posts.posts || []);
      setUserGlimpses(glimpses || []);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;
    
    try {
      if (isFollowing) {
        await userService.unfollowUser(currentUser.userId, profileUser.userId);
        setIsFollowing(false);
      } else {
        await userService.followUser(currentUser.userId, profileUser.userId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    }
  };

  const handleAvatarUpload = async () => {
    if (!currentUser) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingAvatar(true);
      try {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

        const avatarURL = await mediaService.uploadAvatar(currentUser.userId, file);
        await userService.updateUser(currentUser.userId, { avatarURL });
        loadProfile();
      } catch (error) {
        console.error('Failed to upload avatar:', error);
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const renderPost = ({ item }: any) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PostViewer', { postId: item.postId })}
      style={styles.gridItem}
    >
      <Image
        source={{ uri: item.mediaURLs?.[0] }}
        style={styles.gridImage}
      />
      {item.postType === 'carousel' && (
        <View style={styles.carouselBadge}>
          <Ionicons name="copy-outline" size={16} color="#fff" />
        </View>
      )}
      {item.mediaType === 'video' && (
        <View style={styles.videoBadge}>
          <Ionicons name="play" size={16} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  const currentData = activeTab === 'posts' ? userPosts : activeTab === 'glimpses' ? userGlimpses : taggedPosts;

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={isOwnProfile ? handleAvatarUpload : undefined}
            style={styles.avatarContainer}
          >
            {uploadingAvatar ? (
              <View style={styles.avatar}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : profileUser.avatarURL ? (
              <Image source={{ uri: profileUser.avatarURL }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profileUser.username?.[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            {isOwnProfile && (
              <View style={styles.cameraButton}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profileUser.stats?.postsCount || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('FollowersList', { userId: displayUserId })}
            >
              <Text style={styles.statNumber}>{profileUser.stats?.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('Following', { userId: displayUserId })}
            >
              <Text style={styles.statNumber}>{profileUser.stats?.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{profileUser.displayName}</Text>
            {profileUser.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
            )}
          </View>
          {profileUser.bio && <Text style={styles.bio}>{profileUser.bio}</Text>}
          {profileUser.website && (
            <Text style={styles.website}>{profileUser.website}</Text>
          )}
        </View>

        {isOwnProfile ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => navigation.navigate('Chat', { userId: profileUser.userId })}
            >
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons name="grid-outline" size={24} color={activeTab === 'posts' ? '#fff' : '#888'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'glimpses' && styles.activeTab]}
            onPress={() => setActiveTab('glimpses')}
          >
            <Ionicons name="film-outline" size={24} color={activeTab === 'glimpses' ? '#fff' : '#888'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tagged' && styles.activeTab]}
            onPress={() => setActiveTab('tagged')}
          >
            <Ionicons name="person-outline" size={24} color={activeTab === 'tagged' ? '#fff' : '#888'} />
          </TouchableOpacity>
        </View>

        {currentData.length > 0 ? (
          <FlatList
            data={currentData}
            renderItem={renderPost}
            keyExtractor={(item) => item.postId}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.grid}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No {activeTab} yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
  },
  errorText: {
    color: '#888',
    fontSize: 16,
  },
  header: {
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 14,
  },
  info: {
    padding: 16,
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bio: {
    color: '#888',
    fontSize: 14,
  },
  editButton: {
    margin: 16,
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  grid: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '600',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0D0D0D',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  displayName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  website: {
    color: '#3b82f6',
    fontSize: 14,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  followButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  followButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#fff',
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#fff',
  },
  gridItem: {
    width: imageSize - 2,
    height: imageSize - 2,
    margin: 1,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  carouselBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  videoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
});
