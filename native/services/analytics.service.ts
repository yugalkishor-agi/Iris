import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { cacheIntegration } from './cacheIntegration.service';

type Period = '7d' | '30d' | '90d';

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

interface StoryInsights {
  storyId: string;
  totalViews: number;
  totalReach: number;
  totalReplies: number;
  totalShares: number;
  completionRate: number;
  exitRate: number;
  viewsGrowth: number;
  reachGrowth: number;
  repliesGrowth: number;
  averageWatchTime: number;
  topCountries: Array<{ country: string; percentage: number }>;
  ageGroups: Array<{ range: string; percentage: number }>;
  genderSplit: Array<{ gender: string; percentage: number }>;
  viewerRetention: Array<{ second: number; retention: number }>;
}

interface ProfileInsights {
  userId: string;
  totalFollowers: number;
  totalFollowing: number;
  totalPosts: number;
  totalStories: number;
  followersGrowth: number;
  followingGrowth: number;
  postsGrowth: number;
  storiesGrowth: number;
  engagementRate: number;
  reachRate: number;
  topCountries: Array<{ country: string; percentage: number }>;
  ageGroups: Array<{ range: string; percentage: number }>;
  genderSplit: Array<{ gender: string; percentage: number }>;
  activeHours: Array<{ hour: number; activity: number }>;
  contentPerformance: Array<{ type: string; avgEngagement: number }>;
}

const PERIOD_DAYS: Record<Period, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const DEFAULT_AGE_GROUPS = [
  { range: '18-24', percentage: 0 },
  { range: '25-34', percentage: 0 },
  { range: '35-44', percentage: 0 },
  { range: '45+', percentage: 0 },
];

const DEFAULT_GENDER_SPLIT = [
  { gender: 'Female', percentage: 0 },
  { gender: 'Male', percentage: 0 },
  { gender: 'Other', percentage: 0 },
];

const DEFAULT_PEAK_HOURS = [
  { hour: 0, engagement: 0 },
  { hour: 6, engagement: 0 },
  { hour: 12, engagement: 0 },
  { hour: 18, engagement: 0 },
];

const DEFAULT_RETENTION = [
  { second: 0, retention: 0 },
  { second: 5, retention: 0 },
  { second: 10, retention: 0 },
  { second: 15, retention: 0 },
];

const toNumber = (value: any): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const readPath = (source: any, path: string): any => {
  if (!source) return undefined;
  return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), source);
};

const pickNumber = (source: any, paths: string[]): number => {
  for (const path of paths) {
    const value = readPath(source, path);
    if (value !== undefined && value !== null && value !== '') {
      return toNumber(value);
    }
  }
  return 0;
};

const getDateValue = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const topHoursFromEvents = (events: any[]): Array<{ hour: number; engagement: number }> => {
  if (!events.length) return DEFAULT_PEAK_HOURS;

  const hourMap: Record<number, number> = {};
  for (let h = 0; h < 24; h += 1) hourMap[h] = 0;

  events.forEach((event) => {
    const date = getDateValue(event?.timestamp || event?.createdAt || event?.viewedAt);
    if (!date) return;
    hourMap[date.getHours()] += 1;
  });

  const points = Object.entries(hourMap)
    .map(([hour, engagement]) => ({ hour: Number(hour), engagement }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 6)
    .sort((a, b) => a.hour - b.hour);

  return points.length ? points : DEFAULT_PEAK_HOURS;
};

const growthFromSeries = (series: any[], paths: string[]): number => {
  if (!series.length) return 0;
  const sorted = [...series].sort((a, b) => {
    const aDate = getDateValue(a?.date || a?.createdAt || a?.timestamp)?.getTime() || 0;
    const bDate = getDateValue(b?.date || b?.createdAt || b?.timestamp)?.getTime() || 0;
    return aDate - bDate;
  });

  const first = pickNumber(sorted[0], paths);
  const last = pickNumber(sorted[sorted.length - 1], paths);

  if (first <= 0) {
    return last > 0 ? 100 : 0;
  }

  return Number((((last - first) / first) * 100).toFixed(1));
};

const normalizeTopList = <T extends Record<string, any>>(arr: any, fallback: T[]): T[] => {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  return arr.map((item) => ({ ...item })) as T[];
};

export class AnalyticsService {
  async getPostInsights(postId: string, period: Period = '7d'): Promise<PostInsights> {
    const cacheKey = `post_insights_${postId}_${period}`;

    try {
      const cached = await cacheIntegration.getCachedData(cacheKey);
      if (cached) return cached as PostInsights;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - PERIOD_DAYS[period]);

      const analyticsRef = collection(db, 'analytics', 'posts', postId);
      const analyticsQuery = query(
        analyticsRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      );

      const [analyticsSnap, postSnap, viewsSnap, engagementsSnap] = await Promise.all([
        getDocs(analyticsQuery),
        getDoc(doc(db, 'posts', postId)),
        getDocs(collection(db, 'analytics', 'posts', postId, 'views')),
        getDocs(collection(db, 'analytics', 'posts', postId, 'engagements')),
      ]);

      const series = analyticsSnap.docs.map((d) => d.data());
      const postData = postSnap.data() || {};
      const viewsData = viewsSnap.docs.map((d) => d.data());
      const engagements = engagementsSnap.docs.map((d) => d.data());

      const stats = postData?.stats || {};
      const totalLikes = Math.max(pickNumber(stats, ['likesCount']), series.reduce((sum, row) => sum + pickNumber(row, ['likes', 'likesCount', 'totalLikes']), 0));
      const totalComments = Math.max(pickNumber(stats, ['commentsCount']), series.reduce((sum, row) => sum + pickNumber(row, ['comments', 'commentsCount', 'totalComments']), 0));
      const totalShares = Math.max(pickNumber(stats, ['sharesCount']), series.reduce((sum, row) => sum + pickNumber(row, ['shares', 'sharesCount', 'totalShares']), 0));
      const totalSaves = Math.max(pickNumber(stats, ['savesCount']), series.reduce((sum, row) => sum + pickNumber(row, ['saves', 'savesCount', 'totalSaves']), 0));
      const totalViews = Math.max(pickNumber(stats, ['viewsCount']), viewsSnap.size);
      const totalReach = Math.max(pickNumber(stats, ['reachCount']), series.reduce((sum, row) => sum + pickNumber(row, ['reach', 'totalReach']), 0), totalViews);
      const totalImpressions = Math.max(pickNumber(stats, ['impressionsCount']), series.reduce((sum, row) => sum + pickNumber(row, ['impressions', 'totalImpressions']), 0), totalViews);

      const engagementDenominator = Math.max(totalReach, totalImpressions, totalViews);
      const engagementRate = engagementDenominator > 0
        ? Number((((totalLikes + totalComments + totalShares + totalSaves) / engagementDenominator) * 100).toFixed(2))
        : 0;

      const latest = series[0] || {};

      const insights: PostInsights = {
        postId,
        totalReach,
        totalImpressions,
        totalLikes,
        totalComments,
        totalShares,
        totalSaves,
        engagementRate,
        reachGrowth: growthFromSeries(series, ['reach', 'totalReach']),
        impressionsGrowth: growthFromSeries(series, ['impressions', 'totalImpressions']),
        likesGrowth: growthFromSeries(series, ['likes', 'likesCount', 'totalLikes']),
        commentsGrowth: growthFromSeries(series, ['comments', 'commentsCount', 'totalComments']),
        topCountries: normalizeTopList(latest?.topCountries, []),
        topCities: normalizeTopList(latest?.topCities, []),
        ageGroups: normalizeTopList(latest?.ageGroups, DEFAULT_AGE_GROUPS),
        genderSplit: normalizeTopList(latest?.genderSplit, DEFAULT_GENDER_SPLIT),
        peakHours: topHoursFromEvents(viewsData),
        deviceTypes: normalizeTopList(latest?.deviceTypes, []),
        referralSources: normalizeTopList(latest?.referralSources, this.groupEngagementSources(engagements)),
      };

      await cacheIntegration.cacheData(cacheKey, insights, 60 * 60 * 1000);
      return insights;
    } catch (error) {
      console.error('Error getting post insights:', error);
      return this.emptyPostInsights(postId);
    }
  }

  async getStoryInsights(storyId: string, period: Period = '7d'): Promise<StoryInsights> {
    const cacheKey = `story_insights_${storyId}_${period}`;

    try {
      const cached = await cacheIntegration.getCachedData(cacheKey);
      if (cached) return cached as StoryInsights;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - PERIOD_DAYS[period]);

      const analyticsRef = collection(db, 'analytics', 'stories', storyId);
      const analyticsQuery = query(
        analyticsRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      );

      const [analyticsSnap, storySnap, viewsSnap, engagementsSnap] = await Promise.all([
        getDocs(analyticsQuery),
        getDoc(doc(db, 'stories', storyId)),
        getDocs(collection(db, 'analytics', 'stories', storyId, 'views')),
        getDocs(collection(db, 'analytics', 'stories', storyId, 'engagements')),
      ]);

      const series = analyticsSnap.docs.map((d) => d.data());
      const storyData = storySnap.data() || {};
      const stats = storyData?.stats || {};
      const latest = series[0] || {};

      const totalViews = Math.max(pickNumber(stats, ['viewsCount']), viewsSnap.size, series.reduce((sum, row) => sum + pickNumber(row, ['views', 'totalViews']), 0));
      const totalReach = Math.max(pickNumber(stats, ['reachCount']), series.reduce((sum, row) => sum + pickNumber(row, ['reach', 'totalReach']), 0), totalViews);
      const totalReplies = Math.max(pickNumber(stats, ['repliesCount']), engagementsSnap.docs.filter((d) => d.data()?.action === 'comment').length, series.reduce((sum, row) => sum + pickNumber(row, ['replies', 'totalReplies']), 0));
      const totalShares = Math.max(pickNumber(stats, ['sharesCount']), engagementsSnap.docs.filter((d) => d.data()?.action === 'share').length, series.reduce((sum, row) => sum + pickNumber(row, ['shares', 'totalShares']), 0));

      const completionRate = pickNumber(latest, ['completionRate']) || 0;
      const exitRate = pickNumber(latest, ['exitRate']) || (completionRate > 0 ? Number((100 - completionRate).toFixed(1)) : 0);
      const averageWatchTime = pickNumber(latest, ['averageWatchTime', 'avgWatchTime']);

      const insights: StoryInsights = {
        storyId,
        totalViews,
        totalReach,
        totalReplies,
        totalShares,
        completionRate,
        exitRate,
        viewsGrowth: growthFromSeries(series, ['views', 'totalViews']),
        reachGrowth: growthFromSeries(series, ['reach', 'totalReach']),
        repliesGrowth: growthFromSeries(series, ['replies', 'totalReplies']),
        averageWatchTime,
        topCountries: normalizeTopList(latest?.topCountries, []),
        ageGroups: normalizeTopList(latest?.ageGroups, DEFAULT_AGE_GROUPS),
        genderSplit: normalizeTopList(latest?.genderSplit, DEFAULT_GENDER_SPLIT),
        viewerRetention: normalizeTopList(latest?.viewerRetention, DEFAULT_RETENTION),
      };

      await cacheIntegration.cacheData(cacheKey, insights, 60 * 60 * 1000);
      return insights;
    } catch (error) {
      console.error('Error getting story insights:', error);
      return this.emptyStoryInsights(storyId);
    }
  }

  async getProfileInsights(userId: string, period: Period = '30d'): Promise<ProfileInsights> {
    const cacheKey = `profile_insights_${userId}_${period}`;

    try {
      const cached = await cacheIntegration.getCachedData(cacheKey);
      if (cached) return cached as ProfileInsights;

      const analyticsRef = collection(db, 'analytics', 'profiles', userId);
      const analyticsQuery = query(analyticsRef, orderBy('date', 'desc'), limit(100));

      const [analyticsSnap, userSnap] = await Promise.all([
        getDocs(analyticsQuery),
        getDoc(doc(db, 'users', userId)),
      ]);

      const series = analyticsSnap.docs.map((d) => d.data());
      const latest = series[0] || {};
      const userData = userSnap.data() || {};
      const stats = userData?.stats || {};

      const totalFollowers = pickNumber(stats, ['followersCount']);
      const totalFollowing = pickNumber(stats, ['followingCount']);
      const totalPosts = pickNumber(stats, ['postsCount']) || pickNumber(latest, ['totalPosts']);
      const totalStories = pickNumber(stats, ['storiesCount']) || pickNumber(latest, ['totalStories']);
      const engagementRate = pickNumber(latest, ['engagementRate']);
      const reachRate = pickNumber(latest, ['reachRate']);

      const insights: ProfileInsights = {
        userId,
        totalFollowers,
        totalFollowing,
        totalPosts,
        totalStories,
        followersGrowth: growthFromSeries(series, ['followersCount', 'totalFollowers']),
        followingGrowth: growthFromSeries(series, ['followingCount', 'totalFollowing']),
        postsGrowth: growthFromSeries(series, ['postsCount', 'totalPosts']),
        storiesGrowth: growthFromSeries(series, ['storiesCount', 'totalStories']),
        engagementRate,
        reachRate,
        topCountries: normalizeTopList(latest?.topCountries, []),
        ageGroups: normalizeTopList(latest?.ageGroups, DEFAULT_AGE_GROUPS),
        genderSplit: normalizeTopList(latest?.genderSplit, DEFAULT_GENDER_SPLIT),
        activeHours: normalizeTopList(latest?.activeHours, [
          { hour: 8, activity: 0 },
          { hour: 12, activity: 0 },
          { hour: 16, activity: 0 },
          { hour: 20, activity: 0 },
        ]),
        contentPerformance: normalizeTopList(latest?.contentPerformance, [
          { type: 'Photos', avgEngagement: 0 },
          { type: 'Videos', avgEngagement: 0 },
          { type: 'Stories', avgEngagement: 0 },
        ]),
      };

      await cacheIntegration.cacheData(cacheKey, insights, 2 * 60 * 60 * 1000);
      return insights;
    } catch (error) {
      console.error('Error getting profile insights:', error);
      return this.emptyProfileInsights(userId);
    }
  }

  async trackPostView(postId: string, userId: string, metadata: any = {}): Promise<void> {
    try {
      const viewRef = doc(collection(db, 'analytics', 'posts', postId, 'views'));
      await setDoc(viewRef, {
        userId,
        postId,
        timestamp: serverTimestamp(),
        ...metadata,
      });

      await updateDoc(doc(db, 'posts', postId), {
        'stats.viewsCount': increment(1),
      });
    } catch (error) {
      console.error('Error tracking post view:', error);
    }
  }

  async trackStoryView(storyId: string, userId: string, watchTime: number = 0): Promise<void> {
    try {
      const viewRef = doc(collection(db, 'analytics', 'stories', storyId, 'views'));
      await setDoc(viewRef, {
        userId,
        storyId,
        watchTime,
        timestamp: serverTimestamp(),
      });

      await updateDoc(doc(db, 'stories', storyId), {
        'stats.viewsCount': increment(1),
      });
    } catch (error) {
      console.error('Error tracking story view:', error);
    }
  }

  async trackEngagement(
    contentType: 'post' | 'story' | 'glimpse',
    contentId: string,
    userId: string,
    action: 'like' | 'comment' | 'share' | 'save',
    metadata: any = {}
  ): Promise<void> {
    try {
      const targetCollection =
        contentType === 'post' ? 'posts' : contentType === 'story' ? 'stories' : 'glimpses';

      const engagementRef = doc(collection(db, 'analytics', targetCollection, contentId, 'engagements'));
      await setDoc(engagementRef, {
        userId,
        contentId,
        contentType,
        action,
        timestamp: serverTimestamp(),
        ...metadata,
      });
    } catch (error) {
      console.error('Error tracking engagement:', error);
    }
  }

  private groupEngagementSources(engagements: any[]): Array<{ source: string; percentage: number }> {
    if (!engagements.length) return [];

    const total = engagements.length;
    const buckets: Record<string, number> = {};

    engagements.forEach((engagement) => {
      const source = String(engagement?.source || engagement?.referrer || 'Direct');
      buckets[source] = (buckets[source] || 0) + 1;
    });

    return Object.entries(buckets)
      .map(([source, count]) => ({ source, percentage: Number(((count / total) * 100).toFixed(1)) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 6);
  }

  private emptyPostInsights(postId: string): PostInsights {
    return {
      postId,
      totalReach: 0,
      totalImpressions: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalSaves: 0,
      engagementRate: 0,
      reachGrowth: 0,
      impressionsGrowth: 0,
      likesGrowth: 0,
      commentsGrowth: 0,
      topCountries: [],
      topCities: [],
      ageGroups: DEFAULT_AGE_GROUPS,
      genderSplit: DEFAULT_GENDER_SPLIT,
      peakHours: DEFAULT_PEAK_HOURS,
      deviceTypes: [],
      referralSources: [],
    };
  }

  private emptyStoryInsights(storyId: string): StoryInsights {
    return {
      storyId,
      totalViews: 0,
      totalReach: 0,
      totalReplies: 0,
      totalShares: 0,
      completionRate: 0,
      exitRate: 0,
      viewsGrowth: 0,
      reachGrowth: 0,
      repliesGrowth: 0,
      averageWatchTime: 0,
      topCountries: [],
      ageGroups: DEFAULT_AGE_GROUPS,
      genderSplit: DEFAULT_GENDER_SPLIT,
      viewerRetention: DEFAULT_RETENTION,
    };
  }

  private emptyProfileInsights(userId: string): ProfileInsights {
    return {
      userId,
      totalFollowers: 0,
      totalFollowing: 0,
      totalPosts: 0,
      totalStories: 0,
      followersGrowth: 0,
      followingGrowth: 0,
      postsGrowth: 0,
      storiesGrowth: 0,
      engagementRate: 0,
      reachRate: 0,
      topCountries: [],
      ageGroups: DEFAULT_AGE_GROUPS,
      genderSplit: DEFAULT_GENDER_SPLIT,
      activeHours: [
        { hour: 8, activity: 0 },
        { hour: 12, activity: 0 },
        { hour: 16, activity: 0 },
        { hour: 20, activity: 0 },
      ],
      contentPerformance: [
        { type: 'Photos', avgEngagement: 0 },
        { type: 'Videos', avgEngagement: 0 },
        { type: 'Stories', avgEngagement: 0 },
      ],
    };
  }
}

export const analyticsService = new AnalyticsService();
