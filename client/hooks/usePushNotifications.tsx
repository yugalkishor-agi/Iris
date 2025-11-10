import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { pushNotificationService } from '../../src/services/pushNotification.service';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported(pushNotificationService.isSupported());
    setPermission(pushNotificationService.getPermissionStatus());

    // Initialize messaging
    if (pushNotificationService.isSupported()) {
      pushNotificationService.initialize();
    }
  }, []);

  useEffect(() => {
    // Setup foreground message listener
    if (user && isSupported) {
      pushNotificationService.onForegroundMessage((payload) => {
        console.log('[Notifications] Foreground message:', payload);
        // You can dispatch custom events or update state here
        window.dispatchEvent(new CustomEvent('notification-received', { detail: payload }));
      });
    }
  }, [user, isSupported]);

  const requestPermission = async () => {
    if (!user) return null;
    
    const fcmToken = await pushNotificationService.requestPermission(user.userId);
    if (fcmToken) {
      setToken(fcmToken);
      setPermission('granted');
    }
    return fcmToken;
  };

  const unsubscribe = async () => {
    if (!user) return;
    
    await pushNotificationService.unsubscribe(user.userId);
    setToken(null);
  };

  return {
    permission,
    isSupported,
    token,
    requestPermission,
    unsubscribe,
  };
}
