import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { voiceMessageService } from '../services/voiceMessage.service';

export const useVoiceMessage = (conversationId: string, senderId: string) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const sendVoiceMessage = useCallback(async (
    audioUri: string,
    duration: number
  ): Promise<boolean> => {
    try {
      setIsSending(true);

      // Validate audio file
      const isValid = await voiceMessageService.validateAudioFile(audioUri);
      if (!isValid) {
        Alert.alert('Error', 'Invalid audio file. Please try recording again.');
        return false;
      }

      // Check file size (limit to 10MB)
      const fileSize = await voiceMessageService.getAudioFileSize(audioUri);
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (fileSize > maxSize) {
        Alert.alert(
          'File Too Large',
          'Voice message is too large. Please record a shorter message.'
        );
        return false;
      }

      // Generate waveform
      const waveform = await voiceMessageService.generateWaveform(audioUri);

      // Send voice message
      await voiceMessageService.sendVoiceMessage(
        conversationId,
        senderId,
        audioUri,
        duration,
        waveform
      );

      return true;
    } catch (error) {
      console.error('Error sending voice message:', error);
      Alert.alert(
        'Send Failed',
        'Failed to send voice message. Please check your connection and try again.'
      );
      return false;
    } finally {
      setIsSending(false);
    }
  }, [conversationId, senderId]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingDuration(0);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  const cancelRecording = useCallback(() => {
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

  const updateRecordingDuration = useCallback((duration: number) => {
    setRecordingDuration(duration);
  }, []);

  return {
    isRecording,
    isSending,
    recordingDuration,
    sendVoiceMessage,
    startRecording,
    stopRecording,
    cancelRecording,
    updateRecordingDuration,
  };
};
