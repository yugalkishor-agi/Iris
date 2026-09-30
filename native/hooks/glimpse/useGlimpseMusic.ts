import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Audio, Video } from 'expo-av';
import { clamp } from '../../utils/glimpse/glimpseEditorCalculations';

interface CurrentSong {
  title: string;
  artist?: string;
  duration?: number;
  clipStart?: number;
  clipEnd?: number;
  streamUrl?: string;
}

interface UseGlimpseMusicProps {
  currentSong?: CurrentSong | null;
  mediaType: 'image' | 'video';
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  videoRef: React.RefObject<Video>;
  musicClipStart: number;
  setMusicClipStart: (val: number) => void;
  musicClipEnd: number;
  setMusicClipEnd: (val: number) => void;
  onRequestMusic?: () => void;
  onMusicRangeChange?: (selection: { clipStart: number; clipEnd: number }) => void;
}

export function useGlimpseMusic({
  currentSong,
  mediaType,
  isPlaying,
  setIsPlaying,
  videoRef,
  musicClipStart,
  setMusicClipStart,
  musicClipEnd,
  setMusicClipEnd,
  onRequestMusic,
  onMusicRangeChange,
}: UseGlimpseMusicProps) {
  const [musicPreviewing, setMusicPreviewing] = useState(false);
  const [musicPreviewLoading, setMusicPreviewLoading] = useState(false);

  const musicPreviewRef = useRef<Audio.Sound | null>(null);
  const musicPreviewStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopMusicPreview = useCallback(async () => {
    if (musicPreviewStopTimerRef.current) {
      clearTimeout(musicPreviewStopTimerRef.current);
      musicPreviewStopTimerRef.current = null;
    }
    const sound = musicPreviewRef.current;
    musicPreviewRef.current = null;
    setMusicPreviewing(false);
    setMusicPreviewLoading(false);
    if (!sound) return;
    try { sound.setOnPlaybackStatusUpdate(null); } catch {}
    try { await sound.stopAsync(); } catch {}
    try { await sound.unloadAsync(); } catch {}
  }, []);

  const toggleMusicPreview = useCallback(async () => {
    if (!currentSong?.streamUrl) {
      onRequestMusic?.();
      return;
    }
    if (musicPreviewLoading) return;
    if (musicPreviewing) {
      await stopMusicPreview();
      return;
    }

    try {
      setMusicPreviewLoading(true);
      await stopMusicPreview();
      
      if (mediaType === 'video' && isPlaying) {
        try { await videoRef.current?.pauseAsync(); } catch {}
        setIsPlaying(false);
      }
      
      const startMs = Math.max(0, Math.round(musicClipStart * 1000));
      const endMs = Math.max(startMs + 1000, Math.round(musicClipEnd * 1000));
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: currentSong.streamUrl },
        { shouldPlay: true, positionMillis: startMs, volume: 1 }
      );
      
      musicPreviewRef.current = sound;
      setMusicPreviewLoading(false);
      setMusicPreviewing(true);
      
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (!status?.isLoaded) return;
        if (status.didJustFinish || (typeof status.positionMillis === 'number' && status.positionMillis >= endMs - 120)) {
          void stopMusicPreview();
        }
      });
      
      musicPreviewStopTimerRef.current = setTimeout(() => {
        void stopMusicPreview();
      }, Math.max(1000, endMs - startMs + 120));
    } catch {
      setMusicPreviewLoading(false);
      setMusicPreviewing(false);
      Alert.alert('Preview failed', 'Could not preview this song clip right now.');
    }
  }, [currentSong?.streamUrl, isPlaying, mediaType, musicClipEnd, musicClipStart, musicPreviewLoading, musicPreviewing, onRequestMusic, setIsPlaying, stopMusicPreview, videoRef]);

  useEffect(() => {
    return () => { void stopMusicPreview(); };
  }, [stopMusicPreview]);

  const selectedSongDuration = Math.max(0, Number(currentSong?.duration || 0));
  const musicClipWindow = Math.max(1, Math.min(20, selectedSongDuration || Math.max(1, musicClipEnd - musicClipStart || 20)));
  const maxMusicClipStart = Math.max(0, selectedSongDuration - musicClipWindow);

  const handleMusicClipStartChange = useCallback((value: number) => {
    const nextStart = clamp(Math.round(value), 0, maxMusicClipStart);
    const nextEnd = selectedSongDuration > 0 ? Math.min(selectedSongDuration, nextStart + musicClipWindow) : nextStart + musicClipWindow;
    setMusicClipStart(nextStart);
    setMusicClipEnd(nextEnd);
    onMusicRangeChange?.({ clipStart: nextStart, clipEnd: nextEnd });
  }, [maxMusicClipStart, musicClipWindow, onMusicRangeChange, selectedSongDuration, setMusicClipEnd, setMusicClipStart]);

  return {
    musicPreviewing,
    musicPreviewLoading,
    toggleMusicPreview,
    stopMusicPreview,
    handleMusicClipStartChange,
    selectedSongDuration,
    maxMusicClipStart,
  };
}
