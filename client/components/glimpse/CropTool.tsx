import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Crop, Check, X, Maximize2 } from 'lucide-react';

interface CropToolProps {
  videoUrl: string;
  onCrop: (cropData: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
}

const ASPECT_RATIOS = [
  { name: 'Free', ratio: null },
  { name: '1:1', ratio: 1 },
  { name: '4:5', ratio: 4 / 5 },
  { name: '9:16', ratio: 9 / 16 },
  { name: '16:9', ratio: 16 / 9 },
];

export function CropTool({ videoUrl, onCrop, onCancel }: CropToolProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedRatio, setSelectedRatio] = useState<number | null>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });

  const handleApply = () => {
    onCrop(cropArea);
  };

  const handleRatioSelect = (ratio: number | null) => {
    setSelectedRatio(ratio);
    // Adjust crop area to match ratio
    if (ratio) {
      const newHeight = cropArea.width / ratio;
      setCropArea({ ...cropArea, height: newHeight });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Crop className="h-5 w-5 text-primary" />
          <h2 className="text-white font-semibold">Crop Video</h2>
        </div>
        <button
          onClick={onCancel}
          className="text-white/60 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Video Preview with Crop Overlay */}
      <div className="flex-1 flex items-center justify-center p-4 bg-black">
        <div className="relative max-w-md w-full aspect-video bg-black/50 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            muted
            loop
            autoPlay
          />
          
          {/* Crop Overlay */}
          <div className="absolute inset-0">
            {/* Darkened areas outside crop */}
            <div className="absolute inset-0 bg-black/60" />
            
            {/* Visible crop area */}
            <div
              className="absolute border-2 border-primary bg-transparent"
              style={{
                left: `${cropArea.x}%`,
                top: `${cropArea.y}%`,
                width: `${cropArea.width}%`,
                height: `${cropArea.height}%`,
              }}
            >
              {/* Corner handles */}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full" />
              
              {/* Grid lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/20" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aspect Ratio Selector */}
      <div className="p-4 border-t border-white/10 space-y-4">
        <div>
          <h3 className="text-white text-sm mb-3">Aspect Ratio</h3>
          <div className="flex gap-2 overflow-x-auto">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.name}
                onClick={() => handleRatioSelect(ar.ratio)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                  selectedRatio === ar.ratio
                    ? 'bg-primary text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {ar.name}
              </button>
            ))}
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
            Apply Crop
          </Button>
        </div>
      </div>
    </div>
  );
}
