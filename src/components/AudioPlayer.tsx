/**
 * AudioPlayer Component - Visual audio player with waveform animation
 */

import { useEffect, useState } from 'react';
import { Music, Pause, Play, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  isPlaying: boolean;
  isLoading: boolean;
  trackTitle?: string;
  trackArtist?: string;
  onTogglePlay?: () => void;
  showWaveform?: boolean;
  compact?: boolean;
}

export function AudioPlayer({
  isPlaying,
  isLoading,
  trackTitle,
  trackArtist,
  onTogglePlay,
  showWaveform = true,
  compact = false,
}: AudioPlayerProps) {
  const [waveformBars, setWaveformBars] = useState<number[]>([]);

  useEffect(() => {
    // Generate random waveform bars
    const bars = Array.from({ length: compact ? 15 : 30 }, () => 
      Math.random() * 60 + 40
    );
    setWaveformBars(bars);
  }, [compact]);

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-black/30 rounded-full px-3 py-2 backdrop-blur-sm">
        <Music className="h-4 w-4 text-white" />
        {showWaveform && isPlaying && (
          <div className="flex items-center gap-0.5 h-4">
            {waveformBars.slice(0, 10).map((height, i) => (
              <div
                key={i}
                className="w-0.5 bg-white rounded-full animate-pulse"
                style={{
                  height: `${height}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
          </div>
        )}
        <div className="flex-1 overflow-hidden max-w-[150px]">
          <div className={`text-white text-xs whitespace-nowrap ${isPlaying ? 'animate-marquee' : ''}`}>
            {trackTitle || 'Original Audio'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          disabled={isLoading}
          className="h-10 w-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5 text-white" />
          ) : (
            <Play className="h-5 w-5 text-white ml-0.5" />
          )}
        </button>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium text-sm truncate">
            {trackTitle || 'Original Audio'}
          </div>
          {trackArtist && (
            <div className="text-white/60 text-xs truncate">
              {trackArtist}
            </div>
          )}
        </div>

        {/* Waveform Visualization */}
        {showWaveform && (
          <div className="flex items-center gap-0.5 h-8">
            {waveformBars.map((height, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all ${
                  isPlaying ? 'bg-primary animate-pulse' : 'bg-white/30'
                }`}
                style={{
                  height: `${height}%`,
                  animationDelay: `${i * 0.05}s`,
                  animationDuration: '0.6s',
                }}
              />
            ))}
          </div>
        )}

        {/* Music Icon */}
        <Music className="h-5 w-5 text-white/60" />
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-shimmer" style={{ width: '30%' }} />
        </div>
      )}
    </div>
  );
}

/**
 * Mini Audio Indicator - Small pulsing music icon
 */
export function AudioIndicator({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full p-2">
      <Music 
        className={`h-4 w-4 text-white ${isPlaying ? 'animate-pulse' : ''}`} 
      />
    </div>
  );
}

/**
 * Audio Loading Shimmer - Shows while audio is buffering
 */
export function AudioLoadingShimmer() {
  return (
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
  );
}
