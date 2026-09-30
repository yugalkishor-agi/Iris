import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { postService } from '../services/post.service';
import { glimpseService } from '../services/glimpse.service';
import { userService } from '../services/user.service';
import { colors, spacing, typography } from '../styles/theme';
import { ScreenSkeleton } from '../components/ui/LoadingSkeleton';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 32) / 3;

export default function ExploreScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<'All' | 'People' | 'Posts' | 'Glimpses'>('All');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [glimpses, setGlimpses] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const categories: Array<'All' | 'People' | 'Posts' | 'Glimpses'> = ['All', 'People', 'Posts', 'Glimpses'];

  useEffect(() => {
    loadExplore();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!search.trim()) {
        setPeople([]);
        return;
      }
      try {
        const users = await userService.searchUsers(search.trim(), 25);
        setPeople(users || []);
      } catch {
        setPeople([]);
      }
    };
    run();
  }, [search]);

  const loadExplore = async () => {
    try {
      setLoading(true);
      const [postData, glimpseData] = await Promise.all([
        postService.getExplorePosts(60),
        glimpseService.getExploreGlimpses(30),
      ]);
      setPosts(postData || []);
      setGlimpses(glimpseData || []);
    } catch (error) {
      console.error('Failed to load explore:', error);
      setPosts([]);
      setGlimpses([]);
    } finally {
      setLoading(false);
    }
  };

  const combined = useMemo(() => {
    const p = posts.map((it) => ({ ...it, __type: 'post' as const }));
    const g = glimpses.map((it) => ({ ...it, __type: 'glimpse' as const }));
    const all = [...p, ...g];
    if (!search.trim()) return all;
    const q = search.trim().toLowerCase();
    return all.filter((item) => {
      const caption = String(item.caption || '').toLowerCase();
      const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';
      const username = String(item.authorUsername || '').toLowerCase();
      return caption.includes(q) || tags.includes(q) || username.includes(q);
    });
  }, [posts, glimpses, search]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlashList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        style={styles.categories}
        showsHorizontalScrollIndicator={false}
        estimatedItemSize={70}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[styles.category, selected === cat && styles.categoryActive]}
            onPress={() => setSelected(cat)}
          >
            <Text style={[styles.categoryText, selected === cat && styles.categoryTextActive]}>{cat}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ScreenSkeleton variant="grid" rows={6} />
      ) : selected === 'People' ? (
        <FlashList
          data={people}
          keyExtractor={(item) => item.userId}
          estimatedItemSize={76}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.personRow}
              onPress={() => (navigation as any).navigate('UserProfile', { userId: item.userId })}
            >
              <Image source={{ uri: item.avatarURL || '' }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.personName}>{item.displayName || item.username}</Text>
                <Text style={styles.personHandle}>@{item.username}</Text>
              </View>
              {!!item.verified && <VerifiedBadge size={18} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>Search users by username</Text>
            </View>
          }
        />
      ) : (
        <FlashList
          data={
            selected === 'Posts'
              ? combined.filter((x) => x.__type === 'post')
              : selected === 'Glimpses'
                ? combined.filter((x) => x.__type === 'glimpse')
                : combined
          }
          keyExtractor={(item, index) => `${item.__type}-${item.postId || item.glimpseId || item.storyId || index}`}
          numColumns={3}
          renderItem={({ item }) => {
            const uri = item.__type === 'post'
              ? item.thumbnailURL || item.mediaURLs?.[0]
              : item.coverImageURL || item.mediaURL;
            if (!uri) return null;
            return (
              <TouchableOpacity
                onPress={() => {
                  if (item.__type === 'post') {
                    (navigation as any).navigate('PostView', { postId: item.postId });
                  } else {
                    (navigation as any).navigate('GlimpseViewer', { glimpseId: item.glimpseId || item.storyId });
                  }
                }}
              >
                <Image source={{ uri }} style={styles.gridItem} />
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.grid as any}
          estimatedItemSize={ITEM_SIZE}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No content found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 15 },
  categories: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.subtle, maxHeight: 56 },
  category: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.background.secondary, marginRight: 8 },
  categoryActive: { backgroundColor: colors.text.primary },
  categoryText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium as any, color: colors.text.secondary },
  categoryTextActive: { color: '#fff' },
  grid: { padding: 1 },
  gridItem: { width: ITEM_SIZE, height: ITEM_SIZE, margin: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyText: { color: colors.text.secondary, fontSize: typography.fontSize.base },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: spacing.md, backgroundColor: colors.background.secondary },
  personName: { color: colors.text.primary, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold as any },
  personHandle: { color: colors.text.secondary, fontSize: typography.fontSize.sm, marginTop: 2 },
});


