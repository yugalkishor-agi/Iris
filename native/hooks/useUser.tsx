import { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { userService } from '../services/user.service';
import { cacheService } from '../services/cache.service';
import type { User } from '../types/database';
import { useAuth } from '../contexts/AuthContext';

export const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        setLoading(true);
        // userService.getUser already handles both userId and username
        const userData = await userService.getUser(userId);
        setUser(userData);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load user:', err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId]);

  return { user, loading, error };
};

export const useFollowActions = () => {
  const { user: currentUser } = useAuth();
  const [following, setFollowing] = useState(false);

  const followUser = async (userId: string) => {
    if (!currentUser) throw new Error('Not authenticated');

    setFollowing(true);
    try {
      await userService.followUser(currentUser.userId, userId);
    } catch (error) {
      throw error;
    } finally {
      setFollowing(false);
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!currentUser) throw new Error('Not authenticated');

    setFollowing(true);
    try {
      await userService.unfollowUser(currentUser.userId, userId);
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      throw error;
    } finally {
      setFollowing(false);
    }
  };

  const blockUser = async (userId: string) => {
    if (!currentUser) throw new Error('Not authenticated');

    try {
      await userService.blockUser(currentUser.userId, userId);
      cacheService.invalidateUserProfile(currentUser.userId);
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  };

  const unblockUser = async (userId: string) => {
    if (!currentUser) throw new Error('Not authenticated');

    try {
      await userService.unblockUser(currentUser.userId, userId);
      cacheService.invalidateUserProfile(currentUser.userId);
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  };

  return {
    followUser,
    unfollowUser,
    blockUser,
    unblockUser,
    following,
  };
};

export const useFollowers = (userId: string) => {
  const [followerIds, setFollowerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadFollowers = async () => {
      try {
        setLoading(true);
        const ids = await userService.getFollowers(userId);
        setFollowerIds(ids);
      } catch (error) {
        console.error('Failed to load followers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFollowers();
  }, [userId]);

  return { followerIds, loading };
};

export const useFollowing = (userId: string) => {
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadFollowing = async () => {
      try {
        setLoading(true);
        const ids = await cacheService.getFollowingList(
          userId,
          () => userService.getFollowing(userId)
        );
        setFollowingIds(ids);
      } catch (error) {
        console.error('Failed to load following:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFollowing();
  }, [userId]);

  return { followingIds, loading };
};

