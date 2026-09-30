import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import { spotifyService } from '../../services/spotify.service';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  imageUrl: string;
  previewUrl?: string;
  duration: number;
}

interface MusicStickerProps {
  onSelect: (track: Track) => void;
  onClose: () => void;
}

export function MusicSticker({ onSelect, onClose }: MusicStickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  useEffect(() => {
    loadTrendingTracks();
  }, []);

  const loadTrendingTracks = async () => {
    try {
      setLoading(true);
      const trendingTracks = await spotifyService.searchTracks('trending') || [];
      setTracks(trendingTracks.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        album: track.album.name,
        imageUrl: track.album.images[0]?.url || '',
        previewUrl: track.preview_url || undefined,
        duration: track.duration_ms,
      })));
    } catch (error) {
      console.error('Failed to load trending tracks:', error);
      Alert.alert('Error', 'Failed to load music. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchTracks = async (query: string) => {
    if (!query.trim()) {
      loadTrendingTracks();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await spotifyService.searchTracks(query) || [];
      setTracks(searchResults.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        album: track.album.name,
        imageUrl: track.album.images[0]?.url || '',
        previewUrl: track.preview_url || undefined,
        duration: track.duration_ms,
      })));
    } catch (error) {
      console.error('Failed to search tracks:', error);
      Alert.alert('Error', 'Failed to search music. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const timeoutId = setTimeout(() => {
      searchTracks(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
    onSelect(track);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderTrack = ({ item }: { item: Track }) => (
    <TouchableOpacity
      style={[
        styles.trackItem,
        selectedTrack?.id === item.id && styles.selectedTrack
      ]}
      onPress={() => handleTrackSelect(item)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.albumArt} />
      <View style={styles.trackInfo}>
        <Text style={styles.trackName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {item.artist}
        </Text>
        <Text style={styles.albumName} numberOfLines={1}>
          {item.album}
        </Text>
      </View>
      <View style={styles.trackMeta}>
        <Text style={styles.duration}>
          {formatDuration(item.duration)}
        </Text>
        {item.previewUrl && (
          <Ionicons name="play-circle" size={20} color={colors.accent.primary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Music</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for songs, artists, or albums"
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>
            {searchQuery ? 'Searching...' : 'Loading trending music...'}
          </Text>
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          data={tracks}
          renderItem={renderTrack}
          keyExtractor={(item) => item.id}
          style={styles.tracksList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No tracks found' : 'No music available'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  tracksList: {
    flex: 1,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  selectedTrack: {
    backgroundColor: colors.background.secondary,
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: 2,
  },
  artistName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  albumName: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  trackMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  duration: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
