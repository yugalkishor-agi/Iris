import { useState, useEffect } from 'react';
import { storyService, type Story } from '../services/story.service';
import { realtimeService } from '../services/realtime.service';
import type { Highlight } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { highlightService } from '../services/highlight.service';

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
      setStories(updatedStories as unknown as Story[]);
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
        const stories = await storyService.getFollowingStories(user.userId);
        const grouped = new Map<string, Story[]>();
        stories.forEach((story) => {
          const key = story.authorId;
          const existing = grouped.get(key) || [];
          existing.push(story);
          grouped.set(key, existing);
        });
        setStoriesMap(grouped);
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
    mediaFile: any,
    textOverlay?: { text: string; position: { x: number; y: number }; fontSize: number; color: string },
    audience: 'public' | 'followers' | 'closeFriends' = 'followers'
  ) => {
    if (!user) throw new Error('Not authenticated');

    setCreating(true);
    try {
      const { mediaService } = await import('../services/media.service.native');
      const { mediaURL, thumbnailURL } = await mediaService.uploadStoryMedia(
        user.userId,
        mediaFile
      );

      const storyId = await storyService.createStory({
        authorId: user.userId,
        authorUsername: user.username,
        authorAvatarURL: user.avatarURL || '',
        mediaURL,
        thumbnailURL,
        mediaType: 'image',
        caption: textOverlay?.text?.trim() || undefined,
        audience,
      });

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
        const data = await highlightService.getUserHighlights(userId);
        setHighlights(data as unknown as Highlight[]);
      } catch (error) {
        console.error('Failed to load highlights:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHighlights();
  }, [userId]);

  const createHighlight = async (name: string, coverFile: any) => {
    try {
      const { mediaService } = await import('../services/media.service.native');
      const coverURL = await mediaService.uploadAvatar(userId, coverFile);

      const userStories = await storyService.getUserActiveStories(userId);
      const highlightId = await highlightService.createHighlight({
        title: name,
        authorId: userId,
        stories: userStories.map((story) => ({
          storyId: story.storyId,
          authorId: story.authorId,
          mediaURL: story.mediaURL,
          mediaType: story.mediaType,
          createdAt: story.createdAt,
          expiresAt: story.expiresAt,
        })),
        coverImageURL: coverURL,
      });

      const updatedHighlights = await highlightService.getUserHighlights(userId);
      setHighlights(updatedHighlights as unknown as Highlight[]);

      return highlightId;
    } catch (error) {
      throw error;
    }
  };

  return { highlights, loading, createHighlight };
};

