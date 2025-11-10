import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle, memo, useMemo } from 'react';
import { Rnd } from 'react-rnd';
import { X, Check, Type, Pencil, Sticker as StickerIcon, Wand2, Undo, Redo, Trash2, Layers, ZoomIn, RotateCw } from 'lucide-react';
import { TextToolPanel } from './TextToolPanel';
import { SwipeableFontSelector } from './SwipeableFontSelector';
import { AdvancedColorPicker } from './AdvancedColorPicker';
import { EnhancedFilterPanel } from './EnhancedFilterPanel';
import { EnhancedDrawToolPanel } from './EnhancedDrawToolPanel';
import { StickerToolPanel } from './StickerToolPanel';
import { InteractiveStickerPanel } from './InteractiveStickerPanel';
import { LayerManagementPanel } from './LayerManagementPanel';
import { EditorState, TextLayer, EmojiLayer, InteractiveLayer, Stroke, FONTS, FILTERS } from './EditorTypes';
import { getFilterStyle, simplifyStroke, compositeAndExport, compressImage, cloneEditorState, distance } from './EditorUtils';
import './story-animations.css';
import './story-enhanced-animations.css';

interface AdvancedStoryEditorProps {
  imageUrl: string;
  onSave: (imageBlob: Blob, settings?: { mentions?: string[] }) => void;
  onCancel: () => void;
}

type Tool = 'none' | 'text' | 'draw' | 'sticker' | 'filter' | 'layers';

export const AdvancedStoryEditor = memo(function AdvancedStoryEditor({ imageUrl, onSave, onCancel }: AdvancedStoryEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [editorState, setEditorState] = useState<EditorState>({
    layers: [],
    drawingLayer: { type: 'drawing', strokes: [] },
    selectedLayerId: null,
    filter: 'none',
    filterIntensity: 100,
    imageState: { zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 }
  });

  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeTool, setActiveTool] = useState<Tool>('none');

  // Text state
  const [textInput, setTextInput] = useState('');
  const [textFont, setTextFont] = useState(FONTS[0].value);
  const [textSize, setTextSize] = useState(32);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textBgColor, setTextBgColor] = useState('transparent');
  const [textEffect, setTextEffect] = useState('none');
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [textOpacity, setTextOpacity] = useState(1);
  const [textTransform, setTextTransform] = useState<'none' | 'uppercase' | 'lowercase' | 'capitalize'>('none');
  const [fontWeight, setFontWeight] = useState(700);
  const [entranceAnimation, setEntranceAnimation] = useState<'none' | 'slideIn' | 'fadeIn' | 'bounceIn' | 'zoomIn' | 'popIn'>('none');
  const [backgroundMode, setBackgroundMode] = useState<'none' | 'solid' | 'rounded'>('none');
  
  // Image state
  const [imageZoom, setImageZoom] = useState<'fit' | 'zoom'>('fit');
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [currentFilterIndex, setCurrentFilterIndex] = useState(0);

  // Draw state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(8);
  const [drawOpacity, setDrawOpacity] = useState(1);
  const [drawTool, setDrawTool] = useState<'marker' | 'highlighter' | 'neon' | 'chalk' | 'arrow'>('marker');
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  // Touch state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialRotation, setInitialRotation] = useState<number | null>(null);
  
  // Mouse state for PC testing
  const [mouseStart, setMouseStart] = useState<{ x: number; y: number } | null>(null);
  const [isMouseDragging, setIsMouseDragging] = useState(false);
  const [audience, setAudience] = useState<'everyone' | 'followers' | 'closeFriends'>('followers');
  const [showAudienceMenu, setShowAudienceMenu] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { imageRef.current = img; };
    img.src = imageUrl;
  }, [imageUrl]);

  const saveToHistory = useCallback((state: EditorState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(cloneEditorState(state));
    if (newHistory.length > 20) newHistory.shift();
    else setHistoryIndex(historyIndex + 1);
    setHistory(newHistory);
  }, [history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setEditorState(cloneEditorState(history[historyIndex - 1]));
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setEditorState(cloneEditorState(history[historyIndex + 1]));
    }
  }, [historyIndex, history]);

  const handleAddText = useCallback((tapX?: number, tapY?: number) => {
    if (!textInput.trim()) return;
    
    // Get container bounds for accurate positioning (same as emoji)
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    
    // Use EXACT same center calculation as emoji
    const centerX = rect ? rect.width / 2 : window.innerWidth / 2;
    const centerY = rect ? rect.height / 2 : window.innerHeight / 2;
    
    const newLayer: TextLayer = {
      id: Date.now().toString(),
      type: 'text',
      content: textInput,
      x: tapX ?? centerX,
      y: tapY ?? centerY,
      scale: 1,
      rotation: 0,
      zIndex: editorState.layers.length,
      font: textFont,
      fontSize: textSize,
      color: textColor,
      backgroundColor: textBgColor,
      backgroundOpacity: 0.8,
      alignment: textAlignment,
      textEffect,
      animation: 'none',
      letterSpacing,
      lineHeight,
      opacity: textOpacity,
      textTransform,
      fontWeight,
      entranceAnimation,
      backgroundMode
    };
    
    // Auto-select and close panel so text is immediately draggable
    const newState = { ...editorState, layers: [...editorState.layers, newLayer], selectedLayerId: newLayer.id };
    setEditorState(newState);
    saveToHistory(newState);
    setTextInput('');
    
    // Close panel after adding
    setTimeout(() => {
      setActiveTool('none');
    }, 100);
  }, [textInput, textFont, textSize, textColor, textBgColor, textAlignment, textEffect, editorState, saveToHistory, letterSpacing, lineHeight, textOpacity, textTransform, fontWeight, entranceAnimation, backgroundMode]);

  const handleAddEmoji = useCallback((emoji: string) => {
    // Get container bounds for accurate positioning
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    
    const newLayer: EmojiLayer = {
      id: Date.now().toString(),
      type: 'emoji',
      content: emoji,
      x: rect ? rect.width / 2 : window.innerWidth / 2,
      y: rect ? rect.height / 2 : window.innerHeight / 2,
      scale: 1,
      rotation: 0,
      zIndex: editorState.layers.length
    };
    
    // Auto-select and close panel
    const newState = { ...editorState, layers: [...editorState.layers, newLayer], selectedLayerId: newLayer.id };
    setEditorState(newState);
    saveToHistory(newState);
    
    // Close panel after adding
    setTimeout(() => {
      setActiveTool('none');
    }, 100);
  }, [editorState, saveToHistory]);

  const handleAddMention = useCallback((userId: string, username: string, avatarURL: string, verified: boolean) => {
    // Get container bounds for accurate positioning
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    
    const newLayer: InteractiveLayer = {
      id: Date.now().toString(),
      type: 'mention',
      x: rect ? rect.width / 2 : window.innerWidth / 2,
      y: rect ? rect.height / 2 : window.innerHeight / 2,
      scale: 1,
      rotation: 0,
      zIndex: editorState.layers.length,
      data: { userId, username, avatarURL, verified }
    };
    
    const newState = { ...editorState, layers: [...editorState.layers, newLayer], selectedLayerId: newLayer.id };
    setEditorState(newState);
    saveToHistory(newState);
    
    // Close panel after adding
    setTimeout(() => {
      setActiveTool('none');
    }, 100);
  }, [editorState, saveToHistory]);

  const createInteractiveLayer = useCallback((type: 'poll' | 'question' | 'slider' | 'music', data: any) => {
    // Get container bounds for accurate positioning
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    
    const newLayer: InteractiveLayer = {
      id: Date.now().toString(),
      type,
      x: rect ? rect.width / 2 : window.innerWidth / 2,
      y: rect ? rect.height / 2 : window.innerHeight / 2,
      scale: 1,
      rotation: 0,
      zIndex: editorState.layers.length,
      data
    };
    const newState = { ...editorState, layers: [...editorState.layers, newLayer] };
    setEditorState(newState);
    saveToHistory(newState);
  }, [editorState, saveToHistory]);

  const handleDeleteLayer = useCallback((layerId: string) => {
    const newState = { ...editorState, layers: editorState.layers.filter(l => l.id !== layerId), selectedLayerId: null };
    setEditorState(newState);
    saveToHistory(newState);
  }, [editorState, saveToHistory]);

  const handleDuplicateLayer = useCallback((layerId: string) => {
    const layer = editorState.layers.find(l => l.id === layerId);
    if (!layer) return;
    const duplicated = { ...layer, id: Date.now().toString(), x: layer.x + 20, y: layer.y + 20, zIndex: editorState.layers.length };
    const newState = { ...editorState, layers: [...editorState.layers, duplicated] };
    setEditorState(newState);
    saveToHistory(newState);
  }, [editorState, saveToHistory]);

  const handleMoveLayerUp = useCallback((layerId: string) => {
    const layers = [...editorState.layers].sort((a, b) => a.zIndex - b.zIndex);
    const index = layers.findIndex(l => l.id === layerId);
    if (index < layers.length - 1) {
      const temp = layers[index].zIndex;
      layers[index].zIndex = layers[index + 1].zIndex;
      layers[index + 1].zIndex = temp;
      const newState = { ...editorState, layers };
      setEditorState(newState);
      saveToHistory(newState);
    }
  }, [editorState, saveToHistory]);

  const handleMoveLayerDown = useCallback((layerId: string) => {
    const layers = [...editorState.layers].sort((a, b) => a.zIndex - b.zIndex);
    const index = layers.findIndex(l => l.id === layerId);
    if (index > 0) {
      const temp = layers[index].zIndex;
      layers[index].zIndex = layers[index - 1].zIndex;
      layers[index - 1].zIndex = temp;
      const newState = { ...editorState, layers };
      setEditorState(newState);
      saveToHistory(newState);
    }
  }, [editorState, saveToHistory]);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (activeTool !== 'draw') return;
    setIsDrawing(true);
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    setCurrentStroke({ points: [{ x, y }], color: drawColor, width: brushSize, opacity: drawOpacity, tool: drawTool });
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }, [activeTool, drawColor, brushSize, drawOpacity, drawTool]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke) return;
    e.preventDefault();
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];
    if (distance(x, y, lastPoint.x, lastPoint.y) > 2) {
      setCurrentStroke({ ...currentStroke, points: [...currentStroke.points, { x, y }] });
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.lineTo(x, y); ctx.stroke(); }
    }
  }, [isDrawing, currentStroke]);

  const stopDrawing = useCallback(() => {
    if (isDrawing && currentStroke && currentStroke.points.length > 1) {
      const simplified = simplifyStroke(currentStroke, 2);
      const newState = { ...editorState, drawingLayer: { type: 'drawing' as const, strokes: [...editorState.drawingLayer.strokes, simplified] } };
      setEditorState(newState);
      saveToHistory(newState);
    }
    setIsDrawing(false);
    setCurrentStroke(null);
  }, [isDrawing, currentStroke, editorState, saveToHistory]);

  const handleTouchStart = useCallback((e: React.TouchEvent, layerId: string) => {
    e.stopPropagation();
    setEditorState({ ...editorState, selectedLayerId: layerId });
    if (e.touches.length === 1) setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    else if (e.touches.length === 2) {
      setInitialPinchDistance(Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY));
      setInitialRotation(Math.atan2(e.touches[1].clientY - e.touches[0].clientY, e.touches[1].clientX - e.touches[0].clientX) * 180 / Math.PI);
    }
  }, [editorState]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && touchStart) {
      // Single-finger drag
      const deltaX = e.touches[0].clientX - touchStart.x;
      const deltaY = e.touches[0].clientY - touchStart.y;
      
      setEditorState(prev => {
        if (!prev.selectedLayerId) return prev;
        return {
          ...prev,
          layers: prev.layers.map(l =>
            l.id === prev.selectedLayerId
              ? { ...l, x: l.x + deltaX, y: l.y + deltaY }
              : l
          )
        };
      });
      
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      
    } else if (e.touches.length === 2 && initialPinchDistance) {
      // Two-finger pinch zoom and rotate
      const newDist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      
      const scaleRatio = newDist / initialPinchDistance;
      
      setEditorState(prev => {
        if (!prev.selectedLayerId) return prev;
        const layer = prev.layers.find(l => l.id === prev.selectedLayerId);
        if (!layer) return prev;
        
        const newScale = Math.max(0.3, Math.min(5, layer.scale * scaleRatio));
        
        let updatedLayers = prev.layers.map(l =>
          l.id === prev.selectedLayerId
            ? { ...l, scale: newScale }
            : l
        );
        
        // Rotation
        if (initialRotation !== null) {
          const newAngle = Math.atan2(
            e.touches[1].clientY - e.touches[0].clientY,
            e.touches[1].clientX - e.touches[0].clientX
          ) * 180 / Math.PI;
          
          const rotationDelta = newAngle - initialRotation;
          
          updatedLayers = updatedLayers.map(l =>
            l.id === prev.selectedLayerId
              ? { ...l, rotation: l.rotation + rotationDelta }
              : l
          );
          
          setInitialRotation(newAngle);
        }
        
        return { ...prev, layers: updatedLayers };
      });
      
      setInitialPinchDistance(newDist);
    }
  }, [touchStart, initialPinchDistance, initialRotation]);

  const handleTouchEnd = useCallback(() => {
    setTouchStart(null);
    setInitialPinchDistance(null);
    setInitialRotation(null);
  }, []);

  // Mouse drag handlers for PC with global event listeners
  const handleMouseDown = useCallback((e: React.MouseEvent, layerId: string) => {
    if (activeTool !== 'none') return;
    e.preventDefault();
    e.stopPropagation();
    setMouseStart({ x: e.clientX, y: e.clientY });
    setIsMouseDragging(true);
    setEditorState({ ...editorState, selectedLayerId: layerId });
  }, [activeTool, editorState]);

  // Global mouse move handler
  useEffect(() => {
    if (!isMouseDragging || !mouseStart || !editorState.selectedLayerId) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const deltaX = e.clientX - mouseStart.x;
      const deltaY = e.clientY - mouseStart.y;
      
      // Update layer position immediately
      setEditorState(prev => {
        const updatedLayers = prev.layers.map(l =>
          l.id === prev.selectedLayerId
            ? { ...l, x: l.x + deltaX, y: l.y + deltaY }
            : l
        );
        return { ...prev, layers: updatedLayers };
      });
      
      setMouseStart({ x: e.clientX, y: e.clientY });
    };

    const handleGlobalMouseUp = () => {
      setIsMouseDragging(false);
      setMouseStart(null);
      // Save to history on mouse up
      setTimeout(() => saveToHistory(editorState), 0);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isMouseDragging, mouseStart, editorState.selectedLayerId]);

  // Mouse wheel for scale and rotate
  const handleWheel = useCallback((e: React.WheelEvent, layerId: string) => {
    if (activeTool !== 'none') return;
    e.preventDefault();
    e.stopPropagation();
    
    const layer = editorState.layers.find(l => l.id === layerId);
    if (!layer) return;
    
    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd + Wheel = Scale
      const scaleDelta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.3, Math.min(5, layer.scale + scaleDelta));
      
      const updatedLayers = editorState.layers.map(l =>
        l.id === layerId ? { ...l, scale: newScale } : l
      );
      
      setEditorState({ ...editorState, layers: updatedLayers });
    } else if (e.shiftKey) {
      // Shift + Wheel = Rotate
      const rotationDelta = e.deltaY > 0 ? 15 : -15;
      
      const updatedLayers = editorState.layers.map(l =>
        l.id === layerId ? { ...l, rotation: l.rotation + rotationDelta } : l
      );
      
      setEditorState({ ...editorState, layers: updatedLayers });
    }
  }, [activeTool, editorState]);

  // Image pinch zoom handler (1x to 4x)
  const [imagePinchStart, setImagePinchStart] = useState<number | null>(null);
  
  const handleImagePinchStart = useCallback((e: React.TouchEvent) => {
    if (activeTool !== 'none' || e.touches.length !== 2) return;
    const dist = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY
    );
    setImagePinchStart(dist);
  }, [activeTool]);

  const handleImagePinchMove = useCallback((e: React.TouchEvent) => {
    if (imagePinchStart === null || activeTool !== 'none' || e.touches.length !== 2) return;
    const dist = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY
    );
    const scale = dist / imagePinchStart;
    const newZoom = Math.max(1, Math.min(4, editorState.imageState.zoom * scale));
    
    setEditorState({
      ...editorState,
      imageState: { ...editorState.imageState, zoom: newZoom }
    });
    setImagePinchStart(dist);
  }, [imagePinchStart, activeTool, editorState]);

  const handleImagePinchEnd = useCallback(() => {
    setImagePinchStart(null);
  }, []);

  // Image tap handler for zoom toggle
  const handleImageClick = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'none') return;
    e.stopPropagation();
    const newZoom = editorState.imageState.zoom === 1 ? 1.5 : 1;
    setEditorState({
      ...editorState,
      imageState: { ...editorState.imageState, zoom: newZoom, offsetX: 0, offsetY: 0 }
    });
  }, [activeTool, editorState]);

  // Swipe to filter handler
  const handleImageSwipeStart = useCallback((e: React.TouchEvent) => {
    if (activeTool !== 'none' || e.touches.length !== 1) return;
    setSwipeStartX(e.touches[0].clientX);
  }, [activeTool]);

  const handleImageSwipeMove = useCallback((e: React.TouchEvent) => {
    if (swipeStartX === null || activeTool !== 'none') return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - swipeStartX;
    
    // Each 50px swipe = 1 filter change
    const filterChange = Math.floor(Math.abs(deltaX) / 50);
    
    if (Math.abs(deltaX) > 20) {
      const direction = deltaX < 0 ? 1 : -1; // Right-to-left = forward, left-to-right = back
      const newIndex = (currentFilterIndex + (filterChange * direction) + FILTERS.length) % FILTERS.length;
      
      if (newIndex !== currentFilterIndex) {
        setCurrentFilterIndex(newIndex);
        setEditorState({ ...editorState, filter: FILTERS[newIndex].id, filterIntensity: 100 });
      }
    }
  }, [swipeStartX, currentFilterIndex, activeTool, editorState]);

  const handleImageSwipeEnd = useCallback(() => {
    setSwipeStartX(null);
  }, []);

  const handleExport = useCallback(async () => {
    if (!imageRef.current) return;
    try {
      const blob = await compositeAndExport(editorState, imageRef.current, 1080, 1920);
      
      // Extract mentions from mention stickers
      const mentions: string[] = [];
      editorState.layers.forEach(layer => {
        if (layer.type === 'mention') {
          const mentionData = (layer as InteractiveLayer).data;
          if (mentionData.username && !mentions.includes(mentionData.username)) {
            mentions.push(mentionData.username);
          }
        }
      });
      
      // Pass compressed image and mentions to parent
      if (blob) {
        const compressedBlob = await compressImage(blob, 5, 0.92);
        onSave(compressedBlob, { mentions });
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [editorState, onSave]);

  // Memoize tool buttons to prevent re-renders
  const toolButtons = useMemo(() => [
    { tool: 'text', icon: Type, label: 'Text' },
    { tool: 'draw', icon: Pencil, label: 'Draw' },
    { tool: 'sticker', icon: StickerIcon, label: 'Sticker' },
    { tool: 'filter', icon: Wand2, label: 'Filter' },
    { tool: 'layers', icon: () => <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" /></svg>, label: 'Layers' }
  ], []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent backdrop-blur-sm">
        <button onClick={onCancel} className="p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/60 active:scale-95 transition-all shadow-xl">
          <X className="h-5 w-5 text-white drop-shadow-lg" />
        </button>
        
        <div className="flex items-center gap-2">
          {/* Audience Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowAudienceMenu(!showAudienceMenu)}
              className="px-3 py-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/60 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {audience === 'everyone' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                {audience === 'followers' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />}
                {audience === 'closeFriends' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />}
              </svg>
              <span className="text-white text-xs font-medium">
                {audience === 'everyone' ? 'Everyone' : audience === 'followers' ? 'Followers' : 'Close Friends'}
              </span>
            </button>
            
            {showAudienceMenu && (
              <div className="absolute top-full mt-2 right-0 bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden min-w-[180px] z-50">
                <button onClick={() => { setAudience('everyone'); setShowAudienceMenu(false); }} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all flex items-center gap-3">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-sm">Everyone</span>
                </button>
                <button onClick={() => { setAudience('followers'); setShowAudienceMenu(false); }} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all flex items-center gap-3">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  <span className="text-sm">Followers</span>
                </button>
                <button onClick={() => { setAudience('closeFriends'); setShowAudienceMenu(false); }} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all flex items-center gap-3 border-t border-white/10">
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                  <span className="text-sm text-green-400">Close Friends</span>
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleUndo} 
            disabled={historyIndex <= 0} 
            className="p-2.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/60 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
          >
            <Undo className="h-4 w-4 text-white drop-shadow-lg" />
          </button>
          <button 
            onClick={handleRedo} 
            disabled={historyIndex >= history.length - 1} 
            className="p-2.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/60 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg relative"
          >
            <Redo className="h-4 w-4 text-white drop-shadow-lg" />
            {historyIndex < history.length - 1 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-br from-pink-500 to-purple-600 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-lg">
                {history.length - historyIndex - 1}
              </span>
            )}
          </button>
        </div>
        
        <button 
          onClick={handleExport} 
          className="px-6 py-2.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-full font-bold hover:shadow-2xl hover:shadow-pink-500/50 active:scale-95 transition-all flex items-center gap-2"
        >
          <Check className="h-5 w-5" />
          <span className="text-sm">Share</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black/50">
        <div className="relative w-[375px] h-[667px] bg-black shadow-2xl overflow-hidden">
          <div
            ref={containerRef}
            className="absolute inset-0"
            onClick={(e) => {
              // If text tool is active and text is entered, place it at click location
              if (activeTool === 'text' && textInput.trim()) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  handleAddText(x, y);
                  return;
                }
              }
              // Otherwise deselect layer
              setEditorState({ ...editorState, selectedLayerId: null });
            }}
          >
          <img 
          src={imageUrl} 
          alt="Story" 
          className="w-full h-full object-cover transition-all duration-300"
          style={{ 
            filter: getFilterStyle(editorState.filter, editorState.filterIntensity),
            transform: `scale(${editorState.imageState.zoom}) rotate(${editorState.imageState.rotation}deg) translate(${editorState.imageState.offsetX}px, ${editorState.imageState.offsetY}px)`,
            transformOrigin: 'center center'
          }}
          onClick={handleImageClick}
          onTouchStart={(e) => {
            handleImageSwipeStart(e);
            handleImagePinchStart(e);
          }}
          onTouchMove={(e) => {
            handleImageSwipeMove(e);
            handleImagePinchMove(e);
          }}
          onTouchEnd={(e) => {
            handleImageSwipeEnd();
            handleImagePinchEnd();
          }}
        />
        <canvas ref={drawCanvasRef} className="absolute top-0 left-0 w-full h-full" width={window.innerWidth} height={window.innerHeight} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} style={{ pointerEvents: activeTool === 'draw' ? 'auto' : 'none', cursor: activeTool === 'draw' ? 'crosshair' : 'default', touchAction: 'none' }} />
        
        <div className="absolute inset-0 pointer-events-none">
          {editorState.layers.map((layer) => (
            <Rnd
              key={layer.id}
              position={{ x: layer.x, y: layer.y }}
              size={{ width: 'auto', height: 'auto' }}
              onDragStop={(e, d) => {
                setEditorState(prev => ({
                  ...prev,
                  layers: prev.layers.map(l => 
                    l.id === layer.id ? { ...l, x: d.x, y: d.y } : l
                  )
                }));
              }}
              bounds="parent"
              enableResizing={false}
              className="pointer-events-auto"
            >
              <div
                onWheel={(e) => {
                  if (editorState.selectedLayerId === layer.id) {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    const newScale = Math.max(0.5, Math.min(3, layer.scale + delta));
                    setEditorState(prev => ({
                      ...prev,
                      layers: prev.layers.map(l => 
                        l.id === layer.id ? { ...l, scale: newScale } : l
                      )
                    }));
                  }
                }}
              >
              <div 
                className={`cursor-move select-none ${editorState.selectedLayerId === layer.id ? 'ring-4 ring-primary shadow-2xl shadow-primary/50' : 'hover:ring-2 hover:ring-primary/50'}`}
                style={{ 
                  transform: `scale(${layer.scale}) rotate(${layer.rotation}deg)`, 
                  zIndex: layer.zIndex,
                  touchAction: 'none'
                }}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setEditorState({ ...editorState, selectedLayerId: layer.id }); 
                }}
                onDoubleClick={(e) => { 
                  e.stopPropagation(); 
                  if (layer.type === 'text') { 
                    setTextInput((layer as TextLayer).content); 
                    setTextFont((layer as TextLayer).font); 
                    setTextSize((layer as TextLayer).fontSize); 
                    setTextColor((layer as TextLayer).color); 
                    setTextBgColor((layer as TextLayer).backgroundColor); 
                    setTextEffect((layer as TextLayer).textEffect); 
                    setTextAlignment((layer as TextLayer).alignment); 
                    setActiveTool('text'); 
                    const newState = { ...editorState, layers: editorState.layers.filter(l => l.id !== layer.id), selectedLayerId: null }; 
                    setEditorState(newState); 
                  } 
                }}
              >
              {layer.type === 'text' && (() => {
                const textLayer = layer as TextLayer;
                const isGradient = textLayer.color.includes('gradient');
                
                // Generate effect styles
                const getEffectStyle = () => {
                  switch (textLayer.textEffect) {
                    case 'shadow':
                      return { textShadow: '3px 3px 6px rgba(0,0,0,0.8)' };
                    case 'glow':
                      return { textShadow: `0 0 20px ${textLayer.color}, 0 0 30px ${textLayer.color}, 0 0 40px ${textLayer.color}` };
                    case 'outline':
                      return { WebkitTextStroke: '2px black' };
                    case 'neon':
                      return { 
                        textShadow: `0 0 10px #fff, 0 0 20px #fff, 0 0 30px ${textLayer.color}, 0 0 40px ${textLayer.color}, 0 0 50px ${textLayer.color}`,
                        color: '#fff'
                      };
                    case '3d':
                      return { textShadow: '1px 1px 0px #000, 2px 2px 0px #000, 3px 3px 0px #000, 4px 4px 0px #000, 5px 5px 0px rgba(0,0,0,0.5)' };
                    case 'retro':
                      return { textShadow: '2px 2px 0px #ff00de, 4px 4px 0px #00ffff', color: '#fff' };
                    case 'glitch':
                      return { textShadow: '2px 0 #ff00c1, -2px 0 #00fff9, 0 0 8px rgba(255,255,255,0.5)' };
                    default:
                      return {};
                  }
                };

                const baseStyle: React.CSSProperties = {
                  fontFamily: textLayer.font,
                  fontSize: `${textLayer.fontSize}px`,
                  textAlign: textLayer.alignment,
                  letterSpacing: `${textLayer.letterSpacing ?? 0}px`,
                  lineHeight: textLayer.lineHeight ?? 1.2,
                  opacity: textLayer.opacity ?? 1,
                  textTransform: textLayer.textTransform ?? 'none',
                  fontWeight: textLayer.fontWeight ?? 700,
                  ...getEffectStyle()
                };

                // Handle gradient text
                if (isGradient) {
                  baseStyle.background = textLayer.color;
                  baseStyle.WebkitBackgroundClip = 'text';
                  baseStyle.WebkitTextFillColor = 'transparent';
                  baseStyle.backgroundClip = 'text';
                } else {
                  baseStyle.color = textLayer.color;
                }
                
                // Background mode styling
                const backgroundMode = textLayer.backgroundMode ?? 'none';
                let bgClassName = 'px-4 py-2 font-bold whitespace-nowrap';
                let bgStyle: React.CSSProperties = {};
                
                if (backgroundMode === 'solid' && textLayer.backgroundColor !== 'transparent') {
                  bgStyle.background = `${textLayer.backgroundColor}${Math.round(textLayer.backgroundOpacity * 255).toString(16).padStart(2, '0')}`;
                } else if (backgroundMode === 'rounded' && textLayer.backgroundColor !== 'transparent') {
                  bgClassName += ' rounded-full';
                  bgStyle.background = `${textLayer.backgroundColor}${Math.round(textLayer.backgroundOpacity * 255).toString(16).padStart(2, '0')}`;
                }
                
                // Entrance animation class
                const animationClass = textLayer.entranceAnimation && textLayer.entranceAnimation !== 'none' 
                  ? `text-entrance-${textLayer.entranceAnimation}` 
                  : '';

                return (
                  <div className={`${bgClassName} ${animationClass}`} style={{ ...baseStyle, ...bgStyle }}>
                    {textLayer.content}
                  </div>
                );
              })()}
              {layer.type === 'emoji' && <span className="text-6xl">{(layer as EmojiLayer).content}</span>}
              {layer.type === 'poll' && <div className="bg-gradient-to-br from-purple-500/90 to-pink-500/90 backdrop-blur-md rounded-2xl p-4 min-w-[280px] shadow-2xl"><div className="text-white space-y-3"><p className="font-bold text-lg text-center">{(layer as InteractiveLayer).data.question}</p><div className="space-y-2">{(layer as InteractiveLayer).data.options?.map((opt: string, i: number) => <div key={i} className="bg-white/20 rounded-xl p-3 text-center font-medium">{opt}</div>)}</div></div></div>}
              {layer.type === 'question' && <div className="bg-gradient-to-br from-blue-500/90 to-cyan-500/90 backdrop-blur-md rounded-2xl p-4 min-w-[280px] shadow-2xl"><p className="font-bold text-white text-center">{(layer as InteractiveLayer).data.question}</p></div>}
              {layer.type === 'slider' && <div className="bg-gradient-to-br from-orange-500/90 to-yellow-500/90 backdrop-blur-md rounded-2xl p-4 min-w-[280px] shadow-2xl"><p className="font-bold text-white text-center">{(layer as InteractiveLayer).data.question}</p></div>}
              {layer.type === 'music' && <div className="bg-gradient-to-br from-purple-600/90 to-pink-600/90 backdrop-blur-md rounded-2xl p-3 min-w-[200px] shadow-2xl"><p className="font-bold text-white text-sm">{(layer as InteractiveLayer).data.song}</p></div>}
              {layer.type === 'mention' && (() => {
                const mentionData = (layer as InteractiveLayer).data;
                return (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-md rounded-full border-2 border-white/30 shadow-2xl">
                    <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-white/50">
                      {mentionData.avatarURL ? (
                        <img src={mentionData.avatarURL} alt={mentionData.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">{mentionData.username?.[0]?.toUpperCase()}</div>
                      )}
                    </div>
                    <span className="text-white font-semibold text-base" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>@{mentionData.username}</span>
                    {mentionData.verified && (
                      <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                );
              })()}
              </div>
              </div>
            </Rnd>
          ))}
        </div>
        
        {/* Live Text Preview */}
        {activeTool === 'text' && textInput.trim() && (() => {
          const isGradient = textColor.includes('gradient');
          const getEffectStyle = () => {
            switch (textEffect) {
              case 'shadow': return { textShadow: '3px 3px 6px rgba(0,0,0,0.8)' };
              case 'glow': return { textShadow: `0 0 20px ${textColor}, 0 0 30px ${textColor}, 0 0 40px ${textColor}` };
              case 'outline': return { WebkitTextStroke: '2px black' };
              case 'neon': return { textShadow: `0 0 10px #fff, 0 0 20px #fff, 0 0 30px ${textColor}, 0 0 40px ${textColor}`, color: '#fff' };
              case '3d': return { textShadow: '1px 1px 0px #000, 2px 2px 0px #000, 3px 3px 0px #000, 4px 4px 0px #000, 5px 5px 0px rgba(0,0,0,0.5)' };
              case 'retro': return { textShadow: '2px 2px 0px #ff00de, 4px 4px 0px #00ffff', color: '#fff' };
              case 'glitch': return { textShadow: '2px 0 #ff00c1, -2px 0 #00fff9, 0 0 8px rgba(255,255,255,0.5)' };
              default: return {};
            }
          };
          const previewStyle: React.CSSProperties = {
            fontFamily: textFont,
            fontSize: `${textSize}px`,
            textAlign: textAlignment,
            letterSpacing: `${letterSpacing}px`,
            lineHeight: lineHeight,
            textTransform: textTransform,
            fontWeight: fontWeight,
            ...getEffectStyle(),
            opacity: textOpacity * 0.7,
            pointerEvents: 'none'
          };
          
          // Handle gradient text (use background, not backgroundColor)
          if (isGradient) {
            previewStyle.background = textColor;
            previewStyle.WebkitBackgroundClip = 'text';
            previewStyle.WebkitTextFillColor = 'transparent';
            previewStyle.backgroundClip = 'text';
          } else {
            previewStyle.color = textColor;
          }
          
          // Add background color only if not gradient
          if (!isGradient && textBgColor !== 'transparent') {
            previewStyle.background = `${textBgColor}cc`;
          }
          return (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse">
              <div className="px-4 py-2 rounded-lg font-bold" style={previewStyle}>
                {textInput}
              </div>
            </div>
          );
        })()}
          </div>
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-2xl border-t border-white/10">
        <div className="flex items-center justify-around px-4 py-6 pb-safe">
          {toolButtons.map(({ tool, icon: Icon, label }) => (
            <button 
              key={tool} 
              onClick={() => setActiveTool(tool as Tool)} 
              className={`flex flex-col items-center gap-2 transition-all duration-300 active:scale-95 min-w-[60px] ${
                activeTool === tool ? 'text-white' : 'text-white/60'
              }`}
            >
              <div className={`p-3 rounded-full transition-all duration-300 ${
                activeTool === tool 
                  ? 'bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 shadow-2xl shadow-purple-500/50 scale-110' 
                  : 'bg-white/10 backdrop-blur-sm hover:bg-white/20'
              }`}>
                <Icon className="h-5 w-5 drop-shadow-lg" />
              </div>
              <span className={`text-[10px] font-medium tracking-wide ${
                activeTool === tool ? 'text-white' : 'text-white/60'
              }`}>
                {label}
              </span>
              {activeTool === tool && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full shadow-lg shadow-purple-500/50 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        <div className="px-4 pb-4 max-h-96 overflow-y-auto smooth-fade-in" style={{ scrollbarWidth: 'thin' }}>
          {activeTool === 'text' && <TextToolPanel textInput={textInput} textFont={textFont} textSize={textSize} textColor={textColor} textBgColor={textBgColor} textEffect={textEffect} textAlignment={textAlignment} letterSpacing={letterSpacing} lineHeight={lineHeight} textOpacity={textOpacity} textTransform={textTransform} fontWeight={fontWeight} entranceAnimation={entranceAnimation} backgroundMode={backgroundMode} onTextInputChange={setTextInput} onFontChange={setTextFont} onSizeChange={setTextSize} onColorChange={setTextColor} onBgColorChange={setTextBgColor} onEffectChange={setTextEffect} onAlignmentChange={setTextAlignment} onLetterSpacingChange={setLetterSpacing} onLineHeightChange={setLineHeight} onOpacityChange={setTextOpacity} onTextTransformChange={setTextTransform} onFontWeightChange={setFontWeight} onEntranceAnimationChange={setEntranceAnimation} onBackgroundModeChange={setBackgroundMode} onAddText={handleAddText} />}
          {activeTool === 'draw' && <EnhancedDrawToolPanel selectedTool={drawTool} brushSize={brushSize} drawColor={drawColor} opacity={drawOpacity} onToolChange={setDrawTool} onBrushSizeChange={setBrushSize} onColorChange={setDrawColor} onOpacityChange={setDrawOpacity} onClearDrawing={() => { drawCanvasRef.current?.getContext('2d')?.clearRect(0, 0, window.innerWidth, window.innerHeight); const newState = { ...editorState, drawingLayer: { type: 'drawing' as const, strokes: [] } }; setEditorState(newState); saveToHistory(newState); }} />}
          {activeTool === 'filter' && <EnhancedFilterPanel selectedFilter={editorState.filter} filterIntensity={editorState.filterIntensity} imageUrl={imageUrl} onFilterChange={(f) => setEditorState({ ...editorState, filter: f })} onIntensityChange={(i) => setEditorState({ ...editorState, filterIntensity: i })} />}
          {activeTool === 'sticker' && <StickerToolPanel onAddEmoji={handleAddEmoji} onAddPoll={(q, o) => createInteractiveLayer('poll', { question: q, options: o })} onAddQuestion={(q) => createInteractiveLayer('question', { question: q })} onAddSlider={(q, e) => createInteractiveLayer('slider', { question: q, emoji: e })} onAddMusic={(s, a) => createInteractiveLayer('music', { song: s, artist: a })} onAddMention={handleAddMention} />}
          {activeTool === 'layers' && <LayerManagementPanel layers={editorState.layers} selectedLayerId={editorState.selectedLayerId} onSelectLayer={(id) => setEditorState({ ...editorState, selectedLayerId: id })} onDeleteLayer={handleDeleteLayer} onDuplicateLayer={handleDuplicateLayer} onMoveLayerUp={handleMoveLayerUp} onMoveLayerDown={handleMoveLayerDown} />}
        </div>
      </div>
    </div>
  );
});

export default AdvancedStoryEditor;
