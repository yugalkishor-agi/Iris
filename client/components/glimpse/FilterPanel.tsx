import { RefObject, useState, useEffect } from 'react';
import { X, Palette, RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useGlimpseEditorStore } from '@/stores/glimpseEditorStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import './editor-scrollbar.css';

interface FilterPanelProps {
  videoRef: RefObject<HTMLVideoElement>;
}

const presetFilters = [
  { 
    name: 'None', 
    brightness: 100, 
    contrast: 100, 
    saturation: 100,
    exposure: 0,
    temperature: 0,
    sharpness: 0,
    blur: 0,
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%23333"/><text x="30" y="30" font-family="Arial" font-size="8" fill="white" text-anchor="middle" dominant-baseline="middle">Original</text></svg>'
  },
  { 
    name: 'Vintage', 
    brightness: 95, 
    contrast: 110, 
    saturation: 80,
    exposure: -5,
    temperature: 10,
    sharpness: 20,
    blur: 0.5,
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%23a17c5b"/><text x="30" y="30" font-family="Arial" font-size="8" fill="white" text-anchor="middle" dominant-baseline="middle">Vintage</text></svg>'
  },
  { 
    name: 'Cool', 
    brightness: 100, 
    contrast: 105, 
    saturation: 110,
    exposure: 0,
    temperature: -15,
    sharpness: 10,
    blur: 0,
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%234a6b8a"/><text x="30" y="30" font-family="Arial" font-size="8" fill="white" text-anchor="middle" dominant-baseline="middle">Cool</text></svg>'
  },
  { 
    name: 'Warm', 
    brightness: 105, 
    contrast: 100, 
    saturation: 105,
    exposure: 5,
    temperature: 15,
    sharpness: 5,
    blur: 0,
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%23c17a54"/><text x="30" y="30" font-family="Arial" font-size="8" fill="white" text-anchor="middle" dominant-baseline="middle">Warm</text></svg>'
  },
  { 
    name: 'B&W', 
    brightness: 100, 
    contrast: 110, 
    saturation: 0,
    exposure: 0,
    temperature: 0,
    sharpness: 15,
    blur: 0,
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%23333"/><text x="30" y="30" font-family="Arial" font-size="8" fill="white" text-anchor="middle" dominant-baseline="middle">B&amp;W</text></svg>'
  },
  { 
    name: 'Vivid', 
    brightness: 105, 
    contrast: 120, 
    saturation: 130,
    exposure: 10,
    temperature: 5,
    sharpness: 25,
    blur: 0,
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%23673ab7"/><text x="30" y="30" font-family="Arial" font-size="8" fill="white" text-anchor="middle" dominant-baseline="middle">Vivid</text></svg>'
  },
  { 
    name: 'Soft', 
    brightness: 110, 
    contrast: 90, 
    saturation: 95,
    exposure: 5,
    temperature: 0,
    sharpness: 0,
    blur: 2,
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%23b39ddb"/><text x="30" y="30" font-family="Arial" font-size="8" fill="white" text-anchor="middle" dominant-baseline="middle">Soft</text></svg>'
  },
  { 
    name: 'Dramatic', 
    brightness: 90, 
    contrast: 130, 
    saturation: 100,
    exposure: -10,
    temperature: -5,
    sharpness: 30,
    blur: 0,
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%23263238"/><text x="30" y="30" font-family="Arial" font-size="8" fill="white" text-anchor="middle" dominant-baseline="middle">Dramatic</text></svg>'
  },
];

export function FilterPanel({ videoRef }: FilterPanelProps) {
  const { currentFilter, updateFilter, resetFilter, setActiveTool } = useGlimpseEditorStore();
  const [activePreset, setActivePreset] = useState<string>('None');
  const [sliderAnimating, setSliderAnimating] = useState<string | null>(null);

  const applyPreset = (preset: typeof presetFilters[0]) => {
    setActivePreset(preset.name);
    updateFilter({
      brightness: preset.brightness,
      contrast: preset.contrast,
      saturation: preset.saturation,
      exposure: preset.exposure,
      temperature: preset.temperature,
      sharpness: preset.sharpness,
      blur: preset.blur,
    });
  };
  
  // Animate slider when value changes
  const animateSlider = (name: string) => {
    setSliderAnimating(name);
    setTimeout(() => setSliderAnimating(null), 500);
  };
  
  // Reset active preset when manual adjustments are made
  useEffect(() => {
    const isPreset = presetFilters.some(preset => 
      preset.brightness === currentFilter.brightness &&
      preset.contrast === currentFilter.contrast &&
      preset.saturation === currentFilter.saturation &&
      preset.exposure === currentFilter.exposure &&
      preset.temperature === currentFilter.temperature &&
      preset.sharpness === currentFilter.sharpness &&
      preset.blur === currentFilter.blur
    );
    
    if (!isPreset && activePreset !== 'Custom') {
      setActivePreset('Custom');
    }
  }, [currentFilter]);

  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-black via-gray-900 to-transparent z-40 p-6 max-h-[80vh] overflow-y-auto glimpse-scrollbar glimpse-scrollbar-vertical glimpse-smooth-scroll">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Palette className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-white text-lg font-semibold">Filters & Color</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={resetFilter}>
              <RotateCcw className="h-5 w-5 text-white" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setActiveTool('none')}>
              <X className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>

        {/* Preset Filters */}
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3">Presets</h4>
          <div className="grid grid-cols-4 gap-3">
            {presetFilters.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`
                  aspect-square rounded-lg transition-all duration-200 
                  ${activePreset === preset.name 
                    ? 'ring-2 ring-primary shadow-lg shadow-primary/20 scale-105' 
                    : 'bg-white/5 border border-white/10 hover:border-primary/50'}
                  overflow-hidden flex flex-col items-center justify-center
                `}
              >
                <div className="w-full h-3/4 bg-cover bg-center" style={{ backgroundImage: `url(${preset.thumbnail})` }} />
                <span className={`text-xs font-medium mt-1 ${activePreset === preset.name ? 'text-primary' : 'text-white/80'}`}>
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Controls */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <label className="text-white text-sm font-medium">Brightness</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-white/40" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Adjust the overall lightness of the image
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-white/60 text-sm">{currentFilter.brightness}%</span>
            </div>
            <Slider
              value={[currentFilter.brightness]}
              min={0}
              max={200}
              step={1}
              onValueChange={([val]) => {
                updateFilter({ brightness: val });
                animateSlider('brightness');
              }}
              className={`w-full ${sliderAnimating === 'brightness' ? 'animate-pulse-ring' : ''}`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <label className="text-white text-sm font-medium">Contrast</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-white/40" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Adjust the difference between dark and light areas
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-white/60 text-sm">{currentFilter.contrast}%</span>
            </div>
            <Slider
              value={[currentFilter.contrast]}
              min={0}
              max={200}
              step={1}
              onValueChange={([val]) => {
                updateFilter({ contrast: val });
                animateSlider('contrast');
              }}
              className={`w-full ${sliderAnimating === 'contrast' ? 'animate-pulse-ring' : ''}`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <label className="text-white text-sm font-medium">Saturation</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-white/40" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Adjust the intensity of colors
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-white/60 text-sm">{currentFilter.saturation}%</span>
            </div>
            <Slider
              value={[currentFilter.saturation]}
              min={0}
              max={200}
              step={1}
              onValueChange={([val]) => {
                updateFilter({ saturation: val });
                animateSlider('saturation');
              }}
              className={`w-full ${sliderAnimating === 'saturation' ? 'animate-pulse-ring' : ''}`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white text-sm font-medium">Exposure</label>
              <span className="text-white/60 text-sm">{currentFilter.exposure}</span>
            </div>
            <Slider
              value={[currentFilter.exposure]}
              min={-100}
              max={100}
              step={1}
              onValueChange={([val]) => updateFilter({ exposure: val })}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white text-sm font-medium">Temperature</label>
              <span className="text-white/60 text-sm">{currentFilter.temperature}</span>
            </div>
            <Slider
              value={[currentFilter.temperature]}
              min={-100}
              max={100}
              step={1}
              onValueChange={([val]) => updateFilter({ temperature: val })}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white text-sm font-medium">Sharpness</label>
              <span className="text-white/60 text-sm">{currentFilter.sharpness}</span>
            </div>
            <Slider
              value={[currentFilter.sharpness]}
              min={0}
              max={100}
              step={1}
              onValueChange={([val]) => updateFilter({ sharpness: val })}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white text-sm font-medium">Blur</label>
              <span className="text-white/60 text-sm">{currentFilter.blur}px</span>
            </div>
            <Slider
              value={[currentFilter.blur]}
              min={0}
              max={20}
              step={0.5}
              onValueChange={([val]) => updateFilter({ blur: val })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
