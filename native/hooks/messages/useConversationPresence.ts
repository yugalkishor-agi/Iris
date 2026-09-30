// useConversationPresence.ts
// Purpose: Manage user presence (online status, typing indicators) DISABLED FOR LIST
// Extracted from: MessagesScreenEnhanced.tsx — Session 002
// Note: Original implementation intentionally disabled presence on list screen for performance

import { useEffect, useRef, useState } from 'react';

interface PresenceData {
  [userId: string]: {
    isOnline?: boolean;
    lastSeen?: any;
  };
}

interface TypingData {
  [conversationId: string]: boolean;
}

export function useConversationPresence() {
  // Intentionally kept empty for list screen performance
  // Presence is handled per-conversation in ChatScreen
  const [presenceUsers] = useState<PresenceData>({});
  const [typingConvos] = useState<TypingData>({});
  
  const presenceUnsubsRef = useRef<{ [userId: string]: () => void }>({});
  const typingUnsubsRef = useRef<{ [conversationId: string]: () => void }>({});

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Unsubscribe all presence listeners
      Object.values(presenceUnsubsRef.current).forEach((unsub) => unsub());
      presenceUnsubsRef.current = {};

      // Unsubscribe all typing listeners  
      Object.values(typingUnsubsRef.current).forEach((unsub) => unsub());
      typingUnsubsRef.current = {};
    };
  }, []);

  return {
    presenceUsers,
    typingConvos,
  };
}
