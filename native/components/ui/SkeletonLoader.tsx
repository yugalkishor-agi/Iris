import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  animated?: boolean;
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  animated = true,
}: SkeletonLoaderProps) {
  const opacity = useSharedValue(animated ? 0.58 : 1);

  useEffect(() => {
    if (animated) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 850 }),
          withTiming(0.58, { duration: 850 })
        ),
        -1,
        true
      );
      return;
    }
    opacity.value = 1;
  }, [animated, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// Preset skeleton components
export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return (
    <SkeletonLoader
      width={size}
      height={size}
      borderRadius={size / 2}
    />
  );
}

export function SkeletonText({ 
  lines = 1, 
  width = '100%',
  height = 16,
  spacing = 8,
}: { 
  lines?: number;
  width?: number | string;
  height?: number;
  spacing?: number;
}) {
  return (
    <View style={{ gap: spacing }}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLoader
          key={index}
          width={index === lines - 1 && lines > 1 ? '70%' : width}
          height={height}
          borderRadius={height / 2}
        />
      ))}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SkeletonAvatar size={40} />
        <View style={styles.cardHeaderText}>
          <SkeletonText width={120} height={14} />
          <SkeletonText width={80} height={12} />
        </View>
      </View>
      <SkeletonLoader
        width="100%"
        height={200}
        borderRadius={8}
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <SkeletonText lines={2} height={14} />
        <View style={styles.cardActions}>
          <SkeletonLoader width={60} height={12} borderRadius={6} />
          <SkeletonLoader width={40} height={12} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E5EA',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderText: {
    marginLeft: 12,
    gap: 4,
  },
  cardImage: {
    marginBottom: 12,
  },
  cardContent: {
    gap: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
