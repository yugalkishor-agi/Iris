import { useState, useEffect } from 'react';
import { settingsService, UserSettings, PrivacySettings, NotificationPreferences } from '../../src/services/settings.service';
import { useAuth } from '../contexts/AuthContext';

export const useSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      try {
        setLoading(true);
        const [userSettings, privacySettings, notifPrefs] = await Promise.all([
          settingsService.getUserSettings(user.userId),
          settingsService.getPrivacySettings(user.userId),
          settingsService.getNotificationPreferences(user.userId),
        ]);

        setSettings(userSettings);
        setPrivacy(privacySettings);
        setNotificationPrefs(notifPrefs);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user) return;

    try {
      await settingsService.updateSettings(user.userId, updates);
      setSettings((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const updatePrivacy = async (updates: Partial<PrivacySettings>) => {
    if (!user) return;

    try {
      await settingsService.updatePrivacySettings(user.userId, updates);
      setPrivacy((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const updateNotificationPrefs = async (updates: Partial<NotificationPreferences>) => {
    if (!user) return;

    try {
      await settingsService.updateNotificationPreferences(user.userId, updates);
      setNotificationPrefs((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return {
    settings,
    privacy,
    notificationPrefs,
    loading,
    error,
    updateSettings,
    updatePrivacy,
    updateNotificationPrefs,
  };
};

export const useBlockedUsers = () => {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadBlocked = async () => {
      try {
        const users = await settingsService.getBlockedUsers(user.userId);
        setBlockedUsers(users);
      } catch (err) {
        console.error('Failed to load blocked users', err);
      } finally {
        setLoading(false);
      }
    };

    loadBlocked();
  }, [user]);

  const blockUser = async (targetUserId: string) => {
    if (!user) return;

    try {
      await settingsService.blockUser(user.userId, targetUserId);
      setBlockedUsers((prev) => [...prev, { userId: targetUserId, blockedAt: new Date() }]);
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const unblockUser = async (targetUserId: string) => {
    if (!user) return;

    try {
      await settingsService.unblockUser(user.userId, targetUserId);
      setBlockedUsers((prev) => prev.filter((u) => u.userId !== targetUserId));
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return {
    blockedUsers,
    loading,
    blockUser,
    unblockUser,
  };
};

export const useCloseFriends = () => {
  const { user } = useAuth();
  const [closeFriends, setCloseFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadCloseFriends = async () => {
      try {
        const friends = await settingsService.getCloseFriends(user.userId);
        setCloseFriends(friends);
      } catch (err) {
        console.error('Failed to load close friends', err);
      } finally {
        setLoading(false);
      }
    };

    loadCloseFriends();
  }, [user]);

  const addCloseFriend = async (friendId: string) => {
    if (!user) return;

    try {
      await settingsService.addCloseFriend(user.userId, friendId);
      setCloseFriends((prev) => [...prev, friendId]);
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const removeCloseFriend = async (friendId: string) => {
    if (!user) return;

    try {
      await settingsService.removeCloseFriend(user.userId, friendId);
      setCloseFriends((prev) => prev.filter((id) => id !== friendId));
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return {
    closeFriends,
    loading,
    addCloseFriend,
    removeCloseFriend,
  };
};

export const usePrivacySettings = () => {
  const { user } = useAuth();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadPrivacy = async () => {
      try {
        setLoading(true);
        const settings = await settingsService.getPrivacySettings(user.userId);
        setPrivacySettings(settings);
      } catch (err) {
        console.error('Failed to load privacy settings', err);
      } finally {
        setLoading(false);
      }
    };

    loadPrivacy();
  }, [user]);

  const updatePrivacySettings = async (updates: Partial<PrivacySettings>) => {
    if (!user) return;

    try {
      await settingsService.updatePrivacySettings(user.userId, updates);
      setPrivacySettings((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return {
    privacySettings,
    loading,
    updatePrivacySettings,
  };
};

export const useNotificationSettings = () => {
  const { user } = useAuth();
  const [notificationSettings, setNotificationSettings] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        const prefs = await settingsService.getNotificationPreferences(user.userId);
        setNotificationSettings(prefs);
      } catch (err) {
        console.error('Failed to load notification settings', err);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user]);

  const updateNotificationSettings = async (updates: Partial<NotificationPreferences>) => {
    if (!user) return;

    try {
      await settingsService.updateNotificationPreferences(user.userId, updates);
      setNotificationSettings((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return {
    notificationSettings,
    loading,
    updateNotificationSettings,
  };
};
