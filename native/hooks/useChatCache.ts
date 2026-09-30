import { useCallback, useEffect, useRef, useState } from 'react';
import { messageCacheService } from '../services/messageCache.service';

type Message = any;

type UseChatCacheReturn = {
  cachedMessages: Message[];
  persistCache: (messages: Message[]) => void;
};

export function useChatCache(
  conversationId: string | undefined,
  userId?: string
): UseChatCacheReturn {
  const [cachedMessages, setCachedMessages] = useState<Message[]>([]);
  const persistTimerRef = useRef<NodeJS.Timeout | null>(null);
  const persistSignatureRef = useRef('');

  useEffect(() => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    persistSignatureRef.current = '';
    if (!conversationId || !userId) return;
    let cancelled = false;
    messageCacheService
      .getWithMeta(conversationId, userId)
      .then((val) => {
        if (!cancelled && Array.isArray(val.items)) setCachedMessages(val.items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [conversationId, userId]);

  const persistCache = useCallback((messages: Message[]) => {
    if (!conversationId || !userId || !messages?.length) return;
    const last = messages[messages.length - 1] as any;
    const signature = `${messages.length}:${String(last?.messageId || '')}:${String(last?.status || '')}`;
    if (signature === persistSignatureRef.current) return;

    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => {
      messageCacheService
        .set(conversationId, userId, messages)
        .then(() => {
          persistSignatureRef.current = signature;
        })
        .catch(() => undefined);
    }, 420);
  }, [conversationId, userId]);

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, []);

  return { cachedMessages, persistCache };
}
