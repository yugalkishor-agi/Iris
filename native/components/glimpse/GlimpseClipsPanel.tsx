import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { formatDuration, clamp } from '../../utils/glimpse/glimpseEditorCalculations';
import { typography, spacing } from '../../styles/theme';
import { GlimpseEditorTimeline } from './GlimpseEditorTimeline';

interface GlimpseClipsPanelProps {
  mediaType: 'image' | 'video';
  durationMillis: number;
  trimStart: number;
  setTrimStart: (val: number) => void;
  effectiveTrimEnd: number;
  setTrimEnd: (val: number) => void;
  splitAt: number;
  setSplitAt: (val: number) => void;
  muted: boolean;
  internalVolume: number;
  handleVolumeChange: (val: number) => void;
  currentPosition: number;
  handleDeleteLeftSplit: () => void;
  handleDeleteRightSplit: () => void;
  onRequestReplace?: () => void;
  onRequestAddClip?: () => void;
  // Timeline props
  fullDurationMs: number;
  trimStartPercent: number;
  trimEndPercent: number;
  timelinePlayheadPercent: number;
  splitPercent: number;
  timelineTrackRef: any;
  updateTimelineWindow: any;
  scrubResponder: any;
  trimStartResponder: any;
  trimEndResponder: any;
  splitResponder: any;
  voiceResponder: any;
}

export function GlimpseClipsPanel({
  mediaType,
  durationMillis,
  trimStart,
  setTrimStart,
  effectiveTrimEnd,
  setTrimEnd,
  splitAt,
  setSplitAt,
  muted,
  internalVolume,
  handleVolumeChange,
  currentPosition,
  handleDeleteLeftSplit,
  handleDeleteRightSplit,
  onRequestReplace,
  onRequestAddClip,
  // Timeline props
  ...timelineProps
}: GlimpseClipsPanelProps) {
  if (mediaType !== 'video') return null;

  return (
    <View style={styles.stackGap}>
      <GlimpseEditorTimeline 
        mediaType={mediaType}
        currentPosition={currentPosition}
        trimStart={trimStart}
        splitAt={splitAt}
        effectiveTrimEnd={effectiveTrimEnd}
        withVoice={false}
        voiceSegments={[]}
        voiceInsertPercent={0}
        {...timelineProps}
      />
      <View style={styles.panelCard}>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Trim start</Text>
          <Text style={styles.panelMeta}>{formatDuration(trimStart)}</Text>
        </View>
        <Slider
          minimumValue={0}
          maximumValue={Math.max(0, durationMillis - 1000)}
          value={trimStart}
          onValueChange={(value) => setTrimStart(value)}
          minimumTrackTintColor="#3B82F6"
          maximumTrackTintColor="rgba(255,255,255,0.14)"
          thumbTintColor="#FFFFFF"
        />
        
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Trim end</Text>
          <Text style={styles.panelMeta}>{formatDuration(effectiveTrimEnd)}</Text>
        </View>
        <Slider
          minimumValue={Math.min(trimStart + 1000, durationMillis)}
          maximumValue={Math.max(trimStart + 1000, durationMillis)}
          value={effectiveTrimEnd}
          onValueChange={(value) => setTrimEnd(value)}
          minimumTrackTintColor="#60A5FA"
          maximumTrackTintColor="rgba(255,255,255,0.14)"
          thumbTintColor="#FFFFFF"
        />
        
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Split</Text>
          <Text style={styles.panelMeta}>{formatDuration(splitAt)}</Text>
        </View>
        <Slider
          minimumValue={trimStart}
          maximumValue={Math.max(trimStart + 1000, effectiveTrimEnd)}
          value={clamp(splitAt, trimStart, effectiveTrimEnd)}
          onValueChange={(value) => setSplitAt(value)}
          minimumTrackTintColor="#A78BFA"
          maximumTrackTintColor="rgba(255,255,255,0.14)"
          thumbTintColor="#FFFFFF"
        />
        
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Video volume</Text>
          <Text style={styles.panelMeta}>{Math.round((muted ? 0 : internalVolume) * 100)}%</Text>
        </View>
        <Slider
          minimumValue={0}
          maximumValue={1}
          value={muted ? 0 : internalVolume}
          onValueChange={handleVolumeChange}
          minimumTrackTintColor="#34D399"
          maximumTrackTintColor="rgba(255,255,255,0.14)"
          thumbTintColor="#FFFFFF"
        />
        
        <View style={styles.panelActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setSplitAt(clamp(currentPosition || trimStart, trimStart, effectiveTrimEnd))}>
            <Text style={styles.actionButtonText}>Split</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDeleteLeftSplit}>
            <Text style={styles.actionButtonText}>Delete left</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDeleteRightSplit}>
            <Text style={styles.actionButtonText}>Delete right</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onRequestReplace?.()}>
            <Text style={styles.actionButtonText}>Replace</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onRequestAddClip?.()}>
            <Text style={styles.actionButtonText}>Add clip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stackGap: { gap: 16 },
  panelCard: { backgroundColor: '#0A1220', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12, marginTop: 12 },
  sliderLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: typography.fontWeight.medium as any },
  panelMeta: { color: 'rgba(255,255,255,0.64)', fontSize: 13 },
  panelActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  actionButton: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  actionButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: typography.fontWeight.semibold as any },
});
