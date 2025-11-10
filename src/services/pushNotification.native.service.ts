import { PushNotifications, type Token, type PushNotificationSchema, type ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Native Push Notification Service for Android/iOS
 * Handles FCM token registration and notification handling
 */
class NativePushNotificationService {
  private isNative = Capacitor.isNativePlatform();
  
  /**
   * Initialize push notifications
   */
  async initialize(userId: string): Promise<void> {
    if (!this.isNative) {
      console.log('[Push Native] Not a native platform, skipping initialization');
      return;
    }

    try {
      // Request permission
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        console.log('[Push Native] Permission granted');
        
        // Register for push notifications
        await PushNotifications.register();
        
        // Setup listeners
        this.setupListeners(userId);
      } else {
        console.log('[Push Native] Permission denied');
      }
    } catch (error) {
      console.error('[Push Native] Initialization error:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  private setupListeners(userId: string): void {
    // Token registration
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('[Push Native] FCM Token:', token.value);
      this.saveTokenToDatabase(userId, token.value);
    });

    // Registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('[Push Native] Registration error:', error);
    });

    // Notification received (app in foreground)
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('[Push Native] Foreground notification:', notification);
        
        // Show local notification
        this.showLocalNotification(notification);
      }
    );

    // Notification action performed (user tapped)
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('[Push Native] Notification tapped:', action);
        
        const data = action.notification.data;
        this.handleNotificationTap(data);
      }
    );
  }

  /**
   * Save FCM token to Firestore
   */
  private async saveTokenToDatabase(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: token,
        fcmTokenUpdatedAt: new Date(),
        platform: Capacitor.getPlatform()
      });
      console.log('[Push Native] Token saved to database');
    } catch (error) {
      console.error('[Push Native] Failed to save token:', error);
    }
  }

  /**
   * Show local notification (for foreground messages)
   */
  private async showLocalNotification(notification: PushNotificationSchema): Promise<void> {
    try {
      // The notification will be shown by the system automatically
      // This method can be enhanced with custom logic if needed
      console.log('[Push Native] Showing notification:', notification.title);
    } catch (error) {
      console.error('[Push Native] Error showing notification:', error);
    }
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTap(data: any): void {
    const { type, conversationId, postId, username, url } = data;

    // Navigate based on notification type
    if (url) {
      window.location.href = url;
    } else if (type === 'message' && conversationId) {
      window.location.href = `/chat/${conversationId}`;
    } else if ((type === 'like' || type === 'comment') && postId) {
      window.location.href = `/post/${postId}`;
    } else if (type === 'follow' && username) {
      window.location.href = `/profile/${username}`;
    } else {
      window.location.href = '/notifications';
    }
  }

  /**
   * Get delivered notifications
   */
  async getDeliveredNotifications(): Promise<PushNotificationSchema[]> {
    if (!this.isNative) return [];
    
    const result = await PushNotifications.getDeliveredNotifications();
    return result.notifications;
  }

  /**
   * Remove delivered notifications
   */
  async removeDeliveredNotifications(ids?: string[]): Promise<void> {
    if (!this.isNative) return;
    
    if (ids && ids.length > 0) {
      await PushNotifications.removeDeliveredNotifications({ 
        notifications: ids.map(id => ({ id, tag: '', title: '', body: '', data: {} })) 
      });
    } else {
      await PushNotifications.removeAllDeliveredNotifications();
    }
  }

  /**
   * Check if running on native platform
   */
  isNativePlatform(): boolean {
    return this.isNative;
  }

  /**
   * Unsubscribe from notifications
   */
  async unsubscribe(userId: string): Promise<void> {
    try {
      // Remove token from database
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: null,
        fcmTokenUpdatedAt: null
      });

      // Remove all listeners
      if (this.isNative) {
        await PushNotifications.removeAllListeners();
      }
      
      console.log('[Push Native] Unsubscribed from notifications');
    } catch (error) {
      console.error('[Push Native] Failed to unsubscribe:', error);
    }
  }
}

export const nativePushNotificationService = new NativePushNotificationService();
