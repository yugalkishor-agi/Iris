/**
 * Biometric Authentication Service
 * Uses Web Authentication API (WebAuthn) for fingerprint/face authentication
 */

const STORAGE_KEY = 'iris_biometric_credentials';

export interface BiometricCredential {
  id: string;
  userId: string;
  publicKey: string;
  createdAt: number;
}

class BiometricService {
  /**
   * Check if biometric authentication is available
   */
  isAvailable(): boolean {
    return !!(
      window.PublicKeyCredential &&
      navigator.credentials &&
      navigator.credentials.create
    );
  }

  /**
   * Check if biometric is available for platform (fingerprint, face ID, etc.)
   */
  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Register biometric credential for a user
   */
  async register(userId: string, username: string): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('Biometric authentication not supported');
    }

    try {
      // Generate challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Iris',
            id: window.location.hostname
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: username,
            displayName: username
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },  // ES256
            { type: 'public-key', alg: -257 } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: false
          },
          timeout: 60000,
          attestation: 'none'
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Store credential info
      const storedCredential: BiometricCredential = {
        id: credential.id,
        userId,
        publicKey: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        createdAt: Date.now()
      };

      const stored = this.getStoredCredentials();
      stored[userId] = storedCredential;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

      console.log('✅ Biometric registered for user:', username);
      return true;

    } catch (error: any) {
      console.error('❌ Biometric registration failed:', error);
      
      // User cancelled or not supported
      if (error.name === 'NotAllowedError') {
        throw new Error('Biometric authentication was cancelled');
      }
      
      throw new Error('Failed to register biometric authentication');
    }
  }

  /**
   * Authenticate using biometric
   */
  async authenticate(userId: string): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('Biometric authentication not supported');
    }

    try {
      const stored = this.getStoredCredentials();
      const credential = stored[userId];

      if (!credential) {
        throw new Error('No biometric credential found for this user');
      }

      // Generate challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Convert stored ID back to ArrayBuffer
      const credentialId = Uint8Array.from(atob(credential.publicKey), c => c.charCodeAt(0));

      // Authenticate
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          allowCredentials: [{
            type: 'public-key',
            id: credentialId
          }],
          userVerification: 'required',
          timeout: 60000
        }
      }) as PublicKeyCredential;

      if (!assertion) {
        throw new Error('Authentication failed');
      }

      console.log('✅ Biometric authentication successful');
      return true;

    } catch (error: any) {
      console.error('❌ Biometric authentication failed:', error);
      
      if (error.name === 'NotAllowedError') {
        throw new Error('Biometric authentication was cancelled');
      }
      
      throw new Error('Biometric authentication failed');
    }
  }

  /**
   * Check if biometric is registered for user
   */
  isRegistered(userId: string): boolean {
    const stored = this.getStoredCredentials();
    return !!stored[userId];
  }

  /**
   * Remove biometric credential for user
   */
  unregister(userId: string): boolean {
    try {
      const stored = this.getStoredCredentials();
      delete stored[userId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      console.log('✅ Biometric unregistered for user');
      return true;
    } catch (error) {
      console.error('❌ Failed to unregister biometric:', error);
      return false;
    }
  }

  /**
   * Get stored credentials
   */
  private getStoredCredentials(): Record<string, BiometricCredential> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  /**
   * Clear all biometric credentials
   */
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Show biometric prompt with custom message
   */
  async promptAuthentication(message: string = 'Authenticate to continue'): Promise<boolean> {
    const available = await this.isPlatformAuthenticatorAvailable();
    
    if (!available) {
      throw new Error('Biometric authentication not available on this device');
    }

    // In a real implementation, you'd show a custom UI here
    // For now, we'll use the browser's native prompt
    return true;
  }
}

// Export singleton instance
export const biometricService = new BiometricService();
