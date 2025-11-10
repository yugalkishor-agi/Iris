import { useRef, useEffect, useState } from 'react';
import { Play, Pause, Scissors, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimelineClip {
  id: string;
  type: 'video' | 'image';
  url: string;
  startTime: number;
  duration: number;
  thumbnail?: string;
}

interface VideoTimelineProps {
  clips: TimelineClip[];
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onSplitClip: () => void;
  onDeleteClip: (clipId: string) => void;
  onSelectClip: (clipId: string) => void;
  selectedClipId: string | null;
}

export function VideoTimeline({
  clips,
  currentTime,
  totalDuration,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
  onSplitClip,
  onDeleteClip,
  onSelectClip,
  selectedClipId,
}: VideoTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * totalDuration;
    onSeek(time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const pixelsPerSecond = 50; // Zoom level
  const timelineWidth = totalDuration * pixelsPerSecond;

  return (
    <div className="bg-black/95 border-t border-white/10">
      {/* Playback Controls */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={isPlaying ? onPause : onPlay}
            className="text-white hover:bg-white/10"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <span className="text-white text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSplitClip}
            className="text-white hover:bg-white/10"
          >
            <Scissors className="h-4 w-4 mr-1" />
            Split
          </Button>
          {selectedClipId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteClip(selectedClipId)}
              className="text-red-400 hover:bg-red-400/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Timeline Scroll Container */}
      <div className="overflow-x-auto overflow-y-hidden h-32 bg-black/50">
        <div className="relative h-full" style={{ width: `${Math.max(timelineWidth, 400)}px` }}>
          {/* Time Markers */}
          <div className="absolute top-0 left-0 right-0 h-6 border-b border-white/10">
            {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 border-l border-white/20"
                style={{ left: `${i * pixelsPerSecond}px` }}
              >
                <span className="text-xs text-white/60 ml-1">{i}s</span>
              </div>
            ))}
          </div>

          {/* Video Track */}
          <div className="absolute top-6 left-0 right-0 h-16">
            <div className="text-xs text-white/60 mb-1 px-2">Video</div>
            <div className="relative h-12">
              {clips.map((clip) => (
                <div
                  key={clip.id}
                  onClick={() => onSelectClip(clip.id)}
                  className={`absolute top-0 h-full rounded border-2 cursor-pointer transition-all ${
                    selectedClipId === clip.id
                      ? 'border-primary bg-primary/20'
                      : 'border-white/30 bg-white/10 hover:border-white/50'
                  }`}
                  style={{
                    left: `${clip.startTime * pixelsPerSecond}px`,
                    width: `${clip.duration * pixelsPerSecond}px`,
                  }}
                >
                  {clip.thumbnail && (
                    <img
                      src={clip.thumbnail}
                      alt="Clip"
                      className="w-full h-full object-cover rounded opacity-50"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-white font-medium bg-black/50 px-2 py-1 rounded">
                      {clip.duration.toFixed(1)}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none"
            style={{ left: `${currentTime * pixelsPerSecond}px` }}
          >
            <div className="absolute -top-1 -left-2 w-4 h-4 bg-primary rounded-full border-2 border-white" />
          </div>

          {/* Click area for seeking */}
          <div
            ref={timelineRef}
            className="absolute inset-0 cursor-pointer"
            onClick={handleTimelineClick}
          />
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center justify-center gap-2 p-2 border-t border-white/10">
        <span className="text-xs text-white/60">Zoom: {pixelsPerSecond}px/s</span>
      </div>
    </div>
  );
}
