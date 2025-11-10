import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Eraser, Pencil, Palette } from 'lucide-react';
import { useState } from 'react';

interface DrawToolPanelProps {
  brushSize: number;
  drawColor: string;
  onBrushSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
  onClearDrawing: () => void;
  isEraser?: boolean;
  onEraserToggle?: (enabled: boolean) => void;
}

export function DrawToolPanel({
  brushSize,
  drawColor,
  onBrushSizeChange,
  onColorChange,
  onClearDrawing,
  isEraser = false,
  onEraserToggle
}: DrawToolPanelProps) {
  const [showMoreColors, setShowMoreColors] = useState(false);
  
  const basicColors = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
  const extendedColors = [
    '#FFA500', '#FF1493', '#8B4513', '#4B0082', '#2E8B57', '#DC143C', '#191970', '#FFD700',
    '#FF6347', '#40E0D0', '#EE82EE', '#F5DEB3', '#5F9EA0', '#D2691E', '#FF4500', '#DA70D6'
  ];
  
  const brushPresets = [
    { name: 'Fine', size: 3 },
    { name: 'Normal', size: 8 },
    { name: 'Thick', size: 15 },
    { name: 'Bold', size: 25 }
  ];

  return (
    <div className="space-y-4">
      {/* Color Picker */}
      {!isEraser && (
        <div>
          <label className="text-white text-sm font-medium mb-3 block flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Color Palette
          </label>
          <div className="grid grid-cols-4 gap-2">
            {basicColors.map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`w-full aspect-square rounded-xl border-2 transition-all hover:scale-110 ${
                  drawColor === color ? 'border-white scale-110 shadow-lg' : 'border-white/30'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          
          {/* Show More Colors Button */}
          <button
            onClick={() => setShowMoreColors(!showMoreColors)}
            className="w-full mt-2 py-2 text-xs text-white/70 hover:text-white transition-colors"
          >
            {showMoreColors ? 'Show Less' : 'More Colors'}
          </button>
          
          {/* Extended Colors */}
          {showMoreColors && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {extendedColors.map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={`w-full aspect-square rounded-xl border-2 transition-all hover:scale-110 ${
                    drawColor === color ? 'border-white scale-110 shadow-lg' : 'border-white/30'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Clear Button */}
      <Button
        onClick={onClearDrawing}
        variant="destructive"
        className="w-full bg-red-500 hover:bg-red-600"
      >
        Clear All Drawing
      </Button>
    </div>
  );
}
