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
  startAfter,
  increment,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { supabase } from '../config/supabase';
import type { Story } from '../types/database';

export class GlimpseService {
  /**
   * Upload media to Supabase Storage
   */
  async uploadMedia(
    userId: string,
    file: File,
    type: 'image' | 'video'
  ): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = fileName; // Direct path in glimpses bucket

    // Upload to Supabase Storage (glimpses bucket)
    const { data, error } = await supabase.storage
      .from('glimpses')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload media: ${error.message}`);
    }

    // Get public URL (works because of public SELECT policy)
    const { data: urlData } = supabase.storage
      .from('glimpses')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded media');
    }

    return urlData.publicUrl;
  }

  /**
   * Create a glimpse (permanent short video/image)
   */
  async createGlimpse(
    authorId: string,
    authorUsername: string,
    authorAvatarURL: string,
    authorVerified: boolean,
    mediaFile: File,
    mediaType: 'image' | 'video',
    duration: number,
    caption?: string,
    mentions?: string[],
    tags?: string[],
    taggedUsers?: Array<{ userId: string; username: string }>,
    collaborators?: Array<{ userId: string; username: string }>,
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
    coverImageBlob?: Blob,
    taggedPeople?: string[],
    settings?: {
      allowComments?: boolean;
      allowDownload?: boolean;
      hideLikes?: boolean;
      showCaptions?: boolean;
    }
  ): Promise<string> {
    // Upload media to Supabase
    const mediaURL = await this.uploadMedia(authorId, mediaFile, mediaType);
    
    // Upload cover image if provided (for both images and videos)
    let coverImageURL: string | undefined;
    if (coverImageBlob) {
      const coverImageFile = new File([coverImageBlob], `cover-${Date.now()}.jpg`, { type: 'image/jpeg' });
      coverImageURL = await this.uploadMedia(authorId, coverImageFile, 'image');
      console.log('✅ Cover image uploaded:', coverImageURL);
    } else {
      console.warn('⚠️ No cover image provided for glimpse');
    }

    const glimpseRef = doc(collection(db, 'glimpses'));
    const glimpseId = glimpseRef.id;

    // Format collaborators with pending status and fetch their details
    let formattedCollaborators: any[] = [];
    if (collaborators && collaborators.length > 0) {
      const collabDetailsPromises = collaborators.map(async (collab) => {
        const userRef = doc(db, 'users', collab.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          return {
            userId: collab.userId,
            username: collab.username,
            avatarURL: userData.avatarURL || '',
            status: 'pending' as const,
            addedAt: Timestamp.now(), // Use Timestamp.now() instead of serverTimestamp()
          };
        }
        return null;
      });
      const collabDetails = await Promise.all(collabDetailsPromises);
      formattedCollaborators = collabDetails.filter(c => c !== null);
    }

    const glimpseData: any = {
      storyId: glimpseId, // Keep same field name for compatibility
      glimpseId,
      authorId,
      authorUsername,
      authorAvatarURL,
      authorVerified,
      mediaURL,
      mediaType,
      duration,
      audience: 'public', // Glimpses are always public
      allowReplies: true,
      allowSharing: true,
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
      mentions: mentions || [],
      tags: tags || [],
      taggedUsers: taggedUsers || [],
      taggedPeople: taggedPeople || [],
      collaborators: formattedCollaborators,
      settings: settings || {
        allowComments: true,
        allowDownload: false,
        hideLikes: false,
        showCaptions: true
      },
      createdAt: serverTimestamp(),
      isHighlighted: false,
      isGlimpse: true, // Flag to differentiate from stories
    };

    // Only add optional fields if they have values
    if (backgroundMusic) glimpseData.backgroundMusic = backgroundMusic;
    if (coverImageURL) glimpseData.coverImageURL = coverImageURL;

    await setDoc(glimpseRef, glimpseData);

    // Update user's glimpse count
    const userRef = doc(db, 'users', authorId);
    await updateDoc(userRef, {
      'stats.glimpsesCount': increment(1),
    });

    // Send DM and notification to each collaborator
    if (formattedCollaborators.length > 0) {
      for (const collab of formattedCollaborators) {
        await this.sendCollaborationDM(
          glimpseId,
          authorId,
          authorUsername,
          authorAvatarURL,
          collab.userId,
          mediaURL,
          caption || ''
        );
      }
    }

    return glimpseId;
  }

  /**
   * Get glimpse by ID
   */
  async getGlimpse(glimpseId: string): Promise<Story | null> {
    const glimpseRef = doc(db, 'glimpses', glimpseId);
    const glimpseSnap = await getDoc(glimpseRef);

    if (!glimpseSnap.exists()) {
      return null;
    }

    return glimpseSnap.data() as Story;
  }

  /**
   * Get user's glimpses
   */
  async getUserGlimpses(userId: string, limitCount: number = 20): Promise<Story[]> {
    const glimpsesRef = collection(db, 'glimpses');
    const q = query(
      glimpsesRef,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Story);
  }

  /**
   * Get glimpses where user is tagged
   */
  async getGlimpsesByTaggedUser(userId: string): Promise<Story[]> {
    const glimpsesRef = collection(db, 'glimpses');
    const q = query(
      glimpsesRef,
      where('taggedPeople', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...(doc.data() as Story),
      glimpseId: doc.id,
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    }));
  }

  /**
   * Get glimpses from following users
   */
  async getFollowingGlimpses(
    followingIds: string[],
    currentUserId: string,
    limitCount = 20
  ): Promise<Story[]> {
    // Filter out current user from following list
    const followingOnly = followingIds.filter(id => id !== currentUserId);
    
    if (followingOnly.length === 0) {
      return [];
    }

    // Firestore 'in' operator supports max 10 values
    const chunk = followingOnly.slice(0, 10);

    const glimpsesRef = collection(db, 'glimpses');
    const q = query(
      glimpsesRef,
      where('authorId', 'in', chunk),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Story);
  }

  /**
   * Get explore glimpses (popular/trending)
   */
  async getExploreGlimpses(limitCount: number = 20): Promise<Story[]> {
    const glimpsesRef = collection(db, 'glimpses');
    const q = query(
      glimpsesRef,
      where('audience', '==', 'public'),
      orderBy('stats.likesCount', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...(doc.data() as Story),
      storyId: doc.id,
      glimpseId: doc.id,
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    }));
  }

  /**
   * Get all glimpses (feed)
   */
  async getAllGlimpses(limitCount: number = 20, lastDoc?: DocumentSnapshot): Promise<{
    glimpses: Story[];
    lastDoc: DocumentSnapshot | null;
  }> {
    const glimpsesRef = collection(db, 'glimpses');
    let q = query(
      glimpsesRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const glimpses = snapshot.docs.map((doc) => doc.data() as Story);
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

    return { glimpses, lastDoc: lastVisible };
  }

  /**
   * Like a glimpse
   */
  async likeGlimpse(glimpseId: string, userId: string): Promise<void> {
    const likeRef = doc(db, `glimpses/${glimpseId}/likes`, userId);
    const glimpseRef = doc(db, 'glimpses', glimpseId);
    
    // Check if user already liked to prevent duplicates
    const existingLike = await getDoc(likeRef);
    if (existingLike.exists()) {
      console.log('⚠️ User already liked this glimpse');
      return; // Already liked, don't add again
    }
    
    await setDoc(likeRef, {
      userId,
      likedAt: serverTimestamp(),
    });
    
    await updateDoc(glimpseRef, {
      'stats.likesCount': increment(1),
      likesCount: increment(1),
    });
  }

  /**
   * Unlike a glimpse
   */
  async unlikeGlimpse(glimpseId: string, userId: string): Promise<void> {
    const likeRef = doc(db, `glimpses/${glimpseId}/likes`, userId);
    const glimpseRef = doc(db, 'glimpses', glimpseId);
    
    // Check if already at 0 before decrementing
    const glimpseSnap = await getDoc(glimpseRef);
    if (glimpseSnap.exists()) {
      const currentCount = glimpseSnap.data()?.stats?.likesCount || 0;
      if (currentCount > 0) {
        await deleteDoc(likeRef);
        await updateDoc(glimpseRef, {
          'stats.likesCount': increment(-1),
          likesCount: increment(-1),
        });
      }
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(glimpseId: string, viewerId: string): Promise<void> {
    // Check if user already viewed this glimpse
    const viewRef = doc(db, `glimpses/${glimpseId}/views`, viewerId);
    const viewSnap = await getDoc(viewRef);
    
    // If already viewed, just update timestamp but don't increment count
    if (viewSnap.exists()) {
      await updateDoc(viewRef, {
        viewedAt: serverTimestamp(),
      });
      return;
    }

    // First time view - add view and increment count
    const glimpseRef = doc(db, 'glimpses', glimpseId);
    await updateDoc(glimpseRef, {
      viewsCount: increment(1),
      'stats.viewsCount': increment(1),
    });

    await setDoc(viewRef, {
      viewerId,
      viewedAt: serverTimestamp(),
    });
  }

  /**
   * Check if user has liked a glimpse
   */
  async checkUserLiked(glimpseId: string, userId: string): Promise<boolean> {
    const likeRef = doc(db, `glimpses/${glimpseId}/likes`, userId);
    const likeDoc = await getDoc(likeRef);
    return likeDoc.exists();
  }

  /**
   * Get list of glimpse IDs that user has liked from given array
   */
  async getUserLikedGlimpses(userId: string, glimpseIds: string[]): Promise<string[]> {
    if (!glimpseIds.length) return [];
    
    const likedGlimpseIds: string[] = [];
    
    // Check in batches of 10 (Firestore limit)
    for (let i = 0; i < glimpseIds.length; i += 10) {
      const batch = glimpseIds.slice(i, i + 10);
      const checks = await Promise.all(
        batch.map(async (glimpseId) => {
          const isLiked = await this.checkUserLiked(glimpseId, userId);
          return isLiked ? glimpseId : null;
        })
      );
      likedGlimpseIds.push(...checks.filter((id): id is string => id !== null));
    }
    
    return likedGlimpseIds;
  }

  /**
   * Update a glimpse
   */
  async updateGlimpse(glimpseId: string, updates: Partial<any>): Promise<void> {
    const glimpseRef = doc(db, 'glimpses', glimpseId);
    await updateDoc(glimpseRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Send collaboration DM with glimpse preview and buttons
   */
  async sendCollaborationDM(
    glimpseId: string,
    fromUserId: string,
    fromUsername: string,
    fromAvatarURL: string,
    toUserId: string,
    glimpseMediaURL: string,
    glimpseCaption: string
  ): Promise<void> {
    const { messageService } = await import('./message.service');
    
    // Create or get conversation
    const conversationId = [fromUserId, toUserId].sort().join('_');
    const conversationRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(conversationRef);
    
    // IMPORTANT: Create conversation FIRST before adding messages
    if (!convSnap.exists()) {
      await setDoc(conversationRef, {
        conversationId,
        type: 'direct',
        participantIds: [fromUserId, toUserId],
        participantCount: 2,
        lastMessage: {
          text: 'Collaboration request',
          senderId: fromUserId,
          timestamp: serverTimestamp(),
        },
        unreadCounts: { [toUserId]: 1, [fromUserId]: 0 },
        mutedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      });
    }
    
    // Now send the collaboration request message
    const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
    await setDoc(messageRef, {
      messageId: messageRef.id,
      senderId: fromUserId,
      senderUsername: fromUsername,
      senderAvatarURL: fromAvatarURL,
      type: 'glimpse_collab_request',
      text: 'wants to collaborate with you on a glimpse',
      glimpseId,
      glimpseMediaURL,
      glimpseCaption,
      status: 'pending',
      createdAt: serverTimestamp(),
      isRead: false,
    });
    
    // Update conversation with new message
    if (convSnap.exists()) {
      await updateDoc(conversationRef, {
        lastMessage: {
          text: 'Collaboration request',
          senderId: fromUserId,
          timestamp: serverTimestamp(),
        },
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    
    // Also send notification
    const notificationRef = doc(collection(db, 'notifications'));
    await setDoc(notificationRef, {
      notificationId: notificationRef.id,
      userId: toUserId,
      type: 'collaboration_request',
      actorId: fromUserId,
      actorUsername: fromUsername,
      actorAvatarURL: fromAvatarURL,
      glimpseId,
      glimpseCoverURL: glimpseMediaURL,
      message: 'wants to collaborate with you on a glimpse',
      isRead: false,
      createdAt: serverTimestamp(),
    });
    
    console.log('✅ Collaboration DM sent:', { from: fromUsername, to: toUserId, glimpseId });
  }

  /**
   * Request collaboration on a glimpse
   */
  async requestCollaboration(
    glimpseId: string,
    fromUserId: string,
    fromUsername: string,
    fromAvatarURL: string,
    toUserId: string,
    glimpseCoverURL: string,
    glimpseCaption?: string
  ): Promise<void> {
    const requestRef = doc(collection(db, 'collaborationRequests'));
    const requestId = requestRef.id;

    await setDoc(requestRef, {
      requestId,
      type: 'glimpse_collaboration',
      glimpseId,
      fromUserId,
      fromUsername,
      fromAvatarURL,
      toUserId,
      glimpseCoverURL,
      glimpseCaption,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    // Create notification for recipient
    const notificationRef = doc(collection(db, 'notifications'));
    await setDoc(notificationRef, {
      notificationId: notificationRef.id,
      userId: toUserId,
      type: 'collaboration_request',
      actorId: fromUserId,
      actorUsername: fromUsername,
      actorAvatarURL: fromAvatarURL,
      glimpseId,
      glimpseCoverURL,
      requestId,
      message: `wants to collaborate on a glimpse`,
      isRead: false,
      createdAt: serverTimestamp(),
    });
    
    console.log('✅ Collaboration notification created:', {
      to: toUserId,
      from: fromUsername,
      glimpseId,
      notificationId: notificationRef.id
    });
  }

  /**
   * Accept collaboration request
   */
  async acceptCollaboration(requestId: string, glimpseId: string, userId: string): Promise<void> {
    // Update request status
    const requestRef = doc(db, 'collaborationRequests', requestId);
    await updateDoc(requestRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
    });

    // Get glimpse to update collaborators
    const glimpseRef = doc(db, 'glimpses', glimpseId);
    const glimpseSnap = await getDoc(glimpseRef);
    
    if (glimpseSnap.exists()) {
      const glimpseData = glimpseSnap.data();
      const currentCollaborators = glimpseData.collaborators || [];
      
      // Update collaborator status from pending to accepted
      const updatedCollaborators = currentCollaborators.map((collab: any) => {
        if (collab.userId === userId && collab.status === 'pending') {
          return {
            ...collab,
            status: 'accepted',
            acceptedAt: Timestamp.now(), // Use Timestamp.now() instead of serverTimestamp()
          };
        }
        return collab;
      });
      
      await updateDoc(glimpseRef, {
        collaborators: updatedCollaborators,
      });
      
      // Update DM message status
      const conversationId = [glimpseData.authorId, userId].sort().join('_');
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const messagesQuery = query(
        messagesRef,
        where('glimpseId', '==', glimpseId),
        where('type', '==', 'glimpse_collab_request')
      );
      const messagesSnap = await getDocs(messagesQuery);
      
      for (const msgDoc of messagesSnap.docs) {
        await updateDoc(msgDoc.ref, {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
        });
      }
      
      console.log('✅ Collaboration accepted:', { glimpseId, userId });
    }
  }

  /**
   * Reject collaboration request
   */
  async rejectCollaboration(requestId: string, glimpseId: string, userId: string): Promise<void> {
    const requestRef = doc(db, 'collaborationRequests', requestId);
    await updateDoc(requestRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
    });
    
    // Remove from glimpse collaborators if pending
    const glimpseRef = doc(db, 'glimpses', glimpseId);
    const glimpseSnap = await getDoc(glimpseRef);
    
    if (glimpseSnap.exists()) {
      const glimpseData = glimpseSnap.data();
      const currentCollaborators = glimpseData.collaborators || [];
      
      // Remove the pending collaborator
      const updatedCollaborators = currentCollaborators.filter(
        (collab: any) => !(collab.userId === userId && collab.status === 'pending')
      );
      
      await updateDoc(glimpseRef, {
        collaborators: updatedCollaborators,
      });
      
      // Update DM message status
      const conversationId = [glimpseData.authorId, userId].sort().join('_');
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const messagesQuery = query(
        messagesRef,
        where('glimpseId', '==', glimpseId),
        where('type', '==', 'glimpse_collab_request')
      );
      const messagesSnap = await getDocs(messagesQuery);
      
      for (const msgDoc of messagesSnap.docs) {
        await updateDoc(msgDoc.ref, {
          status: 'rejected',
          rejectedAt: serverTimestamp(),
        });
      }
      
      console.log('✅ Collaboration rejected:', { glimpseId, userId });
    }
  }

  /**
   * Get user's collaborated glimpses
   */
  async getCollaboratedGlimpses(userId: string, limitCount: number = 20): Promise<Story[]> {
    const glimpsesRef = collection(db, 'glimpses');
    const q = query(
      glimpsesRef,
      where('collaborators', 'array-contains', { userId }),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Story);
  }

  /**
   * Delete a glimpse
   */
  async deleteGlimpse(glimpseId: string, authorId: string): Promise<void> {
    const glimpseRef = doc(db, 'glimpses', glimpseId);
    const glimpse = await getDoc(glimpseRef);

    if (!glimpse.exists()) {
      throw new Error('Glimpse not found');
    }

    const glimpseData = glimpse.data();
    if (glimpseData.authorId !== authorId) {
      throw new Error('Unauthorized to delete this glimpse');
    }

    // Delete media from Supabase Storage (uses DELETE policy)
    if (glimpseData.mediaURL) {
      try {
        // Extract file path from public URL
        const urlParts = glimpseData.mediaURL.split('/storage/v1/object/public/glimpses/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          const { error } = await supabase.storage.from('glimpses').remove([filePath]);
          
          if (error) {
            console.error('Failed to delete media from Supabase:', error);
            // Continue with Firestore deletion even if storage deletion fails
          }
        }
      } catch (error) {
        console.error('Error deleting media:', error);
        // Continue with Firestore deletion
      }
    }

    // Permanently delete glimpse document from Firestore
    await deleteDoc(glimpseRef);

    // Update user's glimpse count
    const userRef = doc(db, 'users', authorId);
    await updateDoc(userRef, {
      'stats.glimpsesCount': increment(-1),
    });
  }
}

export const glimpseService = new GlimpseService();
