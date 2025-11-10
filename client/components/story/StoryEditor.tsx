import { useState, useRef, useEffect } from "react";
import { X, Check, Type, Pencil, Smile, Music, Image as ImageIcon, Wand2, Users, Settings, Trash2, RotateCw, ZoomIn, ZoomOut, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MentionInput } from "./MentionInput";
import { Input } from "@/components/ui/input";
import { DraggableText } from "./DraggableText";
import { PollSticker, PollStickerCreator } from "./PollSticker";
import { QuestionSticker, QuestionStickerCreator } from "./QuestionSticker";
import { SliderSticker, SliderStickerCreator } from "./SliderSticker";
import { EmojiPicker } from "./EmojiPicker";

interface StoryEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string, settings: StorySettings) => void;
  onCancel: () => void;
}

interface StorySettings {
  visibility: 'everyone' | 'followers' | 'close_friends';
  allowReplies: boolean;
  allowSharing: boolean;
}

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  backgroundColor: string;
  font: string;
  rotation: number;
}

interface StickerElement {
  id: string;
  type: 'emoji' | 'poll' | 'question' | 'quiz' | 'slider' | 'countdown';
  content: any;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

type Tool = 'none' | 'text' | 'draw' | 'sticker' | 'filter' | 'settings' | 'poll' | 'question' | 'slider' | 'music';

const FONTS = [
  { name: 'Modern', value: 'Arial, sans-serif' },
  { name: 'Classic', value: 'Georgia, serif' },
  { name: 'Typewriter', value: 'Courier New, monospace' },
  { name: 'Neon', value: 'Impact, sans-serif' },
  { name: 'Strong', value: 'Arial Black, sans-serif' }
];

const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
];

const BG_COLORS = [
  'transparent', '#00000080', '#FFFFFF80', '#FF000080',
  '#0000FF80', '#00FF0080', '#FFFF0080', '#FF00FF80'
];

const FILTERS = [
  { name: 'Normal', id: 'none' },
  { name: 'Vintage', id: 'vintage' },
  { name: 'B&W', id: 'bw' },
  { name: 'Warm', id: 'warm' },
  { name: 'Cool', id: 'cool' },
  { name: 'Vivid', id: 'vivid' }
];

export function StoryEditor({ imageUrl, onSave, onCancel }: StoryEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [currentTool, setCurrentTool] = useState<Tool>('none');
  
  // Text elements
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textBgColor, setTextBgColor] = useState('transparent');
  const [textFont, setTextFont] = useState(FONTS[0].value);
  const [textSize, setTextSize] = useState(48);
  
  // Drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(5);
  const [drawHistory, setDrawHistory] = useState<ImageData[]>([]);
  
  // Stickers
  const [stickers, setStickers] = useState<StickerElement[]>([]);
  
  // Filter
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [filterIntensity, setFilterIntensity] = useState(100);
  
  // Settings
  const [storySettings, setStorySettings] = useState<StorySettings>({
    visibility: 'everyone',
    allowReplies: true,
    allowSharing: true
  });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      renderCanvas();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Render canvas with all elements
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!canvas || !image || !drawCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = image.width;
    canvas.height = image.height;
    drawCanvas.width = image.width;
    drawCanvas.height = image.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image with filter
    if (selectedFilter !== 'none') {
      ctx.filter = getFilterEffect(selectedFilter);
    }
    ctx.drawImage(image, 0, 0);
    ctx.filter = 'none';

    // Draw pen strokes from draw canvas
    const drawCtx = drawCanvas.getContext('2d');
    if (drawCtx) {
      ctx.drawImage(drawCanvas, 0, 0);
    }

    // Draw text elements
    textElements.forEach(element => {
      ctx.save();
      ctx.translate(element.x, element.y);
      ctx.rotate((element.rotation * Math.PI) / 180);
      
      // Background
      if (element.backgroundColor !== 'transparent') {
        ctx.fillStyle = element.backgroundColor;
        const metrics = ctx.measureText(element.text);
        ctx.fillRect(-10, -element.fontSize, metrics.width + 20, element.fontSize + 10);
      }
      
      // Text
      ctx.font = `${element.fontSize}px ${element.font}`;
      ctx.fillStyle = element.color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(element.text, 0, 0);
      
      ctx.restore();
    });
  };

  const getFilterEffect = (filterId: string): string => {
    const i = filterIntensity / 100;
    switch (filterId) {
      case 'vintage': return `sepia(${40 * i}%) contrast(${110 * i}%)`;
      case 'bw': return `grayscale(${100 * i}%)`;
      case 'warm': return `sepia(${20 * i}%) saturate(${120 * i}%)`;
      case 'cool': return `hue-rotate(${-20 * i}deg) saturate(${110 * i}%)`;
      case 'vivid': return `saturate(${150 * i}%) contrast(${110 * i}%)`;
      default: return 'none';
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [image, textElements, selectedFilter, filterIntensity]);

  // Text tool handlers
  const handleAddText = () => {
    if (!currentText.trim()) return;
    
    const newText: TextElement = {
      id: Date.now().toString(),
      text: currentText,
      x: 100,
      y: 100,
      fontSize: textSize,
      color: textColor,
      backgroundColor: textBgColor,
      font: textFont,
      rotation: 0
    };
    
    setTextElements([...textElements, newText]);
    setCurrentText('');
    setIsEditingText(false);
  };

  const handleDeleteText = (id: string) => {
    setTextElements(textElements.filter(t => t.id !== id));
  };

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool !== 'draw') return;
    
    setIsDrawing(true);
    const canvas = drawCanvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!canvas || !rect) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentTool !== 'draw') return;
    
    const canvas = drawCanvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!canvas || !rect) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      renderCanvas();
    }
  };

  // Save handler
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      onSave(url, storySettings);
    }, "image/jpeg", 0.95);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-black/80 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-5 w-5 text-white" />
        </Button>
        <h2 className="text-white font-semibold">Create Moment</h2>
        <Button variant="ghost" size="sm" onClick={handleSave}>
          <Check className="h-5 w-5 text-primary" />
        </Button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="max-h-[70vh] max-w-full"
          />
          <canvas
            ref={drawCanvasRef}
            className="absolute inset-0 max-h-[70vh] max-w-full pointer-events-none"
            style={{ display: currentTool === 'draw' ? 'block' : 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="bg-black/90 backdrop-blur border-t border-white/10">
        {/* Tool Selection */}
        <div className="flex items-center justify-around p-2 border-b border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentTool('text')}
            className={currentTool === 'text' ? 'bg-primary/20 text-primary' : 'text-white'}
          >
            <Type className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentTool('draw')}
            className={currentTool === 'draw' ? 'bg-primary/20 text-primary' : 'text-white'}
          >
            <Pencil className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentTool('sticker')}
            className={currentTool === 'sticker' ? 'bg-primary/20 text-primary' : 'text-white'}
          >
            <Smile className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentTool('filter')}
            className={currentTool === 'filter' ? 'bg-primary/20 text-primary' : 'text-white'}
          >
            <Wand2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentTool('settings')}
            className={currentTool === 'settings' ? 'bg-primary/20 text-primary' : 'text-white'}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Tool Options */}
        <div className="p-4 max-h-48 overflow-y-auto">
          {/* Text Tool */}
          {currentTool === 'text' && (
            <div className="space-y-3">
              <MentionInput
                placeholder="Type your text... (use @ to mention)"
                value={currentText}
                onChange={setCurrentText}
                className="bg-white/10 text-white border-white/20"
              />
              
              <div className="flex gap-2 overflow-x-auto">
                {TEXT_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setTextColor(color)}
                    className={`w-8 h-8 rounded-full border-2 flex-shrink-0 ${
                      textColor === color ? 'border-primary' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              
              <Button onClick={handleAddText} className="w-full bg-primary">
                Add Text
              </Button>
            </div>
          )}

          {/* Draw Tool */}
          {currentTool === 'draw' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white">
                <span className="text-sm">Brush Size:</span>
                <Slider
                  value={[brushSize]}
                  onValueChange={(v) => setBrushSize(v[0])}
                  min={1}
                  max={50}
                  className="flex-1"
                />
                <span className="text-sm w-8">{brushSize}</span>
              </div>
              
              <div className="flex gap-2">
                {TEXT_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setDrawColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      drawColor === color ? 'border-primary' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Filter Tool */}
          {currentTool === 'filter' && (
            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {FILTERS.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                      selectedFilter === filter.id
                        ? 'bg-primary text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tool */}
          {currentTool === 'settings' && (
            <div className="space-y-3 text-white">
              <div>
                <label className="text-sm font-medium mb-2 block">Visibility</label>
                <div className="flex gap-2">
                  {['everyone', 'followers', 'close_friends'].map(option => (
                    <button
                      key={option}
                      onClick={() => setStorySettings({ ...storySettings, visibility: option as any })}
                      className={`px-3 py-1.5 rounded-full text-xs ${
                        storySettings.visibility === option
                          ? 'bg-primary text-white'
                          : 'bg-white/10'
                      }`}
                    >
                      {option.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
