import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { formatDuration, clamp } from '../../utils/glimpse/glimpseEditorCalculations';
import { GlimpseVoiceSegment } from '../../utils/glimpse/glimpseEditorTypes';
import { typography, spacing } from '../../styles/theme';
import { MAX_VOICEOVER_MS } from '../../utils/glimpse/glimpseEditorConstants';

interface GlimpseVoicePanelProps {
  voiceInsertAt: number;
  setVoiceInsertAt: (val: number) => void;
  trimStart: number;
  effectiveTrimEnd: number;
  isRecording: boolean;
  recordingMs: number;
  startVoiceRecording: () => void;
  stopVoiceRecording: (commit: boolean) => void;
  voiceSegments: GlimpseVoiceSegment[];
  playVoiceSegment: (segment: GlimpseVoiceSegment) => void;
  removeVoiceSegment: (id: string) => void;
  setActiveTool: (tool: any) => void;
}

export function GlimpseVoicePanel({
  voiceInsertAt,
  setVoiceInsertAt,
  trimStart,
  effectiveTrimEnd,
  isRecording,
  recordingMs,
  startVoiceRecording,
  stopVoiceRecording,
  voiceSegments,
  playVoiceSegment,
  removeVoiceSegment,
  setActiveTool,
}: GlimpseVoicePanelProps) {
  return (
    <View style={styles.voiceSheet}>
      <View style={styles.voiceHandle} />
      <View style={styles.sliderRow}>
        <Text style={styles.sliderLabel}>Voice start</Text>
        <Text style={styles.panelMeta}>{formatDuration(voiceInsertAt)}</Text>
      </View>
      <Slider
        minimumValue={trimStart}
        maximumValue={Math.max(trimStart + 1000, effectiveTrimEnd)}
        value={clamp(voiceInsertAt, trimStart, effectiveTrimEnd)}
        onValueChange={(value) => setVoiceInsertAt(value)}
        minimumTrackTintColor="#60A5FA"
        maximumTrackTintColor="rgba(255,255,255,0.14)"
        thumbTintColor="#FFFFFF"
      />
      
      <TouchableOpacity style={[styles.recordButton, isRecording && styles.recordButtonActive]} onPress={() => { if (isRecording) void stopVoiceRecording(true); else void startVoiceRecording(); }}>
        <View style={styles.recordButtonInner}>
          <Ionicons name={isRecording ? 'stop' : 'mic'} size={28} color={isRecording ? '#EF4444' : '#0B1220'} />
        </View>
      </TouchableOpacity>
      
      <Text style={styles.voiceLabel}>
        {isRecording ? `Recording ${formatDuration(recordingMs)} / ${formatDuration(MAX_VOICEOVER_MS)}` : 'Tap to record voiceover (max 6s)'}
      </Text>
      
      {voiceSegments.length ? (
        <View style={styles.voiceList}>
          {voiceSegments.map((segment) => (
            <View key={segment.id} style={styles.voiceRow}>
              <View style={styles.voiceRowInfo}>
                <Text style={styles.voiceRowTitle}>{segment.label || 'Voice segment'}</Text>
                <Text style={styles.panelMeta}>{formatDuration(segment.startMs)} start - {formatDuration(segment.durationMs)} long</Text>
              </View>
              <TouchableOpacity style={styles.voiceMiniButton} onPress={() => { void playVoiceSegment(segment); }}>
                <Ionicons name="play" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.voiceMiniButtonDanger} onPress={() => removeVoiceSegment(segment.id)}>
                <Ionicons name="trash-outline" size={16} color="#FFB4B4" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.overlayNote}>Record once, then adjust the start point and keep only the takes you want.</Text>
      )}
      
      <View style={styles.voiceActions}>
        <TouchableOpacity style={styles.voiceGhost} onPress={() => { if (isRecording) void stopVoiceRecording(false); setActiveTool(null); }}>
          <Text style={styles.voiceGhostText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.voicePrimary} onPress={() => setActiveTool(null)}>
          <Text style={styles.voicePrimaryText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  voiceSheet: { backgroundColor: '#08111F', borderRadius: 24, padding: 24, paddingTop: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  voiceHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, marginBottom: 24 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  sliderLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: typography.fontWeight.medium as any },
  panelMeta: { color: 'rgba(255,255,255,0.64)', fontSize: 13 },
  recordButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 12 },
  recordButtonActive: { backgroundColor: 'rgba(239,68,68,0.16)' },
  recordButtonInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  voiceLabel: { color: 'rgba(255,255,255,0.64)', fontSize: 13, marginBottom: 24 },
  voiceList: { width: '100%', gap: 12, marginBottom: 24 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 12 },
  voiceRowInfo: { flex: 1 },
  voiceRowTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: typography.fontWeight.semibold as any },
  voiceMiniButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  voiceMiniButtonDanger: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.16)', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  overlayNote: { color: 'rgba(255,255,255,0.48)', fontSize: 13, lineHeight: 18, textAlign: 'center', marginBottom: 24, paddingHorizontal: 24 },
  voiceActions: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
  voiceGhost: { flex: 1, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  voiceGhostText: { color: '#FFFFFF', fontSize: 15, fontWeight: typography.fontWeight.semibold as any },
  voicePrimary: { flex: 1, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B82F6' },
  voicePrimaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: typography.fontWeight.semibold as any },
});
