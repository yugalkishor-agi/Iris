import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { draftService } from '../services/draft.service';
import { colors, spacing, typography } from '../styles/theme';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3;

export default function DraftsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [tab, setTab] = useState<'posts' | 'glimpses'>('posts');
  const [postDrafts, setPostDrafts] = useState<any[]>([]);
  const [glimpseDrafts, setGlimpseDrafts] = useState<any[]>([]);

  useEffect(() => {
    loadDrafts();
  }, [user]);

  const loadDrafts = () => {
    if (!user) return;
    setPostDrafts(draftService.getPostDrafts(user.userId));
    setGlimpseDrafts(draftService.getGlimpseDrafts(user.userId));
  };

  const onDeleteDraft = (draftId: string) => {
    if (!user) return;
    Alert.alert('Delete Draft', 'Do you want to delete this draft?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (tab === 'posts') {
            draftService.deletePostDraft(user.userId, draftId);
          } else {
            draftService.deleteGlimpseDraft(user.userId, draftId);
          }
          loadDrafts();
        },
      },
    ]);
  };

  const data = tab === 'posts' ? postDrafts : glimpseDrafts;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Drafts</Text>
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
      <FlashList estimatedItemSize={100}
        data={data}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.draft}
            onLongPress={() => onDeleteDraft(item.id)}
            onPress={() => {
              if (tab === 'posts') {
                (navigation as any).navigate('CreatePost', { draftId: item.id, draftType: 'post' });
              } else {
                (navigation as any).navigate('GlimpseCreate', { draftId: item.id, draftType: 'glimpse' });
              }
            }}
          >
            <Image source={{ uri: item.mediaURL || item.mediaItems?.[0]?.thumbnail || item.mediaItems?.[0]?.uri || item.thumbnailURL || '' }} style={styles.image} />
            <View style={styles.overlay}>
              <Ionicons name="document-text" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={64} color={colors.text.secondary} />
            <Text style={styles.emptyText}>No drafts</Text>
          </View>
        }
      />
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
  tabText: { color: colors.text.secondary, fontSize: typography.fontSize.sm },
  activeTabText: { color: colors.text.primary, fontWeight: typography.fontWeight.semibold as any },
  draft: { width: ITEM_SIZE, height: ITEM_SIZE, position: 'relative' },
  image: { width: '100%', height: '100%', backgroundColor: colors.background.secondary },
  overlay: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 20 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 60, marginTop: 40 },
  emptyText: { fontSize: typography.fontSize.base, color: colors.text.secondary, marginTop: spacing.md },
});

