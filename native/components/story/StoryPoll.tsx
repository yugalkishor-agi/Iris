import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface StoryPollProps {
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVote?: string;
  onVote?: (optionId: string) => void;
  showResults?: boolean;
  accentColor?: string[];
}

export function StoryPoll({
  question,
  options,
  totalVotes,
  userVote,
  onVote,
  showResults = false,
  accentColor = ['#007AFF', '#5856D6'],
}: StoryPollProps) {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(userVote);
  const [hasVoted, setHasVoted] = useState(!!userVote);
  const [animatedValues] = useState(
    options.map(() => new Animated.Value(0))
  );

  const handleVote = (optionId: string) => {
    if (hasVoted) return;
    
    setSelectedOption(optionId);
    setHasVoted(true);
    onVote?.(optionId);

    // Animate progress bars
    options.forEach((option, index) => {
      const percentage = getPercentage(option.votes);
      Animated.timing(animatedValues[index], {
        toValue: percentage,
        duration: 500,
        useNativeDriver: false,
      }).start();
    });
  };

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const getMaxVotes = () => Math.max(...options.map(o => o.votes));

  return (
    <View style={styles.container}>
      {/* Question */}
      <Text style={styles.question}>{question}</Text>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const percentage = getPercentage(option.votes);
          const isWinning = option.votes === getMaxVotes() && totalVotes > 0;
          const isSelected = selectedOption === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                hasVoted || showResults ? styles.optionButtonDisabled : null,
              ]}
              onPress={() => handleVote(option.id)}
              disabled={hasVoted || showResults}
              activeOpacity={0.8}
            >
              {/* Background Progress Bar */}
              {(hasVoted || showResults) && (
                <Animated.View
                  style={[
                    styles.progressBackground,
                    {
                      width: animatedValues[index].interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                >
                  <LinearGradient
                    colors={isWinning ? [accentColor[0], accentColor[1]] : ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
                    style={styles.progressGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </Animated.View>
              )}

              {/* Content */}
              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  {/* Checkmark for selected option */}
                  {isSelected && (
                    <View style={[styles.checkmark, { backgroundColor: accentColor[0] }]}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  )}
                  
                  <Text style={styles.optionText}>{option.text}</Text>
                </View>

                {/* Percentage (show after voting) */}
                {(hasVoted || showResults) && (
                  <Text style={styles.percentage}>{percentage}%</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Total Votes */}
      {(hasVoted || showResults) && totalVotes > 0 && (
        <Text style={styles.totalVotes}>
          {totalVotes.toLocaleString()} {totalVotes === 1 ? 'vote' : 'votes'}
        </Text>
      )}

      {/* Tap to vote hint */}
      {!hasVoted && !showResults && (
        <Text style={styles.voteHint}>Tap an option to vote</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 300,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  question: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
  },
  optionButtonDisabled: {
    // No additional styles needed
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 10,
  },
  progressGradient: {
    flex: 1,
    borderRadius: 10,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
    zIndex: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  percentage: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  totalVotes: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  voteHint: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
