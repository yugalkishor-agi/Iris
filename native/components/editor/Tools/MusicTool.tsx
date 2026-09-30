import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useEditorStore } from '../../../stores/editorStore';
import { FlashList } from '@shopify/flash-list';

interface MusicToolProps {
  onClose: () => void;
}

// Sample music library (you would fetch this from your backend)
const SAMPLE_MUSIC = [
  { id: '1', name: 'Summer Vibes', duration: 180000, uri: 'local://music1.mp3' },
  { id: '2', name: 'Chill Beat', duration: 120000, uri: 'local://music2.mp3' },
  { id: '3', name: 'Uplifting', duration: 150000, uri: 'local://music3.mp3' },
];

export function MusicTool({ onClose }: MusicToolProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedMusic, setSelectedMusic] = useState<any>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [volume, setVolume] = useState(1.0);

  const music = useEditorStore(state => state.music);
  const setMusic = useEditorStore(state => state.setMusic);
  const removeMusic = useEditorStore(state => state.removeMusic);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadSound = async (uri: string, musicName: string, musicDuration: number) => {
    try {
      setIsLoading(true);
      
      // Unload previous sound
      if (sound) {
        await sound.unloadAsync();
      }

      // Load new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false }
      );

      setSound(newSound);
      setDuration(musicDuration);
      setTrimEnd(musicDuration);
      setSelectedMusic({ uri, name: musicName, duration: musicDuration });

      // Set up playback status updates
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setIsPlaying(status.isPlaying);

          // Stop at trim end
          if (status.positionMillis >= trimEnd) {
            newSound.pauseAsync();
            newSound.setPositionAsync(trimStart);
          }
        }
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading sound:', error);
      setIsLoading(false);
    }
  };

  const togglePlayback = async () => {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          // Reset to trim start if at end
          if (position >= trimEnd) {
            await sound.setPositionAsync(trimStart);
          }
          await sound.playAsync();
        }
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const pickMusicFromDevice = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      const resultAssets =
        'assets' in result && Array.isArray(result.assets) ? result.assets : [];
      const wasCanceled =
        ('canceled' in result && result.canceled) ||
        ('type' in result && result.type === 'cancel');

      if (!wasCanceled && resultAssets.length > 0) {
        const asset = resultAssets[0];
        await loadSound(asset.uri, asset.name, 180000); // Default duration, will be updated
      }
    } catch (error) {
      console.error('Error picking music:', error);
    }
  };

  const handleTrimStartChange = async (value: number) => {
    setTrimStart(value);
    if (sound && value <= position) {
      await sound.setPositionAsync(value);
    }
  };

  const handleTrimEndChange = (value: number) => {
    setTrimEnd(value);
  };

  const handleVolumeChange = async (value: number) => {
    setVolume(value);
    if (sound) {
      await sound.setVolumeAsync(value);
    }
  };

  const applyMusic = () => {
    if (selectedMusic) {
      setMusic({
        uri: selectedMusic.uri,
        name: selectedMusic.name,
        duration: selectedMusic.duration,
        trimStart,
        trimEnd,
        volume,
      });
      onClose();
    }
  };

  const removeMusicFromStory = () => {
    removeMusic();
    if (sound) {
      sound.unloadAsync();
    }
    setSelectedMusic(null);
    setSound(null);
    onClose();
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Music</Text>
        <TouchableOpacity
          onPress={applyMusic}
          disabled={!selectedMusic}
          style={styles.applyButton}
        >
          <Text
            style={[
              styles.applyText,
              !selectedMusic && styles.applyTextDisabled,
            ]}
          >
            Apply
          </Text>
        </TouchableOpacity>
      </View>

      {/* Music Library */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Music Library</Text>
        <FlashList estimatedItemSize={100}
          data={SAMPLE_MUSIC}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.musicItem,
                selectedMusic?.uri === item.uri && styles.musicItemSelected,
              ]}
              onPress={() => loadSound(item.uri, item.name, item.duration)}
            >
              <Ionicons name="musical-notes" size={24} color="#4DD0E1" />
              <View style={styles.musicInfo}>
                <Text style={styles.musicName}>{item.name}</Text>
                <Text style={styles.musicDuration}>
                  {formatTime(item.duration)}
                </Text>
              </View>
              {selectedMusic?.uri === item.uri && (
                <Ionicons name="checkmark-circle" size={24} color="#EC4899" />
              )}
            </TouchableOpacity>
          )}
        />

        {/* Pick from device */}
        <TouchableOpacity
          style={styles.pickButton}
          onPress={pickMusicFromDevice}
        >
          <Ionicons name="folder-open" size={24} color="#4DD0E1" />
          <Text style={styles.pickButtonText}>Pick from device</Text>
        </TouchableOpacity>

        {/* Music Controls */}
        {selectedMusic && (
          <View style={styles.controls}>
            {/* Playback */}
            <View style={styles.playbackContainer}>
              <TouchableOpacity
                onPress={togglePlayback}
                style={styles.playButton}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={32}
                    color="#FFFFFF"
                  />
                )}
              </TouchableOpacity>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeSeparator}>/</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>

            {/* Trim Controls */}
            <View style={styles.trimContainer}>
              <Text style={styles.label}>Trim Start</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={trimStart}
                onValueChange={handleTrimStartChange}
                minimumTrackTintColor="#4DD0E1"
                maximumTrackTintColor="#666666"
                thumbTintColor="#4DD0E1"
              />
              <Text style={styles.sliderValue}>{formatTime(trimStart)}</Text>
            </View>

            <View style={styles.trimContainer}>
              <Text style={styles.label}>Trim End</Text>
              <Slider
                style={styles.slider}
                minimumValue={trimStart}
                maximumValue={duration}
                value={trimEnd}
                onValueChange={handleTrimEndChange}
                minimumTrackTintColor="#4DD0E1"
                maximumTrackTintColor="#666666"
                thumbTintColor="#4DD0E1"
              />
              <Text style={styles.sliderValue}>{formatTime(trimEnd)}</Text>
            </View>

            {/* Volume Control */}
            <View style={styles.volumeContainer}>
              <Text style={styles.label}>Volume</Text>
              <View style={styles.volumeSliderContainer}>
                <Ionicons name="volume-low" size={20} color="#FFFFFF" />
                <Slider
                  style={styles.volumeSlider}
                  minimumValue={0}
                  maximumValue={1}
                  value={volume}
                  onValueChange={handleVolumeChange}
                  minimumTrackTintColor="#EC4899"
                  maximumTrackTintColor="#666666"
                  thumbTintColor="#EC4899"
                />
                <Ionicons name="volume-high" size={20} color="#FFFFFF" />
              </View>
            </View>
          </View>
        )}

        {/* Remove Music */}
        {music && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={removeMusicFromStory}
          >
            <Ionicons name="trash" size={20} color="#FF4444" />
            <Text style={styles.removeButtonText}>Remove Music</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  applyButton: {
    padding: 8,
  },
  applyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EC4899',
  },
  applyTextDisabled: {
    color: '#666666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 8,
  },
  musicItemSelected: {
    backgroundColor: '#2A2A2A',
    borderWidth: 2,
    borderColor: '#EC4899',
  },
  musicInfo: {
    flex: 1,
    marginLeft: 12,
  },
  musicName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  musicDuration: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4DD0E1',
  },
  pickButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4DD0E1',
    marginLeft: 8,
  },
  controls: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeSeparator: {
    fontSize: 18,
    color: '#666666',
    marginHorizontal: 8,
  },
  trimContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'right',
  },
  volumeContainer: {
    marginTop: 8,
  },
  volumeSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 12,
    height: 40,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,68,68,0.1)',
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF4444',
    marginLeft: 8,
  },
});
