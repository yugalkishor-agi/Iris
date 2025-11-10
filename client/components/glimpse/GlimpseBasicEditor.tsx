import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer } from 'react-konva';
import { X, Type, Music, Wand2, Smile, Download, ChevronUp, Save, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import Konva from 'konva';
import { MusicSelector } from './MusicSelector';
import { AudiusTrack } from '@/services/audius.service';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fill: string;
  backgroundColor: string;
  borderRadius: number;
  padding: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

interface GlimpseBasicEditorProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  onSave: (editedBlob: Blob) => void;
  onAdvancedEditor: () => void;
  onBack: () => void;
}

const FILTERS = [
  { name: 'Original', css: 'none' },
  { name: 'Vintage', css: 'sepia(0.5) contrast(1.2)' },
  { name: 'B&W', css: 'grayscale(1)' },
  { name: 'Vibrant', css: 'saturate(1.5) contrast(1.1)' },
  { name: 'Cool', css: 'hue-rotate(180deg)' },
  { name: 'Warm', css: 'hue-rotate(-30deg) saturate(1.2)' },
];

const COLORS = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

const EMOJIS = ['😀', '😂', '❤️', '🔥', '✨', '🎉', '👍', '💯', '🌟', '💕'];

export function GlimpseBasicEditor({ mediaUrl, mediaType, onSave, onAdvancedEditor, onBack }: GlimpseBasicEditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 375, height: 667, x: 0, y: 0 });
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<'text' | 'music' | 'filter' | 'sticker' | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textBgColor, setTextBgColor] = useState('rgba(0, 0, 0, 0.7)');
  const [currentFilter, setCurrentFilter] = useState(0);
  const [selectedMusic, setSelectedMusic] = useState<AudiusTrack | null>(null);
  const [showMusicSelector, setShowMusicSelector] = useState(false);

  useEffect(() => {
    if (mediaType === 'video') {
      // For video, create a video element to capture first frame
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = mediaUrl;
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        video.currentTime = 0.1;
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          
          const img = new window.Image();
          img.src = canvas.toDataURL();
          img.onload = () => {
            setImage(img);
            calculateDimensions(img.width, img.height);
          };
        }
      };
    } else {
      // For image
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = mediaUrl;
      img.onload = () => {
        setImage(img);
        calculateDimensions(img.width, img.height);
      };
    }
  }, [mediaUrl, mediaType]);

  const calculateDimensions = (width: number, height: number) => {
    const canvasWidth = 375;
    const canvasHeight = 667;
    const imgRatio = width / height;
    const canvasRatio = canvasWidth / canvasHeight;
    
    let newWidth, newHeight, x, y;
    
    if (imgRatio > canvasRatio) {
      // Media is wider
      newWidth = canvasWidth;
      newHeight = canvasWidth / imgRatio;
      x = 0;
      y = (canvasHeight - newHeight) / 2;
    } else {
      // Media is taller
      newHeight = canvasHeight;
      newWidth = canvasHeight * imgRatio;
      x = (canvasWidth - newWidth) / 2;
      y = 0;
    }
    
    setImageDimensions({ width: newWidth, height: newHeight, x, y });
  };

  useEffect(() => {
    if (!transformerRef.current || !selectedId) return;
    const stage = stageRef.current;
    if (!stage) return;
    
    const node = stage.findOne(`#${selectedId}`);
    if (node) {
      transformerRef.current.nodes([node]);
    }
  }, [selectedId]);

  const addText = () => {
    if (!textInput.trim()) return;
    
    const newText: TextElement = {
      id: `text-${Date.now()}`,
      text: textInput,
      x: 187.5,
      y: 300,
      fontSize: 40,
      fill: textColor,
      backgroundColor: textBgColor,
      borderRadius: 20,
      padding: 15,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    };
    
    setTextElements([...textElements, newText]);
    setTextInput('');
    setActiveTool(null);
  };

  const addEmoji = (emoji: string) => {
    const newText: TextElement = {
      id: `emoji-${Date.now()}`,
      text: emoji,
      x: 187.5,
      y: 300,
      fontSize: 60,
      fill: '#FFFFFF',
      backgroundColor: 'transparent',
      borderRadius: 0,
      padding: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    };
    
    setTextElements([...textElements, newText]);
  };

  const handleMusicSelect = (track: AudiusTrack) => {
    setSelectedMusic(track);
    setShowMusicSelector(false);
    setActiveTool(null);
  };

  const handleDragEnd = (id: string, e: any) => {
    const node = e.target;
    setTextElements(
      textElements.map((el) =>
        el.id === id
          ? {
              ...el,
              x: node.x(),
              y: node.y(),
              rotation: node.rotation(),
              scaleX: node.scaleX(),
              scaleY: node.scaleY(),
            }
          : el
      )
    );
  };

  const exportCanvas = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!stageRef.current) {
        reject(new Error('Stage not ready'));
        return;
      }

      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
      fetch(uri)
        .then(res => res.blob())
        .then(blob => resolve(blob))
        .catch(reject);
    });
  };

  const handleDownload = async () => {
    try {
      const blob = await exportCanvas();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glimpse-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleSave = async () => {
    try {
      const blob = await exportCanvas();
      onSave(blob);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <X className="h-6 w-6 text-white" />
        </Button>
        <h1 className="text-white font-semibold">Edit Glimpse</h1>
        <Button variant="ghost" size="icon" onClick={handleSave}>
          <Save className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center bg-black p-4">
        <div className="relative w-[375px] h-[667px] bg-black rounded-lg overflow-hidden shadow-2xl">
          <Stage
            ref={stageRef}
            width={375}
            height={667}
            onClick={(e) => {
              const clickedOnEmpty = e.target === e.target.getStage();
              if (clickedOnEmpty) {
                setSelectedId(null);
              }
            }}
            style={{ filter: FILTERS[currentFilter].css, backgroundColor: '#000000' }}
          >
            <Layer>
              {image && (
                <KonvaImage
                  image={image}
                  x={imageDimensions.x}
                  y={imageDimensions.y}
                  width={imageDimensions.width}
                  height={imageDimensions.height}
                />
              )}
              
              {textElements.map((textEl) => (
                <KonvaText
                  key={textEl.id}
                  id={textEl.id}
                  text={textEl.text}
                  x={textEl.x}
                  y={textEl.y}
                  fontSize={textEl.fontSize}
                  fill={textEl.fill}
                  padding={textEl.padding}
                  rotation={textEl.rotation}
                  scaleX={textEl.scaleX}
                  scaleY={textEl.scaleY}
                  draggable
                  onClick={() => setSelectedId(textEl.id)}
                  onTap={() => setSelectedId(textEl.id)}
                  onDragEnd={(e) => handleDragEnd(textEl.id, e)}
                />
              ))}
              
              {selectedId && <Transformer ref={transformerRef} />}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Bottom Tools */}
      <div className="bg-black/90 backdrop-blur border-t border-white/10">
        {/* Main Tools */}
        {!activeTool && (
          <div className="flex items-center justify-around p-4">
            <button onClick={() => setActiveTool('text')} className="flex flex-col items-center gap-1">
              <Type className="h-6 w-6 text-white" />
              <span className="text-xs text-white">Text</span>
            </button>
            <button onClick={() => setShowMusicSelector(true)} className="flex flex-col items-center gap-1">
              <Music className="h-6 w-6 text-white" />
              <span className="text-xs text-white">Music</span>
              {selectedMusic && <div className="w-2 h-2 rounded-full bg-primary" />}
            </button>
            <button onClick={() => setActiveTool('filter')} className="flex flex-col items-center gap-1">
              <Wand2 className="h-6 w-6 text-white" />
              <span className="text-xs text-white">Filters</span>
            </button>
            <button onClick={() => setActiveTool('sticker')} className="flex flex-col items-center gap-1">
              <Smile className="h-6 w-6 text-white" />
              <span className="text-xs text-white">Stickers</span>
            </button>
            <button onClick={handleDownload} className="flex flex-col items-center gap-1">
              <Download className="h-6 w-6 text-white" />
              <span className="text-xs text-white">Download</span>
            </button>
          </div>
        )}

        {/* Text Tool */}
        {activeTool === 'text' && (
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text..."
                className="flex-1 bg-white/10 border-white/20 text-white"
              />
              <Button onClick={addText}>Add</Button>
            </div>
            <div className="flex gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setTextColor(color)}
                  className="w-8 h-8 rounded-full border-2"
                  style={{ backgroundColor: color, borderColor: textColor === color ? '#fff' : 'transparent' }}
                />
              ))}
            </div>
            <Button variant="ghost" onClick={() => setActiveTool(null)} className="w-full">
              Close
            </Button>
          </div>
        )}

        {/* Filter Tool */}
        {activeTool === 'filter' && (
          <div className="p-4">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {FILTERS.map((filter, index) => (
                <button
                  key={filter.name}
                  onClick={() => setCurrentFilter(index)}
                  className={`flex-shrink-0 text-center ${currentFilter === index ? 'text-primary' : 'text-white/60'}`}
                >
                  <div className="w-16 h-16 rounded-lg mb-1" style={{ filter: filter.css, background: '#666' }} />
                  <span className="text-xs">{filter.name}</span>
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setActiveTool(null)} className="w-full mt-2">
              Close
            </Button>
          </div>
        )}

        {/* Sticker Tool */}
        {activeTool === 'sticker' && (
          <div className="p-4">
            <div className="grid grid-cols-5 gap-3">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="text-4xl hover:scale-110 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setActiveTool(null)} className="w-full mt-4">
              Close
            </Button>
          </div>
        )}

        {/* Advanced Editor Button */}
        <Button
          onClick={onAdvancedEditor}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
        >
          <Settings className="h-5 w-5 mr-2" />
          Open Advanced Editor
        </Button>
      </div>

      {/* Music Selector Modal */}
      {showMusicSelector && (
        <MusicSelector
          onSelect={handleMusicSelect}
          onClose={() => setShowMusicSelector(false)}
          selectedTrack={selectedMusic}
        />
      )}
    </div>
  );
}
