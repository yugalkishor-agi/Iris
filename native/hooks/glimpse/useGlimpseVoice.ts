import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { GlimpseVoiceSegment } from '../../utils/glimpse/glimpseEditorTypes';
import { clamp, makeId } from '../../utils/glimpse/glimpseEditorCalculations';
import { MAX_VOICEOVER_MS } from '../../utils/glimpse/glimpseEditorConstants';

interface UseGlimpseVoiceProps {
  mediaType: 'image' | 'video';
  voiceSegments: GlimpseVoiceSegment[];
  setVoiceSegments: React.Dispatch<React.SetStateAction<GlimpseVoiceSegment[]>>;
  voiceInsertAt: number;
  trimStart: number;
  effectiveTrimEnd: number;
  isPlaying: boolean;
  currentPosition: number;
}

export function useGlimpseVoice({
  mediaType,
  voiceSegments,
  setVoiceSegments,
  voiceInsertAt,
  trimStart,
  effectiveTrimEnd,
  isPlaying,
  currentPosition,
}: UseGlimpseVoiceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMs, setRecordingMs] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voicePreviewRef = useRef<Audio.Sound | null>(null);
  const activeTimelineVoiceRefs = useRef<Map<string, Audio.Sound>>(new Map());
  const pendingTimelineVoiceRefs = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync().catch(() => undefined);
      if (voicePreviewRef.current) voicePreviewRef.current.unloadAsync().catch(() => undefined);
      void stopAllTimelineVoiceSegments();
    };
  }, []);

  const playVoiceSegment = useCallback(async (segment: GlimpseVoiceSegment) => {
    try {
      if (voicePreviewRef.current) {
        await voicePreviewRef.current.unloadAsync();
        voicePreviewRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: segment.uri }, { shouldPlay: true });
      voicePreviewRef.current = sound;
    } catch {
      Alert.alert('Preview failed', 'Could not play this voiceover.');
    }
  }, []);

  const removeVoiceSegment = useCallback((segmentId: string) => {
    setVoiceSegments((prev) => prev.filter((segment) => segment.id !== segmentId));
  }, [setVoiceSegments]);

  const stopTimelineVoiceSegment = useCallback(async (segmentId: string) => {
    const sound = activeTimelineVoiceRefs.current.get(segmentId);
    activeTimelineVoiceRefs.current.delete(segmentId);
    pendingTimelineVoiceRefs.current.delete(segmentId);
    if (!sound) return;
    try { await sound.stopAsync(); } catch {}
    try { await sound.unloadAsync(); } catch {}
  }, []);

  const stopAllTimelineVoiceSegments = useCallback(async () => {
    const segmentIds = Array.from(activeTimelineVoiceRefs.current.keys());
    if (!segmentIds.length) return;
    await Promise.all(segmentIds.map((segmentId) => stopTimelineVoiceSegment(segmentId)));
  }, [stopTimelineVoiceSegment]);

  const syncTimelineVoiceSegments = useCallback(async (positionMillis: number) => {
    if (mediaType !== 'video' || !isPlaying || isRecording || !voiceSegments.length) {
      await stopAllTimelineVoiceSegments();
      return;
    }

    const activeSegmentIds = new Set<string>();
    for (const segment of voiceSegments) {
      const startMs = Number(segment.startMs || 0);
      const durationMs = Math.max(0, Number(segment.durationMs || 0));
      const endMs = startMs + durationMs;
      const segmentActive = durationMs > 0 && positionMillis >= startMs && positionMillis <= endMs;
      
      if (!segmentActive) continue;
      activeSegmentIds.add(segment.id);
      
      if (activeTimelineVoiceRefs.current.has(segment.id) || pendingTimelineVoiceRefs.current.has(segment.id)) continue;

      pendingTimelineVoiceRefs.current.add(segment.id);
      try {
        const startOffset = Math.max(0, positionMillis - startMs);
        const { sound } = await Audio.Sound.createAsync(
          { uri: segment.uri },
          { shouldPlay: true, positionMillis: startOffset, volume: 1 }
        );
        activeTimelineVoiceRefs.current.set(segment.id, sound);
        sound.setOnPlaybackStatusUpdate((playbackStatus: any) => {
          if (!playbackStatus?.isLoaded || playbackStatus.didJustFinish) {
            void stopTimelineVoiceSegment(segment.id);
          }
        });
      } catch {}
      finally {
        pendingTimelineVoiceRefs.current.delete(segment.id);
      }
    }

    const staleIds = Array.from(activeTimelineVoiceRefs.current.keys()).filter((segmentId) => !activeSegmentIds.has(segmentId));
    if (staleIds.length) {
      await Promise.all(staleIds.map((segmentId) => stopTimelineVoiceSegment(segmentId)));
    }
  }, [isPlaying, isRecording, mediaType, stopAllTimelineVoiceSegments, stopTimelineVoiceSegment, voiceSegments]);

  useEffect(() => {
    void syncTimelineVoiceSegments(currentPosition);
  }, [currentPosition, syncTimelineVoiceSegments]);

  const stopVoiceRecording = useCallback(async (commit: boolean) => {
    try {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      const recording = recordingRef.current;
      recordingRef.current = null;
      if (!recording) return;
      
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      
      const uri = recording.getURI();
      const duration = Math.max(800, recordingMs);
      
      if (commit && uri) {
        const startMs = clamp(voiceInsertAt, trimStart, Math.max(trimStart, effectiveTrimEnd - duration));
        setVoiceSegments((prev) => [...prev, { 
          id: makeId('voice'), 
          uri, 
          startMs, 
          durationMs: duration, 
          label: `Voice ${prev.length + 1}` 
        }]);
      }
    } catch {
      if (commit) Alert.alert('Voiceover failed', 'Could not finish recording.');
    } finally {
      setIsRecording(false);
      setRecordingMs(0);
    }
  }, [effectiveTrimEnd, recordingMs, setVoiceSegments, trimStart, voiceInsertAt]);

  const startVoiceRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Microphone permission is needed for voiceover.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setRecordingMs(0);
      setIsRecording(true);
      
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingMs((prev) => {
          const next = Math.min(MAX_VOICEOVER_MS, prev + 200);
          if (next >= MAX_VOICEOVER_MS) {
            if (recordingTimerRef.current) {
              clearInterval(recordingTimerRef.current);
              recordingTimerRef.current = null;
            }
            setTimeout(() => { void stopVoiceRecording(true); }, 0);
          }
          return next;
        });
      }, 200);
    } catch {
      Alert.alert('Voiceover failed', 'Could not start the recorder.');
    }
  }, [stopVoiceRecording]);

  return {
    isRecording,
    recordingMs,
    startVoiceRecording,
    stopVoiceRecording,
    playVoiceSegment,
    removeVoiceSegment,
    stopAllTimelineVoiceSegments,
  };
}
