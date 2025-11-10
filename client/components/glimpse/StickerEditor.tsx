import { useState, useEffect } from 'react';
import { X, Sticker, Move, Trash2, Copy, Lock, Unlock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useGlimpseEditorStore, StickerLayer } from '@/stores/glimpseEditorStore';
import { SelectionIndicator } from './SelectionIndicator';
import './editor-animations.css';
import './editor-scrollbar.css';

const stickerCategories = ['Emoji', 'Decorative', 'Animated', 'Seasonal', 'Memes'];

// Sample stickers for demonstration
const sampleStickers = {
  Emoji: [
    { id: 'emoji-1', url: '/stickers/emoji/smile.svg' },
    { id: 'emoji-2', url: '/stickers/emoji/heart.svg' },
    { id: 'emoji-3', url: '/stickers/emoji/thumbs-up.svg' },
  ],
  Decorative: [
    { id: 'dec-1', url: '/stickers/decorative/star.svg' },
    { id: 'dec-2', url: '/stickers/decorative/flower.svg' },
    { id: 'dec-3', url: '/stickers/decorative/crown.svg' },
  ],
  Animated: [
    { id: 'anim-1', url: '/stickers/animated/sparkle.gif' },
    { id: 'anim-2', url: '/stickers/animated/fireworks.gif' },
    { id: 'anim-3', url: '/stickers/animated/confetti.gif' },
  ],
  Seasonal: [
    { id: 'season-1', url: '/stickers/seasonal/snow.svg' },
    { id: 'season-2', url: '/stickers/seasonal/sun.svg' },
    { id: 'season-3', url: '/stickers/seasonal/leaf.svg' },
  ],
  Memes: [
    { id: 'meme-1', url: '/stickers/memes/cool.svg' },
    { id: 'meme-2', url: '/stickers/memes/lol.svg' },
    { id: 'meme-3', url: '/stickers/memes/wow.svg' },
  ],
};

export function StickerEditor() {
  const {
    stickerLayers,
    selectedStickerId,
    addStickerLayer,
    updateStickerLayer,
    deleteStickerLayer,
    setSelectedSticker,
    currentTime,
    duration,
    setActiveTool,
    videoWidth,
    videoHeight,
  } = useGlimpseEditorStore();

  const selectedSticker = stickerLayers.find(s => s.id === selectedStickerId);
  
  const [activeCategory, setActiveCategory] = useState('Emoji');
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (selectedSticker) {
      setScale(selectedSticker.scale);
      setOpacity(selectedSticker.opacity);
      setIsLocked(selectedSticker.locked || false);
    } else {
      setScale(1);
      setOpacity(1);
      setIsLocked(false);
    }
  }, [selectedSticker]);

  const handleAddSticker = (url: string) => {
    const newSticker: StickerLayer = {
      id: `sticker-${Date.now()}`,
      type: url.endsWith('.gif') ? 'gif' : 'sticker',
      url,
      x: videoWidth / 2 - 50,
      y: videoHeight / 2 - 50,
      rotation: 0,
      scale,
      width: 100,
      height: 100,
      startTime: currentTime,
      endTime: currentTime + 5,
      opacity,
      locked: false
    };

    addStickerLayer(newSticker);
    
    // Show animation feedback
    setAnimating(true);
    setTimeout(() => setAnimating(false), 1000);
  };

  const handleUpdateSticker = () => {
    if (!selectedStickerId) return;

    updateStickerLayer(selectedStickerId, {
      scale,
      opacity,
      locked: isLocked
    });
    
    // Show animation feedback
    setAnimating(true);
    setTimeout(() => setAnimating(false), 1000);
  };

  const handleDelete = () => {
    if (selectedStickerId) {
      deleteStickerLayer(selectedStickerId);
      setSelectedSticker(null);
    }
  };
  
  const handleMoveSticker = (id: string, dx: number, dy: number) => {
    if (!selectedSticker || isLocked) return;
    
    const newX = Math.max(0, Math.min(videoWidth - selectedSticker.width, selectedSticker.x + dx));
    const newY = Math.max(0, Math.min(videoHeight - selectedSticker.height, selectedSticker.y + dy));
    
    updateStickerLayer(id, { x: newX, y: newY });
  };
  
  const handleRotateSticker = (id: string, angle: number) => {
    if (!selectedSticker || isLocked) return;
    
    const newRotation = (selectedSticker.rotation + angle) % 360;
    updateStickerLayer(id, { rotation: newRotation });
  };
  
  const handleDuplicateSticker = (id: string) => {
    if (!selectedSticker) return;
    
    const newSticker = {
      ...selectedSticker,
      id: `sticker-${Date.now()}`,
      x: selectedSticker.x + 20,
      y: selectedSticker.y + 20,
    };
    
    addStickerLayer(newSticker);
  };
  
  const handleLockToggle = (id: string, locked: boolean) => {
    if (!selectedSticker) return;
    
    setIsLocked(locked);
    updateStickerLayer(id, { locked });
  };
  
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-black via-gray-900 to-transparent z-40 p-6 max-h-[80vh] overflow-y-auto glimpse-scrollbar glimpse-scrollbar-vertical glimpse-smooth-scroll">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center animate-pulse-ring">
              <Sticker className="h-5 w-5 text-pink-500" />
            </div>
            <h3 className="text-white text-lg font-semibold">Sticker Editor</h3>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={previewMode ? "default" : "outline"} 
                  size="icon" 
                  onClick={togglePreviewMode}
                  className={`${previewMode ? 'bg-primary' : ''}`}
                >
                  <Sparkles className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Preview Mode</TooltipContent>
            </Tooltip>
            <Button variant="ghost" size="icon" onClick={() => setActiveTool('none')}>
              <X className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>

        {/* Sticker Categories */}
        <div className="mb-6 overflow-x-auto glimpse-scrollbar glimpse-scrollbar-horizontal glimpse-smooth-scroll">
          <div className="flex space-x-2 pb-2">
            {stickerCategories.map(category => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'outline'}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap ${activeCategory === category ? 'animate-pulse-ring' : ''}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Sticker Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {sampleStickers[activeCategory as keyof typeof sampleStickers].map(sticker => (
            <div 
              key={sticker.id} 
              className="aspect-square bg-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors hover:scale-105 transform duration-200"
              onClick={() => handleAddSticker(sticker.url)}
            >
              <img 
                src={sticker.url} 
                alt={sticker.id} 
                className="max-w-[80%] max-h-[80%] object-contain" 
              />
            </div>
          ))}
        </div>

        {/* Sticker Controls (only shown when a sticker is selected) */}
        {selectedSticker && (
          <div className="space-y-4 animate-fade-in">
            {/* Scale Control */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-white text-sm">Scale: {Math.round(scale * 100)}%</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setScale(1)}
                    >
                      <span className="text-xs text-white/70">Reset</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Reset to default</TooltipContent>
                </Tooltip>
              </div>
              <Slider
                value={[scale]}
                min={0.2}
                max={3}
                step={0.01}
                onValueChange={([val]) => setScale(val)}
                className={`w-full ${animating ? 'animate-pulse-ring' : ''}`}
              />
            </div>

            {/* Opacity Control */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-white text-sm">Opacity: {Math.round(opacity * 100)}%</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setOpacity(1)}
                    >
                      <span className="text-xs text-white/70">Reset</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Reset to default</TooltipContent>
                </Tooltip>
              </div>
              <Slider
                value={[opacity]}
                min={0.1}
                max={1}
                step={0.01}
                onValueChange={([val]) => setOpacity(val)}
                className={`w-full ${animating ? 'animate-pulse-ring' : ''}`}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleUpdateSticker} 
                className={`flex-1 bg-primary ${animating ? 'animate-bounce-once' : ''}`}
              >
                Update Sticker
              </Button>
              <Button 
                onClick={handleDelete} 
                variant="destructive" 
                className="flex-1 hover:bg-red-600 transition-colors"
              >
                Remove
              </Button>
            </div>
          </div>
        )}
        
        {/* Selection Indicator for selected sticker */}
        {selectedSticker && !previewMode && (
          <SelectionIndicator
            type="sticker"
            id={selectedSticker.id}
            x={selectedSticker.x}
            y={selectedSticker.y}
            width={selectedSticker.width * selectedSticker.scale}
            height={selectedSticker.height * selectedSticker.scale}
            rotation={selectedSticker.rotation}
            isLocked={isLocked}
            onMove={handleMoveSticker}
            onRotate={handleRotateSticker}
            onDelete={handleDelete}
            onDuplicate={handleDuplicateSticker}
            onLockToggle={handleLockToggle}
            onSelect={() => setSelectedSticker(selectedSticker.id)}
          />
        )}
      </div>
    </div>
  );
}