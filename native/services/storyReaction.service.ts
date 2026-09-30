import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ReactionType } from '../components/story/StoryReactionPicker';

export interface StoryReaction {
  reactionId: string;
  storyId: string;
  userId: string;
  username: string;
  displayName?: string;
  avatarURL?: string;
  verified?: boolean;
  reactionType: ReactionType;
  createdAt: Timestamp;
}

const EMPTY_REACTION_COUNTS: Record<ReactionType, number> = {
  like: 0,
  love: 0,
  laugh: 0,
  wow: 0,
  sad: 0,
  angry: 0,
};

class StoryReactionService {
  async addReaction(storyId: string, userId: string, reactionType: ReactionType): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() || {};

      const existingReaction = await this.getUserReaction(storyId, userId);
      const batch = writeBatch(db);

      if (existingReaction) {
        const prevReactionRef = doc(db, 'stories', storyId, 'reactions', userId);
        batch.delete(prevReactionRef);
        batch.update(doc(db, 'stories', storyId), {
          [`reactionCounts.${existingReaction}`]: increment(-1),
          'stats.reactionsCount': increment(-1),
          updatedAt: serverTimestamp(),
        });
      }

      const reactionRef = doc(db, 'stories', storyId, 'reactions', userId);
      batch.set(reactionRef, {
        storyId,
        userId,
        username: userData?.username || 'Unknown',
        displayName: userData?.displayName,
        avatarURL: userData?.avatarURL,
        verified: !!userData?.verified,
        reactionType,
        createdAt: serverTimestamp(),
      });

      batch.update(doc(db, 'stories', storyId), {
        [`reactionCounts.${reactionType}`]: increment(1),
        'stats.reactionsCount': increment(1),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      if (reactionType === 'like') {
        try {
          const storySnap = await getDoc(doc(db, 'stories', storyId));
          const storyData: any = storySnap.data();
          const ownerId = storyData?.authorId || storyData?.userId;
          const storyMediaURL = storyData?.coverImageURL || storyData?.mediaURL;

          if (ownerId && ownerId !== userId) {
            const { notificationService } = await import('./notification.service');
            await notificationService.notifyStoryLike(
              ownerId,
              userId,
              userData?.username || 'Unknown',
              userData?.avatarURL || '',
              !!userData?.verified,
              storyId,
              storyMediaURL
            );
          }
        } catch {
          // best-effort side effect
        }
      }
    } catch (error) {
      console.error('Error adding story reaction:', error);
      throw error;
    }
  }

  async removeReaction(storyId: string, userId: string): Promise<void> {
    try {
      const reactionRef = doc(db, 'stories', storyId, 'reactions', userId);
      const reactionSnap = await getDoc(reactionRef);
      if (!reactionSnap.exists()) return;

      const reaction = reactionSnap.data();
      const batch = writeBatch(db);
      batch.delete(reactionRef);
      batch.update(doc(db, 'stories', storyId), {
        [`reactionCounts.${reaction.reactionType}`]: increment(-1),
        'stats.reactionsCount': increment(-1),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error('Error removing story reaction:', error);
      throw error;
    }
  }

  async getUserReaction(storyId: string, userId: string): Promise<ReactionType | null> {
    try {
      const reactionSnap = await getDoc(doc(db, 'stories', storyId, 'reactions', userId));
      return reactionSnap.exists() ? (reactionSnap.data().reactionType as ReactionType) : null;
    } catch (error) {
      console.error('Error getting user reaction:', error);
      return null;
    }
  }

  async getStoryReactions(storyId: string): Promise<StoryReaction[]> {
    try {
      const reactionsRef = collection(db, 'stories', storyId, 'reactions');
      const snapshot = await getDocs(query(reactionsRef, orderBy('createdAt', 'desc')));

      return snapshot.docs.map((reactionDoc) => ({
        reactionId: reactionDoc.id,
        ...(reactionDoc.data() as any),
        createdAt: reactionDoc.data().createdAt || Timestamp.now(),
      })) as StoryReaction[];
    } catch (error) {
      console.error('Error getting story reactions:', error);
      return [];
    }
  }

  async getReactionsByType(storyId: string, reactionType: ReactionType): Promise<StoryReaction[]> {
    try {
      const reactionsRef = collection(db, 'stories', storyId, 'reactions');
      const snapshot = await getDocs(
        query(reactionsRef, where('reactionType', '==', reactionType), orderBy('createdAt', 'desc'))
      );

      return snapshot.docs.map((reactionDoc) => ({
        reactionId: reactionDoc.id,
        ...(reactionDoc.data() as any),
        createdAt: reactionDoc.data().createdAt || Timestamp.now(),
      })) as StoryReaction[];
    } catch (error) {
      console.error('Error getting reactions by type:', error);
      return [];
    }
  }

  async getReactionCounts(storyId: string): Promise<Record<ReactionType, number>> {
    try {
      const storySnap = await getDoc(doc(db, 'stories', storyId));
      if (!storySnap.exists()) return { ...EMPTY_REACTION_COUNTS };

      return {
        ...EMPTY_REACTION_COUNTS,
        ...(storySnap.data().reactionCounts || {}),
      };
    } catch (error) {
      console.error('Error getting reaction counts:', error);
      return { ...EMPTY_REACTION_COUNTS };
    }
  }

  async toggleReaction(storyId: string, userId: string, reactionType: ReactionType): Promise<ReactionType | null> {
    try {
      const currentReaction = await this.getUserReaction(storyId, userId);

      if (currentReaction === reactionType) {
        await this.removeReaction(storyId, userId);
        return null;
      }

      await this.addReaction(storyId, userId, reactionType);
      return reactionType;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      throw error;
    }
  }

  async getUserReactedStories(userId: string, limitCount: number = 20): Promise<string[]> {
    try {
      const reactionsRef = collectionGroup(db, 'reactions');
      const snapshot = await getDocs(
        query(reactionsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(limitCount))
      );

      const storyIds = new Set<string>();
      snapshot.docs.forEach((reactionDoc) => {
        const data = reactionDoc.data();
        if (typeof data?.storyId === 'string' && data.storyId.length > 0) {
          storyIds.add(data.storyId);
          return;
        }

        const match = reactionDoc.ref.path.match(/^stories\/([^/]+)\/reactions\/[^/]+$/);
        if (match?.[1]) storyIds.add(match[1]);
      });

      return Array.from(storyIds);
    } catch (error) {
      console.error('Error getting user reacted stories:', error);
      return [];
    }
  }

  async getUserReactionStats(userId: string): Promise<{
    totalReactions: number;
    reactionsByType: Record<ReactionType, number>;
    mostUsedReaction: ReactionType | null;
  }> {
    try {
      const reactionsByType: Record<ReactionType, number> = { ...EMPTY_REACTION_COUNTS };
      const reactionsRef = collectionGroup(db, 'reactions');
      const snapshot = await getDocs(query(reactionsRef, where('userId', '==', userId)));

      snapshot.docs.forEach((reactionDoc) => {
        const reactionType = reactionDoc.data()?.reactionType as ReactionType | undefined;
        if (reactionType && reactionsByType[reactionType] !== undefined) {
          reactionsByType[reactionType] += 1;
        }
      });

      const totalReactions = Object.values(reactionsByType).reduce((sum, count) => sum + count, 0);
      const mostUsed = Object.entries(reactionsByType).sort((a, b) => b[1] - a[1])[0]?.[0] as ReactionType | undefined;

      return {
        totalReactions,
        reactionsByType,
        mostUsedReaction: totalReactions > 0 ? mostUsed || null : null,
      };
    } catch (error) {
      console.error('Error getting user reaction stats:', error);
      return {
        totalReactions: 0,
        reactionsByType: { ...EMPTY_REACTION_COUNTS },
        mostUsedReaction: null,
      };
    }
  }

  async removeAllStoryReactions(storyId: string): Promise<void> {
    try {
      const reactionsRef = collection(db, 'stories', storyId, 'reactions');
      const snapshot = await getDocs(reactionsRef);
      const batch = writeBatch(db);

      snapshot.docs.forEach((reactionDoc) => {
        batch.delete(reactionDoc.ref);
      });

      batch.update(doc(db, 'stories', storyId), {
        reactionCounts: { ...EMPTY_REACTION_COUNTS },
        'stats.reactionsCount': 0,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error('Error removing all story reactions:', error);
      throw error;
    }
  }

  async getTopReactedStories(limitCount: number = 10): Promise<string[]> {
    try {
      const storiesRef = collection(db, 'stories');
      const snapshot = await getDocs(
        query(
          storiesRef,
          where('isActive', '==', true),
          orderBy('stats.reactionsCount', 'desc'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        )
      );

      return snapshot.docs.map((storyDoc) => storyDoc.id);
    } catch (error) {
      console.error('Error getting top reacted stories:', error);
      return [];
    }
  }

  async canUserReact(storyId: string, userId: string): Promise<boolean> {
    try {
      const storySnap = await getDoc(doc(db, 'stories', storyId));
      if (!storySnap.exists()) return false;

      const story = storySnap.data();
      const expiresAt = story.expiresAt?.toDate?.();

      if (expiresAt && new Date() > expiresAt) return false;
      if (!story.isActive) return false;

      if (story.audience === 'closeFriends') {
        const authorId = story.authorId || story.userId;
        if (!authorId) return false;
        if (authorId === userId) return true;

        const closeFriendSnap = await getDoc(doc(db, `users/${authorId}/closeFriends/${userId}`));
        if (!closeFriendSnap.exists()) return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking if user can react:', error);
      return false;
    }
  }
}

export const storyReactionService = new StoryReactionService();
