import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Line, Transformer } from 'react-konva';
import { X, Check, Type, Pencil, Sticker as StickerIcon, Wand2, Undo, Redo, Trash2 } from 'lucide-react';
import Konva from 'konva';
import { FONTS } from './EditorTypes';
import { SwipeableFontSelector } from './SwipeableFontSelector';
import { FabricEmojiPicker } from './FabricEmojiPicker';
import { CompactColorPicker } from './CompactColorPicker';
import { compressImage } from './EditorUtils';

interface KonvaStoryEditorProps {
  imageUrl: string;
  onSave: (imageBlob: Blob) => void;
  onCancel: () => void;
}

type Tool = 'none' | 'text' | 'draw' | 'sticker' | 'filter';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

interface EmojiElement {
  id: string;
  emoji: string;
  x: number;
  y: number;
  fontSize: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

interface DrawLine {
  id: string;
  points: number[];
  stroke: string;
  strokeWidth: number;
}

export function KonvaStoryEditor({ imageUrl, onSave, onCancel }: KonvaStoryEditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const layerRef = useRef<Konva.Layer>(null);
  
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('none');
  
  // Elements
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [emojiElements, setEmojiElements] = useState<EmojiElement[]>([]);
  const [drawLines, setDrawLines] = useState<DrawLine[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Text tool state
  const [textFont, setTextFont] = useState(FONTS[0].value);
  const [textSize, setTextSize] = useState(40);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [isEditingOnCanvas, setIsEditingOnCanvas] = useState(false);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(5);
  const [showDrawPanel, setShowDrawPanel] = useState(false);
  const [currentLine, setCurrentLine] = useState<number[]>([]);
  
  // Sticker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Audience
  const [audience, setAudience] = useState<'everyone' | 'followers' | 'closeFriends'>('followers');
  const [showAudienceMenu, setShowAudienceMenu] = useState(false);
  
  // History
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      saveHistory();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Handle transformer
  useEffect(() => {
    if (!transformerRef.current || !selectedId) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const selectedNode = stage.findOne(`#${selectedId}`);
    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  // Save history
  const saveHistory = useCallback(() => {
    const newState = {
      textElements: [...textElements],
      emojiElements: [...emojiElements],
      drawLines: [...drawLines]
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    if (newHistory.length > 20) newHistory.shift();
    else setHistoryIndex(historyIndex + 1);
    
    setHistory(newHistory);
  }, [textElements, emojiElements, drawLines, history, historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    
    const newIndex = historyIndex - 1;
    const state = history[newIndex];
    
    setTextElements(state.textElements);
    setEmojiElements(state.emojiElements);
    setDrawLines(state.drawLines);
    setHistoryIndex(newIndex);
  }, [historyIndex, history]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    
    const newIndex = historyIndex + 1;
    const state = history[newIndex];
    
    setTextElements(state.textElements);
    setEmojiElements(state.emojiElements);
    setDrawLines(state.drawLines);
    setHistoryIndex(newIndex);
  }, [historyIndex, history]);

  // Create new text on canvas click
  const handleCanvasClick = useCallback((e: any) => {
    if (activeTool !== 'text') return;
    
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    
    // Create new editable text at click position
    const newText: TextElement = {
      id: `text-${Date.now()}`,
      text: 'Tap to type',
      x: pointerPosition.x,
      y: pointerPosition.y,
      fontSize: textSize,
      fontFamily: textFont,
      fill: textColor,
      rotation: 0,
      scaleX: 1,
      scaleY: 1
    };
    
    setTextElements([...textElements, newText]);
    setSelectedId(newText.id);
    setIsEditingOnCanvas(true);
    
    // Focus the text for editing
    setTimeout(() => {
      const textNode = stage.findOne(`#${newText.id}`);
      if (textNode) {
        textNode.fire('dblclick');
      }
    }, 50);
    
    setTimeout(saveHistory, 100);
  }, [activeTool, textSize, textFont, textColor, textElements, saveHistory]);

  // Add emoji
  const handleAddEmoji = useCallback((emoji: string) => {
    const newEmoji: EmojiElement = {
      id: `emoji-${Date.now()}`,
      emoji,
      x: 375 / 2,
      y: 667 / 2,
      fontSize: 60,
      rotation: 0,
      scaleX: 1,
      scaleY: 1
    };
    
    setEmojiElements([...emojiElements, newEmoji]);
    setSelectedId(newEmoji.id);
    setShowEmojiPicker(false);
    setActiveTool('none');
    
    setTimeout(saveHistory, 100);
  }, [emojiElements, saveHistory]);

  // Drawing
  const handleMouseDown = (e: any) => {
    if (activeTool !== 'draw') return;
    
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setCurrentLine([pos.x, pos.y]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || activeTool !== 'draw') return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setCurrentLine([...currentLine, point.x, point.y]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (currentLine.length > 0) {
      const newLine: DrawLine = {
        id: `line-${Date.now()}`,
        points: currentLine,
        stroke: brushColor,
        strokeWidth: brushSize
      };
      
      setDrawLines([...drawLines, newLine]);
      setCurrentLine([]);
      saveHistory();
    }
  };

  // Delete selected
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    
    setTextElements(textElements.filter(t => t.id !== selectedId));
    setEmojiElements(emojiElements.filter(e => e.id !== selectedId));
    setDrawLines(drawLines.filter(l => l.id !== selectedId));
    setSelectedId(null);
    
    setTimeout(saveHistory, 100);
  }, [selectedId, textElements, emojiElements, drawLines, saveHistory]);

  // Export
  const handleExport = useCallback(async () => {
    if (!stageRef.current) return;
    
    // Deselect
    setSelectedId(null);
    transformerRef.current?.nodes([]);
    
    setTimeout(() => {
      const uri = stageRef.current!.toDataURL({ pixelRatio: 2 });
      
      fetch(uri)
        .then(res => res.blob())
        .then(async blob => {
          const compressed = await compressImage(blob, 5, 0.92);
          onSave(compressed);
        });
    }, 100);
  }, [onSave]);

  // Tool handlers
  const handleTextTool = () => {
    setActiveTool('text');
    setShowTextPanel(true);
    setShowDrawPanel(false);
    setShowEmojiPicker(false);
  };

  const handleDrawTool = () => {
    setActiveTool('draw');
    setShowDrawPanel(true);
    setShowTextPanel(false);
    setShowEmojiPicker(false);
  };

  const handleStickerTool = () => {
    setActiveTool('sticker');
    setShowEmojiPicker(true);
    setShowTextPanel(false);
    setShowDrawPanel(false);
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
            disabled={!selectedId}
            className="p-2.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-red-600/60 active:scale-95 transition-all disabled:opacity-30"
          >
            <Trash2 className="h-4 w-4 text-white" />
          </button>
        </div>
        
        <button 
          onClick={handleExport}
          className="px-6 py-2.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-full font-bold hover:shadow-2xl active:scale-95 transition-all flex items-center gap-2"
        >
          <Check className="h-5 w-5" />
          Share
        </button>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="relative w-[375px] h-[667px] bg-black shadow-2xl overflow-hidden">
          <Stage
            ref={stageRef}
            width={375}
            height={667}
            onMouseDown={(e) => {
              // Handle text tool canvas click
              if (activeTool === 'text') {
                const clickedOnEmpty = e.target === e.target.getStage() || e.target.getClassName() === 'Image';
                if (clickedOnEmpty) {
                  handleCanvasClick(e);
                  return;
                }
              }
              
              // Check if clicked on background/image for deselection
              const clickedOnEmpty = e.target === e.target.getStage() || e.target.getClassName() === 'Image';
              if (clickedOnEmpty && activeTool === 'none') {
                setSelectedId(null);
              }
              handleMouseDown(e);
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={(e) => {
              // Handle text tool canvas tap
              if (activeTool === 'text') {
                const clickedOnEmpty = e.target === e.target.getStage() || e.target.getClassName() === 'Image';
                if (clickedOnEmpty) {
                  handleCanvasClick(e);
                  return;
                }
              }
              
              // Check if tapped on background/image for deselection
              const clickedOnEmpty = e.target === e.target.getStage() || e.target.getClassName() === 'Image';
              if (clickedOnEmpty && activeTool === 'none') {
                setSelectedId(null);
              }
              handleMouseDown(e);
            }}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            <Layer ref={layerRef}>
              {/* Background Image */}
              {image && (
                <KonvaImage
                  image={image}
                  x={0}
                  y={0}
                  width={375}
                  height={667}
                  onClick={() => {
                    if (activeTool === 'none') {
                      setSelectedId(null);
                    }
                  }}
                  onTap={() => {
                    if (activeTool === 'none') {
                      setSelectedId(null);
                    }
                  }}
                />
              )}
              
              {/* Draw Lines */}
              {drawLines.map((line) => (
                <Line
                  key={line.id}
                  id={line.id}
                  points={line.points}
                  stroke={line.stroke}
                  strokeWidth={line.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation="source-over"
                />
              ))}
              
              {/* Current drawing line */}
              {currentLine.length > 0 && (
                <Line
                  points={currentLine}
                  stroke={brushColor}
                  strokeWidth={brushSize}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation="source-over"
                />
              )}
              
              {/* Text Elements */}
              {textElements.map((textEl) => (
                <KonvaText
                  key={textEl.id}
                  id={textEl.id}
                  text={textEl.text}
                  x={textEl.x}
                  y={textEl.y}
                  fontSize={textEl.fontSize}
                  fontFamily={textEl.fontFamily}
                  fill={textEl.fill}
                  rotation={textEl.rotation}
                  scaleX={textEl.scaleX}
                  scaleY={textEl.scaleY}
                  draggable={activeTool === 'none'}
                  onClick={() => setSelectedId(textEl.id)}
                  onTap={() => setSelectedId(textEl.id)}
                  editable={true}
                  onDragEnd={(e) => {
                    const newTexts = textElements.map(t =>
                      t.id === textEl.id ? { ...t, x: e.target.x(), y: e.target.y() } : t
                    );
                    setTextElements(newTexts);
                    saveHistory();
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const newTexts = textElements.map(t =>
                      t.id === textEl.id
                        ? {
                            ...t,
                            x: node.x(),
                            y: node.y(),
                            rotation: node.rotation(),
                            scaleX: node.scaleX(),
                            scaleY: node.scaleY()
                          }
                        : t
                    );
                    setTextElements(newTexts);
                    saveHistory();
                  }}
                  onTextChange={(e: any) => {
                    const newTexts = textElements.map(t =>
                      t.id === textEl.id ? { ...t, text: e.target.text() } : t
                    );
                    setTextElements(newTexts);
                  }}
                />
              ))}
              
              {/* Emoji Elements */}
              {emojiElements.map((emojiEl) => (
                <KonvaText
                  key={emojiEl.id}
                  id={emojiEl.id}
                  text={emojiEl.emoji}
                  x={emojiEl.x}
                  y={emojiEl.y}
                  fontSize={emojiEl.fontSize}
                  rotation={emojiEl.rotation}
                  scaleX={emojiEl.scaleX}
                  scaleY={emojiEl.scaleY}
                  draggable={activeTool === 'none'}
                  onClick={() => setSelectedId(emojiEl.id)}
                  onTap={() => setSelectedId(emojiEl.id)}
                  onDragEnd={(e) => {
                    const newEmojis = emojiElements.map(em =>
                      em.id === emojiEl.id ? { ...em, x: e.target.x(), y: e.target.y() } : em
                    );
                    setEmojiElements(newEmojis);
                    saveHistory();
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const newEmojis = emojiElements.map(em =>
                      em.id === emojiEl.id
                        ? {
                            ...em,
                            x: node.x(),
                            y: node.y(),
                            rotation: node.rotation(),
                            scaleX: node.scaleX(),
                            scaleY: node.scaleY()
                          }
                        : em
                    );
                    setEmojiElements(newEmojis);
                    saveHistory();
                  }}
                />
              ))}
              
              {/* Transformer for selected element */}
              {selectedId && (
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Limit resize
                    if (newBox.width < 5 || newBox.height < 5) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              )}
            </Layer>
          </Stage>
        </div>
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
            onClick={handleStickerTool}
            className={`p-4 rounded-full transition-all ${activeTool === 'sticker' ? 'bg-primary text-white scale-110' : 'bg-black/40 text-white/80 hover:bg-black/60'}`}
          >
            <StickerIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Text Panel */}
        {showTextPanel && (
          <div className="bg-gradient-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-2xl rounded-3xl p-5 space-y-4 border-2 border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Type className="h-5 w-5" />
                Text Tool
              </h3>
              <button
                onClick={() => {
                  setShowTextPanel(false);
                  setActiveTool('none');
                  setIsEditingOnCanvas(false);
                }}
                className="p-1.5 hover:bg-white/10 rounded-full transition-all"
              >
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>
            
            {/* Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-2">
              <p className="text-blue-300 text-sm text-center font-medium">
                👆 Tap anywhere on the image to start typing
              </p>
            </div>
            
            {/* Font Selector */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-2 block">Font Style</label>
              <SwipeableFontSelector selectedFont={textFont} onFontChange={setTextFont} />
            </div>
            
            {/* Size Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/60 text-xs font-medium">Text Size</label>
                <span className="text-white text-sm font-bold bg-white/10 px-3 py-1 rounded-full">{textSize}px</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={textSize}
                onChange={(e) => setTextSize(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-pink-500 [&::-webkit-slider-thumb]:to-purple-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
              />
            </div>
            
            {/* Color Picker */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-2 block">Text Color</label>
              <CompactColorPicker selectedColor={textColor} onColorChange={setTextColor} />
            </div>
            
            {/* Done Button */}
            <button
              onClick={() => {
                setShowTextPanel(false);
                setActiveTool('none');
                setIsEditingOnCanvas(false);
              }}
              className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-pink-500/50 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Check className="h-5 w-5" />
              Done
            </button>
          </div>
        )}

        {/* Draw Panel */}
        {showDrawPanel && (
          <div className="bg-gradient-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-2xl rounded-3xl p-5 space-y-4 border-2 border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                Draw Tool
              </h3>
              <button
                onClick={() => {
                  setActiveTool('none');
                  setShowDrawPanel(false);
                }}
                className="p-1.5 hover:bg-white/10 rounded-full transition-all"
              >
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>
            
            {/* Brush Size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/60 text-xs font-medium">Brush Size</label>
                <span className="text-white text-sm font-bold bg-white/10 px-3 py-1 rounded-full">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-pink-500 [&::-webkit-slider-thumb]:to-purple-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
              />
            </div>
            
            {/* Brush Color */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-2 block">Brush Color</label>
              <CompactColorPicker selectedColor={brushColor} onColorChange={setBrushColor} />
            </div>
            
            {/* Done Button */}
            <button
              onClick={() => {
                setActiveTool('none');
                setShowDrawPanel(false);
              }}
              className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Check className="h-5 w-5" />
              Done Drawing
            </button>
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <FabricEmojiPicker onEmojiSelect={handleAddEmoji} />
        )}
      </div>
    </div>
  );
}
