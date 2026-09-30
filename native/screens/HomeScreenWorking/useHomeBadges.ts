import { useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface UseHomeBadgesParams {
  currentUserId: string | null;
  isFocused: boolean;
  setUnreadNotifications: (val: number | ((prev: number) => number)) => void;
  setUnreadMessages: (val: number | ((prev: number) => number)) => void;
}

export const useHomeBadges = ({
  currentUserId,
  isFocused,
  setUnreadNotifications,
  setUnreadMessages,
}: UseHomeBadgesParams) => {
  useEffect(() => {
    if (!currentUserId || !isFocused) {
      setUnreadMessages(0);
      return;
    }

    const notifQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUserId),
      where('isRead', '==', false),
    );
    const unsubNotifs = onSnapshot(notifQuery, (snap) => {
      let count = 0;
      snap.docs.forEach((d) => {
        if ((d.data() as any)?.type !== 'dm') count += 1;
      });
      setUnreadNotifications(count);
    });

    const convQuery = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', currentUserId),
    );
    const unsubMessages = onSnapshot(
      convQuery,
      (snap) => {
        let count = 0;
        snap.docs.forEach((d) => {
          if (((d.data() as any)?.unreadCounts?.[currentUserId] || 0) > 0) count += 1;
        });
        setUnreadMessages(count);
      },
      () => setUnreadMessages(0),
    );

    return () => {
      unsubNotifs();
      unsubMessages();
    };
  }, [currentUserId, isFocused, setUnreadMessages, setUnreadNotifications]);
};
