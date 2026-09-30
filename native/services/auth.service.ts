import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User as FirebaseUser,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { userService } from './user.service';
import { mediaService } from './media.service.native';
import type { CreateUserData } from '../types/database';
import { Platform } from 'react-native';
import { pushService } from './push.service';

export class AuthService {
  // ==========================================
  // AUTHENTICATION
  // ==========================================

  /**
   * Register new user with email and password
   */
  async register(
    email: string,
    password: string,
    username: string,
    displayName: string,
    avatarFile?: any
  ): Promise<{ userId: string; user: FirebaseUser }> {
    try {
      // Validate inputs
      if (!email || !password || !username || !displayName) {
        throw new Error('All fields are required');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Check username availability (case-insensitive) before creating auth user
      const available = await userService.isUsernameAvailable(username);
      if (!available) {
        throw new Error('Username is already taken');
      }

      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // 2. Upload avatar if provided
      let avatarURL = '';
      if (avatarFile) {
        avatarURL = await mediaService.uploadAvatar(userId, avatarFile);
      }

      // 3. Update Firebase Auth profile
      await updateProfile(userCredential.user, {
        displayName,
        photoURL: avatarURL,
      });

      // 4. Create Firestore user document
      const userData: CreateUserData = {
        username,
        email,
        displayName,
        avatarURL,
        bio: '',
      };

      await userService.createUser(userId, userData);

      return { userId, user: userCredential.user };
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ userId: string; user: FirebaseUser }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Update online status
      await userService.setOnlineStatus(userId, true);

      return { userId, user: userCredential.user };
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<{ userId: string; user: FirebaseUser; isNewUser: boolean }> {
    try {
      if (Platform.OS !== 'web') {
        throw new Error('Google sign-in is not configured for native builds yet. Use email/password sign in.');
      }

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const userCredential = await signInWithPopup(auth, provider);
      const userId = userCredential.user.uid;
      const isNewUser = userCredential.user.metadata.creationTime === userCredential.user.metadata.lastSignInTime;

      // Check if user document exists in Firestore
      const existingUser = await userService.getUser(userId).catch(() => null);

      if (!existingUser) {
        // New user - create Firestore document
        const displayName = userCredential.user.displayName || 'User';
        const email = userCredential.user.email || '';
        const photoURL = userCredential.user.photoURL || '';
        
        // Generate username from email or display name
        const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 
                        displayName.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                        `user${Date.now()}`;

        const userData: CreateUserData = {
          username,
          email,
          displayName,
          avatarURL: photoURL,
          bio: '',
        };

        await userService.createUser(userId, userData);
      }

      // Update online status
      await userService.setOnlineStatus(userId, true);

      return { userId, user: userCredential.user, isNewUser: !existingUser };
    } catch (error: any) {
      if (error?.message && !error?.code) {
        throw error;
      }
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign in cancelled');
      }
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Set offline status before signing out
        await userService.setOnlineStatus(currentUser.uid, false);
        await pushService.unregisterForPushNotifications(currentUser.uid);
      }

      pushService.cleanup();
      await signOut(auth);
    } catch (error: any) {
      throw new Error('Failed to sign out');
    }
  }

  /**
   * Change user password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No user logged in');
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      // Update password change timestamp in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        passwordChangedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Verify current password
   */
  async verifyPassword(password: string): Promise<boolean> {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No user logged in');
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Update email address
   */
  async updateEmail(newEmail: string, password: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No user logged in');
    }

    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Update email in Firebase Auth
      await updateEmail(user, newEmail);
      
      // Update email in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        email: newEmail,
        emailVerified: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  // ==========================================
  // PROFILE UPDATES
  // ==========================================

  /**
   * Update user email
   */
  async updateUserEmail(newEmail: string, currentPassword: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('No authenticated user');
      }

      // Reauthenticate before email change
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update email in Firebase Auth
      await updateEmail(currentUser, newEmail);

      // Update email in Firestore
      await userService.updateUser(currentUser.uid, { email: newEmail });
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Update user password
   */
  async updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('No authenticated user');
      }

      // Reauthenticate before password change
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Update display name
   */
  async updateDisplayName(newDisplayName: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      // Update in Firebase Auth
      await updateProfile(currentUser, {
        displayName: newDisplayName,
      });

      // Update in Firestore
      await userService.updateUser(currentUser.uid, {
        displayName: newDisplayName,
      });
    } catch (error: any) {
      throw new Error('Failed to update display name');
    }
  }

  /**
   * Update profile photo
   */
  async updateProfilePhoto(avatarFile: any): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      // Upload new avatar
      const avatarURL = await mediaService.uploadAvatar(currentUser.uid, avatarFile);

      // Update in Firebase Auth
      await updateProfile(currentUser, {
        photoURL: avatarURL,
      });

      // Update in Firestore
      await userService.updateUser(currentUser.uid, {
        avatarURL,
      });

      return avatarURL;
    } catch (error: any) {
      throw new Error('Failed to update profile photo');
    }
  }

  // ==========================================
  // ACCOUNT MANAGEMENT
  // ==========================================

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const users = await userService.searchUsers(username, 1);
      return users.length === 0 || users[0].username.toLowerCase() !== username.toLowerCase();
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify user is authenticated
   */
  requireAuth(): FirebaseUser {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    return user;
  }

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  /**
   * Get user-friendly error message
   */
  private getAuthErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/user-disabled': 'This account has been disabled',
      'auth/requires-recent-login': 'Please sign in again to complete this action',
      'auth/invalid-credential': 'Invalid credentials provided',
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again';
  }
}

// Export singleton instance
export const authService = new AuthService();




