import { useState } from 'react';
import { TEXT_COLORS, TEXT_GRADIENTS } from './EditorTypes';
import { Palette, Sparkles } from 'lucide-react';

interface AdvancedColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  showGradients?: boolean;
}

export function AdvancedColorPicker({ selectedColor, onColorChange, showGradients = true }: AdvancedColorPickerProps) {
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'solid' | 'gradient'>('solid');

  // Rainbow spectrum colors (full HSL range)
  const rainbowColors = [
    '#FF0000', '#FF3300', '#FF6600', '#FF9900', '#FFCC00', '#FFFF00',
    '#CCFF00', '#99FF00', '#66FF00', '#33FF00', '#00FF00', '#00FF33',
    '#00FF66', '#00FF99', '#00FFCC', '#00FFFF', '#00CCFF', '#0099FF',
    '#0066FF', '#0033FF', '#0000FF', '#3300FF', '#6600FF', '#9900FF',
    '#CC00FF', '#FF00FF', '#FF00CC', '#FF0099', '#FF0066', '#FF0033'
  ];

  // Grayscale colors
  const grayscaleColors = [
    '#FFFFFF', '#F0F0F0', '#E0E0E0', '#D0D0D0', '#C0C0C0', '#B0B0B0',
    '#A0A0A0', '#909090', '#808080', '#707070', '#606060', '#505050',
    '#404040', '#303030', '#202020', '#101010', '#000000'
  ];

  return (
    <div className="space-y-3">
      {/* Quick color palette */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-white text-sm font-medium flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Quick Colors
          </label>
          <button
            onClick={() => setShowFullPicker(!showFullPicker)}
            className="text-xs text-primary hover:text-primary/80"
          >
            {showFullPicker ? 'Less' : 'More'}
          </button>
        </div>
        
        <div className="grid grid-cols-5 gap-2">
          {TEXT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-full aspect-square rounded-xl border-2 transition-all hover:scale-110 ${
                selectedColor === color ? 'border-white scale-110 ring-2 ring-primary' : 'border-white/30'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Full color picker */}
      {showFullPicker && (
        <div className="animate-slide-up space-y-3">
          {showGradients && (
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setActiveTab('solid')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'solid' ? 'bg-primary text-white' : 'bg-white/10 text-white/70'
                }`}
              >
                Solid
              </button>
              <button
                onClick={() => setActiveTab('gradient')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'gradient' ? 'bg-primary text-white' : 'bg-white/10 text-white/70'
                }`}
              >
                <Sparkles className="h-3 w-3 inline mr-1" />
                Gradient
              </button>
            </div>
          )}

          {activeTab === 'solid' && (
            <>
              {/* Rainbow spectrum */}
              <div>
                <label className="text-white text-xs font-medium mb-2 block">Rainbow Spectrum</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {rainbowColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => onColorChange(color)}
                      className={`aspect-square rounded-lg border transition-all hover:scale-110 ${
                        selectedColor === color ? 'border-white scale-110 ring-2 ring-primary' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Grayscale */}
              <div>
                <label className="text-white text-xs font-medium mb-2 block">Grayscale</label>
                <div className="grid grid-cols-9 gap-1.5">
                  {grayscaleColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => onColorChange(color)}
                      className={`aspect-square rounded-lg border transition-all hover:scale-110 ${
                        selectedColor === color ? 'border-primary scale-110 ring-2 ring-primary' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'gradient' && showGradients && (
            <div>
              <label className="text-white text-xs font-medium mb-2 block">Gradient Effects</label>
              <div className="grid grid-cols-2 gap-2">
                {TEXT_GRADIENTS.map((gradient) => (
                  <button
                    key={gradient.name}
                    onClick={() => onColorChange(gradient.value)}
                    className={`h-12 rounded-xl border-2 transition-all hover:scale-105 ${
                      selectedColor === gradient.value ? 'border-white scale-105 ring-2 ring-primary' : 'border-white/30'
                    }`}
                    style={{ background: gradient.value }}
                  >
                    <span className="text-white text-xs font-bold drop-shadow-lg">{gradient.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
