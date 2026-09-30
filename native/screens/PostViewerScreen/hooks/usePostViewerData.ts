import { useState, useCallback, useRef, useEffect } from 'react';
import { glimpseService } from '../../../services/glimpse.service';
import { postService } from '../../../services/post.service';
import { userService } from '../../../services/user.service';

const toMillis = (value: any) => {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export const usePostViewerData = (
  user: any,
  routeItems: any,
  routeInitialIndexRaw: number,
  initialPostId: string,
  routeUserId: string,
  setLiked: (val: boolean) => void,
  setSaved: (val: boolean) => void,
) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  
  const initialTargetIndexRef = useRef(0);
  const initialAnchorAppliedRef = useRef(false);
  const statusRequestSeqRef = useRef(0);

  const getItemId = useCallback((item: any) => item?.postId || item?.glimpseId || item?.storyId || item?.id, []);
  const normalizeItemId = useCallback((value: any) => String(value ?? ''), []);
  const isSameItemId = useCallback(
    (left: any, right: any) => normalizeItemId(left) === normalizeItemId(right),
    [normalizeItemId]
  );
  const isGlimpseItem = useCallback((item: any) => {
    return item?.postType === 'glimpse' || !!item?.glimpseId || item?.type === 'glimpse' || item?.isGlimpse;
  }, []);

  useEffect(() => {
    if (!user?.userId) {
      setFollowingIds([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ids = await userService.getFollowing(user.userId, 80);
        if (!cancelled) setFollowingIds(ids || []);
      } catch {
        if (!cancelled) setFollowingIds([]);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.userId]);

  const hydrateItemsWithLikeState = useCallback(async (items: any[]) => {
    if (!user?.userId || !Array.isArray(items) || items.length === 0) return items;
    const postIds: string[] = [];
    const glimpseIds: string[] = [];
    
    items.forEach((entry) => {
      const id = getItemId(entry);
      if (!id) return;
      if (isGlimpseItem(entry)) glimpseIds.push(String(id));
      else postIds.push(String(id));
    });

    if (postIds.length === 0 && glimpseIds.length === 0) return items;

    const [likedPostIds, likedGlimpseIds] = await Promise.all([
      postIds.length ? postService.getUserLikedPosts(user.userId, postIds) : Promise.resolve([] as string[]),
      glimpseIds.length ? glimpseService.getUserLikedGlimpses(user.userId, glimpseIds) : Promise.resolve([] as string[]),
    ]);

    const likedIds = new Set<string>([...likedPostIds, ...likedGlimpseIds].map((entry) => String(entry)));
    return items.map((entry) => {
      const id = getItemId(entry);
      if (!id) return entry;
      return { ...entry, isLiked: likedIds.has(String(id)) };
    });
  }, [getItemId, isGlimpseItem, user?.userId]);

  const applyResolvedStatus = useCallback((targetId: string, nextLiked?: boolean, nextSaved?: boolean) => {
    setPosts((prev) => prev.map((entry) => {
      if (getItemId(entry) !== targetId) return entry;
      const updates: Record<string, any> = {};
      if (typeof nextLiked === 'boolean') updates.isLiked = nextLiked;
      if (typeof nextSaved === 'boolean') updates.isSaved = nextSaved;
      return Object.keys(updates).length > 0 ? { ...entry, ...updates } : entry;
    }));

    setPost((prev: any) => {
      if (!prev || getItemId(prev) !== targetId) return prev;
      const updates: Record<string, any> = {};
      if (typeof nextLiked === 'boolean') updates.isLiked = nextLiked;
      if (typeof nextSaved === 'boolean') updates.isSaved = nextSaved;
      return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
    });

    if (typeof nextLiked === 'boolean') setLiked(nextLiked);
    if (typeof nextSaved === 'boolean') setSaved(nextSaved);
  }, [getItemId, setLiked, setSaved]);

  const loadStatusForPost = useCallback(async (targetPost?: any) => {
    if (!user?.userId || !targetPost) {
      setLiked(false);
      setSaved(false);
      return;
    }
    const targetId = getItemId(targetPost);
    if (!targetId) {
      setLiked(false);
      setSaved(false);
      return;
    }

    const seededLiked = typeof targetPost?.isLiked === 'boolean' ? !!targetPost.isLiked : null;
    const seededSaved = typeof targetPost?.isSaved === 'boolean' ? !!targetPost.isSaved : null;
    if (seededLiked !== null || seededSaved !== null) {
      applyResolvedStatus(targetId, seededLiked ?? undefined, seededSaved ?? undefined);
    }
    if (seededLiked !== null && seededSaved !== null) return;

    const requestSeq = ++statusRequestSeqRef.current;
    try {
      const [hasLiked, hasSaved] = isGlimpseItem(targetPost)
        ? await Promise.all([
            seededLiked !== null ? Promise.resolve(seededLiked) : glimpseService.isGlimpseLiked(targetId, user.userId),
            glimpseService.isGlimpseSaved(targetId, user.userId),
          ])
        : await Promise.all([
            seededLiked !== null ? Promise.resolve(seededLiked) : postService.hasLiked(targetId, user.userId),
            postService.hasSaved(targetId, user.userId),
          ]);

      if (requestSeq !== statusRequestSeqRef.current) return;
      applyResolvedStatus(targetId, !!hasLiked, !!hasSaved);
    } catch {
      if (requestSeq !== statusRequestSeqRef.current) return;
      applyResolvedStatus(targetId, seededLiked ?? false, seededSaved ?? false);
    }
  }, [applyResolvedStatus, getItemId, isGlimpseItem, user?.userId, setLiked, setSaved]);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      if (Array.isArray(routeItems) && routeItems.length > 0) {
        const preparedRouteItems = await hydrateItemsWithLikeState([...routeItems]);
        setPosts(preparedRouteItems);

        const startIndexById = initialPostId
          ? preparedRouteItems.findIndex((item) => isSameItemId(getItemId(item), initialPostId))
          : -1;
        const useRouteIndex = Number.isFinite(routeInitialIndexRaw) && routeInitialIndexRaw >= 0 && routeInitialIndexRaw < preparedRouteItems.length;
        const startIndex = startIndexById >= 0 ? startIndexById : (useRouteIndex ? routeInitialIndexRaw : 0);

        const selected = preparedRouteItems[startIndex] || preparedRouteItems[0] || null;
        initialTargetIndexRef.current = startIndex;
        initialAnchorAppliedRef.current = false;
        setCurrentIndex(startIndex);
        setPost(selected);
        void loadStatusForPost(selected);
        return;
      }

      let postData: any = null;
      if (initialPostId) {
        postData = await postService.getPost(initialPostId, user?.userId);
      }

      const authorId = routeUserId || postData?.authorId;
      let postsData: any[] = [];
      if (authorId) {
        const postsRes = await postService.getUserPosts(authorId, 100, undefined, false, user?.userId);
        postsData = Array.isArray(postsRes) ? postsRes : (postsRes?.posts || []);
      }

      if (!postsData.length && postData) {
        postsData = [postData];
      }

      const sorted = [...postsData].sort((a, b) => toMillis(b?.createdAt) - toMillis(a?.createdAt));
      const hydratedSorted = await hydrateItemsWithLikeState(sorted);
      setPosts(hydratedSorted);

      const startIndex = initialPostId
        ? Math.max(0, hydratedSorted.findIndex((item) => isSameItemId(getItemId(item), initialPostId)))
        : 0;
      const selected = hydratedSorted[startIndex] || hydratedSorted[0] || null;
      initialTargetIndexRef.current = startIndex;
      initialAnchorAppliedRef.current = false;
      setCurrentIndex(startIndex);
      setPost(selected);
      void loadStatusForPost(selected);
    } catch (error) {
      console.error('Failed to load posts', error);
    } finally {
      setLoading(false);
    }
  }, [routeItems, routeInitialIndexRaw, initialPostId, getItemId, isSameItemId, routeUserId, loadStatusForPost, hydrateItemsWithLikeState, user?.userId]);

  const loadLikedByPreviewForItem = useCallback(async (targetItem?: any) => {
    if (!user?.userId || !targetItem) return;
    const targetId = getItemId(targetItem);
    if (!targetId) return;

    const likeCount = targetItem?.stats?.likesCount ?? targetItem?.likesCount ?? 0;
    const isSameLikedByPreview = (a: any[] = [], b: any[] = []) => {
      if (a.length !== b.length) return false;
      return a.every((entry, index) => {
        const other = b[index];
        return entry?.userId === other?.userId && entry?.username === other?.username;
      });
    };

    const applyPreview = (nextPreview: any[]) => {
      setPosts((prev) => {
        let changed = false;
        const next = prev.map((entry) => {
          if (getItemId(entry) !== targetId) return entry;
          const currentPreview = Array.isArray(entry?.likedByPreview) ? entry.likedByPreview : [];
          if (isSameLikedByPreview(currentPreview, nextPreview)) return entry;
          changed = true;
          return { ...entry, likedByPreview: nextPreview };
        });
        return changed ? next : prev;
      });
      setPost((prev: any) => {
        if (!prev || getItemId(prev) !== targetId) return prev;
        const currentPreview = Array.isArray(prev?.likedByPreview) ? prev.likedByPreview : [];
        if (isSameLikedByPreview(currentPreview, nextPreview)) return prev;
        return { ...prev, likedByPreview: nextPreview };
      });
    };

    if (likeCount <= 0 || followingIds.length === 0) {
      applyPreview([]);
      return;
    }

    try {
      const followingSet = new Set(followingIds || []);
      const likeUsers = isGlimpseItem(targetItem)
        ? await glimpseService.getGlimpseLikes(targetId, 12)
        : await postService.getPostLikes(targetId, 12);

      const preview = (likeUsers || [])
        .filter((likeUser: any) => followingSet.has(likeUser.userId))
        .slice(0, 3)
        .map((likeUser: any) => ({
          userId: likeUser.userId,
          username: likeUser.username,
          displayName: likeUser.displayName,
          avatarURL: likeUser.avatarURL,
        }));
      applyPreview(preview);
    } catch (error) {
      console.error('Failed to load liked-by preview:', error);
    }
  }, [followingIds, getItemId, isGlimpseItem, user?.userId]);

  return {
    posts, setPosts,
    post, setPost,
    loading,
    currentIndex, setCurrentIndex,
    followingIds,
    initialTargetIndexRef,
    initialAnchorAppliedRef,
    loadPosts,
    loadStatusForPost,
    loadLikedByPreviewForItem,
    getItemId,
    isGlimpseItem,
  };
};
