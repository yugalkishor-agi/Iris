import { useEffect } from 'react';
import { storageService } from '../../services/storage.service';
import { clamp01 } from './homeFeedRanking';
import {
  DEFAULT_FEED_CONTROL_SETTINGS,
  FEED_CONTROL_CACHE_KEY,
  type FeedControlSettings,
} from './homeFeedTypes';

interface UseHomeFeedControlsParams {
  currentUserId: string | null;
  isFocused: boolean;
  setFeedControls: (val: FeedControlSettings | ((prev: FeedControlSettings) => FeedControlSettings)) => void;
}

export const useHomeFeedControls = ({
  currentUserId,
  isFocused,
  setFeedControls,
}: UseHomeFeedControlsParams) => {
  useEffect(() => {
    if (!currentUserId) {
      setFeedControls(DEFAULT_FEED_CONTROL_SETTINGS);
      return;
    }

    const cached = storageService.getCachedData<FeedControlSettings>(FEED_CONTROL_CACHE_KEY, currentUserId);
    setFeedControls(cached
      ? {
          enabled: !!cached.enabled,
          friendsVsPublic: clamp01(cached.friendsVsPublic),
          photosVsVideos: clamp01(cached.photosVsVideos),
          newVsOldViral: clamp01(cached.newVsOldViral),
          localVsGlobal: clamp01(cached.localVsGlobal),
          mood: cached.mood || 'balanced',
        }
      : DEFAULT_FEED_CONTROL_SETTINGS);
  }, [currentUserId, isFocused, setFeedControls]);
};
