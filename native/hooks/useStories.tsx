import { useState, useEffect } from 'react';
import { storyService } from '../services/story.service';
import { realtimeService } from '../services/realtime.service';
import type { Story, Highlight } from '../types/database';
import { useAuth } from '../contexts/AuthContext';

export const useStories = (userId?: string) => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const targetUserId = userId || user?.userId;
    if (!targetUserId) return;

    const loadStories = async () => {
      try {
        setLoading(true);
        const data = await storyService.getUserActiveStories(targetUserId);
        setStories(data);
      } catch (error) {
        console.error('Failed to load stories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStories();

    // Listen to real-time story updates
    const listenerId = realtimeService.listenToUserStories(targetUserId, (updatedStories) => {
      setStories(updatedStories);
    });

    return () => {
      realtimeService.stopListener(listenerId);
    };
  }, [userId, user?.userId]);

  return { stories, loading };
};

export const useStoriesFeed = () => {
  const { user } = useAuth();
  const [storiesMap, setStoriesMap] = useState<Map<string, Story[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadStoriesFeed = async () => {
      try {
        setLoading(true);
        const followingIds = await storyService.getStoriesFeed([]);
        setStoriesMap(followingIds);
      } catch (error) {
        console.error('Failed to load stories feed:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoriesFeed();
  }, [user]);

  return { storiesMap, loading };
};

export const useCreateStory = () => {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  const createStory = async (
    mediaFile: File,
    textOverlay?: { text: string; position: { x: number; y: number }; fontSize: number; color: string },
    audience: 'public' | 'followers' | 'closeFriends' = 'followers'
  ) => {
    if (!user) throw new Error('Not authenticated');

    setCreating(true);
    try {
      const { mediaService } = await import('../../src/services/media.service');
      const { mediaURL, thumbnailURL } = await mediaService.uploadStoryMedia(
        user.userId,
        mediaFile
      );

      const storyId = await storyService.createStory(
        user.userId,
        user.username,
        user.avatarURL || '',
        mediaURL,
        'image',
        5, // 5 seconds duration for images
        thumbnailURL,
        textOverlay,
        audience
      );

      return storyId;
    } catch (error) {
      throw error;
    } finally {
      setCreating(false);
    }
  };

  return { createStory, creating };
};

export const useHighlights = (userId: string) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadHighlights = async () => {
      try {
        setLoading(true);
        const data = await storyService.getUserHighlights(userId);
        setHighlights(data);
      } catch (error) {
        console.error('Failed to load highlights:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHighlights();
  }, [userId]);

  const createHighlight = async (name: string, coverFile: File) => {
    try {
      const { mediaService } = await import('../../src/services/media.service');
      const coverURL = await mediaService.uploadAvatar(userId, coverFile);
      
      const highlightId = await storyService.createHighlight(userId, name, coverURL);
      
      const updatedHighlights = await storyService.getUserHighlights(userId);
      setHighlights(updatedHighlights);
      
      return highlightId;
    } catch (error) {
      throw error;
    }
  };

  return { highlights, loading, createHighlight };
};
