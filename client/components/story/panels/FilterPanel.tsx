import { useState, useRef, useEffect } from 'react';
import { useStoryEditorStore } from '@/stores/storyEditorStore';
import { Wand2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const FILTERS = [
  { id: 'none', name: 'Original', preview: 'grayscale(0%)' },
  { id: 'grayscale', name: 'B&W', preview: 'grayscale(100%)' },
  { id: 'sepia', name: 'Vintage', preview: 'sepia(100%)' },
  { id: 'warm', name: 'Warm', preview: 'sepia(30%) saturate(140%)' },
  { id: 'cold', name: 'Cold', preview: 'hue-rotate(180deg) saturate(120%)' },
  { id: 'brighten', name: 'Bright', preview: 'brightness(130%)' },
  { id: 'contrast', name: 'Contrast', preview: 'contrast(150%)' },
  { id: 'saturate', name: 'Pop', preview: 'saturate(200%)' },
  { id: 'blur', name: 'Soft', preview: 'blur(2px)' },
  { id: 'invert', name: 'Invert', preview: 'invert(100%)' },
];

export function FilterPanel() {
  const [filterIntensity, setFilterIntensity] = useState(100);
  const { currentFilter, setCurrentFilter, setActiveTool, background } = useStoryEditorStore();
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const currentIndex = FILTERS.findIndex(f => f.id === currentFilter);

  const handlePrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : FILTERS.length - 1;
    setCurrentFilter(FILTERS[prevIndex].id);
  };

  const handleNext = () => {
    const nextIndex = currentIndex < FILTERS.length - 1 ? currentIndex + 1 : 0;
    setCurrentFilter(FILTERS[nextIndex].id);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') handleNext();
    else handlePrevious();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrevious();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  return (
    <div className="absolute inset-x-0 top-20 max-w-md mx-auto p-4 bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-top duration-300">
      <div className="space-y-4">
        {/* Current Filter Display */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wand2 className="h-4 w-4 text-purple-400" />
            <h3 className="text-white font-semibold text-lg">
              {FILTERS[currentIndex].name}
            </h3>
          </div>
          <p className="text-white/50 text-xs">Swipe to try different filters</p>
        </div>

        {/* Filter Preview Carousel */}
        <div className="relative">
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>

          <div 
            ref={carouselRef}
            className="overflow-hidden px-8"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex gap-3 transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(calc(-${currentIndex * 96}px - ${currentIndex * 12}px))`,
              }}
            >
              {FILTERS.map((filter, index) => {
                const isActive = index === currentIndex;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setCurrentFilter(filter.id)}
                    className={`
                      flex-shrink-0 relative rounded-2xl overflow-hidden transition-all duration-300
                      ${isActive ? 'w-24 h-32 ring-2 ring-purple-500 scale-110' : 'w-20 h-28 opacity-60'}
                    `}
                  >
                    {background.imageUrl ? (
                      <img
                        src={background.imageUrl}
                        alt={filter.name}
                        className="w-full h-full object-cover"
                        style={{ filter: filter.preview }}
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          filter: filter.preview,
                        }}
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-white text-xs font-medium text-center">
                        {filter.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Filter Intensity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-white/70 text-xs font-medium">INTENSITY</label>
            <span className="text-white text-sm">{filterIntensity}%</span>
          </div>
          <Slider
            value={[filterIntensity]}
            onValueChange={(v) => setFilterIntensity(v[0])}
            min={0}
            max={100}
            step={5}
            className="w-full"
            disabled={currentFilter === 'none'}
          />
        </div>

        {/* Quick Filter Grid */}
        <div className="grid grid-cols-5 gap-2">
          {FILTERS.slice(0, 10).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setCurrentFilter(filter.id)}
              className={`
                relative aspect-square rounded-xl overflow-hidden transition-all
                ${currentFilter === filter.id
                  ? 'ring-2 ring-purple-500 scale-105'
                  : 'hover:scale-105'
                }
              `}
            >
              {background.imageUrl ? (
                <img
                  src={background.imageUrl}
                  alt={filter.name}
                  className="w-full h-full object-cover"
                  style={{ filter: filter.preview }}
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    filter: filter.preview,
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => {
              setCurrentFilter('none');
              setActiveTool('none');
            }}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Remove Filter
          </Button>
          <Button
            onClick={() => setActiveTool('none')}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
