import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/post.service';
import { glimpseService } from '../services/glimpse.service';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { ScreenSkeleton } from '../components/ui/LoadingSkeleton';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;

export default function SavedPostsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [savedGlimpses, setSavedGlimpses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'glimpses'>('posts');

  useEffect(() => {
    loadSavedPosts();
  }, [user]);

  const loadSavedPosts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const posts = await postService.getSavedPosts(user.userId);
      setSavedPosts(posts);
      const glimpses = await glimpseService.getSavedGlimpses(user.userId);
      setSavedGlimpses(glimpses);
    } catch (error) {
      console.error('Failed to load saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPost = ({ item }: { item: any }) => {
    const cover = item.thumbnailURL || item.mediaURLs?.[0] || '';
    if (!cover) return null;
    const isVideo = item.mediaType === 'video' || /\.(mp4|mov|webm)$/i.test(String(cover));
    return (
      <TouchableOpacity
        style={styles.postItem}
        onPress={() => (navigation as any).navigate('PostView', { postId: item.postId })}
        activeOpacity={0.85}
      >
        <Image source={{ uri: cover }} style={styles.postImage} />
        {Array.isArray(item.mediaURLs) && item.mediaURLs.length > 1 && (
          <View style={styles.badgeTopRight}>
            <Ionicons name="copy" size={16} color="#fff" />
          </View>
        )}
        {isVideo && (
          <View style={[styles.badgeTopRight, { right: 8, top: 30 }]}>
            <Ionicons name="play" size={16} color="#fff" />
          </View>
        )}
        <View style={styles.authorOverlay}>
          <Text style={styles.authorText} numberOfLines={1}>@{item.authorUsername}</Text>
          {!!item.authorVerified && (
            <VerifiedBadge size={14} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderGlimpse = ({ item }: { item: any }) => {
    const cover = item.coverImageURL || item.mediaURL;
    if (!cover) return null;
    return (
      <TouchableOpacity
        style={styles.postItem}
        onPress={() => (navigation as any).navigate('GlimpseViewer', { glimpseId: item.glimpseId || item.storyId })}
        activeOpacity={0.85}
      >
        <Image source={{ uri: cover }} style={styles.postImage} />
        {item.mediaType === 'video' && (
          <View style={styles.badgeTopRight}>
            <Ionicons name="play" size={16} color="#fff" />
          </View>
        )}
        <View style={styles.authorOverlay}>
          <Text style={styles.authorText} numberOfLines={1}>@{item.authorUsername}</Text>
          {!!item.authorVerified && (
            <VerifiedBadge size={14} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <ScreenSkeleton variant="grid" rows={6} />
      ) : (
        <>
          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, tab === 'posts' && styles.tabActive]} onPress={() => setTab('posts')}>
              <Text style={[styles.tabText, tab === 'posts' && styles.tabTextActive]}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, tab === 'glimpses' && styles.tabActive]} onPress={() => setTab('glimpses')}>
              <Text style={[styles.tabText, tab === 'glimpses' && styles.tabTextActive]}>Glimpses</Text>
            </TouchableOpacity>
          </View>

          {tab === 'posts' ? (
            savedPosts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="bookmark-outline" size={64} color={colors.text.secondary} />
                <Text style={styles.emptyTitle}>No saved posts yet</Text>
                <Text style={styles.emptyDescription}>Save posts to see them here</Text>
              </View>
            ) : (
              <FlashList estimatedItemSize={100}
                data={savedPosts}
                renderItem={renderPost}
                keyExtractor={(item) => item.postId}
                numColumns={3}
                contentContainerStyle={styles.grid as any}
              />
            )
          ) : (
            savedGlimpses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="film-outline" size={64} color={colors.text.secondary} />
                <Text style={styles.emptyTitle}>No saved glimpses yet</Text>
                <Text style={styles.emptyDescription}>Save glimpses to see them here</Text>
              </View>
            ) : (
              <FlashList estimatedItemSize={100}
                data={savedGlimpses}
                renderItem={renderGlimpse}
                keyExtractor={(item) => item.glimpseId || item.storyId}
                numColumns={3}
                contentContainerStyle={styles.grid as any}
              />
            )
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary, marginLeft: spacing.sm },
  placeholder: { width: 24 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary, marginTop: spacing.lg },
  emptyDescription: { fontSize: typography.fontSize.base, color: colors.text.secondary, marginTop: spacing.xs },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.text.primary },
  tabText: { color: colors.text.secondary, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium as any },
  tabTextActive: { color: colors.text.primary, fontWeight: typography.fontWeight.semibold as any },
  grid: { padding: 1 },
  postItem: { width: ITEM_WIDTH, height: ITEM_WIDTH, padding: 1, position: 'relative' },
  postImage: { width: '100%', height: '100%' },
  multipleIcon: { position: 'absolute', top: 8, right: 8 },
  badgeTopRight: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 4 },
  authorOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 6, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  authorText: { color: '#fff', fontSize: 12, maxWidth: ITEM_WIDTH - 28 },
});


