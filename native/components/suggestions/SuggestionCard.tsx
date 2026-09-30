import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../ui/LoadingSkeleton';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '../ui/Avatar';
import { userService } from '../../services/user.service';
import { suggestionService } from '../../services/suggestion.service';
import { appWarmupService } from '../../services/appWarmup.service';
import { useAuth } from '../../contexts/AuthContext';

interface SuggestedUser {
  userId: string;
  username: string;
  displayName?: string;
  avatarURL?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  score: number;
  reason: string;
  verified?: boolean;
}

interface SuggestionCardProps {
  user: SuggestedUser;
  compact?: boolean;
  onFollowSuccess?: () => void;
  onDismiss?: (userId: string) => void;
}

export function SuggestionCard({ 
  user, 
  compact = false, 
  onFollowSuccess, 
  onDismiss 
}: SuggestionCardProps) {
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleFollow = async () => {
    if (!currentUser) return;

    const wasFollowing = isFollowing;
    setLoading(true);
    setIsFollowing(!wasFollowing);
    try {
      if (wasFollowing) {
        await userService.unfollowUser(currentUser.userId, user.userId);
      } else {
        await userService.followUser(currentUser.userId, user.userId);

        if (suggestionService.clearCache) {
          suggestionService.clearCache(currentUser.userId);
        }

        if (onFollowSuccess) {
          onFollowSuccess();
        }
      }
    } catch (error) {
      setIsFollowing(wasFollowing);
      Alert.alert('Error', 'Failed to follow user');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss(user.userId);
    }
  };

  const handleCardPress = () => {
    (navigation as any).navigate('UserProfile', { userId: user.userId });
  };

  if (dismissed) {
    return null;
  }

  if (compact) {
    // Compact card for horizontal carousel
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.compactHeader}>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <Avatar
          source={user.avatarURL}
          size={64}
          style={styles.compactAvatar}
        />

        <View style={styles.compactInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.compactDisplayName} numberOfLines={1}>
              {user.displayName || user.username}
            </Text>
            {user.verified && (
              <VerifiedBadge size={14} />
            )}
          </View>
          <Text style={styles.compactUsername} numberOfLines={1}>
            @{user.username}
          </Text>
        </View>

        <Text style={styles.compactReason} numberOfLines={2}>
          {user.reason}
        </Text>

        <TouchableOpacity
          style={[
            styles.compactFollowButton,
            isFollowing && styles.compactFollowingButton
          ]}
          onPress={handleFollow}
          disabled={loading}
        >
          {loading ? (
            <InlineLoadingSkeleton />
          ) : (
            <Text style={[
              styles.compactFollowText,
              isFollowing && styles.compactFollowingText
            ]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // Full card for grid view
  return (
    <TouchableOpacity
      style={styles.fullCard}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      <View style={styles.fullHeader}>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <Avatar
        source={user.avatarURL}
        size={80}
        style={styles.fullAvatar}
      />

      <View style={styles.fullInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.fullDisplayName} numberOfLines={1}>
            {user.displayName || user.username}
          </Text>
          {user.verified && (
            <VerifiedBadge size={16} />
          )}
        </View>
        <Text style={styles.fullUsername} numberOfLines={1}>
          @{user.username}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {user.followersCount || 0} followers
        </Text>
      </View>

      <Text style={styles.fullReason} numberOfLines={3}>
        {user.reason}
      </Text>

      <TouchableOpacity
        style={[
          styles.fullFollowButton,
          isFollowing && styles.fullFollowingButton
        ]}
        onPress={handleFollow}
        disabled={loading}
      >
        {loading ? (
          <InlineLoadingSkeleton />
        ) : (
          <Text style={[
            styles.fullFollowText,
            isFollowing && styles.fullFollowingText
          ]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Compact card styles
  compactCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactHeader: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  dismissButton: {
    padding: 4,
  },
  compactAvatar: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  compactInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  compactDisplayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginRight: 4,
  },
  compactUsername: {
    fontSize: 12,
    color: '#8E8E93',
  },
  compactReason: {
    fontSize: 11,
    color: '#6D6D70',
    textAlign: 'center',
    marginBottom: 12,
    minHeight: 32,
  },
  compactFollowButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  compactFollowingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  compactFollowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  compactFollowingText: {
    color: '#007AFF',
  },

  // Full card styles
  fullCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fullHeader: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  fullAvatar: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  fullInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  fullDisplayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginRight: 4,
  },
  fullUsername: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  statsText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  fullReason: {
    fontSize: 13,
    color: '#6D6D70',
    textAlign: 'center',
    marginBottom: 16,
    minHeight: 39,
    lineHeight: 18,
  },
  fullFollowButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  fullFollowingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  fullFollowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fullFollowingText: {
    color: '#007AFF',
  },
});



