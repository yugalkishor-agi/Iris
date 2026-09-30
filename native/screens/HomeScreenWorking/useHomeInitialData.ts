import { useCallback, type MutableRefObject } from 'react';
import { cacheIntegration } from '../../services/cacheIntegration.service';
import { postService } from '../../services/post.service';
import { settingsService } from '../../services/settings.service';
import { storyService } from '../../services/story.service';
import { userService } from '../../services/user.service';
import { withTimeout } from './homeAsync';
import { buildVisibleStories, transformFeedPost } from './homeFeedTransform';
import type { Post, Story } from './homeFeedTypes';

type Setter<T> = (val: T | ((prev: T) => T)) => void;
interface UseHomeInitialDataParams {
  currentUserId: string | null;
  cacheKey: string;
  username?: string;
  postsRef: MutableRefObject<Post[]>;
  storiesRef: MutableRefObject<Story[]>;
  hydrateLikedByPreview: (items: Post[], followings: string[]) => Promise<Post[]>;
  rankFeedForUser: (items: Post[]) => Post[];
  commitBaseFeedPosts: (items: Post[]) => void;
  setPostsEmpty: () => void;
  setStories: Setter<Story[]>;
  setFollowingIds: Setter<string[]>;
  setHiddenPostIds: Setter<string[]>;
  setHasMyStory: Setter<boolean>;
  setIsMyStoryViewed: Setter<boolean>;
  setLoading: Setter<boolean>;
  setRefreshing: Setter<boolean>;
  setLastDoc: Setter<any>;
  setNoMore: Setter<boolean>;
  setViewerRegion: Setter<string>;
}

export const useHomeInitialData = (params: UseHomeInitialDataParams) => {
  return useCallback(async () => {
    const { currentUserId } = params;
    if (!currentUserId) {
      params.setLoading(false);
      params.setRefreshing(false);
      params.setPostsEmpty();
      params.setStories([]);
      params.setHasMyStory(false);
      params.setIsMyStoryViewed(false);
      return;
    }
    try {
      if (params.postsRef.current.length === 0 && params.storiesRef.current.length === 0) params.setLoading(true);
      const followings = await userService.getFollowing(currentUserId, 50);
      params.setFollowingIds(followings || []);
      const [settings, feedResult, storiesData, myStoriesData, myStoryViewed] = await Promise.all([
        withTimeout(settingsService.getUserSettings(currentUserId), 7000, null as any),
        withTimeout(postService.getFeedPosts(followings || [], currentUserId, 20), 9000, { posts: [], lastDoc: null } as any),
        withTimeout(storyService.getFollowingStories(currentUserId, currentUserId), 7000, [] as any[]),
        withTimeout(storyService.getUserActiveStories(currentUserId, currentUserId), 7000, [] as any[]),
        withTimeout(storyService.hasViewedAllStoriesFrom(currentUserId, currentUserId).catch(() => false), 5000, false),
      ]);
      const hidden = Array.isArray(settings?.hiddenPosts) ? settings.hiddenPosts : [];
      const feedPosts = feedResult?.posts || [];
      params.setViewerRegion(String(settings?.region || '').trim());
      params.setHiddenPostIds(hidden);
      params.setLastDoc(feedResult?.lastDoc || null);
      params.setNoMore(!feedResult?.lastDoc || feedPosts.length === 0);

      let finalPosts = (feedPosts || [])
        .filter((post: any) => post.authorId !== currentUserId)
        .filter((post: any) => !hidden.includes(post.postId))
        .map(transformFeedPost);
      finalPosts = params.rankFeedForUser(await params.hydrateLikedByPreview(finalPosts, followings || []));

      const authorIds = Array.from(new Set((storiesData || []).map((story: any) => story.authorId).filter(Boolean)));
      const viewedResults = await Promise.all(authorIds.map(async (id) => {
        try { return await storyService.hasViewedAllStoriesFrom(id as string, currentUserId); } catch { return false; }
      }));
      const viewedMap = new Map<string, boolean>();
      authorIds.forEach((id, index) => viewedMap.set(String(id), !!viewedResults[index]));
      const { ownStory, visibleStories } = buildVisibleStories(storiesData || [], currentUserId, params.username || '', viewedMap);
      const finalHasMyStory = (myStoriesData?.length || 0) > 0 || !!ownStory;
      params.setHasMyStory(finalHasMyStory);
      params.setIsMyStoryViewed(finalHasMyStory ? !!myStoryViewed : false);
      params.commitBaseFeedPosts(finalPosts);
      params.setStories(visibleStories);
      if (params.cacheKey) void cacheIntegration.cacheData(params.cacheKey, {
        posts: finalPosts,
        stories: visibleStories,
        followingIds: followings || [],
        hasMyStory: finalHasMyStory,
        isMyStoryViewed: finalHasMyStory ? !!myStoryViewed : false,
        warmedAt: Date.now(),
      }, 3 * 60 * 1000);
    } catch (error) {
      console.error('Failed to load data from Firebase:', error);
      params.setPostsEmpty();
      params.setStories([]);
      params.setIsMyStoryViewed(false);
    } finally {
      params.setLoading(false);
    }
  }, [params]);
};
