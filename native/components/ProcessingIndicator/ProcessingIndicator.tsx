import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { BlurView } from 'expo-blur'; // Commented out - not available
import { mediaProcessingService, ProcessingProgress } from '../../services/media.processing.service';
import { styles } from './ProcessingIndicatorStyles';

const { width: screenWidth } = Dimensions.get('window');

interface ProcessingIndicatorProps {
  visible: boolean;
  onClose?: () => void;
  allowBackgroundUsage?: boolean;
}

export default function ProcessingIndicator({ 
  visible, 
  onClose, 
  allowBackgroundUsage = true 
}: ProcessingIndicatorProps) {
  const [activeProcesses, setActiveProcesses] = useState<ProcessingProgress[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Animation values
  const progressAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(1);
  const opacityAnim = new Animated.Value(1);

  useEffect(() => {
    if (!visible) return;

    // Listen for progress updates
    const handleProgressUpdate = (progress: ProcessingProgress) => {
      setActiveProcesses(prev => {
        const updated = prev.filter(p => p.id !== progress.id);
        if (progress.stage !== 'complete' && progress.stage !== 'error') {
          updated.push(progress);
        }
        return updated;
      });

      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: progress.progress / 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
    };

    // Listen for cancellation
    const handleCancellation = (processingId: string) => {
      setActiveProcesses(prev => prev.filter(p => p.id !== processingId));
    };

    mediaProcessingService.on('progressUpdate', handleProgressUpdate);
    mediaProcessingService.on('processingCancelled', handleCancellation);

    // Load initial active processes
    setActiveProcesses(mediaProcessingService.getActiveProcesses());

    return () => {
      mediaProcessingService.off('progressUpdate', handleProgressUpdate);
      mediaProcessingService.off('processingCancelled', handleCancellation);
    };
  }, [visible]);

  // Auto-close when all processes complete
  useEffect(() => {
    if (activeProcesses.length === 0 && visible) {
      setTimeout(() => {
        onClose?.();
      }, 1000);
    }
  }, [activeProcesses.length, visible, onClose]);

  const handleMinimize = () => {
    setIsMinimized(true);
    
    // Scale down animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    
    // Scale up animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCancel = (processingId: string) => {
    mediaProcessingService.cancelProcessing(processingId);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStageIcon = (stage: string): string => {
    switch (stage) {
      case 'compressing':
        return 'compress';
      case 'filtering':
        return 'color-filter';
      case 'uploading':
        return 'cloud-upload';
      case 'complete':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      default:
        return 'hourglass';
    }
  };

  const getStageColor = (stage: string): string => {
    switch (stage) {
      case 'compressing':
        return '#FF6B6B';
      case 'filtering':
        return '#4ECDC4';
      case 'uploading':
        return '#45B7D1';
      case 'complete':
        return '#22c55e';
      case 'error':
        return '#ef4444';
      default:
        return '#8E8E93';
    }
  };

  if (!visible || activeProcesses.length === 0) {
    return null;
  }

  // Minimized view (floating indicator)
  if (isMinimized) {
    return (
      <Animated.View
        style={[
          styles.minimizedContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.minimizedButton}
          onPress={handleMaximize}
          activeOpacity={0.8}
        >
          <View style={styles.minimizedContent}>
            <Ionicons name="hourglass" size={16} color="#FFFFFF" />
            <Text style={styles.minimizedText}>
              {activeProcesses.length} processing
            </Text>
          </View>
          
          {/* Mini progress ring */}
          <View style={styles.miniProgressRing}>
            <Animated.View
              style={[
                styles.miniProgressFill,
                {
                  transform: [
                    {
                      rotate: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Full view (modal)
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="hourglass" size={24} color="#FFFFFF" />
              <Text style={styles.headerTitle}>Processing</Text>
            </View>
            
            <View style={styles.headerActions}>
              {allowBackgroundUsage && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleMinimize}
                >
                  <Ionicons name="remove" size={20} color="#8E8E93" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Processing List */}
          <View style={styles.processingList}>
            {activeProcesses.map((process) => (
              <View key={process.id} style={styles.processItem}>
                {/* Process Info */}
                <View style={styles.processHeader}>
                  <View style={styles.processIcon}>
                    <Ionicons
                      name={getStageIcon(process.stage) as any}
                      size={20}
                      color={getStageColor(process.stage)}
                    />
                  </View>
                  
                  <View style={styles.processInfo}>
                    <Text style={styles.processTitle}>
                      {process.type === 'image' ? 'Image' : 'Video'} Processing
                    </Text>
                    <Text style={styles.processMessage}>
                      {process.message}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancel(process.id)}
                  >
                    <Ionicons name="close" size={16} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          width: `${process.progress}%`,
                          backgroundColor: getStageColor(process.stage),
                        },
                      ]}
                    />
                  </View>
                  
                  <Text style={styles.progressText}>
                    {Math.round(process.progress)}%
                  </Text>
                </View>

                {/* File Size Info */}
                {process.originalSize && (
                  <View style={styles.sizeInfo}>
                    <Text style={styles.sizeText}>
                      Original: {formatFileSize(process.originalSize)}
                    </Text>
                    {process.compressedSize && (
                      <Text style={styles.sizeText}>
                        Compressed: {formatFileSize(process.compressedSize)}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Background Usage Notice */}
          {allowBackgroundUsage && (
            <View style={styles.backgroundNotice}>
              <Ionicons name="information-circle" size={16} color="#8E8E93" />
              <Text style={styles.backgroundNoticeText}>
                You can continue using Iris while processing
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
