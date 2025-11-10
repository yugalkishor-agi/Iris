import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Maximize2, Scissors, Split, Gauge, Palette, Wand2, Upload, Plus, Type, Pen, Smile, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface SimpleGlimpseEditorProps {
  videoFile: File;
  onDone: (videoBlob: Blob, coverBlob: Blob) => void;
  onBack: () => void;
}

export function SimpleGlimpseEditor({ videoFile, onDone, onBack }: SimpleGlimpseEditorProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [videoUrl, setVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  
  // Text overlays with full layer support
  const [textLayers, setTextLayers] = useState<any[]>([]);
  const [showTextOverlayEditor, setShowTextOverlayEditor] = useState(false);
  
  // Active tool
  const [activeTool, setActiveTool] = useState<'none' | 'text' | 'filter' | 'trim' | 'speed' | 'music' | 'sticker' | 'draw' | 'volume'>('none');
  
  // Trim controls
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  
  // Speed control
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // Music
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicVolume, setMusicVolume] = useState(50);
  const [showMusicLibrary, setShowMusicLibrary] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  
  // Stickers/Emojis
  const [stickers, setStickers] = useState<Array<{
    id: string;
    emoji: string;
    x: number;
    y: number;
    scale: number;
  }>>([]);
  
  // Drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#ffffff');
  const [drawWidth, setDrawWidth] = useState(3);
  const [drawings, setDrawings] = useState<Array<{
    x: number;
    y: number;
    color: string;
    width: number;
  }>>([]);
  
  useEffect(() => {
    // Create blob URL from file
    const url = URL.createObjectURL(videoFile);
    console.log('📹 Created video URL:', url);
    console.log('📄 File details:', {
      name: videoFile.name,
      type: videoFile.type,
      size: videoFile.size
    });
    setVideoUrl(url);
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleLoadedMetadata = () => {
      console.log('✅ Video metadata loaded');
      setDuration(video.duration);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    
    const handleError = (e: Event) => {
      console.error('❌ Video error:', e);
      const videoElement = e.target as HTMLVideoElement;
      if (videoElement.error) {
        console.error('Error code:', videoElement.error.code);
        console.error('Error message:', videoElement.error.message);
      }
    };
    
    const handleCanPlay = () => {
      console.log('✅ Video can play');
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoUrl]);
  
  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    
    try {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        await video.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      toast({
        title: 'Playback Error',
        description: String(error),
        variant: 'destructive',
      });
    }
  };
  
  const handleSeek = (value: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = value;
      setCurrentTime(value);
    }
  };
  
  const handleVolumeChange = (value: number) => {
    const video = videoRef.current;
    if (video) {
      video.volume = value / 100;
      setVolume(value);
    }
  };
  
  const handleDone = async () => {
    try {
      // For now, just return the original file as blob
      const blob = new Blob([videoFile], { type: videoFile.type });
      
      // Generate cover from current frame
      const video = videoRef.current;
      if (!video) throw new Error('No video element');
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot get canvas context');
      
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((coverBlob) => {
        if (coverBlob) {
          onDone(blob, coverBlob);
        } else {
          throw new Error('Failed to create cover image');
        }
      }, 'image/jpeg', 0.95);
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process video',
        variant: 'destructive',
      });
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleTextLayersSave = (layers: any[]) => {
    setTextLayers(layers);
    setShowTextOverlayEditor(false);
    
    toast({
      title: 'Text Layers Updated',
      description: `${layers.length} layer(s) added`,
    });
  };
  
  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
      setPlaybackSpeed(speed);
      toast({
        title: 'Speed Changed',
        description: `${speed}x`,
      });
    }
  };
  
  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMusicFile(file);
      setSelectedTrack(null);
      toast({
        title: 'Music Added',
        description: file.name,
      });
    }
  };
  
  const handleTrackSelect = (track: any) => {
    setSelectedTrack(track);
    setMusicFile(null);
    setShowMusicLibrary(false);
    toast({
      title: 'Track Selected',
      description: `${track.title} - ${track.artist}`,
    });
  };
  
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'draw') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setDrawings([...drawings, { x, y, color: drawColor, width: drawWidth }]);
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== 'draw') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setDrawings([...drawings, { x, y, color: drawColor, width: drawWidth }]);
  };
  
  const stopDrawing = () => {
    setIsDrawing(false);
  };
  
  const clearDrawings = () => {
    setDrawings([]);
    toast({
      title: 'Drawings Cleared',
    });
  };
  
  const addSticker = (emoji: string) => {
    const newSticker = {
      id: Date.now().toString(),
      emoji,
      x: 50,
      y: 50,
      scale: 1,
    };
    
    setStickers([...stickers, newSticker]);
    
    toast({
      title: 'Sticker Added',
      description: 'Tap to reposition',
    });
  };
  
  const applyTrim = () => {
    const video = videoRef.current;
    if (!video) return;
    
    const startTime = (trimStart / 100) * duration;
    const endTime = (trimEnd / 100) * duration;
    
    video.currentTime = startTime;
    
    toast({
      title: 'Trim Applied',
      description: `${formatTime(startTime)} - ${formatTime(endTime)}`,
    });
  };
  
  const applyFilter = (preset: string) => {
    switch(preset) {
      case 'none':
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        break;
      case 'vintage':
        setBrightness(95);
        setContrast(110);
        setSaturation(80);
        break;
      case 'cool':
        setBrightness(100);
        setContrast(105);
        setSaturation(110);
        break;
      case 'warm':
        setBrightness(105);
        setContrast(100);
        setSaturation(105);
        break;
      case 'bw':
        setBrightness(100);
        setContrast(110);
        setSaturation(0);
        break;
    }
    toast({
      title: 'Filter Applied',
      description: preset.toUpperCase(),
    });
  };
  
  const filterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
  };
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header - Minimal */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onBack} className="text-white p-1">
          <X className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <button className="text-white/60 hover:text-white px-3 py-1 text-sm">
            Revert
          </button>
          <button 
            onClick={handleDone}
            className="bg-blue-500 text-white px-4 py-1.5 rounded text-sm font-semibold"
          >
            Next
          </button>
        </div>
      </div>
      
      {/* Video Preview - Full Width */}
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="relative w-full h-full bg-black overflow-hidden">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              style={filterStyle}
              playsInline
              muted={false}
              onClick={togglePlay}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              Loading video...
            </div>
          )}
          
          {/* Drawing Canvas Overlay */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ pointerEvents: activeTool === 'draw' ? 'auto' : 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
          
          {/* Drawing Strokes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {drawings.map((point, i) => {
              if (i === 0) return null;
              const prev = drawings[i - 1];
              return (
                <line
                  key={i}
                  x1={`${prev.x}%`}
                  y1={`${prev.y}%`}
                  x2={`${point.x}%`}
                  y2={`${point.y}%`}
                  stroke={point.color}
                  strokeWidth={point.width}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          
          {/* Stickers */}
          {stickers.map((sticker) => (
            <div
              key={sticker.id}
              className="absolute cursor-move select-none"
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                transform: `translate(-50%, -50%) scale(${sticker.scale})`,
                fontSize: '48px',
                pointerEvents: 'none',
              }}
            >
              {sticker.emoji}
            </div>
          ))}
          
          {/* Text Layer Overlays - Rendering */}
          {textLayers.map((layer) => {
            const fontClass = layer.fontStyle === 'bold' ? 'font-bold' : 
                            layer.fontStyle === 'script' ? 'font-serif italic' :
                            layer.fontStyle === 'typewriter' ? 'font-mono' :
                            layer.fontStyle === 'modern' ? 'font-sans tracking-wider' :
                            layer.fontStyle === 'neon' ? 'font-bold' : 'font-sans';
            
            const textStyle: any = {
              left: `${(layer.x / 320) * 100}%`,
              top: `${(layer.y / 568) * 100}%`,
              color: layer.color,
              transform: `scale(${layer.scale}) rotate(${layer.rotation}deg)`,
              textAlign: layer.align,
            };

            if (layer.bgColor !== 'transparent') {
              textStyle.backgroundColor = layer.bgColor;
              textStyle.padding = '4px 12px';
              textStyle.borderRadius = '6px';
            }

            if (layer.fontStyle === 'neon') {
              textStyle.textShadow = `0 0 10px ${layer.color}, 0 0 20px ${layer.color}`;
            }

            return (
              <div
                key={layer.id}
                className={`absolute text-xl font-semibold pointer-events-none ${fontClass}`}
                style={textStyle}
              >
                {layer.text}
              </div>
            );
          })}
          
          {/* Play/Pause Overlay */}
          {!isPlaying && videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Button
                onClick={togglePlay}
                size="lg"
                className="w-16 h-16 rounded-full bg-white/90 hover:bg-white"
              >
                <Play className="h-8 w-8 text-black ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Section */}
      <div className="bg-black">
        {/* Timeline Scrubber */}
        <div className="px-3 pt-2 pb-3">
          <div className="relative h-14 bg-gray-900/50 rounded overflow-hidden">
            {/* Video Frames Preview */}
            <div className="absolute inset-0 flex">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex-1 border-r border-gray-800/50" />
              ))}
            </div>
            
            {/* Playhead */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full" />
            </div>
            
            {/* Time Display */}
            <div className="absolute bottom-1 left-2 text-white text-[10px] font-mono opacity-60">
              {formatTime(currentTime)}
            </div>
            <div className="absolute bottom-1 right-2 text-white text-[10px] font-mono opacity-60">
              {formatTime(duration)}
            </div>
          </div>
        </div>
      
        {/* Primary Tools */}
        <div className="flex items-center justify-around px-3 py-2 border-t border-white/5">
          {/* Text */}
          <button
            onClick={() => {
              setActiveTool('none');
              setShowTextOverlayEditor(true);
            }}
            className="flex flex-col items-center gap-1.5 relative"
          >
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
              <Type className="h-5 w-5 text-white" />
            </div>
            <span className="text-white text-[10px] font-medium">Text</span>
            {textLayers.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {textLayers.length}
              </span>
            )}
          </button>
          
          {/* Draw */}
          <button
            onClick={() => setActiveTool(activeTool === 'draw' ? 'none' : 'draw')}
            className="flex flex-col items-center gap-1.5"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              activeTool === 'draw' ? 'bg-white' : 'bg-gray-800'
            }`}>
              <Pen className={`h-5 w-5 ${activeTool === 'draw' ? 'text-black' : 'text-white'}`} />
            </div>
            <span className="text-white text-[10px] font-medium">Draw</span>
          </button>
          
          {/* Sticker */}
          <button
            onClick={() => setActiveTool(activeTool === 'sticker' ? 'none' : 'sticker')}
            className="flex flex-col items-center gap-1.5"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              activeTool === 'sticker' ? 'bg-white' : 'bg-gray-800'
            }`}>
              <Smile className={`h-5 w-5 ${activeTool === 'sticker' ? 'text-black' : 'text-white'}`} />
            </div>
            <span className="text-white text-[10px] font-medium">Sticker</span>
          </button>
          
          {/* GIF/More */}
          <button
            onClick={() => setActiveTool(activeTool === 'filter' ? 'none' : 'filter')}
            className="flex flex-col items-center gap-1.5"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              activeTool === 'filter' ? 'bg-white' : 'bg-gray-800'
            }`}>
              <Palette className={`h-5 w-5 ${activeTool === 'filter' ? 'text-black' : 'text-white'}`} />
            </div>
            <span className="text-white text-[10px] font-medium">Filter</span>
          </button>
        </div>
          
        
        {/* Secondary Tools - Compact Row */}
        <div className="flex items-center justify-center gap-6 px-4 py-2 border-t border-white/5">
          {/* Music */}
          <button
            onClick={() => setActiveTool(activeTool === 'music' ? 'none' : 'music')}
            className="flex flex-col items-center gap-1"
          >
            <Music className={`h-5 w-5 ${activeTool === 'music' ? 'text-blue-500' : 'text-white/60'}`} />
            <span className={`text-[10px] ${activeTool === 'music' ? 'text-blue-500' : 'text-white/60'}`}>Music</span>
          </button>
          
          {/* Speed */}
          <button
            onClick={() => setActiveTool(activeTool === 'speed' ? 'none' : 'speed')}
            className="flex flex-col items-center gap-1"
          >
            <Gauge className={`h-5 w-5 ${activeTool === 'speed' ? 'text-blue-500' : 'text-white/60'}`} />
            <span className={`text-[10px] ${activeTool === 'speed' ? 'text-blue-500' : 'text-white/60'}`}>Speed</span>
          </button>
          
          {/* Trim */}
          <button
            onClick={() => setActiveTool(activeTool === 'trim' ? 'none' : 'trim')}
            className="flex flex-col items-center gap-1"
          >
            <Scissors className={`h-5 w-5 ${activeTool === 'trim' ? 'text-blue-500' : 'text-white/60'}`} />
            <span className={`text-[10px] ${activeTool === 'trim' ? 'text-blue-500' : 'text-white/60'}`}>Trim</span>
          </button>
          
          {/* Volume */}
          <button
            onClick={() => setActiveTool(activeTool === 'volume' ? 'none' : 'volume')}
            className="flex flex-col items-center gap-1"
          >
            <svg className={`h-5 w-5 ${activeTool === 'volume' ? 'text-blue-500' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span className={`text-[10px] ${activeTool === 'volume' ? 'text-blue-500' : 'text-white/60'}`}>Volume</span>
          </button>
        </div>
      </div>
      
      {/* Trim Panel - Improved */}
      {activeTool === 'trim' && (
        <div className="bg-gradient-to-b from-gray-900 to-black p-6 border-t border-white/10 space-y-4">
          <h3 className="text-white text-lg font-bold">Trim Video</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-white text-sm">Start</label>
                <span className="text-white/60 text-sm">{formatTime((trimStart / 100) * duration)}</span>
              </div>
              <Slider
                value={[trimStart]}
                min={0}
                max={trimEnd - 1}
                step={1}
                onValueChange={([val]) => setTrimStart(val)}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-white text-sm">End</label>
                <span className="text-white/60 text-sm">{formatTime((trimEnd / 100) * duration)}</span>
              </div>
              <Slider
                value={[trimEnd]}
                min={trimStart + 1}
                max={100}
                step={1}
                onValueChange={([val]) => setTrimEnd(val)}
              />
            </div>
            
            <Button 
              onClick={applyTrim} 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl text-base font-semibold hover:opacity-90 transition-opacity mt-2"
            >
              Apply Trim
            </Button>
          </div>
        </div>
      )}
      
      {/* Speed Control Panel - Improved */}
      {activeTool === 'speed' && (
        <div className="bg-gradient-to-b from-gray-900 to-black p-6 border-t border-white/10 space-y-4">
          <h3 className="text-white text-lg font-bold">Playback Speed</h3>
          <div className="grid grid-cols-4 gap-3">
            <Button 
              variant={playbackSpeed === 0.5 ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handleSpeedChange(0.5)}
            >
              0.5x
            </Button>
            <Button 
              variant={playbackSpeed === 0.75 ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handleSpeedChange(0.75)}
            >
              0.75x
            </Button>
            <Button 
              variant={playbackSpeed === 1 ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handleSpeedChange(1)}
            >
              1x
            </Button>
            <Button 
              variant={playbackSpeed === 1.25 ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handleSpeedChange(1.25)}
            >
              1.25x
            </Button>
            <Button 
              variant={playbackSpeed === 1.5 ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handleSpeedChange(1.5)}
            >
              1.5x
            </Button>
            <Button 
              variant={playbackSpeed === 1.75 ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handleSpeedChange(1.75)}
            >
              1.75x
            </Button>
            <Button 
              variant={playbackSpeed === 2 ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handleSpeedChange(2)}
            >
              2x
            </Button>
          </div>
        </div>
      )}
      
      {/* Music Panel */}
      {activeTool === 'music' && (
        <div className="bg-gray-900 p-4 border-t border-gray-800 space-y-3">
          <div className="border-t border-white/10 pt-4 mt-2" />
          <h3 className="text-white text-base font-bold">Manual Adjust</h3>
          
          {!musicFile && !selectedTrack ? (
            <div className="space-y-2">
              <Button 
                onClick={() => setShowMusicLibrary(true)} 
                className="w-full bg-primary"
              >
                <Music className="h-4 w-4 mr-2" />
                Browse Library
              </Button>
              
              <Button 
                onClick={() => musicInputRef.current?.click()} 
                variant="outline"
                className="w-full"
              >
                <Music className="h-4 w-4 mr-2" />
                Upload from Device
              </Button>
            </div>
          ) : musicFile ? (
            <div className="space-y-3">
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-white text-sm truncate">{musicFile.name}</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-white text-sm">Music Volume</label>
                  <span className="text-white/60 text-sm">{musicVolume}%</span>
                </div>
                <Slider
                  value={[musicVolume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([val]) => setMusicVolume(val)}
                />
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setMusicFile(null)} 
                className="w-full"
              >
                Remove Music
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gray-800 p-3 rounded-lg">
                <p className="text-white text-sm font-medium">{selectedTrack.title}</p>
                <p className="text-white/60 text-xs">{selectedTrack.artist}</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-white text-sm">Music Volume</label>
                  <span className="text-white/60 text-sm">{musicVolume}%</span>
                </div>
                <Slider
                  value={[musicVolume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([val]) => setMusicVolume(val)}
                />
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setSelectedTrack(null)} 
                className="w-full"
              >
                Remove Music
              </Button>
            </div>
          )}
          
          <input
            ref={musicInputRef}
            type="file"
            accept="audio/*"
            onChange={handleMusicUpload}
            className="hidden"
          />
        </div>
      )}
      
      {/* Drawing Tool Panel */}
      {activeTool === 'draw' && (
        <div className="bg-gray-900 p-4 border-t border-gray-800 space-y-3">
          <h3 className="text-white font-semibold mb-2">Draw</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-white text-sm mb-2 block">Color</label>
              <div className="flex gap-2">
                {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setDrawColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      drawColor === color ? 'border-primary scale-110' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-white text-sm">Brush Size</label>
                <span className="text-white/60 text-sm">{drawWidth}px</span>
              </div>
              <Slider
                value={[drawWidth]}
                min={1}
                max={20}
                step={1}
                onValueChange={([val]) => setDrawWidth(val)}
              />
            </div>
            
            <Button onClick={clearDrawings} variant="outline" className="w-full">
              Clear All
            </Button>
          </div>
        </div>
      )}
      
      {/* Sticker Picker Panel */}
      {activeTool === 'sticker' && (
        <div className="bg-gray-900 p-4 border-t border-gray-800 space-y-3">
          <h3 className="text-white font-semibold mb-2">Add Sticker</h3>
          <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
            {['😀', '😂', '😍', '🥰', '😎', '🤩', '😭', '😱', '🔥', '❤️', '✨', '⭐', '🎉', '🎊', '💯', '👍', '👏', '🙌', '💪', '🤝', '✌️', '🤘', '👌', '🤙', '💖', '💕', '💗', '💓', '💝', '🌟', '💫', '⚡', '🌈', '🦄', '🎈', '🎁', '🍕', '🍔', '🍟', '🌮', '🍿', '🎂', '🍰', '🧁', '🍦', '🍩', '🍪', '☕', '🥤', '🎮', '🎯', '🎸', '🎵', '🎶', '🎤', '🎧', '📱', '💻', '⌚', '📷', '🎥', '🚀', '✈️', '🚗', '🏍️', '🚲', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🥊', '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => addSticker(emoji)}
                className="aspect-square rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary transition-all flex items-center justify-center text-3xl active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Filter Presets Panel - Improved */}
      {activeTool === 'filter' && (
        <div className="bg-gradient-to-b from-gray-900 to-black p-6 border-t border-white/10 space-y-4">
          <h3 className="text-white text-lg font-bold">Filters</h3>
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => applyFilter('none')}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-xl font-medium transition-all active:scale-95"
            >
              None
            </button>
            <button 
              onClick={() => applyFilter('vintage')}
              className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-white py-3 rounded-xl font-medium transition-all active:scale-95"
            >
              Vintage
            </button>
            <button 
              onClick={() => applyFilter('cool')}
              className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-white py-3 rounded-xl font-medium transition-all active:scale-95"
            >
              Cool
            </button>
            <button 
              onClick={() => applyFilter('warm')}
              className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-white py-3 rounded-xl font-medium transition-all active:scale-95"
            >
              Warm
            </button>
            <button 
              onClick={() => applyFilter('bw')}
              className="bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/40 text-white py-3 rounded-xl font-medium transition-all active:scale-95"
            >
              B&W
            </button>
          </div>
        </div>
      )}
      
      {/* Controls */}
      <div className="bg-gray-900 p-4 space-y-4 border-t border-gray-800 max-h-64 overflow-y-auto">
        {/* Playback Controls */}
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <span className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={([val]) => handleSeek(val)}
            className="w-full"
          />
        </div>
        
        {/* Filters */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-white text-sm">Brightness</label>
              <span className="text-white/60 text-sm">{brightness}%</span>
            </div>
            <Slider
              value={[brightness]}
              min={0}
              max={200}
              step={1}
              onValueChange={([val]) => setBrightness(val)}
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-white text-sm">Contrast</label>
              <span className="text-white/60 text-sm">{contrast}%</span>
            </div>
            <Slider
              value={[contrast]}
              min={0}
              max={200}
              step={1}
              onValueChange={([val]) => setContrast(val)}
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-white text-sm">Saturation</label>
              <span className="text-white/60 text-sm">{saturation}%</span>
            </div>
            <Slider
              value={[saturation]}
              min={0}
              max={200}
              step={1}
              onValueChange={([val]) => setSaturation(val)}
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-white text-sm">Volume</label>
              <span className="text-white/60 text-sm">{volume}%</span>
            </div>
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={([val]) => handleVolumeChange(val)}
            />
          </div>
        </div>
      </div>
      
      {/* Music Library Modal */}
      {/* TODO: MusicLibrary component not yet created */}
      {/* {showMusicLibrary && (
        <MusicLibrary
          onSelect={handleTrackSelect}
          onClose={() => setShowMusicLibrary(false)}
          selectedTrackId={selectedTrack?.id}
        />
      )} */}
      
      {/* Text Overlay Editor Modal */}
      {/* TODO: TextOverlayEditor component not yet created */}
      {/* {showTextOverlayEditor && (
        <TextOverlayEditor
          onClose={() => setShowTextOverlayEditor(false)}
          onSave={handleTextLayersSave}
          videoDuration={duration}
        />
      )} */}
    </div>
  );
}
