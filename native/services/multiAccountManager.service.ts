// Enhanced Multi-Account Management Service for React Native
// Handles multiple user accounts, switching, and secure storage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './auth.service';
import { userService } from './user.service';

export interface UserAccount {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  avatarURL?: string;
  isVerified: boolean;
  lastLoginAt: number;
  refreshToken?: string;
  accessToken?: string;
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface AccountSwitchOptions {
  preserveSession?: boolean;
  enableBiometric?: boolean;
  syncSettings?: boolean;
}

const STORAGE_KEYS = {
  ACCOUNTS: 'iris_user_accounts',
  ACTIVE_ACCOUNT: 'iris_active_account',
  ACCOUNT_SETTINGS: 'iris_account_settings',
  QUICK_SWITCH: 'iris_quick_switch_enabled',
};

class MultiAccountManagerService {
  private accounts: Map<string, UserAccount> = new Map();
  private activeAccountId: string | null = null;
  private quickSwitchEnabled: boolean = false;

  /**
   * Initialize the multi-account manager
   */
  async initialize(): Promise<void> {
    try {
      // Load saved accounts
      await this.loadAccounts();
      
      // Load active account
      const activeId = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
      if (activeId && this.accounts.has(activeId)) {
        this.activeAccountId = activeId;
      }

      // Load quick switch setting
      const quickSwitch = await AsyncStorage.getItem(STORAGE_KEYS.QUICK_SWITCH);
      this.quickSwitchEnabled = quickSwitch === 'true';

      console.log('✅ Multi-account manager initialized');
      console.log(`📱 Found ${this.accounts.size} saved accounts`);
    } catch (error) {
      console.error('❌ Failed to initialize multi-account manager:', error);
    }
  }

  /**
   * Add a new account to the manager
   */
  async addAccount(
    userCredentials: any,
    options: AccountSwitchOptions = {}
  ): Promise<UserAccount> {
    try {
      const { preserveSession = true, enableBiometric = false } = options;

      // Get user details
      const userDetails = await userService.getUser(userCredentials.userId);
      
      if (!userDetails) {
        throw new Error('Failed to get user details');
      }
      
      const account: UserAccount = {
        userId: userCredentials.userId,
        username: userDetails.username,
        email: userDetails.email,
        displayName: userDetails.displayName,
        avatarURL: userDetails.avatarURL,
        isVerified: userDetails.verified || false,
        lastLoginAt: Date.now(),
        refreshToken: userCredentials.refreshToken,
        accessToken: userCredentials.accessToken,
        biometricEnabled: enableBiometric,
        notificationsEnabled: true,
        theme: 'auto',
        language: 'en',
      };

      // Add to accounts map
      this.accounts.set(account.userId, account);

      // Save to storage
      await this.saveAccounts();

      // Set as active account if it's the first one or requested
      if (this.accounts.size === 1 || !preserveSession) {
        await this.setActiveAccount(account.userId);
      }

      console.log('✅ Account added:', account.username);
      return account;
    } catch (error) {
      console.error('❌ Failed to add account:', error);
      throw error;
    }
  }

  /**
   * Switch to a different account
   */
  async switchAccount(
    userId: string,
    options: AccountSwitchOptions = {}
  ): Promise<boolean> {
    try {
      const { preserveSession = false, syncSettings = true } = options;

      if (!this.accounts.has(userId)) {
        throw new Error('Account not found');
      }

      const account = this.accounts.get(userId)!;

      // Update last login time
      account.lastLoginAt = Date.now();
      this.accounts.set(userId, account);

      // Set as active account
      await this.setActiveAccount(userId);

      // Authenticate with stored tokens if available
      if (account.refreshToken && !preserveSession) {
        try {
          // In production, implement token refresh in auth service
          console.log('Refreshing token for account:', account.username);
        } catch (error) {
          console.warn('⚠️ Failed to refresh token, user needs to re-login');
          // Remove invalid tokens
          account.refreshToken = undefined;
          account.accessToken = undefined;
          this.accounts.set(userId, account);
        }
      }

      // Sync settings if requested
      if (syncSettings) {
        await this.syncAccountSettings(userId);
      }

      await this.saveAccounts();

      console.log('✅ Switched to account:', account.username);
      return true;
    } catch (error) {
      console.error('❌ Failed to switch account:', error);
      return false;
    }
  }

  /**
   * Remove an account from the manager
   */
  async removeAccount(userId: string): Promise<boolean> {
    try {
      if (!this.accounts.has(userId)) {
        return false;
      }

      const account = this.accounts.get(userId)!;
      
      // If removing active account, switch to another one
      if (this.activeAccountId === userId) {
        const remainingAccounts = Array.from(this.accounts.keys()).filter(id => id !== userId);
        if (remainingAccounts.length > 0) {
          await this.setActiveAccount(remainingAccounts[0]);
        } else {
          this.activeAccountId = null;
          await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
        }
      }

      // Remove account
      this.accounts.delete(userId);
      await this.saveAccounts();

      // Clear account-specific data
      await this.clearAccountData(userId);

      console.log('✅ Account removed:', account.username);
      return true;
    } catch (error) {
      console.error('❌ Failed to remove account:', error);
      return false;
    }
  }

  /**
   * Get all managed accounts
   */
  getAllAccounts(): UserAccount[] {
    return Array.from(this.accounts.values()).sort((a, b) => b.lastLoginAt - a.lastLoginAt);
  }

  /**
   * Get the currently active account
   */
  getActiveAccount(): UserAccount | null {
    if (!this.activeAccountId) return null;
    return this.accounts.get(this.activeAccountId) || null;
  }

  /**
   * Check if an account exists
   */
  hasAccount(userId: string): boolean {
    return this.accounts.has(userId);
  }

  /**
   * Update account information
   */
  async updateAccount(userId: string, updates: Partial<UserAccount>): Promise<boolean> {
    try {
      if (!this.accounts.has(userId)) {
        return false;
      }

      const account = this.accounts.get(userId)!;
      const updatedAccount = { ...account, ...updates };
      
      this.accounts.set(userId, updatedAccount);
      await this.saveAccounts();

      console.log('✅ Account updated:', account.username);
      return true;
    } catch (error) {
      console.error('❌ Failed to update account:', error);
      return false;
    }
  }

  /**
   * Enable/disable quick account switching
   */
  async setQuickSwitchEnabled(enabled: boolean): Promise<void> {
    this.quickSwitchEnabled = enabled;
    await AsyncStorage.setItem(STORAGE_KEYS.QUICK_SWITCH, enabled.toString());
  }

  /**
   * Check if quick switch is enabled
   */
  isQuickSwitchEnabled(): boolean {
    return this.quickSwitchEnabled;
  }

  /**
   * Get account by username or email
   */
  findAccount(identifier: string): UserAccount | null {
    for (const account of this.accounts.values()) {
      if (account.username === identifier || account.email === identifier) {
        return account;
      }
    }
    return null;
  }

  /**
   * Sync account settings across devices
   */
  private async syncAccountSettings(userId: string): Promise<void> {
    try {
      const account = this.accounts.get(userId);
      if (!account) return;

      // In production, sync with backend
      // For now, just update local settings
      const settings = {
        theme: account.theme,
        language: account.language,
        notificationsEnabled: account.notificationsEnabled,
      };

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.ACCOUNT_SETTINGS}_${userId}`,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error('Failed to sync account settings:', error);
    }
  }

  /**
   * Set active account
   */
  private async setActiveAccount(userId: string): Promise<void> {
    this.activeAccountId = userId;
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, userId);
  }

  /**
   * Load accounts from storage
   */
  private async loadAccounts(): Promise<void> {
    try {
      const accountsData = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (accountsData) {
        const accountsArray: UserAccount[] = JSON.parse(accountsData);
        this.accounts.clear();
        accountsArray.forEach(account => {
          this.accounts.set(account.userId, account);
        });
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  }

  /**
   * Save accounts to storage
   */
  private async saveAccounts(): Promise<void> {
    try {
      const accountsArray = Array.from(this.accounts.values());
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accountsArray));
    } catch (error) {
      console.error('Failed to save accounts:', error);
    }
  }

  /**
   * Clear account-specific data
   */
  private async clearAccountData(userId: string): Promise<void> {
    try {
      // Clear account settings
      await AsyncStorage.removeItem(`${STORAGE_KEYS.ACCOUNT_SETTINGS}_${userId}`);
      
      // Clear other account-specific data
      const keysToRemove = [
        `user_cache_${userId}`,
        `notifications_${userId}`,
        `drafts_${userId}`,
        `recent_searches_${userId}`,
      ];

      await Promise.all(
        keysToRemove.map(key => AsyncStorage.removeItem(key))
      );
    } catch (error) {
      console.error('Failed to clear account data:', error);
    }
  }

  /**
   * Export account data for backup
   */
  async exportAccountData(userId: string): Promise<any> {
    try {
      const account = this.accounts.get(userId);
      if (!account) return null;

      // Remove sensitive data
      const exportData = {
        ...account,
        refreshToken: undefined,
        accessToken: undefined,
      };

      return exportData;
    } catch (error) {
      console.error('Failed to export account data:', error);
      return null;
    }
  }

  /**
   * Import account data from backup
   */
  async importAccountData(accountData: any): Promise<boolean> {
    try {
      // Validate account data
      if (!accountData.userId || !accountData.username) {
        throw new Error('Invalid account data');
      }

      // Add account (user will need to re-authenticate)
      const account: UserAccount = {
        ...accountData,
        lastLoginAt: Date.now(),
        refreshToken: undefined,
        accessToken: undefined,
      };

      this.accounts.set(account.userId, account);
      await this.saveAccounts();

      console.log('✅ Account imported:', account.username);
      return true;
    } catch (error) {
      console.error('❌ Failed to import account:', error);
      return false;
    }
  }

  /**
   * Clear all accounts (logout all)
   */
  async clearAllAccounts(): Promise<void> {
    try {
      // Clear all account data
      for (const userId of this.accounts.keys()) {
        await this.clearAccountData(userId);
      }

      // Clear accounts
      this.accounts.clear();
      this.activeAccountId = null;

      // Clear storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCOUNTS,
        STORAGE_KEYS.ACTIVE_ACCOUNT,
      ]);

      console.log('✅ All accounts cleared');
    } catch (error) {
      console.error('❌ Failed to clear accounts:', error);
    }
  }
}

// Singleton instance
export const multiAccountManager = new MultiAccountManagerService();

// AccountSwitchOptions is already exported above
