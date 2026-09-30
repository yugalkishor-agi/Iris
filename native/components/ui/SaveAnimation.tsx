import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SaveAnimationProps {
  isSaved: boolean;
  size?: number;
  color?: string;
  onAnimationComplete?: () => void;
}

export function SaveAnimation({
  isSaved,
  size = 24,
  color = '#007AFF',
  onAnimationComplete,
}: SaveAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSaved) {
      // Bookmark save animation
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.4,
            duration: 200,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start(onAnimationComplete);
    } else {
      // Reset animations
      scaleAnim.setValue(1);
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [isSaved]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Pulse background */}
      {isSaved && (
        <Animated.View
          style={[
            styles.pulseBackground,
            {
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.2],
                outputRange: [0, 0.3],
              }),
            },
          ]}
        />
      )}

      {/* Main bookmark icon */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: rotation },
            ],
          },
        ]}
      >
        <Ionicons
          name={isSaved ? 'bookmark' : 'bookmark-outline'}
          size={size}
          color={isSaved ? color : '#8E8E93'}
        />
      </Animated.View>

      {/* Sparkle effects */}
      {isSaved && (
        <View style={styles.sparkleContainer}>
          {[...Array(4)].map((_, index) => {
            const angle = (index * 90) * (Math.PI / 180);
            const distance = size * 1.5;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;

            return (
              <Animated.View
                key={index}
                style={[
                  styles.sparkle,
                  {
                    transform: [
                      { translateX: x },
                      { translateY: y },
                      {
                        scale: scaleAnim.interpolate({
                          inputRange: [1, 1.4, 1],
                          outputRange: [0, 1, 0],
                        }),
                      },
                    ],
                    opacity: scaleAnim.interpolate({
                      inputRange: [1, 1.2, 1.4, 1],
                      outputRange: [0, 1, 1, 0],
                    }),
                  },
                ]}
              >
                <Ionicons
                  name="sparkles"
                  size={size * 0.4}
                  color={color}
                />
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseBackground: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none' as const,
  },
  sparkle: {
    position: 'absolute',
  },
});
