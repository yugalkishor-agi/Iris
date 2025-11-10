import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Palette, Sparkles, Zap, Palette as PaletteIcon } from 'lucide-react';

interface EnhancedDrawToolPanelProps {
  selectedTool: 'marker' | 'highlighter' | 'neon' | 'chalk' | 'arrow';
  brushSize: number;
  drawColor: string;
  opacity: number;
  onToolChange: (tool: 'marker' | 'highlighter' | 'neon' | 'chalk' | 'arrow') => void;
  onBrushSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
  onClearDrawing: () => void;
}

export function EnhancedDrawToolPanel({
  selectedTool,
  brushSize,
  drawColor,
  opacity,
  onToolChange,
  onBrushSizeChange,
  onColorChange,
  onOpacityChange,
  onClearDrawing
}: EnhancedDrawToolPanelProps) {
  const [showMoreColors, setShowMoreColors] = useState(false);

  const drawingTools = [
    { 
      type: 'marker' as const, 
      icon: '🖊️', 
      label: 'Marker', 
      desc: 'Opaque solid line',
      defaultSize: 8
    },
    { 
      type: 'highlighter' as const, 
      icon: '✏️', 
      label: 'Highlighter', 
      desc: 'Semi-transparent wide',
      defaultSize: 20
    },
    { 
      type: 'neon' as const, 
      icon: '✨', 
      label: 'Neon', 
      desc: 'Glowing effect',
      defaultSize: 10
    },
    { 
      type: 'chalk' as const, 
      icon: '🎨', 
      label: 'Chalk', 
      desc: 'Textured appearance',
      defaultSize: 12
    },
    { 
      type: 'arrow' as const, 
      icon: '➡️', 
      label: 'Arrow', 
      desc: 'Directional arrows',
      defaultSize: 15
    }
  ];

  const basicColors = [
    '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#FF1493'
  ];

  const extendedColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#FAD7A0',
    '#D7BDE2', '#A3E4D7', '#F9E79F', '#F5B7B1', '#D5DBDB'
  ];

  return (
    <div className="space-y-4">
      {/* Drawing tool selector */}
      <div>
        <label className="text-white text-sm font-medium mb-2 block">Drawing Tool</label>
        <div className="grid grid-cols-5 gap-2">
          {drawingTools.map((tool) => (
            <button
              key={tool.type}
              onClick={() => {
                onToolChange(tool.type);
                onBrushSizeChange(tool.defaultSize);
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                selectedTool === tool.type
                  ? 'bg-primary text-white scale-105'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <span className="text-2xl">{tool.icon}</span>
              <span className="text-[10px] font-medium">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tool info */}
      <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl p-3 border border-primary/20">
        <p className="text-primary text-xs font-medium">
          {drawingTools.find(t => t.type === selectedTool)?.desc}
        </p>
      </div>

      {/* Brush size */}
      <div>
        <label className="text-white text-sm font-medium mb-2 block">
          Brush Size: {brushSize}px
        </label>
        <Slider
          value={[brushSize]}
          onValueChange={([val]) => onBrushSizeChange(val)}
          min={2}
          max={50}
          step={1}
          className="w-full"
        />
        <div className="flex gap-2 mt-2">
          {[5, 10, 20, 30].map(size => (
            <button
              key={size}
              onClick={() => onBrushSizeChange(size)}
              className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${
                brushSize === size
                  ? 'bg-primary text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>

      {/* Opacity control */}
      <div>
        <label className="text-white text-sm font-medium mb-2 block">
          Opacity: {Math.round(opacity * 100)}%
        </label>
        <Slider
          value={[opacity * 100]}
          onValueChange={([val]) => onOpacityChange(val / 100)}
          min={10}
          max={100}
          step={5}
          className="w-full"
        />
      </div>

      {/* Color palette */}
      <div>
        <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Color Palette
        </label>
        <div className="grid grid-cols-5 gap-2">
          {basicColors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-full aspect-square rounded-xl border-2 transition-all hover:scale-110 ${
                drawColor === color 
                  ? 'border-white scale-110 ring-2 ring-primary' 
                  : 'border-white/30'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <button
          onClick={() => setShowMoreColors(!showMoreColors)}
          className="w-full mt-2 py-2 text-xs text-white/70 hover:text-white transition-colors"
        >
          {showMoreColors ? 'Show Less' : 'More Colors'}
        </button>

        {showMoreColors && (
          <div className="grid grid-cols-5 gap-2 mt-2 animate-slide-up">
            {extendedColors.map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`w-full aspect-square rounded-xl border-2 transition-all hover:scale-110 ${
                  drawColor === color 
                    ? 'border-white scale-110 ring-2 ring-primary' 
                    : 'border-white/30'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Clear button */}
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
