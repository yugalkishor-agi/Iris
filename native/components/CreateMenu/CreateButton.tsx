import React, { useState, useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CreateMenuModal from './CreateMenuModal';
import { styles } from './CreateButtonStyles';

interface CreateButtonProps {
  style?: any;
  size?: number;
  color?: string;
  onPress?: () => void;
}

export default function CreateButton({ 
  style, 
  size = 56, 
  color = '#007AFF',
  onPress 
}: CreateButtonProps) {
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Button press animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Show create menu
    setShowCreateMenu(true);
    
    // Custom onPress if provided
    if (onPress) {
      onPress();
    }
  };

  const handleCloseMenu = () => {
    // Rotate back animation
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    setShowCreateMenu(false);
  };

  // Pulse animation for attention
  React.useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Start pulse after 3 seconds of inactivity
    const pulseTimer = setTimeout(() => {
      pulseAnimation.start();
    }, 3000);

    return () => {
      clearTimeout(pulseTimer);
      pulseAnimation.stop();
    };
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {/* Create Button */}
      <Animated.View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
            ],
          },
          style,
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Animated.View
            style={{
              transform: [{ rotate: rotateInterpolate }],
            }}
          >
            <Ionicons name="add" size={size * 0.4} color="#FFFFFF" />
          </Animated.View>

          {/* Ripple Effect */}
          <View style={[styles.ripple, { borderRadius: size / 2 }]} />
        </TouchableOpacity>
      </Animated.View>

      {/* Create Menu Modal */}
      <CreateMenuModal
        visible={showCreateMenu}
        onClose={handleCloseMenu}
      />
    </>
  );
}
