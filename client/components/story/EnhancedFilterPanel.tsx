import { useState, useRef, useEffect } from 'react';
import { FILTERS } from './EditorTypes';
import { Slider } from '@/components/ui/slider';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EnhancedFilterPanelProps {
  selectedFilter: string;
  filterIntensity: number;
  imageUrl: string;
  onFilterChange: (filterId: string) => void;
  onIntensityChange: (intensity: number) => void;
}

export function EnhancedFilterPanel({
  selectedFilter,
  filterIntensity,
  imageUrl,
  onFilterChange,
  onIntensityChange
}: EnhancedFilterPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -100 : 100,
        behavior: 'smooth'
      });
    }
  };

  // Quick intensity presets
  const intensityPresets = [
    { label: '25%', value: 25 },
    { label: '50%', value: 50 },
    { label: '75%', value: 75 },
    { label: '100%', value: 100 }
  ];

  return (
    <div className="space-y-4">
      {/* Filter carousel with thumbnails */}
      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 rounded-full p-1"
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className="flex-shrink-0 relative group"
            >
              <div
                className={`w-16 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  selectedFilter === filter.id
                    ? 'border-primary scale-110 shadow-lg shadow-primary/50'
                    : 'border-white/30 hover:border-white/50'
                }`}
              >
                <img
                  src={imageUrl}
                  alt={filter.name}
                  className="w-full h-full object-cover"
                  style={{
                    filter: getFilterPreview(filter.id)
                  }}
                />
              </div>
              <p className={`text-xs text-center mt-1 transition-all ${
                selectedFilter === filter.id ? 'text-primary font-bold' : 'text-white/70'
              }`}>
                {filter.name}
              </p>
              {selectedFilter === filter.id && (
                <div className="absolute -top-1 -right-1 bg-primary rounded-full w-5 h-5 flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 rounded-full p-1"
          >
            <ChevronRight className="h-4 w-4 text-white" />
          </button>
        )}
      </div>

      {/* Intensity slider */}
      {selectedFilter !== 'none' && (
        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <label className="text-white text-sm font-medium">
              Intensity: {filterIntensity}%
            </label>
            <div className="flex gap-1">
              {intensityPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => onIntensityChange(preset.value)}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    filterIntensity === preset.value
                      ? 'bg-primary text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          
          <Slider
            value={[filterIntensity]}
            onValueChange={([val]) => onIntensityChange(val)}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      )}

      {/* Filter category info */}
      {selectedFilter !== 'none' && (
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <p className="text-white/60 text-xs">
            Category: <span className="text-white font-medium capitalize">
              {FILTERS.find(f => f.id === selectedFilter)?.category || 'Basic'}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function for filter preview
function getFilterPreview(filterId: string): string {
  const intensity = 0.7; // 70% for preview
  const i = intensity;
  
  switch (filterId) {
    case 'vintage': return `sepia(${40 * i}%) contrast(${110 * i}%)`;
    case 'bright': return `brightness(${105 + (15 * i)}%)`;
    case 'bw': return `grayscale(${100 * i}%)`;
    case 'warm': return `sepia(${20 * i}%) saturate(${120 * i}%)`;
    case 'cool': return `hue-rotate(${-20 * i}deg) saturate(${110 * i}%)`;
    case 'vivid': return `saturate(${150 * i}%)`;
    case 'clarendon': return `contrast(${100 + (20 * i)}%) saturate(${100 + (25 * i)}%)`;
    case 'sepia': return `sepia(${60 * i}%)`;
    case 'noir': return `grayscale(${100 * i}%) contrast(${140 * i}%)`;
    default: return 'none';
  }
}
