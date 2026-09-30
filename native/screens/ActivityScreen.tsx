import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notification.service';
import { colors, spacing, typography } from '../styles/theme';
import { ScreenSkeleton } from '../components/ui/LoadingSkeleton';
import { useActivityData } from './ActivityScreen/hooks/useActivityData';
import { ActivityListItem } from './ActivityScreen/components/ActivityListItem';
import { ActivityItem } from './ActivityScreen/types';

export default function ActivityScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const {
    activities, loading, refreshing, filter, setFilter, handleRefresh, markAsReadLocally
  } = useActivityData(user);

  const handleActivityPress = useCallback(async (activity: ActivityItem) => {
    try {
      await notificationService.markAsRead(activity.id);
    } catch {}
    markAsReadLocally(activity.id);
    
    if (activity.content) {
      switch (activity.content.type) {
        case 'post':
          (navigation as any).navigate('PostView', { postId: activity.content.id });
          break;
        case 'glimpse':
          (navigation as any).navigate('GlimpseViewer', { glimpseId: activity.content.id });
          break;
        case 'story':
          (navigation as any).navigate('StoryViewerEnhanced', { userId: activity.user.userId });
          break;
      }
    } else if (activity.type === 'follow') {
      (navigation as any).navigate('UserProfile', { userId: activity.user.userId });
    }
  }, [markAsReadLocally, navigation]);

  const renderActivity = useCallback(({ item }: { item: ActivityItem }) => (
    <ActivityListItem item={item} onPress={handleActivityPress} />
  ), [handleActivityPress]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity</Text>
        <View style={{ width: 28 }} />
      </View>
      
      <View style={styles.filters}>
        <TouchableOpacity style={[styles.filterButton, filter === 'all' && styles.activeFilter]} onPress={() => setFilter('all')}>
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, filter === 'unread' && styles.activeFilter]} onPress={() => setFilter('unread')}>
          <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>Unread</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ScreenSkeleton variant="cards" rows={6} />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="notifications-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptySubtitle}>When people interact with your content, you'll see it here</Text>
        </View>
      ) : (
        <FlashList
          data={activities}
          renderItem={renderActivity}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.text.primary} />}
          contentContainerStyle={styles.listContainer as any}
          estimatedItemSize={80}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary },
  filters: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  filterButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, backgroundColor: colors.background.secondary },
  activeFilter: { backgroundColor: colors.accent.primary },
  filterText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium as any, color: colors.text.secondary },
  activeFilterText: { color: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  loadingText: { fontSize: typography.fontSize.base, color: colors.text.secondary, marginTop: spacing.md },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary, marginTop: spacing.lg },
  emptySubtitle: { fontSize: typography.fontSize.base, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm },
  listContainer: { paddingBottom: spacing.xl },
});
