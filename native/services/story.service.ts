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
import { supabase } from '../config/supabase';
import type { Story, Highlight } from '../types/database';

export class StoryService {
  // ==========================================
  // STORY CRUD OPERATIONS
  // ==========================================

  /**
   * Create a story
   */
  async createStory(
    authorId: string,
    authorUsername: string,
    authorAvatarURL: string,
    mediaURL: string,
    mediaType: 'image' | 'video',
    duration: number,
    thumbnailURL?: string,
    textOverlay?: { text: string; position: { x: number; y: number }; fontSize: number; color: string },
    audience: 'public' | 'followers' | 'closeFriends' = 'followers',
    backgroundMusic?: {
      trackId: string;
      trackTitle: string;
      artistName: string;
      coverArtURL?: string;
      clipStart: number;
      clipEnd: number;
      customAudio?: boolean;
      customAudioUrl?: string;
    },
    caption?: string,
    mentions?: string[],
    tags?: string[],
    taggedUsers?: Array<{ userId: string; username: string }>,
    mentionStickers?: Array<{ 
      userId: string; 
      username: string; 
      avatarURL: string; 
      verified?: boolean;
      x: number; 
      y: number; 
      rotation: number; 
      scaleX: number; 
      scaleY: number 
    }>
  ): Promise<string> {
    const storyRef = doc(collection(db, 'stories'));
    const storyId = storyRef.id;

    // Stories expire after 24 hours
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Extract mentions from textOverlay if present
    const extractedMentions: string[] = [];
    if (textOverlay?.text) {
      const mentionRegex = /@([a-zA-Z0-9_\.]+)/g;
      let match;
      while ((match = mentionRegex.exec(textOverlay.text)) !== null) {
        extractedMentions.push(match[1]);
      }
    }
    
    // Extract usernames from mentionStickers
    const stickerMentions: string[] = [];
    if (mentionStickers && mentionStickers.length > 0) {
      mentionStickers.forEach(sticker => {
        if (sticker.username) {
          stickerMentions.push(sticker.username);
        }
      });
    }
    
    // Combine all mentions (text mentions, passed mentions, and sticker mentions)
    const allMentions = [...new Set([...(mentions || []), ...extractedMentions, ...stickerMentions])];

    const storyData: any = {
      storyId,
      authorId,
      authorUsername,
      authorAvatarURL,
      mediaURL,
      mediaType,
      duration,
      audience,
      allowReplies: true,
      allowSharing: true,
      hiddenFrom: [],
      viewsCount: 0,
      likesCount: 0,
      repliesCount: 0,
      stats: {
        viewsCount: 0,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
      },
      caption: caption || '',
      mentions: allMentions,
      tags: tags || [],
      taggedUsers: taggedUsers || [],
      mentionStickers: mentionStickers || [],
      collaborators: [],
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      isHighlighted: false,
    };

    // Only add optional fields if they have values
    if (thumbnailURL) storyData.thumbnailURL = thumbnailURL;
    if (textOverlay) storyData.textOverlay = textOverlay;
    if (backgroundMusic) storyData.backgroundMusic = backgroundMusic;

    await setDoc(storyRef, storyData);

    // Update user's story count
    const userRef = doc(db, 'users', authorId);
    await updateDoc(userRef, {
      'stats.storiesCount': increment(1),
    });

    // Notify mentioned users via chat
    if (allMentions.length > 0) {
      try {
        await this.notifyMentionedUsers(storyId, authorId, authorUsername, authorAvatarURL, allMentions, mediaURL);
      } catch (error) {
        console.error('Failed to notify mentioned users:', error);
        // Don't throw - notification failure shouldn't block story creation
      }
    }

    return storyId;
  }

  /**
   * Update story settings (privacy, replies, sharing)
   */
  async updateStorySettings(
    storyId: string,
    authorId: string,
    settings: {
      audience?: 'public' | 'followers' | 'closeFriends';
      allowReplies?: boolean;
      allowSharing?: boolean;
    }
  ): Promise<void> {
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      throw new Error('Story not found');
    }

    // Verify ownership
    if (storySnap.data()?.authorId !== authorId) {
      throw new Error('Unauthorized: Cannot update someone else\'s story');
    }

    // Update settings
    await updateDoc(storyRef, {
      ...settings,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Hide story from specific users
   */
  async hideStoryFrom(
    storyId: string,
    authorId: string,
    userIds: string[]
  ): Promise<void> {
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      throw new Error('Story not found');
    }

    // Verify ownership
    if (storySnap.data()?.authorId !== authorId) {
      throw new Error('Unauthorized: Cannot update someone else\'s story');
    }

    // Get current hidden users or initialize empty array
    const currentHiddenFrom = storySnap.data()?.hiddenFrom || [];
    const updatedHiddenFrom = Array.from(new Set([...currentHiddenFrom, ...userIds]));

    await updateDoc(storyRef, {
      hiddenFrom: updatedHiddenFrom,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Unhide story from specific users
   */
  async unhideStoryFrom(
    storyId: string,
    authorId: string,
    userIds: string[]
  ): Promise<void> {
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      throw new Error('Story not found');
    }

    // Verify ownership
    if (storySnap.data()?.authorId !== authorId) {
      throw new Error('Unauthorized: Cannot update someone else\'s story');
    }

    // Remove specified users from hidden list
    const currentHiddenFrom = storySnap.data()?.hiddenFrom || [];
    const updatedHiddenFrom = currentHiddenFrom.filter(
      (userId: string) => !userIds.includes(userId)
    );

    await updateDoc(storyRef, {
      hiddenFrom: updatedHiddenFrom,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Archive story (keeps it but marks as archived)
   */
  async archiveStory(storyId: string, authorId: string): Promise<void> {
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      throw new Error('Story not found');
    }

    // Verify ownership
    if (storySnap.data()?.authorId !== authorId) {
      throw new Error('Unauthorized: Cannot archive someone else\'s story');
    }

    await updateDoc(storyRef, {
      isArchived: true,
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Unarchive story
   */
  async unarchiveStory(storyId: string, authorId: string): Promise<void> {
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      throw new Error('Story not found');
    }

    // Verify ownership
    if (storySnap.data()?.authorId !== authorId) {
      throw new Error('Unauthorized: Cannot unarchive someone else\'s story');
    }

    await updateDoc(storyRef, {
      isArchived: false,
      archivedAt: null,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Delete a story
   */
  async deleteStory(storyId: string, authorId: string): Promise<void> {
    try {
      // Get story data first to get media URLs
      const storyRef = doc(db, 'stories', storyId);
      const storySnap = await getDoc(storyRef);
      
      if (!storySnap.exists()) {
        throw new Error('Story not found');
      }
      
      const storyData = storySnap.data();
      
      // Verify ownership
      if (storyData.authorId !== authorId) {
        throw new Error('Unauthorized: Cannot delete someone else\'s story');
      }

      // Delete media from Supabase storage
      if (storyData.mediaURL) {
        try {
          // Extract file path from URL
          const urlParts = storyData.mediaURL.split('/stories/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1].split('?')[0]; // Remove query params
            await supabase.storage.from('stories').remove([filePath]);
            console.log('🗑️ Deleted story media:', filePath);
          }
        } catch (error) {
          console.error('Failed to delete media from storage:', error);
        }
      }

      // Delete thumbnail if exists
      if (storyData.thumbnailURL && storyData.thumbnailURL !== storyData.mediaURL) {
        try {
          const urlParts = storyData.thumbnailURL.split('/stories/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1].split('?')[0];
            await supabase.storage.from('stories').remove([filePath]);
          }
        } catch (error) {
          console.error('Failed to delete thumbnail:', error);
        }
      }

      // Delete subcollections (views, likes, replies)
      const batch = writeBatch(db);
      
      // Delete views
      const viewsRef = collection(db, `stories/${storyId}/views`);
      const viewsSnap = await getDocs(viewsRef);
      viewsSnap.forEach((doc) => batch.delete(doc.ref));
      
      // Delete likes
      const likesRef = collection(db, `stories/${storyId}/likes`);
      const likesSnap = await getDocs(likesRef);
      likesSnap.forEach((doc) => batch.delete(doc.ref));
      
      // Delete replies
      const repliesRef = collection(db, `stories/${storyId}/replies`);
      const repliesSnap = await getDocs(repliesRef);
      repliesSnap.forEach((doc) => batch.delete(doc.ref));

      // Delete main story document
      batch.delete(storyRef);

      await batch.commit();

      // Update user's story count
      const userRef = doc(db, 'users', authorId);
      await updateDoc(userRef, {
        'stats.storiesCount': increment(-1),
      });

      console.log('✅ Story deleted successfully:', storyId);
    } catch (error) {
      console.error('Failed to delete story:', error);
      throw error;
    }
  }

  /**
   * Get story by ID
   */
  async getStory(storyId: string): Promise<Story | null> {
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);

    if (!storySnap.exists()) {
      return null;
    }

    return storySnap.data() as Story;
  }

  /**
   * Get user's active stories (not expired)
   */
  async getUserActiveStories(userId: string): Promise<Story[]> {
    const storiesRef = collection(db, 'stories');
    const now = new Date();

    const q = query(
      storiesRef,
      where('authorId', '==', userId),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'asc'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Story);
  }

  /**
   * Get user's archived stories (expired, for My Activity page)
   */
  async getUserArchivedStories(userId: string): Promise<Story[]> {
    const storiesRef = collection(db, 'stories');
    const now = new Date();

    const q = query(
      storiesRef,
      where('authorId', '==', userId),
      where('expiresAt', '<=', now), // Get expired stories
      orderBy('expiresAt', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(100) // Limit to last 100 archived stories
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Story);
  }

  /**
   * Get specific stories by IDs (for adding to highlights)
   */
  async getStoriesByIds(storyIds: string[]): Promise<Story[]> {
    if (storyIds.length === 0) return [];

    const stories: Story[] = [];
    for (const storyId of storyIds) {
      const storyRef = doc(db, 'stories', storyId);
      const storySnap = await getDoc(storyRef);
      if (storySnap.exists()) {
        stories.push(storySnap.data() as Story);
      }
    }
    return stories;
  }

  /**
   * Get stories visible to a viewer based on audience and privacy settings
   */
  async getStoriesVisibleToUser(
    authorId: string,
    viewerId: string,
    isFollowing: boolean,
    isCloseFriend: boolean,
    authorIsPrivate: boolean
  ): Promise<Story[]> {
    const storiesRef = collection(db, 'stories');
    const now = new Date();

    const q = query(
      storiesRef,
      where('authorId', '==', authorId),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'asc'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const allStories = snapshot.docs.map((doc) => doc.data() as Story);
    
    // Filter stories based on audience, privacy, and hidden users
    return allStories.filter(story => {
      // Check if viewer is in hiddenFrom list
      if (story.hiddenFrom && story.hiddenFrom.includes(viewerId)) {
        return false; // Story is hidden from this user
      }
      
      // Close Friends stories - only close friends can see
      if (story.audience === 'closeFriends') {
        return isCloseFriend;
      }
      
      // Followers stories - followers can see
      if (story.audience === 'followers') {
        return isFollowing;
      }
      
      // Public stories - visibility based on account privacy
      if (story.audience === 'public') {
        if (authorIsPrivate) {
          // Private account: only followers can see public stories
          return isFollowing;
        } else {
          // Public account: anyone can see
          return true;
        }
      }
      
      return false;
    });
  }

  /**
   * Get stories from following users (for stories feed)
   */
  async getStoriesFeed(followingIds: string[]): Promise<Map<string, Story[]>> {
    const storiesMap = new Map<string, Story[]>();
    const now = new Date();

    // Fetch stories for each user (limit to first 10 users for performance)
    const userIdsToFetch = followingIds.slice(0, 10);

    const storyPromises = userIdsToFetch.map(async (userId) => {
      const storiesRef = collection(db, 'stories');
      const q = query(
        storiesRef,
        where('authorId', '==', userId),
        where('expiresAt', '>', now),
        orderBy('expiresAt', 'asc'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const stories = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const storyData = docSnap.data() as Story;
          
          // Enrich with author verified status
          if (storyData.authorVerified === undefined) {
            try {
              const authorRef = doc(db, 'users', storyData.authorId);
              const authorSnap = await getDoc(authorRef);
              if (authorSnap.exists()) {
                storyData.authorVerified = authorSnap.data().verified || false;
              }
            } catch (error) {
              storyData.authorVerified = false;
            }
          }
          
          return storyData;
        })
      );

      if (stories.length > 0) {
        storiesMap.set(userId, stories);
      }
    });

    await Promise.all(storyPromises);
    return storiesMap;
  }

  /**
   * Get stories from users that the current user is following
   */
  async getFollowingStories(userId: string): Promise<Story[]> {
    try {
      // Get the list of users this user is following
      const followingRef = collection(db, `users/${userId}/following`);
      const followingSnapshot = await getDocs(followingRef);
      const followingData = followingSnapshot.docs.map(doc => ({
        userId: doc.id,
        isCloseFriend: doc.data().isCloseFriend || false
      }));

      if (followingData.length === 0) {
        return [];
      }

      // Get current user's privacy settings
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userPrivate = userSnap.exists() ? (userSnap.data().isPrivate || false) : false;

      // Get stories from each followed user with visibility filtering
      const allStoriesPromises = followingData.map(async (followedUser) => {
        return await this.getStoriesVisibleToUser(
          followedUser.userId,
          userId,
          true, // isFollowing = true
          followedUser.isCloseFriend,
          userPrivate
        );
      });

      const storiesArrays = await Promise.all(allStoriesPromises);
      const allStories: Story[] = storiesArrays.flat();

      // Sort by creation date (most recent first)
      return allStories.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error fetching following stories:', error);
      return [];
    }
  }

  // ==========================================
  // STORY VIEWS
  // ==========================================

  /**
   * Mark story as viewed
   */
  async viewStory(storyId: string, viewerId: string): Promise<void> {
    // Check if user already viewed this story
    const viewRef = doc(db, `stories/${storyId}/views/${viewerId}`);
    const viewSnap = await getDoc(viewRef);
    
    // If already viewed, just update timestamp but don't increment count
    if (viewSnap.exists()) {
      await updateDoc(viewRef, {
        viewedAt: serverTimestamp(),
      });
      return;
    }

    // Get story to check if viewer is the author
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);
    
    if (!storySnap.exists()) return;
    
    const isOwner = storySnap.data()?.authorId === viewerId;
    
    // Record the view
    const batch = writeBatch(db);

    batch.set(viewRef, {
      userId: viewerId,
      viewedAt: serverTimestamp(),
      isOwner, // Track if this is owner's view
    });

    // Only increment count if viewer is NOT the owner
    if (!isOwner) {
      batch.update(storyRef, {
        'stats.viewsCount': increment(1),
        viewsCount: increment(1), // Keep for backward compatibility
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  }

  /**
   * Get story views (for story owner) - excludes owner's own view
   * Returns full user objects with username and avatar
   */
  async getStoryViews(storyId: string): Promise<Array<{
    userId: string;
    username: string;
    avatarURL: string;
  }>> {
    const viewsRef = collection(db, `stories/${storyId}/views`);
    const q = query(viewsRef, orderBy('viewedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    // Filter out owner's view and get full user data
    const viewers: Array<{
      userId: string;
      username: string;
      avatarURL: string;
    }> = [];
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data?.isOwner) continue; // Skip owner
      
      viewers.push({
        userId: docSnap.id,
        username: data.username || docSnap.id,
        avatarURL: data.avatarURL || ''
      });
    }
    
    return viewers;
  }

  /**
   * Get story likes (for story owner)
   * Returns full user objects with username and avatar
   */
  async getStoryLikes(storyId: string): Promise<Array<{
    userId: string;
    username: string;
    avatarURL: string;
  }>> {
    const likesRef = collection(db, `stories/${storyId}/likes`);
    const q = query(likesRef, orderBy('likedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      userId: doc.id,
      username: doc.data().username || doc.id,
      avatarURL: doc.data().avatarURL || ''
    }));
  }

  /**
   * Check if user has viewed a story
   */
  async hasViewedStory(storyId: string, userId: string): Promise<boolean> {
    const viewRef = doc(db, `stories/${storyId}/views/${userId}`);
    const viewSnap = await getDoc(viewRef);
    return viewSnap.exists();
  }

  /**
   * Check if user has viewed all stories from an author
   */
  async hasViewedAllStoriesFrom(authorId: string, viewerId: string): Promise<boolean> {
    try {
      const stories = await this.getUserActiveStories(authorId);
      
      if (stories.length === 0) {
        return true; // No stories to view
      }

      // Check if all stories are viewed
      for (const story of stories) {
        const hasViewed = await this.hasViewedStory(story.storyId, viewerId);
        if (!hasViewed) {
          return false; // Found unviewed story
        }
      }

      return true; // All stories viewed
    } catch (error) {
      console.error('Error checking viewed stories:', error);
      return false;
    }
  }

  // ==========================================
  // STORY LIKES
  // ==========================================

  /**
   * Like a story
   */
  async likeStory(storyId: string, userId: string): Promise<void> {
    console.log('🔵 Starting likeStory:', { storyId, userId });
    
    // ✅ CHECK 1: Verify auth state
    const { auth } = await import('../config/firebase');
    const currentUser = auth.currentUser;
    console.log('🔑 Auth Check:', {
      isSignedIn: !!currentUser,
      currentUserId: currentUser?.uid,
      matchesUserId: currentUser?.uid === userId
    });
    
    if (!currentUser) {
      console.error('❌ AUTH ERROR: User not signed in!');
      throw new Error('User must be signed in to like stories');
    }
    
    const storyRef = doc(db, 'stories', storyId);
    
    try {
      // Add like document
      console.log('🔵 Step 1: Creating like document...');
      
      // ✅ CHECK 2: Verify path
      const likeRef = doc(db, `stories/${storyId}/likes/${userId}`);
      console.log('📍 Like path:', likeRef.path);
      
      // ✅ CHECK 3: Verify data structure
      const likeData = {
        userId,
        likedAt: serverTimestamp(),
      };
      console.log('📦 Like data:', likeData);
      
      await setDoc(likeRef, likeData);
      console.log('✅ Step 1: Like document created');
    } catch (error) {
      console.error('❌ Step 1 FAILED - Creating like document:', error);
      console.error('Error details:', {
        code: (error as any)?.code,
        message: (error as any)?.message
      });
      throw error;
    }

    try {
      // Increment likes count in stats
      console.log('🔵 Step 2: Updating story stats...');
      await updateDoc(storyRef, {
        'stats.likesCount': increment(1),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Step 2: Story stats updated');
    } catch (error) {
      console.error('❌ Step 2 FAILED - Updating story stats:', error);
      throw error;
    }

    // Send aggregated notification to story owner
    try {
      console.log('🔵 Step 3: Sending notification...');
      const storySnap = await getDoc(storyRef);
      if (storySnap.exists()) {
        const storyData = storySnap.data() as any;
        
        // Get liker's data
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data() as any;
          const { notificationService } = await import('./notification.service');
          
          await notificationService.notifyStoryLike(
            storyData.authorId,
            userId,
            userData.username,
            userData.avatarURL || '',
            userData.verified || false,
            storyId,
            storyData.mediaURL
          );
          console.log('✅ Step 3: Notification sent');
        }
      }
    } catch (error) {
      console.error('❌ Step 3 FAILED - Sending notification:', error);
      // Don't throw - notification failure shouldn't block the like
    }
  }

  /**
   * Unlike a story
   */
  async unlikeStory(storyId: string, userId: string): Promise<void> {
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);
    
    if (!storySnap.exists()) return;
    
    const currentLikes = storySnap.data()?.stats?.likesCount || 0;
    
    // Only unlike if count > 0
    if (currentLikes > 0) {
      // Remove like document
      const likeRef = doc(db, `stories/${storyId}/likes/${userId}`);
      await deleteDoc(likeRef);

      // Decrement likes count in stats
      await updateDoc(storyRef, {
        'stats.likesCount': increment(-1),
        updatedAt: serverTimestamp(),
      });
    }
  }

  /**
   * Reply to story
   */
  async replyToStory(
    storyId: string,
    replierId: string,
    replierUsername: string,
    replierAvatarURL: string,
    replyText: string
  ): Promise<string> {
    const batch = writeBatch(db);

    // Create reply
    const replyRef = doc(collection(db, `stories/${storyId}/replies`));
    const replyId = replyRef.id;

    batch.set(replyRef, {
      replyId,
      storyId,
      authorId: replierId,
      authorUsername: replierUsername,
      authorAvatarURL: replierAvatarURL,
      text: replyText,
      createdAt: serverTimestamp(),
    });

    // Increment replies count
    const storyRef = doc(db, 'stories', storyId);
    batch.update(storyRef, {
      repliesCount: increment(1),
    });

    await batch.commit();
    return replyId;
  }

  /**
   * Get story replies (for story owner)
   */
  async getStoryReplies(storyId: string): Promise<any[]> {
    const repliesRef = collection(db, `stories/${storyId}/replies`);
    const q = query(repliesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  }

  // ==========================================
  // HIGHLIGHTS
  // ==========================================

  /**
   * Create highlight
   */
  async createHighlight(
    userId: string,
    name: string,
    coverImageURL: string
  ): Promise<string> {
    const highlightRef = doc(collection(db, 'highlights'));
    const highlightId = highlightRef.id;

    await setDoc(highlightRef, {
      highlightId,
      userId,
      name,
      coverImageURL,
      storiesCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Highlight);

    // Update user's highlights count
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'stats.highlightsCount': increment(1),
    });

    return highlightId;
  }

  /**
   * Create highlight with title and initial stories (Enhanced version)
   */
  async createHighlightEnhanced(
    userId: string,
    name: string,
    title: string,
    coverImageURL: string,
    storyIds: string[]
  ): Promise<string> {
    // 🔍 DEBUG: Verify userId is not undefined
    console.log('🔍 userId used in highlight sub-doc:', userId);
    console.log('🔍 typeof userId:', typeof userId);
    
    if (!userId) {
      throw new Error('userId is required to create highlight');
    }
    
    const batch = writeBatch(db);
    
    const highlightRef = doc(collection(db, 'highlights'));
    const highlightId = highlightRef.id;

    // Create highlight
    batch.set(highlightRef, {
      highlightId,
      userId,
      name,
      title: title || name, // Use title or fallback to name
      coverImageURL,
      storiesCount: storyIds.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Highlight);

    // Add stories to highlight
    for (const storyId of storyIds) {
      const storyInHighlightRef = doc(db, `highlights/${highlightId}/stories/${storyId}`);
      batch.set(storyInHighlightRef, {
        storyId,
        userId, // ✅ SECURITY: Store userId for rule validation
        addedAt: serverTimestamp(),
      });
    }

    // Update stories separately (after batch commit)
    // This prevents batch permission errors
    const storyUpdates = storyIds.map(async (storyId) => {
      try {
        const storyRef = doc(db, 'stories', storyId);
        await updateDoc(storyRef, {
          isHighlighted: true,
          highlightId,
        });
      } catch (error) {
        console.warn('Failed to mark story as highlighted:', storyId, error);
        // Don't fail the whole operation if one story update fails
      }
    });

    // Update user's highlights count
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
      'stats.highlightsCount': increment(1),
    });

    // Commit highlight creation first
    await batch.commit();
    
    // Then update stories (non-blocking)
    await Promise.all(storyUpdates);
    
    return highlightId;
  }

  /**
   * Get user's highlights
   */
  async getUserHighlights(userId: string): Promise<Highlight[]> {
    const highlightsRef = collection(db, 'highlights');
    const q = query(
      highlightsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Highlight);
  }

  /**
   * Add story to highlight
   */
  async addStoryToHighlight(highlightId: string, storyId: string, userId: string): Promise<void> {
    const batch = writeBatch(db);

    // Add story to highlight
    const storyInHighlightRef = doc(db, `highlights/${highlightId}/stories/${storyId}`);
    batch.set(storyInHighlightRef, {
      storyId,
      userId, // ✅ SECURITY: Store userId for rule validation
      addedAt: serverTimestamp(),
    });

    // Mark story as highlighted
    const storyRef = doc(db, 'stories', storyId);
    batch.update(storyRef, {
      isHighlighted: true,
      highlightId,
    });

    // Increment stories count in highlight
    const highlightRef = doc(db, 'highlights', highlightId);
    batch.update(highlightRef, {
      storiesCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  }

  /**
   * Get single highlight by ID
   */
  async getHighlight(highlightId: string): Promise<Highlight | null> {
    const highlightRef = doc(db, 'highlights', highlightId);
    const highlightSnap = await getDoc(highlightRef);
    
    if (!highlightSnap.exists()) {
      return null;
    }
    
    return highlightSnap.data() as Highlight;
  }

  /**
   * Get highlight stories with full story data
   */
  async getHighlightStories(highlightId: string): Promise<Story[]> {
    const storiesRef = collection(db, `highlights/${highlightId}/stories`);
    const q = query(storiesRef, orderBy('addedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    // Get full story data for each story ID
    const storyIds = snapshot.docs.map((doc) => doc.id);
    const stories: Story[] = [];
    
    for (const storyId of storyIds) {
      const story = await this.getStory(storyId);
      if (story) {
        stories.push(story);
      }
    }
    
    return stories;
  }

  /**
   * Remove story from highlight
   */
  async removeStoryFromHighlight(highlightId: string, storyId: string, userId: string): Promise<void> {
    const batch = writeBatch(db);

    // Remove story from highlight subcollection
    const storyInHighlightRef = doc(db, `highlights/${highlightId}/stories/${storyId}`);
    batch.delete(storyInHighlightRef);

    // Unmark story as highlighted
    const storyRef = doc(db, 'stories', storyId);
    batch.update(storyRef, {
      isHighlighted: false,
      highlightId: null,
    });

    // Decrement stories count in highlight
    const highlightRef = doc(db, 'highlights', highlightId);
    batch.update(highlightRef, {
      storiesCount: increment(-1),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  }

  /**
   * Delete highlight
   */
  async deleteHighlight(highlightId: string, userId: string): Promise<void> {
    const batch = writeBatch(db);

    // Delete highlight
    const highlightRef = doc(db, 'highlights', highlightId);
    batch.delete(highlightRef);

    // Update user's highlights count
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
      'stats.highlightsCount': increment(-1),
    });

    await batch.commit();
  }

  /**
   * Update highlight
   */
  async updateHighlight(
    highlightId: string,
    updates: { name?: string; coverImageURL?: string }
  ): Promise<void> {
    const highlightRef = doc(db, 'highlights', highlightId);
    await updateDoc(highlightRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Listen to story updates (views, likes, replies) - for real-time notifications
   */
  listenToStoryUpdates(
    storyId: string,
    callback: (updates: {
      newView?: { username: string };
      newLike?: { username: string };
      newReply?: { username: string };
    }) => void
  ): () => void {
    // This is a placeholder - implement with onSnapshot when needed
    return () => {};
  }

  /**
   * Notify users mentioned in a story via chat
   */
  private async notifyMentionedUsers(
    storyId: string,
    authorId: string,
    authorUsername: string,
    authorAvatarURL: string,
    mentionedUsernames: string[],
    storyMediaURL: string
  ): Promise<void> {
    const { messageService } = await import('./message.service');
    
    // Get user IDs for mentioned usernames
    const usersRef = collection(db, 'users');
    
    for (const username of mentionedUsernames) {
      try {
        const q = query(usersRef, where('username', '==', username), limit(1));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) continue;
        
        const mentionedUser = snapshot.docs[0].data();
        const mentionedUserId = mentionedUser.userId;
        
        // Don't notify the author themselves
        if (mentionedUserId === authorId) continue;
        
        // Get or create conversation
        const conversationId = await messageService.getOrCreateDirectConversation(
          authorId,
          mentionedUserId
        );
        
        // Send chat message with story mention
        await messageService.sendMessage(conversationId, {
          senderId: authorId,
          senderUsername: authorUsername,
          senderAvatarURL: authorAvatarURL,
          text: `mentioned you in their story`,
          type: 'text',
        });
      } catch (error) {
        console.error(`Failed to notify @${username}:`, error);
        // Continue with other mentions even if one fails
      }
    }
  }

  /**
   * Repost a story (only if user is mentioned)
   */
  async repostStory(
    originalStoryId: string,
    reposterId: string,
    reposterUsername: string,
    reposterAvatarURL: string
  ): Promise<string> {
    // Get original story
    const originalStory = await this.getStory(originalStoryId);
    if (!originalStory) {
      throw new Error('Original story not found');
    }

    // Check if reposter is mentioned in original story
    if (!originalStory.mentions?.includes(reposterUsername)) {
      throw new Error('You can only repost stories where you are mentioned');
    }

    // Create repost story
    const storyRef = doc(collection(db, 'stories'));
    const storyId = storyRef.id;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const repostData: any = {
      storyId,
      authorId: reposterId,
      authorUsername: reposterUsername,
      authorAvatarURL: reposterAvatarURL,
      mediaURL: originalStory.mediaURL,
      mediaType: originalStory.mediaType,
      duration: originalStory.duration,
      thumbnailURL: originalStory.thumbnailURL,
      audience: 'followers',
      allowReplies: true,
      allowSharing: true,
      viewsCount: 0,
      likesCount: 0,
      repliesCount: 0,
      stats: {
        viewsCount: 0,
        likesCount: 0,
        repliesCount: 0,
        sharesCount: 0,
      },
      // Repost metadata
      isRepost: true,
      repostOf: originalStoryId,
      originalStoryId: originalStoryId,
      originalAuthorId: originalStory.authorId,
      originalAuthorUsername: originalStory.authorUsername,
      originalAuthorVerified: originalStory.authorVerified || false,
      originalMediaURL: originalStory.mediaURL,
      textOverlay: {
        text: `Reposted from @${originalStory.authorUsername}`,
        position: { x: 50, y: 90 },
        fontSize: 14,
        color: '#FFFFFF',
      },
      caption: originalStory.caption,
      backgroundMusic: originalStory.backgroundMusic,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    };

    await setDoc(storyRef, repostData);

    // Update user's story count
    const userRef = doc(db, 'users', reposterId);
    await updateDoc(userRef, {
      'stats.storiesCount': increment(1),
    });

    return storyId;
  }
}

// Export singleton instance
export const storyService = new StoryService();
