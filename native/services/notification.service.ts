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
import { pushService } from './push.service';

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
    refMediaURL?: string,
    extraData?: Record<string, any>
  ): Promise<string> {
    const notificationRef = doc(collection(db, 'notifications'));
    const notificationId = notificationRef.id;

    const notificationData: any = {
      notificationId,
      userId,
      recipientId: userId,
      type,
      actorId,
      actorUsername,
      actorAvatarURL,
      refType,
      refId,
      isRead: false,
      read: false,
      createdAt: serverTimestamp(),
    };

    // Only add optional fields if they have values
    if (refPreview !== undefined && refPreview !== null) {
      notificationData.refPreview = refPreview;
    }
    if (refMediaURL !== undefined && refMediaURL !== null) {
      notificationData.refMediaURL = refMediaURL;
    }
    if (extraData && typeof extraData === 'object') {
      Object.entries(extraData).forEach(([key, value]) => {
        if (value !== undefined) {
          notificationData[key] = value;
        }
      });
    }

    await setDoc(notificationRef, notificationData);

    try {
      void pushService.sendForNotification(notificationData);
    } catch {}

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
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const legacyQ = query(
      notifsRef,
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const [snapshot, legacySnapshot] = await Promise.all([
      getDocs(q),
      getDocs(legacyQ).catch(() => ({ docs: [] as any[] })),
    ]);

    const merged = new Map<string, Notification>();
    [...snapshot.docs, ...legacySnapshot.docs].forEach((docSnap) => {
      const data = docSnap.data() as Notification;
      const id = (data as any).notificationId || docSnap.id;
      merged.set(id, {
        ...data,
        notificationId: id,
        isRead: (data as any).isRead ?? (data as any).read ?? false,
      } as Notification);
    });

    return Array.from(merged.values())
      .filter((n: any) => n.type !== 'dm')
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      })
      .slice(0, limitCount);
  }

  /**
   * Get user's mentions, newest first
   */
  async getMentions(userId: string, limitCount = 50): Promise<Array<{
    mentionId: string;
    postId: string;
    type: 'post' | 'comment' | 'story';
    authorId: string;
    authorUsername: string;
    authorAvatarURL?: string;
    authorVerified?: boolean;
    text: string;
    thumbnailURL?: string;
    createdAt: any;
  }>> {
    const notifsRef = collection(db, 'notifications');
    const q = query(
      notifsRef,
      where('userId', '==', userId),
      where('type', '==', 'mention'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const n: any = docSnap.data();
      return {
        mentionId: n.notificationId || docSnap.id,
        postId: n.refId,
        type: (n.refType || 'post') as 'post' | 'comment' | 'story',
        authorId: n.actorId,
        authorUsername: n.actorUsername,
        authorAvatarURL: n.actorAvatarURL,
        authorVerified: n.actorVerified,
        text: n.refPreview || n.message || '',
        thumbnailURL: n.refMediaURL,
        createdAt: n.createdAt,
      };
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, {
      isRead: true,
      read: true,
      readAt: serverTimestamp(),
    });
  }

  /**
   * Mark notifications as delivered
   */
  async markNotificationsAsDelivered(userId: string): Promise<void> {
    const notifsRef = collection(db, 'notifications');
    const q = query(
      notifsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const legacyQ = query(
      notifsRef,
      where('recipientId', '==', userId),
      where('read', '==', false)
    );

    const [snapshot, legacySnapshot] = await Promise.all([
      getDocs(q),
      getDocs(legacyQ).catch(() => ({ docs: [] as any[] })),
    ]);
    const batch = writeBatch(db);

    const seen = new Set<string>();
    [...snapshot.docs, ...legacySnapshot.docs].forEach((docSnap) => {
      if (seen.has(docSnap.id)) return;
      seen.add(docSnap.id);
      batch.update(docSnap.ref, {
        deliveredAt: serverTimestamp(),
      });
    });

    if (seen.size > 0) {
      await batch.commit();
    }
  }
  async markNotificationsAsDeliveredByIds(notificationIds: string[]): Promise<void> {
    const uniqueIds = Array.from(new Set(notificationIds.filter(Boolean)));
    if (uniqueIds.length === 0) return;

    const batch = writeBatch(db);
    uniqueIds.forEach((notificationId) => {
      batch.update(doc(db, 'notifications', notificationId), {
        deliveredAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }

  async markManyAsRead(notificationIds: string[]): Promise<void> {
    const uniqueIds = Array.from(new Set(notificationIds.filter(Boolean)));
    if (uniqueIds.length === 0) return;

    const batch = writeBatch(db);
    uniqueIds.forEach((notificationId) => {
      batch.update(doc(db, 'notifications', notificationId), {
        isRead: true,
        read: true,
        readAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }
  /**
   * Get unread notifications count (excludes messages)
   */
  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getUserNotifications(userId, 200);
    return notifications.filter((n: any) => !n.isRead && n.type !== 'dm').length;
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

    const legacyQ = query(
      notifsRef,
      where('recipientId', '==', userId),
      where('read', '==', false)
    );

    const [snapshot, legacySnapshot] = await Promise.all([
      getDocs(q),
      getDocs(legacyQ).catch(() => ({ docs: [] as any[] })),
    ]);
    const batch = writeBatch(db);

    const seen = new Set<string>();
    [...snapshot.docs, ...legacySnapshot.docs].forEach((docSnap) => {
      if (seen.has(docSnap.id)) return;
      seen.add(docSnap.id);
      batch.update(docSnap.ref, {
        isRead: true,
        read: true,
        readAt: serverTimestamp(),
      });
    });

    if (seen.size > 0) {
      await batch.commit();
    }
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
    postMediaURL?: string,
    extraData?: Record<string, any>
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
      postMediaURL,
      extraData
    );
  }

  /**
   * Create glimpse like notification
   */
  async notifyGlimpseLike(
    ownerId: string,
    likerId: string,
    likerUsername: string,
    likerAvatarURL: string,
    glimpseId: string,
    coverImageURL?: string
  ): Promise<void> {
    if (ownerId === likerId) return;

    await this.createNotification(
      ownerId,
      'like',
      likerId,
      likerUsername,
      likerAvatarURL,
      'glimpse',
      glimpseId,
      undefined,
      coverImageURL
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
    postMediaURL?: string,
    extraData?: Record<string, any>
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
      postMediaURL,
      extraData
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
    refType: 'post' | 'comment' | 'story' | 'message',
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
   * Create a story like notification (privacy-safe, one event per like)
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
    if (storyOwnerId === likerId) return;

    try {
      const notificationRef = doc(collection(db, 'notifications'));
      const notificationId = notificationRef.id;

      const notificationData: any = {
        notificationId,
        userId: storyOwnerId,
        recipientId: storyOwnerId,
        type: 'story_like',
        actorId: likerId,
        actorUsername: likerUsername,
        actorAvatarURL: likerAvatarURL,
        actorVerified: likerVerified,
        refType: 'story',
        refId: storyId,
        storyId,
        totalLikesCount: 1,
        isRead: false,
        read: false,
        createdAt: serverTimestamp(),
      };

      if (storyMediaURL) {
        notificationData.refMediaURL = storyMediaURL;
      }

      await setDoc(notificationRef, notificationData);

      try {
        void pushService.sendForNotification(notificationData);
      } catch {}
    } catch (error) {
      console.error('Failed to create story like notification:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();






