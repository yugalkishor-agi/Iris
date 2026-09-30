import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { mediaService } from './media.service.native';

export interface VoiceMessage {
  id: string;
  conversationId: string;
  senderId: string;
  audioURL: string;
  duration: number; // in seconds
  waveform?: number[]; // Amplitude values for visualization
  createdAt: Timestamp;
  isRead: boolean;
}

class VoiceMessageService {
  /**
   * Upload voice message audio file
   */
  async uploadVoiceMessage(
    audioUri: string,
    conversationId: string,
    senderId: string
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `voice_${conversationId}_${senderId}_${timestamp}.m4a`;
      const uploadedUrl = await mediaService.uploadMessageMedia(senderId, conversationId, {
        uri: audioUri,
        type: 'audio/m4a',
        fileName,
      });

      return uploadedUrl;
    } catch (error) {
      console.error('Error uploading voice message:', error);
      throw error;
    }
  }

  /**
   * Send voice message
   */
  async sendVoiceMessage(
    conversationId: string,
    senderId: string,
    audioUri: string,
    duration: number,
    waveform?: number[]
  ): Promise<string> {
    try {
      // Upload audio file
      const audioURL = await this.uploadVoiceMessage(audioUri, conversationId, senderId);

      // Create message document
      const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
      const messageId = messageRef.id;

      const voiceMessage: Omit<VoiceMessage, 'id'> = {
        conversationId,
        senderId,
        audioURL,
        duration,
        waveform,
        createdAt: serverTimestamp() as Timestamp,
        isRead: false,
      };

      await setDoc(messageRef, {
        messageId,
        type: 'voice',
        ...voiceMessage,
      });

      // Update conversation last message
      const conversationRef = doc(db, 'conversations', conversationId);
      await setDoc(conversationRef, {
        lastMessage: {
          type: 'voice',
          content: `🎤 Voice message (${this.formatDuration(duration)})`,
          senderId,
          createdAt: serverTimestamp(),
        },
        lastActivity: serverTimestamp(),
      }, { merge: true });

      return messageId;
    } catch (error) {
      console.error('Error sending voice message:', error);
      throw error;
    }
  }

  /**
   * Generate waveform data from audio
   */
  async generateWaveform(audioUri: string, samples: number = 20): Promise<number[]> {
    try {
      // This is a simplified waveform generation
      // In a real app, you'd use audio analysis libraries
      const waveform: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        // Generate random values between 0.1 and 1.0
        // In reality, this would be calculated from audio amplitude
        waveform.push(Math.random() * 0.9 + 0.1);
      }
      
      return waveform;
    } catch (error) {
      console.error('Error generating waveform:', error);
      // Return default waveform on error
      return Array.from({ length: samples }, () => Math.random() * 0.9 + 0.1);
    }
  }

  /**
   * Compress audio file (basic implementation)
   */
  async compressAudio(audioUri: string, quality: number = 0.7): Promise<string> {
    try {
      // This is a placeholder for audio compression
      // In a real implementation, you'd use libraries like:
      // - react-native-audio-toolkit
      // - expo-av with compression options
      // - FFmpeg for React Native
      
      // For now, return the original URI
      // TODO: Implement actual audio compression
      return audioUri;
    } catch (error) {
      console.error('Error compressing audio:', error);
      return audioUri;
    }
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Validate audio file
   */
  validateAudioFile(audioUri: string, maxDuration: number = 300): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Basic validation
        if (!audioUri || audioUri.length === 0) {
          resolve(false);
          return;
        }

        // Check if it's a valid URI format
        const isValidUri = audioUri.startsWith('file://') || 
                          audioUri.startsWith('content://') ||
                          audioUri.startsWith('http://') ||
                          audioUri.startsWith('https://');

        resolve(isValidUri);
      } catch (error) {
        console.error('Error validating audio file:', error);
        resolve(false);
      }
    });
  }

  /**
   * Calculate file size
   */
  async getAudioFileSize(audioUri: string): Promise<number> {
    try {
      const response = await fetch(audioUri);
      const blob = await response.blob();
      return blob.size;
    } catch (error) {
      console.error('Error getting audio file size:', error);
      return 0;
    }
  }

  /**
   * Delete voice message
   */
  async deleteVoiceMessage(messageId: string, conversationId: string): Promise<void> {
    try {
      // In a real implementation, you'd also delete the audio file from storage
      // For now, just mark the message as deleted
      const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      
      await setDoc(messageRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('Error deleting voice message:', error);
      throw error;
    }
  }

  /**
   * Mark voice message as read
   */
  async markAsRead(messageId: string, conversationId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      
      await setDoc(messageRef, {
        isRead: true,
        readAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('Error marking voice message as read:', error);
      throw error;
    }
  }

  /**
   * Get voice message statistics
   */
  async getVoiceMessageStats(userId: string): Promise<{
    totalSent: number;
    totalReceived: number;
    totalDuration: number;
  }> {
    try {
      // This would require complex queries across all conversations
      // For now, return mock data
      // TODO: Implement proper statistics collection
      
      return {
        totalSent: 0,
        totalReceived: 0,
        totalDuration: 0,
      };
    } catch (error) {
      console.error('Error getting voice message stats:', error);
      return {
        totalSent: 0,
        totalReceived: 0,
        totalDuration: 0,
      };
    }
  }
}

export const voiceMessageService = new VoiceMessageService();



