/**
 * Multi-Account Management Service
 * Handles storage, encryption, and switching of up to 3 accounts
 */

import { auth, db } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageService } from './storage.service';
import { authService } from './auth.service';

// Storage keys
const STORAGE_KEYS = {
  ACCOUNTS: 'iris_accounts',
  ACTIVE_ACCOUNT: 'iris_active_account',
  LAST_SWITCH: 'iris_last_switch',
  ENCRYPTION_KEY: 'iris_enc_key'
};

// Maximum accounts allowed
const MAX_ACCOUNTS = 3;

// Rate limiting: minimum time between switches (milliseconds)
const SWITCH_COOLDOWN = 2000; // 2 seconds

export interface StoredAccount {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  avatarURL?: string;
  verified: boolean;
  lastActive: number;
  encryptedToken?: string; // Encrypted refresh token
  encryptedPassword?: string; // Encrypted password for seamless switching
}

interface AccountsData {
  accounts: StoredAccount[];
  activeAccountId: string;
}

class MultiAccountService {
  private encryptionKey: CryptoKey | null = null;

  /**
   * Initialize encryption key for token storage
   */
  private async initEncryption(): Promise<void> {
    if (this.encryptionKey) return;

    try {
      // Try to load existing key
      const storedKey = await AsyncStorage.getItem(STORAGE_KEYS.ENCRYPTION_KEY);
      
      if (storedKey) {
        // Import existing key
        const keyData = JSON.parse(storedKey);
        this.encryptionKey = await crypto.subtle.importKey(
          'jwk',
          keyData,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new key
        this.encryptionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );

        // Export and store key
        const exportedKey = await crypto.subtle.exportKey('jwk', this.encryptionKey);
        await AsyncStorage.setItem(STORAGE_KEYS.ENCRYPTION_KEY, JSON.stringify(exportedKey));
      }
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw new Error('Encryption initialization failed');
    }
  }

  /**
   * Encrypt a token using AES-GCM
   */
  private async encryptToken(token: string): Promise<string> {
    await this.initEncryption();
    if (!this.encryptionKey) throw new Error('Encryption key not initialized');

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        data
      );

      // Combine IV + encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Token encryption failed');
    }
  }

  /**
   * Decrypt a token using AES-GCM
   */
  private async decryptToken(encryptedToken: string): Promise<string> {
    await this.initEncryption();
    if (!this.encryptionKey) throw new Error('Encryption key not initialized');

    try {
      // Decode from base64
      const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);

      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encryptedData
      );

      // Convert to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Token decryption failed');
    }
  }

  /**
   * Get all stored accounts
   */
  async getAccounts(): Promise<StoredAccount[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (!data) return [];
      
      const accountsData: AccountsData = JSON.parse(data);
      return accountsData.accounts || [];
    } catch (error) {
      console.error('Failed to get accounts:', error);
      return [];
    }
  }

  /**
   * Get active account ID
   */
  async getActiveAccountId(): Promise<string | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (!data) return null;
      
      const parsed: AccountsData = JSON.parse(data);
      return parsed.activeAccountId || null;
    } catch (error) {
      console.error('Failed to get active account ID:', error);
      return null;
    }
  }

  /**
   * Get active account details
   */
  async getActiveAccount(): Promise<StoredAccount | null> {
    const accounts = await this.getAccounts();
    const activeId = await this.getActiveAccountId();
    
    if (!activeId) return null;
    
    return accounts.find((acc: any) => acc.userId === activeId) || null;
  }

  /**
   * Check if we can add more accounts
   */
  async canAddAccount(): Promise<boolean> {
    const accounts = await this.getAccounts();
    return accounts.length < MAX_ACCOUNTS;
  }

  /**
   * Check rate limiting for account switching
   */
  async canSwitch(): Promise<boolean> {
    try {
      const lastSwitch = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SWITCH);
      if (!lastSwitch) return true;

      const timeSinceLastSwitch = Date.now() - parseInt(lastSwitch, 10);
      return timeSinceLastSwitch >= SWITCH_COOLDOWN;
    } catch {
      return true;
    }
  }

  /**
   * Add a new account
   */
  async addAccount(
    email: string,
    password: string
  ): Promise<{ success: boolean; account?: StoredAccount; error?: string }> {
    try {
      // Check account limit
      if (!(await this.canAddAccount())) {
        return { success: false, error: 'Maximum 3 accounts allowed' };
      }

      // Sign in to verify credentials
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        return { success: false, error: 'User profile not found' };
      }

      const userData = userDoc.data();

      // Check if account already exists
      if (await this.hasAccount(firebaseUser.uid)) {
        return { success: false, error: 'Account already added' };
      }

      // Get refresh token (Firebase automatically handles this)
      const refreshToken = await firebaseUser.getIdToken();
      const encryptedToken = await this.encryptToken(refreshToken);
      
      // Also encrypt password for seamless account switching
      const encryptedPassword = await this.encryptToken(password);

      // Create stored account
      const newAccount: StoredAccount = {
        userId: firebaseUser.uid,
        username: userData.username,
        email: firebaseUser.email || email,
        displayName: userData.displayName || userData.username,
        avatarURL: userData.avatarURL,
        verified: userData.verified || false,
        lastActive: Date.now(),
        encryptedToken,
        encryptedPassword
      };

      // Add to storage
      const accounts = await this.getAccounts();
      accounts.push(newAccount);

      const accountsData: AccountsData = {
        accounts,
        activeAccountId: (await this.getActiveAccountId()) || newAccount.userId
      };

      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accountsData));

      console.log('✅ Account added successfully:', newAccount.username);
      return { success: true, account: newAccount };

    } catch (error: any) {
      console.error('❌ Failed to add account:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to add account' 
      };
    }
  }

  /**
   * Check if account exists
   */
  async hasAccount(userId: string): Promise<boolean> {
    const accounts = await this.getAccounts();
    return accounts.find((acc: any) => acc.userId === userId) !== undefined;
  }

  /**
   * Remove an account
   */
  async removeAccount(userId: string): Promise<boolean> {
    try {
      const accounts = await this.getAccounts();
      const activeId = await this.getActiveAccountId();
      
      if (accounts.length === 0) return false;
      
      const updatedAccounts = accounts.filter((acc: any) => acc.userId !== userId);
      
      // If removing active account, switch to another or clear
      let newActiveId = activeId;
      if (activeId === userId) {
        newActiveId = updatedAccounts.length > 0 ? updatedAccounts[0].userId : '';
        
        // Sign out current user if removing active account
        await authService.signOut();
      }
      
      const accountsData: AccountsData = {
        accounts: updatedAccounts,
        activeAccountId: newActiveId || ''
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accountsData));
      console.log('✅ Account removed:', userId);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to remove account:', error);
      return false;
    }
  }

  /**
   * Switch to a different account
   */
  async switchAccount(
    targetUserId: string,
    biometricVerified: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check rate limiting
      if (!(await this.canSwitch())) {
        return { 
          success: false, 
          error: 'Please wait before switching accounts again' 
        };
      }

      const accounts = await this.getAccounts();
      const targetAccount = accounts.find((acc: any) => acc.userId === targetUserId);

      if (!targetAccount) {
        return { success: false, error: 'Account not found' };
      }

      // Biometric check (if required and not already verified)
      if (!biometricVerified) {
        // Biometric verification will be handled by caller
        return { success: false, error: 'biometric_required' };
      }

      const previousActiveId = await this.getActiveAccountId();

      // Sign out current user first
      await authService.signOut();

      // Try to switch using encrypted password if available
      if (targetAccount.encryptedPassword) {
        try {
          // Decrypt password
          const decryptedPassword = await this.decryptToken(targetAccount.encryptedPassword);
          
          // Sign in with password
          await signInWithEmailAndPassword(auth, targetAccount.email, decryptedPassword);
          console.log('✅ Signed in with password for:', targetAccount.username);
        } catch (error: any) {
          console.error('❌ Password sign-in failed:', error);
          return { 
            success: false, 
            error: 'Authentication failed. Please login again with this account.' 
          };
        }
      } else if (targetAccount.encryptedToken) {
        // Fallback: Try using refresh token
        console.log('⚠️ No password available, attempting token refresh...');
        try {
          const token = await this.decryptToken(targetAccount.encryptedToken);
          // Note: Firebase Web SDK doesn't support direct token sign-in
          // User will need to re-login this account
          return {
            success: false,
            error: 'Please login again with this account to enable switching.'
          };
        } catch (error) {
          return {
            success: false,
            error: 'No stored credentials. Please login again.'
          };
        }
      } else {
        return {
          success: false,
          error: 'No stored credentials. Please login again with this account.'
        };
      }

      // Update active account and lastActive time
      const accountsData: AccountsData = {
        accounts: accounts.map((acc: any) => 
          acc.userId === targetUserId 
            ? { ...acc, lastActive: Date.now() }
            : acc
        ),
        activeAccountId: targetUserId
      };

      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accountsData));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SWITCH, Date.now().toString());

      // Handle storage switch (clear old cache, load new cache)
      if (previousActiveId && previousActiveId !== targetUserId) {
        await storageService.handleAccountSwitch(previousActiveId, targetUserId);
      }

      console.log('✅ Switched to account:', targetAccount.username);
      return { success: true };

    } catch (error: any) {
      console.error('❌ Failed to switch account:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to switch account' 
      };
    }
  }

  /**
   * Get next account in rotation (for quick double-tap switch)
   */
  async getNextAccount(): Promise<StoredAccount | null> {
    const accounts = await this.getAccounts();
    const activeId = await this.getActiveAccountId();

    if (accounts.length <= 1) return null;

    const currentIndex = accounts.findIndex((acc: any) => acc.userId === activeId);
    const nextIndex = (currentIndex + 1) % accounts.length;
    
    return accounts[nextIndex];
  }

  /**
   * Clear all accounts (logout all)
   */
  async clearAllAccounts(): Promise<void> {
    try {
      await authService.signOut();
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SWITCH);
      await AsyncStorage.removeItem(STORAGE_KEYS.ENCRYPTION_KEY);
      this.encryptionKey = null;
      console.log('✅ All accounts cleared');
    } catch (error) {
      console.error('❌ Failed to clear accounts:', error);
      throw error;
    }
  }

  /**
   * Update account info (avatar, username, etc.)
   */
  async updateAccountInfo(userId: string, updates: Partial<StoredAccount>): Promise<boolean> {
    try {
      const accounts = await this.getAccounts();
      const activeId = await this.getActiveAccountId();

      const updatedAccounts = accounts.map((acc: any) =>
        acc.userId === userId ? { ...acc, ...updates } : acc
      );

      const accountsData: AccountsData = {
        accounts: updatedAccounts,
        activeAccountId: activeId || ''
      };

      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accountsData));
      return true;
    } catch (error) {
      console.error('Failed to update account info:', error);
      return false;
    }
  }
}

// Export singleton instance
export const multiAccountService = new MultiAccountService();



