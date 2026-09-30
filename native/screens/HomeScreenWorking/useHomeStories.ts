import { useEffect, useRef } from 'react';
import { storyService } from '../../services/story.service';
import type { Story } from './homeFeedTypes';

interface ProcessingStory {
  status?: string;
  storyId?: string;
  id?: string;
  localUri?: string;
  createdAt?: any;
}

interface UseHomeStoriesParams {
  currentUserId: string | null;
  processingStories: ProcessingStory[];
  loadInitialData: () => Promise<void>;
  setStories: (val: Story[] | ((prev: Story[]) => Story[])) => void;
  setIsMyStoryViewed: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const useHomeStories = ({
  currentUserId,
  processingStories,
  loadInitialData,
  setStories,
  setIsMyStoryViewed,
}: UseHomeStoriesParams) => {
  const completedStorySignatureRef = useRef('');

  useEffect(() => {
    if (!currentUserId) return;
    return storyService.subscribeRuntime((event) => {
      if (event.type !== 'viewed' || event.viewerId !== currentUserId || !event.authorId) return;

      if (event.authorId === currentUserId) {
        void storyService.hasViewedAllStoriesFrom(currentUserId, currentUserId)
          .then(setIsMyStoryViewed)
          .catch((error) => console.warn('Failed to sync own story viewed state:', error));
      }

      void storyService.hasViewedAllStoriesFrom(event.authorId, currentUserId)
        .then((isViewed) => {
          setStories((prevStories) => {
            let changed = false;
            const nextStories = prevStories.map((story) => {
              if (story.userId !== event.authorId || story.isViewed === isViewed) return story;
              changed = true;
              return { ...story, isViewed };
            });
            if (!changed) return prevStories;
            return nextStories.sort((a, b) => {
              if (!!a.isViewed !== !!b.isViewed) return a.isViewed ? 1 : -1;
              return 0;
            });
          });
        })
        .catch((error) => console.warn('Failed to sync story viewed state:', error));
    });
  }, [currentUserId, setIsMyStoryViewed, setStories]);

  useEffect(() => {
    if (!currentUserId) return;
    const completedSignature = processingStories
      .filter((story) => story.status === 'completed')
      .map((story, index) => String(story.storyId || story.id || story.localUri || story.createdAt || index))
      .sort()
      .join('|');

    if (!completedSignature) {
      completedStorySignatureRef.current = '';
      return;
    }
    if (completedStorySignatureRef.current === completedSignature) return;
    completedStorySignatureRef.current = completedSignature;
    void loadInitialData();
  }, [processingStories, currentUserId, loadInitialData]);
};
