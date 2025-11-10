import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

class PushNotificationService {
  private messaging: Messaging | null = null;
  private vapidKey = 'YOUR_VAPID_KEY'; // Replace with your Firebase VAPID key

  /**
   * Initialize Firebase Cloud Messaging
   */
  async initialize(): Promise<void> {
    try {
      this.messaging = getMessaging();
      console.log('[Push] Firebase Messaging initialized');
    } catch (error) {
      console.error('[Push] Failed to initialize messaging:', error);
    }
  }

  /**
   * Request notification permission and get FCM token
   */
  async requestPermission(userId: string): Promise<string | null> {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('[Push] Notification permission granted');
        
        if (!this.messaging) {
          await this.initialize();
        }

        if (this.messaging) {
          const token = await getToken(this.messaging, {
            vapidKey: this.vapidKey
          });

          if (token) {
            console.log('[Push] FCM Token:', token);
            
            // Save token to user document
            await this.saveTokenToDatabase(userId, token);
            
            return token;
          }
        }
      } else {
        console.log('[Push] Notification permission denied');
      }
      
      return null;
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      return null;
    }
  }

  /**
   * Save FCM token to Firestore
   */
  private async saveTokenToDatabase(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: token,
        fcmTokenUpdatedAt: new Date()
      });
      console.log('[Push] Token saved to database');
    } catch (error) {
      console.error('[Push] Failed to save token:', error);
    }
  }

  /**
   * Listen for foreground messages
   */
  onForegroundMessage(callback: (payload: any) => void): void {
    if (!this.messaging) {
      console.error('[Push] Messaging not initialized');
      return;
    }

    onMessage(this.messaging, (payload) => {
      console.log('[Push] Foreground message received:', payload);
      
      // Show browser notification
      if (payload.notification) {
        this.showNotification(
          payload.notification.title || 'Iris',
          payload.notification.body || '',
          payload.notification.icon || '/logo_bg-removed.png',
          payload.data
        );
      }
      
      callback(payload);
    });
  }

  /**
   * Show browser notification
   */
  private showNotification(
    title: string,
    body: string,
    icon: string,
    data?: any
  ): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon,
        badge: '/logo_bg-removed.png',
        tag: data?.type || 'default',
        data,
        requireInteraction: false,
      } as NotificationOptions);

      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate based on notification type
        if (data?.url) {
          window.location.href = data.url;
        } else if (data?.type === 'message') {
          window.location.href = `/messages/${data.conversationId}`;
        } else if (data?.type === 'like' || data?.type === 'comment') {
          window.location.href = `/post/${data.postId}`;
        } else if (data?.type === 'follow') {
          window.location.href = `/profile/${data.username}`;
        }
      };
    }
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Unsubscribe from notifications
   */
  async unsubscribe(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: null,
        fcmTokenUpdatedAt: null
      });
      console.log('[Push] Unsubscribed from notifications');
    } catch (error) {
      console.error('[Push] Failed to unsubscribe:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
