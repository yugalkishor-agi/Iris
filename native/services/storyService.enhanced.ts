import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { cacheIntegration } from './cacheIntegration.service';

interface StoryComplete {
  storyId: string;
  authorId: string;
  authorUsername: string;
  authorAvatarURL?: string;
  authorVerified?: boolean;
  mediaURL: string;
  mediaType: 'image' | 'video';
  duration: number;
  textOverlay?: {
    text: string;
    position: { x: number; y: number };
    fontSize: number;
    color: string;
  };
  backgroundMusic?: {
    trackTitle: string;
    artistName: string;
  };
  audience: 'public' | 'followers' | 'closeFriends';
  viewsCount: number;
  likesCount: number;
  repliesCount: number;
  createdAt: any;
  expiresAt: any;
  isLiked?: boolean;
  hasViewed?: boolean;
}

export class StoryServiceEnhanced {
  /**
   * Get story by ID with complete data
   */
  async getStory(storyId: string): Promise<StoryComplete | null> {
    try {
      // Try cache first
      const cached = await cacheIntegration.getCachedStory(storyId);
      if (cached) {
        return cached as StoryComplete;
      }

      const storyRef = doc(db, 'stories', storyId);
      const storySnap = await getDoc(storyRef);

      if (!storySnap.exists()) {
        return null;
      }

      const storyData = {
        storyId: storySnap.id,
        ...storySnap.data(),
        // Ensure required fields have defaults
        duration: storySnap.data().duration || 5,
        viewsCount: storySnap.data().viewsCount || 0,
        likesCount: storySnap.data().likesCount || 0,
        repliesCount: storySnap.data().repliesCount || 0,
      } as StoryComplete;

      // Cache the story
      await cacheIntegration.cacheStory(storyId, storyData);

      return storyData;
    } catch (error) {
      console.error('Error getting story:', error);
      return null;
    }
  }

  /**
   * Get user's active stories
   */
  async getUserActiveStories(userId: string): Promise<StoryComplete[]> {
    try {
      // Try cache first
      const cached = await cacheIntegration.getCachedUserStories(userId);
      if (cached && Array.isArray(cached)) {
        return cached as StoryComplete[];
      }

      const storiesRef = collection(db, 'stories');
      const now = new Date();
      
      const q = query(
        storiesRef,
        where('authorId', '==', userId),
        where('expiresAt', '>', Timestamp.fromDate(now)),
        orderBy('expiresAt', 'asc'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const stories = snapshot.docs.map(doc => ({
        storyId: doc.id,
        ...doc.data(),
        // Ensure required fields
        duration: doc.data().duration || 5,
        viewsCount: doc.data().viewsCount || 0,
        likesCount: doc.data().likesCount || 0,
        repliesCount: doc.data().repliesCount || 0,
      })) as StoryComplete[];

      // Cache user stories
      await cacheIntegration.cacheUserStories(userId, stories);

      return stories;
    } catch (error) {
      console.error('Error getting user stories:', error);
      return [];
    }
  }

  /**
   * Get stories from following users
   */
  async getFollowingStories(userId: string): Promise<StoryComplete[]> {
    try {
      // Try cache first
      const cached = await cacheIntegration.getCachedFollowingStories(userId);
      if (cached && Array.isArray(cached)) {
        return cached as StoryComplete[];
      }

      // Get user's following list
      const followingRef = collection(db, 'users', userId, 'following');
      const followingSnapshot = await getDocs(followingRef);
      const followingIds = followingSnapshot.docs.map(doc => doc.id);

      if (followingIds.length === 0) {
        return [];
      }

      // Get stories from following users
      const storiesRef = collection(db, 'stories');
      const now = new Date();
      
      const q = query(
        storiesRef,
        where('authorId', 'in', followingIds.slice(0, 10)), // Firestore limit
        where('expiresAt', '>', Timestamp.fromDate(now)),
        orderBy('expiresAt', 'asc'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const stories = snapshot.docs.map(doc => ({
        storyId: doc.id,
        ...doc.data(),
        duration: doc.data().duration || 5,
        viewsCount: doc.data().viewsCount || 0,
        likesCount: doc.data().likesCount || 0,
        repliesCount: doc.data().repliesCount || 0,
      })) as StoryComplete[];

      // Cache following stories
      await cacheIntegration.cacheFollowingStories(userId, stories);

      return stories;
    } catch (error) {
      console.error('Error getting following stories:', error);
      return [];
    }
  }

  /**
   * View a story
   */
  async viewStory(storyId: string, viewerId: string): Promise<void> {
    try {
      const viewRef = doc(db, 'stories', storyId, 'views', viewerId);
      await setDoc(viewRef, {
        viewerId,
        viewedAt: serverTimestamp(),
      });

      // Update story view count
      const storyRef = doc(db, 'stories', storyId);
      await updateDoc(storyRef, {
        viewsCount: increment(1),
      });

      // Invalidate cache
      await cacheIntegration.invalidateStory(storyId);
    } catch (error) {
      console.error('Error viewing story:', error);
      throw error;
    }
  }

  /**
   * Like a story
   */
  async likeStory(storyId: string, userId: string): Promise<void> {
    try {
      const likeRef = doc(db, 'stories', storyId, 'likes', userId);
      await setDoc(likeRef, {
        userId,
        likedAt: serverTimestamp(),
      });

      // Update story like count
      const storyRef = doc(db, 'stories', storyId);
      await updateDoc(storyRef, {
        likesCount: increment(1),
      });

      // Invalidate cache
      await cacheIntegration.invalidateStory(storyId);
    } catch (error) {
      console.error('Error liking story:', error);
      throw error;
    }
  }

  /**
   * Unlike a story
   */
  async unlikeStory(storyId: string, userId: string): Promise<void> {
    try {
      const likeRef = doc(db, 'stories', storyId, 'likes', userId);
      await deleteDoc(likeRef);

      // Update story like count
      const storyRef = doc(db, 'stories', storyId);
      await updateDoc(storyRef, {
        likesCount: increment(-1),
      });

      // Invalidate cache
      await cacheIntegration.invalidateStory(storyId);
    } catch (error) {
      console.error('Error unliking story:', error);
      throw error;
    }
  }

  /**
   * Check if user has liked a story
   */
  async isStoryLiked(storyId: string, userId: string): Promise<boolean> {
    try {
      const likeRef = doc(db, 'stories', storyId, 'likes', userId);
      const likeSnap = await getDoc(likeRef);
      return likeSnap.exists();
    } catch (error) {
      console.error('Error checking story like status:', error);
      return false;
    }
  }

  /**
   * Check if user has viewed a story
   */
  async hasViewedStory(storyId: string, userId: string): Promise<boolean> {
    try {
      const viewRef = doc(db, 'stories', storyId, 'views', userId);
      const viewSnap = await getDoc(viewRef);
      return viewSnap.exists();
    } catch (error) {
      console.error('Error checking story view status:', error);
      return false;
    }
  }

  /**
   * Get story viewers
   */
  async getStoryViewers(storyId: string): Promise<any[]> {
    try {
      const viewsRef = collection(db, 'stories', storyId, 'views');
      const q = query(viewsRef, orderBy('viewedAt', 'desc'), limit(100));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        viewerId: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting story viewers:', error);
      return [];
    }
  }

  /**
   * Create a story
   */
  async createStory(storyData: Partial<StoryComplete>): Promise<string> {
    try {
      const storyRef = doc(collection(db, 'stories'));
      const storyId = storyRef.id;

      // Set expiry to 24 hours from now
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const completeStoryData: StoryComplete = {
        storyId,
        authorId: storyData.authorId!,
        authorUsername: storyData.authorUsername!,
        authorAvatarURL: storyData.authorAvatarURL,
        authorVerified: storyData.authorVerified || false,
        mediaURL: storyData.mediaURL!,
        mediaType: storyData.mediaType!,
        duration: storyData.duration || 5,
        textOverlay: storyData.textOverlay,
        backgroundMusic: storyData.backgroundMusic,
        audience: storyData.audience || 'followers',
        viewsCount: 0,
        likesCount: 0,
        repliesCount: 0,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
      };

      await setDoc(storyRef, completeStoryData);

      // Update user's story count
      const userRef = doc(db, 'users', storyData.authorId!);
      await updateDoc(userRef, {
        'stats.storiesCount': increment(1),
      });

      // Invalidate relevant caches
      await cacheIntegration.invalidateStory(storyId, storyData.authorId);

      return storyId;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }

  /**
   * Delete a story
   */
  async deleteStory(storyId: string, authorId: string): Promise<void> {
    try {
      const storyRef = doc(db, 'stories', storyId);
      await deleteDoc(storyRef);

      // Update user's story count
      const userRef = doc(db, 'users', authorId);
      await updateDoc(userRef, {
        'stats.storiesCount': increment(-1),
      });

      // Invalidate cache
      await cacheIntegration.invalidateStory(storyId, authorId);
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }
}

export const storyServiceEnhanced = new StoryServiceEnhanced();
