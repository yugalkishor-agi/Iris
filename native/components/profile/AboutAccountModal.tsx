import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';

interface AboutAccountModalProps {
  visible: boolean;
  onClose: () => void;
  profileUser: any;
  isProfileVerified: boolean;
}

export function AboutAccountModal({ visible, onClose, profileUser, isProfileVerified }: AboutAccountModalProps) {
  const formatAboutAccountDate = (value: any) => {
    if (!value) return 'Date not available';
    const date = value?.toDate ? value.toDate() : value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date?.getTime?.())) return 'Date not available';
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getAccountCountryLabel = (user: any) => {
    const candidates = [
      user?.country,
      user?.location,
      user?.businessInfo?.address,
    ];

    for (const candidate of candidates) {
      if (typeof candidate !== 'string') continue;
      const trimmed = candidate.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(',').map((part: string) => part.trim()).filter(Boolean);
      return parts[parts.length - 1] || trimmed;
    }

    return 'Location not available';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.aboutAccountOverlay}>
        <TouchableOpacity style={styles.aboutAccountBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.aboutAccountCard}>
          <LinearGradient
            colors={['#111827', '#0F172A', '#020617']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aboutAccountCardGradient}
          >
            <View style={styles.aboutAccountHeader}>
              <Text style={styles.aboutAccountTitle}>About this account</Text>
              <TouchableOpacity style={styles.aboutAccountCloseButton} onPress={onClose} activeOpacity={0.8}>
                <Ionicons name="close" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.aboutAccountIdentity}>
              <Avatar source={profileUser?.avatarURL} size={68} style={styles.aboutAccountAvatar} />
              <View style={styles.aboutAccountIdentityText}>
                <View style={styles.aboutAccountNameRow}>
                  <Text style={styles.aboutAccountDisplayName} numberOfLines={1}>
                    {profileUser?.displayName || profileUser?.username}
                  </Text>
                </View>
                <View style={styles.aboutAccountUsernameRow}>
                  <Text style={styles.aboutAccountUsername}>@{profileUser?.username}</Text>
                  {isProfileVerified ? (
                    <VerifiedBadge size={18} style={styles.aboutAccountInlineBadge} />
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.aboutAccountFacts}>
              <View style={styles.aboutAccountFactRow}>
                <View style={styles.aboutAccountFactIconWrap}>
                  <Ionicons name="calendar-outline" size={18} color="#7DD3FC" />
                </View>
                <View style={styles.aboutAccountFactText}>
                  <Text style={styles.aboutAccountFactLabel}>Account created</Text>
                  <Text style={styles.aboutAccountFactValue}>{formatAboutAccountDate(profileUser?.createdAt)}</Text>
                </View>
              </View>

              <View style={styles.aboutAccountFactRow}>
                <View style={styles.aboutAccountFactIconWrap}>
                  <Ionicons name="earth-outline" size={18} color="#7DD3FC" />
                </View>
                <View style={styles.aboutAccountFactText}>
                  <Text style={styles.aboutAccountFactLabel}>Based in</Text>
                  <Text style={styles.aboutAccountFactValue}>{getAccountCountryLabel(profileUser)}</Text>
                </View>
              </View>
            </View>

            {isProfileVerified ? (
              <View style={styles.aboutAccountVerifiedPanel}>
                <View style={styles.aboutAccountVerifiedPanelHeader}>
                  <VerifiedBadge size={18} />
                  <Text style={styles.aboutAccountVerifiedPanelTitle}>Verified Account</Text>
                </View>
                <Text style={styles.aboutAccountVerifiedPanelText}>
                  This account has been verified as authentic by Iris. Identity verification helps keep the community safe.
                </Text>
              </View>
            ) : null}

            <View style={styles.aboutAccountFooter}>
              <Text style={styles.aboutAccountFooterText}>
                To help keep our community authentic, we're showing information about accounts on Iris.
              </Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  aboutAccountOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutAccountBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  aboutAccountCard: {
    width: '85%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  aboutAccountCardGradient: {
    width: '100%',
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  aboutAccountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  aboutAccountTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  aboutAccountCloseButton: {
    position: 'absolute',
    right: 0,
    padding: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  aboutAccountIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  aboutAccountAvatar: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  aboutAccountIdentityText: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  aboutAccountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aboutAccountDisplayName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: 2,
  },
  aboutAccountUsernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aboutAccountUsername: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  aboutAccountInlineBadge: {
    marginLeft: 4,
  },
  aboutAccountFacts: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  aboutAccountFactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aboutAccountFactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(125, 211, 252, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutAccountFactText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  aboutAccountFactLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  aboutAccountFactValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  aboutAccountVerifiedPanel: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  aboutAccountVerifiedPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  aboutAccountVerifiedPanelTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  aboutAccountVerifiedPanelText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  aboutAccountFooter: {
    marginTop: spacing.md,
  },
  aboutAccountFooterText: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
