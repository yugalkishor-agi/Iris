import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { postService } from '../services/post.service';
import { colors, spacing, typography } from '../styles/theme';
import { ScreenSkeleton } from '../components/ui/LoadingSkeleton';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

export default function LikesListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const postId = (route.params as any)?.postId;
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLikes();
  }, [postId]);

  const loadLikes = async () => {
    if (!postId) return;
    try {
      setLoading(true);
      const data = await postService.getPostLikes(postId, 200);
      setLikes(data || []);
    } catch (error) {
      console.error('Failed to load likes list:', error);
      setLikes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Likes</Text>
        <TouchableOpacity onPress={loadLikes}>
          <Ionicons name="refresh" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ScreenSkeleton variant="list" rows={6} />
      ) : (
        <FlashList estimatedItemSize={100}
          data={likes}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.user}
              onPress={() => (navigation as any).navigate('UserProfile', { userId: item.userId })}
            >
              <Image source={{ uri: item.avatarURL || '' }} style={styles.avatar} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.displayName || item.username}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.userId}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="heart-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No likes yet</Text>
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
  user: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: colors.background.secondary },
  info: { flex: 1 },
  name: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold as any, color: colors.text.primary },
  username: { fontSize: typography.fontSize.sm, color: colors.text.secondary, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  emptyText: { color: colors.text.secondary, fontSize: typography.fontSize.base },
});


