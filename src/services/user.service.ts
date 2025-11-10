import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User, CreateUserData, Following, Follower } from '../types/database';
import { storageService, STORAGE_KEYS } from './storage.service';

export class UserService {
  // ==========================================
  // USER CRUD OPERATIONS
  // ==========================================

  /**
   * Create a new user
   */
  async createUser(userId: string, userData: CreateUserData): Promise<void> {
    const userRef = doc(db, 'users', userId);

    await setDoc(userRef, {
      userId,
      ...userData,
      usernameLowercase: userData.username.toLowerCase(), // For case-insensitive search
      bio: userData.bio || '',
      verified: false,
      accountType: 'personal',
      isPrivate: false,
      isOnline: true,
      lastSeen: serverTimestamp(),
      stats: {
        postsCount: 0,
        storiesCount: 0,
        followersCount: 0,
        followingCount: 0,
        highlightsCount: 0,
      },
      settings: {
        theme: 'auto',
        language: 'en',
        notificationsEnabled: true,
        showOnlineStatus: true,
        allowMessageRequests: true,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Get user by ID or username
   * With caching (1 hour TTL)
   */
  async getUser(userIdOrUsername: string): Promise<User | null> {
    try {
      // Try cache first
      const cacheKey = `${STORAGE_KEYS.USER_SPECIFIC.CACHED_PROFILE}${userIdOrUsername}`;
      const cached = storageService.getSharedData<User>(cacheKey);
      
      if (cached) {
        console.log('⚡ Profile loaded from cache:', cached.username);
        return cached;
      }
      
      // Try by userId first
      const userRef = doc(db, 'users', userIdOrUsername);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const user = { ...userSnap.data(), userId: userSnap.id } as User;
        
        // Cache for 1 hour
        storageService.setSharedData(cacheKey, user);
        console.log('💾 Profile cached:', user.username);
        
        return user;
      }

      // Try by username with multiple fallbacks
      const usersRef = collection(db, 'users');
      
      // Try usernameLowercase (for new users)
      let q = query(usersRef, where('usernameLowercase', '==', userIdOrUsername.toLowerCase()), limit(1));
      let snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const user = { ...snapshot.docs[0].data(), userId: snapshot.docs[0].id } as User;
        
        // Cache username lookup
        storageService.setSharedData(cacheKey, user);
        console.log('💾 Profile cached (username lookup):', user.username);
        
        return user;
      }

      // Try username field (for existing users)
      q = query(usersRef, where('username', '==', userIdOrUsername.toLowerCase()), limit(1));
      snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const user = { ...snapshot.docs[0].data(), userId: snapshot.docs[0].id } as User;
        
        // Cache username lookup
        storageService.setSharedData(cacheKey, user);
        console.log('💾 Profile cached (legacy username):', user.username);
        
        return user;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Update user online status
   */
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp(),
    });
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // If avatar is being updated, update all posts and stories
    if (updates.avatarURL !== undefined) {
      await this.updateUserContentAvatar(userId, updates.avatarURL);
    }
  }

  /**
   * Update user's avatar in all their posts and stories
   */
  async updateUserContentAvatar(userId: string, newAvatarURL: string): Promise<void> {
    const batch = writeBatch(db);
    let updateCount = 0;

    try {
      // Update all posts
      const postsRef = collection(db, 'posts');
      const postsQuery = query(postsRef, where('authorId', '==', userId));
      const postsSnapshot = await getDocs(postsQuery);

      postsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { authorAvatarURL: newAvatarURL });
        updateCount++;
      });

      // Update all stories
      const storiesRef = collection(db, 'stories');
      const storiesQuery = query(storiesRef, where('authorId', '==', userId));
      const storiesSnapshot = await getDocs(storiesQuery);

      storiesSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { authorAvatarURL: newAvatarURL });
        updateCount++;
      });

      // Update all comments
      const commentsRef = collection(db, 'comments');
      const commentsQuery = query(commentsRef, where('authorId', '==', userId));
      const commentsSnapshot = await getDocs(commentsQuery);

      commentsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { authorAvatarURL: newAvatarURL });
        updateCount++;
      });

      if (updateCount > 0) {
        await batch.commit();
        console.log(`Updated avatar in ${updateCount} content items`);
      }
    } catch (error) {
      console.error('Failed to update user content avatar:', error);
      // Don't throw error - avatar update in profile succeeded
    }
  }

  /**
   * Search users by username
   */
  async searchUsers(searchTerm: string, limitCount = 20): Promise<User[]> {
    if (!searchTerm || searchTerm.length < 1) {
      return [];
    }

    const usersRef = collection(db, 'users');
    const searchLower = searchTerm.toLowerCase().trim();
    
    try {
      // Get all users and filter client-side for better search
      const snapshot = await getDocs(query(usersRef, limit(100)));
      const allUsers = snapshot.docs.map((doc) => doc.data() as User);
      
      // Filter users that match username or displayName
      const matchedUsers = allUsers.filter(user => {
        const username = (user.username || '').toLowerCase();
        const displayName = (user.displayName || '').toLowerCase();
        return username.includes(searchLower) || displayName.includes(searchLower);
      });
      
      // Sort by relevance (exact matches first, then starts with, then contains)
      matchedUsers.sort((a, b) => {
        const aUsername = (a.username || '').toLowerCase();
        const bUsername = (b.username || '').toLowerCase();
        const aDisplay = (a.displayName || '').toLowerCase();
        const bDisplay = (b.displayName || '').toLowerCase();
        
        // Exact match
        if (aUsername === searchLower) return -1;
        if (bUsername === searchLower) return 1;
        
        // Starts with
        if (aUsername.startsWith(searchLower) && !bUsername.startsWith(searchLower)) return -1;
        if (bUsername.startsWith(searchLower) && !aUsername.startsWith(searchLower)) return 1;
        if (aDisplay.startsWith(searchLower) && !bDisplay.startsWith(searchLower)) return -1;
        if (bDisplay.startsWith(searchLower) && !aDisplay.startsWith(searchLower)) return 1;
        
        return 0;
      });
      
      return matchedUsers.slice(0, limitCount);
    } catch (error) {
      console.error('Search users error:', error);
      return [];
    }
  }

  /**
   * Update user online status
   */
  async setOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isOnline,
        lastSeen: serverTimestamp(),
      });
    } catch (error) {
      // Silently fail - this is a non-critical background operation
      console.log('Failed to update online status:', error);
    }
  }

  /**
   * Set typing status in conversation
   */
  async setTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    const typingRef = doc(db, `conversations/${conversationId}/typing/${userId}`);
    
    if (isTyping) {
      await setDoc(typingRef, {
        isTyping: true,
        timestamp: serverTimestamp(),
      });
    } else {
      await deleteDoc(typingRef);
    }
  }

  /**
   * Mute user
   */
  async muteUser(userId: string, mutedUserId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const mutedUsers = userDoc.data().mutedUsers || [];
      await updateDoc(userRef, {
        mutedUsers: [...new Set([...mutedUsers, mutedUserId])],
      });
    }
  }

  // ==========================================
  // FOLLOW OPERATIONS
  // ==========================================

  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<void> {
    // Check if already following to prevent duplicates
    const followingRef = doc(db, `users/${followerId}/following/${followingId}`);
    const followingSnap = await getDoc(followingRef);
    
    if (followingSnap.exists()) {
      // Already following, don't increment again
      return;
    }

    // Add to follower's following list
    await setDoc(followingRef, {
      userId: followingId,
      followedAt: serverTimestamp(),
      notificationsEnabled: true,
    });

    // Add to following's followers list
    const followerRef = doc(db, `users/${followingId}/followers/${followerId}`);
    await setDoc(followerRef, {
      userId: followerId,
      followedAt: serverTimestamp(),
      isCloseFriend: false,
    });

    // Update follower count
    const followerUserRef = doc(db, 'users', followerId);
    await updateDoc(followerUserRef, {
      'stats.followingCount': increment(1),
    });

    // Update following count
    const followingUserRef = doc(db, 'users', followingId);
    await updateDoc(followingUserRef, {
      'stats.followersCount': increment(1),
    });

    // Create follow notification with user details
    const followerUser = await this.getUser(followerId);
    
    if (followerUser) {
      const { notificationService } = await import('./notification.service');
      await notificationService.notifyFollow(
        followingId,
        followerId,
        followerUser.username,
        followerUser.avatarURL || ''
      );
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const batch = writeBatch(db);

    // Remove from follower's following list
    const followingRef = doc(db, `users/${followerId}/following/${followingId}`);
    batch.delete(followingRef);

    // Remove from following's followers list
    const followerRef = doc(db, `users/${followingId}/followers/${followerId}`);
    batch.delete(followerRef);

    // Update counts safely (prevent negative)
    const followerUserRef = doc(db, 'users', followerId);
    const followerDoc = await getDoc(followerUserRef);
    const currentFollowingCount = followerDoc.data()?.stats?.followingCount || 0;
    
    if (currentFollowingCount > 0) {
      batch.update(followerUserRef, {
        'stats.followingCount': increment(-1),
      });
    }

    const followingUserRef = doc(db, 'users', followingId);
    const followingDoc = await getDoc(followingUserRef);
    const currentFollowersCount = followingDoc.data()?.stats?.followersCount || 0;
    
    if (currentFollowersCount > 0) {
      batch.update(followingUserRef, {
        'stats.followersCount': increment(-1),
      });
    }

    await batch.commit();
  }

  /**
   * Send follow request to private account
   */
  async sendFollowRequest(requesterId: string, targetUserId: string): Promise<void> {
    const requestRef = doc(db, `users/${targetUserId}/followRequests/${requesterId}`);
    const requesterUser = await this.getUser(requesterId);
    
    if (!requesterUser) {
      throw new Error('Requester not found');
    }
    
    await setDoc(requestRef, {
      userId: requesterId,
      username: requesterUser.username,
      displayName: requesterUser.displayName,
      avatarURL: requesterUser.avatarURL || '',
      requestedAt: serverTimestamp(),
      status: 'pending',
    });
    
    // Send notification to target user
    const { notificationService } = await import('./notification.service');
    await notificationService.createNotification(
      targetUserId,
      'follow_request',
      requesterId,
      requesterUser.username,
      requesterUser.avatarURL || '',
      'user',
      requesterId,
      `${requesterUser.displayName || requesterUser.username} requested to follow you`,
      undefined
    );
  }

  /**
   * Check if user has requested to follow another user
   */
  async hasRequestedFollow(requesterId: string, targetUserId: string): Promise<boolean> {
    const requestRef = doc(db, `users/${targetUserId}/followRequests/${requesterId}`);
    const requestSnap = await getDoc(requestRef);
    return requestSnap.exists() && requestSnap.data()?.status === 'pending';
  }

  /**
   * Cancel follow request
   */
  async cancelFollowRequest(requesterId: string, targetUserId: string): Promise<void> {
    const requestRef = doc(db, `users/${targetUserId}/followRequests/${requesterId}`);
    await deleteDoc(requestRef);
  }

  /**
   * Accept follow request
   */
  async acceptFollowRequest(targetUserId: string, requesterId: string): Promise<void> {
    // First, establish the follow relationship
    await this.followUser(requesterId, targetUserId);
    
    // Then delete the follow request
    const requestRef = doc(db, `users/${targetUserId}/followRequests/${requesterId}`);
    await deleteDoc(requestRef);
  }

  /**
   * Reject follow request
   */
  async rejectFollowRequest(targetUserId: string, requesterId: string): Promise<void> {
    const requestRef = doc(db, `users/${targetUserId}/followRequests/${requesterId}`);
    await deleteDoc(requestRef);
  }

  /**
   * Get pending follow requests for a user
   */
  async getFollowRequests(userId: string): Promise<any[]> {
    const requestsRef = collection(db, `users/${userId}/followRequests`);
    const q = query(requestsRef, where('status', '==', 'pending'), orderBy('requestedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      requestId: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Get user's followers (with caching)
   */
  async getFollowers(userId: string, limitCount = 50): Promise<string[]> {
    const { cacheService } = await import('./cache.service');
    const cacheKey = `followers_${userId}_${limitCount}`;
    
    return cacheService.get(cacheKey, async () => {
      const followersRef = collection(db, `users/${userId}/followers`);
      const q = query(followersRef, orderBy('followedAt', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => doc.id);
    }, 5 * 60 * 1000); // Cache for 5 minutes
  }

  /**
   * Get user's following (with caching)
   */
  async getFollowing(userId: string, limitCount = 50): Promise<string[]> {
    const { cacheService } = await import('./cache.service');
    const cacheKey = `following_${userId}_${limitCount}`;
    
    return cacheService.get(cacheKey, async () => {
      const followingRef = collection(db, `users/${userId}/following`);
      const q = query(followingRef, orderBy('followedAt', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => doc.id);
    }, 5 * 60 * 1000); // Cache for 5 minutes
  }

  // ==========================================
  // CLOSE FRIENDS
  // ==========================================

  /**
   * Add user to close friends
   */
  async addCloseFriend(userId: string, friendId: string): Promise<void> {
    const closeFriendRef = doc(db, `users/${userId}/closeFriends/${friendId}`);
    await setDoc(closeFriendRef, {
      userId: friendId,
      addedAt: serverTimestamp(),
    });

    // Update follower record
    const followerRef = doc(db, `users/${userId}/followers/${friendId}`);
    await updateDoc(followerRef, {
      isCloseFriend: true,
    });
  }

  /**
   * Remove user from close friends
   */
  async removeCloseFriend(userId: string, friendId: string): Promise<void> {
    const closeFriendRef = doc(db, `users/${userId}/closeFriends/${friendId}`);
    await deleteDoc(closeFriendRef);

    // Update follower record
    const followerRef = doc(db, `users/${userId}/followers/${friendId}`);
    await updateDoc(followerRef, {
      isCloseFriend: false,
    });
  }

  /**
   * Get close friends list
   */
  async getCloseFriends(userId: string): Promise<string[]> {
    const closeFriendsRef = collection(db, `users/${userId}/closeFriends`);
    const snapshot = await getDocs(closeFriendsRef);
    return snapshot.docs.map((doc) => doc.id);
  }

  // ==========================================
  // BLOCK OPERATIONS
  // ==========================================

  /**
   * Block a user
   */
  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    const batch = writeBatch(db);

    // Add to blocked list
    const blockedRef = doc(db, `users/${userId}/blockedUsers/${blockedUserId}`);
    batch.set(blockedRef, {
      userId: blockedUserId,
      blockedAt: serverTimestamp(),
    });

    // Unfollow if following
    const followingRef = doc(db, `users/${userId}/following/${blockedUserId}`);
    batch.delete(followingRef);

    const followerRef = doc(db, `users/${blockedUserId}/followers/${userId}`);
    batch.delete(followerRef);

    // Update counts safely (prevent negative)
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentFollowingCount = userDoc.data()?.stats?.followingCount || 0;
    
    if (currentFollowingCount > 0) {
      batch.update(userRef, {
        'stats.followingCount': increment(-1),
      });
    }

    const blockedUserRef = doc(db, 'users', blockedUserId);
    const blockedUserDoc = await getDoc(blockedUserRef);
    const currentFollowersCount = blockedUserDoc.data()?.stats?.followersCount || 0;
    
    if (currentFollowersCount > 0) {
      batch.update(blockedUserRef, {
        'stats.followersCount': increment(-1),
      });
    }

    await batch.commit();
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    const blockedRef = doc(db, `users/${userId}/blockedUsers/${blockedUserId}`);
    await deleteDoc(blockedRef);
  }

  /**
   * Get list of blocked users
   */
  async getBlockedUsers(userId: string): Promise<string[]> {
    const blockedRef = collection(db, `users/${userId}/blockedUsers`);
    const snapshot = await getDocs(blockedRef);
    return snapshot.docs.map(doc => doc.data().userId);
  }

  /**
   * Check if user is blocked
   */
  async isBlocked(userId: string, targetUserId: string): Promise<boolean> {
    const blockedRef = doc(db, `users/${userId}/blockedUsers/${targetUserId}`);
    const blockedSnap = await getDoc(blockedRef);
    return blockedSnap.exists();
  }

  /**
   * Deactivate user account (reversible)
   */
  async deactivateAccount(userId: string, reason?: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isActive: false,
      deactivatedAt: serverTimestamp(),
      deactivationReason: reason || '',
    });
  }

  /**
   * Delete user account permanently (with 7-day grace period)
   */
  async deleteAccount(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    
    // Calculate deletion date (7 days from now)
    const scheduledDeletionAt = new Date();
    scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + 7);
    
    await updateDoc(userRef, {
      isDeleted: true,
      scheduledDeletionAt: Timestamp.fromDate(scheduledDeletionAt),
      deletedAt: serverTimestamp(),
    });
  }

  /**
   * Permanently delete all user data from Firestore
   * This is called by a Cloud Function after grace period expires
   */
  async deleteAccountData(userId: string): Promise<void> {
    const batch = writeBatch(db);
    
    try {
      // 1. Delete all user's posts
      const postsQuery = query(collection(db, 'posts'), where('userId', '==', userId));
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      // 2. Delete all user's glimpses
      const glimpsesQuery = query(collection(db, 'glimpses'), where('userId', '==', userId));
      const glimpsesSnapshot = await getDocs(glimpsesQuery);
      glimpsesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      // 3. Delete all user's stories
      const storiesQuery = query(collection(db, 'stories'), where('userId', '==', userId));
      const storiesSnapshot = await getDocs(storiesQuery);
      storiesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      // 4. Delete all conversations where user is participant
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', userId)
      );
      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      // Delete messages in each conversation
      for (const convDoc of conversationsSnapshot.docs) {
        const messagesQuery = collection(db, `conversations/${convDoc.id}/messages`);
        const messagesSnapshot = await getDocs(messagesQuery);
        messagesSnapshot.docs.forEach(msgDoc => batch.delete(msgDoc.ref));
        batch.delete(convDoc.ref);
      }
      
      // 5. Delete user's notifications
      const notificationsQuery = collection(db, `users/${userId}/notifications`);
      const notificationsSnapshot = await getDocs(notificationsQuery);
      notificationsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      // 6. Delete user's saved collections
      const collectionsQuery = query(collection(db, 'collections'), where('userId', '==', userId));
      const collectionsSnapshot = await getDocs(collectionsQuery);
      collectionsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      // 7. Delete user document itself
      batch.delete(doc(db, 'users', userId));
      
      // Commit all deletions
      await batch.commit();
      
      console.log(`Successfully deleted all data for user: ${userId}`);
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw new Error('Failed to delete user data');
    }
  }

  /**
   * Cancel scheduled account deletion (called on login)
   */
  async cancelAccountDeletion(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isDeleted: false,
      scheduledDeletionAt: null,
      deletedAt: null,
    });
  }

  /**
   * Check if username exists (case-insensitive)
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const usernameQuery = query(
        collection(db, 'users'),
        where('usernameLowercase', '==', username.toLowerCase())
      );
      const existingUser = await getDocs(usernameQuery);
      return existingUser.empty;
    } catch (error) {
      console.error('Error checking username:', error);
      throw error;
    }
  }

  /**
   * Generate username suggestions based on a taken username
   */
  generateUsernameSuggestions(username: string): string[] {
    // Clean base: remove all special characters
    const cleanBase = username.toLowerCase().replace(/[_.]/g, '');
    const suggestions: string[] = [];
    
    // Add 3-digit numbers with underscore
    for (let i = 0; i < 3; i++) {
      const randomNum = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
      suggestions.push(`${cleanBase}_${randomNum}`);
    }
    
    // Add single digit variations (no special char)
    suggestions.push(`${cleanBase}1`);
    suggestions.push(`${cleanBase}2`);
    
    // Add year
    const year = new Date().getFullYear();
    suggestions.push(`${year}_${cleanBase}`);
    
    return suggestions;
  }

  /**
   * Validate username
   */
  async validateUsername(username: string, currentUserId?: string): Promise<{ valid: boolean; error?: string }> {
    // Check length (3-12 characters)
    if (username.length < 3 || username.length > 12) {
      return { valid: false, error: 'Username must be between 3 and 12 characters' };
    }

    // Must contain at least one alphabet
    if (!/[a-zA-Z]/.test(username)) {
      return { valid: false, error: 'Username must contain at least one letter' };
    }

    // Check allowed characters: alphanumeric, underscore, period only
    const validPattern = /^[a-zA-Z0-9_.]+$/;
    if (!validPattern.test(username)) {
      return { valid: false, error: 'Username can only contain letters, numbers, underscore (_), and period (.)' };
    }

    // Check if starts or ends with special characters
    if (username.startsWith('_') || username.startsWith('.') || username.endsWith('_') || username.endsWith('.')) {
      return { valid: false, error: 'Username cannot start or end with special characters' };
    }

    // Check for consecutive special characters
    if (/[_.]{2,}/.test(username)) {
      return { valid: false, error: 'Username cannot have consecutive special characters' };
    }

    // If multiple special chars, must be different types (can't use only _ or only .)
    const hasUnderscores = username.includes('_');
    const hasDots = username.includes('.');
    const specialCharCount = (username.match(/[_.]/g) || []).length;
    
    if (specialCharCount > 1 && (hasUnderscores && !hasDots)) {
      return { valid: false, error: 'Cannot use only underscores as special characters' };
    }
    
    if (specialCharCount > 1 && (hasDots && !hasUnderscores)) {
      return { valid: false, error: 'Cannot use only dots as special characters' };
    }

    // Check if username already exists (case-insensitive)
    const usernameQuery = query(
      collection(db, 'users'),
      where('usernameLowercase', '==', username.toLowerCase())
    );
    const existingUser = await getDocs(usernameQuery);
    
    // If editing current user's username, allow if it's the same user
    if (!existingUser.empty) {
      const existingUserId = existingUser.docs[0].id;
      if (currentUserId && existingUserId === currentUserId) {
        return { valid: true };
      }
      return { valid: false, error: 'Username is already taken' };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const userService = new UserService();
