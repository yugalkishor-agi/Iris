import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artwork: string;
  previewUrl?: string;
}

export default function MusicSearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchTracks();
    } else {
      setTracks([]);
    }
  }, [searchQuery]);

  const searchTracks = async () => {
    try {
      setLoading(true);
      
      // Mock music search results - in production, this would use Spotify/Apple Music API
      const mockTracks: Track[] = [
        {
          id: '1',
          title: 'Blinding Lights',
          artist: 'The Weeknd',
          album: 'After Hours',
          duration: 200,
          artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        },
        {
          id: '2',
          title: 'Watermelon Sugar',
          artist: 'Harry Styles',
          album: 'Fine Line',
          duration: 174,
          artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
        },
        {
          id: '3',
          title: 'Good 4 U',
          artist: 'Olivia Rodrigo',
          album: 'SOUR',
          duration: 178,
          artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        },
        {
          id: '4',
          title: 'Levitating',
          artist: 'Dua Lipa',
          album: 'Future Nostalgia',
          duration: 203,
          artwork: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop',
        },
      ].filter(track => 
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setTracks(mockTracks);
    } catch (error) {
      console.error('Failed to search tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
  };

  const handleUseTrack = () => {
    if (selectedTrack) {
      // Navigate back with selected track
      navigation.goBack();
      // In production, this would pass the selected track back to the calling screen
    }
  };

  const renderTrack = ({ item }: { item: Track }) => (
    <TouchableOpacity
      style={[
        styles.trackItem,
        selectedTrack?.id === item.id && styles.selectedTrack
      ]}
      onPress={() => handleTrackSelect(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.artwork }} style={styles.artwork} />
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {item.artist}
        </Text>
        <Text style={styles.trackAlbum} numberOfLines={1}>
          {item.album}
        </Text>
      </View>
      <View style={styles.trackMeta}>
        <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
        {selectedTrack?.id === item.id && (
          <Ionicons name="checkmark-circle" size={20} color={colors.accent.primary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Music</Text>
        <TouchableOpacity 
          onPress={handleUseTrack}
          disabled={!selectedTrack}
          style={[
            styles.useButton,
            !selectedTrack && styles.useButtonDisabled
          ]}
        >
          <Text style={[
            styles.useButtonText,
            !selectedTrack && styles.useButtonTextDisabled
          ]}>
            Use
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for songs, artists, albums..."
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Searching music...</Text>
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          data={tracks}
          renderItem={renderTrack}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tracksList as any}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            searchQuery.length > 2 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="musical-notes-outline" size={48} color={colors.text.secondary} />
                <Text style={styles.emptyText}>No tracks found</Text>
                <Text style={styles.emptySubtext}>Try searching with different keywords</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="musical-notes" size={48} color={colors.text.secondary} />
                <Text style={styles.emptyText}>Search for music</Text>
                <Text style={styles.emptySubtext}>Find the perfect track for your post</Text>
              </View>
            )
          }
        />
      )}

      {selectedTrack && (
        <View style={styles.selectedTrackPreview}>
          <Image source={{ uri: selectedTrack.artwork }} style={styles.previewArtwork} />
          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle} numberOfLines={1}>
              {selectedTrack.title}
            </Text>
            <Text style={styles.previewArtist} numberOfLines={1}>
              {selectedTrack.artist}
            </Text>
          </View>
          <TouchableOpacity style={styles.playButton}>
            <Ionicons name="play" size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  useButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  useButtonDisabled: {
    backgroundColor: colors.background.secondary,
  },
  useButtonText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold as any,
  },
  useButtonTextDisabled: {
    color: colors.text.secondary,
  },
  searchContainer: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  tracksList: {
    padding: spacing.lg,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  selectedTrack: {
    backgroundColor: colors.background.secondary,
  },
  artwork: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.tertiary,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  trackAlbum: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  trackMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  duration: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.secondary,
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  selectedTrackPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    gap: spacing.md,
  },
  previewArtwork: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.tertiary,
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  previewArtist: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  playButton: {
    backgroundColor: colors.accent.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
