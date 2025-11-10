import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserSettings {
  theme: 'auto' | 'light' | 'dark';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  layoutStyle: 'grid' | 'list' | 'masonry';
  language: string;
  region: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notificationsEnabled: boolean;
  showOnlineStatus: boolean;
  allowMessageRequests: boolean;
}

export interface PrivacySettings {
  isPrivate: boolean;
  whoCanSeeStories: 'everyone' | 'followers' | 'closeFriends';
  whoCanComment: 'everyone' | 'following' | 'followers' | 'off';
  whoCanTag: 'everyone' | 'following' | 'followers';
  whoCanMessage: 'everyone' | 'followers';
  showActivityStatus: boolean;
  showReadReceipts: boolean;
  hideLastSeen: boolean;
  hideOnlineStatus: boolean;
  profileVisibility: 'everyone' | 'followers' | 'nobody';
  shareLocation: boolean;
  hideLikeCounts: boolean;
}

export interface NotificationPreferences {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  mentions: boolean;
  stories: boolean;
  liveVideos: boolean;
  reels: boolean;
  messages: boolean;
  messageRequests: boolean;
  reminders: boolean;
  productUpdates: boolean;
}

export interface ContentFilter {
  hiddenWords: string[];
  hideOffensiveComments: boolean;
  filterDMs: boolean;
  restrictedAccounts: string[];
}

export class SettingsService {
  // ==========================================
  // USER SETTINGS
  // ==========================================

  /**
   * Get user settings
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const userData = userSnap.data();
    return userData.settings || this.getDefaultSettings();
  }

  /**
   * Update user settings
   */
  async updateSettings(
    userId: string,
    settings: Partial<UserSettings>
  ): Promise<void> {
    const userRef = doc(db, 'users', userId);

    const updates: any = {};
    Object.keys(settings).forEach((key) => {
      updates[`settings.${key}`] = settings[key as keyof UserSettings];
    });

    updates.updatedAt = serverTimestamp();

    await updateDoc(userRef, updates);
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): UserSettings {
    return {
      theme: 'auto',
      accentColor: '#0891b2', // Teal
      fontSize: 'medium',
      layoutStyle: 'grid',
      language: 'en',
      region: 'US',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      notificationsEnabled: true,
      showOnlineStatus: true,
      allowMessageRequests: true,
    };
  }

  // ==========================================
  // PRIVACY SETTINGS
  // ==========================================

  /**
   * Get privacy settings
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    const privacyRef = doc(db, `users/${userId}/privacySettings/main`);
    const privacySnap = await getDoc(privacyRef);

    if (!privacySnap.exists()) {
      return this.getDefaultPrivacySettings();
    }

    return privacySnap.data() as PrivacySettings;
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    privacy: Partial<PrivacySettings>
  ): Promise<void> {
    const privacyRef = doc(db, `users/${userId}/privacySettings/main`);

    await setDoc(
      privacyRef,
      {
        ...privacy,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Also update isPrivate in main user document
    if (privacy.isPrivate !== undefined) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isPrivate: privacy.isPrivate,
        updatedAt: serverTimestamp(),
      });
    }
  }

  /**
   * Get default privacy settings
   */
  private getDefaultPrivacySettings(): PrivacySettings {
    return {
      isPrivate: false,
      whoCanSeeStories: 'followers',
      whoCanComment: 'everyone',
      whoCanTag: 'everyone',
      whoCanMessage: 'everyone',
      showActivityStatus: true,
      showReadReceipts: true,
      hideLastSeen: false,
      hideOnlineStatus: false,
      profileVisibility: 'everyone',
      shareLocation: false,
      hideLikeCounts: false,
    };
  }

  // ==========================================
  // NOTIFICATION PREFERENCES
  // ==========================================

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(
    userId: string
  ): Promise<NotificationPreferences> {
    const notifRef = doc(db, `users/${userId}/notificationPreferences/main`);
    const notifSnap = await getDoc(notifRef);

    if (!notifSnap.exists()) {
      return this.getDefaultNotificationPreferences();
    }

    return notifSnap.data() as NotificationPreferences;
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    prefs: Partial<NotificationPreferences>
  ): Promise<void> {
    const notifRef = doc(db, `users/${userId}/notificationPreferences/main`);

    await setDoc(
      notifRef,
      {
        ...prefs,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  /**
   * Get default notification preferences
   */
  private getDefaultNotificationPreferences(): NotificationPreferences {
    return {
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
      stories: true,
      liveVideos: true,
      reels: true,
      messages: true,
      messageRequests: true,
      reminders: true,
      productUpdates: false,
    };
  }

  // ==========================================
  // BLOCKED USERS
  // ==========================================

  /**
   * Get blocked users list
   */
  async getBlockedUsers(userId: string): Promise<Array<{
    userId: string;
    blockedAt: any;
  }>> {
    const blockedRef = collection(db, `users/${userId}/blockedUsers`);
    const snapshot = await getDocs(blockedRef);

    return snapshot.docs.map((doc) => doc.data() as any);
  }

  /**
   * Block a user
   */
  async blockUser(userId: string, targetUserId: string): Promise<void> {
    const blockedRef = doc(db, `users/${userId}/blockedUsers/${targetUserId}`);

    await setDoc(blockedRef, {
      userId: targetUserId,
      blockedAt: serverTimestamp(),
    });
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string, targetUserId: string): Promise<void> {
    const blockedRef = doc(db, `users/${userId}/blockedUsers/${targetUserId}`);
    await deleteDoc(blockedRef);
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(userId: string, targetUserId: string): Promise<boolean> {
    const blockedRef = doc(db, `users/${userId}/blockedUsers/${targetUserId}`);
    const blockedSnap = await getDoc(blockedRef);
    return blockedSnap.exists();
  }

  // ==========================================
  // MUTED USERS
  // ==========================================

  /**
   * Get muted users list
   */
  async getMutedUsers(userId: string): Promise<Array<{
    userId: string;
    mutedAt: any;
    mutedUntil: any;
  }>> {
    const mutedRef = collection(db, `users/${userId}/mutedUsers`);
    const snapshot = await getDocs(mutedRef);

    return snapshot.docs.map((doc) => doc.data() as any);
  }

  /**
   * Mute a user
   */
  async muteUser(
    userId: string,
    targetUserId: string,
    duration?: number // in milliseconds
  ): Promise<void> {
    const mutedRef = doc(db, `users/${userId}/mutedUsers/${targetUserId}`);

    await setDoc(mutedRef, {
      userId: targetUserId,
      mutedAt: serverTimestamp(),
      mutedUntil: duration ? new Date(Date.now() + duration) : null,
    });
  }

  /**
   * Unmute a user
   */
  async unmuteUser(userId: string, targetUserId: string): Promise<void> {
    const mutedRef = doc(db, `users/${userId}/mutedUsers/${targetUserId}`);
    await deleteDoc(mutedRef);
  }

  // ==========================================
  // CLOSE FRIENDS
  // ==========================================

  /**
   * Get close friends list
   */
  async getCloseFriends(userId: string): Promise<string[]> {
    const closeFriendsRef = collection(db, `users/${userId}/closeFriends`);
    const snapshot = await getDocs(closeFriendsRef);

    return snapshot.docs.map((doc) => doc.id);
  }

  /**
   * Add to close friends
   */
  async addCloseFriend(userId: string, friendId: string): Promise<void> {
    const closeFriendRef = doc(db, `users/${userId}/closeFriends/${friendId}`);

    await setDoc(closeFriendRef, {
      userId: friendId,
      addedAt: serverTimestamp(),
    });
  }

  /**
   * Remove from close friends
   */
  async removeCloseFriend(userId: string, friendId: string): Promise<void> {
    const closeFriendRef = doc(db, `users/${userId}/closeFriends/${friendId}`);
    await deleteDoc(closeFriendRef);
  }

  /**
   * Check if user is close friend
   */
  async isCloseFriend(userId: string, friendId: string): Promise<boolean> {
    const closeFriendRef = doc(db, `users/${userId}/closeFriends/${friendId}`);
    const closeFriendSnap = await getDoc(closeFriendRef);
    return closeFriendSnap.exists();
  }

  // ==========================================
  // CONTENT FILTERS
  // ==========================================

  /**
   * Get content filters
   */
  async getContentFilters(userId: string): Promise<ContentFilter> {
    const filterRef = doc(db, `users/${userId}/contentFilters/main`);
    const filterSnap = await getDoc(filterRef);

    if (!filterSnap.exists()) {
      return this.getDefaultContentFilters();
    }

    return filterSnap.data() as ContentFilter;
  }

  /**
   * Update content filters
   */
  async updateContentFilters(
    userId: string,
    filters: Partial<ContentFilter>
  ): Promise<void> {
    const filterRef = doc(db, `users/${userId}/contentFilters/main`);

    await setDoc(
      filterRef,
      {
        ...filters,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  /**
   * Get default content filters
   */
  private getDefaultContentFilters(): ContentFilter {
    return {
      hiddenWords: [],
      hideOffensiveComments: false,
      filterDMs: false,
      restrictedAccounts: [],
    };
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  /**
   * Get active sessions for user
   */
  async getActiveSessions(userId: string): Promise<any[]> {
    const sessionsRef = collection(db, `users/${userId}/sessions`);
    const snapshot = await getDocs(sessionsRef);
    
    return snapshot.docs.map(doc => ({
      sessionId: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Create new session
   */
  async createSession(userId: string, device: string, location: string): Promise<string> {
    const sessionRef = doc(collection(db, `users/${userId}/sessions`));
    const sessionId = sessionRef.id;
    
    await setDoc(sessionRef, {
      device,
      location,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    });
    
    return sessionId;
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(userId: string, sessionId: string): Promise<void> {
    const sessionRef = doc(db, `users/${userId}/sessions/${sessionId}`);
    await updateDoc(sessionRef, {
      lastActive: serverTimestamp(),
    });
  }

  /**
   * End a specific session
   */
  async endSession(userId: string, sessionId: string): Promise<void> {
    const sessionRef = doc(db, `users/${userId}/sessions/${sessionId}`);
    await deleteDoc(sessionRef);
  }

  /**
   * End all sessions except current
   */
  async endAllSessions(userId: string, currentSessionId?: string): Promise<void> {
    const sessionsRef = collection(db, `users/${userId}/sessions`);
    const snapshot = await getDocs(sessionsRef);
    
    const deletePromises = snapshot.docs
      .filter(doc => !currentSessionId || doc.id !== currentSessionId)
      .map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
  }

  // ==========================================
  // DATA EXPORT
  // ==========================================

  /**
   * Request data export
   */
  async requestDataExport(userId: string): Promise<void> {
    const exportRef = doc(collection(db, `users/${userId}/dataExports`));
    
    await setDoc(exportRef, {
      status: 'pending',
      requestedAt: serverTimestamp(),
      format: 'json',
    });
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      dataExportRequested: true,
      dataExportRequestedAt: serverTimestamp(),
    });
  }

  /**
   * Get data export status
   */
  async getDataExportStatus(userId: string): Promise<any[]> {
    const exportsRef = collection(db, `users/${userId}/dataExports`);
    const snapshot = await getDocs(exportsRef);
    
    return snapshot.docs.map(doc => ({
      exportId: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Download data export
   */
  async downloadDataExport(userId: string, exportId: string): Promise<any> {
    const exportRef = doc(db, `users/${userId}/dataExports/${exportId}`);
    const exportSnap = await getDoc(exportRef);
    
    if (!exportSnap.exists()) {
      throw new Error('Export not found');
    }
    
    return exportSnap.data();
  }

  // ==========================================
  // HIDDEN WORDS
  // ==========================================

  /**
   * Get hidden words list
   */
  async getHiddenWords(userId: string): Promise<string[]> {
    const settingsRef = doc(db, 'settings', userId);
    const settingsSnap = await getDoc(settingsRef);
    return settingsSnap.exists() ? ((settingsSnap.data() as any).hiddenWords || []) : [];
  }

  /**
   * Add a word to hidden words list
   */
  async addHiddenWord(userId: string, word: string): Promise<void> {
    const settingsRef = doc(db, 'settings', userId);
    const settingsSnap = await getDoc(settingsRef);
    const currentWords = settingsSnap.exists() ? ((settingsSnap.data() as any).hiddenWords || []) : [];
    
    if (!currentWords.includes(word.toLowerCase())) {
      await updateDoc(settingsRef, {
        hiddenWords: [...currentWords, word.toLowerCase()],
      });
    }
  }

  /**
   * Remove a word from hidden words list
   */
  async removeHiddenWord(userId: string, word: string): Promise<void> {
    const settingsRef = doc(db, 'settings', userId);
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) return;
    
    const currentWords = (settingsSnap.data() as any).hiddenWords || [];
    await updateDoc(settingsRef, {
      hiddenWords: currentWords.filter((w: string) => w !== word.toLowerCase()),
    });
  }

  // ==========================================
  // TWO-FACTOR AUTHENTICATION
  // ==========================================

  /**
   * Enable 2FA for user
   */
  async enable2FA(userId: string): Promise<{ secret: string; qrCode: string }> {
    // Generate secret key (in production, use a proper 2FA library like speakeasy)
    const secret = this.generateSecret();
    
    const twoFactorRef = doc(db, `users/${userId}/security/twoFactor`);
    await setDoc(twoFactorRef, {
      enabled: true,
      secret,
      enabledAt: serverTimestamp(),
      backupCodes: this.generateBackupCodes(),
    });
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      twoFactorEnabled: true,
      updatedAt: serverTimestamp(),
    });
    
    return {
      secret,
      qrCode: `otpauth://totp/Iris:${userId}?secret=${secret}&issuer=Iris`,
    };
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId: string): Promise<void> {
    const twoFactorRef = doc(db, `users/${userId}/security/twoFactor`);
    await updateDoc(twoFactorRef, {
      enabled: false,
      disabledAt: serverTimestamp(),
    });
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      twoFactorEnabled: false,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Verify 2FA code
   */
  async verify2FACode(userId: string, code: string): Promise<boolean> {
    const twoFactorRef = doc(db, `users/${userId}/security/twoFactor`);
    const twoFactorSnap = await getDoc(twoFactorRef);
    
    if (!twoFactorSnap.exists()) return false;
    
    const { secret } = twoFactorSnap.data();
    // In production, use a proper 2FA library to verify the code
    return this.verifyTOTP(secret, code);
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }

  /**
   * Generate secret key
   */
  private generateSecret(): string {
    return Math.random().toString(36).substring(2, 18).toUpperCase();
  }

  /**
   * Verify TOTP code (simplified version)
   */
  private verifyTOTP(secret: string, code: string): boolean {
    // In production, use a proper TOTP library like speakeasy
    // This is a simplified placeholder
    return code.length === 6;
  }


  // ==========================================
  // ACCOUNT MANAGEMENT
  // ==========================================

  /**
   * Deactivate account
   */
  async deactivateAccount(userId: string, reason?: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isActive: false,
      deactivatedAt: serverTimestamp(),
      deactivationReason: reason || '',
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Reactivate account
   */
  async reactivateAccount(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isActive: true,
      reactivatedAt: serverTimestamp(),
      deactivatedAt: null,
      deactivationReason: null,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Delete account permanently
   */
  async deleteAccount(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // In production, this would trigger a cloud function to:
    // 1. Delete all user data (posts, comments, messages, etc.)
    // 2. Remove from all followers/following lists
    // 3. Delete media files from storage
    // 4. Anonymize any required data for legal compliance
  }

  // ==========================================
  // PROFESSIONAL ACCOUNT
  // ==========================================

  /**
   * Switch to professional account
   */
  async switchToProfessional(userId: string, category: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      accountType: 'professional',
      professionalCategory: category,
      switchedToProfessionalAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Switch to personal account
   */
  async switchToPersonal(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      accountType: 'personal',
      professionalCategory: null,
      updatedAt: serverTimestamp(),
    });
  }
}

// Export singleton instance
export const settingsService = new SettingsService();
