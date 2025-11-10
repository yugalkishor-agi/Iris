import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Scissors, Check, X } from 'lucide-react';

interface TrimmerToolProps {
  type: 'video' | 'audio';
  duration: number;
  initialStart: number;
  initialEnd: number;
  onTrim: (start: number, end: number) => void;
  onCancel: () => void;
}

export function TrimmerTool({
  type,
  duration,
  initialStart,
  initialEnd,
  onTrim,
  onCancel,
}: TrimmerToolProps) {
  const [trimStart, setTrimStart] = useState(initialStart);
  const [trimEnd, setTrimEnd] = useState(initialEnd);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleApply = () => {
    onTrim(trimStart, trimEnd);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            <h2 className="text-white font-semibold">
              Trim {type === 'video' ? 'Video' : 'Audio'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Timeline Visualization */}
        <div className="relative h-16 bg-black/50 rounded-lg mb-6 overflow-hidden">
          {/* Full duration bar */}
          <div className="absolute inset-0 bg-white/5" />
          
          {/* Trimmed section */}
          <div
            className="absolute top-0 bottom-0 bg-primary/30 border-l-2 border-r-2 border-primary"
            style={{
              left: `${(trimStart / duration) * 100}%`,
              width: `${((trimEnd - trimStart) / duration) * 100}%`,
            }}
          />
          
          {/* Time labels */}
          <div className="absolute inset-0 flex items-center justify-between px-2">
            <span className="text-xs text-white/60">{formatTime(trimStart)}</span>
            <span className="text-xs text-white/60">{formatTime(trimEnd)}</span>
          </div>
        </div>

        {/* Trim Start */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-white/80">Start Time</label>
            <span className="text-sm text-primary font-mono">{formatTime(trimStart)}</span>
          </div>
          <Slider
            value={[trimStart]}
            onValueChange={([v]) => setTrimStart(Math.min(v, trimEnd - 0.1))}
            max={duration}
            step={0.01}
            className="w-full"
          />
        </div>

        {/* Trim End */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-white/80">End Time</label>
            <span className="text-sm text-primary font-mono">{formatTime(trimEnd)}</span>
          </div>
          <Slider
            value={[trimEnd]}
            onValueChange={([v]) => setTrimEnd(Math.max(v, trimStart + 0.1))}
            max={duration}
            step={0.01}
            className="w-full"
          />
        </div>

        {/* Duration Info */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80">New Duration:</span>
            <span className="text-primary font-bold">{formatTime(trimEnd - trimStart)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Check className="h-4 w-4 mr-2" />
            Apply Trim
          </Button>
        </div>
      </div>
    </div>
  );
}
