import { useState, useEffect, useCallback } from 'react';
import { useStoryEditorStore } from '@/stores/storyEditorStore';
import { HexColorPicker } from 'react-colorful';
import { Pencil, Highlighter, Sparkles, Eraser, Undo2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const DRAWING_TOOLS = [
  { id: 'marker', icon: Pencil, label: 'Marker' },
  { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
  { id: 'neon', icon: Sparkles, label: 'Neon' },
  { id: 'chalk', icon: Eraser, label: 'Chalk' },
] as const;

const QUICK_COLORS = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff6b6b', '#4ecdc4',
];

export function DrawToolPanel() {
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const {
    currentDrawingTool,
    setCurrentDrawingTool,
    drawingColor,
    setDrawingColor,
    drawingOpacity,
    setDrawingOpacity,
    drawingStrokeWidth,
    setDrawingStrokeWidth,
    undoDrawing,
    clearDrawings,
    setActiveTool,
    setDrawingMode,
  } = useStoryEditorStore();
  
  // Enable drawing mode when panel opens
  useEffect(() => {
    setDrawingMode(true);
    return () => {
      setDrawingMode(false);
    };
  }, [setDrawingMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undoDrawing();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoDrawing]);

  const handleClose = useCallback(() => {
    setDrawingMode(false);
    setActiveTool('none');
  }, [setDrawingMode, setActiveTool]);

  const handleClearAll = () => {
    if (window.confirm('Clear all drawings? This cannot be undone.')) {
      clearDrawings();
    }
  };

  return (
    <div className="absolute inset-x-0 top-20 max-w-md mx-auto p-4 bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-top duration-300">
      <div className="space-y-4">
        {/* Drawing Tools */}
        <div className="space-y-2">
          <label className="text-white/70 text-xs font-medium">TOOL</label>
          <div className="grid grid-cols-4 gap-2">
            {DRAWING_TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isActive = currentDrawingTool === tool.id;
              
              return (
                <button
                  key={tool.id}
                  onClick={() => setCurrentDrawingTool(tool.id)}
                  className={`
                    relative p-4 rounded-2xl transition-all
                    ${isActive
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600 scale-105'
                      : 'bg-white/10 hover:bg-white/20'
                    }
                  `}
                >
                  <Icon className="h-6 w-6 text-white mx-auto" />
                  {isActive && (
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl blur opacity-50 -z-10 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Selection */}
        <div className="space-y-2">
          <label className="text-white/70 text-xs font-medium">COLOR</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-14 h-14 rounded-full border-2 border-white/30 shadow-lg transition-transform hover:scale-110"
              style={{ backgroundColor: drawingColor }}
            />
            <div className="flex-1 grid grid-cols-5 gap-2">
              {QUICK_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setDrawingColor(color)}
                  className={`
                    w-10 h-10 rounded-full border-2 transition-all
                    ${drawingColor === color ? 'border-white scale-110' : 'border-white/20 hover:scale-105'}
                  `}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          {showColorPicker && (
            <div className="mt-2">
              <HexColorPicker color={drawingColor} onChange={setDrawingColor} />
            </div>
          )}
        </div>

        {/* Brush Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-white/70 text-xs font-medium">BRUSH SIZE</label>
            <span className="text-white text-sm">{drawingStrokeWidth}px</span>
          </div>
          <Slider
            value={[drawingStrokeWidth]}
            onValueChange={(v) => setDrawingStrokeWidth(v[0])}
            min={1}
            max={50}
            step={1}
            className="w-full"
          />
          {/* Visual Preview */}
          <div className="flex items-center justify-center py-4">
            <div
              className="rounded-full transition-all"
              style={{
                width: `${drawingStrokeWidth}px`,
                height: `${drawingStrokeWidth}px`,
                backgroundColor: drawingColor,
                opacity: drawingOpacity,
              }}
            />
          </div>
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-white/70 text-xs font-medium">OPACITY</label>
            <span className="text-white text-sm">{Math.round(drawingOpacity * 100)}%</span>
          </div>
          <Slider
            value={[drawingOpacity]}
            onValueChange={(v) => setDrawingOpacity(v[0])}
            min={0.1}
            max={1}
            step={0.05}
            className="w-full"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={undoDrawing}
            variant="outline"
            size="icon"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleClearAll}
            variant="outline"
            size="icon"
            className="border-white/20 text-white hover:bg-red-500/20"
            title="Clear all drawings"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleClose}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Done Drawing
          </Button>
        </div>
      </div>
    </div>
  );
}
