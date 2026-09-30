import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Avatar } from '../ui/Avatar';
import { colors, borderRadius } from '../../styles/theme';

type RingVariant = 'highlight' | 'add';

interface ProfileHighlightRingProps {
  image?: string | null;
  fallbackText?: string;
  onPress?: () => void;
  variant?: RingVariant;
  size?: number;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

function ProfileHighlightRingComponent({
  image,
  fallbackText = 'H',
  variant = 'highlight',
  size = 74,
}: ProfileHighlightRingProps) {
  const drift = useSharedValue(0);
  const innerSize = size - 8;
  const avatarSize = innerSize - 4;
  const isAdd = variant === 'add';

  useEffect(() => {
    if (isAdd) {
      drift.value = 0;
      return;
    }
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 2600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [drift, isAdd]);

  const gradientStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [-1, 1], [-2.2, 2.2]) },
      { translateY: interpolate(drift.value, [-1, 1], [1.6, -1.6]) },
      { scaleX: 1.015 },
      { scaleY: 1.015 },
    ] as const,
    opacity: isAdd ? 0 : 1,
  }));

  const sheenStyle = useAnimatedStyle(() => ({
    opacity: isAdd ? 0 : 0.18,
    transform: [
      { translateX: interpolate(drift.value, [-1, 1], [4, -4]) },
      { rotate: `${interpolate(drift.value, [-1, 1], [-7, 7])}deg` },
    ] as const,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.ringFrame, { width: size, height: size, borderRadius: size / 2 }]}>
        {isAdd ? (
          <View style={[styles.addRing, { width: size, height: size, borderRadius: size / 2 }]} />
        ) : (
          <View style={[styles.gradientRing, { width: size, height: size, borderRadius: size / 2 }]}>
            <AnimatedLinearGradient
              colors={['#8FD4FF', '#A98BFF', '#F39AD7']}
              start={{ x: 0.1, y: 0.1 }}
              end={{ x: 0.9, y: 0.9 }}
              style={[styles.gradientLayer, { width: size + 10, height: size + 10, borderRadius: (size + 10) / 2 }, gradientStyle]}
            />
            <Animated.View style={[styles.sheenBand, sheenStyle]}>
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.34)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0.1 }}
                end={{ x: 1, y: 0.9 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
            <View style={[styles.cutout, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]} />
          </View>
        )}

        <View style={[styles.avatarShell, { width: innerSize - 2, height: innerSize - 2, borderRadius: (innerSize - 2) / 2 }]}>
          {isAdd ? (
            <View style={[styles.addInner, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
              <Ionicons name="add" size={20} color={colors.accent.primary} />
            </View>
          ) : (
            <Avatar source={image || undefined} size={avatarSize} fallbackText={fallbackText} />
          )}
        </View>
      </View>
    </View>
  );
}

export const ProfileHighlightRing = memo(ProfileHighlightRingComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientRing: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  gradientLayer: {
    position: 'absolute',
    left: -5,
    top: -5,
  },
  sheenBand: {
    position: 'absolute',
    width: 30,
    height: '110%',
    left: '34%',
    top: '-5%',
    overflow: 'hidden',
    borderRadius: borderRadius.full,
  },
  cutout: {
    position: 'absolute',
    backgroundColor: colors.background.primary,
    left: 4,
    top: 4,
  },
  avatarShell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  addRing: {
    borderWidth: 2.4,
    borderColor: 'rgba(143, 152, 170, 0.28)',
    backgroundColor: colors.background.primary,
  },
  addInner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
});
