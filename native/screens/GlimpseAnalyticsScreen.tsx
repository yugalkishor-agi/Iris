import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { glimpseService } from '../services/glimpse.service';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface GlimpseAnalytics {
  glimpseId: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  topCountries: Array<{ country: string; percentage: number }>;
  ageGroups: Array<{ range: string; percentage: number }>;
  genderSplit: { male: number; female: number; other: number };
  peakViewingTime: string;
  averageWatchTime: number;
  completionRate: number;
}

export default function GlimpseAnalyticsScreen() {
  const [analytics, setAnalytics] = useState<GlimpseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { glimpseId } = (route.params as any) || {};

  useEffect(() => {
    if (glimpseId) {
      loadAnalytics();
    }
  }, [glimpseId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock analytics data - in production, this would come from analytics service
      const mockAnalytics: GlimpseAnalytics = {
        glimpseId: glimpseId,
        title: 'My Amazing Glimpse',
        views: 12547,
        likes: 1834,
        comments: 267,
        shares: 89,
        saves: 156,
        reach: 9876,
        impressions: 15432,
        engagementRate: 14.6,
        topCountries: [
          { country: 'United States', percentage: 45.2 },
          { country: 'United Kingdom', percentage: 18.7 },
          { country: 'Canada', percentage: 12.3 },
          { country: 'Australia', percentage: 8.9 },
          { country: 'Germany', percentage: 6.1 },
        ],
        ageGroups: [
          { range: '18-24', percentage: 32.1 },
          { range: '25-34', percentage: 28.7 },
          { range: '35-44', percentage: 19.4 },
          { range: '45-54', percentage: 12.8 },
          { range: '55+', percentage: 7.0 },
        ],
        genderSplit: {
          male: 42.3,
          female: 54.7,
          other: 3.0,
        },
        peakViewingTime: '8:00 PM',
        averageWatchTime: 8.5,
        completionRate: 76.2,
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const StatCard = ({ title, value, subtitle, icon, color = colors.accent.primary }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color?: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const ProgressBar = ({ label, value, color = colors.accent.primary }: {
    label: string;
    value: number;
    color?: string;
  }) => (
    <View style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}%</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${value}%`, backgroundColor: color }
          ]} 
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Analytics not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.timeRangeSelector}>
        {(['7d', '30d', '90d'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              timeRange === range && styles.timeRangeButtonActive
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[
              styles.timeRangeText,
              timeRange === range && styles.timeRangeTextActive
            ]}>
              {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.glimpseTitle}>{analytics.title}</Text>

        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Views"
              value={formatNumber(analytics.views)}
              icon="eye"
              color="#8B5CF6"
            />
            <StatCard
              title="Likes"
              value={formatNumber(analytics.likes)}
              icon="heart"
              color="#EF4444"
            />
            <StatCard
              title="Comments"
              value={formatNumber(analytics.comments)}
              icon="chatbubble"
              color="#06B6D4"
            />
            <StatCard
              title="Shares"
              value={formatNumber(analytics.shares)}
              icon="share"
              color="#10B981"
            />
          </View>
        </View>

        {/* Engagement Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engagement</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Reach"
              value={formatNumber(analytics.reach)}
              subtitle="Unique accounts"
              icon="people"
              color="#F59E0B"
            />
            <StatCard
              title="Impressions"
              value={formatNumber(analytics.impressions)}
              subtitle="Total views"
              icon="trending-up"
              color="#8B5CF6"
            />
            <StatCard
              title="Engagement Rate"
              value={`${analytics.engagementRate}%`}
              subtitle="Interactions/Views"
              icon="pulse"
              color="#EF4444"
            />
            <StatCard
              title="Completion Rate"
              value={`${analytics.completionRate}%`}
              subtitle="Watched to end"
              icon="checkmark-circle"
              color="#10B981"
            />
          </View>
        </View>

        {/* Audience Demographics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audience</Text>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Top Countries</Text>
            {analytics.topCountries.map((country, index) => (
              <ProgressBar
                key={index}
                label={country.country}
                value={country.percentage}
                color={colors.accent.primary}
              />
            ))}
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Age Groups</Text>
            {analytics.ageGroups.map((age, index) => (
              <ProgressBar
                key={index}
                label={age.range}
                value={age.percentage}
                color="#8B5CF6"
              />
            ))}
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Gender Split</Text>
            <ProgressBar label="Female" value={analytics.genderSplit.female} color="#EF4444" />
            <ProgressBar label="Male" value={analytics.genderSplit.male} color="#06B6D4" />
            <ProgressBar label="Other" value={analytics.genderSplit.other} color="#10B981" />
          </View>
        </View>

        {/* Performance Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          <View style={styles.insightCard}>
            <Ionicons name="time" size={20} color={colors.accent.primary} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Peak Viewing Time</Text>
              <Text style={styles.insightValue}>{analytics.peakViewingTime}</Text>
              <Text style={styles.insightDescription}>
                Most of your audience is active around this time
              </Text>
            </View>
          </View>
          
          <View style={styles.insightCard}>
            <Ionicons name="play" size={20} color="#8B5CF6" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Average Watch Time</Text>
              <Text style={styles.insightValue}>{analytics.averageWatchTime}s</Text>
              <Text style={styles.insightDescription}>
                How long people watch your glimpse on average
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: colors.accent.primary,
  },
  timeRangeText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  timeRangeTextActive: {
    color: colors.text.inverse,
  },
  content: {
    flex: 1,
  },
  glimpseTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    gap: spacing.sm,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  statTitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  statSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  subsection: {
    marginBottom: spacing.lg,
  },
  subsectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  progressItem: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  progressValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold as any,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.background.secondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  insightValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.accent.primary,
    marginBottom: spacing.xs,
  },
  insightDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
