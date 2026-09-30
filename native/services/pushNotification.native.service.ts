import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { pushService } from './push.service';

/**
 * Native Push Notification Service for Android/iOS
 * Handles FCM token registration and notification handling
 */
class NativePushNotificationService {
  private isNative = Platform.OS !== 'web';
  
  /**
   * Initialize push notifications
   */
  async initialize(userId: string): Promise<void> {
    if (!this.isNative) {
      console.log('[Push Native] Not a native platform, skipping initialization');
      return;
    }
    try {
      await pushService.registerForPushNotifications(userId);
      this.setupListeners(userId);
    } catch (error) {
      console.error('[Push Native] Initialization error:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  private setupListeners(userId: string): void {
    try {
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('[Push Native] Foreground notification:', notification);
      });
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('[Push Native] Notification tapped:', response);
        const data: any = response.notification.request.content.data;
        this.handleNotificationTap(data);
      });
    } catch (e) {
      console.error('[Push Native] Listener setup error:', e);
    }
  }

  /**
   * Save FCM token to Firestore
   */
  private async saveTokenToDatabase(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        expoPushTokens: token ? [token] : [],
        expoTokenUpdatedAt: new Date(),
      });
    } catch (error) {
      console.error('[Push Native] Failed to save token:', error);
    }
  }

  /**
   * Show local notification (for foreground messages)
   */
  private async showLocalNotification(_notification: any): Promise<void> {
    // Expo shows notifications automatically; no-op here
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTap(_data: any): void {
    // Navigation can be handled at app level via NavigationContainer if needed.
  }

  /**
   * Get delivered notifications
   */
  async getDeliveredNotifications(): Promise<any[]> {
    if (!this.isNative) return [];
    const presented = await Notifications.getPresentedNotificationsAsync();
    return presented as any[];
  }

  /**
   * Remove delivered notifications
   */
  async removeDeliveredNotifications(ids?: string[]): Promise<void> {
    if (!this.isNative) return;
    if (ids && ids.length > 0) {
      await Promise.all(ids.map((id) => Notifications.dismissNotificationAsync(id)));
    } else {
      await Notifications.dismissAllNotificationsAsync();
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
  async unsubscribe(_userId: string): Promise<void> {
    // No-op for now; app can manage tokens server-side if desired
  }
}

export const nativePushNotificationService = new NativePushNotificationService();
