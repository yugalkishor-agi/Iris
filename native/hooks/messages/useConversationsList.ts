// useConversationsList.ts
// Purpose: Load and manage conversations list with Firebase real-time updates
// Extracted from: MessagesScreenEnhanced.tsx — Session 002

import { useCallback, useEffect, useRef, useState } from 'react';
import { conversationService } from '../../services/conversation.service';
import { userService } from '../../services/user.service';
import type { Conversation, User } from '../../types/database';

interface UseConversationsListProps {
  currentUserId: string | null;
  initialData?: {
    conversations?: Conversation[];
    requestConversations?: Conversation[];
    archivedConversations?: Conversation[];
    conversationUsers?: { [key: string]: User };
  };
}

export function useConversationsList({ currentUserId, initialData }: UseConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialData?.conversations || []);
  const [requestConversations, setRequestConversations] = useState<Conversation[]>(
    initialData?.requestConversations || []
  );
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>(
    initialData?.archivedConversations || []
  );
  const [conversationUsers, setConversationUsers] = useState<{ [key: string]: User }>(
    initialData?.conversationUsers || {}
  );
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);

  const userCacheRef = useRef<{ [userId: string]: User }>({});

  // Load conversations with Firebase real-time listener
  useEffect(() => {
    if (!currentUserId) {
      setConversations([]);
      setRequestConversations([]);
      setArchivedConversations([]);
      setConversationUsers({});
      setLoading(false);
      return;
    }

    let isActive = true;

    const unsubscribe = conversationService.listenToConversations(currentUserId, async (snapshot) => {
      if (!isActive) return;

      try {
        const rawDocs = snapshot.docs.map((doc) => ({ conversationId: doc.id, ...doc.data() })) as any[];

        // Filter out soft-deleted conversations
        const isDeletedForUser = (deletedBy: any) =>
          Array.isArray(deletedBy) ? deletedBy.includes(currentUserId) : Boolean(deletedBy?.[currentUserId]);
        const visibleDocs = rawDocs.filter((c: any) => !isDeletedForUser(c.deletedBy));

        // Process conversation flags
        const conversationDocs = visibleDocs.map((c: any) => {
          const pinnedBy = c.pinnedBy || [];
          const mutedBy = c.mutedBy || [];
          const archivedBy = c.archivedBy || [];

          return {
            ...(c as Conversation),
            isPinned: Array.isArray(pinnedBy) ? pinnedBy.includes(currentUserId) : false,
            isMuted: Array.isArray(mutedBy) ? mutedBy.includes(currentUserId) : !!mutedBy[currentUserId]?.isMuted,
            isArchived: Array.isArray(archivedBy) ? archivedBy.includes(currentUserId) : false,
          } as Conversation;
        });

        // Separate into categories
        const regularConvos: Conversation[] = [];
        const requestConvos: Conversation[] = [];
        const archivedConvos: Conversation[] = [];

        conversationDocs.forEach((convo) => {
          if (convo.archivedBy?.includes(currentUserId)) {
            archivedConvos.push(convo);
            return;
          }
          const restrictedBy = convo.restrictedBy || [];
          if (restrictedBy.includes(currentUserId)) {
            requestConvos.push(convo);
          } else {
            regularConvos.push(convo);
          }
        });

        if (!isActive) return;
        setConversations(regularConvos);
        setRequestConversations(requestConvos);
        setArchivedConversations(archivedConvos);

        // Load user data
        await loadConversationUsers(regularConvos, requestConvos, archivedConvos);
        setLoading(false);
        setRefreshing(false);
      } catch (error) {
        if (!isActive) return;
        console.error('Failed to load conversations:', error);
        setLoading(false);
        setRefreshing(false);
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [currentUserId]);

  const loadConversationUsers = async (regular: Conversation[], requests: Conversation[], archived: Conversation[]) => {
    if (!currentUserId) return;

    const usersMap: { [key: string]: User } = {};
    const missingUserIds = new Set<string>();

    // Check cache first
    for (const convo of [...regular, ...requests, ...archived]) {
      if (convo.type !== 'direct') continue;

      const otherUserId = convo.participantIds.find((id) => id !== currentUserId);
      if (!otherUserId) continue;

      const cachedUser = userCacheRef.current[otherUserId];
      if (cachedUser) {
        usersMap[convo.conversationId] = cachedUser;
      } else {
        missingUserIds.add(otherUserId);
      }
    }

    // Batch load missing users
    if (missingUserIds.size > 0) {
      try {
        const batchUsers = await userService.getUsersByIds(Array.from(missingUserIds));
        Object.entries(batchUsers).forEach(([targetUserId, userData]) => {
          if (userData?.userId) {
            userCacheRef.current[targetUserId] = userData as User;
          }
        });
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    }

    // Map users to conversations
    for (const convo of [...regular, ...requests, ...archived]) {
      if (convo.type !== 'direct') continue;
      const otherUserId = convo.participantIds.find((id) => id !== currentUserId);
      if (!otherUserId) continue;

      const cachedUser = userCacheRef.current[otherUserId];
      if (cachedUser) {
        usersMap[convo.conversationId] = cachedUser;
      }
    }

    setConversationUsers(usersMap);
  };

  const refresh = useCallback(async () => {
    setRefreshing(true);
    // Firebase listener will automatically trigger update
  }, []);

  return {
    conversations,
    requestConversations,
    archivedConversations,
    conversationUsers,
    loading,
    refreshing,
    refresh,
  };
}
