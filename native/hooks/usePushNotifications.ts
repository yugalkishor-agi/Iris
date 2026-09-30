import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { pushService } from '../services/push.service';

/**
 * Hook to initialize push notifications for logged-in users
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const currentUserId = user?.userId ?? null;

  useEffect(() => {
    if (currentUserId && Platform.OS !== 'web') {
      // Register for push notifications using Expo on native platforms
      console.log('[Push Hook] Registering for push notifications for user:', currentUserId);
      pushService.registerForPushNotifications(currentUserId);
    }
  }, [currentUserId]);

  return {
    isNative: Platform.OS !== 'web'
  };
}
