import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from './ui/Avatar';

type StoryStatus = 'new' | 'viewed' | 'close-friends' | 'own';

interface StoryRingProps {
  user: {
    userId: string;
    username: string;
    avatarURL?: string;
    hasActiveStory: boolean;
    hasViewedAll: boolean;
    isCurrentUser: boolean;
    isCloseFriendsStory: boolean;
  };
  onPress: () => void;
  size?: number;
}

export function StoryRing({ user, onPress, size = 72 }: StoryRingProps) {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.1,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getGradientColors = () => {
    if (user.isCurrentUser && !user.hasActiveStory) {
      return ['#E5E7EB', '#9CA3AF', '#6B7280']; // Gray for add story
    }
    if (user.hasViewedAll) {
      return ['#9CA3AF', '#6B7280', '#4B5563']; // Gray for viewed
    }
    if (user.isCloseFriendsStory) {
      return ['#10B981', '#059669', '#047857']; // Green for close friends
    }
    return ['#EC4899', '#8B5CF6', '#F59E0B']; // Colorful for new stories
  };

  const gradientColors = getGradientColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.container}
      activeOpacity={0.9}
    >
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        {/* Outer Ring */}
        {user.hasActiveStory && (
          <LinearGradient
            colors={gradientColors as any}
            style={[
              styles.gradientRing,
              { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 }
            ]}
          >
            <View style={[
              styles.innerRing,
              { width: size + 2, height: size + 2, borderRadius: (size + 2) / 2 }
            ]} />
          </LinearGradient>
        )}
        
        {/* Avatar */}
        <View style={[
          styles.avatarContainer,
          { width: size, height: size, borderRadius: size / 2 },
          !user.hasActiveStory && styles.noStoryBorder
        ]}>
          <Avatar
            source={user.avatarURL || undefined}
            size={size - 4}
            style={styles.avatar}
          />
          
          {/* Add Story Button */}
          {user.isCurrentUser && !user.hasActiveStory && (
            <View style={styles.addButton}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </View>
          )}
          
          {/* Close Friends Indicator */}
          {user.isCloseFriendsStory && (
            <View style={styles.closeFriendsIndicator}>
              <Ionicons name="star" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>
      </Animated.View>
      
      {/* Username */}
      <Text style={styles.username} numberOfLines={1}>
        {user.isCurrentUser ? 'Your Story' : user.username}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 80,
  },
  gradientRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  noStoryBorder: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  avatar: {
    // Avatar styles handled by Avatar component
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  closeFriendsIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  username: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 72,
  },
});
