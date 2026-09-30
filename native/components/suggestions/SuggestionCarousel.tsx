import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../ui/LoadingSkeleton';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { suggestionService } from '../../services/suggestion.service';
import { userService } from '../../services/user.service';
import { Image } from 'expo-image';

interface SuggestedUser {
  userId: string;
  username: string;
  displayName?: string;
  avatarURL?: string;
  coverImageURL?: string;
  verified?: boolean;
  followersCount?: number;
  score: number;
  reason: string;
}

interface SuggestionCarouselProps {
  userId: string;
  onToggleVisibility?: () => void;
}

export function SuggestionCarousel({ userId, onToggleVisibility }: SuggestionCarouselProps) {
  const { user: currentUser } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>({});

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await suggestionService.getSuggestionsForUser(userId, 10, 0);
      setSuggestions(data);
      
      // Initialize following states
      const states: { [key: string]: boolean } = {};
      data.forEach(user => {
        states[user.userId] = false; // Will be updated by follow check
      });
      setFollowingStates(states);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isVisible && currentUser?.userId === userId) {
      loadSuggestions();
    } else {
      setLoading(false);
    }
  }, [isVisible, userId, currentUser, loadSuggestions]);

  const toggleVisibility = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    
    if (newState && suggestions.length === 0) {
      loadSuggestions();
    }
    
    onToggleVisibility?.();
  };

  const handleFollow = async (suggestedUser: SuggestedUser) => {
    if (!currentUser) return;

    try {
      await userService.followUser(currentUser.userId, suggestedUser.userId);
      
      setFollowingStates(prev => ({
        ...prev,
        [suggestedUser.userId]: true,
      }));

      // Remove from suggestions after following
      setSuggestions(prev => prev.filter(user => user.userId !== suggestedUser.userId));
      
      // Clear cache to refresh suggestions
      suggestionService.clearCache(currentUser.userId);
      
      Alert.alert('Success', `You are now following @${suggestedUser.username}`);
    } catch (error) {
      console.error('Error following user:', error);
      Alert.alert('Error', 'Failed to follow user');
    }
  };

  const handleDismiss = (suggestedUser: SuggestedUser) => {
    setSuggestions(prev => prev.filter(user => user.userId !== suggestedUser.userId));
  };

  // Don't show on other users' profiles
  if (!currentUser || currentUser.userId !== userId) {
    return null;
  }

  // Hidden state - don't show anything
  if (!isVisible) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <InlineLoadingSkeleton />
          <Text style={styles.loadingText}>Loading suggestions...</Text>
        </View>
      </View>
    );
  }

  // No suggestions
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header with toggle */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suggested for You</Text>
        <TouchableOpacity
          onPress={toggleVisibility}
          style={styles.hideButton}
        >
          <Ionicons name="close" size={16} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Horizontal scroll container */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent as any}
      >
        {suggestions.map((user) => (
          <View key={user.userId} style={styles.suggestionCard}>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => handleDismiss(user)}
            >
              <Ionicons name="close" size={16} color={colors.text.secondary} />
            </TouchableOpacity>

            {/* Cover Image */}
            {user.coverImageURL && (
              <Image 
                source={{ uri: user.coverImageURL }} 
                style={styles.coverImage}
                contentFit="cover"
              />
            )}

            {/* Avatar */}
            <Avatar 
              source={user.avatarURL} 
              size={80} 
              fallbackText={user.displayName}
              style={styles.avatar}
            />
            
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.username} numberOfLines={1}>
                  {user.username}
                </Text>
                {user.verified && (
                  <VerifiedBadge size={14} />
                )}
              </View>
              <Text style={styles.displayName} numberOfLines={1}>
                {user.displayName}
              </Text>
            </View>

            <Text style={styles.reason} numberOfLines={2}>
              {user.reason}
            </Text>

            {user.followersCount && user.followersCount > 0 && (
              <Text style={styles.followersCount}>
                {user.followersCount.toLocaleString()} followers
              </Text>
            )}

            <TouchableOpacity
              style={styles.followButton}
              onPress={() => handleFollow(user)}
            >
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Scroll indicator */}
      <View style={styles.scrollIndicator}>
        <Text style={styles.scrollIndicatorText}>Swipe for more →</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  hideButton: {
    padding: spacing.sm,
  },
  scrollContainer: {
    paddingLeft: spacing.lg,
  },
  scrollContent: {
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  suggestionCard: {
    width: 160,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  coverImage: {
    width: '100%',
    height: 60,
    backgroundColor: colors.background.tertiary,
  },
  avatar: {
    marginTop: -30,
    marginBottom: spacing.sm,
    borderWidth: 3,
    borderColor: colors.background.secondary,
  },
  dismissButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  username: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    maxWidth: 100,
  },
  displayName: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    maxWidth: 120,
  },
  reason: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    minHeight: 32,
  },
  followersCount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  followButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    width: '100%',
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.inverse,
  },
  scrollIndicator: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  scrollIndicatorText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
});

