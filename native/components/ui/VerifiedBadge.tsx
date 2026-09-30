import React, { useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg' | number;
  style?: any;
  interactive?: boolean;
}

const buildVerificationBadgeSvg = (suffix: string) => {
  const shieldFillId = `shield-fill-${suffix}`;
  const outerBorderId = `outer-border-${suffix}`;

  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${shieldFillId}" x1="8" y1="2" x2="8" y2="14" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#7DD3FC"/>
      <stop offset="45%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
    <linearGradient id="${outerBorderId}" x1="8" y1="1" x2="8" y2="15" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#DBEAFE" stop-opacity="1"/>
      <stop offset="50%" stop-color="#93C5FD" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#60A5FA" stop-opacity="0.82"/>
    </linearGradient>
  </defs>
  <path d="M8 1.5L3 3.5V7C3 10.5 5 12.5 8 14C11 12.5 13 10.5 13 7V3.5L8 1.5Z" stroke="url(#${outerBorderId})" stroke-width="0.85" fill="none" stroke-linejoin="round"/>
  <path d="M8 3L4 4.5V7.5C4 10 5.5 11.5 8 12.5C10.5 11.5 12 10 12 7.5V4.5L8 3Z" fill="url(#${shieldFillId})" stroke-linejoin="round"/>
  <path d="M8 3L4 4.5V7.5C4 10 5.5 11.5 8 12.5C10.5 11.5 12 10 12 7.5V4.5L8 3Z" stroke="white" stroke-width="0.38" fill="none" stroke-linejoin="round" opacity="0.72"/>
  <path d="M6 7.5L7.2 8.7L10 6" stroke="white" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
};

export function VerifiedBadge({ size = 'md', style, interactive = false }: VerifiedBadgeProps) {
  const resolvedSize = typeof size === 'number'
    ? size
    : size === 'sm'
      ? 14
      : size === 'lg'
        ? 20
        : 16;

  const pressAnim = useRef(new Animated.Value(0)).current;
  const instanceId = useRef(`vb-${Math.random().toString(36).slice(2, 10)}`).current;

  const badgeXml = useMemo(() => buildVerificationBadgeSvg(instanceId), [instanceId]);

  const animatedStyle = useMemo(() => ({
    transform: [
      {
        scale: pressAnim.interpolate({
          inputRange: [0, 0.45, 1],
          outputRange: [1, 0.92, 1.06],
        }),
      },
      {
        translateY: pressAnim.interpolate({
          inputRange: [0, 0.45, 1],
          outputRange: [0, 0.5, -1.5],
        }),
      },
      {
        rotate: pressAnim.interpolate({
          inputRange: [0, 0.45, 1],
          outputRange: ['0deg', '-5deg', '0deg'],
        }),
      },
    ],
  }), [pressAnim]);

  const icon = <SvgXml xml={badgeXml} width={resolvedSize} height={resolvedSize} style={styles.badgeSvg} />;

  if (!interactive) {
    return <Animated.View style={[styles.badge, style]}>{icon}</Animated.View>;
  }

  const handlePressIn = () => {
    Animated.timing(pressAnim, {
      toValue: 0.45,
      duration: 90,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.sequence([
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pressAnim, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} hitSlop={6}>
      <Animated.View style={[styles.badge, animatedStyle, style]}>
        {icon}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    marginLeft: 2,
    shadowColor: '#60A5FA',
    shadowOpacity: 0.14,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 0 },
  },
  badgeSvg: {
    marginLeft: 0,
  },
});
