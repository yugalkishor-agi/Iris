import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../../src/config/firebase';
import { db } from '../../src/config/firebase';
import { authService } from '../../src/services/auth.service';
import { userService } from '../../src/services/user.service';
import { multiAccountService } from '../../src/services/multiAccount.service';
import type { User } from '../../src/types/database';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, username: string, displayName: string, avatarFile?: File) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in - set online status
          await userService.setOnlineStatus(firebaseUser.uid, true);
          
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            // User exists in Auth but not in Firestore
            setUser(null);
          }
          setFirebaseUser(firebaseUser);
        } else {
          // User is signed out
          setUser(null);
          setFirebaseUser(null);
        }
      } catch (error: any) {
        console.error('Auth state change error:', error);
        setUser(null);
        setFirebaseUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle page visibility and online status with heartbeat
  useEffect(() => {
    if (!firebaseUser) return;

    let heartbeatInterval: NodeJS.Timeout;

    const updateOnlineStatus = async (isOnline: boolean) => {
      try {
        await userService.setOnlineStatus(firebaseUser.uid, isOnline);
      } catch (error) {
        console.error('Failed to update online status:', error);
      }
    };

    // Set online immediately
    updateOnlineStatus(true);

    // Send heartbeat every 30 seconds to maintain online status
    heartbeatInterval = setInterval(() => {
      if (!document.hidden) {
        updateOnlineStatus(true);
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized - set offline
        updateOnlineStatus(false);
      } else {
        // User came back - set online
        updateOnlineStatus(true);
      }
    };

    const handleBeforeUnload = () => {
      // User closing tab/browser - set offline (using sendBeacon for reliability)
      navigator.sendBeacon(`/api/offline/${firebaseUser.uid}`);
      updateOnlineStatus(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateOnlineStatus(false);
    };
  }, [firebaseUser]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Check if there are existing accounts before signing in
      const existingAccounts = multiAccountService.getAccounts();
      const hasExistingAccounts = existingAccounts.length > 0;
      
      // Sign in with Firebase
      const { userId } = await authService.signIn(email, password);
      const userData = await userService.getUser(userId);
      
      // DEBUG: Log account details
      console.log('🔐 Sign In Details:', {
        email,
        userId,
        username: userData.username,
        displayName: userData.displayName
      });
      
      setUser(userData);
      
      // Auto-add account to multiAccountService if not already present
      // This handles both: first login and subsequent account additions
      const accountExists = existingAccounts.some(acc => acc.userId === userId);
      
      if (!accountExists) {
        // Add this account to the multi-account storage
        const result = await multiAccountService.addAccount(email, password);
        
        if (result.success) {
          console.log('✅ Account auto-saved to multi-account storage');
        } else {
          console.warn('⚠️ Failed to auto-save account:', result.error);
        }
      } else {
        console.log('ℹ️ Account already exists in multi-account storage, updating active account');
        console.log('📝 Current accounts:', existingAccounts.map(a => ({
          username: a.username,
          userId: a.userId,
          email: a.email
        })));
        
        // Update last active time for existing account
        multiAccountService.updateAccountInfo(userId, {
          lastActive: Date.now()
        });
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      // Check existing accounts
      const existingAccounts = multiAccountService.getAccounts();
      
      const { userId } = await authService.signInWithGoogle();
      const userData = await userService.getUser(userId);
      setUser(userData);
      
      // Auto-add account if not present
      const accountExists = existingAccounts.some(acc => acc.userId === userId);
      
      if (!accountExists) {
        // For Google sign-in, we can't get the password, so we'll store without password
        // The refresh token will be used instead
        console.log('✅ Google account auto-saved to multi-account storage');
        
        // Update account info directly since we can't use addAccount without password
        const accounts = multiAccountService.getAccounts();
        const activeId = multiAccountService.getActiveAccountId();
        
        // Get Firebase user token
        const firebaseUser = auth.currentUser;
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          const encryptedToken = await (multiAccountService as any).encryptToken(token);
          
          accounts.push({
            userId: userData.userId,
            username: userData.username,
            email: userData.email,
            displayName: userData.displayName || userData.username,
            avatarURL: userData.avatarURL,
            verified: userData.verified || false,
            lastActive: Date.now(),
            encryptedToken
          });
          
          localStorage.setItem('iris_accounts', JSON.stringify({
            accounts,
            activeAccountId: activeId || userData.userId
          }));
        }
      } else {
        multiAccountService.updateAccountInfo(userId, {
          lastActive: Date.now()
        });
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
    } catch (error: any) {
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    displayName: string,
    avatarFile?: File
  ) => {
    setLoading(true);
    try {
      const { userId } = await authService.register(email, password, username, displayName, avatarFile);
      const userData = await userService.getUser(userId);
      setUser(userData);
      
      // Auto-add new account to multi-account storage
      const result = await multiAccountService.addAccount(email, password);
      
      if (result.success) {
        console.log('✅ New account auto-saved to multi-account storage');
      } else {
        console.warn('⚠️ Failed to auto-save new account:', result.error);
      }
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Check if there are other accounts before signing out
      const accounts = multiAccountService.getAccounts();
      const currentUserId = user?.userId;
      
      console.log('🚪 Logout initiated:', {
        currentUser: user?.username,
        totalAccounts: accounts.length
      });
      
      // Sign out from Firebase
      await authService.signOut();
      setUser(null);
      setFirebaseUser(null);
      
      // If there are other accounts (more than current one), auto-switch
      if (accounts.length > 1) {
        // Remove current account from list to find next one
        const otherAccounts = accounts.filter(acc => acc.userId !== currentUserId);
        
        if (otherAccounts.length > 0) {
          const nextAccount = otherAccounts[0]; // Get first other account
          
          console.log('🔄 Auto-switching to:', nextAccount.username);
          
          // Switch to next account
          const switchResult = await multiAccountService.switchAccount(
            nextAccount.userId,
            true // Skip biometric for auto-switch
          );
          
          if (switchResult.success) {
            console.log('✅ Auto-switched to next account');
            
            // Show toast notification (use window.dispatchEvent for toast)
            const toastEvent = new CustomEvent('show-toast', {
              detail: {
                title: '🔄 Switched Account',
                description: `Now logged in as @${nextAccount.username}`
              }
            });
            window.dispatchEvent(toastEvent);
            
            // Reload to update UI with new account
            setTimeout(() => window.location.reload(), 500);
            return; // Don't continue to normal logout flow
          } else {
            console.warn('⚠️ Auto-switch failed, continuing normal logout');
          }
        }
      }
      
      // Normal logout flow (no other accounts or switch failed)
      console.log('👋 Logged out completely');
      
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      await userService.updateUser(user.userId, updates);
      const updatedUser = await userService.getUser(user.userId);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!firebaseUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        setUser(userDoc.data() as User);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value = {
    firebaseUser,
    user,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    updateProfile,
    refreshUser,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
