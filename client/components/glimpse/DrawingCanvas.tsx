import { RefObject, useRef, useState, useEffect } from 'react';
import { X, Pen, Eraser, Undo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useGlimpseEditorStore, DrawingStroke } from '@/stores/glimpseEditorStore';
import { HexColorPicker } from 'react-colorful';

interface DrawingCanvasProps {
  videoRef: RefObject<HTMLVideoElement>;
}

const tools = [
  { id: 'pen', label: 'Pen' },
  { id: 'marker', label: 'Marker' },
  { id: 'neon', label: 'Neon' },
  { id: 'highlighter', label: 'Highlighter' },
];

export function DrawingCanvas({ videoRef }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<number[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const {
    drawings,
    addDrawing,
    clearDrawings,
    deleteDrawing,
    currentDrawingTool,
    setDrawingTool,
    drawingColor,
    setDrawingColor,
    drawingStrokeWidth,
    setDrawingStrokeWidth,
    setActiveTool,
  } = useGlimpseEditorStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    drawings.forEach((stroke) => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.opacity;

      ctx.beginPath();
      for (let i = 0; i < stroke.points.length; i += 2) {
        const x = stroke.points[i];
        const y = stroke.points[i + 1];

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    });
  }, [drawings]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentStroke([x, y]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentStroke((prev) => [...prev, x, y]);

    // Draw current stroke
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = drawingStrokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(currentStroke[currentStroke.length - 2] || x, currentStroke[currentStroke.length - 1] || y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || currentStroke.length === 0) return;

    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}`,
      tool: currentDrawingTool,
      points: currentStroke,
      color: drawingColor,
      strokeWidth: drawingStrokeWidth,
      opacity: 1,
    };

    addDrawing(newStroke);
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-black via-gray-900 to-transparent z-40 p-6 max-h-[80vh] overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Pen className="h-5 w-5 text-orange-400" />
            </div>
            <h3 className="text-white text-lg font-semibold">Draw</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setActiveTool('none')}>
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Drawing Canvas */}
        <div className="mb-6 bg-white/5 rounded-lg overflow-hidden border border-white/10">
          <canvas
            ref={canvasRef}
            width={800}
            height={450}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full cursor-crosshair"
          />
        </div>

        {/* Tools */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={currentDrawingTool === tool.id ? 'default' : 'outline'}
              onClick={() => setDrawingTool(tool.id as DrawingStroke['tool'])}
            >
              {tool.label}
            </Button>
          ))}
        </div>

        {/* Color & Width */}
        <div className="space-y-4 mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="h-12 w-12 p-0"
            >
              <div className="w-8 h-8 rounded-full border-2 border-white" style={{ backgroundColor: drawingColor }} />
            </Button>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-sm">Width</span>
                <span className="text-white/60 text-sm">{drawingStrokeWidth}px</span>
              </div>
              <Slider
                value={[drawingStrokeWidth]}
                min={1}
                max={50}
                step={1}
                onValueChange={([val]) => setDrawingStrokeWidth(val)}
                className="w-full"
              />
            </div>
          </div>

          {showColorPicker && (
            <div className="p-4 bg-white/10 rounded-lg">
              <HexColorPicker color={drawingColor} onChange={setDrawingColor} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={clearDrawings} variant="destructive" className="flex-1">
            <Eraser className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
}
