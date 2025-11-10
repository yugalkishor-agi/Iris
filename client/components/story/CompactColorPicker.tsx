import React from 'react';

interface CompactColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FF69B4', '#32CD32', '#1E90FF', '#FFD700', '#FF1493'
];

export function CompactColorPicker({ selectedColor, onColorChange }: CompactColorPickerProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Color preview */}
      <div 
        className="w-10 h-10 rounded-full border-2 border-white shadow-lg flex-shrink-0"
        style={{ backgroundColor: selectedColor }}
      />
      
      {/* Preset colors - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`w-8 h-8 rounded-full flex-shrink-0 border-2 transition-all ${
              selectedColor === color 
                ? 'border-primary scale-110 shadow-lg' 
                : 'border-white/30 hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      
      {/* Custom color picker */}
      <input
        type="color"
        value={selectedColor}
        onChange={(e) => onColorChange(e.target.value)}
        className="w-10 h-10 rounded-full border-2 border-white cursor-pointer flex-shrink-0"
      />
    </div>
  );
}
