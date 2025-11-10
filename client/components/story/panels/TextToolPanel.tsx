import { useState, useEffect } from 'react';
import { useStoryEditorStore } from '@/stores/storyEditorStore';
import { HexColorPicker } from 'react-colorful';
import { Type, AlignLeft, AlignCenter, AlignRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { MentionInput } from '../MentionInput';

const FONTS = [
  { name: 'Classic', value: 'Arial, sans-serif' },
  { name: 'Elegant', value: 'Georgia, serif' },
  { name: 'Modern', value: 'Helvetica, sans-serif' },
  { name: 'Bold', value: 'Arial Black, sans-serif' },
  { name: 'Mono', value: 'Courier New, monospace' },
  { name: 'Script', value: 'Brush Script MT, cursive' },
  { name: 'Neon', value: 'Impact, sans-serif' },
];

const ANIMATIONS = [
  { id: 'none', label: 'None' },
  { id: 'fade', label: 'Fade' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'slide', label: 'Slide' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'rotate', label: 'Rotate' },
];

export function TextToolPanel() {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#ffffff');
  const [font, setFont] = useState(FONTS[0].value);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center');
  const [animation, setAnimation] = useState('none');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const { addLayer, setActiveTool, selectedLayerId, updateLayer, layers, setSelectedLayer } = useStoryEditorStore();

  const selectedLayer = layers.find(l => l.id === selectedLayerId && l.type === 'text');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && text.trim()) {
        e.preventDefault();
        selectedLayer ? handleUpdateText() : handleAddText();
      } else if (e.key === 'Escape') {
        setActiveTool('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text, selectedLayer]);

  const handleAddText = () => {
    if (!text.trim()) return;

    const layerId = `text-${Date.now()}`;
    
    const newLayer = {
      id: layerId,
      type: 'text' as const,
      content: text,
      x: 540,
      y: 960,
      rotation: 0,
      scale: 1,
      fontSize,
      fontFamily: font,
      fill: color,
      align: 'left' as const,
      animation: animation as any,
      shadowEnabled: false,
      shadowBlur: 0,
      shadowColor: '#000000',
    };

    // Add layer and select it immediately
    addLayer(newLayer);
    setSelectedLayer(layerId);
    
    // Clear input and close panel
    setText('');
    setActiveTool('none');
  };

  const handleUpdateText = () => {
    if (selectedLayer && text.trim()) {
      updateLayer(selectedLayer.id, {
        content: text,
        fontSize,
        fontFamily: font,
        fill: color,
        align,
        animation: animation as any,
      });
      // Close panel after update
      setActiveTool('none');
    }
  };

  return (
    <div className="absolute inset-x-0 top-20 max-w-md mx-auto p-4 bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-top duration-300">
      <div className="space-y-4">
        {/* Text Input */}
        <div className="space-y-2">
          <MentionInput
            value={text}
            onChange={setText}
            placeholder="Add text... (use @ to mention)"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-lg"
          />
        </div>

        {/* Font Selector - Horizontal Scroll */}
        <div className="space-y-2">
          <label className="text-white/70 text-xs font-medium">FONT</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {FONTS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFont(f.value)}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${font === f.value
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }
                `}
                style={{ fontFamily: f.value }}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <label className="text-white/70 text-xs font-medium">COLOR</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-12 h-12 rounded-full border-2 border-white/20 shadow-lg transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1 grid grid-cols-6 gap-2">
              {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border border-white/20 transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {showColorPicker && (
            <div className="mt-2">
              <HexColorPicker color={color} onChange={setColor} />
            </div>
          )}
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-white/70 text-xs font-medium">SIZE</label>
            <span className="text-white text-sm">{fontSize}px</span>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={(v) => setFontSize(v[0])}
            min={20}
            max={120}
            step={2}
            className="w-full"
          />
        </div>

        {/* Alignment */}
        <div className="space-y-2">
          <label className="text-white/70 text-xs font-medium">ALIGN</label>
          <div className="flex gap-2">
            {[
              { value: 'left', icon: AlignLeft },
              { value: 'center', icon: AlignCenter },
              { value: 'right', icon: AlignRight },
            ].map(({ value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setAlign(value as any)}
                className={`
                  flex-1 p-3 rounded-xl transition-all
                  ${align === value
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-white/10 hover:bg-white/20'
                  }
                `}
              >
                <Icon className="h-5 w-5 text-white mx-auto" />
              </button>
            ))}
          </div>
        </div>

        {/* Animation */}
        <div className="space-y-2">
          <label className="text-white/70 text-xs font-medium flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            ANIMATION
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ANIMATIONS.map((anim) => (
              <button
                key={anim.id}
                onClick={() => setAnimation(anim.id)}
                className={`
                  px-3 py-2 rounded-lg text-xs font-medium transition-all
                  ${animation === anim.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }
                `}
              >
                {anim.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => setActiveTool('none')}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={selectedLayer ? handleUpdateText : handleAddText}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={!text.trim()}
          >
            {selectedLayer ? 'Update' : 'Add Text'}
          </Button>
        </div>
      </div>
    </div>
  );
}
