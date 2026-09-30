import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/post.service';
import { glimpseService } from '../services/glimpse.service';
import { colors, spacing, typography } from '../styles/theme';
import { ScreenSkeleton } from '../components/ui/LoadingSkeleton';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3;

export default function BookmarksScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [tab, setTab] = useState<'posts' | 'glimpses'>('posts');
  const [bookmarkedPosts, setBookmarkedPosts] = useState<any[]>([]);
  const [bookmarkedGlimpses, setBookmarkedGlimpses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, [user]);

  const loadBookmarks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [posts, glimpses] = await Promise.all([
        postService.getSavedPosts(user.userId),
        glimpseService.getSavedGlimpses(user.userId),
      ]);
      setBookmarkedPosts(posts || []);
      setBookmarkedGlimpses(glimpses || []);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      setBookmarkedPosts([]);
      setBookmarkedGlimpses([]);
    } finally {
      setLoading(false);
    }
  };

  const data = tab === 'posts' ? bookmarkedPosts : bookmarkedGlimpses;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Bookmarks</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'posts' && styles.activeTab]} onPress={() => setTab('posts')}>
          <Text style={[styles.tabText, tab === 'posts' && styles.activeTabText]}>Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'glimpses' && styles.activeTab]} onPress={() => setTab('glimpses')}>
          <Text style={[styles.tabText, tab === 'glimpses' && styles.activeTabText]}>Glimpses</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ScreenSkeleton variant="grid" rows={6} />
      ) : (
        <FlashList estimatedItemSize={100}
          data={data}
          numColumns={3}
          renderItem={({ item }) => {
            const uri = tab === 'posts'
              ? item.thumbnailURL || item.mediaURLs?.[0]
              : item.coverImageURL || item.mediaURL;
            if (!uri) return null;
            return (
              <TouchableOpacity
                onPress={() => {
                  if (tab === 'posts') {
                    (navigation as any).navigate('PostView', { postId: item.postId });
                  } else {
                    (navigation as any).navigate('GlimpseViewer', { glimpseId: item.glimpseId || item.storyId });
                  }
                }}
              >
                <Image source={{ uri }} style={styles.item} />
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.postId || item.glimpseId || item.storyId}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name={tab === 'posts' ? 'bookmark-outline' : 'film-outline'}
                size={48}
                color={colors.text.secondary}
              />
              <Text style={styles.emptyText}>
                {tab === 'posts' ? 'No bookmarked posts' : 'No bookmarked glimpses'}
              </Text>
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
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.text.primary },
  tabText: { fontSize: typography.fontSize.sm, color: colors.text.secondary },
  activeTabText: { color: colors.text.primary, fontWeight: typography.fontWeight.semibold as any },
  item: { width: ITEM_SIZE, height: ITEM_SIZE },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  emptyText: { color: colors.text.secondary, fontSize: typography.fontSize.base },
});


