import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { glimpseService } from '../../../services/glimpse.service';
import { postService } from '../../../services/post.service';
import { reportService } from '../../../services/report.service';
import { userService } from '../../../services/user.service';

export const usePostViewerInteractions = (
  user: any,
  post: any,
  posts: any[],
  setPost: (p: any) => void,
  setPosts: (p: any) => void,
  setLiked: (val: boolean) => void,
  setSaved: (val: boolean) => void,
  setMenuActionLoading: (val: boolean) => void,
  setMenuVisible: (val: boolean) => void,
  setEditVisible: (val: boolean) => void,
  editCaption: string,
  getItemId: (item: any) => string,
  isGlimpseItem: (item: any) => boolean,
  navigation: any
) => {
  const likeIntentQueueRef = useRef<Record<string, boolean | undefined>>({});
  const likeMutationInFlightRef = useRef<Set<string>>(new Set());

  const updatePostState = useCallback((updates: any) => {
    const targetId = getItemId(post);
    if (!targetId) return;
    setPosts((prev: any[]) => prev.map((entry) => (getItemId(entry) === targetId ? { ...entry, ...updates } : entry)));
    setPost((prev: any) => (prev ? { ...prev, ...updates } : prev));
  }, [getItemId, post, setPost, setPosts]);

  const handleSave = useCallback(async (itemToSave: any, savedState: boolean) => {
    if (!user?.userId || !itemToSave) return;
    const targetId = getItemId(itemToSave);
    if (!targetId) return;

    const next = !savedState;
    setSaved(next);
    
    // Optimistic UI update for the specific item
    setPosts((prev: any[]) => prev.map(entry => getItemId(entry) === targetId ? { ...entry, isSaved: next } : entry));
    setPost((prev: any) => (prev && getItemId(prev) === targetId ? { ...prev, isSaved: next } : prev));

    try {
      if (isGlimpseItem(itemToSave)) {
        if (next) await glimpseService.saveGlimpse(targetId, user.userId);
        else await glimpseService.unsaveGlimpse(targetId, user.userId);
      } else if (next) {
        await postService.savePost(targetId, user.userId);
      } else {
        await postService.unsavePost(targetId, user.userId);
      }
    } catch {
      setSaved(!next);
      setPosts((prev: any[]) => prev.map(entry => getItemId(entry) === targetId ? { ...entry, isSaved: !next } : entry));
      setPost((prev: any) => (prev && getItemId(prev) === targetId ? { ...prev, isSaved: !next } : prev));
    }
  }, [getItemId, isGlimpseItem, setPost, setPosts, setSaved, user?.userId]);

  const handleToggleLike = useCallback(async (item: any) => {
    if (!user?.userId || !item) return;
    const targetId = getItemId(item);
    if (!targetId) return;

    const applyLikeState = (nextLiked: boolean) => {
      const base = posts.find((entry) => getItemId(entry) === targetId) || item;
      const currentLikes = Number(base?.stats?.likesCount ?? base?.likesCount ?? 0);
      const currentLiked = !!base?.isLiked;
      const resolvedLikes = Math.max(0, currentLikes + (nextLiked === currentLiked ? 0 : (nextLiked ? 1 : -1)));

      // If the item we're toggling is the currently focused post, update screen-level state
      if (post && getItemId(post) === targetId) {
        setLiked(nextLiked);
      }
      
      setPosts((prev: any[]) => prev.map((entry) => {
        if (getItemId(entry) !== targetId) return entry;
        const eLikes = Number(entry?.stats?.likesCount ?? entry?.likesCount ?? 0);
        const eLiked = !!entry?.isLiked;
        const nLikes = Math.max(0, eLikes + (nextLiked === eLiked ? 0 : (nextLiked ? 1 : -1)));
        return {
          ...entry,
          isLiked: nextLiked,
          likesCount: nLikes,
          stats: { ...(entry.stats || {}), likesCount: nLikes },
        };
      }));

      setPost((prev: any) => {
        if (!prev || getItemId(prev) !== targetId) return prev;
        const pLikes = Number(prev?.stats?.likesCount ?? prev?.likesCount ?? 0);
        const pLiked = !!prev?.isLiked;
        const rLikes = Math.max(0, pLikes + (nextLiked === pLiked ? 0 : (nextLiked ? 1 : -1)));
        return {
          ...prev,
          isLiked: nextLiked,
          likesCount: rLikes,
          stats: { ...(prev.stats || {}), likesCount: rLikes },
        };
      });
    };

    const latest = posts.find((entry) => getItemId(entry) === targetId) || item;
    const desired = !(latest?.isLiked ?? false);

    likeIntentQueueRef.current[targetId] = desired;
    applyLikeState(desired);

    if (likeMutationInFlightRef.current.has(targetId)) return;
    likeMutationInFlightRef.current.add(targetId);
    
    try {
      while (typeof likeIntentQueueRef.current[targetId] === 'boolean') {
        const pendingDesired = !!likeIntentQueueRef.current[targetId];
        delete likeIntentQueueRef.current[targetId];

        const txResult = isGlimpseItem(item)
          ? await glimpseService.setGlimpseLiked(targetId, user.userId, pendingDesired)
          : await postService.setPostLiked(targetId, user.userId, pendingDesired);

        applyLikeState(!!txResult.liked);
      }
    } catch (error) {
      const fallback = posts.find((entry) => getItemId(entry) === targetId) || item;
      applyLikeState(!!fallback?.isLiked);
    } finally {
      likeMutationInFlightRef.current.delete(targetId);
    }
  }, [getItemId, isGlimpseItem, post, posts, setLiked, setPost, setPosts, user?.userId]);

  const handleShareCountAdd = useCallback((item: any, count: number) => {
    const targetId = getItemId(item);
    if (!targetId || count <= 0) return;
    
    setPosts((prev: any[]) => prev.map((entry) => {
      if (getItemId(entry) !== targetId) return entry;
      const currentShares = entry?.stats?.sharesCount ?? entry?.sharesCount ?? 0;
      const nextShares = currentShares + count;
      return { ...entry, sharesCount: nextShares, stats: { ...(entry.stats || {}), sharesCount: nextShares } };
    }));
    
    setPost((prev: any) => {
      if (!prev || getItemId(prev) !== targetId) return prev;
      const currentShares = prev?.stats?.sharesCount ?? prev?.sharesCount ?? 0;
      const nextShares = currentShares + count;
      return { ...prev, sharesCount: nextShares, stats: { ...(prev.stats || {}), sharesCount: nextShares } };
    });
  }, [getItemId, setPost, setPosts]);

  const handleToggleHideLikes = useCallback(async () => {
    if (!post?.postId) return;
    const next = !post.hideLikesCount;
    setMenuActionLoading(true);
    try {
      await postService.updatePost(post.postId, { hideLikesCount: next });
      updatePostState({ hideLikesCount: next });
    } finally {
      setMenuActionLoading(false);
    }
  }, [post?.hideLikesCount, post?.postId, setMenuActionLoading, updatePostState]);

  const handleToggleHideShares = useCallback(async () => {
    if (!post?.postId) return;
    const next = !post.hideSharesCount;
    setMenuActionLoading(true);
    try {
      await postService.updatePost(post.postId, { hideSharesCount: next });
      updatePostState({ hideSharesCount: next });
    } finally {
      setMenuActionLoading(false);
    }
  }, [post?.hideSharesCount, post?.postId, setMenuActionLoading, updatePostState]);

  const handleToggleComments = useCallback(async () => {
    if (!post?.postId) return;
    const next = post.commentsEnabled === false;
    setMenuActionLoading(true);
    try {
      await postService.updatePost(post.postId, { commentsEnabled: next });
      updatePostState({ commentsEnabled: next });
    } finally {
      setMenuActionLoading(false);
    }
  }, [post?.commentsEnabled, post?.postId, setMenuActionLoading, updatePostState]);

  const handleSaveEdit = useCallback(async () => {
    const targetId = getItemId(post);
    if (!targetId) return;
    const nextCaption = editCaption.trim();
    setMenuActionLoading(true);
    try {
      if (isGlimpseItem(post)) await glimpseService.updateGlimpse(targetId, { caption: nextCaption });
      else await postService.updatePost(targetId, { caption: nextCaption });
      updatePostState({ caption: nextCaption, content: nextCaption });
      setEditVisible(false);
      setMenuVisible(false);
    } finally {
      setMenuActionLoading(false);
    }
  }, [editCaption, getItemId, isGlimpseItem, post, setEditVisible, setMenuActionLoading, setMenuVisible, updatePostState]);

  const handleTogglePin = useCallback(async () => {
    const targetId = getItemId(post);
    if (!targetId) return;
    const nextPinned = post.pinnedAt ? null : Date.now(); // using Date.now() as a substitute for serverTimestamp on client side optimistically
    setMenuActionLoading(true);
    try {
      if (isGlimpseItem(post)) await glimpseService.updateGlimpse(targetId, { pinnedAt: nextPinned as any });
      else await postService.updatePost(targetId, { pinnedAt: nextPinned as any });
      updatePostState({ pinnedAt: nextPinned });
    } finally {
      setMenuActionLoading(false);
    }
  }, [getItemId, isGlimpseItem, post, setMenuActionLoading, updatePostState]);

  const handleDeletePost = useCallback(async () => {
    const targetId = getItemId(post);
    if (!targetId || !user?.userId) return;
    const isGlimpse = isGlimpseItem(post);

    Alert.alert(
      isGlimpse ? 'Delete glimpse' : 'Delete post',
      isGlimpse ? 'Are you sure you want to delete this glimpse?' : 'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setMenuActionLoading(true);
            try {
              if (isGlimpse) await glimpseService.deleteGlimpse(targetId, user.userId);
              else await postService.deletePost(targetId, user.userId);
              setPosts((prev: any[]) => prev.filter((entry) => getItemId(entry) !== targetId));
              setMenuVisible(false);
              if (posts.length <= 1) navigation.goBack();
            } finally {
              setMenuActionLoading(false);
            }
          },
        },
      ]
    );
  }, [getItemId, isGlimpseItem, navigation, post, posts.length, setMenuActionLoading, setMenuVisible, setPosts, user?.userId]);

  const handleReportPost = useCallback(async () => {
    const targetId = getItemId(post);
    if (!targetId || !user?.userId || !post?.authorId) return;
    try {
      if (isGlimpseItem(post)) {
        await reportService.reportGlimpse(targetId, post.authorId, user.userId, user.username || 'user', 'other', 'Something else');
      } else {
        await reportService.reportPost(targetId, post.authorId, user.userId, user.username || 'user', 'other', 'Something else');
      }
      Alert.alert('Report sent', 'Thanks for letting us know.');
      setMenuVisible(false);
    } catch (error) {
      console.error('Report failed', error);
    }
  }, [getItemId, isGlimpseItem, post, setMenuVisible, user?.userId, user?.username]);

  const handleUnfollow = useCallback(async () => {
    if (!user?.userId || !post?.authorId) return;
    Alert.alert('Unfollow user', 'Unfollow this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unfollow',
        style: 'destructive',
        onPress: async () => {
          try {
            await userService.unfollowUser(user.userId, post.authorId);
            setMenuVisible(false);
          } catch (error) {
            console.error('Unfollow failed', error);
          }
        },
      },
    ]);
  }, [post?.authorId, setMenuVisible, user?.userId]);

  return {
    handleSave,
    handleToggleLike,
    handleShareCountAdd,
    handleToggleHideLikes,
    handleToggleHideShares,
    handleToggleComments,
    handleSaveEdit,
    handleTogglePin,
    handleDeletePost,
    handleReportPost,
    handleUnfollow,
  };
};
