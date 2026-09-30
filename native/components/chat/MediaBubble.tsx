import { InlineLoadingSkeleton } from '../ui/LoadingSkeleton';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  useWindowDimensions,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  Animated,
  PanResponder,
  InteractionManager} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { Image } from 'expo-image';

type MediaBubbleItem = {
  url: string;
  type: 'image' | 'video' | 'gif' | 'sticker';
  thumbnailURL?: string;
};

interface MediaBubbleProps {
  url?: string;
  type?: 'image' | 'video' | 'gif' | 'sticker';
  items?: MediaBubbleItem[];
  isVisible: boolean;
  stylesRef: any;
  senderDisplayName?: string;
  senderVerified?: boolean;
}

const MediaBubble: React.FC<MediaBubbleProps> = ({
  url = '',
  type = 'image',
  items,
  isVisible,
  stylesRef,
  senderDisplayName = 'User',
  senderVerified = false,
}) => {
  const s = stylesRef;
  const { width, height } = useWindowDimensions();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const viewerSwipeX = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video | null>(null);

  // Cleanup video player when modal closes
  useEffect(() => {
    if (!viewerVisible && videoRef.current) {
      // Schedule cleanup on main thread using InteractionManager
      const task = InteractionManager.runAfterInteractions(() => {
        if (videoRef.current) {
          videoRef.current.unloadAsync().catch(() => {});
          videoRef.current = null;
        }
      });
      
      return () => task.cancel();
    }
  }, [viewerVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Ensure cleanup happens on main thread
      InteractionManager.runAfterInteractions(() => {
        if (videoRef.current) {
          videoRef.current.unloadAsync().catch(() => {});
        }
      });
    };
  }, []);

  const mediaItems = useMemo(() => {
    if (Array.isArray(items) && items.length > 0) {
      return items.filter((entry) => typeof entry?.url === 'string' && entry.url.trim().length > 0);
    }
    if (typeof url === 'string' && url.trim().length > 0) {
      return [{ url, type }];
    }
    return [] as MediaBubbleItem[];
  }, [items, type, url]);

  const primaryItem = mediaItems[0];
  const mediaBaseWidth = Math.min(width >= 768 ? 320 : 268, Math.max(184, Math.floor(width * (width >= 768 ? 0.4 : 0.62))));
  const mediaImageHeight = Math.round(mediaBaseWidth * 1.08);
  const mediaVideoHeight = Math.round(mediaBaseWidth * 1.16);
  const bareSize = Math.min(width >= 768 ? 280 : 244, Math.max(136, Math.floor(width * 0.5)));
  const viewerWidth = width;
  const viewerHeight = Math.max(320, height - 120);
  const isStickerOrGif = primaryItem?.type === 'gif' || primaryItem?.type === 'sticker';
  const stackCount = mediaItems.length;

  const settleViewerSwipe = (toValue = 0) => {
    Animated.spring(viewerSwipeX, {
      toValue,
      useNativeDriver: true,
      tension: 120,
      friction: 12,
    }).start();
  };

  const viewerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          stackCount > 1 &&
          Math.abs(gestureState.dx) > 10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2,
        onPanResponderMove: (_, gestureState) => {
          const clampedDx = Math.max(-96, Math.min(96, gestureState.dx));
          viewerSwipeX.setValue(clampedDx);
        },
        onPanResponderRelease: (_, gestureState) => {
          const threshold = 46;
          if (gestureState.dx <= -threshold && viewerIndex < stackCount - 1) {
            Animated.timing(viewerSwipeX, {
              toValue: -viewerWidth * 0.2,
              duration: 120,
              useNativeDriver: true,
            }).start(() => {
              viewerSwipeX.setValue(0);
              setViewerIndex((prev) => Math.min(stackCount - 1, prev + 1));
            });
            return;
          }

          if (gestureState.dx >= threshold && viewerIndex > 0) {
            Animated.timing(viewerSwipeX, {
              toValue: viewerWidth * 0.2,
              duration: 120,
              useNativeDriver: true,
            }).start(() => {
              viewerSwipeX.setValue(0);
              setViewerIndex((prev) => Math.max(0, prev - 1));
            });
            return;
          }

          settleViewerSwipe();
        },
        onPanResponderTerminate: () => {
          settleViewerSwipe();
        },
      }),
    [stackCount, viewerIndex, viewerSwipeX, viewerWidth]
  );

  if (!primaryItem) {
    return <Text style={[s.messageText, { color: '#cbd5e1' }]}>Unsupported media</Text>;
  }

  if (!isVisible && primaryItem.type !== 'gif' && primaryItem.type !== 'sticker') {
    return (
      <View style={[s.mediaPlaceholder, { width: mediaBaseWidth, height: mediaImageHeight }]}>
        <InlineLoadingSkeleton />
      </View>
    );
  }

  const openViewer = (index: number) => {
    setViewerIndex(index);
    viewerSwipeX.setValue(0);
    setViewerVisible(true);
  };

  const renderPreview = (entry: MediaBubbleItem, index: number, isStackedCard: boolean) => {
    const previewType = entry.type;
    const previewUrl = entry.thumbnailURL || entry.url;
    const previewHeight = previewType === 'video' ? mediaVideoHeight : mediaImageHeight;

    if (previewType === 'video') {
      return (
        <View style={[styles.previewCard, isStackedCard && styles.previewCardShadow, { width: mediaBaseWidth, height: previewHeight }]}>
          <Image source={{ uri: previewUrl, cache: 'force-cache' as any }} style={[s.messageImage, styles.mediaTransparent, { width: mediaBaseWidth, height: previewHeight }]} contentFit="cover" fadeDuration={0} />
          <View style={styles.playBadge}>
            <Ionicons name="play" size={18} color="#ffffff" />
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.previewCard, isStackedCard && styles.previewCardShadow, { width: isStickerOrGif ? bareSize : mediaBaseWidth, height: isStickerOrGif ? bareSize : previewHeight }]}>
        <Image
          source={{ uri: previewUrl, cache: 'force-cache' as any }}
          style={
            isStickerOrGif
              ? [s.messageImage, s.messageImageBare, styles.mediaTransparent, { width: bareSize, height: bareSize }]
              : [s.messageImage, styles.mediaTransparent, { width: mediaBaseWidth, height: previewHeight }]
          }
          contentFit={isStickerOrGif ? 'contain' : 'cover'}
          fadeDuration={0}
        />
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity activeOpacity={0.92} onPress={() => openViewer(0)}>
        {stackCount > 1 ? (
          <View style={[styles.stackWrap, { width: mediaBaseWidth + 16, height: mediaImageHeight + 18 }]}>
            {mediaItems.slice(0, 3).reverse().map((entry, reverseIndex) => {
              const actualIndex = Math.min(2, stackCount - 1) - reverseIndex;
              const isTopCard = reverseIndex === 0;
              const offset = reverseIndex * 10;
              return (
                <View
                  key={entry.url + ':' + String(actualIndex)}
                  style={[
                    styles.stackCard,
                    {
                      top: offset,
                      left: offset,
                      transform: [{ rotate: `${(reverseIndex - 1) * 2.5}deg` }],
                      zIndex: 10 - reverseIndex,
                    },
                  ]}
                >
                  {renderPreview(entry, actualIndex, true)}
                  {isTopCard && stackCount > 1 ? (
                    <View style={styles.stackCountPill}>
                      <Ionicons name="images-outline" size={12} color="#fff" />
                      <Text style={styles.stackCountText}>{stackCount}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : isStickerOrGif ? (
          <View style={s.mediaBare}>{renderPreview(primaryItem, 0, false)}</View>
        ) : (
          renderPreview(primaryItem, 0, false)
        )}
      </TouchableOpacity>

      <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.viewerBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setViewerVisible(false)} />
          <View style={styles.viewerShell}>
            <View style={styles.viewerHeader}>
              <View style={styles.viewerSenderMeta}>
                <Text numberOfLines={1} style={styles.viewerSenderName}>{senderDisplayName || 'User'}</Text>
                {senderVerified ? <VerifiedBadge size={14} /> : null}
              </View>
              <View style={styles.viewerHeaderRight}>
                <Text style={styles.viewerTitle}>{stackCount > 1 ? `${viewerIndex + 1} / ${stackCount}` : 'Media'}</Text>
                <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)}>
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.viewerStage, { height: viewerHeight }]}>
              <Animated.View
                style={[styles.viewerMediaWrap, { transform: [{ translateX: viewerSwipeX }] }]}
                {...(stackCount > 1 ? viewerPanResponder.panHandlers : {})}
              >
                {mediaItems[viewerIndex]?.type === 'video' ? (
                  <Video
                    ref={videoRef}
                    source={{ uri: mediaItems[viewerIndex].url }}
                    style={styles.viewerMedia}
                    resizeMode={ResizeMode.CONTAIN}
                    useNativeControls
                    shouldPlay
                  />
                ) : (
                  <Image source={{ uri: mediaItems[viewerIndex]?.url, cache: 'force-cache' as any }} style={styles.viewerMedia} contentFit="contain" fadeDuration={0} />
                )}
              </Animated.View>
            </View>

            {stackCount > 1 ? (
              <View style={styles.viewerDots}>
                {mediaItems.map((entry, index) => (
                  <View key={entry.url + ':' + String(index)} style={[styles.viewerDot, index === viewerIndex && styles.viewerDotActive]} />
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  mediaTransparent: {
    backgroundColor: 'transparent',
  },
  previewCard: {
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  previewCardShadow: {
    shadowColor: '#020617',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  playBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.52)',
  },
  stackWrap: {
    position: 'relative',
  },
  stackCard: {
    position: 'absolute',
  },
  stackCountPill: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
  },
  stackCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.96)',
  },
  viewerShell: {
    flex: 1,
    width: '100%',
    paddingTop: 22,
    paddingHorizontal: 10,
    paddingBottom: 14,
    backgroundColor: 'rgba(2, 6, 23, 0.96)',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  viewerSenderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    maxWidth: '64%',
  },
  viewerSenderName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    maxWidth: '100%',
  },
  viewerHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewerTitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  viewerClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  viewerStage: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  viewerMediaWrap: {
    flex: 1,
  },
  viewerMedia: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  viewerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  viewerDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  viewerDotActive: {
    width: 20,
    backgroundColor: '#f5f5f5',
  },
});

export default MediaBubble;
