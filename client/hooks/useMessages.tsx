import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import { messageService } from '../../src/services/message.service';
import { realtimeService } from '../../src/services/realtime.service';
import type { Conversation, Message } from '../../src/types/database';
import { useAuth } from '../contexts/AuthContext';

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participantIds', 'array-contains', user.userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const convos = snapshot.docs.map(doc => ({
            conversationId: doc.id,
            ...doc.data()
          })) as Conversation[];

          const activeConvos = convos.filter(c => !c.deletedBy?.includes(user.userId));

          activeConvos.sort((a, b) => {
            const aTime = a.lastMessageAt?.seconds || a.createdAt?.seconds || 0;
            const bTime = b.lastMessageAt?.seconds || b.createdAt?.seconds || 0;
            return bTime - aTime;
          });

          setConversations([...activeConvos]);
          setLoading(false);
        } catch (err: any) {
          setError(err.message);
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { conversations, loading, error };
};

export const useMessages = (conversationId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId || !user) return;

    setLoading(true);
    let messagesUnsubscribe: (() => void) | null = null;

    // Listen to conversation to get deletion timestamp
    const conversationRef = doc(db, 'conversations', conversationId);
    const convUnsubscribe = onSnapshot(conversationRef, (convDoc) => {
      if (!convDoc.exists()) {
        setLoading(false);
        return;
      }
      
      const convData = convDoc.data();
      const deletionTimestamps = convData?.deletionTimestamps || {};
      const userDeletionTime = deletionTimestamps[user.userId];

      // Clean up previous messages listener if exists
      if (messagesUnsubscribe) {
        messagesUnsubscribe();
      }

      // Listen to messages
      const messagesRef = collection(db, `conversations/${conversationId}/messages`);
      const q = query(messagesRef, orderBy('createdAt', 'asc'));

      messagesUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let msgs = snapshot.docs.map((doc) => doc.data() as Message);
          
          // Filter messages: if user deleted conversation, only show messages after deletion
          if (userDeletionTime) {
            const deletionTimestamp = userDeletionTime.toMillis ? userDeletionTime.toMillis() : userDeletionTime;
            msgs = msgs.filter((msg) => {
              // If message doesn't have createdAt yet (pending), keep it
              if (!msg.createdAt) return true;
              
              const msgTime = msg.createdAt.toMillis ? msg.createdAt.toMillis() : 0;
              return msgTime > deletionTimestamp;
            });
            console.log(`🗑️ Filtered ${snapshot.docs.length - msgs.length} old messages (deleted at ${new Date(deletionTimestamp).toISOString()})`);
          }
          
          console.log('💬 Messages loaded:', msgs.length);
          setMessages(msgs);
          setLoading(false);
        },
        (err) => {
          console.error('Messages listener error:', err);
          setError(err.message);
          setLoading(false);
        }
      );
    });

    return () => {
      convUnsubscribe();
      if (messagesUnsubscribe) {
        messagesUnsubscribe();
      }
    };
  }, [conversationId, user]);

  const sendMessage = async (
    text: string,
    mediaFile?: File,
    replyTo?: { messageId: string; text?: string; senderId?: string; senderUsername?: string }
  ) => {
    if (!user) throw new Error('Not authenticated');

    try {
      let mediaURL = '';
      if (mediaFile) {
        const { mediaService } = await import('../../src/services/media.service');
        mediaURL = await mediaService.uploadMessageMedia(
          user.userId,
          conversationId,
          mediaFile
        );
      }

      const messageData: any = {
        senderId: user.userId,
        senderUsername: user.username,
        senderAvatarURL: user.avatarURL || '',
        text,
      };

      if (mediaURL) {
        messageData.mediaURL = mediaURL;
        messageData.mediaType = 'image';
      }

      if (replyTo) {
        messageData.replyToMessageId = replyTo.messageId;
        if (replyTo.text) messageData.replyToText = replyTo.text;
        // Store full replyTo object for better reply UI
        (messageData as any).replyTo = {
          messageId: replyTo.messageId,
          text: replyTo.text || '',
          senderId: replyTo.senderId || '',
          senderUsername: replyTo.senderUsername || ''
        };
      }

      await messageService.sendMessage(conversationId, messageData);
    } catch (error) {
      throw error;
    }
  };

  const markAsRead = async () => {
    if (!user) return;
    await messageService.markConversationAsRead(conversationId, user.userId);
  };

  return { messages, loading, error, sendMessage, markAsRead };
};

export const useCreateConversation = () => {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  const createDirectConversation = async (recipientId: string) => {
    if (!user) throw new Error('Not authenticated');

    setCreating(true);
    try {
      const conversationId = await messageService.getOrCreateDirectConversation(
        user.userId,
        recipientId
      );
      return conversationId;
    } catch (error) {
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const createGroupConversation = async (
    participantIds: string[],
    groupName: string,
    groupAvatarFile?: File
  ) => {
    if (!user) throw new Error('Not authenticated');

    setCreating(true);
    try {
      let groupAvatarURL = '';
      if (groupAvatarFile) {
        const { mediaService } = await import('../../src/services/media.service');
        groupAvatarURL = await mediaService.uploadAvatar(user.userId, groupAvatarFile);
      }

      const conversationId = await messageService.createGroupConversation(
        user.userId,
        participantIds,
        groupName,
        groupAvatarURL
      );
      return conversationId;
    } catch (error) {
      throw error;
    } finally {
      setCreating(false);
    }
  };

  return { createDirectConversation, createGroupConversation, creating };
};
