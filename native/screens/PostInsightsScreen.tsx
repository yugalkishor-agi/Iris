import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/post.service';
import { analyticsService } from '../services/analytics.service';
import { Image } from 'expo-image';

interface PostInsights {
  postId: string;
  totalReach: number;
  totalImpressions: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  engagementRate: number;
  reachGrowth: number;
  impressionsGrowth: number;
  likesGrowth: number;
  commentsGrowth: number;
  topCountries: Array<{ country: string; percentage: number }>;
  topCities: Array<{ city: string; percentage: number }>;
  ageGroups: Array<{ range: string; percentage: number }>;
  genderSplit: Array<{ gender: string; percentage: number }>;
  peakHours: Array<{ hour: number; engagement: number }>;
  deviceTypes: Array<{ device: string; percentage: number }>;
  referralSources: Array<{ source: string; percentage: number }>;
}

interface Post {
  postId: string;
  mediaURLs: string[];
  caption: string;
  createdAt: any;
  stats: {
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    savesCount: number;
  };
}

export default function PostInsightsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const { postId } = (route.params as any) || {};
  
  const [post, setPost] = useState<Post | null>(null);
  const [insights, setInsights] = useState<PostInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  const { width: screenWidth } = Dimensions.get('window');

  useEffect(() => {
    if (postId && user) {
      loadPostInsights();
    }
  }, [postId, user, selectedPeriod]);

  const loadPostInsights = async () => {
    if (!postId || !user) return;
    
    try {
      setLoading(true);
      
      // Load post data
      const postData = await postService.getPost(postId);
      setPost(postData as any);
      
      // Load insights data
      const insightsData = await analyticsService.getPostInsights(postId, selectedPeriod);
      setInsights(insightsData);
    } catch (error) {
      console.error('Error loading post insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPostInsights();
    setRefreshing(false);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {[
        { key: '7d', label: '7 Days' },
        { key: '30d', label: '30 Days' },
        { key: '90d', label: '90 Days' },
      ].map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodButton,
            selectedPeriod === period.key && styles.selectedPeriodButton,
          ]}
          onPress={() => setSelectedPeriod(period.key as any)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.selectedPeriodButtonText,
            ]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewStats = () => {
    if (!insights) return null;
    
    return (
      <View style={styles.overviewContainer}>
        <Text style={styles.sectionTitle}>Overview</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatNumber(insights.totalReach)}</Text>
            <Text style={styles.statLabel}>Reach</Text>
            <Text style={[styles.statGrowth, insights.reachGrowth >= 0 ? styles.positiveGrowth : styles.negativeGrowth]}>
              {formatPercentage(insights.reachGrowth)}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatNumber(insights.totalImpressions)}</Text>
            <Text style={styles.statLabel}>Impressions</Text>
            <Text style={[styles.statGrowth, insights.impressionsGrowth >= 0 ? styles.positiveGrowth : styles.negativeGrowth]}>
              {formatPercentage(insights.impressionsGrowth)}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatNumber(insights.totalLikes)}</Text>
            <Text style={styles.statLabel}>Likes</Text>
            <Text style={[styles.statGrowth, insights.likesGrowth >= 0 ? styles.positiveGrowth : styles.negativeGrowth]}>
              {formatPercentage(insights.likesGrowth)}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatNumber(insights.totalComments)}</Text>
            <Text style={styles.statLabel}>Comments</Text>
            <Text style={[styles.statGrowth, insights.commentsGrowth >= 0 ? styles.positiveGrowth : styles.negativeGrowth]}>
              {formatPercentage(insights.commentsGrowth)}
            </Text>
          </View>
        </View>
        
        <View style={styles.engagementCard}>
          <Text style={styles.engagementTitle}>Engagement Rate</Text>
          <Text style={styles.engagementValue}>{insights.engagementRate.toFixed(2)}%</Text>
          <Text style={styles.engagementDescription}>
            Based on likes, comments, shares, and saves
          </Text>
        </View>
      </View>
    );
  };

  const renderAudienceInsights = () => {
    if (!insights) return null;
    
    return (
      <View style={styles.audienceContainer}>
        <Text style={styles.sectionTitle}>Audience Insights</Text>
        
        {/* Top Countries */}
        <View style={styles.insightCard}>
          <Text style={styles.insightCardTitle}>Top Countries</Text>
          {insights.topCountries.map((country, index) => (
            <View key={index} style={styles.insightRow}>
              <Text style={styles.insightLabel}>{country.country}</Text>
              <Text style={styles.insightValue}>{country.percentage.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
        
        {/* Age Groups */}
        <View style={styles.insightCard}>
          <Text style={styles.insightCardTitle}>Age Groups</Text>
          {insights.ageGroups.map((group, index) => (
            <View key={index} style={styles.insightRow}>
              <Text style={styles.insightLabel}>{group.range}</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${group.percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.insightValue}>{group.percentage.toFixed(1)}%</Text>
              </View>
            </View>
          ))}
        </View>
        
        {/* Gender Split */}
        <View style={styles.insightCard}>
          <Text style={styles.insightCardTitle}>Gender Split</Text>
          {insights.genderSplit.map((gender, index) => (
            <View key={index} style={styles.insightRow}>
              <Text style={styles.insightLabel}>{gender.gender}</Text>
              <Text style={styles.insightValue}>{gender.percentage.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPerformanceInsights = () => {
    if (!insights) return null;
    
    return (
      <View style={styles.performanceContainer}>
        <Text style={styles.sectionTitle}>Performance Insights</Text>
        
        {/* Peak Hours */}
        <View style={styles.insightCard}>
          <Text style={styles.insightCardTitle}>Peak Engagement Hours</Text>
          <View style={styles.hoursChart}>
            {insights.peakHours.map((hour, index) => (
              <View key={index} style={styles.hourBar}>
                <View
                  style={[
                    styles.hourBarFill,
                    {
                      height: `${(hour.engagement / Math.max(...insights.peakHours.map(h => h.engagement))) * 100}%`,
                    },
                  ]}
                />
                <Text style={styles.hourLabel}>{hour.hour}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Device Types */}
        <View style={styles.insightCard}>
          <Text style={styles.insightCardTitle}>Device Types</Text>
          {insights.deviceTypes.map((device, index) => (
            <View key={index} style={styles.insightRow}>
              <Text style={styles.insightLabel}>{device.device}</Text>
              <Text style={styles.insightValue}>{device.percentage.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
        
        {/* Referral Sources */}
        <View style={styles.insightCard}>
          <Text style={styles.insightCardTitle}>Traffic Sources</Text>
          {insights.referralSources.map((source, index) => (
            <View key={index} style={styles.insightRow}>
              <Text style={styles.insightLabel}>{source.source}</Text>
              <Text style={styles.insightValue}>{source.percentage.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Insights</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading insights...</Text>
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
        <Text style={styles.headerTitle}>Post Insights</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => {
            // Share insights functionality
          }}
        >
          <Ionicons name="share-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Post Preview */}
        {post && (
          <View style={styles.postPreview}>
            <Image source={{ uri: post.mediaURLs[0] }} style={styles.postImage} />
            <View style={styles.postInfo}>
              <Text style={styles.postCaption} numberOfLines={2}>
                {post.caption || 'No caption'}
              </Text>
              <Text style={styles.postDate}>
                {new Date(post.createdAt?.toDate?.() || post.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}

        {/* Period Selector */}
        {renderPeriodSelector()}

        {/* Overview Stats */}
        {renderOverviewStats()}

        {/* Audience Insights */}
        {renderAudienceInsights()}

        {/* Performance Insights */}
        {renderPerformanceInsights()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  shareButton: {
    padding: 8,
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
    color: '#8E8E93',
    marginTop: 12,
  },
  content: {
    flex: 1,
  },
  postPreview: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  postImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  postInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  postCaption: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  postDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  selectedPeriodButtonText: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  overviewContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginRight: '2%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statGrowth: {
    fontSize: 12,
    fontWeight: '600',
  },
  positiveGrowth: {
    color: '#34C759',
  },
  negativeGrowth: {
    color: '#FF3B30',
  },
  engagementCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  engagementTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  engagementValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  engagementDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  audienceContainer: {
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  performanceContainer: {
    padding: 16,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  insightCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  insightLabel: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  hoursChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    marginTop: 12,
  },
  hourBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 1,
  },
  hourBarFill: {
    width: '80%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
    minHeight: 4,
  },
  hourLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 4,
  },
});
