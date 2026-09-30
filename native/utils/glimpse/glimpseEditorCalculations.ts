// glimpseEditorCalculations.ts
// Purpose: Timeline and animation calculation functions
// Extracted from: NativeGlimpseEditor.tsx — Session 001

import { clamp } from './glimpseEditorUtils';
export * from './glimpseEditorUtils';
export { GLIMPSE_STYLE_PRESETS } from '../glimpseEditor';

export interface TimelineCalculations {
  playheadPercent: number;
  timelinePlayheadPercent: number;
  trimStartPercent: number;
  trimEndPercent: number;
  splitPercent: number;
  voiceInsertPercent: number;
  trimWindow: number;
  effectiveTrimEnd: number;
}

export function calculateTimelinePositions(
  mediaType: 'image' | 'video',
  currentPosition: number,
  trimStart: number,
  trimEnd: number,
  splitAt: number,
  voiceInsertAt: number,
  durationMillis: number
): TimelineCalculations {
  const fullDurationMs = Math.max(1000, durationMillis || 15000);
  const effectiveTrimEnd = mediaType !== 'video'
    ? 0
    : Math.max(trimStart + 1000, Math.min(durationMillis || 15000, trimEnd > trimStart ? trimEnd : 15000));
  const trimWindow = Math.max(1000, effectiveTrimEnd - trimStart);

  const playheadPercent = mediaType !== 'video'
    ? 0
    : clamp(((currentPosition - trimStart) / trimWindow) * 100, 0, 100);

  const timelinePlayheadPercent = mediaType !== 'video'
    ? 0
    : clamp((currentPosition / fullDurationMs) * 100, 0, 100);

  const trimStartPercent = mediaType !== 'video'
    ? 0
    : clamp((trimStart / fullDurationMs) * 100, 0, 100);

  const trimEndPercent = mediaType !== 'video'
    ? 100
    : clamp((effectiveTrimEnd / fullDurationMs) * 100, 0, 100);

  const splitPercent = mediaType !== 'video'
    ? 0
    : clamp((splitAt / fullDurationMs) * 100, 0, 100);

  const voiceInsertPercent = mediaType !== 'video'
    ? 0
    : clamp((voiceInsertAt / fullDurationMs) * 100, 0, 100);

  return {
    playheadPercent,
    timelinePlayheadPercent,
    trimStartPercent,
    trimEndPercent,
    splitPercent,
    voiceInsertPercent,
    trimWindow,
    effectiveTrimEnd,
  };
}

export interface AnimationProgress {
  loopProgress: number;
  enterProgress: number;
}

export function calculateAnimationProgress(
  previewTimelineMs: number,
  trimStart: number
): AnimationProgress {
  const loopProgress = ((previewTimelineMs % 2200) + 2200) % 2200 / 2200;
  const enterProgress = clamp((((previewTimelineMs - trimStart) % 1600) + 1600) % 1600 / 900, 0, 1);

  return { loopProgress, enterProgress };
}
