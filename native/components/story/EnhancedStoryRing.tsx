import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../ui/Avatar';

type StoryStatus = 'new' | 'viewed' | 'close-friends' | 'own';

interface EnhancedStoryRingProps {
  user: {
    userId: string;
    username: string;
    displayName?: string;
    avatarURL?: string;
    hasActiveStory: boolean;
    hasViewedAll: boolean;
    isCurrentUser: boolean;
    isCloseFriendsStory: boolean;
    isOnline?: boolean;
    storyCount?: number;
    lastStoryTime?: Date;
  };
  onPress: () => void;
  onLongPress?: () => void;
  size?: number;
  showUsername?: boolean;
  style?: any;
}

export function EnhancedStoryRing({
  user,
  onPress,
  onLongPress,
  size = 80,
  showUsername = true,
  style,
}: EnhancedStoryRingProps) {
  const [scaleAnim] = useState(new Animated.Value(1));

  const status = useMemo<StoryStatus>(() => {
    if (user.isCurrentUser) {
      return user.hasActiveStory && user.hasViewedAll ? 'viewed' : 'own';
    }
    if (user.isCloseFriendsStory && !user.hasViewedAll) return 'close-friends';
    if (user.hasViewedAll) return 'viewed';
    return 'new';
  }, [user.hasActiveStory, user.hasViewedAll, user.isCloseFriendsStory, user.isCurrentUser]);

  const ringPalette = useMemo(() => {
    switch (status) {
      case 'own':
        return user.hasActiveStory
          ? ['#F97316', '#EF4444', '#D946EF'] as const
          : ['#6B7280', '#4B5563', '#374151'] as const;
      case 'close-friends':
        return ['#22C55E', '#34D399', '#15803D'] as const;
      case 'viewed':
        return ['#7C8397', '#5D6476', '#444B5A'] as const;
      default:
        return ['#F97316', '#EC4899', '#8B5CF6'] as const;
    }
  }, [status, user.hasActiveStory]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      friction: 7,
      tension: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 7,
      tension: 150,
      useNativeDriver: true,
    }).start();
  };

  const frameSize = size + 10;
  const ringThickness = 6;
  const avatarSize = size - 8;
  const ringInset = ringThickness - 1;
  const showRing = user.hasActiveStory || user.isCurrentUser;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, { width: size + 18 }, style]}
      activeOpacity={0.9}
    >
      <Animated.View style={[styles.ringContainer, { transform: [{ scale: scaleAnim }] }]}>
        <View
          style={[
            styles.ringShadow,
            {
              width: frameSize + 4,
              height: frameSize + 4,
              borderRadius: (frameSize + 4) / 2,
            },
          ]}
        />

        {showRing ? (
          <LinearGradient
            colors={ringPalette}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.gradientRing,
              {
                width: frameSize,
                height: frameSize,
                borderRadius: frameSize / 2,
              },
            ]}
          >
            <View
              style={[
                styles.ringCore,
                {
                  width: frameSize - ringInset * 2,
                  height: frameSize - ringInset * 2,
                  borderRadius: (frameSize - ringInset * 2) / 2,
                },
              ]}
            />
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.emptyRing,
              {
                width: frameSize,
                height: frameSize,
                borderRadius: frameSize / 2,
              },
            ]}
          />
        )}

        <View
          style={[
            styles.avatarShell,
            {
              width: avatarSize + 4,
              height: avatarSize + 4,
              borderRadius: (avatarSize + 4) / 2,
            },
          ]}
        >
          <Avatar
            source={user.avatarURL}
            size={avatarSize}
            fallbackText={user.displayName || user.username}
          />
        </View>

        {user.isOnline && <View style={styles.onlineIndicator} />}

        {user.isCurrentUser && !user.hasActiveStory && (
          <View style={styles.addButton}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
          </View>
        )}

        {user.isCloseFriendsStory && user.hasActiveStory && !user.hasViewedAll && (
          <View style={styles.closeFriendsIndicator}>
            <Ionicons name="star" size={12} color="#FFFFFF" />
          </View>
        )}

        {!!(user.storyCount && user.storyCount > 1) && (
          <View style={styles.storyCountBadge}>
            <Text style={styles.storyCountText}>{user.storyCount}</Text>
          </View>
        )}
      </Animated.View>

      {showUsername && (
        <Text style={styles.username} numberOfLines={1}>
          {user.isCurrentUser ? (user.hasActiveStory ? 'Your Story' : 'Add Story') : (user.displayName || user.username)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 6,
  },
  ringContainer: {
    position: 'relative',
    width: 94,
    height: 94,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(7, 10, 20, 0.22)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 8,
  },
  gradientRing: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCore: {
    backgroundColor: '#080D18',
  },
  emptyRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'rgba(125, 133, 151, 0.45)',
    backgroundColor: 'rgba(8, 13, 24, 0.82)',
  },
  avatarShell: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080D18',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#080D18',
  },
  addButton: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#080D18',
  },
  closeFriendsIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#080D18',
  },
  storyCountBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  storyCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  username: {
    marginTop: 7,
    maxWidth: 88,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
});