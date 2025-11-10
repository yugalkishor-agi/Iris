import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { nativePushNotificationService } from '../../src/services/pushNotification.native.service';

/**
 * Hook to initialize push notifications for logged-in users
 */
export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (user && nativePushNotificationService.isNativePlatform()) {
      // Initialize push notifications for native platforms
      console.log('[Push Hook] Initializing push notifications for user:', user.userId);
      nativePushNotificationService.initialize(user.userId);

      return () => {
        // Cleanup listeners on unmount
        console.log('[Push Hook] Cleaning up push notification listeners');
      };
    }
  }, [user]);

  return {
    isNative: nativePushNotificationService.isNativePlatform()
  };
}
