import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Text as KonvaText, Line, Transformer } from 'react-konva';
import { useStoryEditorStore } from '@/stores/storyEditorStore';
import { Button } from '@/components/ui/button';
import { X, Undo2, Redo2, Download } from 'lucide-react';
import { BackgroundPanel } from './panels/BackgroundPanel';
import { TextToolPanel } from './panels/TextToolPanel';
import { DrawToolPanel } from './panels/DrawToolPanel';
import { FilterPanel } from './panels/FilterPanel';
import { StickerPanel } from './panels/StickerPanel';
import { MusicPanel } from './panels/MusicPanel';
import { BottomToolbar } from './panels/BottomToolbar';
import Konva from 'konva';

interface InstagramStoryEditorProps {
  initialImage?: string;
  onSave: (imageUrl: string, settings: any) => void;
  onCancel: () => void;
  mentionReplyTo?: {
    userId: string;
    username: string;
    avatarURL: string;
    verified: boolean;
    storyId: string;
  };
}

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

export function InstagramStoryEditor({ 
  initialImage, 
  onSave, 
  onCancel,
  mentionReplyTo
}: InstagramStoryEditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [backgroundImageObj, setBackgroundImageObj] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<number[]>([]);
  
  const {
    background,
    layers,
    drawings,
    currentFilter,
    activeTool,
    setActiveTool,
    setStageRef,
    exportAsImage,
    canUndo,
    canRedo,
    undo,
    redo,
    selectedLayerId,
    setSelectedLayer,
    updateLayer,
    setBackground,
    isDrawingMode,
    drawingColor,
    drawingStrokeWidth,
    drawingOpacity,
    currentDrawingTool,
    addDrawing,
  } = useStoryEditorStore();

  // Set stage ref on mount
  useEffect(() => {
    if (stageRef.current) {
      setStageRef(stageRef);
    }
  }, [setStageRef]);

  // Load initial image
  useEffect(() => {
    if (initialImage) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setBackgroundImageObj(img);
        setBackground({
          type: 'image',
          imageUrl: initialImage,
          filterIntensity: 0.5,
        });
      };
      img.src = initialImage;
    }
  }, [initialImage, setBackground]);

  // Calculate canvas scale to fit screen
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        const scaleX = containerWidth / CANVAS_WIDTH;
        const scaleY = containerHeight / CANVAS_HEIGHT;
        setScale(Math.min(scaleX, scaleY, 1));
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Apply filters to background image
  useEffect(() => {
    if (backgroundImageObj && stageRef.current) {
      const layer = stageRef.current.findOne('.backgroundLayer');
      if (layer) {
        applyFilter(layer as Konva.Layer, currentFilter);
      }
    }
  }, [currentFilter, backgroundImageObj]);

  const applyFilter = (layer: Konva.Layer, filter: string) => {
    const imageNode = layer.findOne('Image');
    if (!imageNode) return;

    // Reset filters
    imageNode.cache();
    imageNode.filters([]);

    // Apply selected filter
    switch (filter) {
      case 'grayscale':
        imageNode.filters([Konva.Filters.Grayscale]);
        break;
      case 'sepia':
        imageNode.filters([Konva.Filters.Sepia]);
        break;
      case 'blur':
        imageNode.filters([Konva.Filters.Blur]);
        (imageNode as any).blurRadius(5);
        break;
      case 'brighten':
        imageNode.filters([Konva.Filters.Brighten]);
        (imageNode as any).brightness(0.3);
        break;
      case 'contrast':
        imageNode.filters([Konva.Filters.Contrast]);
        (imageNode as any).contrast(20);
        break;
      case 'invert':
        imageNode.filters([Konva.Filters.Invert]);
        break;
      default:
        break;
    }

    layer.batchDraw();
  };

  const handleExport = async () => {
    if (!stageRef.current) return;
    
    try {
      const dataUrl = await exportAsImage();
      if (dataUrl) {
        onSave(dataUrl, {
          background,
          layers,
          filter: currentFilter,
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleLayerSelect = (id: string) => {
    setSelectedLayer(selectedLayerId === id ? null : id);
  };

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    
    if (selectedLayerId) {
      const selectedNode = stageRef.current.findOne(`#${selectedLayerId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.show();
        transformerRef.current.moveToTop();
        selectedNode.moveToTop();
      }
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.hide();
    }
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedLayerId, layers]);

  // Drawing handlers
  const handleMouseDown = (e: any) => {
    if (!isDrawingMode) return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setIsDrawing(true);
    setCurrentStroke([point.x, point.y]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !isDrawingMode) return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setCurrentStroke([...currentStroke, point.x, point.y]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    if (currentStroke.length > 2) {
      addDrawing({
        id: `stroke-${Date.now()}`,
        tool: currentDrawingTool,
        points: currentStroke,
        color: drawingColor,
        strokeWidth: drawingStrokeWidth,
        opacity: drawingOpacity,
      });
    }
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onCancel}
          className="text-white hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo}
            className="text-white hover:bg-white/10 disabled:opacity-30"
          >
            <Undo2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            className="text-white hover:bg-white/10 disabled:opacity-30"
          >
            <Redo2 className="h-5 w-5" />
          </Button>
        </div>

        <Button
          onClick={handleExport}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
          }}
        >
          <Stage
            ref={stageRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            onClick={(e) => {
              // Deselect when clicking empty area
              if (e.target === e.target.getStage()) {
                setSelectedLayer(null);
              }
            }}
            style={{
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Background Layer */}
            <Layer name="backgroundLayer">
              {background.type === 'image' && backgroundImageObj && (
                <Image
                  image={backgroundImageObj}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  listening={false}
                />
              )}
              {background.type === 'color' && (
                <KonvaText
                  x={0}
                  y={0}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  fill={background.color}
                  listening={false}
                />
              )}
              {background.type === 'gradient' && background.gradient && (
                <KonvaText
                  x={0}
                  y={0}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                  fillLinearGradientEndPoint={{ x: 0, y: CANVAS_HEIGHT }}
                  fillLinearGradientColorStops={background.gradient.colors.flatMap((color, i) => [
                    i / (background.gradient!.colors.length - 1),
                    color
                  ])}
                  listening={false}
                />
              )}
            </Layer>

            {/* Drawings Layer */}
            <Layer name="drawingsLayer">
              {drawings.map((stroke) => (
                <Line
                  key={stroke.id}
                  points={stroke.points}
                  stroke={stroke.color}
                  strokeWidth={stroke.strokeWidth}
                  opacity={stroke.opacity}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={
                    stroke.tool === 'highlighter' ? 'multiply' : 'source-over'
                  }
                  listening={false}
                />
              ))}
              {/* Current drawing stroke */}
              {isDrawing && currentStroke.length > 0 && (
                <Line
                  points={currentStroke}
                  stroke={drawingColor}
                  strokeWidth={drawingStrokeWidth}
                  opacity={drawingOpacity}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  listening={false}
                />
              )}
            </Layer>

            {/* Text & Stickers Layer */}
            <Layer name="elementsLayer">
              {layers.map((layer) => {
                const isSelected = selectedLayerId === layer.id;
                
                if (layer.type === 'text') {
                  return (
                    <KonvaText
                      key={layer.id}
                      id={layer.id}
                      name="text-element"
                      text={layer.content}
                      x={layer.x}
                      y={layer.y}
                      fontSize={layer.fontSize}
                      fontFamily={layer.fontFamily}
                      fill={layer.fill}
                      align="left"
                      draggable={!isDrawingMode}
                      listening={!isDrawingMode}
                      rotation={layer.rotation}
                      scaleX={layer.scale}
                      scaleY={layer.scale}
                      onClick={(e) => {
                        e.cancelBubble = true;
                        setSelectedLayer(layer.id);
                      }}
                      onTap={(e) => {
                        e.cancelBubble = true;
                        setSelectedLayer(layer.id);
                      }}
                      onDragMove={(e) => {
                        if (!isSelected) {
                          setSelectedLayer(layer.id);
                        }
                      }}
                      onDragEnd={(e) => {
                        updateLayer(layer.id, {
                          x: e.target.x(),
                          y: e.target.y(),
                        });
                      }}
                      onTransformEnd={(e) => {
                        const node = e.target;
                        const scaleX = node.scaleX();
                        node.scaleX(1);
                        node.scaleY(1);
                        
                        updateLayer(layer.id, {
                          x: node.x(),
                          y: node.y(),
                          rotation: node.rotation(),
                          fontSize: layer.fontSize * scaleX,
                        });
                      }}
                    />
                  );
                }
                
                if (layer.type === 'emoji' || layer.type === 'sticker') {
                  return (
                    <KonvaText
                      key={layer.id}
                      id={layer.id}
                      name="sticker-element"
                      text={layer.content}
                      x={layer.x}
                      y={layer.y}
                      fontSize={80}
                      draggable={!isDrawingMode}
                      listening={!isDrawingMode}
                      rotation={layer.rotation}
                      scaleX={layer.scale}
                      scaleY={layer.scale}
                      onClick={(e) => {
                        e.cancelBubble = true;
                        setSelectedLayer(layer.id);
                      }}
                      onTap={(e) => {
                        e.cancelBubble = true;
                        setSelectedLayer(layer.id);
                      }}
                      onDragMove={(e) => {
                        if (!isSelected) {
                          setSelectedLayer(layer.id);
                        }
                      }}
                      onDragEnd={(e) => {
                        updateLayer(layer.id, {
                          x: e.target.x(),
                          y: e.target.y(),
                        });
                      }}
                      onTransformEnd={(e) => {
                        const node = e.target;
                        updateLayer(layer.id, {
                          x: node.x(),
                          y: node.y(),
                          rotation: node.rotation(),
                          scale: node.scaleX(),
                        });
                      }}
                    />
                  );
                }
                
                return null;
              })}

              {/* Transformer */}
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit resize
                  if (newBox.width < 50 || newBox.height < 20) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Tool Panels */}
      {activeTool === 'background' && <BackgroundPanel />}
      {activeTool === 'text' && <TextToolPanel />}
      {activeTool === 'draw' && <DrawToolPanel />}
      {activeTool === 'filter' && <FilterPanel />}
      {activeTool === 'sticker' && <StickerPanel />}
      {activeTool === 'music' && <MusicPanel />}

      {/* Bottom Toolbar */}
      <BottomToolbar />
    </div>
  );
}
