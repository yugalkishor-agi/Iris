import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../ui/LoadingSkeleton';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import { giphyService, getTrendingGifs, searchGifs } from '../../services/giphy.service';
import { getRecentGifs, addRecentGif, getFavoriteGifs, toggleFavoriteGif, RecentGif } from '../../services/recents.service';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');

type GifItem = {
  id: string;
  title: string;
  previewUrl: string;
  previewWebpUrl?: string;
  mp4Url: string;
  width: number;
  height: number;
};

export function GifPicker({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (gif: GifItem) => void }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GifItem[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'recents' | 'favorites'>('browse');
  const [recents, setRecents] = useState<RecentGif[]>([]);
  const [favorites, setFavorites] = useState<RecentGif[]>([]);

  const performLoad = useCallback(async () => {
    try {
      setLoading(true);
      const data = query.length > 1 ? await searchGifs(query, { limit: 25, rating: 'pg' }) : await getTrendingGifs({ limit: 25, rating: 'pg' });
      const mapped: GifItem[] = (data || [])
        .filter((gif: any) => giphyService.isAppropriate(gif, 'pg'))
        .map((gif: any) => {
          const mp4 = giphyService.getMp4Url(gif);
          const formatted = giphyService.formatGifForDisplay(gif);
          return {
            id: gif.id,
            title: formatted.title,
            previewUrl: formatted.previewUrl,
            previewWebpUrl: (formatted as any).previewWebpUrl,
            mp4Url: mp4,
            width: formatted.width,
            height: formatted.height,
          };
        })
        .filter((g) => !!g.mp4Url);
      setResults(mapped);
    } catch {}
    finally { setLoading(false); }
  }, [query]);

  useEffect(() => {
    if (!visible) return;
    performLoad();
    (async () => {
      try {
        const [r, f] = await Promise.all([getRecentGifs(), getFavoriteGifs()]);
        setRecents(r || []);
        setFavorites(f || []);
      } catch {}
    })();
  }, [visible, performLoad]);

  const handleSelect = async (item: GifItem) => {
    try {
      await addRecentGif({ id: item.id, title: item.title, previewUrl: item.previewUrl, previewWebpUrl: item.previewWebpUrl, mp4Url: item.mp4Url, width: item.width, height: item.height });
      const r = await getRecentGifs();
      setRecents(r || []);
    } catch {}
    onSelect(item);
    onClose();
  };

  const handleToggleFavorite = async (item: GifItem | RecentGif) => {
    try {
      await toggleFavoriteGif({ id: item.id, title: (item as any).title, previewUrl: (item as any).previewUrl, previewWebpUrl: (item as any).previewWebpUrl, mp4Url: (item as any).mp4Url, width: (item as any).width, height: (item as any).height });
      const f = await getFavoriteGifs();
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
                placeholder="Search GIFs"
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

          {/* Tabs */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            {(
              [
                { id: 'browse', label: 'Browse' },
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

          {loading && activeTab === 'browse' ? (
            <View style={{ padding: spacing.lg }}>
              <InlineLoadingSkeleton />
            </View>
          ) : activeTab === 'browse' ? (
            <FlashList estimatedItemSize={100}
              data={results}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={{ padding: spacing.sm } as any}
              renderItem={({ item }) => {
                const col = (width - spacing.sm * 2 - spacing.sm * 4) / 3;
                const ratio = item.height > 0 ? item.width / item.height : 1;
                const h = Math.max(90, Math.min(180, col / (ratio || 1)));
                const thumbUri = Platform.OS === 'android' && item.previewWebpUrl ? item.previewWebpUrl : item.previewUrl;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    style={{ margin: spacing.sm, borderRadius: borderRadius.md, overflow: 'hidden', backgroundColor: colors.background.secondary }}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: thumbUri }} style={{ width: col, height: h }} contentFit="cover" />
                    <TouchableOpacity onPress={() => handleToggleFavorite(item)} style={{ position: 'absolute', right: 6, top: 6, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 14 }}>
                      <Ionicons name={(favorites || []).some(f => f.id === item.id) ? 'star' : 'star-outline'} size={16} color="#FFD166" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          ) : activeTab === 'recents' ? (
            <FlashList estimatedItemSize={100}
              data={recents}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={{ padding: spacing.sm } as any}
              ListEmptyComponent={<Text style={{ color: colors.text.secondary, padding: spacing.lg }}>No recent GIFs</Text>}
              renderItem={({ item }) => {
                const col = (width - spacing.sm * 2 - spacing.sm * 4) / 3;
                const ratio = (item.height || 1) > 0 ? (item.width || 1) / (item.height || 1) : 1;
                const h = Math.max(90, Math.min(180, col / (ratio || 1)));
                const thumbUri = Platform.OS === 'android' && (item as any).previewWebpUrl ? (item as any).previewWebpUrl! : item.previewUrl;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect({ id: item.id, title: item.title || '', previewUrl: item.previewUrl, previewWebpUrl: (item as any).previewWebpUrl, mp4Url: item.mp4Url, width: item.width || col, height: item.height || h })}
                    style={{ margin: spacing.sm, borderRadius: borderRadius.md, overflow: 'hidden', backgroundColor: colors.background.secondary }}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: thumbUri }} style={{ width: col, height: h }} contentFit="cover" />
                    <TouchableOpacity onPress={() => handleToggleFavorite(item)} style={{ position: 'absolute', right: 6, top: 6, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 14 }}>
                      <Ionicons name={(favorites || []).some(f => f.id === item.id) ? 'star' : 'star-outline'} size={16} color="#FFD166" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          ) : (
            <FlashList estimatedItemSize={100}
              data={favorites}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={{ padding: spacing.sm } as any}
              ListEmptyComponent={<Text style={{ color: colors.text.secondary, padding: spacing.lg }}>No favorite GIFs</Text>}
              renderItem={({ item }) => {
                const col = (width - spacing.sm * 2 - spacing.sm * 4) / 3;
                const ratio = (item.height || 1) > 0 ? (item.width || 1) / (item.height || 1) : 1;
                const h = Math.max(90, Math.min(180, col / (ratio || 1)));
                const thumbUri = Platform.OS === 'android' && (item as any).previewWebpUrl ? (item as any).previewWebpUrl! : item.previewUrl;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect({ id: item.id, title: item.title || '', previewUrl: item.previewUrl, previewWebpUrl: (item as any).previewWebpUrl, mp4Url: item.mp4Url, width: item.width || col, height: item.height || h })}
                    style={{ margin: spacing.sm, borderRadius: borderRadius.md, overflow: 'hidden', backgroundColor: colors.background.secondary }}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: thumbUri }} style={{ width: col, height: h }} contentFit="cover" />
                    <TouchableOpacity onPress={() => handleToggleFavorite(item)} style={{ position: 'absolute', right: 6, top: 6, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 14 }}>
                      <Ionicons name={'star'} size={16} color="#FFD166" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

