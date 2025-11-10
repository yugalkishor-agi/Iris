import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  QuerySnapshot,
  DocumentChange,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Message, Notification, Story } from '../types/database';

/**
 * Real-time listener service for live updates
 * Handles messages, notifications, and stories
 */

export class RealtimeService {
  private activeListeners = new Map<string, Unsubscribe>();

  // ==========================================
  // MESSAGE LISTENERS
  // ==========================================

  /**
   * Listen to new messages in a conversation
   */
  listenToMessages(
    conversationId: string,
    onNewMessage: (message: Message) => void,
    onError?: (error: Error) => void
  ): string {
    const listenerId = `messages:${conversationId}`;

    // Get timestamp for filtering new messages
    const now = new Date();

    const messagesRef = collection(db, `conversations/${conversationId}/messages`);
    const q = query(
      messagesRef,
      where('createdAt', '>', now),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        snapshot.docChanges().forEach((change: DocumentChange) => {
          if (change.type === 'added') {
            onNewMessage(change.doc.data() as Message);
          }
        });
      },
      (error) => {
        console.error('Message listener error:', error);
        if (onError) onError(error);
      }
    );

    this.activeListeners.set(listenerId, unsubscribe);
    return listenerId;
  }

  /**
   * Listen to all messages in conversation (for initial load + updates)
   */
  listenToAllMessages(
    conversationId: string,
    onMessages: (messages: Message[]) => void,
    limitCount = 50
  ): string {
    const listenerId = `all-messages:${conversationId}`;

    const messagesRef = collection(db, `conversations/${conversationId}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'desc'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
      const messages = snapshot.docs.map((doc) => doc.data() as Message);
      onMessages(messages);
    });

    this.activeListeners.set(listenerId, unsubscribe);
    return listenerId;
  }

  // ==========================================
  // NOTIFICATION LISTENERS
  // ==========================================

  /**
   * Listen to new notifications
   */
  listenToNotifications(
    userId: string,
    onNewNotification: (notification: Notification) => void,
    onError?: (error: Error) => void
  ): string {
    const listenerId = `notifications:${userId}`;
    const now = new Date();

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('createdAt', '>', now),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        snapshot.docChanges().forEach((change: DocumentChange) => {
          if (change.type === 'added') {
            const notification = change.doc.data() as Notification;
            onNewNotification(notification);

            // Play notification sound or show badge
            this.playNotificationSound();
          }
        });
      },
      (error) => {
        console.error('Notification listener error:', error);
        if (onError) onError(error);
      }
    );

    this.activeListeners.set(listenerId, unsubscribe);
    return listenerId;
  }

  /**
   * Listen to unread notification count
   */
  listenToUnreadCount(
    userId: string,
    onCountChange: (count: number) => void
  ): string {
    const listenerId = `unread-count:${userId}`;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
      onCountChange(snapshot.size);
    });

    this.activeListeners.set(listenerId, unsubscribe);
    return listenerId;
  }

  // ==========================================
  // STORY LISTENERS
  // ==========================================

  /**
   * Listen to user's active stories
   */
  listenToUserStories(
    userId: string,
    onStoriesUpdate: (stories: Story[]) => void
  ): string {
    const listenerId = `stories:${userId}`;
    const now = new Date();

    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where('authorId', '==', userId),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'asc'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
      const stories = snapshot.docs.map((doc) => doc.data() as Story);
      onStoriesUpdate(stories);
    });

    this.activeListeners.set(listenerId, unsubscribe);
    return listenerId;
  }

  // ==========================================
  // TYPING INDICATORS
  // ==========================================

  /**
   * Listen to typing indicators in conversation
   */
  listenToTyping(
    conversationId: string,
    onTypingChange: (userIds: string[]) => void
  ): string {
    const listenerId = `typing:${conversationId}`;

    // This would use a separate "typing" collection or real-time database
    // For now, returning placeholder
    // In production, implement with Firebase Realtime Database for better performance

    this.activeListeners.set(listenerId, () => {});
    return listenerId;
  }

  // ==========================================
  // ONLINE STATUS
  // ==========================================

  /**
   * Listen to user's online status
   */
  listenToOnlineStatus(
    userId: string,
    onStatusChange: (isOnline: boolean) => void
  ): string {
    const listenerId = `online:${userId}`;

    const userRef = collection(db, 'users');
    const q = query(userRef, where('userId', '==', userId));

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        onStatusChange(userData.isOnline || false);
      }
    });

    this.activeListeners.set(listenerId, unsubscribe);
    return listenerId;
  }

  // ==========================================
  // LISTENER MANAGEMENT
  // ==========================================

  /**
   * Stop specific listener
   */
  stopListener(listenerId: string): void {
    const unsubscribe = this.activeListeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.activeListeners.delete(listenerId);
    }
  }

  /**
   * Stop all listeners
   */
  stopAllListeners(): void {
    this.activeListeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.activeListeners.clear();
  }

  /**
   * Get active listeners count
   */
  getActiveListenersCount(): number {
    return this.activeListeners.size;
  }

  /**
   * Get all active listener IDs
   */
  getActiveListenerIds(): string[] {
    return Array.from(this.activeListeners.keys());
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    // Implement notification sound
    // For web: new Audio('/notification.mp3').play()
    // For mobile: use native notification API
  }

  /**
   * Show notification badge
   */
  private showBadge(count: number): void {
    // Update app badge count
    // For web: use Badge API
    // For mobile: use native badge API
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeService.stopAllListeners();
  });
}
