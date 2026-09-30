import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../../components/ui/Avatar';
import { VerifiedBadge } from '../../../components/ui/VerifiedBadge';
import { colors } from '../../../styles/theme';

interface StoryViewerHeaderProps {
  insets: { top: number };
  stories: any[];
  currentStory: number;
  progressAnim: Animated.Value;
  storyUser: any;
  currentStoryData: any;
  isPaused: boolean;
  togglePausePlayback: () => void;
  setShowMoreMenu: (show: boolean) => void;
}

export const StoryViewerHeader: React.FC<StoryViewerHeaderProps> = ({
  insets,
  stories,
  currentStory,
  progressAnim,
  storyUser,
  currentStoryData,
  isPaused,
  togglePausePlayback,
  setShowMoreMenu,
}) => {
  const formatStoryMetaTime = (createdAt: any) => {
    if (!createdAt) return '';
    try {
      const date = typeof createdAt?.toDate === 'function'
        ? createdAt.toDate()
        : (typeof createdAt?.seconds === 'number'
          ? new Date(createdAt.seconds * 1000)
          : new Date(createdAt));

      if (!Number.isFinite(date.getTime())) return '';

      const now = new Date();
      const sameDay = now.toDateString() === date.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = yesterday.toDateString() === date.toDateString();

      const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      if (sameDay) return `Today, ${timeStr}`;
      if (isYesterday) return `Yesterday, ${timeStr}`;
      return `${date.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${timeStr}`;
    } catch {
      return '';
    }
  };

  return (
    <>
      <View style={[styles.progressContainer, { top: Math.max(insets.top + 8, 18) }]}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', index === currentStory ? '100%' : index < currentStory ? '100%' : '0%'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          </View>
        ))}
      </View>

      <LinearGradient
        colors={['rgba(2,4,18,0.86)', 'rgba(2,4,18,0.35)', 'transparent']}
        style={styles.headerGradient}
        pointerEvents="box-none"
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 14, 20) }]}>
          <View style={styles.userInfoChip}>
            <Avatar source={storyUser?.avatarURL} size={40} style={styles.avatar} fallbackText={storyUser?.username || 'U'} />
            <View style={styles.userDetails}>
              <View style={styles.usernameRow}>
                <Text style={styles.username}>{storyUser?.username}</Text>
                {!!(storyUser?.verified || currentStoryData?.authorVerified) && (
                  <VerifiedBadge size={17} style={styles.verifiedBadgeIcon} />
                )}
              </View>
              <Text style={styles.timestamp}>{formatStoryMetaTime(currentStoryData?.createdAt)}</Text>
              {!!(currentStoryData?.audioOverlay?.name || currentStoryData?.audioOverlay?.uri) && (
                <Text style={styles.musicBadgeText} numberOfLines={1}>
                  {`Music: ${String(currentStoryData?.audioOverlay?.name || 'Audio Track')}`}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={togglePausePlayback}>
              <Ionicons name={isPaused ? "play-outline" : "pause-outline"} size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowMoreMenu(true)}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    height: 3,
    zIndex: 50,
  },
  progressBar: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    height: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  userInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  userDetails: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verifiedBadgeIcon: {
    marginLeft: 4,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  musicBadgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
    maxWidth: 180,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
});
