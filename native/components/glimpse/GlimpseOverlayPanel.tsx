import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { GlimpseOverlayLayer } from '../../utils/glimpse/glimpseEditorTypes';
import { STICKER_PRESETS, OVERLAY_MIN_SIZE, OVERLAY_MAX_SIZE } from '../../utils/glimpse/glimpseEditorConstants';
import { typography, spacing } from '../../styles/theme';

interface GlimpseOverlayPanelProps {
  overlayLayers: GlimpseOverlayLayer[];
  selectedOverlayId: string | null;
  setSelectedOverlayId: (id: string | null) => void;
  setSelectedCanvasLayer: (id: string | null) => void;
  pickOverlayLayer: () => void;
  addStickerLayer: (sticker: string) => void;
  resizeSelectedOverlay: (delta: number) => void;
  removeSelectedOverlay: () => void;
}

export function GlimpseOverlayPanel({
  overlayLayers,
  selectedOverlayId,
  setSelectedOverlayId,
  setSelectedCanvasLayer,
  pickOverlayLayer,
  addStickerLayer,
  resizeSelectedOverlay,
  removeSelectedOverlay,
}: GlimpseOverlayPanelProps) {
  const selectedOverlay = overlayLayers.find((layer) => layer.id === selectedOverlayId) || null;

  return (
    <View style={styles.stackGap}>
      <View style={styles.panelCard}>
        <View style={styles.panelHead}>
          <Text style={styles.panelTitle}>Overlay</Text>
          <Text style={styles.panelMeta}>Images and stickers above the glimpse</Text>
        </View>
        <TouchableOpacity style={styles.bigPrimary} onPress={pickOverlayLayer}>
          <Ionicons name="images-outline" size={18} color="#FFFFFF" />
          <Text style={styles.bigPrimaryText}>Add overlay image</Text>
        </TouchableOpacity>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickerRail as any}>
          {STICKER_PRESETS.map((sticker) => (
            <TouchableOpacity key={sticker} style={styles.stickerChip} onPress={() => addStickerLayer(sticker)}>
              <Text style={styles.stickerChipText}>{sticker}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {overlayLayers.length ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.overlayRail as any}>
              {overlayLayers.map((layer, index) => {
                const active = layer.id === selectedOverlayId;
                return (
                  <TouchableOpacity key={layer.id} style={[styles.overlayChip, active && styles.overlayChipActive]} onPress={() => { setSelectedOverlayId(layer.id); setSelectedCanvasLayer(layer.id); }}>
                    {layer.type === 'sticker' || layer.content ? (
                      <View style={styles.overlayStickerThumb}>
                        <Text style={styles.overlayStickerThumbText}>{layer.content || '*'}</Text>
                      </View>
                    ) : (
                      <Image source={{ uri: layer.assetUri }} style={styles.overlayChipThumb} contentFit="cover" />
                    )}
                    <Text style={[styles.overlayChipText, active && styles.overlayChipTextActive]}>Layer {index + 1}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            {selectedOverlay ? (
              <>
                <Text style={styles.overlayNote}>Drag the selected layer on canvas. Use a two-finger pinch to resize it directly.</Text>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderLabel}>Layer size</Text>
                  <Text style={styles.panelMeta}>{Math.round(selectedOverlay.width)} px</Text>
                </View>
                <Slider
                  minimumValue={OVERLAY_MIN_SIZE}
                  maximumValue={OVERLAY_MAX_SIZE}
                  value={selectedOverlay.width}
                  onValueChange={(value) => resizeSelectedOverlay(value - selectedOverlay.width)}
                  minimumTrackTintColor="#60A5FA"
                  maximumTrackTintColor="rgba(255,255,255,0.14)"
                  thumbTintColor="#FFFFFF"
                />
                <TouchableOpacity style={styles.overlayDeleteButton} onPress={removeSelectedOverlay}>
                  <Ionicons name="trash-outline" size={16} color="#FFB4B4" />
                  <Text style={styles.overlayDeleteText}>Delete selected overlay</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </>
        ) : (
          <Text style={styles.overlayNote}>Add a photo or PNG layer, then tap it on canvas or select it here to move and resize it.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stackGap: { gap: 16 },
  panelCard: { backgroundColor: '#0A1220', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  panelTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: typography.fontWeight.semibold as any },
  panelMeta: { color: 'rgba(255,255,255,0.64)', fontSize: 13 },
  bigPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 14, marginBottom: 16 },
  bigPrimaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: typography.fontWeight.bold as any },
  stickerRail: { gap: 12, paddingBottom: 16 },
  stickerChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  stickerChipText: { color: '#FFFFFF', fontSize: 16, fontWeight: typography.fontWeight.bold as any },
  overlayRail: { gap: 12, paddingBottom: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 16 },
  overlayChip: { alignItems: 'center', gap: 8, opacity: 0.6 },
  overlayChipActive: { opacity: 1 },
  overlayChipThumb: { width: 56, height: 56, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  overlayStickerThumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  overlayStickerThumbText: { color: '#FFFFFF', fontSize: 24, fontWeight: typography.fontWeight.bold as any },
  overlayChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: typography.fontWeight.medium as any },
  overlayChipTextActive: { fontWeight: typography.fontWeight.bold as any },
  overlayNote: { color: 'rgba(255,255,255,0.48)', fontSize: 13, lineHeight: 18, marginTop: 8, marginBottom: 16 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  sliderLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: typography.fontWeight.medium as any },
  overlayDeleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 12, paddingVertical: 14, marginTop: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  overlayDeleteText: { color: '#FFB4B4', fontSize: 14, fontWeight: typography.fontWeight.semibold as any },
});
