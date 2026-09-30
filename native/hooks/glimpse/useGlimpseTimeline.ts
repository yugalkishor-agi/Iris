import { useCallback, useMemo, useRef } from 'react';
import { PanResponder } from 'react-native';
import { Video } from 'expo-av';
import { clamp } from '../../utils/glimpse/glimpseEditorCalculations';

interface UseGlimpseTimelineProps {
  mediaType: 'image' | 'video';
  videoRef: React.RefObject<Video>;
  fullDurationMs: number;
  currentPosition: number;
  setCurrentPosition: (pos: number) => void;
  trimStart: number;
  setTrimStart: (pos: number) => void;
  effectiveTrimEnd: number;
  setTrimEnd: (pos: number) => void;
  splitAt: number;
  setSplitAt: (pos: number) => void;
  setVoiceInsertAt: (pos: number) => void;
  commitHistorySnapshot: () => void;
}

export function useGlimpseTimeline({
  mediaType,
  videoRef,
  fullDurationMs,
  currentPosition,
  setCurrentPosition,
  trimStart,
  setTrimStart,
  effectiveTrimEnd,
  setTrimEnd,
  splitAt,
  setSplitAt,
  setVoiceInsertAt,
  commitHistorySnapshot,
}: UseGlimpseTimelineProps) {
  const timelineWindowRef = useRef({ x: 0, width: 1 });
  const seekThrottleRef = useRef(0);

  const seekPreviewPosition = useCallback(async (nextMs: number, force = false) => {
    const target = clamp(Math.round(nextMs), 0, fullDurationMs);
    setCurrentPosition(target);
    if (mediaType !== 'video') return;
    const now = Date.now();
    if (!force && now - seekThrottleRef.current < 70) return;
    seekThrottleRef.current = now;
    try {
      await videoRef.current?.setPositionAsync(target);
    } catch {}
  }, [fullDurationMs, mediaType, setCurrentPosition, videoRef]);

  const updateTimelineWindow = useCallback((x: number, width: number) => {
    timelineWindowRef.current = { x, width: Math.max(1, width) };
  }, []);

  const updateTimelineFromGesture = useCallback((moveX: number, mode: 'scrub' | 'trimStart' | 'trimEnd' | 'split' | 'voice') => {
    const ratio = clamp((moveX - timelineWindowRef.current.x) / Math.max(1, timelineWindowRef.current.width), 0, 1);
    const nextMs = Math.round(ratio * fullDurationMs);

    if (mode === 'scrub') {
      void seekPreviewPosition(nextMs);
      return;
    }
    if (mode === 'trimStart') {
      const nextStart = clamp(nextMs, 0, Math.max(0, effectiveTrimEnd - 1000));
      setTrimStart(nextStart);
      if (currentPosition < nextStart) void seekPreviewPosition(nextStart, true);
      return;
    }
    if (mode === 'trimEnd') {
      const nextEnd = clamp(nextMs, trimStart + 1000, fullDurationMs);
      setTrimEnd(nextEnd);
      if (currentPosition > nextEnd) void seekPreviewPosition(nextEnd, true);
      return;
    }
    if (mode === 'split') {
      setSplitAt(clamp(nextMs, trimStart, effectiveTrimEnd));
      return;
    }
    if (mode === 'voice') {
      setVoiceInsertAt(clamp(nextMs, trimStart, effectiveTrimEnd));
    }
  }, [currentPosition, effectiveTrimEnd, fullDurationMs, seekPreviewPosition, setSplitAt, setTrimEnd, setTrimStart, setVoiceInsertAt, trimStart]);

  const buildTimelineResponder = useCallback((mode: 'scrub' | 'trimStart' | 'trimEnd' | 'split' | 'voice') => PanResponder.create({
    onStartShouldSetPanResponder: () => mediaType === 'video',
    onStartShouldSetPanResponderCapture: () => mediaType === 'video',
    onMoveShouldSetPanResponder: () => mediaType === 'video',
    onMoveShouldSetPanResponderCapture: () => mediaType === 'video',
    onPanResponderGrant: (_, gestureState) => {
      updateTimelineFromGesture(gestureState.moveX, mode);
    },
    onPanResponderMove: (_, gestureState) => updateTimelineFromGesture(gestureState.moveX, mode),
    onPanResponderRelease: () => commitHistorySnapshot(),
    onPanResponderTerminate: () => commitHistorySnapshot(),
    onPanResponderTerminationRequest: () => false,
  }), [commitHistorySnapshot, mediaType, updateTimelineFromGesture]);

  const scrubResponder = useMemo(() => buildTimelineResponder('scrub'), [buildTimelineResponder]);
  const trimStartResponder = useMemo(() => buildTimelineResponder('trimStart'), [buildTimelineResponder]);
  const trimEndResponder = useMemo(() => buildTimelineResponder('trimEnd'), [buildTimelineResponder]);
  const splitResponder = useMemo(() => buildTimelineResponder('split'), [buildTimelineResponder]);
  const voiceResponder = useMemo(() => buildTimelineResponder('voice'), [buildTimelineResponder]);

  const handleDeleteLeftSplit = useCallback(() => {
    if (mediaType !== 'video') return;
    const nextStart = clamp(splitAt, 0, Math.max(0, effectiveTrimEnd - 1000));
    setTrimStart(nextStart);
    setSplitAt(nextStart);
    void seekPreviewPosition(nextStart, true);
    commitHistorySnapshot();
  }, [commitHistorySnapshot, effectiveTrimEnd, mediaType, seekPreviewPosition, setSplitAt, setTrimStart, splitAt]);

  const handleDeleteRightSplit = useCallback(() => {
    if (mediaType !== 'video') return;
    const nextEnd = clamp(splitAt, trimStart + 1000, fullDurationMs);
    setTrimEnd(nextEnd);
    setSplitAt(clamp(trimStart, trimStart, nextEnd));
    if (currentPosition > nextEnd) {
      void seekPreviewPosition(nextEnd, true);
    }
    commitHistorySnapshot();
  }, [commitHistorySnapshot, currentPosition, fullDurationMs, mediaType, seekPreviewPosition, setSplitAt, setTrimEnd, splitAt, trimStart]);

  return {
    seekPreviewPosition,
    updateTimelineWindow,
    updateTimelineFromGesture,
    handleDeleteLeftSplit,
    handleDeleteRightSplit,
    scrubResponder,
    trimStartResponder,
    trimEndResponder,
    splitResponder,
    voiceResponder,
  };
}
