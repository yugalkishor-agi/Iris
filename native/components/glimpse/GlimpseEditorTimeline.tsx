import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDuration, clamp } from '../../utils/glimpse/glimpseEditorCalculations';
import { typography } from '../../styles/theme';
import { GlimpseVoiceSegment } from '../../utils/glimpse/glimpseEditorTypes';

interface GlimpseEditorTimelineProps {
  mediaType: 'image' | 'video';
  currentPosition: number;
  fullDurationMs: number;
  trimStartPercent: number;
  trimEndPercent: number;
  timelinePlayheadPercent: number;
  splitPercent: number;
  trimStart: number;
  splitAt: number;
  effectiveTrimEnd: number;
  withVoice: boolean;
  voiceSegments: GlimpseVoiceSegment[];
  voiceInsertPercent: number;
  timelineTrackRef: React.RefObject<View>;
  updateTimelineWindow: (x: number, width: number) => void;
  scrubResponder: any;
  trimStartResponder: any;
  trimEndResponder: any;
  splitResponder: any;
  voiceResponder: any;
}

export function GlimpseEditorTimeline({
  mediaType,
  currentPosition,
  fullDurationMs,
  trimStartPercent,
  trimEndPercent,
  timelinePlayheadPercent,
  splitPercent,
  trimStart,
  splitAt,
  effectiveTrimEnd,
  withVoice,
  voiceSegments,
  voiceInsertPercent,
  timelineTrackRef,
  updateTimelineWindow,
  scrubResponder,
  trimStartResponder,
  trimEndResponder,
  splitResponder,
  voiceResponder,
}: GlimpseEditorTimelineProps) {
  if (mediaType !== 'video') return null;

  return (
    <View style={styles.panelCard}>
      <View style={styles.panelHead}>
        <Text style={styles.panelTitle}>Timeline</Text>
        <Text style={styles.panelMeta}>{formatDuration(currentPosition)} / {formatDuration(fullDurationMs)}</Text>
      </View>
      <View
        ref={timelineTrackRef}
        onLayout={(e) => {
          // Native measure logic to be called on layout
          timelineTrackRef.current?.measure((x, y, width, height, pageX) => {
            updateTimelineWindow(pageX, width);
          });
        }}
        {...scrubResponder.panHandlers}
        style={styles.waveTrack}
      >
        <View style={[styles.waveMask, { width: `${trimStartPercent}%` }]} />
        <View style={[styles.waveMask, { left: `${trimEndPercent}%`, right: 0 }]} />
        <View style={[styles.playhead, { left: `${timelinePlayheadPercent}%` }]} />
        
        {Array.from({ length: 40 }).map((_, index) => (
          <View key={index} style={[styles.waveBar, { height: 10 + ((index * 9) % 20) }]} />
        ))}
        
        <View style={[styles.timelineHandle, { left: `${trimStartPercent}%` }]} {...trimStartResponder.panHandlers}>
          <View style={styles.timelineHandleGrip} />
        </View>
        <View style={[styles.timelineHandle, styles.timelineHandleEnd, { left: `${trimEndPercent}%` }]} {...trimEndResponder.panHandlers}>
          <View style={styles.timelineHandleGrip} />
        </View>
        <View style={[styles.timelineSplitHandle, { left: `${splitPercent}%` }]} {...splitResponder.panHandlers}>
          <Ionicons name="cut-outline" size={12} color="#FFFFFF" />
        </View>
      </View>
      <View style={styles.timelineLabels}>
        <Text style={styles.timelineLabel}>{formatDuration(trimStart)}</Text>
        <Text style={styles.timelineLabel}>Split {formatDuration(splitAt)}</Text>
        <Text style={styles.timelineLabel}>{formatDuration(effectiveTrimEnd)}</Text>
      </View>
      {withVoice ? (
        <View style={styles.voiceTrack} {...voiceResponder.panHandlers}>
          <View style={[styles.voiceMarker, { left: `${voiceInsertPercent}%` }]} />
          {voiceSegments.map((segment) => (
            <View
              key={segment.id}
              style={[
                styles.voiceSegment,
                {
                  left: `${clamp(((segment.startMs || 0) / fullDurationMs) * 100, 0, 100)}%`,
                  width: `${clamp(((segment.durationMs || 0) / fullDurationMs) * 100, 8, 100)}%`,
                },
              ]}
            >
              <Ionicons name="mic" size={12} color="#FFFFFF" />
              <Text style={styles.voiceSegmentText} numberOfLines={1}>{segment.label || 'Voice'}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panelCard: { backgroundColor: '#0A1220', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  panelTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: typography.fontWeight.semibold as any },
  panelMeta: { color: 'rgba(255,255,255,0.64)', fontSize: 13 },
  waveTrack: { height: 48, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', position: 'relative' },
  waveMask: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.68)', zIndex: 10 },
  waveBar: { width: 3, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 2 },
  playhead: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#FFFFFF', marginLeft: -1, zIndex: 12 },
  timelineHandle: { position: 'absolute', top: 0, bottom: 0, width: 16, marginLeft: -8, backgroundColor: '#3B82F6', zIndex: 15, alignItems: 'center', justifyContent: 'center' },
  timelineHandleEnd: { backgroundColor: '#60A5FA' },
  timelineHandleGrip: { width: 4, height: 16, backgroundColor: '#FFFFFF', borderRadius: 2 },
  timelineSplitHandle: { position: 'absolute', top: 0, bottom: 0, width: 24, marginLeft: -12, backgroundColor: '#A78BFA', zIndex: 14, alignItems: 'center', justifyContent: 'center' },
  timelineLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  timelineLabel: { color: 'rgba(255,255,255,0.48)', fontSize: 11, fontWeight: typography.fontWeight.medium as any },
  voiceTrack: { height: 32, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, marginTop: 12, position: 'relative', overflow: 'hidden' },
  voiceMarker: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#F87171', marginLeft: -1, zIndex: 5 },
  voiceSegment: { position: 'absolute', top: 2, bottom: 2, backgroundColor: '#EF4444', borderRadius: 6, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, gap: 4 },
  voiceSegmentText: { color: '#FFFFFF', fontSize: 10, fontWeight: typography.fontWeight.bold as any, flex: 1 },
});
