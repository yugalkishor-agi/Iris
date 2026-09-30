import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../ui/LoadingSkeleton';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';

interface ShareOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onShare: (audience: 'everyone' | 'closeFriends') => void;
  isUploading: boolean;
}

export function ShareOptionsModal({ 
  visible, 
  onClose, 
  onShare, 
  isUploading 
}: ShareOptionsModalProps) {
  
  const shareOptions = [
    {
      id: 'everyone',
      title: 'Share with Everyone',
      subtitle: 'Your story will be visible to all followers',
      icon: 'globe-outline',
      color: colors.accent.primary,
    },
    {
      id: 'closeFriends',
      title: 'Share with Close Friends',
      subtitle: 'Only your close friends will see this story',
      icon: 'people-outline',
      color: '#10B981',
    },
  ];

  const handleShare = (audience: 'everyone' | 'closeFriends') => {
    if (!isUploading) {
      onShare(audience);
    }
  };

  const [quality, setQuality] = useState<'low'|'medium'|'high'>('medium');

  useEffect(() => {
    const load = async () => {
      try {
        const s = await AsyncStorage.getItem('dataSettings');
        if (s) {
          const obj = JSON.parse(s);
          if (obj.reducedData) setQuality('low');
          else if (obj.highQualityUploads) setQuality('high');
          else setQuality('medium');
        }
      } catch {}
    };
    if (visible) load();
  }, [visible]);

  const applyQuality = async (q: 'low'|'medium'|'high') => {
    if (isUploading) return;
    setQuality(q);
    try {
      const current = await AsyncStorage.getItem('dataSettings');
      const obj = current ? JSON.parse(current) : {};
      obj.reducedData = q === 'low';
      obj.highQualityUploads = q === 'high';
      await AsyncStorage.setItem('dataSettings', JSON.stringify(obj));
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Share Story</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Choose who can see your story
          </Text>

          <View style={styles.optionsContainer}>
            <View style={styles.qualityContainer}>
              <Text style={styles.qualityLabel}>Upload Quality</Text>
              <View style={styles.qualitySegment}>
                <TouchableOpacity
                  style={[styles.segmentItem, quality==='low' && styles.segmentActive]}
                  onPress={() => applyQuality('low')}
                  disabled={isUploading}
                >
                  <Text style={[styles.segmentText, quality==='low' && styles.segmentTextActive]}>Low</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentItem, quality==='medium' && styles.segmentActive]}
                  onPress={() => applyQuality('medium')}
                  disabled={isUploading}
                >
                  <Text style={[styles.segmentText, quality==='medium' && styles.segmentTextActive]}>Medium</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentItem, quality==='high' && styles.segmentActive]}
                  onPress={() => applyQuality('high')}
                  disabled={isUploading}
                >
                  <Text style={[styles.segmentText, quality==='high' && styles.segmentTextActive]}>High</Text>
                </TouchableOpacity>
              </View>
            </View>
            {shareOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  isUploading && styles.optionDisabled
                ]}
                onPress={() => handleShare(option.id as 'everyone' | 'closeFriends')}
                disabled={isUploading}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                  <Ionicons name={option.icon as any} size={24} color="#FFFFFF" />
                </View>
                
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                
                {isUploading ? (
                  <InlineLoadingSkeleton />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {isUploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color={colors.accent.primary} />
              <Text style={styles.uploadingText}>Sharing your story...</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              You can change your story audience settings anytime in your profile settings
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.medium,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  optionsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  uploadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  uploadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  qualityContainer: {
    marginBottom: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  qualityLabel: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  qualitySegment: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.full,
    padding: 2,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  segmentActive: {
    backgroundColor: colors.accent.primary,
  },
  segmentText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  segmentTextActive: {
    color: '#fff',
  },
});

