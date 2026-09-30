import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface VoiceMessageBubbleProps {
  audioUri: string;
  duration: number;
  isOwn: boolean;
  timestamp: Date;
  isRead?: boolean;
  embedded?: boolean;
}

export default function VoiceMessageBubble({
  audioUri,
  duration,
  isOwn,
  timestamp,
  isRead = false,
  embedded = false,
}: VoiceMessageBubbleProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Animation for waveform
  const waveformAnimation = new Animated.Value(0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playAudio = async () => {
    try {
      setIsLoading(true);

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);

      // Start waveform animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveformAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(waveformAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          const position = Math.floor((status.positionMillis || 0) / 1000);
          setPlaybackPosition(position);
          
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPlaybackPosition(0);
            waveformAnimation.stopAnimation();
            waveformAnimation.setValue(0);
          }
        }
      });

    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsLoading(false);
    }
  };

  const pauseAudio = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
      waveformAnimation.stopAnimation();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const progress = duration > 0 ? playbackPosition / duration : 0;

  return (
    <View style={[
      styles.container,
      isOwn ? styles.ownMessage : styles.otherMessage,
      embedded && styles.embeddedContainer,
    ]}>
      <View style={[styles.content, isOwn ? styles.ownContent : styles.otherContent]}>
        {/* Play/Pause Button */}
        <TouchableOpacity
          style={[styles.playButton, isOwn ? styles.ownPlayButton : styles.otherPlayButton]}
          onPress={isPlaying ? pauseAudio : playAudio}
          disabled={isLoading}
        >
          {isLoading ? (
            <Animated.View
              style={{
                transform: [{
                  rotate: waveformAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                }],
              }}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
            </Animated.View>
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>

        {/* Waveform and Duration */}
        <View style={styles.waveformContainer}>
          <View style={styles.waveform}>
            {Array.from({ length: 12 }).map((_, index) => {
              const barHeight = Math.random() * 20 + 8;
              const isActive = progress > (index / 12);
              
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.waveformBar,
                    {
                      height: barHeight,
                      backgroundColor: isActive 
                        ? (isOwn ? '#FFFFFF' : '#007AFF')
                        : (isOwn ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 122, 255, 0.4)'),
                      transform: isPlaying ? [{
                        scaleY: waveformAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, Math.random() * 1.5 + 0.5],
                        }),
                      }] : [{ scaleY: 1 }],
                    },
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, isOwn ? styles.ownTimeText : styles.otherTimeText]}>
              {isPlaying ? formatTime(playbackPosition) : formatTime(duration)}
            </Text>
          </View>
        </View>

        {/* Voice Message Icon */}
        <View style={styles.voiceIcon}>
          <Ionicons 
            name="mic" 
            size={16} 
            color={isOwn ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 122, 255, 0.7)'} 
          />
        </View>
      </View>

      {/* Message Info */}
      <View style={[styles.messageInfo, isOwn ? styles.ownMessageInfo : styles.otherMessageInfo]}>
        <Text style={[styles.timestamp, isOwn ? styles.ownTimestamp : styles.otherTimestamp]}>
          {formatTimestamp(timestamp)}
        </Text>
        
        {isOwn && (
          <View style={styles.readStatus}>
            <Ionicons
              name={isRead ? 'checkmark-done' : 'checkmark'}
              size={12}
              color={isRead ? '#007AFF' : 'rgba(255, 255, 255, 0.7)'}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    marginVertical: 2,
    marginHorizontal: 16,
  },
  embeddedContainer: {
    maxWidth: '100%',
    marginVertical: 0,
    marginHorizontal: 0,
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    minWidth: 200,
  },
  ownContent: {
    backgroundColor: '#007AFF',
  },
  otherContent: {
    backgroundColor: '#F0F0F0',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ownPlayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  otherPlayButton: {
    backgroundColor: '#007AFF',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    minHeight: 8,
  },
  timeContainer: {
    marginLeft: 12,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  ownTimeText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherTimeText: {
    color: '#666666',
  },
  voiceIcon: {
    marginLeft: 8,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  ownMessageInfo: {
    justifyContent: 'flex-end',
  },
  otherMessageInfo: {
    justifyContent: 'flex-start',
  },
  timestamp: {
    fontSize: 11,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: '#999999',
  },
  readStatus: {
    marginLeft: 4,
  },
});
