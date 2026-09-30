import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, RefreshControl, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SuggestionCard } from '../components/suggestions/SuggestionCard';
import { suggestionService } from '../services/suggestion.service';
import { useAuth } from '../contexts/AuthContext';
import { FlashList } from '@shopify/flash-list';

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

export default function FollowSuggestionsScreenEnhanced() {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // State
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  // Mock data for demonstration
  const generateMockSuggestions = (pageNum: number): SuggestedUser[] => {
    const baseUsers = [
      {
        userId: `user${pageNum * 10 + 1}`,
        username: 'photographer_pro',
        displayName: 'Alex Photography',
        avatarURL: `https://picsum.photos/100/100?random=${pageNum * 10 + 1}`,
        bio: 'Professional photographer capturing life\'s moments',
        followersCount: 12500,
        followingCount: 890,
        score: 95,
        reason: 'Followed by 5 people you follow',
        verified: true,
      },
      {
        userId: `user${pageNum * 10 + 2}`,
        username: 'travel_diary',
        displayName: 'Emma Travels',
        avatarURL: `https://picsum.photos/100/100?random=${pageNum * 10 + 2}`,
        bio: 'Exploring the world one city at a time ✈️',
        followersCount: 8900,
        followingCount: 1200,
        score: 88,
        reason: 'Similar interests in travel',
      },
      {
        userId: `user${pageNum * 10 + 3}`,
        username: 'tech_guru',
        displayName: 'David Tech',
        avatarURL: `https://picsum.photos/100/100?random=${pageNum * 10 + 3}`,
        bio: 'Software engineer & tech enthusiast',
        followersCount: 15600,
        followingCount: 567,
        score: 82,
        reason: 'Popular in your area',
        verified: true,
      },
      {
        userId: `user${pageNum * 10 + 4}`,
        username: 'foodie_life',
        displayName: 'Sarah Foodie',
        avatarURL: `https://picsum.photos/100/100?random=${pageNum * 10 + 4}`,
        bio: 'Food blogger sharing delicious recipes',
        followersCount: 6700,
        followingCount: 890,
        score: 76,
        reason: 'New to Iris',
      },
      {
        userId: `user${pageNum * 10 + 5}`,
        username: 'fitness_coach',
        displayName: 'Mike Fitness',
        avatarURL: `https://picsum.photos/100/100?random=${pageNum * 10 + 5}`,
        bio: 'Personal trainer helping you reach your goals 💪',
        followersCount: 9800,
        followingCount: 234,
        score: 70,
        reason: 'Active user with similar interests',
      },
      {
        userId: `user${pageNum * 10 + 6}`,
        username: 'art_creator',
        displayName: 'Lisa Art',
        avatarURL: `https://picsum.photos/100/100?random=${pageNum * 10 + 6}`,
        bio: 'Digital artist creating beautiful illustrations',
        followersCount: 4500,
        followingCount: 678,
        score: 68,
        reason: 'Followed by people you follow',
      },
    ];

    return baseUsers.filter(user => !followedUsers.has(user.userId));
  };

  const loadSuggestions = useCallback(async (pageNum: number = 0, refresh: boolean = false) => {
    if (refresh) {
      setIsRefreshing(true);
      setPage(0);
      setHasMore(true);
    } else if (pageNum > 0) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newSuggestions = generateMockSuggestions(pageNum);
      
      if (refresh || pageNum === 0) {
        setSuggestions(newSuggestions);
      } else {
        setSuggestions(prev => [...prev, ...newSuggestions]);
      }
      
      // Check if we have more data
      if (newSuggestions.length < 6 || pageNum >= 3) {
        setHasMore(false);
      }
      
      setPage(pageNum);
    } catch (error) {
      Alert.alert('Error', 'Failed to load suggestions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [followedUsers]);

  useEffect(() => {
    if (user) {
      loadSuggestions(0);
    }
  }, [user, loadSuggestions]);

  const handleRefresh = useCallback(() => {
    loadSuggestions(0, true);
  }, [loadSuggestions]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadSuggestions(page + 1);
    }
  }, [isLoadingMore, hasMore, page, loadSuggestions]);

  const handleFollowSuccess = (userId: string) => {
    setFollowedUsers(prev => new Set(prev).add(userId));
    // Remove from suggestions list
    setSuggestions(prev => prev.filter(user => user.userId !== userId));
  };

  const handleDismiss = (userId: string) => {
    setSuggestions(prev => prev.filter(user => user.userId !== userId));
  };

  const renderSuggestion = ({ item, index }: { item: SuggestedUser; index: number }) => (
    <View style={[styles.suggestionContainer, index % 2 === 0 ? styles.leftColumn : styles.rightColumn]}>
      <SuggestionCard
        user={item}
        onFollowSuccess={() => handleFollowSuccess(item.userId)}
        onDismiss={handleDismiss}
      />
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <InlineLoadingSkeleton />
        <Text style={styles.loadingText}>Loading more suggestions...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#8E8E93" />
      <Text style={styles.emptyTitle}>No more suggestions</Text>
      <Text style={styles.emptyMessage}>
        Check back later for new people to follow
      </Text>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suggested for You</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Suggestions Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Finding people you might know...</Text>
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          data={suggestions}
          renderItem={renderSuggestion}
          keyExtractor={(item) => item.userId}
          numColumns={2}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={(suggestions.length === 0 ? styles.emptyContainer : styles.contentContainer) as any}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  headerSpacer: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  contentContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  suggestionContainer: {
    flex: 1,
  },
  leftColumn: {
    marginRight: 8,
  },
  rightColumn: {
    marginLeft: 8,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
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
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

