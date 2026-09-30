import { useCallback, useRef, useState, useEffect } from 'react';
import { userService } from '../../services/user.service';
import { settingsService } from '../../services/settings.service';
import { cacheIntegration } from '../../services/cacheIntegration.service';

const NOTIFICATIONS_CACHE_TTL = 5 * 60 * 1000;

export function useNotificationUsers(currentUserId: string | null) {
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [pendingFollowRequests, setPendingFollowRequests] = useState<any[]>([]);

  const lastFollowUsersLoadAtRef = useRef(0);
  const lastFollowRequestLoadAtRef = useRef(0);

  const followRequestsCacheKey = currentUserId ? 'notifications_follow_requests_v1:' + currentUserId : '';

  const loadFollowingUsers = useCallback(async () => {
    if (!currentUserId) return;
    const now = Date.now();
    if (followingUsers.size > 0 && now - lastFollowUsersLoadAtRef.current < 45000) return;
    lastFollowUsersLoadAtRef.current = now;
    try {
      const following = await userService.getFollowing(currentUserId);
      setFollowingUsers(new Set(following));
    } catch (error) {
      console.error('Failed to load following users:', error);
    }
  }, [currentUserId, followingUsers.size]);

  const loadFollowRequestCard = useCallback(async () => {
    if (!currentUserId) return;
    const now = Date.now();
    if (now - lastFollowRequestLoadAtRef.current < 45000) return;
    lastFollowRequestLoadAtRef.current = now;
    try {
      if (followRequestsCacheKey && pendingFollowRequests.length === 0) {
        const cachedFollowCard = await cacheIntegration.getCachedData(followRequestsCacheKey);
        if (cachedFollowCard && typeof cachedFollowCard === 'object') {
          const seededPrivate = !!(cachedFollowCard as any).isPrivate;
          const seededRequests = Array.isArray((cachedFollowCard as any).requests)
            ? (cachedFollowCard as any).requests
            : [];
          setIsPrivateAccount(seededPrivate);
          setPendingFollowRequests(seededRequests);
        }
      }

      const privacy = await settingsService.getPrivacySettings(currentUserId);
      const isPrivate = !!privacy.isPrivate;
      setIsPrivateAccount(isPrivate);
      if (!isPrivate) {
        setPendingFollowRequests([]);
        if (followRequestsCacheKey) {
          void cacheIntegration.cacheData(followRequestsCacheKey, { isPrivate: false, requests: [] }, NOTIFICATIONS_CACHE_TTL);
        }
        return;
      }

      const requests = await userService.getFollowRequests(currentUserId);
      const nextRequests = requests || [];
      setPendingFollowRequests(nextRequests);
      if (followRequestsCacheKey) {
        void cacheIntegration.cacheData(
          followRequestsCacheKey,
          { isPrivate: true, requests: nextRequests },
          NOTIFICATIONS_CACHE_TTL,
        );
      }
    } catch (error) {
      console.error('Failed to load follow requests:', error);
      setPendingFollowRequests([]);
    }
  }, [currentUserId, followRequestsCacheKey, pendingFollowRequests.length]);

  const handleFollow = useCallback(async (targetUserId: string) => {
    if (!currentUserId) return;
    try {
      if (followingUsers.has(targetUserId)) {
        await userService.unfollowUser(currentUserId, targetUserId);
        setFollowingUsers((prev) => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
      } else {
        await userService.followUser(currentUserId, targetUserId);
        setFollowingUsers((prev) => new Set([...prev, targetUserId]));
      }
    } catch (error) {
      console.error('Failed to follow/unfollow user:', error);
    }
  }, [followingUsers, currentUserId]);

  const refreshUsersData = useCallback(async () => {
    await Promise.all([loadFollowingUsers(), loadFollowRequestCard()]);
  }, [loadFollowingUsers, loadFollowRequestCard]);

  return {
    followingUsers,
    isPrivateAccount,
    pendingFollowRequests,
    handleFollow,
    refreshUsersData,
    loadFollowingUsers,
    loadFollowRequestCard,
  };
}
