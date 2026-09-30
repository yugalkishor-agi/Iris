import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { CachedImage } from '../ui/CachedImage';
import { colors, spacing } from '../../styles/theme';
import { SearchCreatorGlimpse } from '../../hooks/search/searchTypes';

interface SearchPreviewModalProps {
  previewItem: SearchCreatorGlimpse | null;
}

export function SearchPreviewModal({ previewItem }: SearchPreviewModalProps) {
  if (!previewItem) return null;

  return (
    <Modal visible={true} transparent animationType="fade">
      <BlurView intensity={24} tint="dark" style={styles.previewOverlay}>
        <View style={styles.previewCard}>
          <CachedImage uri={previewItem.previewURL} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.previewShade} />
          <View style={styles.previewHeader}>
            <Avatar source={previewItem.authorAvatarURL} size={46} />
            <View style={styles.previewIdentity}>
              <View style={styles.previewIdentityRow}>
                <Text style={styles.previewUsername} numberOfLines={1}>
                  {previewItem.authorUsername}
                </Text>
                {previewItem.authorVerified ? <VerifiedBadge size={14} /> : null}
              </View>
              <Text style={styles.previewMeta}>{previewItem.reason}</Text>
            </View>
          </View>
          {previewItem.caption ? (
            <View style={styles.previewFooter}>
              <Text style={styles.previewCaption} numberOfLines={3}>
                {previewItem.caption}
              </Text>
              <Text style={styles.previewHint}>Release to open</Text>
            </View>
          ) : null}
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,12,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  previewCard: {
    width: '100%',
    maxWidth: 360,
    height: 460,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#080C13',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  previewShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,10,18,0.18)',
  },
  previewHeader: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIdentity: {
    flex: 1,
    marginLeft: 12,
  },
  previewIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewUsername: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    maxWidth: '86%',
  },
  previewMeta: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  previewFooter: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
  },
  previewCaption: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
  },
  previewHint: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
  },
});
