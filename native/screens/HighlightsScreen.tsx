import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { highlightService } from '../services/highlight.service';
import { cacheIntegration } from '../services/cacheIntegration.service';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography } from '../styles/theme';
import { ScreenSkeleton } from '../components/ui/LoadingSkeleton';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

export default function HighlightsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const targetUserId = (route.params as any)?.userId || user?.userId;
  const highlightsRef = useRef<any[]>([]);
  const highlightsCacheKey = targetUserId ? `highlights_screen_v2:${targetUserId}` : '';

  useEffect(() => {
    highlightsRef.current = highlights;
  }, [highlights]);

  const loadHighlights = useCallback(async (refresh = false) => {
    if (!targetUserId) return;

    try {
      if (refresh) {
        setRefreshing(true);
      } else if (highlightsRef.current.length === 0) {
        setLoading(true);
      }

      if (!refresh && highlightsRef.current.length === 0 && highlightsCacheKey) {
        const cached = await cacheIntegration.getCachedData(highlightsCacheKey);
        if (Array.isArray(cached) && cached.length > 0) {
          setHighlights(cached);
          setLoading(false);
        }
      }

      const data = await highlightService.getUserHighlights(targetUserId);
      const next = data || [];
      setHighlights(next);
      if (highlightsCacheKey) {
        void cacheIntegration.cacheData(highlightsCacheKey, next, 10 * 60 * 1000);
      }
    } catch (error) {
      console.error('Failed to load highlights:', error);
      if (highlightsRef.current.length === 0) {
        setHighlights([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [highlightsCacheKey, targetUserId]);

  useEffect(() => {
    void loadHighlights(false);
  }, [loadHighlights]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        const stories = Array.isArray(item.stories) ? item.stories : [];
        if (stories.length > 0) {
          (navigation as any).navigate('StoryViewerEnhanced', {
            storyId: stories[0].storyId,
          });
        }
      }}
    >
      <Image source={{ uri: item.coverImageURL || item.stories?.[0]?.mediaURL || '' }} style={styles.cover} />
      <View style={styles.itemText}>
        <Text style={styles.name}>{item.title || 'Untitled'}</Text>
        <Text style={styles.count}>{item.storiesCount || item.stories?.length || 0} stories</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Story Highlights</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('StoryCreate')}>
          <Ionicons name="add" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ScreenSkeleton variant="grid" rows={6} />
      ) : (
        <FlashList estimatedItemSize={100}
          data={highlights}
          renderItem={renderItem}
          keyExtractor={(item) => item.highlightId}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadHighlights(true)}
              tintColor={colors.text.secondary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="albums-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No highlights yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  cover: { width: 56, height: 56, borderRadius: 10, marginRight: spacing.md, backgroundColor: colors.background.secondary },
  itemText: { flex: 1 },
  name: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary },
  count: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyText: { color: colors.text.secondary, fontSize: typography.fontSize.base },
});
