import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';

const { width } = Dimensions.get('window');
const gridGap = 1;
const gridSideInset = 1;
const imageSize = Math.floor((width - gridSideInset * 2 - gridGap * 2) / 3);

interface ProfileGridProps {
  currentData: any[];
  activeTab: 'posts' | 'glimpses' | 'tagged';
  isOwnProfile: boolean;
  profileUser: any;
  openTileViewer: (item: any, isGlimpse: boolean) => void;
  handleTileLongPress: (payload: any) => void;
  clearTilePreview: () => void;
  formatCompactCount: (raw: any) => string;
}

export const ProfileGrid = React.memo(function ProfileGrid({
  currentData,
  activeTab,
  isOwnProfile,
  profileUser,
  openTileViewer,
  handleTileLongPress,
  clearTilePreview,
  formatCompactCount
}: ProfileGridProps) {
  const lastLongPressRef = useRef<{ itemId: string; at: number } | null>(null);

  const toMillis = (value: any) => {
    if (!value) return 0;
    if (typeof value?.toMillis === 'function') return value.toMillis();
    if (typeof value?.toDate === 'function') return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const renderPost = ({ item, index }: any) => {
    const isGlimpse = item.isGlimpse || item.glimpseId || activeTab === 'glimpses';
    const isPinned = toMillis(item?.pinnedAt) > 0;
    const audienceValue = item?.audience || item?.settings?.audience || item?.visibility;
    const normalizedAudience = audienceValue === 'close_friends' ? 'closeFriends' : audienceValue;
    const isCloseFriendsAudience = normalizedAudience === 'closeFriends';
    const tileUri = item.thumbnailURL || item.mediaURLs?.[0] || item.mediaURL || item.mediaUrl;
    const mediaUri = item.mediaURL || item.mediaUrl || item.mediaURLs?.[0] || tileUri;
    const mediaIsVideo = /\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(String(mediaUri || '')) || item.mediaType === 'video' || isGlimpse;
    const hasStaticThumb = !!tileUri && !/\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(String(tileUri));
    const itemId = item.postId || item.storyId || item.glimpseId || item.id;
    const glimpseViewsCount = Number(item?.viewsCount ?? item?.viewCount ?? item?.stats?.viewsCount ?? item?.stats?.views ?? item?.views ?? 0) || 0;
    const showGlimpseViews = isGlimpse;

    return (
      <TouchableOpacity
        onPress={() => {
          if (!itemId) return;
          const lastLongPress = lastLongPressRef.current;
          if (lastLongPress && lastLongPress.itemId === itemId && Date.now() - lastLongPress.at < 320) {
            return;
          }
          clearTilePreview();
          openTileViewer(item, !!isGlimpse);
        }}
        onLongPress={() => {
          if (!itemId) return;
          lastLongPressRef.current = { itemId, at: Date.now() };
          handleTileLongPress({
            itemId,
            isGlimpse: !!isGlimpse,
            mediaIsVideo,
            mediaUri: String(mediaUri || ''),
            tileUri: String(tileUri || ''),
          });
        }}
        delayLongPress={180}
        onPressOut={() => clearTilePreview()}
        activeOpacity={0.9}
        style={[
          styles.gridItem,
          (index + 1) % 3 !== 0 ? styles.gridItemWithGap : null,
        ]}
      >
        {mediaIsVideo && !hasStaticThumb ? (
          <Video
            source={{ uri: mediaUri }}
            style={styles.gridImage}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isLooping={false}
            isMuted
          />
        ) : (
          <Image
            source={{ uri: tileUri || mediaUri }}
            style={styles.gridImage}
            contentFit="cover"
          />
        )}
        {isPinned ? (
          <View style={styles.pinTileBadge}>
            <MaterialCommunityIcons name="pin" size={16} color="#fff" style={styles.pinTileIcon} />
          </View>
        ) : null}
        {isCloseFriendsAudience ? (
          <View style={styles.closeFriendsTileBadge}>
            <MaterialCommunityIcons name="infinity" size={16} color="#6BFFB0" style={styles.closeFriendsTileIcon} />
          </View>
        ) : null}
        {item.postType === 'carousel' && (
          <View style={[styles.carouselBadge, isPinned ? { top: spacing.sm + 30 } : null]}>
            <Ionicons name="copy-outline" size={16} color="#fff" />
          </View>
        )}
        {item.mediaType === 'video' && !isGlimpse && (
          <View style={[styles.videoBadge, isPinned ? { top: spacing.sm + 30 } : null]}>
            <Ionicons name="play" size={16} color="#fff" />
          </View>
        )}
        {showGlimpseViews ? (
          <View style={styles.glimpseViewsBadge}>
            <Ionicons name="play" size={12} color="#fff" />
            <Text style={styles.glimpseViewsText}>{formatCompactCount(glimpseViewsCount)}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.contentGrid}>
      {currentData.length > 0 ? (
        <FlashList
          data={currentData}
          renderItem={renderPost}
          keyExtractor={(item, index) => item.postId || item.glimpseId || item.storyId || item.id || `${activeTab}-${index}`}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={styles.gridContainer as any}
          estimatedItemSize={imageSize}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name={activeTab === 'posts' ? 'camera-outline' : activeTab === 'glimpses' ? 'film-outline' : 'pricetag-outline'}
            size={48}
            color={colors.text.secondary}
          />
          <Text style={styles.emptyTitle}>
            {activeTab === 'posts' ? 'No posts or glimpses yet' : activeTab === 'glimpses' ? 'No glimpses yet' : 'No tagged posts'}
          </Text>
          <Text style={styles.emptyDescription}>
            {isOwnProfile
              ? `Share your first ${activeTab === 'posts' ? 'post' : activeTab === 'glimpses' ? 'glimpse' : 'tagged post'}`
              : `${profileUser.username} hasn't shared any ${activeTab} yet`
            }
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  contentGrid: {
    flex: 1,
  },
  gridContainer: {
    paddingTop: gridGap,
    paddingBottom: spacing.sm,
    paddingHorizontal: gridSideInset,
  },
  gridRow: {
    width: '100%',
    justifyContent: 'flex-start',
    marginBottom: gridGap,
  },
  gridItem: {
    width: imageSize,
    height: imageSize,
    marginBottom: gridGap,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.background.secondary,
  },
  gridItemWithGap: {
    marginRight: gridGap,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.secondary,
  },
  carouselBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  videoBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  pinTileBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm - 1,
    zIndex: 4,
  },
  closeFriendsTileBadge: {
    position: 'absolute',
    top: spacing.sm - 1,
    left: spacing.sm,
    zIndex: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7, 89, 62, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(110, 255, 176, 0.72)',
    shadowColor: '#6BFFB0',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  closeFriendsTileIcon: {
    textShadowColor: 'rgba(4, 120, 87, 0.42)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 1 },
  },
  pinTileIcon: {
    transform: [{ rotate: '28deg' }],
    opacity: 0.98,
    textShadowColor: 'rgba(2, 6, 23, 0.42)',
    textShadowRadius: 5,
    textShadowOffset: { width: 0, height: 1 },
  },
  glimpseViewsBadge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  glimpseViewsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold as any,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
