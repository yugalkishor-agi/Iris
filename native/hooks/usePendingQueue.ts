import { useState, useCallback } from 'react';

export type PendingMessage = {
  messageId: string;
  text: string;
  createdAt: number;
  senderId: string;
  status: 'pending' | 'failed';
  replyTo?: any;
  mediaURL?: string;
  mediaType?: string;
  type?: string;
};

type UsePendingQueueReturn = {
  pendingMessages: PendingMessage[];
  enqueue: (text: string, senderId: string, replyTo?: any, media?: { mediaURL?: string; mediaType?: string; type?: string }) => string;
  markSent: (tempId: string) => void;
  markFailed: (tempId: string) => void;
};

export function usePendingQueue(): UsePendingQueueReturn {
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);

  const enqueue = useCallback((text: string, senderId: string, replyTo?: any, media?: { mediaURL?: string; mediaType?: string; type?: string }) => {
    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setPendingMessages((prev) => [
      ...prev,
      {
        messageId: tempId,
        text,
        createdAt: Date.now(),
        senderId,
        status: 'pending',
        replyTo,
        mediaURL: media?.mediaURL,
        mediaType: media?.mediaType,
        type: media?.type || media?.mediaType,
      },
    ]);
    return tempId;
  }, []);

  const markSent = useCallback((tempId: string) => {
    setPendingMessages((prev) => prev.filter((m) => m.messageId !== tempId));
  }, []);

  const markFailed = useCallback((tempId: string) => {
    setPendingMessages((prev) => prev.map((m) => (m.messageId === tempId ? { ...m, status: 'failed' } : m)));
  }, []);

  return { pendingMessages, enqueue, markSent, markFailed };
}

