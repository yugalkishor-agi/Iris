/**
 * useAudioPlayer Hook - React hook for audio playback with preloading
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { audioService } from '../services/audio.service';
import { audioPreloader } from '../utils/audioPreloader';

interface AudioMetadata {
  trackId: string;
  title: string;
  artist: string;
  duration: number;
  streamUrl: string;
}

interface UseAudioPlayerOptions {
  autoPlay?: boolean;
  preloadNext?: boolean;
  onEnded?: () => void;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackIdRef = useRef<string | null>(null);

  /**
   * Play audio track
   */
  const play = useCallback(async (
    trackId: string,
    streamUrl: string,
    metadata: AudioMetadata
  ) => {
    try {
      setIsLoading(true);
      
      // Stop current audio if different track
      if (currentTrackIdRef.current !== trackId) {
        audioService.stopCurrentAudio();
      }

      // Play audio
      const audio = await audioService.playAudio(
        trackId,
        streamUrl,
        metadata,
        options.onEnded
      );

      audioRef.current = audio;
      currentTrackIdRef.current = trackId;

      // Set up event listeners
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });

      audio.addEventListener('play', () => {
        setIsPlaying(true);
        setIsLoading(false);
      });

      audio.addEventListener('pause', () => {
        setIsPlaying(false);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      setIsPlaying(true);
      setIsLoading(false);
    } catch (error: any) {
      // Silently handle autoplay errors
      if (error?.name !== 'NotAllowedError') {
        console.error('Failed to play audio:', error);
      }
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [options.onEnded]);

  /**
   * Pause audio
   */
  const pause = useCallback(() => {
    audioService.pauseCurrentAudio();
    setIsPlaying(false);
  }, []);

  /**
   * Resume audio
   */
  const resume = useCallback(() => {
    audioService.resumeCurrentAudio();
    setIsPlaying(true);
  }, []);

  /**
   * Stop audio
   */
  const stop = useCallback(() => {
    audioService.stopCurrentAudio();
    setIsPlaying(false);
    setCurrentTime(0);
    currentTrackIdRef.current = null;
  }, []);

  /**
   * Seek to position
   */
  const seek = useCallback((time: number) => {
    const audio = audioService.getCurrentAudio();
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  /**
   * Set volume
   */
  const setVolumeLevel = useCallback((level: number) => {
    const audio = audioService.getCurrentAudio();
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, level));
      setVolume(audio.volume);
    }
  }, []);

  /**
   * Preload tracks
   */
  const preloadTracks = useCallback((
    tracks: Array<{ trackId: string; streamUrl: string; metadata: AudioMetadata }>
  ) => {
    audioService.addToPreloadQueue(tracks);
  }, []);

  /**
   * Check if track is cached
   */
  const isCached = useCallback((trackId: string) => {
    return audioService.isCached(trackId);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      audioService.stopCurrentAudio();
    };
  }, []);

  return {
    play,
    pause,
    resume,
    stop,
    seek,
    setVolume: setVolumeLevel,
    preloadTracks,
    isCached,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    currentTrackId: currentTrackIdRef.current,
  };
}

/**
 * useAudioPreloader Hook - Preload audio based on scroll behavior
 */
export function useAudioPreloader(
  items: Array<{
    trackId: string;
    streamUrl: string;
    metadata: AudioMetadata;
  }>,
  currentIndex: number
) {
  useEffect(() => {
    // Track scroll behavior
    const cleanup = audioPreloader.trackScrollBehavior();

    return cleanup;
  }, []);

  useEffect(() => {
    // Preload next items when index changes
    if (items.length > 0) {
      audioPreloader.preloadNextItems(currentIndex, items, 3);
    }
  }, [currentIndex, items]);

  useEffect(() => {
    // Preload visible items on mount
    if (items.length > 0) {
      audioPreloader.preloadVisibleItems(items);
    }
  }, [items]);
}
