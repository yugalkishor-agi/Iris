import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';

interface VideoEditorScreenProps {
  route: {
    params: {
      videoUri: string;
      onSave: (editedVideoUri: string) => void;
    };
  };
}

const FILTERS = [
  { id: 'none', name: 'Original', filter: null },
  { id: 'vintage', name: 'Vintage', filter: 'sepia(0.8) contrast(1.2)' },
  { id: 'bw', name: 'B&W', filter: 'grayscale(1)' },
  { id: 'bright', name: 'Bright', filter: 'brightness(1.3) contrast(1.1)' },
  { id: 'warm', name: 'Warm', filter: 'sepia(0.3) saturate(1.4)' },
  { id: 'cool', name: 'Cool', filter: 'hue-rotate(180deg) saturate(1.2)' },
  { id: 'dramatic', name: 'Drama', filter: 'contrast(1.5) brightness(0.9)' },
];

const EFFECTS = [
  { id: 'none', name: 'None', icon: 'remove-outline' },
  { id: 'fade', name: 'Fade', icon: 'eye-outline' },
  { id: 'zoom', name: 'Zoom', icon: 'expand-outline' },
  { id: 'slide', name: 'Slide', icon: 'arrow-forward-outline' },
  { id: 'blur', name: 'Blur', icon: 'radio-button-off-outline' },
];

const MUSIC_TRACKS = [
  { id: 'none', name: 'No Music', artist: '', duration: 0 },
  { id: 'upbeat1', name: 'Summer Vibes', artist: 'Audio Library', duration: 120 },
  { id: 'chill1', name: 'Chill Beats', artist: 'Audio Library', duration: 180 },
  { id: 'pop1', name: 'Pop Energy', artist: 'Audio Library', duration: 150 },
  { id: 'acoustic1', name: 'Acoustic Dreams', artist: 'Audio Library', duration: 200 },
];

export default function VideoEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { videoUri, onSave } = (route.params as any) || {};
  
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [selectedEffect, setSelectedEffect] = useState('none');
  const [selectedMusic, setSelectedMusic] = useState('none');
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [videoVolume, setVideoVolume] = useState(1.0);
  const [activeTab, setActiveTab] = useState<'trim' | 'filter' | 'effect' | 'music'>('trim');
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoStatus, setVideoStatus] = useState<any>({});

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const videoHeight = screenHeight * 0.5;

  useEffect(() => {
    if (duration > 0 && trimEnd === 0) {
      setTrimEnd(duration);
    }
  }, [duration]);

  const handlePlaybackStatusUpdate = (status: any) => {
    setVideoStatus(status);
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying || false);
    }
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch (error) {
      console.error('Error controlling video playback:', error);
    }
  };

  const handleSeek = async (value: number) => {
    if (!videoRef.current) return;
    
    try {
      await videoRef.current.setPositionAsync(value);
      setPosition(value);
    } catch (error) {
      console.error('Error seeking video:', error);
    }
  };

  const handleTrimStartChange = (value: number) => {
    setTrimStart(value);
    if (value >= trimEnd) {
      setTrimEnd(Math.min(value + 1000, duration)); // Minimum 1 second
    }
  };

  const handleTrimEndChange = (value: number) => {
    setTrimEnd(value);
    if (value <= trimStart) {
      setTrimStart(Math.max(value - 1000, 0)); // Minimum 1 second
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsProcessing(true);
    try {
      // In a real implementation, you would:
      // 1. Use FFmpeg or similar to process the video
      // 2. Apply filters, effects, and music
      // 3. Trim the video to specified duration
      // 4. Export the final video
      // 5. Return the new URI
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // For demo purposes, return original URI
      onSave(videoUri);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving edited video:', error);
      Alert.alert('Error', 'Failed to save video. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderTrimControls = () => (
    <View style={styles.trimContainer}>
      <Text style={styles.sectionTitle}>Trim Video</Text>
      
      <View style={styles.trimInfo}>
        <Text style={styles.trimText}>
          Duration: {formatTime(trimEnd - trimStart)}
        </Text>
        <Text style={styles.trimText}>
          {formatTime(trimStart)} - {formatTime(trimEnd)}
        </Text>
      </View>

      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Start Time</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={trimStart}
          onValueChange={handleTrimStartChange}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#E5E5EA"
          thumbTintColor="#007AFF"
        />
        <Text style={styles.sliderValue}>{formatTime(trimStart)}</Text>
      </View>

      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>End Time</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={trimEnd}
          onValueChange={handleTrimEndChange}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#E5E5EA"
          thumbTintColor="#007AFF"
        />
        <Text style={styles.sliderValue}>{formatTime(trimEnd)}</Text>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.sectionTitle}>Filters</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterItem,
              selectedFilter === filter.id && styles.selectedFilterItem,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <View style={styles.filterPreview}>
              <Video
                source={{ uri: videoUri }}
                style={[styles.filterPreviewVideo]}
                shouldPlay={false}
                isLooping={false}
                resizeMode={ResizeMode.COVER}
              />
            </View>
            <Text style={styles.filterName}>{filter.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderEffects = () => (
    <View style={styles.effectsContainer}>
      <Text style={styles.sectionTitle}>Effects</Text>
      <View style={styles.effectsGrid}>
        {EFFECTS.map((effect) => (
          <TouchableOpacity
            key={effect.id}
            style={[
              styles.effectItem,
              selectedEffect === effect.id && styles.selectedEffectItem,
            ]}
            onPress={() => setSelectedEffect(effect.id)}
          >
            <Ionicons
              name={effect.icon as any}
              size={24}
              color={selectedEffect === effect.id ? '#007AFF' : '#8E8E93'}
            />
            <Text
              style={[
                styles.effectName,
                selectedEffect === effect.id && styles.selectedEffectName,
              ]}
            >
              {effect.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMusicControls = () => (
    <View style={styles.musicContainer}>
      <Text style={styles.sectionTitle}>Background Music</Text>
      
      <ScrollView style={styles.musicList}>
        {MUSIC_TRACKS.map((track) => (
          <TouchableOpacity
            key={track.id}
            style={[
              styles.musicItem,
              selectedMusic === track.id && styles.selectedMusicItem,
            ]}
            onPress={() => setSelectedMusic(track.id)}
          >
            <View style={styles.musicInfo}>
              <Text style={styles.musicName}>{track.name}</Text>
              {track.artist && (
                <Text style={styles.musicArtist}>{track.artist}</Text>
              )}
            </View>
            {track.duration > 0 && (
              <Text style={styles.musicDuration}>
                {formatTime(track.duration * 1000)}
              </Text>
            )}
            {selectedMusic === track.id && (
              <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedMusic !== 'none' && (
        <View style={styles.volumeControls}>
          <View style={styles.volumeControl}>
            <Text style={styles.volumeLabel}>Music Volume</Text>
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={musicVolume}
              onValueChange={setMusicVolume}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#E5E5EA"
            />
            <Text style={styles.volumeValue}>{Math.round(musicVolume * 100)}%</Text>
          </View>

          <View style={styles.volumeControl}>
            <Text style={styles.volumeLabel}>Video Volume</Text>
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={videoVolume}
              onValueChange={setVideoVolume}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#E5E5EA"
            />
            <Text style={styles.volumeValue}>{Math.round(videoVolume * 100)}%</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Video</Text>
        <TouchableOpacity
          style={[styles.headerButton, isProcessing && styles.disabledButton]}
          onPress={handleSave}
          disabled={isProcessing}
        >
          <Text style={styles.saveButtonText}>
            {isProcessing ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Video Player */}
      <View style={[styles.videoContainer, { height: videoHeight }]}>
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={styles.video}
          shouldPlay={false}
          isLooping={false}
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
        
        {/* Video Controls */}
        <View style={styles.videoControls}>
          <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={32}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Slider
            style={styles.progressSlider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onValueChange={handleSeek}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
            thumbTintColor="#007AFF"
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Tools Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trim' && styles.activeTab]}
          onPress={() => setActiveTab('trim')}
        >
          <Ionicons
            name="cut-outline"
            size={20}
            color={activeTab === 'trim' ? '#007AFF' : '#8E8E93'}
          />
          <Text style={[styles.tabText, activeTab === 'trim' && styles.activeTabText]}>
            Trim
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'filter' && styles.activeTab]}
          onPress={() => setActiveTab('filter')}
        >
          <Ionicons
            name="color-filter-outline"
            size={20}
            color={activeTab === 'filter' ? '#007AFF' : '#8E8E93'}
          />
          <Text style={[styles.tabText, activeTab === 'filter' && styles.activeTabText]}>
            Filter
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'effect' && styles.activeTab]}
          onPress={() => setActiveTab('effect')}
        >
          <Ionicons
            name="sparkles-outline"
            size={20}
            color={activeTab === 'effect' ? '#007AFF' : '#8E8E93'}
          />
          <Text style={[styles.tabText, activeTab === 'effect' && styles.activeTabText]}>
            Effects
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'music' && styles.activeTab]}
          onPress={() => setActiveTab('music')}
        >
          <Ionicons
            name="musical-notes-outline"
            size={20}
            color={activeTab === 'music' ? '#007AFF' : '#8E8E93'}
          />
          <Text style={[styles.tabText, activeTab === 'music' && styles.activeTabText]}>
            Music
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tools Content */}
      <View style={styles.toolsContent}>
        {activeTab === 'trim' && renderTrimControls()}
        {activeTab === 'filter' && renderFilters()}
        {activeTab === 'effect' && renderEffects()}
        {activeTab === 'music' && renderMusicControls()}
      </View>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.processingText}>Processing video...</Text>
            <Text style={styles.processingSubtext}>This may take a few moments</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
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
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333333',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  videoContainer: {
    backgroundColor: '#111111',
    position: 'relative',
  },
  video: {
    flex: 1,
    width: '100%',
  },
  videoControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 32,
    padding: 16,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  progressSlider: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressThumb: {
    backgroundColor: '#007AFF',
    width: 16,
    height: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  activeTabText: {
    color: '#007AFF',
  },
  toolsContent: {
    backgroundColor: '#1C1C1E',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  trimContainer: {
    paddingBottom: 16,
  },
  trimInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  trimText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  sliderContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#007AFF',
    width: 20,
    height: 20,
  },
  sliderValue: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
  filtersContainer: {
    paddingBottom: 16,
  },
  filterItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    padding: 8,
    borderRadius: 8,
  },
  selectedFilterItem: {
    backgroundColor: '#007AFF20',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  filterPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
  },
  filterPreviewVideo: {
    width: '100%',
    height: '100%',
  },
  filterName: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  effectsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  effectItem: {
    width: '30%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#2C2C2E',
  },
  selectedEffectItem: {
    backgroundColor: '#007AFF20',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  effectName: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  selectedEffectName: {
    color: '#007AFF',
  },
  musicContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  musicList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#2C2C2E',
  },
  selectedMusicItem: {
    backgroundColor: '#007AFF20',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  musicInfo: {
    flex: 1,
  },
  musicName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  musicArtist: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  musicDuration: {
    fontSize: 12,
    color: '#8E8E93',
    marginRight: 8,
  },
  volumeControls: {
    marginTop: 16,
  },
  volumeControl: {
    marginBottom: 16,
  },
  volumeLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  volumeSlider: {
    height: 40,
  },
  volumeValue: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    alignItems: 'center',
    padding: 32,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
});
