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
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Notification, NotificationType } from '../types/database';

export class NotificationService {
  // ==========================================
  // NOTIFICATION OPERATIONS
  // ==========================================

  /**
   * Create a notification
   */
  async createNotification(
    userId: string,
    type: string,
    actorId: string,
    actorUsername: string,
    actorAvatarURL: string,
    refType: string,
    refId: string,
    refPreview?: string,
    refMediaURL?: string
  ): Promise<string> {
    const notificationRef = doc(collection(db, 'notifications'));
    const notificationId = notificationRef.id;

    const notificationData: any = {
      notificationId,
      userId,
      type,
      actorId,
      actorUsername,
      actorAvatarURL,
      refType,
      refId,
      isRead: false,
      createdAt: serverTimestamp(),
    };

    // Only add optional fields if they have values
    if (refPreview !== undefined && refPreview !== null) {
      notificationData.refPreview = refPreview;
    }
    if (refMediaURL !== undefined && refMediaURL !== null) {
      notificationData.refMediaURL = refMediaURL;
    }

    await setDoc(notificationRef, notificationData);

    return notificationId;
  }

  /**
   * Get user's notifications (paginated)
   * Excludes 'dm' type notifications (shown in Messages page)
   */
  async getUserNotifications(
    userId: string,
    limitCount = 50
  ): Promise<Notification[]> {
    const notifsRef = collection(db, 'notifications');
    const q = query(
      notifsRef,
      where('userId', '==', userId),
      where('type', '!=', 'dm'),
      orderBy('type'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Notification);
  }

  /**
   * Get unread notifications count (excludes messages)
   */
  async getUnreadCount(userId: string): Promise<number> {
    const notifsRef = collection(db, 'notifications');
    const q = query(
      notifsRef,
      where('userId', '==', userId),
      where('isRead', '==', false),
      where('type', '!=', 'dm')
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, {
      isRead: true,
      readAt: serverTimestamp(),
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const notifsRef = collection(db, 'notifications');
    const q = query(
      notifsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        isRead: true,
        readAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const notifRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notifRef);
  }

  /**
   * Delete all user notifications
   */
  async deleteAllNotifications(userId: string): Promise<void> {
    const notifsRef = collection(db, 'notifications');
    const q = query(notifsRef, where('userId', '==', userId));

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
  }

  // ==========================================
  // NOTIFICATION HELPERS
  // ==========================================

  /**
   * Create like notification
   */
  async notifyLike(
    postOwnerId: string,
    likerId: string,
    likerUsername: string,
    likerAvatarURL: string,
    postId: string,
    postMediaURL?: string
  ): Promise<void> {
    // Don't notify if user liked their own post
    if (postOwnerId === likerId) return;

    await this.createNotification(
      postOwnerId,
      'like',
      likerId,
      likerUsername,
      likerAvatarURL,
      'post',
      postId,
      undefined,
      postMediaURL
    );
  }

  /**
   * Create comment notification
   */
  async notifyComment(
    postOwnerId: string,
    commenterId: string,
    commenterUsername: string,
    commenterAvatarURL: string,
    postId: string,
    commentText: string,
    postMediaURL?: string
  ): Promise<void> {
    // Don't notify if user commented on their own post
    if (postOwnerId === commenterId) return;

    await this.createNotification(
      postOwnerId,
      'comment',
      commenterId,
      commenterUsername,
      commenterAvatarURL,
      'post',
      postId,
      commentText,
      postMediaURL
    );
  }

  /**
   * Create follow notification
   */
  async notifyFollow(
    followedUserId: string,
    followerId: string,
    followerUsername: string,
    followerAvatarURL: string
  ): Promise<void> {
    await this.createNotification(
      followedUserId,
      'follow',
      followerId,
      followerUsername,
      followerAvatarURL,
      'post', // dummy refType
      followerId, // use followerId as refId
      undefined,
      undefined
    );
  }

  /**
   * Create mention notification
   */
  async notifyMention(
    mentionedUserId: string,
    mentionerId: string,
    mentionerUsername: string,
    mentionerAvatarURL: string,
    refType: 'post' | 'comment' | 'story',
    refId: string,
    refPreview?: string,
    refMediaURL?: string
  ): Promise<void> {
    await this.createNotification(
      mentionedUserId,
      'mention',
      mentionerId,
      mentionerUsername,
      mentionerAvatarURL,
      refType,
      refId,
      refPreview,
      refMediaURL
    );
  }

  /**
   * Create DM notification
   */
  async notifyDM(
    recipientId: string,
    senderId: string,
    senderUsername: string,
    senderAvatarURL: string,
    conversationId: string,
    messagePreview: string
  ): Promise<void> {
    await this.createNotification(
      recipientId,
      'dm',
      senderId,
      senderUsername,
      senderAvatarURL,
      'message',
      conversationId,
      messagePreview,
      undefined
    );
  }

  /**
   * Create story view notification
   */
  async notifyStoryView(
    storyOwnerId: string,
    viewerId: string,
    viewerUsername: string,
    viewerAvatarURL: string,
    storyId: string,
    storyMediaURL?: string
  ): Promise<void> {
    await this.createNotification(
      storyOwnerId,
      'story_view',
      viewerId,
      viewerUsername,
      viewerAvatarURL,
      'story',
      storyId,
      undefined,
      storyMediaURL
    );
  }

  /**
   * Create story reply notification
   */
  async notifyStoryReply(
    storyOwnerId: string,
    replierId: string,
    replierUsername: string,
    replierAvatarURL: string,
    storyId: string,
    replyText: string,
    storyMediaURL?: string
  ): Promise<void> {
    await this.createNotification(
      storyOwnerId,
      'story_reply',
      replierId,
      replierUsername,
      replierAvatarURL,
      'story',
      storyId,
      replyText,
      storyMediaURL
    );
  }

  /**
   * Create or update aggregated story like notification
   * This groups all likes on a story into one notification with latest 3 likers
   */
  async notifyStoryLike(
    storyOwnerId: string,
    likerId: string,
    likerUsername: string,
    likerAvatarURL: string,
    likerVerified: boolean,
    storyId: string,
    storyMediaURL?: string
  ): Promise<void> {
    // Don't notify if user liked their own story
    if (storyOwnerId === likerId) return;

    try {
      // Find existing story_like notification for this story
      const notifsRef = collection(db, 'notifications');
      const q = query(
        notifsRef,
        where('userId', '==', storyOwnerId),
        where('type', '==', 'story_like'),
        where('storyId', '==', storyId),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Create new aggregated notification
        const notificationRef = doc(collection(db, 'notifications'));
        const notificationId = notificationRef.id;

        await setDoc(notificationRef, {
          notificationId,
          userId: storyOwnerId,
          type: 'story_like',
          actorId: likerId, // Most recent liker
          actorUsername: likerUsername,
          actorAvatarURL: likerAvatarURL,
          actorVerified: likerVerified,
          refType: 'story',
          refId: storyId,
          storyId,
          refMediaURL: storyMediaURL,
          likersData: [
            {
              userId: likerId,
              username: likerUsername,
              avatarURL: likerAvatarURL,
              verified: likerVerified,
              likedAt: Timestamp.fromDate(new Date()),
            },
          ],
          totalLikesCount: 1,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      } else {
        // Update existing notification
        const existingNotif = snapshot.docs[0];
        const existingData = existingNotif.data();
        const currentLikers = existingData.likersData || [];

        // Check if this user already liked (don't duplicate)
        const alreadyLiked = currentLikers.some(
          (liker: any) => liker.userId === likerId
        );

        if (!alreadyLiked) {
          // Add new liker to the beginning of the array
          const updatedLikers = [
            {
              userId: likerId,
              username: likerUsername,
              avatarURL: likerAvatarURL,
              verified: likerVerified,
              likedAt: Timestamp.fromDate(new Date()),
            },
            ...currentLikers,
          ].slice(0, 3); // Keep only latest 3

          // Update notification with new data
          await updateDoc(existingNotif.ref, {
            actorId: likerId, // Most recent liker
            actorUsername: likerUsername,
            actorAvatarURL: likerAvatarURL,
            actorVerified: likerVerified,
            likersData: updatedLikers,
            totalLikesCount: (existingData.totalLikesCount || 1) + 1,
            isRead: false, // Mark as unread again
            createdAt: serverTimestamp(), // Update timestamp to move to top
          });
        }
      }
    } catch (error) {
      console.error('Failed to create/update story like notification:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
