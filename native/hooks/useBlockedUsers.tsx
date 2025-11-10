import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to get real-time list of blocked users
 */
export const useBlockedUsers = () => {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBlockedUsers([]);
      setLoading(false);
      return;
    }

    const blockedRef = collection(db, `users/${user.userId}/blockedUsers`);
    
    const unsubscribe = onSnapshot(
      blockedRef,
      (snapshot) => {
        const blocked = snapshot.docs.map(doc => doc.data().userId as string);
        setBlockedUsers(blocked);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching blocked users:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { blockedUsers, loading };
};
