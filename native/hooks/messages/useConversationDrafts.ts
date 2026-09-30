// useConversationDrafts.ts
// Purpose: Manage conversation drafts (unsent messages) with AsyncStorage
// Extracted from: MessagesScreenEnhanced.tsx — Session 002

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Conversation } from '../../types/database';

interface UseConversationDraftsProps {
  currentUserId: string | null;
  conversations: Conversation[];
  requestConversations: Conversation[];
  archivedConversations: Conversation[];
}

export function useConversationDrafts({
  currentUserId,
  conversations,
  requestConversations,
  archivedConversations,
}: UseConversationDraftsProps) {
  const [drafts, setDrafts] = useState<{ [conversationId: string]: string }>({});

  const areDraftsEqual = (
    a: { [conversationId: string]: string },
    b: { [conversationId: string]: string }
  ) => {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (a[key] !== b[key]) return false;
    }
    return true;
  };

  const loadDrafts = useCallback(async () => {
    if (!currentUserId) return;

    const allConvos = [...conversations, ...requestConversations, ...archivedConversations];
    if (allConvos.length === 0) {
      setDrafts({});
      return;
    }

    const prefix = 'draft:chat:';
    const suffix = `:${currentUserId}`;
    const keys = allConvos.map((c) => `${prefix}${c.conversationId}${suffix}`);

    try {
      const entries = await AsyncStorage.multiGet(keys);
      const next: { [conversationId: string]: string } = {};

      entries.forEach(([key, value]) => {
        if (!value || !key) return;
        if (key.startsWith(prefix) && key.endsWith(suffix)) {
          const conversationId = key.slice(prefix.length, key.length - suffix.length);
          if (conversationId) {
            next[conversationId] = value;
          }
        }
      });

      setDrafts((prev) => (areDraftsEqual(prev, next) ? prev : next));
    } catch (error) {
      console.error('Failed to load drafts:', error);
    }
  }, [currentUserId, conversations, requestConversations, archivedConversations]);

  const saveDraft = useCallback(
    async (conversationId: string, text: string) => {
      if (!currentUserId) return;

      const key = `draft:chat:${conversationId}:${currentUserId}`;
      try {
        if (text.trim()) {
          await AsyncStorage.setItem(key, text);
          setDrafts((prev) => ({ ...prev, [conversationId]: text }));
        } else {
          await AsyncStorage.removeItem(key);
          setDrafts((prev) => {
            const next = { ...prev };
            delete next[conversationId];
            return next;
          });
        }
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    },
    [currentUserId]
  );

  const deleteDraft = useCallback(
    async (conversationId: string) => {
      if (!currentUserId) return;

      const key = `draft:chat:${conversationId}:${currentUserId}`;
      try {
        await AsyncStorage.removeItem(key);
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[conversationId];
          return next;
        });
      } catch (error) {
        console.error('Failed to delete draft:', error);
      }
    },
    [currentUserId]
  );

  // Load drafts when conversations change
  useEffect(() => {
    void loadDrafts();
  }, [loadDrafts]);

  return {
    drafts,
    saveDraft,
    deleteDraft,
    refresh: loadDrafts,
  };
}
