import { useCallback, useState } from 'react';
import { collection, deleteField, doc, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../../config/firebase';

type ReactionMap = Record<string, string | null>;

type UseChatReactionsArgs = {
  conversationId: string;
  viewerId?: string;
};

type UseChatReactionsResult = {
  localReactions: ReactionMap;
  getMergedReactionsForMessage: (message: any) => Record<string, string>;
  getCurrentUserReaction: (message: any) => string;
  applyReactionForMessage: (message: any, emoji: string) => Promise<void>;
};

export function useChatReactions({ conversationId, viewerId }: UseChatReactionsArgs): UseChatReactionsResult {
  const [localReactions, setLocalReactions] = useState<ReactionMap>({});

  const getMergedReactionsForMessage = useCallback((message: any): Record<string, string> => {
    const base =
      message && typeof message.reactions === 'object' && !Array.isArray(message.reactions)
        ? (message.reactions as Record<string, string>)
        : {};
    const next: Record<string, string> = { ...base };
    const messageId = String(message?.messageId || '');
    if (!messageId || !viewerId || !Object.prototype.hasOwnProperty.call(localReactions, messageId)) {
      return next;
    }

    const optimistic = localReactions[messageId];
    if (typeof optimistic === 'string' && optimistic.trim().length > 0) {
      next[viewerId] = optimistic;
    } else {
      delete next[viewerId];
    }
    return next;
  }, [localReactions, viewerId]);

  const getCurrentUserReaction = useCallback((message: any): string => {
    if (!viewerId) return '';
    const merged = getMergedReactionsForMessage(message);
    return typeof merged[viewerId] === 'string' ? merged[viewerId] : '';
  }, [getMergedReactionsForMessage, viewerId]);

  const applyReactionForMessage = useCallback(async (message: any, emoji: string) => {
    const messageId = String(message?.messageId || '');
    if (!viewerId || !conversationId || !messageId || !emoji) return;

    const merged = getMergedReactionsForMessage(message);
    const current = typeof merged[viewerId] === 'string' ? merged[viewerId] : '';
    const nextEmoji = current === emoji ? null : emoji;

    setLocalReactions((prev) => ({ ...prev, [messageId]: nextEmoji }));

    const reactionPatch = nextEmoji
      ? {
          ['reactions.' + viewerId]: nextEmoji,
          updatedAt: serverTimestamp(),
        }
      : {
          ['reactions.' + viewerId]: deleteField(),
          updatedAt: serverTimestamp(),
        };

    try {
      const candidateDocId = String(message?.__docId || message?._docId || messageId);
      const primaryRef = doc(db, 'conversations', conversationId, 'messages', candidateDocId);
      await updateDoc(primaryRef, reactionPatch);
      setLocalReactions((prev) => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
    } catch (error: any) {
      const errorCode = String(error?.code || '');
      const canTryFallback = errorCode.includes('not-found') || errorCode.includes('NOT_FOUND');

      if (canTryFallback) {
        try {
          const messagesRef = collection(db, 'conversations', conversationId, 'messages');
          const fallbackQuery = query(messagesRef, where('messageId', '==', messageId), limit(1));
          const fallbackSnap = await getDocs(fallbackQuery);
          if (!fallbackSnap.empty) {
            const fallbackRef = doc(db, 'conversations', conversationId, 'messages', fallbackSnap.docs[0].id);
            await updateDoc(fallbackRef, reactionPatch);
            setLocalReactions((prev) => {
              const next = { ...prev };
              delete next[messageId];
              return next;
            });
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback reaction update failed:', fallbackError);
        }
      }

      setLocalReactions((prev) => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
      console.error('Failed to apply reaction:', error);
    }
  }, [conversationId, getMergedReactionsForMessage, viewerId]);

  return {
    localReactions,
    getMergedReactionsForMessage,
    getCurrentUserReaction,
    applyReactionForMessage,
  };
}
