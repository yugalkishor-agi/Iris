import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, IText, Image as FabricImage, Rect } from 'fabric';
import { X, Check, Type, Pencil, Sticker as StickerIcon, Wand2, Undo, Redo, Trash2 } from 'lucide-react';
import { FONTS, FILTERS } from './EditorTypes';
import { SwipeableFontSelector } from './SwipeableFontSelector';
import { AdvancedColorPicker } from './AdvancedColorPicker';
import { EnhancedFilterPanel } from './EnhancedFilterPanel';
import { FabricEmojiPicker } from './FabricEmojiPicker';
import { compressImage } from './EditorUtils';

interface FabricStoryEditorProps {
  imageUrl: string;
  onSave: (imageBlob: Blob) => void;
  onCancel: () => void;
}

type Tool = 'none' | 'text' | 'draw' | 'sticker' | 'filter';

export function FabricStoryEditor({ imageUrl, onSave, onCancel }: FabricStoryEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const backgroundImageRef = useRef<FabricImage | null>(null);
  
  const [activeTool, setActiveTool] = useState<Tool>('none');
  const [canvasReady, setCanvasReady] = useState(false);
  
  // Text tool state
  const [textInput, setTextInput] = useState('');
  const [textFont, setTextFont] = useState(FONTS[0].value);
  const [textSize, setTextSize] = useState(32);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textBgMode, setTextBgMode] = useState<'none' | 'solid' | 'rounded'>('none');
  const [showTextPanel, setShowTextPanel] = useState(false);
  
  // Drawing tool state
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(8);
  const [showDrawPanel, setShowDrawPanel] = useState(false);
  
  // Filter state
  const [currentFilter, setCurrentFilter] = useState('none');
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Sticker/Emoji state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Audience state
  const [audience, setAudience] = useState<'everyone' | 'followers' | 'closeFriends'>('followers');
  const [showAudienceMenu, setShowAudienceMenu] = useState(false);
  
  // History for undo/redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create canvas with mobile dimensions (9:16 aspect ratio)
    const canvas = new Canvas(canvasRef.current, {
      width: 375,
      height: 667,
      backgroundColor: '#000000',
      selection: true,
      preserveObjectStacking: true,
    });

    // Enable touch gestures
    canvas.allowTouchScrolling = false;
    
    fabricCanvasRef.current = canvas;

    // Load background image
    FabricImage.fromURL(imageUrl, (img) => {
      if (!img) return;
      
      // Scale image to fit canvas
      const scaleX = canvas.width! / (img.width || 1);
      const scaleY = canvas.height! / (img.height || 1);
      const scale = Math.max(scaleX, scaleY);
      
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });
      
      backgroundImageRef.current = img;
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      setCanvasReady(true);
      
      // Save initial state
      saveState();
    }, { crossOrigin: 'anonymous' });

    // Object selection handler
    canvas.on('selection:created', () => {
      setActiveTool('none');
    });

    canvas.on('selection:cleared', () => {
      // Keep current tool active
    });

    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  // Save canvas state for undo/redo
  const saveState = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const json = JSON.stringify(fabricCanvasRef.current.toJSON());
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(json);
    
    // Keep only last 20 states
    if (newHistory.length > 20) newHistory.shift();
    else setHistoryIndex(historyIndex + 1);
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0 || !fabricCanvasRef.current) return;
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    
    fabricCanvasRef.current.loadFromJSON(history[newIndex], () => {
      fabricCanvasRef.current?.renderAll();
    });
  }, [historyIndex, history]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1 || !fabricCanvasRef.current) return;
    
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    
    fabricCanvasRef.current.loadFromJSON(history[newIndex], () => {
      fabricCanvasRef.current?.renderAll();
    });
  }, [historyIndex, history]);

  // Add text to canvas
  const handleAddText = useCallback(() => {
    if (!fabricCanvasRef.current || !textInput.trim()) return;
    
    const canvas = fabricCanvasRef.current;
    
    // Create text object with gradient support
    const text = new IText(textInput, {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      fontFamily: textFont,
      fontSize: textSize,
      fill: textColor,
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
      editable: true,
    });

    // Add background if needed
    if (textBgMode === 'solid') {
      text.set({
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
      });
    } else if (textBgMode === 'rounded') {
      // Create a rounded rect behind text
      const bg = new Rect({
        left: text.left,
        top: text.top,
        width: text.width! + 20,
        height: text.height! + 20,
        fill: 'rgba(0,0,0,0.5)',
        rx: 15,
        ry: 15,
        originX: 'center',
        originY: 'center',
      });
      canvas.add(bg);
      canvas.sendToBack(bg);
    }

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    
    setTextInput('');
    setShowTextPanel(false);
    setActiveTool('none');
    saveState();
  }, [textInput, textFont, textSize, textColor, textBgMode, saveState]);

  // Enable drawing mode
  const enableDrawing = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    canvas.isDrawingMode = true;
    
    // Configure brush
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;
    }
    
    setIsDrawing(true);
  }, [brushColor, brushSize]);

  const disableDrawing = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    fabricCanvasRef.current.isDrawingMode = false;
    setIsDrawing(false);
    saveState();
  }, [saveState]);

  // Apply filter to background image
  const applyFilter = useCallback((filterId: string, intensity: number) => {
    if (!backgroundImageRef.current || !fabricCanvasRef.current) return;
    
    const img = backgroundImageRef.current;
    img.filters = [];
    
    // Apply filter based on ID
    const intensityFactor = intensity / 100;
    
    switch (filterId) {
      case 'grayscale':
        img.filters.push(new fabric.Image.filters.Grayscale());
        break;
      case 'sepia':
        img.filters.push(new fabric.Image.filters.Sepia());
        break;
      case 'brightness':
        img.filters.push(new fabric.Image.filters.Brightness({ brightness: 0.2 * intensityFactor }));
        break;
      case 'contrast':
        img.filters.push(new fabric.Image.filters.Contrast({ contrast: 0.3 * intensityFactor }));
        break;
      case 'saturation':
        img.filters.push(new fabric.Image.filters.Saturation({ saturation: 0.5 * intensityFactor }));
        break;
      case 'vintage':
        img.filters.push(new fabric.Image.filters.Sepia());
        img.filters.push(new fabric.Image.filters.Brightness({ brightness: -0.1 * intensityFactor }));
        break;
      case 'blur':
        img.filters.push(new fabric.Image.filters.Blur({ blur: 0.3 * intensityFactor }));
        break;
    }
    
    img.applyFilters();
    fabricCanvasRef.current.renderAll();
    saveState();
  }, [saveState]);

  // Delete selected object
  const handleDelete = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas.getActiveObject();
    
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
      saveState();
    }
  }, [saveState]);

  // Export canvas as blob
  const handleExport = useCallback(async () => {
    if (!fabricCanvasRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    
    // Deselect all objects before export
    canvas.discardActiveObject();
    canvas.renderAll();
    
    // Export to blob
    canvas.toCanvasElement(2).toBlob(async (blob) => {
      if (blob) {
        const compressed = await compressImage(blob, 5, 0.92);
        onSave(compressed);
      }
    }, 'image/jpeg', 0.95);
  }, [onSave]);

  // Tool button handlers
  const handleTextTool = () => {
    setActiveTool('text');
    setShowTextPanel(true);
    setShowDrawPanel(false);
    setShowFilterPanel(false);
    if (isDrawing) disableDrawing();
  };

  const handleDrawTool = () => {
    setActiveTool('draw');
    setShowDrawPanel(true);
    setShowTextPanel(false);
    setShowFilterPanel(false);
    enableDrawing();
  };

  const handleFilterTool = () => {
    setActiveTool('filter');
    setShowFilterPanel(true);
    setShowTextPanel(false);
    setShowDrawPanel(false);
    if (isDrawing) disableDrawing();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent backdrop-blur-sm">
        <button 
          onClick={onCancel}
          className="p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/60 active:scale-95 transition-all shadow-xl"
        >
          <X className="h-5 w-5 text-white drop-shadow-lg" />
        </button>
        
        <div className="flex items-center gap-2">
          {/* Audience Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowAudienceMenu(!showAudienceMenu)}
              className="px-3 py-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/60 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
              <span className="text-white text-xs font-medium">
                {audience === 'everyone' ? 'Everyone' : audience === 'followers' ? 'Followers' : 'Close Friends'}
              </span>
            </button>
            
            {showAudienceMenu && (
              <div className="absolute top-full mt-2 right-0 bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden min-w-[180px] z-50">
                <button onClick={() => { setAudience('everyone'); setShowAudienceMenu(false); }} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all">
                  Everyone
                </button>
                <button onClick={() => { setAudience('followers'); setShowAudienceMenu(false); }} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all">
                  Followers
                </button>
                <button onClick={() => { setAudience('closeFriends'); setShowAudienceMenu(false); }} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all text-green-400">
                  Close Friends
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/60 active:scale-95 transition-all disabled:opacity-30"
          >
            <Undo className="h-4 w-4 text-white" />
          </button>
          
          <button 
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/60 active:scale-95 transition-all disabled:opacity-30"
          >
            <Redo className="h-4 w-4 text-white" />
          </button>
          
          <button 
            onClick={handleDelete}
            className="p-2.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-red-600/60 active:scale-95 transition-all"
          >
            <Trash2 className="h-4 w-4 text-white" />
          </button>
        </div>
        
        <button 
          onClick={handleExport}
          className="px-6 py-2.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-full font-bold hover:shadow-2xl active:scale-95 transition-all"
        >
          <Check className="h-5 w-5 inline mr-2" />
          Share
        </button>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <canvas ref={canvasRef} className="shadow-2xl" />
      </div>

      {/* Bottom Toolbar */}
      <div className="absolute bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={handleTextTool}
            className={`p-4 rounded-full transition-all ${activeTool === 'text' ? 'bg-primary text-white scale-110' : 'bg-black/40 text-white/80 hover:bg-black/60'}`}
          >
            <Type className="h-6 w-6" />
          </button>
          
          <button
            onClick={handleDrawTool}
            className={`p-4 rounded-full transition-all ${activeTool === 'draw' ? 'bg-primary text-white scale-110' : 'bg-black/40 text-white/80 hover:bg-black/60'}`}
          >
            <Pencil className="h-6 w-6" />
          </button>
          
          <button
            onClick={() => setActiveTool('sticker')}
            className={`p-4 rounded-full transition-all ${activeTool === 'sticker' ? 'bg-primary text-white scale-110' : 'bg-black/40 text-white/80 hover:bg-black/60'}`}
          >
            <StickerIcon className="h-6 w-6" />
          </button>
          
          <button
            onClick={handleFilterTool}
            className={`p-4 rounded-full transition-all ${activeTool === 'filter' ? 'bg-primary text-white scale-110' : 'bg-black/40 text-white/80 hover:bg-black/60'}`}
          >
            <Wand2 className="h-6 w-6" />
          </button>
        </div>

        {/* Text Panel */}
        {showTextPanel && (
          <div className="bg-black/80 backdrop-blur-xl rounded-3xl p-4 space-y-3 border border-white/20">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your text..."
              className="w-full bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
            />
            
            <SwipeableFontSelector selectedFont={textFont} onFontChange={setTextFont} />
            
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="16"
                max="72"
                value={textSize}
                onChange={(e) => setTextSize(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-white text-sm w-12">{textSize}px</span>
            </div>
            
            <AdvancedColorPicker selectedColor={textColor} onColorChange={setTextColor} />
            
            <div className="flex gap-2">
              <button
                onClick={() => setTextBgMode('none')}
                className={`flex-1 py-2 rounded-full ${textBgMode === 'none' ? 'bg-primary text-white' : 'bg-white/10 text-white/80'}`}
              >
                No BG
              </button>
              <button
                onClick={() => setTextBgMode('solid')}
                className={`flex-1 py-2 rounded-full ${textBgMode === 'solid' ? 'bg-primary text-white' : 'bg-white/10 text-white/80'}`}
              >
                Solid
              </button>
              <button
                onClick={() => setTextBgMode('rounded')}
                className={`flex-1 py-2 rounded-full ${textBgMode === 'rounded' ? 'bg-primary text-white' : 'bg-white/10 text-white/80'}`}
              >
                Rounded
              </button>
            </div>
            
            <button
              onClick={handleAddText}
              disabled={!textInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-bold disabled:opacity-50"
            >
              Add Text
            </button>
          </div>
        )}

        {/* Draw Panel */}
        {showDrawPanel && (
          <div className="bg-black/80 backdrop-blur-xl rounded-3xl p-4 space-y-3 border border-white/20">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="2"
                max="30"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-white text-sm w-12">{brushSize}px</span>
            </div>
            
            <AdvancedColorPicker selectedColor={brushColor} onColorChange={setBrushColor} />
            
            <button
              onClick={disableDrawing}
              className="w-full py-3 bg-primary text-white rounded-full font-bold"
            >
              Done Drawing
            </button>
          </div>
        )}

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="bg-black/80 backdrop-blur-xl rounded-3xl p-4 space-y-3 border border-white/20">
            <EnhancedFilterPanel
              currentFilter={currentFilter}
              filterIntensity={filterIntensity}
              onFilterChange={(filter) => {
                setCurrentFilter(filter);
                applyFilter(filter, filterIntensity);
              }}
              onIntensityChange={(intensity) => {
                setFilterIntensity(intensity);
                applyFilter(currentFilter, intensity);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
