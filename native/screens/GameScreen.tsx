import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography } from '../styles/theme';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const GAME_CARD_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

interface Game {
  id: string;
  title: string;
  description: string;
  imageURL: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  players: {
    current: number;
    max: number;
  };
  stats: {
    plays: number;
    rating: number;
    reviews: number;
  };
  rewards: {
    coins: number;
    xp: number;
  };
  isMultiplayer: boolean;
  isPremium: boolean;
  estimatedTime: string;
}

interface UserGameStats {
  level: number;
  xp: number;
  nextLevelXp: number;
  coins: number;
  gamesPlayed: number;
  achievements: number;
  rank: string;
}

export default function GameScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [userStats, setUserStats] = useState<UserGameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Games', icon: 'game-controller' },
    { id: 'puzzle', name: 'Puzzle', icon: 'extension-puzzle' },
    { id: 'trivia', name: 'Trivia', icon: 'help-circle' },
    { id: 'action', name: 'Action', icon: 'flash' },
    { id: 'strategy', name: 'Strategy', icon: 'chess-king' },
    { id: 'social', name: 'Social', icon: 'people' },
  ];

  useEffect(() => {
    loadGameData();
  }, [activeCategory]);

  const loadGameData = async () => {
    try {
      setLoading(true);
      
      // Mock user stats
      const mockUserStats: UserGameStats = {
        level: 12,
        xp: 2450,
        nextLevelXp: 3000,
        coins: 1250,
        gamesPlayed: 89,
        achievements: 23,
        rank: 'Gold',
      };
      
      // Mock games data
      const mockGames: Game[] = [
        {
          id: '1',
          title: 'Word Puzzle Master',
          description: 'Challenge your vocabulary with this addictive word puzzle game',
          imageURL: 'https://via.placeholder.com/300x200',
          category: 'puzzle',
          difficulty: 'medium',
          players: { current: 1247, max: 0 },
          stats: { plays: 15420, rating: 4.7, reviews: 892 },
          rewards: { coins: 50, xp: 100 },
          isMultiplayer: false,
          isPremium: false,
          estimatedTime: '5-10 min',
        },
        {
          id: '2',
          title: 'Quiz Battle Arena',
          description: 'Real-time trivia battles with players worldwide',
          imageURL: 'https://via.placeholder.com/300x200',
          category: 'trivia',
          difficulty: 'hard',
          players: { current: 456, max: 2 },
          stats: { plays: 8934, rating: 4.5, reviews: 567 },
          rewards: { coins: 100, xp: 200 },
          isMultiplayer: true,
          isPremium: true,
          estimatedTime: '3-5 min',
        },
        {
          id: '3',
          title: 'Memory Match',
          description: 'Test your memory with this classic matching game',
          imageURL: 'https://via.placeholder.com/300x200',
          category: 'puzzle',
          difficulty: 'easy',
          players: { current: 234, max: 0 },
          stats: { plays: 12567, rating: 4.3, reviews: 345 },
          rewards: { coins: 25, xp: 50 },
          isMultiplayer: false,
          isPremium: false,
          estimatedTime: '2-3 min',
        },
        {
          id: '4',
          title: 'Strategy Wars',
          description: 'Build your empire and conquer territories',
          imageURL: 'https://via.placeholder.com/300x200',
          category: 'strategy',
          difficulty: 'hard',
          players: { current: 89, max: 4 },
          stats: { plays: 5678, rating: 4.8, reviews: 234 },
          rewards: { coins: 200, xp: 300 },
          isMultiplayer: true,
          isPremium: true,
          estimatedTime: '15-30 min',
        },
        {
          id: '5',
          title: 'Social Bingo',
          description: 'Play bingo with friends and make new connections',
          imageURL: 'https://via.placeholder.com/300x200',
          category: 'social',
          difficulty: 'easy',
          players: { current: 678, max: 8 },
          stats: { plays: 9876, rating: 4.4, reviews: 456 },
          rewards: { coins: 75, xp: 125 },
          isMultiplayer: true,
          isPremium: false,
          estimatedTime: '10-15 min',
        },
        {
          id: '6',
          title: 'Reflex Runner',
          description: 'Fast-paced action game that tests your reflexes',
          imageURL: 'https://via.placeholder.com/300x200',
          category: 'action',
          difficulty: 'medium',
          players: { current: 345, max: 0 },
          stats: { plays: 7654, rating: 4.6, reviews: 321 },
          rewards: { coins: 60, xp: 120 },
          isMultiplayer: false,
          isPremium: false,
          estimatedTime: '3-5 min',
        },
      ];
      
      setUserStats(mockUserStats);
      
      // Filter games by category
      const filteredGames = activeCategory === 'all' 
        ? mockGames 
        : mockGames.filter(game => game.category === activeCategory);
      
      setGames(filteredGames);
      console.log('🎮 Loaded games:', filteredGames.length);
      
    } catch (error) {
      console.error('Failed to load game data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGameData();
    setRefreshing(false);
  };

  const handleGamePress = (game: Game) => {
    if (game.isPremium && !(user as any)?.isPremium) {
      (navigation as any).navigate('PremiumUpgrade');
      return;
    }
    (navigation as any).navigate('GamePlay', { gameId: game.id });
  };

  const handleLeaderboard = () => {
    (navigation as any).navigate('Leaderboard');
  };

  const handleAchievements = () => {
    (navigation as any).navigate('Achievements');
  };

  const handleShop = () => {
    (navigation as any).navigate('GameShop');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return colors.text.secondary;
    }
  };

  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        activeCategory === item.id && styles.activeCategoryItem
      ]}
      onPress={() => setActiveCategory(item.id)}
    >
      <Ionicons 
        name={item.icon as any} 
        size={24} 
        color={activeCategory === item.id ? '#fff' : colors.text.secondary} 
      />
      <Text style={[
        styles.categoryText,
        activeCategory === item.id && styles.activeCategoryText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderGame = ({ item }: { item: Game }) => (
    <TouchableOpacity 
      style={styles.gameCard}
      onPress={() => handleGamePress(item)}
    >
      <View style={styles.gameImageContainer}>
        <Image source={{ uri: item.imageURL }} style={styles.gameImage} />
        
        {/* Premium Badge */}
        {item.isPremium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="diamond" size={12} color="#fff" />
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        )}
        
        {/* Difficulty Badge */}
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
          <Text style={styles.difficultyText}>{item.difficulty.toUpperCase()}</Text>
        </View>
        
        {/* Multiplayer Indicator */}
        {item.isMultiplayer && (
          <View style={styles.multiplayerIndicator}>
            <Ionicons name="people" size={16} color="#fff" />
          </View>
        )}
      </View>
      
      <View style={styles.gameInfo}>
        <Text style={styles.gameTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.gameDescription} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.gameStats}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.statText}>{item.stats.rating}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="play" size={12} color={colors.text.secondary} />
            <Text style={styles.statText}>{item.stats.plays}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={12} color={colors.text.secondary} />
            <Text style={styles.statText}>{item.estimatedTime}</Text>
          </View>
        </View>
        
        <View style={styles.gameRewards}>
          <View style={styles.rewardItem}>
            <Ionicons name="diamond-outline" size={14} color="#FFD700" />
            <Text style={styles.rewardText}>{item.rewards.coins}</Text>
          </View>
          <View style={styles.rewardItem}>
            <Ionicons name="trending-up" size={14} color="#3b82f6" />
            <Text style={styles.rewardText}>{item.rewards.xp} XP</Text>
          </View>
        </View>
        
        {item.isMultiplayer && (
          <View style={styles.playersInfo}>
            <Ionicons name="people-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.playersText}>
              {item.players.current} playing
              {item.players.max > 0 && ` (max ${item.players.max})`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Games</Text>
        <TouchableOpacity onPress={handleShop}>
          <Ionicons name="storefront-outline" size={28} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading games...</Text>
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          data={games}
          renderItem={renderGame}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gamesList as any}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={
            <View>
              {/* User Stats Card */}
              {userStats && (
                <View style={styles.statsCard}>
                  <View style={styles.statsHeader}>
                    <View style={styles.levelInfo}>
                      <Text style={styles.levelText}>Level {userStats.level}</Text>
                      <Text style={styles.rankText}>{userStats.rank} Rank</Text>
                    </View>
                    <View style={styles.coinsInfo}>
                      <Ionicons name="diamond" size={20} color="#FFD700" />
                      <Text style={styles.coinsText}>{userStats.coins}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.xpContainer}>
                    <View style={styles.xpBar}>
                      <View 
                        style={[
                          styles.xpProgress, 
                          { width: `${(userStats.xp / userStats.nextLevelXp) * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.xpText}>
                      {userStats.xp} / {userStats.nextLevelXp} XP
                    </Text>
                  </View>
                  
                  <View style={styles.quickStats}>
                    <TouchableOpacity style={styles.quickStat} onPress={handleLeaderboard}>
                      <Text style={styles.quickStatValue}>{userStats.gamesPlayed}</Text>
                      <Text style={styles.quickStatLabel}>Games</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.quickStat} onPress={handleAchievements}>
                      <Text style={styles.quickStatValue}>{userStats.achievements}</Text>
                      <Text style={styles.quickStatLabel}>Achievements</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.quickStat} onPress={handleLeaderboard}>
                      <Text style={styles.quickStatValue}>#{Math.floor(Math.random() * 100) + 1}</Text>
                      <Text style={styles.quickStatLabel}>Rank</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {/* Categories */}
              <FlashList estimatedItemSize={100}
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList as any}
              />
              
              <Text style={styles.sectionTitle}>
                {activeCategory === 'all' ? 'All Games' : categories.find(c => c.id === activeCategory)?.name}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  statsCard: {
    backgroundColor: colors.accent.primary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  levelInfo: {
    flex: 1,
  },
  levelText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: '#fff',
  },
  rankText: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
  },
  coinsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  coinsText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: '#fff',
  },
  xpContainer: {
    marginBottom: spacing.md,
  },
  xpBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  xpProgress: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  xpText: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: '#fff',
  },
  quickStatLabel: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  categoriesList: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  activeCategoryItem: {
    backgroundColor: colors.accent.primary,
  },
  categoryText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  activeCategoryText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  gamesList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  gameCard: {
    width: GAME_CARD_WIDTH,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginRight: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  gameImageContainer: {
    position: 'relative',
  },
  gameImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  premiumBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  premiumText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as any,
  },
  difficultyBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as any,
  },
  multiplayerIndicator: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 4,
  },
  gameInfo: {
    padding: spacing.md,
  },
  gameTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  gameDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  gameRewards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
  },
  playersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  playersText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
});
