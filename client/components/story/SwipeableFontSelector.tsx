import { useState, useRef, useEffect } from 'react';
import { FONTS } from './EditorTypes';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeableFontSelectorProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
}

export function SwipeableFontSelector({ selectedFont, onFontChange }: SwipeableFontSelectorProps) {
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
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative bg-black/40 backdrop-blur-xl rounded-full px-3 py-2">
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
        className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {FONTS.map((font) => (
          <button
            key={font.name}
            onClick={() => onFontChange(font.value)}
            className={`snap-center whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedFont === font.value
                ? 'bg-primary text-white scale-110'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
            style={{ fontFamily: font.value }}
          >
            {font.name}
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
  );
}
