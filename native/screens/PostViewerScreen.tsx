import React, { useRef, useState, useMemo, useCallback } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { colors, typography } from '../styles/theme';
import { usePostViewerData } from './PostViewerScreen/hooks/usePostViewerData';
import { usePostViewerInteractions } from './PostViewerScreen/hooks/usePostViewerInteractions';
import { PostViewerListItem } from './PostViewerScreen/components/PostViewerListItem';
import { PostViewerModals } from './PostViewerScreen/components/PostViewerModals';
import { PostViewerHeader } from './PostViewerScreen/components/PostViewerHeader';

const { height: screenHeight } = Dimensions.get('window');

export default function PostViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const initialPostId =
    (route.params as any)?.id ||
    (route.params as any)?.postId ||
    (route.params as any)?.glimpseId ||
    (route.params as any)?.post?.postId ||
    (route.params as any)?.post?.glimpseId ||
    (route.params as any)?.post?.storyId;
  const routeUserId = (route.params as any)?.userId;
  const routeItems = (route.params as any)?.items || (route.params as any)?.glimpses;
  const routeInitialIndexRaw = Number((route.params as any)?.index ?? -1);
  const isGlimpseRoute = route.name === 'GlimpseViewer' || !!(route.params as any)?.glimpseId || Array.isArray((route.params as any)?.glimpses);

  const [menuVisible, setMenuVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [menuActionLoading, setMenuActionLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const listRef = useRef<FlashList<any>>(null);

  const {
    posts, setPosts,
    post, setPost,
    loading,
    initialTargetIndexRef,
    initialAnchorAppliedRef,
    loadStatusForPost,
    getItemId,
    isGlimpseItem,
  } = usePostViewerData(
    user, routeItems, routeInitialIndexRaw, initialPostId, routeUserId, setLiked, setSaved
  );

  const {
    handleSave, handleToggleLike, handleShareCountAdd, handleToggleHideLikes,
    handleToggleHideShares, handleToggleComments, handleSaveEdit, handleTogglePin,
    handleDeletePost, handleReportPost, handleUnfollow,
  } = usePostViewerInteractions(
    user, post, posts, setPost, setPosts, setLiked, setSaved, setMenuActionLoading,
    setMenuVisible, setEditVisible, editCaption, getItemId, isGlimpseItem, navigation
  );

  const isOwnContent = post?.authorId === user?.userId;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const first = viewableItems?.[0];
    if (!first?.item) return;
    if (!initialAnchorAppliedRef.current) {
      const startupIndex = initialTargetIndexRef.current;
      if (typeof first.index === 'number' && first.index !== startupIndex) return;
      initialAnchorAppliedRef.current = true;
    }
    setPost(first.item);
    setEditCaption(first.item?.caption || first.item?.content || '');
    const hasSeededState = typeof first.item?.isLiked === 'boolean' && typeof first.item?.isSaved === 'boolean';
    if (!hasSeededState) void loadStatusForPost(first.item);
  }).current;

  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 60 }), []);

  const renderPost = useCallback(({ item }: { item: any }) => (
    <PostViewerListItem
      item={item} currentItemId={post ? getItemId(post) : ''}
      getItemId={getItemId} isGlimpseItem={isGlimpseItem} user={user}
      handleToggleLike={handleToggleLike} handleSave={handleSave}
      handleShareCountAdd={handleShareCountAdd} setPost={setPost}
      setEditCaption={setEditCaption} loadStatusForPost={loadStatusForPost}
      setMenuVisible={setMenuVisible}
    />
  ), [post, getItemId, isGlimpseItem, user, handleToggleLike, handleSave, handleShareCountAdd, setPost, setEditCaption, loadStatusForPost, setMenuVisible]);

  if (loading || !post) {
    return (
      <SafeAreaView style={styles.container}>
        <PostViewerHeader isGlimpseRoute={isGlimpseRoute} />
        <View style={styles.centerContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.accent.primary} />
          ) : (
            <Text style={styles.errorText}>{isGlimpseRoute ? 'Glimpse not found' : 'Post not found'}</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PostViewerHeader isGlimpseRoute={isGlimpseRoute} />

      <View style={styles.content}>
        <FlashList
          ref={listRef} data={posts} renderItem={renderPost}
          keyExtractor={(item) => String(getItemId(item))}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 16, 24) }] as any}
          initialScrollIndex={Math.max(0, initialTargetIndexRef.current)}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          estimatedItemSize={screenHeight}
        />
      </View>

      <PostViewerModals
        menuVisible={menuVisible} setMenuVisible={setMenuVisible}
        editVisible={editVisible} setEditVisible={setEditVisible}
        post={post} user={user} isOwnContent={isOwnContent} saved={saved}
        menuActionLoading={menuActionLoading} editCaption={editCaption} setEditCaption={setEditCaption}
        handleSave={handleSave} handleToggleHideLikes={handleToggleHideLikes}
        handleToggleHideShares={handleToggleHideShares} handleToggleComments={handleToggleComments}
        handleTogglePin={handleTogglePin} handleDeletePost={handleDeletePost}
        handleReportPost={handleReportPost} handleUnfollow={handleUnfollow}
        handleSaveEdit={handleSaveEdit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1 },
  listContent: { paddingTop: 4, paddingBottom: 20 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: typography.fontSize.lg, color: colors.text.secondary },
});
