// useConversationActions.ts
// Purpose: Handle conversation actions (pin, mute, archive, delete, block, etc.)
// Extracted from: MessagesScreenEnhanced.tsx — Session 002

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { messageService } from '../../services/message.service';
import { userService } from '../../services/user.service';
import { clearConversationMessageCache } from '../useMessages';
import type { Conversation, User } from '../../types/database';

interface UseConversationActionsProps {
  currentUserId: string | null;
  onConversationUpdate: (updater: (convos: Conversation[]) => Conversation[]) => void;
  onConversationRemove: (conversationId: string) => void;
}

export function useConversationActions({
  currentUserId,
  onConversationUpdate,
  onConversationRemove,
}: UseConversationActionsProps) {
  const pinConversation = useCallback(
    async (conversationId: string, isPinned: boolean) => {
      if (!currentUserId) return;

      try {
        if (isPinned) {
          await messageService.unpinConversation(conversationId, currentUserId);
        } else {
          await messageService.pinConversation(conversationId, currentUserId);
        }
      } catch (error) {
        console.error('Failed to update pin state:', error);
        Alert.alert('Error', 'Failed to update pin');
      }
    },
    [currentUserId]
  );

  const muteConversation = useCallback(
    async (conversationId: string, isMuted: boolean) => {
      if (!currentUserId) return;

      try {
        if (isMuted) {
          await messageService.unmuteConversation(conversationId, currentUserId);
        } else {
          await messageService.muteConversation(conversationId, currentUserId);
        }
      } catch (error) {
        console.error('Failed to update mute state:', error);
        Alert.alert('Error', 'Failed to update mute');
      }
    },
    [currentUserId]
  );

  const archiveConversation = useCallback(
    async (conversationId: string, isArchived: boolean) => {
      if (!currentUserId) return;

      try {
        if (isArchived) {
          await messageService.unarchiveConversation(conversationId, currentUserId);
        } else {
          await messageService.archiveConversation(conversationId, currentUserId);
        }
      } catch (error) {
        console.error('Failed to update archive state:', error);
        Alert.alert('Error', 'Failed to update archive');
      }
    },
    [currentUserId]
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!currentUserId) return;

      Alert.alert('Delete conversation', 'Are you sure? This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await messageService.deleteConversation(conversationId, currentUserId);
              await clearConversationMessageCache(conversationId, currentUserId);
              onConversationRemove(conversationId);
            } catch (error) {
              console.error('Failed to delete conversation:', error);
              Alert.alert('Error', 'Failed to delete conversation');
            }
          },
        },
      ]);
    },
    [currentUserId, onConversationRemove]
  );

  const markAsUnread = useCallback(
    async (conversationId: string) => {
      if (!currentUserId) return;

      try {
        await messageService.markConversationAsUnread(conversationId, currentUserId);
        onConversationUpdate((convos) =>
          convos.map((c) =>
            c.conversationId === conversationId
              ? {
                  ...c,
                  unreadCounts: {
                    ...(c.unreadCounts || {}),
                    [currentUserId]: Math.max(1, c.unreadCounts?.[currentUserId] || 0),
                  },
                }
              : c
          )
        );
      } catch (error) {
        console.error('Failed to mark as unread:', error);
        Alert.alert('Error', 'Failed to mark as unread');
      }
    },
    [currentUserId, onConversationUpdate]
  );

  const blockUser = useCallback(
    async (conversation: Conversation, otherUser: User) => {
      if (!currentUserId || conversation.type !== 'direct' || !otherUser?.userId) return;

      Alert.alert(
        'Block user',
        `Block ${otherUser.displayName || otherUser.username || 'this user'}? They will no longer be able to message you.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            style: 'destructive',
            onPress: async () => {
              try {
                await userService.blockUser(currentUserId, otherUser.userId);
                await messageService.deleteConversation(conversation.conversationId, currentUserId);
                await clearConversationMessageCache(conversation.conversationId, currentUserId);
                onConversationRemove(conversation.conversationId);
              } catch (error) {
                console.error('Failed to block user:', error);
                Alert.alert('Error', 'Failed to block user');
              }
            },
          },
        ]
      );
    },
    [currentUserId, onConversationRemove]
  );

  const acceptMessageRequest = useCallback(
    async (conversationId: string) => {
      if (!currentUserId) return;

      try {
        await messageService.unrestrictConversation(conversationId, currentUserId);
      } catch (error) {
        console.error('Failed to accept request:', error);
        Alert.alert('Error', 'Failed to accept request');
      }
    },
    [currentUserId]
  );

  const declineMessageRequest = useCallback(
    async (conversationId: string) => {
      if (!currentUserId) return;

      Alert.alert('Decline request', 'This will delete the conversation.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await messageService.deleteConversation(conversationId, currentUserId);
              await clearConversationMessageCache(conversationId, currentUserId);
              onConversationRemove(conversationId);
            } catch (error) {
              console.error('Failed to decline request:', error);
              Alert.alert('Error', 'Failed to decline request');
            }
          },
        },
      ]);
    },
    [currentUserId, onConversationRemove]
  );

  return {
    pinConversation,
    muteConversation,
    archiveConversation,
    deleteConversation,
    markAsUnread,
    blockUser,
    acceptMessageRequest,
    declineMessageRequest,
  };
}
