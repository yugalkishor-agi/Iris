import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { storyReactionService, StoryReaction } from '../services/storyReaction.service';
import { ReactionType } from '../components/story/StoryReactionPicker';

interface StoryReactionWithDate extends Omit<StoryReaction, 'createdAt'> {
  createdAt: Date;
}

export const useStoryReactions = (storyId: string, userId: string) => {
  const [reactions, setReactions] = useState<StoryReactionWithDate[]>([]);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
    like: 0,
    love: 0,
    laugh: 0,
    wow: 0,
    sad: 0,
    angry: 0,
  });
  const [loading, setLoading] = useState(true);
  const [reacting, setReacting] = useState(false);

  // Load initial data
  useEffect(() => {
    if (storyId && userId) {
      loadReactions();
      loadUserReaction();
      loadReactionCounts();
    }
  }, [storyId, userId]);

  const loadReactions = async () => {
    try {
      const storyReactions = await storyReactionService.getStoryReactions(storyId);
      setReactions(storyReactions.map(reaction => ({
        ...reaction,
        createdAt: reaction.createdAt instanceof Timestamp ? reaction.createdAt.toDate() : new Date(),
      })));
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const loadUserReaction = async () => {
    try {
      const reaction = await storyReactionService.getUserReaction(storyId, userId);
      setUserReaction(reaction);
    } catch (error) {
      console.error('Error loading user reaction:', error);
    }
  };

  const loadReactionCounts = async () => {
    try {
      const counts = await storyReactionService.getReactionCounts(storyId);
      setReactionCounts(counts);
      setLoading(false);
    } catch (error) {
      console.error('Error loading reaction counts:', error);
      setLoading(false);
    }
  };

  const addReaction = useCallback(async (reactionType: ReactionType) => {
    if (reacting) return;

    try {
      setReacting(true);

      // Check if user can react
      const canReact = await storyReactionService.canUserReact(storyId, userId);
      if (!canReact) {
        Alert.alert('Cannot React', 'This story is no longer available for reactions.');
        return;
      }

      // Optimistic update
      const previousReaction = userReaction;
      setUserReaction(reactionType);

      // Update counts optimistically
      setReactionCounts(prev => {
        const newCounts = { ...prev };
        
        // Remove previous reaction count
        if (previousReaction) {
          newCounts[previousReaction] = Math.max(0, newCounts[previousReaction] - 1);
        }
        
        // Add new reaction count
        newCounts[reactionType] = newCounts[reactionType] + 1;
        
        return newCounts;
      });

      // Add to reactions list optimistically
      if (previousReaction !== reactionType) {
        setReactions(prev => {
          // Remove previous reaction if exists
          const filteredReactions = prev.filter(r => r.userId !== userId);
          
          // Add new reaction
          const newReaction: StoryReactionWithDate = {
            reactionId: `temp-${Date.now()}`,
            storyId,
            userId,
            username: 'You', // Will be updated when we reload
            reactionType,
            createdAt: new Date(),
          };
          
          return [newReaction, ...filteredReactions];
        });
      }

      // Make API call
      await storyReactionService.addReaction(storyId, userId, reactionType);
      
      // Reload data to get accurate counts and user info
      await Promise.all([
        loadReactions(),
        loadReactionCounts(),
      ]);

    } catch (error) {
      console.error('Error adding reaction:', error);
      
      // Revert optimistic updates
      await loadUserReaction();
      await loadReactionCounts();
      await loadReactions();
      
      Alert.alert('Error', 'Failed to add reaction. Please try again.');
    } finally {
      setReacting(false);
    }
  }, [storyId, userId, userReaction, reacting]);

  const removeReaction = useCallback(async () => {
    if (reacting || !userReaction) return;

    try {
      setReacting(true);

      // Optimistic update
      const previousReaction = userReaction;
      setUserReaction(null);

      // Update counts optimistically
      setReactionCounts(prev => ({
        ...prev,
        [previousReaction]: Math.max(0, prev[previousReaction] - 1),
      }));

      // Remove from reactions list optimistically
      setReactions(prev => prev.filter(r => r.userId !== userId));

      // Make API call
      await storyReactionService.removeReaction(storyId, userId);
      
      // Reload data to get accurate counts
      await Promise.all([
        loadReactions(),
        loadReactionCounts(),
      ]);

    } catch (error) {
      console.error('Error removing reaction:', error);
      
      // Revert optimistic updates
      await loadUserReaction();
      await loadReactionCounts();
      await loadReactions();
      
      Alert.alert('Error', 'Failed to remove reaction. Please try again.');
    } finally {
      setReacting(false);
    }
  }, [storyId, userId, userReaction, reacting]);

  const toggleReaction = useCallback(async (reactionType: ReactionType) => {
    if (userReaction === reactionType) {
      await removeReaction();
    } else {
      await addReaction(reactionType);
    }
  }, [userReaction, addReaction, removeReaction]);

  const refreshReactions = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadReactions(),
      loadUserReaction(),
      loadReactionCounts(),
    ]);
  }, [storyId, userId]);

  const getTotalReactions = useCallback(() => {
    return Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);
  }, [reactionCounts]);

  const getTopReactions = useCallback((limit: number = 3) => {
    return Object.entries(reactionCounts)
      .filter(([_, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([type]) => type as ReactionType);
  }, [reactionCounts]);

  return {
    reactions,
    userReaction,
    reactionCounts,
    loading,
    reacting,
    addReaction,
    removeReaction,
    toggleReaction,
    refreshReactions,
    getTotalReactions,
    getTopReactions,
  };
};
