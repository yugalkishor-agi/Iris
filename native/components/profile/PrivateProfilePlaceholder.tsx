import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/Avatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { ButtonLoadingSkeleton, LoadingSkeleton } from '../ui/LoadingSkeleton';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';

interface PrivateProfilePlaceholderProps {
  profileUser: any;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  hasPendingFollowRequest: boolean;
  mutualFollowers: any[];
  isProfileVerified: boolean;
  followCtaLabel: string;
  actionLoading: boolean;
  handleFollow: () => void;
  privateSuggestions: any[];
  loadingPrivateSuggestions: boolean;
  suggestionActionLoading: Record<string, boolean>;
  hidePrivateSuggestions: boolean;
  setHidePrivateSuggestions: (val: any) => void;
  dismissPrivateSuggestion: (userId: string) => void;
  handleSuggestedFollow: (user: any) => void;
  navigation: any;
  privatePostsCount: number;
}

export function PrivateProfilePlaceholder({
  profileUser,
  followersCount,
  followingCount,
  isFollowing,
  hasPendingFollowRequest,
  mutualFollowers,
  isProfileVerified,
  followCtaLabel,
  actionLoading,
  handleFollow,
  privateSuggestions,
  loadingPrivateSuggestions,
  suggestionActionLoading,
  hidePrivateSuggestions,
  setHidePrivateSuggestions,
  dismissPrivateSuggestion,
  handleSuggestedFollow,
  navigation,
  privatePostsCount
}: PrivateProfilePlaceholderProps) {
  return (
    <>
      <View style={styles.privateProfileHeader}>
        <LinearGradient
          colors={[
            isProfileVerified ? '#667eea' : '#5b6cff',
            isProfileVerified ? '#764ba2' : '#7b4dff',
            '#d96ff0',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.privateHeroBackdrop}
        >
          <View style={styles.privateHeroGlow} />
        </LinearGradient>

        <View style={styles.privateAvatarSection}>
          <View style={styles.privateAvatarShell}>
            <LinearGradient
              colors={isFollowing ? ['#4facfe', '#00f2fe'] : ['#fa709a', '#fee140']}
              style={styles.privateAvatarGradientRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.privateAvatarInnerRing}>
                <Avatar
                  source={profileUser?.avatarURL}
                  size={108}
                  fallbackText={profileUser?.displayName || profileUser?.username || '?'}
                />
              </View>
            </LinearGradient>
            <View style={styles.privateLockBadge}>
              <Ionicons name="lock-closed" size={18} color={colors.text.inverse} />
            </View>
          </View>
        </View>

        <View style={styles.privateProfileInfo}>
          <View style={styles.privateLockedIdentity}>
            <Text style={styles.privateLockedName}>{profileUser?.displayName || profileUser?.username}</Text>
            {isProfileVerified ? <VerifiedBadge size={16} style={styles.privateVerifiedBadge} interactive /> : null}
          </View>
          {profileUser?.username ? (
            <Text style={styles.privateLockedUsername}>@{profileUser.username}</Text>
          ) : null}
          <View style={styles.privateMetaPill}>
            <Ionicons name="lock-closed-outline" size={13} color={colors.text.primary} />
            <Text style={styles.privateMetaPillText}>Private profile</Text>
          </View>

          <View style={styles.privateStatsPanel}>
            <View style={styles.privateStatColumn}>
              <Text style={styles.privateStatNumber}>{privatePostsCount}</Text>
              <Text style={styles.privateStatLabel}>Posts</Text>
            </View>
            <View style={styles.privateStatDivider} />
            <View style={styles.privateStatColumn}>
              <Text style={styles.privateStatNumber}>{followersCount}</Text>
              <Text style={styles.privateStatLabel}>Followers</Text>
            </View>
            <View style={styles.privateStatDivider} />
            <View style={styles.privateStatColumn}>
              <Text style={styles.privateStatNumber}>{followingCount}</Text>
              <Text style={styles.privateStatLabel}>Following</Text>
            </View>
          </View>

          {mutualFollowers.length > 0 ? (
            <View style={styles.privateMutualRow}>
              <View style={styles.privateMutualAvatars}>
                {mutualFollowers.slice(0, 2).map((follower, index) => (
                  <Avatar
                    key={follower.userId}
                    source={follower.avatarURL}
                    size={24}
                    style={index > 0 ? { ...styles.privateMutualAvatar, ...styles.privateMutualAvatarOverlap } : styles.privateMutualAvatar}
                  />
                ))}
              </View>
              <Text style={styles.privateMutualText}>
                Followed by {mutualFollowers[0].username}
                {mutualFollowers.length > 1 ? ` and ${mutualFollowers.length - 1} more` : ''}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.privateActionSection}>
          <TouchableOpacity
            style={[styles.privateActionButton, hasPendingFollowRequest && styles.privateActionButtonMuted]}
            onPress={handleFollow}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            {actionLoading ? (
              <ButtonLoadingSkeleton inverse />
            ) : (
              <Text style={styles.privateActionButtonText}>{followCtaLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.privacyGateCard}>
        <View style={styles.privacyGateRow}>
          <View style={styles.privacyGateIconWrap}>
            <Ionicons name="lock-closed-outline" size={26} color={colors.text.primary} />
          </View>
          <View style={styles.privacyGateCopy}>
            <Text style={styles.privacyGateTitle}>This account is private</Text>
            <Text style={styles.privacyGateText}>
              Follow this account to see their posts, glimpses, and profile activity.
            </Text>
          </View>
        </View>
      </View>
      {(loadingPrivateSuggestions || privateSuggestions.length > 0) ? (
        <View style={styles.privateSuggestionsSection}>
          <View style={styles.privateSuggestionsHeader}>
            <Text style={styles.privateSuggestionsTitle}>Suggested for you</Text>
            <TouchableOpacity
              onPress={() => setHidePrivateSuggestions((current: boolean) => !current)}
              activeOpacity={0.75}
              style={styles.privateSuggestionsToggle}
            >
              <Text style={styles.privateSuggestionsToggleText}>
                {hidePrivateSuggestions ? 'Show' : 'Hide'}
              </Text>
            </TouchableOpacity>
          </View>
          {hidePrivateSuggestions ? (
            <View style={styles.privateSuggestionsHiddenState}>
              <Text style={styles.privateSuggestionsHiddenText}>Suggestions hidden for now.</Text>
            </View>
          ) : loadingPrivateSuggestions ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.privateSuggestionsList as any}>
              {[0, 1, 2].map((item) => (
                <View key={item} style={styles.privateSuggestionCard}>
                  <LoadingSkeleton width={72} height={72} borderRadius={36} />
                  <LoadingSkeleton width="78%" height={14} borderRadius={999} style={{ marginTop: spacing.md }} />
                  <LoadingSkeleton width="56%" height={12} borderRadius={999} style={{ marginTop: spacing.xs }} />
                  <LoadingSkeleton width="100%" height={38} borderRadius={borderRadius.lg} style={{ marginTop: spacing.lg }} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.privateSuggestionsList as any}>
              {privateSuggestions.map((suggestedUser) => (
                <View key={suggestedUser.userId} style={styles.privateSuggestionCard}>
                  <TouchableOpacity
                    style={styles.privateSuggestionDismiss}
                    activeOpacity={0.75}
                    onPress={() => dismissPrivateSuggestion(suggestedUser.userId)}
                  >
                    <Ionicons name="close" size={14} color={colors.text.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.88}
                    style={styles.privateSuggestionContent}
                    onPress={() => (navigation as any).navigate('UserProfile', { userId: suggestedUser.userId })}
                  >
                    <Avatar
                      source={suggestedUser.avatarURL}
                      size={72}
                      fallbackText={suggestedUser.displayName || suggestedUser.username || '?'}
                    />
                    <Text style={styles.privateSuggestionName} numberOfLines={1}>
                      {suggestedUser.displayName || suggestedUser.username}
                    </Text>
                    <Text style={styles.privateSuggestionUsername} numberOfLines={1}>
                      @{suggestedUser.username}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.privateSuggestionButton}
                    activeOpacity={0.85}
                    onPress={() => handleSuggestedFollow(suggestedUser)}
                    disabled={!!suggestionActionLoading[suggestedUser.userId]}
                  >
                    {suggestionActionLoading[suggestedUser.userId] ? (
                      <ButtonLoadingSkeleton inverse />
                    ) : (
                      <Text style={styles.privateSuggestionButtonText}>
                        {suggestedUser?.isPrivate ? 'Request' : 'Follow'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  privateProfileHeader: {
    paddingBottom: spacing.xxl,
    position: 'relative',
  },
  privateHeroBackdrop: {
    height: 140,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  privateHeroGlow: {
    position: 'absolute',
    bottom: -60,
    left: '10%',
    right: '10%',
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 60,
    transform: [{ scaleX: 1.5 }],
  },
  privateAvatarSection: {
    alignItems: 'center',
    marginTop: -54,
    marginBottom: spacing.md,
    zIndex: 10,
  },
  privateAvatarShell: {
    position: 'relative',
    backgroundColor: colors.background.primary,
    borderRadius: 60,
    padding: 3,
  },
  privateAvatarGradientRing: {
    borderRadius: 56,
    padding: 3,
  },
  privateAvatarInnerRing: {
    backgroundColor: colors.background.primary,
    borderRadius: 53,
    padding: 3,
  },
  privateLockBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.accent.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background.primary,
  },
  privateProfileInfo: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
  privateLockedIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 4,
  },
  privateLockedName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  privateVerifiedBadge: {
    marginLeft: 2,
    marginTop: 2,
  },
  privateLockedUsername: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  privateMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 6,
    marginBottom: spacing.xl,
  },
  privateMetaPillText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
  },
  privateStatsPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  privateStatColumn: {
    flex: 1,
    alignItems: 'center',
  },
  privateStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border.medium,
  },
  privateStatNumber: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: 2,
  },
  privateStatLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium as any,
  },
  privateMutualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  privateMutualAvatars: {
    flexDirection: 'row',
    marginRight: spacing.sm,
  },
  privateMutualAvatar: {
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  privateMutualAvatarOverlap: {
    marginLeft: -8,
  },
  privateMutualText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  privateActionSection: {
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  privateActionButton: {
    backgroundColor: colors.accent.primary,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  privateActionButtonMuted: {
    backgroundColor: colors.background.tertiary,
  },
  privateActionButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
  },
  privacyGateCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  privacyGateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  privacyGateIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyGateCopy: {
    flex: 1,
  },
  privacyGateTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: 4,
  },
  privacyGateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  privateSuggestionsSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  privateSuggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  privateSuggestionsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  privateSuggestionsToggle: {
    padding: spacing.xs,
  },
  privateSuggestionsToggleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.secondary,
  },
  privateSuggestionsHiddenState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privateSuggestionsHiddenText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  privateSuggestionsList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  privateSuggestionCard: {
    width: 150,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  privateSuggestionDismiss: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: 4,
    zIndex: 10,
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
  },
  privateSuggestionContent: {
    alignItems: 'center',
    width: '100%',
  },
  privateSuggestionName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: 2,
    textAlign: 'center',
  },
  privateSuggestionUsername: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  privateSuggestionButton: {
    width: '100%',
    height: 32,
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  privateSuggestionButtonText: {
    color: colors.text.inverse,
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold as any,
  },
});
