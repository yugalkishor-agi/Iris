import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../ui/LoadingSkeleton';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { klipyService } from '../../services/klipy.service';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

type StickerGifPickerProps = {
  onSelect: (item: { type: 'gif' | 'sticker'; url: string }) => void;
  onClose: () => void;
  initialTab?: 'gif' | 'sticker';
};

type PickerItem = {
  id: string;
  url: string;
  previewUrl?: string;
};

export default function StickerGifPicker({ onSelect, onClose, initialTab }: StickerGifPickerProps) {
  const [activeTab, setActiveTab] = useState<'gif' | 'sticker'>(initialTab || 'gif');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<PickerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPos, setNextPos] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const stickerIcon = require('../../../assets/icons/icons8-sticker-square-48.png');
  const title = useMemo(() => (activeTab === 'gif' ? 'GIFs' : 'Stickers'), [activeTab]);

  const loadItems = useCallback(
    async (reset = true) => {
      try {
        setLoading(true);
        const response = query.trim()
          ? await klipyService.search({ query: query.trim(), type: activeTab, pos: reset ? undefined : nextPos || undefined })
          : await klipyService.featured({ type: activeTab, pos: reset ? undefined : nextPos || undefined });

        const normalized = response.items.map((item) => ({
          id: item.id,
          url: item.url,
          previewUrl: item.previewUrl,
        }));

        setItems((prev) => (reset ? normalized : [...prev, ...normalized]));
        setNextPos(response.nextPos || null);
      } catch (error) {
        console.error('Failed to load Klipy items:', error);
        setItems(reset ? [] : items);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, items, nextPos, query]
  );

  useEffect(() => {
    loadItems(true);
  }, [activeTab, loadItems]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, loadItems]);

  const renderItem = ({ item }: { item: PickerItem }) => (
    <TouchableOpacity
      style={styles.mediaItem}
      onPress={() => onSelect({ type: activeTab, url: item.url })}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.previewUrl || item.url }} style={styles.mediaImage} contentFit="contain" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="close" size={22} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${title.toLowerCase()}...`}
          placeholderTextColor="#64748b"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sticker' && styles.tabActive]}
          onPress={() => setActiveTab('sticker')}
        >
          <Image
            source={stickerIcon}
            style={[styles.tabIcon, { tintColor: activeTab === 'sticker' ? '#0b1220' : '#94a3b8' }]}
          />
          <Text style={[styles.tabText, activeTab === 'sticker' && styles.tabTextActive]}>Stickers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'gif' && styles.tabActive]}
          onPress={() => setActiveTab('gif')}
        >
          <Ionicons name="film-outline" size={16} color={activeTab === 'gif' ? '#0b1220' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'gif' && styles.tabTextActive]}>GIFs</Text>
        </TouchableOpacity>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.listContainer as any}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (nextPos && !loading) {
              loadItems(false);
            }
          }}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            loading ? (
              <View style={styles.footerLoader}>
                <InlineLoadingSkeleton />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="happy-outline" size={40} color="#64748b" />
              <Text style={styles.emptyText}>No results</Text>
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
    backgroundColor: '#0b1220',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  headerSpacer: {
    width: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#f8fafc',
    marginLeft: 8,
  },
  clearButton: {
    paddingLeft: 6,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#111827',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#38bdf8',
  },
  tabText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#0b1220',
    fontWeight: '600',
  },
  tabIcon: { width: 16, height: 16 },
  listContainer: {
    paddingHorizontal: 8,
    paddingBottom: 18,
  },
  mediaItem: {
    flex: 1,
    margin: 6,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  mediaImage: {
    width: '100%',
    height: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 30,
  },
  emptyText: {
    marginTop: 8,
    color: '#94a3b8',
  },
});





