import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onSnapshot, collection, query, where, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../../../src/config/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { Message } from '../../../src/types/database';

interface MessageNotification {
  id: string;
  conversationId: string;
  senderUsername: string;
  senderAvatarURL?: string;
  text: string;
  timestamp: Date;
}

export function MessageNotificationPopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());

  // Load muted users
  useEffect(() => {
    if (!user) return;

    const mutedRef = collection(db, `users/${user.userId}/mutedUsers`);
    const unsubscribe = onSnapshot(mutedRef, (snapshot) => {
      const muted = new Set(snapshot.docs.map(doc => doc.data().userId));
      setMutedUsers(muted);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for new messages
  useEffect(() => {
    if (!user) return;

    // Get all conversations user is part of
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participantIds', 'array-contains', user.userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const convData = change.doc.data();
          const convId = change.doc.id;

          if (!convData.lastMessage || convData.lastMessage.senderId === user.userId) return;
        
          // Check if conversation is muted
          const isMuted = convData.mutedBy?.[user.userId]?.isMuted;
          if (isMuted) return; // Don't show notification for muted chats

          // Check if message is unread
          const unreadCount = convData.unreadCount?.[user.userId] || 0;
          if (unreadCount > 0) {
            const notification: MessageNotification = {
              id: `${convId}-${Date.now()}`,
              conversationId: convId,
              senderUsername: convData.lastMessage.senderUsername || 'Someone',
              senderAvatarURL: convData.lastMessage.senderAvatarURL,
              text: convData.lastMessage.text || 'Sent a message',
              timestamp: new Date(),
            };
            
            setNotifications((prev) => [notification, ...prev].slice(0, 3));
            
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
              setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
            }, 5000);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  const handleNotificationClick = (notification: MessageNotification) => {
    navigate(`/chat/${notification.conversationId}`);
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  };

  const handleDismiss = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => handleNotificationClick(notification)}
          className="bg-background border shadow-lg rounded-lg p-4 cursor-pointer hover:shadow-xl transition-all animate-in slide-in-from-right duration-300"
        >
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={notification.senderAvatarURL} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20">
                {notification.senderUsername[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm truncate">
                  {notification.senderUsername}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(notification.id);
                  }}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {notification.text}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Just now
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
