import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';

interface TilePreviewModalProps {
  tilePreview: {
    itemId: string;
    isGlimpse: boolean;
    mediaIsVideo: boolean;
    mediaUri: string;
    tileUri: string;
    username: string;
  } | null;
  clearTilePreview: () => void;
  profileUser: any;
}

export function TilePreviewModal({ tilePreview, clearTilePreview, profileUser }: TilePreviewModalProps) {
  return (
    <Modal
      visible={!!tilePreview}
      transparent
      animationType="fade"
      onRequestClose={clearTilePreview}
    >
      <View style={styles.tilePreviewOverlay} pointerEvents="none">
        <BlurView intensity={34} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={styles.tilePreviewDimLayer} />
        <View style={styles.tilePreviewCard}>
          {tilePreview?.mediaIsVideo && !tilePreview?.tileUri ? (
            <Video
              source={{ uri: tilePreview?.mediaUri || '' }}
              style={styles.tilePreviewMedia}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
          ) : (
            <Image
              source={{ uri: tilePreview?.tileUri || tilePreview?.mediaUri || '' }}
              style={styles.tilePreviewMedia}
              contentFit="cover"
            />
          )}
          <View style={styles.tilePreviewFooter}>
            <Text style={styles.tilePreviewTitle} numberOfLines={1}>
              @{tilePreview?.username || profileUser?.username || 'user'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tilePreviewOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tilePreviewDimLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  tilePreviewCard: {
    width: '85%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  tilePreviewMedia: {
    width: '100%',
    height: '100%',
  },
  tilePreviewFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  tilePreviewTitle: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
