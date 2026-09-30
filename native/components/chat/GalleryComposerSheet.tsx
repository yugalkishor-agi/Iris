import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

type GalleryFilter = 'all' | 'photo' | 'video';

type GalleryComposerSheetProps = {
  visible: boolean;
  accentColor?: string;
  onClose: () => void;
  onSend: (assets: any[]) => Promise<void> | void;
};

const FILTERS: Array<{ key: GalleryFilter; emoji: string; label: string }> = [
  { key: 'all', emoji: '?', label: 'All' },
  { key: 'photo', emoji: '??', label: 'Photos' },
  { key: 'video', emoji: '??', label: 'Videos' },
];

const MAX_SELECTION = 10;

export default function GalleryComposerSheet({
  visible,
  accentColor = '#38bdf8',
  onClose,
  onSend,
}: GalleryComposerSheetProps) {
  const [permissionState, setPermissionState] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const result = await MediaLibrary.getAssetsAsync({
        first: 72,
        mediaType:
          filter === 'all'
            ? [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video]
            : filter === 'photo'
            ? [MediaLibrary.MediaType.photo]
            : [MediaLibrary.MediaType.video],
        sortBy: [MediaLibrary.SortBy.creationTime],
      });
      setAssets(result.assets || []);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    (async () => {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (cancelled) return;

      if (permission.status !== 'granted') {
        setPermissionState('denied');
        setAssets([]);
        return;
      }

      setPermissionState('granted');
    })().catch(() => {
      if (!cancelled) {
        setPermissionState('denied');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || permissionState !== 'granted') return;
    loadAssets().catch(() => undefined);
  }, [loadAssets, permissionState, visible]);

  useEffect(() => {
    if (!visible) {
      setSelectedIds([]);
      setFilter('all');
    }
  }, [visible]);

  const selectedAssets = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return assets.filter((asset) => selectedSet.has(asset.id));
  }, [assets, selectedIds]);

  const toggleSelect = useCallback((asset: MediaLibrary.Asset) => {
    setSelectedIds((prev) => {
      if (prev.includes(asset.id)) {
        return prev.filter((id) => id !== asset.id);
      }
      if (prev.length >= MAX_SELECTION) {
        return prev;
      }
      return [...prev, asset.id];
    });
  }, []);

  const handleSend = useCallback(async () => {
    if (selectedAssets.length === 0 || sending) return;
    setSending(true);
    try {
      const payload = selectedAssets.map((asset) => ({
        assetId: asset.id,
        uri: asset.uri,
        type: asset.mediaType === 'video' ? 'video' : 'image',
        duration: asset.duration ?? 0,
        width: asset.width,
        height: asset.height,
        fileName: asset.filename,
      }));
      await onSend(payload);
      onClose();
    } finally {
      setSending(false);
    }
  }, [onClose, onSend, selectedAssets, sending]);

  const handleSystemPicker = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: MAX_SELECTION,
      quality: 0.9,
    } as any);
    if (result.canceled || !result.assets?.length) return;
    await onSend(result.assets);
    onClose();
  }, [onClose, onSend]);

  const renderAsset = ({ item }: { item: MediaLibrary.Asset }) => {
    const selectionIndex = selectedIds.indexOf(item.id);
    const selected = selectionIndex >= 0;
    const isVideo = item.mediaType === 'video';

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.assetCell}
        onPress={() => toggleSelect(item)}
      >
        <Image source={{ uri: item.uri }} style={styles.assetThumb} contentFit="cover" />
        <View
          style={[
            styles.assetOverlay,
            selected && { borderColor: accentColor, backgroundColor: 'rgba(8, 15, 30, 0.12)' },
          ]}
        />
        {isVideo ? (
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={12} color="#fff" />
          </View>
        ) : null}
        {selected ? (
          <View style={[styles.selectionBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.selectionText}>{selectionIndex + 1}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Gallery</Text>
              <Text style={styles.subtitle}>Pick multiple photos or videos</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#e2e8f0" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            {FILTERS.map((entry) => {
              const active = filter === entry.key;
              return (
                <TouchableOpacity
                  key={entry.key}
                  style={[
                    styles.filterChip,
                    active && { borderColor: accentColor, backgroundColor: `${accentColor}22` },
                  ]}
                  onPress={() => setFilter(entry.key)}
                >
                  <Text style={styles.filterEmoji}>{entry.emoji}</Text>
                  <Text style={[styles.filterLabel, active && { color: '#f8fafc' }]}>{entry.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedAssets.length > 0 ? (
            <View style={styles.selectionRail}>
              <FlashList estimatedItemSize={100}
                horizontal
                data={selectedAssets}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectionRailContent as any}
                renderItem={({ item }) => (
                  <View style={styles.selectionThumbWrap}>
                    <Image source={{ uri: item.uri }} style={styles.selectionThumb} contentFit="cover" />
                  </View>
                )}
              />
            </View>
          ) : null}

          {permissionState === 'denied' ? (
            <View style={styles.centerState}>
              <Ionicons name="images-outline" size={34} color="#94a3b8" />
              <Text style={styles.centerTitle}>Gallery permission needed</Text>
              <Text style={styles.centerCopy}>Allow media access to preview and send files from chat.</Text>
            </View>
          ) : loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="small" color={accentColor} />
              <Text style={styles.centerTitle}>Loading media</Text>
            </View>
          ) : (
            <FlashList estimatedItemSize={100}
              data={assets}
              numColumns={3}
              keyExtractor={(item) => item.id}
              renderItem={renderAsset}
              contentContainerStyle={styles.gridContent as any}
              showsVerticalScrollIndicator={false}
            />
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerGhost} onPress={handleSystemPicker}>
              <Ionicons name="albums-outline" size={18} color="#cbd5e1" />
              <Text style={styles.footerGhostText}>System picker</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.footerSend,
                { backgroundColor: selectedAssets.length > 0 ? accentColor : 'rgba(71, 85, 105, 0.42)' },
              ]}
              disabled={selectedAssets.length === 0 || sending}
              onPress={handleSend}
            >
              <Text style={styles.footerSendText}>
                {sending ? 'Sending...' : selectedAssets.length > 0 ? `Send ${selectedAssets.length}` : 'Send'}
              </Text>
              <Ionicons name="send" size={16} color="#020617" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2, 6, 23, 0.38)',
  },
  sheet: {
    minHeight: '78%',
    maxHeight: '92%',
    backgroundColor: '#081120',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  filterEmoji: {
    fontSize: 14,
  },
  filterLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  selectionRail: {
    marginBottom: 12,
  },
  selectionRailContent: {
    paddingRight: 6,
  },
  selectionThumbWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  selectionThumb: {
    width: '100%',
    height: '100%',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  centerTitle: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  centerCopy: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  gridContent: {
    paddingBottom: 14,
  },
  assetCell: {
    width: '33.333%',
    aspectRatio: 1,
    padding: 4,
  },
  assetThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: '#0f172a',
  },
  assetOverlay: {
    ...StyleSheet.absoluteFillObject,
    margin: 4,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  videoBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
  },
  selectionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  selectionText: {
    color: '#020617',
    fontSize: 12,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  footerGhost: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerGhostText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  footerSend: {
    flex: 1.2,
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerSendText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: '800',
  },
});
