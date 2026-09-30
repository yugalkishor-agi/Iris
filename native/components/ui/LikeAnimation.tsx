import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LikeAnimationProps {
  isLiked: boolean;
  size?: number;
  color?: string;
  onAnimationComplete?: () => void;
}

export function LikeAnimation({
  isLiked,
  size = 24,
  color = '#FF3B30',
  onAnimationComplete,
}: LikeAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLiked) {
      // Heart bounce animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // Floating hearts animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ).start(onAnimationComplete);
    } else {
      // Reset animations
      scaleAnim.setValue(1);
      bounceAnim.setValue(0);
    }
  }, [isLiked]);

  const generateFloatingHearts = () => {
    const hearts = [];
    for (let i = 0; i < 6; i++) {
      const randomDelay = Math.random() * 500;
      const randomX = (Math.random() - 0.5) * 100;
      const randomScale = 0.5 + Math.random() * 0.5;

      hearts.push(
        <Animated.View
          key={i}
          style={[
            styles.floatingHeart,
            {
              transform: [
                {
                  translateY: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -80],
                  }),
                },
                {
                  translateX: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, randomX],
                  }),
                },
                {
                  scale: bounceAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [randomScale, randomScale * 1.2, 0],
                  }),
                },
              ],
              opacity: bounceAnim.interpolate({
                inputRange: [0, 0.3, 0.7, 1],
                outputRange: [0, 1, 1, 0],
              }),
            },
          ]}
        >
          <Ionicons
            name="heart"
            size={size * 0.6}
            color={color}
          />
        </Animated.View>
      );
    }
    return hearts;
  };

  return (
    <View style={styles.container}>
      {/* Main heart icon */}
      <Animated.View
        style={[
          styles.heartContainer,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Ionicons
          name={isLiked ? 'heart' : 'heart-outline'}
          size={size}
          color={isLiked ? color : '#8E8E93'}
        />
      </Animated.View>

      {/* Floating hearts */}
      {isLiked && (
        <View style={styles.floatingContainer}>
          {generateFloatingHearts()}
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
  heartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none' as const,
  },
  floatingHeart: {
    position: 'absolute',
  },
});
