import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../ui/LoadingSkeleton';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import { searchTracks, getTrendingTracks, getTrackStreamUrl, type AudiusTrack, formatDuration } from '../../services/audius.service';
import { getRecentSongs, addRecentSong, getFavoriteSongs, toggleFavoriteSong, type RecentSong } from '../../services/recents.service';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

export type PickedSong = {
  id: string;
  title: string;
  artist?: string;
  artworkUrl?: string;
  streamUrl: string;
  duration?: number;
};

type TrackArtworkProps = {
  uri?: string;
};

function TrackArtwork({ uri }: TrackArtworkProps) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return (
      <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="musical-notes" size={18} color={colors.text.secondary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      onError={() => setFailed(true)}
      style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' }}
    />
  );
}

export function MusicPicker({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (song: PickedSong) => void }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AudiusTrack[]>([]);
  const [activeTab, setActiveTab] = useState<'trending' | 'recents' | 'favorites'>('trending');
  const [recents, setRecents] = useState<RecentSong[]>([]);
  const [favorites, setFavorites] = useState<RecentSong[]>([]);

  const performLoad = useCallback(async () => {
    try {
      setLoading(true);
      const data = query.trim().length > 1 ? await searchTracks(query.trim(), 25) : await getTrendingTracks(25);
      setResults(data || []);
    } catch {}
    finally { setLoading(false); }
  }, [query]);

  useEffect(() => {
    if (!visible) return;
    performLoad();
    (async () => {
      try {
        const [r, f] = await Promise.all([getRecentSongs(), getFavoriteSongs()]);
        setRecents(r || []);
        setFavorites(f || []);
      } catch {}
    })();
  }, [visible, performLoad]);

  const handleSelect = async (t: AudiusTrack | RecentSong) => {
    try {
      const id = (t as any).id;
      const title = (t as any).title || (t as any).name || '';
      const artist = (t as any).user?.name || (t as any).artist || '';
      const artworkUrl = (t as any).artwork?.['1000x1000'] || (t as any).artwork?.['480x480'] || (t as any).artwork?.['150x150'] || (t as any).artworkUrl || undefined;
      const streamUrl = 'streamUrl' in t ? (t as RecentSong).streamUrl : await getTrackStreamUrl(id);
      const duration = (t as any).duration || undefined;
      const song: PickedSong = { id, title, artist, artworkUrl, streamUrl, duration };
      await addRecentSong({ id, title, artist, artworkUrl, streamUrl, duration });
      const r = await getRecentSongs();
      setRecents(r || []);
      onSelect(song);
      onClose();
    } catch {}
  };

  const handleToggleFavorite = async (t: AudiusTrack | RecentSong) => {
    try {
      const id = (t as any).id;
      const title = (t as any).title || (t as any).name || '';
      const artist = (t as any).user?.name || (t as any).artist || '';
      const artworkUrl = (t as any).artwork?.['1000x1000'] || (t as any).artwork?.['480x480'] || (t as any).artwork?.['150x150'] || (t as any).artworkUrl || undefined;
      const streamUrl = 'streamUrl' in t ? (t as RecentSong).streamUrl : await getTrackStreamUrl(id);
      await toggleFavoriteSong({ id, title, artist, artworkUrl, streamUrl });
      const f = await getFavoriteSongs();
      setFavorites(f || []);
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.background.elevated, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '85%' }}>
          <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border.light, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={onClose} style={{ paddingRight: spacing.md }}>
              <Ionicons name="chevron-down" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <View style={{ flex: 1, backgroundColor: colors.background.secondary, borderRadius: borderRadius.full, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md }}>
              <Ionicons name="search" size={18} color={colors.text.secondary} />
              <TextInput
                placeholder="Search songs (Audius)"
                placeholderTextColor={colors.text.secondary}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={performLoad}
                style={{ flex: 1, paddingVertical: spacing.sm, color: colors.text.primary }}
                returnKeyType="search"
              />
              <TouchableOpacity onPress={performLoad}>
                <Ionicons name="arrow-forward" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            {(
              [
                { id: 'trending', label: 'Trending' },
                { id: 'recents', label: 'Recents' },
                { id: 'favorites', label: 'Favorites' },
              ] as const
            ).map(tab => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.full,
                  backgroundColor: activeTab === tab.id ? colors.accent.primary : colors.background.secondary,
                }}
              >
                <Text style={{ color: activeTab === tab.id ? colors.text.inverse : colors.text.primary, fontWeight: '600' }}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'trending' && (
            loading ? (
              <View style={{ padding: spacing.lg }}>
                <InlineLoadingSkeleton />
              </View>
            ) : (
              <FlashList estimatedItemSize={100}
                data={results}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.md } as any}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                renderItem={({ item }) => {
                  const cover = item.artwork?.['1000x1000'] || item.artwork?.['480x480'] || item.artwork?.['150x150'] || undefined;
                  const isFav = favorites.some(f => f.id === item.id);
                  return (
                    <TouchableOpacity onPress={() => handleSelect(item)} activeOpacity={0.9} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.md }}>
                      <TrackArtwork uri={cover} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text.primary, fontWeight: '700' }} numberOfLines={1}>{item.title}</Text>
                        <Text style={{ color: colors.text.secondary }} numberOfLines={1}>{item.user?.name || item.user?.handle}</Text>
                      </View>
                      <Text style={{ color: colors.text.secondary, marginRight: spacing.sm }}>{formatDuration(Math.floor(item.duration || 0))}</Text>
                      <TouchableOpacity onPress={() => handleToggleFavorite(item)} style={{ padding: 6 }}>
                        <Ionicons name={isFav ? 'star' : 'star-outline'} size={18} color="#FFD166" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                }}
              />
            )
          )}

          {activeTab === 'recents' && (
            <FlashList estimatedItemSize={100}
              data={recents}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.md } as any}
              ListEmptyComponent={<Text style={{ color: colors.text.secondary, padding: spacing.lg }}>No recent songs</Text>}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => {
                const isFav = favorites.some(f => f.id === item.id);
                return (
                  <TouchableOpacity onPress={() => handleSelect(item)} activeOpacity={0.9} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.md }}>
                    <TrackArtwork uri={item.artworkUrl} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text.primary, fontWeight: '700' }} numberOfLines={1}>{item.title}</Text>
                      <Text style={{ color: colors.text.secondary }} numberOfLines={1}>{item.artist}</Text>
                    </View>
                    {item.duration != null && <Text style={{ color: colors.text.secondary, marginRight: spacing.sm }}>{formatDuration(Math.floor(item.duration))}</Text>}
                    <TouchableOpacity onPress={() => handleToggleFavorite(item)} style={{ padding: 6 }}>
                      <Ionicons name={isFav ? 'star' : 'star-outline'} size={18} color="#FFD166" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {activeTab === 'favorites' && (
            <FlashList estimatedItemSize={100}
              data={favorites}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.md } as any}
              ListEmptyComponent={<Text style={{ color: colors.text.secondary, padding: spacing.lg }}>No favorite songs</Text>}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelect(item)} activeOpacity={0.9} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, padding: spacing.md }}>
                  <TrackArtwork uri={item.artworkUrl} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text.primary, fontWeight: '700' }} numberOfLines={1}>{item.title}</Text>
                    <Text style={{ color: colors.text.secondary }} numberOfLines={1}>{item.artist}</Text>
                  </View>
                  {item.duration != null && <Text style={{ color: colors.text.secondary, marginRight: spacing.sm }}>{formatDuration(Math.floor(item.duration))}</Text>}
                  <Ionicons name={'star'} size={18} color="#FFD166" />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
