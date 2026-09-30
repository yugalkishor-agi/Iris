import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { formatDuration } from '../../utils/glimpse/glimpseEditorCalculations';
import { typography, spacing } from '../../styles/theme';

interface CurrentSong {
  title: string;
  artist?: string;
  duration?: number;
  streamUrl?: string;
}

interface GlimpseMusicPanelProps {
  currentSong?: CurrentSong | null;
  selectedSongDuration: number;
  musicClipStart: number;
  musicClipEnd: number;
  maxMusicClipStart: number;
  handleMusicClipStartChange: (val: number) => void;
  musicPreviewing: boolean;
  musicPreviewLoading: boolean;
  toggleMusicPreview: () => void;
  onRequestMusic?: () => void;
}

export function GlimpseMusicPanel({
  currentSong,
  selectedSongDuration,
  musicClipStart,
  musicClipEnd,
  maxMusicClipStart,
  handleMusicClipStartChange,
  musicPreviewing,
  musicPreviewLoading,
  toggleMusicPreview,
  onRequestMusic,
}: GlimpseMusicPanelProps) {
  return (
    <View style={styles.panelCard}>
      {currentSong ? (
        <>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Soundtrack</Text>
            <Text style={styles.panelMeta}>{currentSong.title}</Text>
          </View>
          <View style={styles.musicSummary}>
            <Ionicons name="musical-notes-outline" size={18} color="#8FB3FF" />
            <View style={styles.musicSummaryCopy}>
              <Text style={styles.musicSummaryTitle} numberOfLines={1}>{currentSong.title}</Text>
              <Text style={styles.musicSummaryMeta} numberOfLines={1}>{currentSong.artist || 'Unknown artist'}</Text>
            </View>
          </View>
          {selectedSongDuration > 0 ? (
            <>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>Song start</Text>
                <Text style={styles.panelMeta}>{formatDuration(musicClipStart * 1000)} to {formatDuration(musicClipEnd * 1000)}</Text>
              </View>
              <Slider
                minimumValue={0}
                maximumValue={Math.max(0, maxMusicClipStart)}
                value={Math.min(musicClipStart, maxMusicClipStart)}
                onValueChange={handleMusicClipStartChange}
                minimumTrackTintColor="#8B5CF6"
                maximumTrackTintColor="rgba(255,255,255,0.14)"
                thumbTintColor="#FFFFFF"
              />
              <Text style={styles.musicRangeHint}>Fixed 20 second window. Slide to choose which part plays.</Text>
              <TouchableOpacity
                style={[styles.musicPreviewButton, (musicPreviewing || musicPreviewLoading) && styles.musicPreviewButtonActive, !currentSong.streamUrl && styles.musicPreviewButtonDisabled]}
                onPress={toggleMusicPreview}
                disabled={musicPreviewLoading || !currentSong.streamUrl}
              >
                {musicPreviewLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name={musicPreviewing ? 'stop' : 'play'} size={16} color="#FFFFFF" />
                )}
                <Text style={styles.musicPreviewText}>{musicPreviewing ? 'Stop clip preview' : 'Preview selected clip'}</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </>
      ) : (
        <Text style={styles.overlayNote}>Choose a song first, then place the exact 20 second section you want.</Text>
      )}
      <TouchableOpacity style={styles.bigPrimary} onPress={onRequestMusic}>
        <Ionicons name="musical-notes-outline" size={18} color="#FFFFFF" />
        <Text style={styles.bigPrimaryText}>{currentSong ? 'Change song' : 'Choose song'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  panelCard: { backgroundColor: '#0A1220', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  panelTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: typography.fontWeight.semibold as any },
  panelMeta: { color: 'rgba(255,255,255,0.64)', fontSize: 13 },
  musicSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(143,179,255,0.08)', padding: 12, borderRadius: 12, gap: 12, marginBottom: 20 },
  musicSummaryCopy: { flex: 1 },
  musicSummaryTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: typography.fontWeight.semibold as any },
  musicSummaryMeta: { color: 'rgba(255,255,255,0.64)', fontSize: 13, marginTop: 2 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  sliderLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: typography.fontWeight.medium as any },
  musicRangeHint: { color: 'rgba(255,255,255,0.48)', fontSize: 12, marginTop: 8, marginBottom: 24, textAlign: 'center' },
  musicPreviewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  musicPreviewButtonActive: { backgroundColor: 'rgba(139,92,246,0.16)', borderColor: 'rgba(139,92,246,0.3)' },
  musicPreviewButtonDisabled: { opacity: 0.5 },
  musicPreviewText: { color: '#FFFFFF', fontSize: 14, fontWeight: typography.fontWeight.semibold as any },
  bigPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 14 },
  bigPrimaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: typography.fontWeight.bold as any },
  overlayNote: { color: 'rgba(255,255,255,0.48)', fontSize: 13, lineHeight: 18, marginTop: 8, marginBottom: 16 },
});
