import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStoryProcessing } from '../../contexts/StoryProcessingContext';
import { useUpload } from '../../contexts/UploadContext';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';

export function StoryProcessingBar() {
  const { processingStories, cancelStoryProcessing } = useStoryProcessing();
  const { isUploading, uploadProgress, uploadType } = useUpload();

  const activeStories = processingStories.filter((s) => s.status === 'processing' || s.status === 'uploading');
  const activeStory = activeStories[0];
  const hasStoryJob = activeStories.length > 0;
  const hasUploadJob = isUploading && !!uploadType;

  if (!hasStoryJob && !hasUploadJob) {
    return null;
  }

  const progress = hasStoryJob
    ? Math.round(activeStories.reduce((sum, s) => sum + (s.progress || 0), 0) / activeStories.length)
    : Math.max(0, Math.min(100, Math.round(uploadProgress || 0)));

  const getUploadCopy = () => {
    const noun = uploadType === 'glimpse' ? 'glimpse' : uploadType === 'post' ? 'post' : 'story';
    if (progress >= 100) return `${noun[0].toUpperCase()}${noun.slice(1)} shared`;
    if (progress < 20) return `Preparing ${noun}...`;
    if (progress < 85) return `Uploading ${noun}...`;
    return `Finishing ${noun}...`;
  };

  const getStatusText = () => {
    if (!hasStoryJob) return getUploadCopy();

    switch (activeStory?.status) {
      case 'processing':
        return 'Processing story...';
      case 'uploading':
        return 'Uploading story...';
      case 'completed':
        return 'Story shared!';
      case 'failed':
        return 'Upload failed';
      case 'canceled':
        return 'Canceled';
      default:
        return 'Processing story...';
    }
  };

  const getStatusIcon = () => {
    if (!hasStoryJob) {
      if (progress >= 100) return 'checkmark-circle-outline';
      if (progress < 20) return 'sparkles-outline';
      if (progress < 85) return 'cloud-upload-outline';
      return 'checkmark-done-outline';
    }

    switch (activeStory?.status) {
      case 'processing':
        return 'cog-outline';
      case 'uploading':
        return 'cloud-upload-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'failed':
        return 'alert-circle-outline';
      case 'canceled':
        return 'close-circle-outline';
      default:
        return 'hourglass-outline';
    }
  };

  const getStatusColor = () => {
    if (!hasStoryJob) {
      if (progress >= 100) return '#4CAF50';
      if (progress < 20) return colors.accent.primary;
      return '#4DD0E1';
    }

    switch (activeStory?.status) {
      case 'processing':
        return colors.accent.primary;
      case 'uploading':
        return '#4DD0E1';
      case 'completed':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'canceled':
        return colors.text.secondary;
      default:
        return colors.accent.primary;
    }
  };

  const canCancel = !!activeStory && (activeStory.status === 'processing' || activeStory.status === 'uploading');

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={getStatusIcon() as any} size={20} color={getStatusColor()} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          <Text style={styles.progressText}>{progress}% complete</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: getStatusColor(),
                },
              ]}
            />
          </View>
        </View>

        {canCancel && hasStoryJob ? (
          <TouchableOpacity onPress={() => cancelStoryProcessing(activeStory!.id)} style={styles.cancelButton}>
            <Ionicons name="close" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  statusText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  progressText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
  },
  progressContainer: {
    width: 60,
  },
  progressBackground: {
    height: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cancelButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
  },
});
