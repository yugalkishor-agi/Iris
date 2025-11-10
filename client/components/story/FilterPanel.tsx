import { Slider } from '@/components/ui/slider';
import { FILTERS } from './EditorTypes';
import { getFilterStyle } from './EditorUtils';
import { Check } from 'lucide-react';

interface FilterPanelProps {
  selectedFilter: string;
  filterIntensity: number;
  imageUrl: string;
  onFilterChange: (filterId: string) => void;
  onIntensityChange: (intensity: number) => void;
}

export function FilterPanel({
  selectedFilter,
  filterIntensity,
  imageUrl,
  onFilterChange,
  onIntensityChange
}: FilterPanelProps) {
  return (
    <div className="space-y-4">
      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
        <p className="text-primary text-xs font-medium">📸 20 Professional Filters</p>
      </div>

      {/* Preview Grid */}
      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-3 gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                selectedFilter === filter.id
                  ? 'border-primary ring-2 ring-primary/50 scale-105 shadow-lg shadow-primary/50'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <img
                src={imageUrl}
                alt={filter.name}
                className="w-full h-full object-cover"
                style={{ filter: getFilterStyle(filter.id, 100) }}
              />
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-1.5 ${
                selectedFilter === filter.id ? 'from-primary/90' : ''
              }`}>
                <span className="text-white text-[10px] font-bold block text-center">{filter.name}</span>
              </div>
              {selectedFilter === filter.id && (
                <div className="absolute top-1 right-1 bg-primary rounded-full p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Intensity Slider */}
      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
        <label className="text-white text-sm font-medium mb-2 block flex items-center justify-between">
          <span>Intensity</span>
          <span className="text-primary font-bold">{filterIntensity}%</span>
        </label>
        <Slider
          value={[filterIntensity]}
          onValueChange={([val]) => onIntensityChange(val)}
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-white/50 mt-1">
          <span>Subtle</span>
          <span>Normal</span>
          <span>Strong</span>
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <label className="text-white text-sm font-medium mb-2 block">Quick Presets</label>
        <div className="grid grid-cols-3 gap-2">
          {[25, 50, 100].map((preset) => (
            <button
              key={preset}
              onClick={() => onIntensityChange(preset)}
              className={`py-2 rounded-lg text-xs font-medium transition-all ${
                filterIntensity === preset
                  ? 'bg-primary text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {preset}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
