import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ViewToken, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, colors, spacing, typography } from '../../styles/theme';
import { Image } from 'expo-image';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';

interface MediaItem {
  uri: string;
  thumbnail?: string;
  type?: 'image' | 'video' | string;
  duration?: number;
}

interface PostMediaPreviewModalProps {
  visible: boolean;
  mediaItems: MediaItem[];
  initialIndex: number;
  onClose: () => void;
  onEdit?: (index: number) => void;
  onIndexChange?: (index: number) => void;
}

export function PostMediaPreviewModal({
  visible,
  mediaItems,
  initialIndex,
  onClose,
  onEdit,
  onIndexChange,
}: PostMediaPreviewModalProps) {
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlashList<MediaItem>>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible || mediaItems.length === 0) return;
    const nextIndex = Math.max(0, Math.min(initialIndex, mediaItems.length - 1));
    setActiveIndex(nextIndex);
    const timer = setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: nextIndex * width, animated: false });
    }, 24);
    return () => clearTimeout(timer);
  }, [visible, initialIndex, mediaItems.length, width]);

  useEffect(() => {
    onIndexChange?.(activeIndex);
  }, [activeIndex, onIndexChange]);

  const itemLayout = useCallback(
    (_: ArrayLike<MediaItem> | null | undefined, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<MediaItem>[] }) => {
      const next = viewableItems[0]?.index;
      if (typeof next === 'number') {
        setActiveIndex(next);
      }
    },
  ).current;

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 65 }),
    [],
  );

  const renderPreviewItem = useCallback(
    ({ item }: ListRenderItemInfo<MediaItem>) => (
      <View style={[styles.slide, { width }]}> 
        <Image
          source={{ uri: item.type === 'video' ? item.thumbnail || item.uri : item.uri }}
          style={[styles.previewImage, { width: width - spacing.xl, height: height * 0.68 }]}
          contentFit="contain"
        />
        {item.type === 'video' ? (
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={16} color="#FFFFFF" />
            <Text style={styles.videoBadgeText}>Video preview</Text>
          </View>
        ) : null}
      </View>
    ),
    [height, width],
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Preview</Text>
            <Text style={styles.headerSubtitle}>{mediaItems.length ? `${activeIndex + 1} of ${mediaItems.length}` : '0 of 0'}</Text>
          </View>
          {mediaItems[activeIndex]?.type !== 'video' ? (
            <TouchableOpacity style={styles.headerButton} onPress={() => onEdit?.(activeIndex)}>
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        <FlashList estimatedItemSize={100}
          ref={listRef}
          data={mediaItems}
          keyExtractor={(item, index) => `${item.uri}_${index}`}
          renderItem={renderPreviewItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews
          // maxToRenderPerBatch is deprecated by FlashList
          // windowSize is deprecated by FlashList
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />

        <View style={styles.footer}>
          {mediaItems.length > 1 ? (
            <Text style={styles.footerHint}>Swipe to review attached media</Text>
          ) : (
            <Text style={styles.footerHint}>Tap the pencil to edit this image</Text>
          )}

          <FlashList estimatedItemSize={100}
            data={mediaItems}
            horizontal
            keyExtractor={(item, index) => `thumb_${item.uri}_${index}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbRail as any}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.thumb, activeIndex === index && styles.thumbActive]}
                onPress={() => {
                  setActiveIndex(index);
                  listRef.current?.scrollToOffset({ offset: index * width, animated: true });
                }}
              >
                <Image source={{ uri: item.thumbnail || item.uri }} style={styles.thumbImage} />
                {item.type === 'video' ? (
                  <View style={styles.thumbVideoDot}>
                    <Ionicons name="play" size={10} color="#FFFFFF" />
                  </View>
                ) : null}
              </TouchableOpacity>
            )}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
  },
  headerSubtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.68)',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium as any,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  previewImage: {
    borderRadius: borderRadius.xl,
    backgroundColor: '#0E1327',
  },
  videoBadge: {
    position: 'absolute',
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(8, 12, 24, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  footerHint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.66)',
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  thumbRail: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.background.secondary,
  },
  thumbActive: {
    borderColor: colors.interactive.primary,
    transform: [{ translateY: -2 }],
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbVideoDot: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
});
