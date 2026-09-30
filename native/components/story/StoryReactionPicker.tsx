import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';

interface Reaction {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}

const REACTIONS: Reaction[] = [
  { type: 'like', emoji: '👍', label: 'Like', color: '#007AFF' },
  { type: 'love', emoji: '❤️', label: 'Love', color: '#FF3B30' },
  { type: 'laugh', emoji: '😂', label: 'Haha', color: '#FF9500' },
  { type: 'wow', emoji: '😮', label: 'Wow', color: '#FF9500' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: '#5856D6' },
  { type: 'angry', emoji: '😡', label: 'Angry', color: '#FF3B30' },
];

interface StoryReactionPickerProps {
  visible: boolean;
  onReactionSelect: (reaction: ReactionType) => void;
  onClose: () => void;
  currentReaction?: ReactionType | null;
}

export default function StoryReactionPicker({
  visible,
  onReactionSelect,
  onClose,
  currentReaction,
}: StoryReactionPickerProps) {
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimations = useRef(
    REACTIONS.map(() => new Animated.Value(1))
  ).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleReactionPress = (reaction: ReactionType, index: number) => {
    // Animate the selected reaction
    Animated.sequence([
      Animated.timing(scaleAnimations[index], {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimations[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Send reaction after a short delay for animation
    setTimeout(() => {
      onReactionSelect(reaction);
      onClose();
    }, 150);
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              {
                translateY: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
              {
                scale: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
            opacity: slideAnimation,
          },
        ]}
      >
        <View style={styles.reactionsContainer}>
          {REACTIONS.map((reaction, index) => {
            const isSelected = currentReaction === reaction.type;
            
            return (
              <TouchableOpacity
                key={reaction.type}
                style={[
                  styles.reactionButton,
                  isSelected && styles.selectedReaction,
                ]}
                onPress={() => handleReactionPress(reaction.type, index)}
                activeOpacity={0.8}
              >
                <Animated.View
                  style={[
                    styles.reactionContent,
                    {
                      transform: [{ scale: scaleAnimations[index] }],
                    },
                  ]}
                >
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  <Text
                    style={[
                      styles.reactionLabel,
                      isSelected && { color: reaction.color },
                    ]}
                  >
                    {reaction.label}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              onReactionSelect('like');
              onClose();
            }}
          >
            <Text style={styles.quickActionEmoji}>👍</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              onReactionSelect('love');
              onClose();
            }}
          >
            <Text style={styles.quickActionEmoji}>❤️</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

export { REACTIONS };

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 25,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  reactionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  reactionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    minWidth: 50,
  },
  selectedReaction: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  reactionContent: {
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  reactionLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickAction: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  quickActionEmoji: {
    fontSize: 24,
  },
});
