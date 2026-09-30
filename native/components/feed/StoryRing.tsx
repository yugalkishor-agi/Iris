import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Avatar } from '../ui/Avatar';
import { useStoryRingGyro } from '../../hooks/useStoryRingGyro';
import { borderRadius, colors, spacing, typography } from '../../styles/theme';

type StoryStatus = 'new' | 'viewed' | 'close-friends' | 'own';

interface StoryRingProps {
  user: {
    id: string | number;
    name: string;
    avatar?: string;
    stories: any[];
    isOwn?: boolean;
    isCloseFriend?: boolean;
    username?: string;
    userId?: string;
    hasActiveStory?: boolean;
    hasViewedAll?: boolean;
  };
  status?: StoryStatus;
  onPress: (user: any) => void;
  onProfilePress?: (user: any) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const RING_SIZE = 92;
const INNER_SIZE = 82;
const AVATAR_SIZE = 72;
const PULSE_DURATION = 1500;
const RIPPLE_OPEN_DELAY = 135;
const TILT_RANGE = 6.4;

type GradientPalette = readonly [string, string, ...string[]];

const palettes: Record<StoryStatus, GradientPalette> = {
  new: ['#FF9D85', '#E86FEA', '#8E83FF'],
  own: ['#7BD9FF', '#8C94FF', '#C28BFF'],
  viewed: ['#687081', '#5A6170', '#474E5C'],
  'close-friends': ['#52D993', '#2FC57C', '#1EA965'],
};

const StoryRingComponent = function StoryRing({ user, status = 'new', onPress, onProfilePress }: StoryRingProps) {
  const navigation = useNavigation();
  const pressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolvedStatus = useMemo<StoryStatus>(() => {
    if (user.isOwn) {
      return user.hasActiveStory ? (user.hasViewedAll ? 'viewed' : 'own') : 'own';
    }
    if (user.isCloseFriend && status !== 'viewed') return 'close-friends';
    if (user.hasViewedAll || status === 'viewed') return 'viewed';
    return 'new';
  }, [status, user.hasActiveStory, user.hasViewedAll, user.isCloseFriend, user.isOwn]);

  const palette = palettes[resolvedStatus];
  const showRing = !!user.hasActiveStory;
  const gyroEnabled = showRing && resolvedStatus !== 'viewed';
  const { tiltX, tiltY } = useStoryRingGyro(gyroEnabled);

  const pressScale = useSharedValue(1);
  const rippleScale = useSharedValue(0.82);
  const rippleOpacity = useSharedValue(0);
  const pulse = useSharedValue(resolvedStatus === 'new' ? 1 : 0);
  const liquidDrift = useSharedValue(0);

  useEffect(() => {
    if (resolvedStatus === 'new') {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulse.value = withTiming(0, { duration: 220 });
    }
  }, [pulse, resolvedStatus]);

  useEffect(() => {
    liquidDrift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 2800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [liquidDrift]);

  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
      }
    };
  }, []);

  const handleLongPress = () => {
    if (!user.isOwn && onProfilePress) {
      onProfilePress(user);
      return;
    }
    if (!user.isOwn) {
      if (user.userId) {
        (navigation as any).navigate('UserProfile', { userId: user.userId });
      } else if (user.username) {
        (navigation as any).navigate('UserProfile', { username: user.username });
      }
    }
  };

  const handlePressIn = () => {
    pressScale.value = withSpring(0.975, { damping: 15, stiffness: 220, mass: 0.7 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 16, stiffness: 240, mass: 0.75 });
  };

  const handlePress = () => {
    rippleOpacity.value = 0.22;
    rippleScale.value = 0.88;
    pressScale.value = withSpring(0.955, { damping: 17, stiffness: 260, mass: 0.65 }, () => {
      pressScale.value = withSpring(1, { damping: 17, stiffness: 250, mass: 0.8 });
    });
    rippleScale.value = withTiming(1.22, { duration: 300, easing: Easing.out(Easing.cubic) });
    rippleOpacity.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });

    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
    }
    pressTimeoutRef.current = setTimeout(() => {
      onPress(user);
    }, RIPPLE_OPEN_DELAY);
  };

  const shellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }] as const,
  }));

  const pulseHaloStyle = useAnimatedStyle(() => {
    const haloScale = interpolate(pulse.value, [0, 1], [1.015, 1.095]);
    const opacity = resolvedStatus === 'new' ? interpolate(pulse.value, [0, 1], [0.08, 0.22]) : 0.05;
    return {
      opacity: showRing ? opacity : 0,
      transform: [{ scale: haloScale }] as const,
    };
  });

  const gradientStyle = useAnimatedStyle(() => {
    const driftX = interpolate(tiltX.value, [-TILT_RANGE, TILT_RANGE], [-6.8, 6.8]);
    const driftY = interpolate(tiltY.value, [-TILT_RANGE, TILT_RANGE], [-6.2, 6.2]);
    return {
      transform: [
        { translateX: driftX },
        { translateY: driftY },
        { scaleX: 1.02 + Math.abs(tiltY.value) * 0.009 },
        { scaleY: 1.02 + Math.abs(tiltX.value) * 0.009 },
      ] as const,
    };
  });

  const sheenStyle = useAnimatedStyle(() => ({
    opacity: resolvedStatus === 'viewed' ? 0.08 : 0.2,
    transform: [
      { translateX: interpolate(tiltX.value, [-TILT_RANGE, TILT_RANGE], [8.5, -8.5]) },
      { translateY: interpolate(tiltY.value, [-TILT_RANGE, TILT_RANGE], [7.5, -7.5]) },
      { rotate: `${interpolate(tiltX.value + tiltY.value, [-TILT_RANGE * 2, TILT_RANGE * 2], [-13, 13])}deg` },
    ] as const,
  }));

  const liquidStyle = useAnimatedStyle(() => ({
    opacity: resolvedStatus === 'viewed' ? 0.03 : 0.11,
    transform: [
      { translateX: interpolate(tiltX.value, [-TILT_RANGE, TILT_RANGE], [-7, 7]) },
      { translateY: interpolate(tiltY.value, [-TILT_RANGE, TILT_RANGE], [-7, 7]) },
      { rotate: `${interpolate(liquidDrift.value + tiltX.value * 0.08 + tiltY.value * 0.04, [-2.5, 2.5], [-11, 11])}deg` },
      { scaleX: 1.05 + Math.abs(tiltX.value) * 0.01 },
      { scaleY: 0.99 + Math.abs(tiltY.value) * 0.012 },
    ] as const,
  }));

  const avatarParallaxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(tiltX.value, [-TILT_RANGE, TILT_RANGE], [2.4, -2.4]) },
      { translateY: interpolate(tiltY.value, [-TILT_RANGE, TILT_RANGE], [2.2, -2.2]) },
      { scale: interpolate(pressScale.value, [0.955, 1], [0.988, 1]) },
    ] as const,
  }));

  const innerShadowStyle = useAnimatedStyle(() => ({
    opacity: resolvedStatus === 'viewed' ? 0.12 : 0.2,
    transform: [
      { translateX: interpolate(tiltX.value, [-TILT_RANGE, TILT_RANGE], [3.2, -3.2]) },
      { translateY: interpolate(tiltY.value, [-TILT_RANGE, TILT_RANGE], [3.2, -3.2]) },
    ] as const,
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: rippleOpacity.value,
    transform: [{ scale: rippleScale.value }] as const,
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={handleLongPress}
      delayLongPress={500}
      style={[styles.container, shellStyle]}
    >
      <View style={styles.ringWrap}>
        <Animated.View style={[styles.halo, pulseHaloStyle]}>
          <LinearGradient colors={palette} start={{ x: 0.18, y: 0.18 }} end={{ x: 0.85, y: 0.82 }} style={styles.haloFill} />
        </Animated.View>

        {showRing ? (
          <View style={styles.gradientRing}>
            <AnimatedLinearGradient
              colors={palette}
              start={{ x: 0.12, y: 0.12 }}
              end={{ x: 0.88, y: 0.88 }}
              style={[styles.ringGradientLayer, gradientStyle]}
            />
            <Animated.View style={[styles.sheenBand, sheenStyle]}>
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.42)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0.15 }}
                end={{ x: 1, y: 0.85 }}
                style={styles.sheenFill}
              />
            </Animated.View>
            <Animated.View style={[styles.liquidBlob, liquidStyle]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
                start={{ x: 0.05, y: 0.1 }}
                end={{ x: 1, y: 1 }}
                style={styles.liquidBlobFill}
              />
            </Animated.View>
            <View style={styles.innerCutout} />
            <Animated.View style={[styles.innerShadow, innerShadowStyle]} />
          </View>
        ) : (
          <View style={styles.emptyRing} />
        )}

        <Animated.View style={[styles.avatarShell, avatarParallaxStyle]}>
          <Avatar source={user.avatar} size={AVATAR_SIZE} fallbackText={user.name} />
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.ripple, rippleStyle]} />

        {user.isOwn && !user.hasActiveStory ? (
          <View style={styles.addButton}>
            <Ionicons name="add" size={15} color={colors.text.inverse} />
          </View>
        ) : null}

        {resolvedStatus === 'close-friends' && user.hasActiveStory ? (
          <View style={styles.closeFriendBadge}>
            <Ionicons name="star" size={11} color="#fff" />
          </View>
        ) : null}
      </View>

      <Text style={styles.username} numberOfLines={1}>
        {user.isOwn ? 'Your story' : user.name}
      </Text>
    </AnimatedPressable>
  );
};

export const StoryRing = memo(StoryRingComponent, (prevProps, nextProps) => {
  return (
    prevProps.user.id === nextProps.user.id &&
    prevProps.status === nextProps.status &&
    prevProps.user.stories?.length === nextProps.user.stories?.length &&
    prevProps.user.hasActiveStory === nextProps.user.hasActiveStory &&
    prevProps.user.hasViewedAll === nextProps.user.hasViewedAll
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 98,
    marginRight: spacing.md,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: RING_SIZE + 14,
    height: RING_SIZE + 14,
    borderRadius: (RING_SIZE + 14) / 2,
    overflow: 'hidden',
  },
  haloFill: {
    flex: 1,
    opacity: 0.54,
  },
  gradientRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  ringGradientLayer: {
    position: 'absolute',
    width: RING_SIZE + 16,
    height: RING_SIZE + 16,
    left: -8,
    top: -8,
    borderRadius: (RING_SIZE + 16) / 2,
  },
  sheenBand: {
    position: 'absolute',
    width: 42,
    height: RING_SIZE + 16,
    left: 25,
    top: -8,
    overflow: 'hidden',
    borderRadius: 22,
  },
  sheenFill: {
    flex: 1,
  },
  liquidBlob: {
    position: 'absolute',
    width: 58,
    height: 34,
    top: 20,
    left: 18,
    borderRadius: 22,
    overflow: 'hidden',
  },
  liquidBlobFill: {
    flex: 1,
    borderRadius: 22,
  },
  innerCutout: {
    position: 'absolute',
    width: INNER_SIZE,
    height: INNER_SIZE,
    left: (RING_SIZE - INNER_SIZE) / 2,
    top: (RING_SIZE - INNER_SIZE) / 2,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: colors.background.primary,
  },
  innerShadow: {
    position: 'absolute',
    width: INNER_SIZE - 2,
    height: INNER_SIZE - 2,
    left: (RING_SIZE - INNER_SIZE) / 2 + 1,
    top: (RING_SIZE - INNER_SIZE) / 2 + 1,
    borderRadius: (INNER_SIZE - 2) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.045)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  emptyRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: borderRadius.full,
    borderWidth: 2.6,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    backgroundColor: colors.background.primary,
  },
  avatarShell: {
    position: 'absolute',
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  ripple: {
    position: 'absolute',
    width: RING_SIZE + 18,
    height: RING_SIZE + 18,
    borderRadius: (RING_SIZE + 18) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  addButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.accent.primary,
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  closeFriendBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.accent.success,
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  username: {
    marginTop: spacing.xs + 1,
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium as any,
    textAlign: 'center',
    maxWidth: 84,
  },
});


