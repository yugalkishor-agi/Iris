// Push Notifications Service for React Native
// Uses Expo Notifications and Firebase Cloud Messaging

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { auth } from '../config/firebase';
import { pushService } from './push.service';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  badge?: number;
  categoryId?: string;
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
}

export interface ScheduledNotification extends NotificationData {
  trigger: {
    seconds?: number;
    date?: Date;
    repeats?: boolean;
    channelId?: string;
  };
}

class NotificationsService {
  private expoPushToken: string | null = null;

  /**
   * Initialize notifications
   */
  async initialize(): Promise<void> {
    try {
      await this.setupNotificationCategories();
      console.log('[Notifications] Local notifications helper initialized');
    } catch (error) {
      console.error('[Notifications] Failed to initialize local notifications helper:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.warn('Push notification permissions not granted');
          return false;
        }
        
        return true;
      } else {
        console.warn('Must use physical device for push notifications');
        return false;
      }
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        console.warn('[Notifications] No authenticated user for push registration');
        return null;
      }

      const token = await pushService.registerForPushNotifications(uid);
      if (!token) {
        return null;
      }

      this.expoPushToken = token;

      // Token persistence is centralized in pushService.registerForPushNotifications.
      // Avoid extra subcollection writes on every app init/login.
      return token;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return null;
    }
  }

  /**
   * Setup notification categories for interactive notifications
   */
  async setupNotificationCategories(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync('social', [
        {
          identifier: 'like',
          buttonTitle: '❤️ Like',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'reply',
          buttonTitle: '💬 Reply',
          options: { opensAppToForeground: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('message', [
        {
          identifier: 'reply',
          buttonTitle: '💬 Reply',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'mark_read',
          buttonTitle: '✅ Mark Read',
          options: { opensAppToForeground: false },
        },
      ]);
    } catch (error) {
      console.error('Failed to setup notification categories:', error);
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(notification: NotificationData): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
          badge: notification.badge,
          categoryIdentifier: notification.categoryId,
        },
        trigger: null, // Send immediately
      });
      
      return notificationId;
    } catch (error) {
      console.error('Failed to send local notification:', error);
      return null;
    }
  }

  /**
   * Schedule notification for later
   */
  async scheduleNotification(notification: ScheduledNotification): Promise<string | null> {
    try {
      let trigger: Notifications.NotificationTriggerInput | null = null;
      if (notification.trigger) {
        const t = notification.trigger;
        if (typeof t.seconds === 'number') {
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: t.seconds,
            repeats: !!t.repeats,
          } as Notifications.TimeIntervalTriggerInput;
        } else if (t.date instanceof Date) {
          // Expo supports passing a Date directly as trigger
          trigger = t.date as unknown as Notifications.NotificationTriggerInput;
        }
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
          badge: notification.badge,
          categoryIdentifier: notification.categoryId,
        },
        trigger,
      });
      
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Cancel notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Failed to get badge count:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Failed to clear badge:', error);
    }
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Send push notification to specific user (server-side)
   */
  async sendPushNotification(
    pushToken: string,
    notification: NotificationData
  ): Promise<boolean> {
    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        badge: notification.badge,
        priority: notification.priority || 'high',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      return result.data?.status === 'ok';
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  /**
   * Create notification for different app events
   */
  createSocialNotification(type: string, data: any): NotificationData {
    const notifications: Record<string, NotificationData> = {
      like: {
        title: '❤️ New Like',
        body: `${data.username} liked your ${data.contentType}`,
        data: { type: 'like', postId: data.postId, userId: data.userId },
        categoryId: 'social',
      },
      comment: {
        title: '💬 New Comment',
        body: `${data.username} commented on your ${data.contentType}`,
        data: { type: 'comment', postId: data.postId, commentId: data.commentId },
        categoryId: 'social',
      },
      follow: {
        title: '👤 New Follower',
        body: `${data.username} started following you`,
        data: { type: 'follow', userId: data.userId },
        categoryId: 'social',
      },
      message: {
        title: '💬 New Message',
        body: `${data.username}: ${data.preview}`,
        data: { type: 'message', conversationId: data.conversationId, userId: data.userId },
        categoryId: 'message',
      },
      story_view: {
        title: '👁️ Story View',
        body: `${data.username} viewed your story`,
        data: { type: 'story_view', storyId: data.storyId, userId: data.userId },
        categoryId: 'social',
      },
    };

    return notifications[type] || {
      title: 'Iris',
      body: 'You have a new notification',
      data: data,
    };
  }

  /**
   * Handle notification response (when user taps notification)
   */
  handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { notification, actionIdentifier } = response;
    const data = notification.request.content.data;

    console.log('📱 Notification tapped:', { actionIdentifier, data });

    // Handle different actions
    switch (actionIdentifier) {
      case 'like':
        // Handle like action
        break;
      case 'reply':
        // Handle reply action
        break;
      case 'mark_read':
        // Handle mark as read action
        break;
      default:
        // Handle default tap (open app)
        break;
    }
  }
}

// Singleton instance
export const notificationsService = new NotificationsService();

// Export convenience functions
export const initializeNotifications = () => notificationsService.initialize();
export const sendLocalNotification = (notification: NotificationData) => 
  notificationsService.sendLocalNotification(notification);
export const scheduleNotification = (notification: ScheduledNotification) => 
  notificationsService.scheduleNotification(notification);
export const getPushToken = () => notificationsService.getPushToken();
export const setBadgeCount = (count: number) => notificationsService.setBadgeCount(count);
export const clearBadge = () => notificationsService.clearBadge();

