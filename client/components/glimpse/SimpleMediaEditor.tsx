import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  X, Check, Type, Music, Wand2, Smile, Download, 
  RotateCw, Crop, Zap, Volume2, Play, Pause 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimpleMediaEditorProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  onSave: (blob: Blob) => void;
  onBack: () => void;
}

const FILTERS = [
  { name: 'Normal', filter: 'none' },
  { name: 'B&W', filter: 'grayscale(100%)' },
  { name: 'Sepia', filter: 'sepia(100%)' },
  { name: 'Bright', filter: 'brightness(1.3)' },
  { name: 'Contrast', filter: 'contrast(1.5)' },
  { name: 'Vintage', filter: 'sepia(50%) contrast(1.2)' },
];

const EMOJIS = ['😀', '😂', '❤️', '🔥', '✨', '🎉', '👍', '💯', '🌟', '💕', '😍', '🤩', '😎', '🥳', '💪'];

export function SimpleMediaEditor({ mediaUrl, mediaType, onSave, onBack }: SimpleMediaEditorProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [textElements, setTextElements] = useState<Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    size: number;
  }>>([]);
  
  const [activeTool, setActiveTool] = useState<'text' | 'filter' | 'emoji' | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  
  // Video controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);

  useEffect(() => {
    if (mediaType === 'video' && videoRef.current) {
      const video = videoRef.current;
      video.addEventListener('loadedmetadata', () => setDuration(video.duration));
      video.addEventListener('timeupdate', () => setCurrentTime(video.currentTime));
    }
  }, [mediaType]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const addText = () => {
    if (!textInput.trim()) return;
    
    const newText = {
      id: `text-${Date.now()}`,
      text: textInput,
      x: 50,
      y: 50,
      color: textColor,
      size: 32,
    };
    
    setTextElements([...textElements, newText]);
    setTextInput('');
    setActiveTool(null);
  };

  const addEmoji = (emoji: string) => {
    const newText = {
      id: `emoji-${Date.now()}`,
      text: emoji,
      x: 50,
      y: 50,
      color: '#FFFFFF',
      size: 48,
    };
    
    setTextElements([...textElements, newText]);
  };

  const handleSave = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 1080;
      canvas.height = 1920;

      // Draw media
      if (mediaType === 'image' && imageRef.current) {
        ctx.filter = FILTERS[selectedFilter].filter;
        ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
      } else if (mediaType === 'video' && videoRef.current) {
        ctx.filter = FILTERS[selectedFilter].filter;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      }

      // Draw text elements
      ctx.filter = 'none';
      textElements.forEach(el => {
        ctx.font = `bold ${el.size}px Arial`;
        ctx.fillStyle = el.color;
        ctx.textAlign = 'center';
        ctx.fillText(el.text, (el.x / 100) * canvas.width, (el.y / 100) * canvas.height);
      });

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          onSave(blob);
          toast({
            title: 'Saved!',
            description: 'Your glimpse is ready',
          });
        }
      }, mediaType === 'image' ? 'image/jpeg' : 'image/png', 0.95);
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to save',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/90 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <X className="h-6 w-6 text-white" />
        </Button>
        <h1 className="text-white font-semibold">Edit Glimpse</h1>
        <Button onClick={handleSave} className="bg-primary">
          <Check className="h-5 w-5" />
        </Button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {/* Canvas for rendering */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Media Display */}
        <div className="relative w-full max-w-md aspect-[9/16]">
          {mediaType === 'image' ? (
            <img
              ref={imageRef}
              src={mediaUrl}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
              style={{ filter: FILTERS[selectedFilter].filter }}
              crossOrigin="anonymous"
            />
          ) : (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-full object-cover rounded-lg"
              style={{ filter: FILTERS[selectedFilter].filter }}
              playsInline
              loop
            />
          )}

          {/* Text Overlays */}
          {textElements.map((el) => (
            <div
              key={el.id}
              className="absolute cursor-move"
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                transform: 'translate(-50%, -50%)',
                color: el.color,
                fontSize: `${el.size}px`,
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                userSelect: 'none',
              }}
            >
              {el.text}
            </div>
          ))}
        </div>

        {/* Video Controls */}
        {mediaType === 'video' && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-3 bg-black/80 backdrop-blur rounded-full px-4 py-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <div className="flex-1">
                <Slider
                  value={[currentTime]}
                  max={duration}
                  step={0.1}
                  onValueChange={([v]) => {
                    if (videoRef.current) videoRef.current.currentTime = v;
                  }}
                  className="w-full"
                />
              </div>
              <span className="text-white text-xs font-mono">
                {Math.floor(currentTime)}s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tools */}
      <div className="bg-gradient-to-t from-black via-gray-900 to-black border-t border-white/20">
        {!activeTool ? (
          <div className="p-4">
            <div className="grid grid-cols-4 gap-3 mb-4">
              <button
                onClick={() => setActiveTool('text')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
              >
                <Type className="h-6 w-6 text-white" />
                <span className="text-xs text-white">Text</span>
              </button>
              <button
                onClick={() => setActiveTool('filter')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
              >
                <Wand2 className="h-6 w-6 text-white" />
                <span className="text-xs text-white">Filters</span>
              </button>
              <button
                onClick={() => setActiveTool('emoji')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
              >
                <Smile className="h-6 w-6 text-white" />
                <span className="text-xs text-white">Emoji</span>
              </button>
              <button
                onClick={handleSave}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-primary hover:bg-primary/90 active:scale-95 transition-all"
              >
                <Download className="h-6 w-6 text-white" />
                <span className="text-xs text-white">Save</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Text Tool */}
        {activeTool === 'text' && (
          <div className="p-4 space-y-3">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              className="bg-white/10 border-white/20 text-white"
            />
            <div className="flex gap-2">
              {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'].map(color => (
                <button
                  key={color}
                  onClick={() => setTextColor(color)}
                  className={`w-10 h-10 rounded-full border-2 ${textColor === color ? 'border-white' : 'border-white/30'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={addText} className="flex-1 bg-primary">
                Add Text
              </Button>
              <Button onClick={() => setActiveTool(null)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Filter Tool */}
        {activeTool === 'filter' && (
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {FILTERS.map((filter, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedFilter(idx);
                    setActiveTool(null);
                  }}
                  className={`p-3 rounded-lg text-white text-sm font-medium ${
                    selectedFilter === idx ? 'bg-primary' : 'bg-white/10'
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
            <Button onClick={() => setActiveTool(null)} variant="outline" className="w-full">
              Close
            </Button>
          </div>
        )}

        {/* Emoji Tool */}
        {activeTool === 'emoji' && (
          <div className="p-4">
            <div className="grid grid-cols-5 gap-2 mb-3">
              {EMOJIS.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    addEmoji(emoji);
                    setActiveTool(null);
                  }}
                  className="text-3xl p-2 hover:bg-white/10 rounded-lg active:scale-95 transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <Button onClick={() => setActiveTool(null)} variant="outline" className="w-full">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
