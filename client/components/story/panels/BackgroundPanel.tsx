import { useState, useEffect } from 'react';
import { useStoryEditorStore } from '@/stores/storyEditorStore';
import { HexColorPicker } from 'react-colorful';
import { Image as ImageIcon, Palette, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GRADIENT_PRESETS = [
  { name: 'Sunset', colors: ['#ff6b6b', '#feca57'] },
  { name: 'Ocean', colors: ['#4facfe', '#00f2fe'] },
  { name: 'Purple', colors: ['#667eea', '#764ba2'] },
  { name: 'Pink', colors: ['#f093fb', '#f5576c'] },
  { name: 'Green', colors: ['#43e97b', '#38f9d7'] },
  { name: 'Fire', colors: ['#fa709a', '#fee140'] },
  { name: 'Sky', colors: ['#a8edea', '#fed6e3'] },
  { name: 'Night', colors: ['#2c3e50', '#3498db'] },
];

const SOLID_COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff6b6b', '#4ecdc4',
  '#667eea', '#f093fb', '#43e97b', '#feca57', '#fa709a',
];

export function BackgroundPanel() {
  const [mode, setMode] = useState<'solid' | 'gradient'>('solid');
  const [customColor, setCustomColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const { setBackground, setActiveTool, background } = useStoryEditorStore();

  const handleSolidColor = (color: string) => {
    setBackground({
      type: 'color',
      color,
      filterIntensity: 0.5,
    });
  };

  const handleGradient = (gradient: typeof GRADIENT_PRESETS[0]) => {
    setBackground({
      type: 'gradient',
      gradient: {
        type: 'linear',
        colors: gradient.colors,
        angle: 180,
      },
      filterIntensity: 0.5,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setBackground({
          type: 'image',
          imageUrl,
          filterIntensity: 0.5,
        });
        setActiveTool('none');
      };
      reader.readAsDataURL(file);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTool('none');
      } else if (e.key === '1') {
        setMode('solid');
      } else if (e.key === '2') {
        setMode('gradient');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool]);

  return (
    <div className="absolute inset-x-0 bottom-24 max-w-md mx-auto p-4 bg-black/90 backdrop-blur-xl rounded-t-3xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-400" />
            <h3 className="text-white font-semibold">Background</h3>
          </div>
          <Button
            onClick={() => setActiveTool('none')}
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white"
          >
            Done
          </Button>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('solid')}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all
              ${mode === 'solid'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
              }
            `}
          >
            <Palette className="h-4 w-4" />
            Solid
          </button>
          <button
            onClick={() => setMode('gradient')}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all
              ${mode === 'gradient'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
              }
            `}
          >
            <Sparkles className="h-4 w-4" />
            Gradient
          </button>
          <label
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all bg-white/10 text-white/70 hover:bg-white/20 cursor-pointer"
          >
            <ImageIcon className="h-4 w-4" />
            Image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Solid Colors */}
        {mode === 'solid' && (
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2">
              {SOLID_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleSolidColor(color)}
                  className={`
                    aspect-square rounded-xl border-2 transition-all hover:scale-110
                    ${background.type === 'color' && background.color === color
                      ? 'border-white scale-110'
                      : 'border-white/20'
                    }
                  `}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Custom Color Picker */}
            <div className="space-y-2">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-between"
              >
                <span className="text-white text-sm font-medium">Custom Color</span>
                <div
                  className="w-8 h-8 rounded-lg border border-white/20"
                  style={{ backgroundColor: customColor }}
                />
              </button>
              {showColorPicker && (
                <div className="space-y-2">
                  <HexColorPicker color={customColor} onChange={setCustomColor} />
                  <Button
                    onClick={() => {
                      handleSolidColor(customColor);
                      setShowColorPicker(false);
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Apply Custom Color
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gradients */}
        {mode === 'gradient' && (
          <div className="grid grid-cols-2 gap-3">
            {GRADIENT_PRESETS.map((gradient) => (
              <button
                key={gradient.name}
                onClick={() => handleGradient(gradient)}
                className={`
                  relative aspect-video rounded-2xl overflow-hidden transition-all hover:scale-105
                  ${background.type === 'gradient' &&
                    JSON.stringify(background.gradient?.colors) === JSON.stringify(gradient.colors)
                    ? 'ring-2 ring-white scale-105'
                    : ''
                  }
                `}
                style={{
                  background: `linear-gradient(135deg, ${gradient.colors.join(', ')})`,
                }}
              >
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs font-medium text-center">
                    {gradient.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Current Background Preview */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <p className="text-white/50 text-xs mb-2">Current Background</p>
          <div
            className="w-full h-24 rounded-xl"
            style={{
              backgroundColor: background.type === 'color' ? background.color : undefined,
              background:
                background.type === 'gradient'
                  ? `linear-gradient(135deg, ${background.gradient?.colors.join(', ')})`
                  : undefined,
              backgroundImage:
                background.type === 'image' ? `url(${background.imageUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>
      </div>
    </div>
  );
}
