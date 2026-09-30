// useConversationUsers.ts
// Purpose: Manage active users list (online friends at top of messages)
// Extracted from: MessagesScreenEnhanced.tsx — Session 002

import { useCallback, useEffect, useRef, useState } from 'react';
import { userService } from '../../services/user.service';
import type { User } from '../../types/database';

interface UseConversationUsersProps {
  currentUserId: string | null;
  canDisplayPresence: (user?: User | null) => boolean;
  initialActiveUsers?: User[];
}

export function useConversationUsers({
  currentUserId,
  canDisplayPresence,
  initialActiveUsers = [],
}: UseConversationUsersProps) {
  const [activeUsers, setActiveUsers] = useState<User[]>(initialActiveUsers);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const loadActiveUsers = useCallback(
    async (isPreload: boolean = false) => {
      if (!currentUserId) return;
      if (loadingRef.current) return;

      loadingRef.current = true;
      if (!isPreload) setLoading(true);

      try {
        const users = await userService.getActiveUsers(currentUserId, 12);

        // Filter to only show users who are actually online/active (within 5 minutes)
        const trulyActiveUsers = users.filter((activeUser) => {
          if (!canDisplayPresence(activeUser)) return false;

          const lastSeen = activeUser.lastSeen;
          if (!lastSeen) return false;

          const lastSeenTime = lastSeen.toDate
            ? lastSeen.toDate()
            : lastSeen instanceof Date
            ? lastSeen
            : new Date();

          const now = new Date();
          const diffMinutes = (now.getTime() - lastSeenTime.getTime()) / (1000 * 60);

          // Only show if active within last 5 minutes
          return diffMinutes <= 5;
        });

        setActiveUsers(trulyActiveUsers);
      } catch (error) {
        console.error('Failed to load active users:', error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [currentUserId, canDisplayPresence]
  );

  // Load on mount
  useEffect(() => {
    if (currentUserId) {
      void loadActiveUsers(true);
    }
  }, [currentUserId, loadActiveUsers]);

  const refresh = useCallback(() => {
    return loadActiveUsers(false);
  }, [loadActiveUsers]);

  return {
    activeUsers,
    loading,
    refresh,
  };
}
