import { RefObject, useState, useRef, useEffect } from 'react';
import { Film, Volume2, Type, Sticker, ZoomIn, ZoomOut, Move, ChevronLeft, ChevronRight, GripHorizontal } from 'lucide-react';
import { useGlimpseEditorStore } from '@/stores/glimpseEditorStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import './editor-scrollbar.css';
import './editor-animations.css';

interface TimelinePanelProps {
  videoRef: RefObject<HTMLVideoElement>;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export function TimelinePanel({ currentTime, duration, onSeek }: TimelinePanelProps) {
  const { 
    clips, audioTracks, textLayers, stickerLayers, 
    setSelectedClip, setSelectedText, setSelectedSticker,
    updateClip, updateAudioTrack, updateTextLayer, updateStickerLayer
  } = useGlimpseEditorStore();
  
  // Timeline zoom and scroll state
  const [zoom, setZoom] = useState(1);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Drag and drop state for timeline elements
  const [draggedElement, setDraggedElement] = useState<{
    type: 'clip' | 'audio' | 'text' | 'sticker';
    id: string;
    initialX: number;
    initialStartTime: number;
  } | null>(null);
  const [dragOverTrack, setDragOverTrack] = useState<string | null>(null);
  const [showDragHint, setShowDragHint] = useState(false);
  
  const pixelsPerSecond = 50 * zoom;
  const timelineWidth = duration * pixelsPerSecond;

  // Handle timeline scroll with smooth animation
  const handleScroll = (direction: 'left' | 'right') => {
    const scrollAmount = 200 * (direction === 'left' ? -1 : 1);
    if (timelineRef.current) {
      const newPosition = scrollPosition + scrollAmount;
      setScrollPosition(newPosition);
      timelineRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
    }
  };

  // Handle zoom with smooth transition
  const handleZoom = (direction: 'in' | 'out') => {
    const zoomFactor = direction === 'in' ? 0.2 : -0.2;
    const newZoom = Math.max(0.5, Math.min(3, zoom + zoomFactor));
    setZoom(newZoom);
  };

  // Handle timeline drag for smooth scrolling with improved touch support
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
    // Change cursor to grabbing
    if (timelineRef.current) {
      timelineRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && timelineRef.current) {
      const delta = dragStart - e.clientX;
      timelineRef.current.scrollLeft += delta;
      setScrollPosition(timelineRef.current.scrollLeft);
      setDragStart(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Reset cursor
    if (timelineRef.current) {
      timelineRef.current.style.cursor = '';
    }
  };
  
  // Touch support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart(e.touches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && timelineRef.current) {
      const delta = dragStart - e.touches[0].clientX;
      timelineRef.current.scrollLeft += delta;
      setScrollPosition(timelineRef.current.scrollLeft);
      setDragStart(e.touches[0].clientX);
    }
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Sync scroll position when zoom changes
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollLeft = scrollPosition;
    }
  }, [zoom]);

  return (
    <div className="bg-black/95 backdrop-blur border-t border-white/10 p-4 max-h-48">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-200 active:scale-95"
                onClick={() => handleZoom('out')}
              >
                <ZoomOut className="h-4 w-4 text-white/70" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Zoom Out</TooltipContent>
          </Tooltip>
          
          <Slider
            value={[zoom]}
            min={0.5}
            max={3}
            step={0.1}
            onValueChange={([val]) => setZoom(val)}
            className="w-24"
          />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-200 active:scale-95"
                onClick={() => handleZoom('in')}
              >
                <ZoomIn className="h-4 w-4 text-white/70" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Zoom In</TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-200 active:scale-95"
                onClick={() => handleScroll('left')}
              >
                <ChevronLeft className="h-4 w-4 text-white/70" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Scroll Left</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-200 active:scale-95"
                onClick={() => handleScroll('right')}
              >
                <ChevronRight className="h-4 w-4 text-white/70" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Scroll Right</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Timeline Content */}
      <div 
        ref={timelineRef}
        className="relative overflow-x-auto glimpse-scrollbar glimpse-scrollbar-horizontal glimpse-smooth-scroll glimpse-fade-edges glimpse-gpu-accelerated glimpse-no-select"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="relative" style={{ width: `${timelineWidth}px`, minWidth: '100%' }}>
          {/* Time Markers */}
          <div className="absolute top-0 left-0 right-0 h-4 flex items-center">
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
              <div key={`marker-${i}`} className="absolute flex flex-col items-center" style={{ left: `${i * pixelsPerSecond}px` }}>
                <div className="h-2 w-0.5 bg-white/30"></div>
                <span className="text-white/50 text-[10px] mt-0.5">{i}s</span>
              </div>
            ))}
          </div>
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
          style={{ left: `${currentTime * pixelsPerSecond}px` }}
        >
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-primary rounded-full" />
        </div>

        {/* Video Clips Track */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Film className="h-4 w-4 text-white/60" />
            <span className="text-white/60 text-xs">Video</span>
            {showDragHint && dragOverTrack === 'video' && (
              <span className="text-xs text-primary animate-pulse ml-2">Drop to position</span>
            )}
          </div>
          <div 
            className="relative h-16 bg-white/5 rounded-lg overflow-hidden"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverTrack('video');
            }}
            onDragLeave={() => setDragOverTrack(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedElement && draggedElement.type === 'clip') {
                const rect = e.currentTarget.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const newStartTime = Math.max(0, offsetX / pixelsPerSecond);
                updateClip(draggedElement.id, { startTime: newStartTime });
              }
              setDraggedElement(null);
              setDragOverTrack(null);
              setShowDragHint(false);
            }}
          >
            {clips.map((clip) => (
              <div
                key={clip.id}
                draggable
                onDragStart={(e) => {
                  setDraggedElement({
                    type: 'clip',
                    id: clip.id,
                    initialX: e.clientX,
                    initialStartTime: clip.startTime
                  });
                  setShowDragHint(true);
                  // Set drag image (optional)
                  if (e.dataTransfer.setDragImage) {
                    const dragImage = new Image();
                    dragImage.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>';
                    e.dataTransfer.setDragImage(dragImage, 0, 0);
                  }
                }}
                onDragEnd={() => {
                  setDraggedElement(null);
                  setShowDragHint(false);
                }}
                onClick={() => setSelectedClip(clip.id)}
                className={`
                  absolute h-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 
                  border-2 border-blue-500/50 hover:border-blue-500 rounded 
                  flex items-center justify-between px-2 gap-2 cursor-grab active:cursor-grabbing
                  transition-all duration-200 hover:scale-y-105 hover:z-10
                  ${draggedElement?.id === clip.id ? 'opacity-50' : ''}
                  ${dragOverTrack === 'video' ? 'animate-pulse-ring' : ''}
                `}
                style={{
                  left: `${clip.startTime * pixelsPerSecond}px`,
                  width: `${clip.duration * pixelsPerSecond}px`,
                }}
              >
                <Film className="h-6 w-6 text-white/80" />
                <GripHorizontal className="h-4 w-4 text-white/40 hover:text-white/80" />
              </div>
            ))}
          </div>
        </div>

        {/* Audio Tracks */}
        {audioTracks.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Volume2 className="h-4 w-4 text-white/60" />
              <span className="text-white/60 text-xs">Audio</span>
              {showDragHint && dragOverTrack === 'audio' && (
                <span className="text-xs text-primary animate-pulse ml-2">Drop to position</span>
              )}
            </div>
            <div 
              className="relative h-12 bg-white/5 rounded-lg overflow-hidden"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverTrack('audio');
              }}
              onDragLeave={() => setDragOverTrack(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedElement && draggedElement.type === 'audio') {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const offsetX = e.clientX - rect.left;
                  const newStartTime = Math.max(0, offsetX / pixelsPerSecond);
                  updateAudioTrack(draggedElement.id, { startTime: newStartTime });
                }
                setDraggedElement(null);
                setDragOverTrack(null);
                setShowDragHint(false);
              }}
            >
              {audioTracks.map((track) => (
                <div
                  key={track.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedElement({
                      type: 'audio',
                      id: track.id,
                      initialX: e.clientX,
                      initialStartTime: track.startTime
                    });
                    setShowDragHint(true);
                    // Set drag image (optional)
                    if (e.dataTransfer.setDragImage) {
                      const dragImage = new Image();
                      dragImage.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>';
                      e.dataTransfer.setDragImage(dragImage, 0, 0);
                    }
                  }}
                  onDragEnd={() => {
                    setDraggedElement(null);
                    setShowDragHint(false);
                  }}
                  className={`
                    absolute h-full bg-gradient-to-r from-green-500/30 to-emerald-500/30 
                    border border-green-500/50 hover:border-green-500 rounded 
                    flex items-center justify-between px-2 gap-2 cursor-grab active:cursor-grabbing
                    transition-all duration-200 hover:scale-y-105 hover:z-10
                    ${draggedElement?.id === track.id ? 'opacity-50' : ''}
                    ${dragOverTrack === 'audio' ? 'animate-pulse-ring' : ''}
                  `}
                  style={{
                    left: `${track.startTime * pixelsPerSecond}px`,
                    width: `${track.duration * pixelsPerSecond}px`,
                  }}
                >
                  <div className="flex items-center">
                    <Volume2 className="h-4 w-4 text-green-400 mr-2" />
                    <span className="text-white text-xs truncate">{track.name}</span>
                  </div>
                  <GripHorizontal className="h-4 w-4 text-white/40 hover:text-white/80" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Text Layers */}
        {textLayers.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Type className="h-4 w-4 text-white/60" />
              <span className="text-white/60 text-xs">Text</span>
              {showDragHint && dragOverTrack === 'text' && (
                <span className="text-xs text-primary animate-pulse ml-2">Drop to position</span>
              )}
            </div>
            <div 
              className="relative h-10 bg-white/5 rounded-lg overflow-hidden"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverTrack('text');
              }}
              onDragLeave={() => setDragOverTrack(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedElement && draggedElement.type === 'text') {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const offsetX = e.clientX - rect.left;
                  const newStartTime = Math.max(0, offsetX / pixelsPerSecond);
                  const layer = textLayers.find(l => l.id === draggedElement.id);
                  if (layer) {
                    const duration = layer.endTime - layer.startTime;
                    updateTextLayer(draggedElement.id, { 
                      startTime: newStartTime,
                      endTime: newStartTime + duration
                    });
                  }
                }
                setDraggedElement(null);
                setDragOverTrack(null);
                setShowDragHint(false);
              }}
            >
              {textLayers.map((layer) => (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedElement({
                      type: 'text',
                      id: layer.id,
                      initialX: e.clientX,
                      initialStartTime: layer.startTime
                    });
                    setShowDragHint(true);
                    // Set drag image (optional)
                    if (e.dataTransfer.setDragImage) {
                      const dragImage = new Image();
                      dragImage.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>';
                      e.dataTransfer.setDragImage(dragImage, 0, 0);
                    }
                  }}
                  onDragEnd={() => {
                    setDraggedElement(null);
                    setShowDragHint(false);
                  }}
                  onClick={() => setSelectedText(layer.id)}
                  className={`
                    absolute h-full bg-gradient-to-r from-yellow-500/30 to-orange-500/30 
                    border border-yellow-500/50 hover:border-yellow-500 rounded 
                    flex items-center justify-between px-2 gap-2 cursor-grab active:cursor-grabbing
                    transition-all duration-200 hover:scale-y-105 hover:z-10
                    ${draggedElement?.id === layer.id ? 'opacity-50' : ''}
                    ${dragOverTrack === 'text' ? 'animate-pulse-ring' : ''}
                  `}
                  style={{
                    left: `${layer.startTime * pixelsPerSecond}px`,
                    width: `${(layer.endTime - layer.startTime) * pixelsPerSecond}px`,
                  }}
                >
                  <span className="text-white text-xs truncate">{layer.content}</span>
                  <GripHorizontal className="h-4 w-4 text-white/40 hover:text-white/80" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sticker Layers */}
        {stickerLayers.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Sticker className="h-4 w-4 text-white/60" />
              <span className="text-white/60 text-xs">Stickers</span>
              {showDragHint && dragOverTrack === 'sticker' && (
                <span className="text-xs text-primary animate-pulse ml-2">Drop to position</span>
              )}
            </div>
            <div 
              className="relative h-10 bg-white/5 rounded-lg overflow-hidden"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverTrack('sticker');
              }}
              onDragLeave={() => setDragOverTrack(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedElement && draggedElement.type === 'sticker') {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const offsetX = e.clientX - rect.left;
                  const newStartTime = Math.max(0, offsetX / pixelsPerSecond);
                  const layer = stickerLayers.find(l => l.id === draggedElement.id);
                  if (layer) {
                    const duration = layer.endTime - layer.startTime;
                    updateStickerLayer(draggedElement.id, { 
                      startTime: newStartTime,
                      endTime: newStartTime + duration
                    });
                  }
                }
                setDraggedElement(null);
                setDragOverTrack(null);
                setShowDragHint(false);
              }}
            >
              {stickerLayers.map((layer) => (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedElement({
                      type: 'sticker',
                      id: layer.id,
                      initialX: e.clientX,
                      initialStartTime: layer.startTime
                    });
                    setShowDragHint(true);
                    // Set drag image (optional)
                    if (e.dataTransfer.setDragImage) {
                      const dragImage = new Image();
                      dragImage.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>';
                      e.dataTransfer.setDragImage(dragImage, 0, 0);
                    }
                  }}
                  onDragEnd={() => {
                    setDraggedElement(null);
                    setShowDragHint(false);
                  }}
                  onClick={() => setSelectedSticker(layer.id)}
                  className={`
                    absolute h-full bg-gradient-to-r from-pink-500/30 to-purple-500/30 
                    border border-pink-500/50 hover:border-pink-500 rounded 
                    flex items-center justify-between px-2 gap-2 cursor-grab active:cursor-grabbing
                    transition-all duration-200 hover:scale-y-105 hover:z-10
                    ${draggedElement?.id === layer.id ? 'opacity-50' : ''}
                    ${dragOverTrack === 'sticker' ? 'animate-pulse-ring' : ''}
                  `}
                  style={{
                    left: `${layer.startTime * pixelsPerSecond}px`,
                    width: `${(layer.endTime - layer.startTime) * pixelsPerSecond}px`,
                  }}
                >
                  <Sticker className="h-4 w-4 text-pink-400" />
                  <GripHorizontal className="h-4 w-4 text-white/40 hover:text-white/80" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
        </div>
      </div>
      
      {/* Timeline Info */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-white/60">
          <span className="font-medium text-primary">{currentTime.toFixed(1)}s</span> / {duration.toFixed(1)}s
        </div>
        <div className="text-xs text-white/60 flex items-center gap-2">
          <span>Zoom: <span className="font-medium text-primary">{zoom.toFixed(1)}x</span></span>
          <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" title="Timeline ready"></div>
        </div>
      </div>
    </div>
  );
}
