import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CropTool } from "./CropTool";
import { 
  Sliders, 
  Wand2, 
  Crop as CropIcon, 
  Undo,
  Redo,
  X,
  Check
} from "lucide-react";

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
}

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  vignette: number;
}

interface EditorState {
  adjustments: Adjustments;
  selectedFilter: string;
  filterIntensity: number;
  rotation: number;
}

const FILTERS = [
  { name: "None", id: "none" },
  { name: "Warm", id: "warm" },
  { name: "Cool", id: "cool" },
  { name: "Retro", id: "retro" },
  { name: "Fade", id: "fade" },
  { name: "Vibe", id: "vibe" },
  { name: "B&W", id: "bw" },
  { name: "Sepia", id: "sepia" },
  { name: "Vivid", id: "vivid" },
];

const CROP_RATIOS = [
  { name: "Free", ratio: null },
  { name: "1:1", ratio: 1 },
  { name: "4:5", ratio: 4/5 },
  { name: "16:9", ratio: 16/9 },
  { name: "9:16", ratio: 9/16 },
];

export function ImageEditor({ isOpen, onClose, imageUrl, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filterCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  
  const [adjustments, setAdjustments] = useState<Adjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    vignette: 0,
  });
  
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showCropTool, setShowCropTool] = useState(false);
  const [cropRatio, setCropRatio] = useState<number | null>(null);
  
  // Undo/Redo state
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [currentTab, setCurrentTab] = useState('filters');

  // Load image on mount
  useEffect(() => {
    if (!isOpen) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      originalImageRef.current = img;
      applyEdits();
    };
    img.src = imageUrl;
  }, [isOpen, imageUrl]);

  // Save state to history
  const saveToHistory = () => {
    const newState: EditorState = {
      adjustments: { ...adjustments },
      selectedFilter,
      filterIntensity,
      rotation,
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setAdjustments(prevState.adjustments);
      setSelectedFilter(prevState.selectedFilter);
      setFilterIntensity(prevState.filterIntensity);
      setRotation(prevState.rotation);
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setAdjustments(nextState.adjustments);
      setSelectedFilter(nextState.selectedFilter);
      setFilterIntensity(nextState.filterIntensity);
      setRotation(nextState.rotation);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Apply all edits to canvas
  const applyEdits = () => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = img.width;
    canvas.height = img.height;

    // Apply rotation
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    // Apply adjustments and filters
    let filterStr = "";
    
    if (adjustments.brightness !== 0) {
      filterStr += `brightness(${100 + adjustments.brightness}%) `;
    }
    if (adjustments.contrast !== 0) {
      filterStr += `contrast(${100 + adjustments.contrast}%) `;
    }
    if (adjustments.saturation !== 0) {
      filterStr += `saturate(${100 + adjustments.saturation}%) `;
    }
    
    // Apply selected filter
    if (selectedFilter !== "none") {
      const filterEffects = getFilterEffect(selectedFilter);
      filterStr += filterEffects;
    }

    // Apply filter to canvas
    if (filterStr) {
      ctx.filter = filterStr;
      ctx.drawImage(img, 0, 0);
      ctx.filter = "none";
    }

    // Apply vignette
    if (adjustments.vignette > 0) {
      applyVignette(ctx, canvas.width, canvas.height, adjustments.vignette);
    }
  };

  const getFilterEffect = (filterId: string): string => {
    const intensity = filterIntensity / 100;
    
    switch (filterId) {
      case "warm":
        return `sepia(${20 * intensity}%) saturate(${120 * intensity}%) `;
      case "cool":
        return `hue-rotate(${-20 * intensity}deg) saturate(${110 * intensity}%) `;
      case "retro":
        return `sepia(${40 * intensity}%) contrast(${110 * intensity}%) `;
      case "fade":
        return `contrast(${90 * intensity}%) brightness(${105 * intensity}%) `;
      case "vibe":
        return `saturate(${150 * intensity}%) contrast(${105 * intensity}%) `;
      case "bw":
        return `grayscale(${100 * intensity}%) `;
      case "sepia":
        return `sepia(${100 * intensity}%) `;
      case "vivid":
        return `saturate(${150 * intensity}%) contrast(${110 * intensity}%) `;
      default:
        return "";
    }
  };

  const applyVignette = (ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) => {
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2
    );
    gradient.addColorStop(0, `rgba(0,0,0,0)`);
    gradient.addColorStop(1, `rgba(0,0,0,${intensity / 100})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  // Re-apply edits whenever adjustments change
  useEffect(() => {
    if (isOpen) {
      applyEdits();
    }
  }, [adjustments, selectedFilter, filterIntensity, rotation, isOpen]);

  const handleAdjustmentChange = (key: keyof Adjustments, value: number[]) => {
    setAdjustments(prev => ({ ...prev, [key]: value[0] }));
    saveToHistory();
  };

  const handleReset = () => {
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      vignette: 0,
    });
    setSelectedFilter("none");
    setFilterIntensity(100);
    setRotation(0);
    saveToHistory();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      onSave(url);
      onClose();
    }, "image/jpeg", 0.95);
  };

  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  // Show crop tool if active
  if (showCropTool) {
    return (
      <CropTool
        imageUrl={imageUrl}
        aspectRatio={cropRatio}
        onCrop={(croppedUrl) => {
          // Update image with cropped version
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            originalImageRef.current = img;
            applyEdits();
          };
          img.src = croppedUrl;
          setShowCropTool(false);
        }}
        onCancel={() => setShowCropTool(false)}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full w-full h-full max-h-screen p-0 gap-0 rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold">Edit Image</h2>
          <Button size="sm" onClick={handleSave} className="bg-primary">
            <Check className="h-4 w-4 mr-1" />
            Done
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas Preview */}
          <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Bottom Controls */}
          <div className="bg-background border-t">
            {/* Quick Actions */}
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBefore(!showBefore)}
                className="text-xs"
              >
                {showBefore ? "Show Edited" : "Show Original"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs text-destructive"
              >
                Reset All
              </Button>
            </div>

            {/* Tabs */}
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full rounded-none border-b bg-background">
                <TabsTrigger value="adjust" className="flex flex-col gap-1 py-3">
                  <Sliders className="h-5 w-5" />
                  <span className="text-[10px]">Adjust</span>
                </TabsTrigger>
                <TabsTrigger value="filters" className="flex flex-col gap-1 py-3">
                  <Wand2 className="h-5 w-5" />
                  <span className="text-[10px]">Filters</span>
                </TabsTrigger>
                <TabsTrigger value="crop" className="flex flex-col gap-1 py-3">
                  <Crop className="h-5 w-5" />
                  <span className="text-[10px]">Crop</span>
                </TabsTrigger>
                <TabsTrigger value="more" className="flex flex-col gap-1 py-3">
                  <Layers className="h-5 w-5" />
                  <span className="text-[10px]">Effects</span>
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                {/* Adjustments Tab */}
                <TabsContent value="adjust" className="p-4 space-y-6 m-0">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Brightness</label>
                      <Slider
                        value={[adjustments.brightness]}
                        onValueChange={(v) => handleAdjustmentChange("brightness", v)}
                        min={-100}
                        max={100}
                        step={1}
                      />
                      <span className="text-xs text-muted-foreground">{adjustments.brightness}</span>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Contrast</label>
                      <Slider
                        value={[adjustments.contrast]}
                        onValueChange={(v) => handleAdjustmentChange("contrast", v)}
                        min={-100}
                        max={100}
                        step={1}
                      />
                      <span className="text-xs text-muted-foreground">{adjustments.contrast}</span>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Saturation</label>
                      <Slider
                        value={[adjustments.saturation]}
                        onValueChange={(v) => handleAdjustmentChange("saturation", v)}
                        min={-100}
                        max={100}
                        step={1}
                      />
                      <span className="text-xs text-muted-foreground">{adjustments.saturation}</span>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Vignette</label>
                      <Slider
                        value={[adjustments.vignette]}
                        onValueChange={(v) => handleAdjustmentChange("vignette", v)}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <span className="text-xs text-muted-foreground">{adjustments.vignette}</span>
                    </div>
                  </div>
                </TabsContent>

                {/* Filters Tab */}
                <TabsContent value="filters" className="p-4 space-y-4 m-0">
                  <div className="grid grid-cols-3 gap-2">
                    {FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          selectedFilter === filter.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {filter.name}
                      </button>
                    ))}
                  </div>

                  {selectedFilter !== "none" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Filter Intensity</label>
                      <Slider
                        value={[filterIntensity]}
                        onValueChange={(v) => setFilterIntensity(v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <span className="text-xs text-muted-foreground">{filterIntensity}%</span>
                    </div>
                  )}
                </TabsContent>

                {/* Crop & Rotate Tab */}
                <TabsContent value="crop" className="p-4 space-y-5 m-0">
                  {/* Crop Button */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Crop & Resize</label>
                    <Button
                      onClick={() => setShowCropTool(true)}
                      className="w-full bg-primary"
                      size="lg"
                    >
                      <Crop className="h-5 w-5 mr-2" />
                      Open Crop Tool
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Interactive crop with grid overlay
                    </p>
                  </div>

                  {/* Aspect Ratio Selection */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CROP_RATIOS.map((ratio) => (
                        <button
                          key={ratio.name}
                          onClick={() => setCropRatio(ratio.ratio)}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            cropRatio === ratio.ratio
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {ratio.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rotate */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Rotate</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleRotate(-90)}
                        className="h-12"
                      >
                        <RotateCw className="h-5 w-5 mr-2 scale-x-[-1]" />
                        90° Left
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRotate(90)}
                        className="h-12"
                      >
                        <RotateCw className="h-5 w-5 mr-2" />
                        90° Right
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* More Tools Tab */}
                <TabsContent value="more" className="p-4 space-y-6 m-0">
                  {/* Blur Tools */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Blur & Focus</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setBlurMode('none')}
                        className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                          blurMode === 'none'
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        None
                      </button>
                      <button
                        onClick={() => setBlurMode('full')}
                        className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                          blurMode === 'full'
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Droplet className="h-4 w-4 mx-auto mb-1" />
                        Full Blur
                      </button>
                      <button
                        onClick={() => setBlurMode('selective')}
                        className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                          blurMode === 'selective'
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        Selective
                      </button>
                    </div>
                    {blurMode !== 'none' && (
                      <div className="space-y-2">
                        <Slider
                          value={[blurAmount]}
                          onValueChange={(v) => setBlurAmount(v[0])}
                          min={0}
                          max={20}
                          step={1}
                        />
                        <span className="text-xs text-muted-foreground">Blur: {blurAmount}px</span>
                      </div>
                    )}
                  </div>

                  {/* Text Tool */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Text Overlay</label>
                    <Button
                      onClick={handleAddText}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <TextIcon className="h-4 w-4 mr-2" />
                      Add Text
                    </Button>
                    
                    {textItems.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {textItems.map((textItem) => (
                          <div
                            key={textItem.id}
                            className={`p-2 border rounded-lg flex items-center justify-between ${
                              selectedTextId === textItem.id ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                            onClick={() => setSelectedTextId(textItem.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{textItem.text}</p>
                              <div className="flex gap-2 mt-1">
                                <input
                                  type="color"
                                  value={textItem.color}
                                  onChange={(e) => handleUpdateText(textItem.id, { color: e.target.value })}
                                  className="h-6 w-6 rounded cursor-pointer"
                                />
                                <Input
                                  type="number"
                                  value={textItem.fontSize}
                                  onChange={(e) => handleUpdateText(textItem.id, { fontSize: parseInt(e.target.value) })}
                                  className="h-6 w-16 text-xs"
                                  min={12}
                                  max={100}
                                />
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteText(textItem.id);
                              }}
                              className="ml-2 p-1 hover:bg-destructive/10 rounded"
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Draw Tools */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Draw & Markup</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setDrawMode('pen')}
                        className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                          drawMode === 'pen'
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Pencil className="h-4 w-4 mx-auto mb-1" />
                        Pen
                      </button>
                      <button
                        onClick={() => setDrawMode('eraser')}
                        className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                          drawMode === 'eraser'
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Eraser className="h-4 w-4 mx-auto mb-1" />
                        Eraser
                      </button>
                      <button
                        onClick={() => setDrawMode('none')}
                        className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                          drawMode === 'none'
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        None
                      </button>
                    </div>
                    {drawMode !== 'none' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs">Color:</label>
                          <input
                            type="color"
                            value={drawColor}
                            onChange={(e) => setDrawColor(e.target.value)}
                            className="h-8 w-16 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-xs">Size: {drawSize}px</label>
                          <Slider
                            value={[drawSize]}
                            onValueChange={(v) => setDrawSize(v[0])}
                            min={1}
                            max={50}
                            step={1}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Overlays */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Overlays & Effects</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOverlayType('none')}
                        className={`p-2 rounded-lg border-2 text-xs font-medium ${
                          overlayType === 'none'
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        None
                      </button>
                      <button
                        onClick={() => setOverlayType('gradient')}
                        className={`p-2 rounded-lg border-2 text-xs font-medium ${
                          overlayType === 'gradient'
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Sparkles className="h-4 w-4 mx-auto mb-1" />
                        Gradient
                      </button>
                      <button
                        onClick={() => setOverlayType('lightleak')}
                        className={`p-2 rounded-lg border-2 text-xs font-medium ${
                          overlayType === 'lightleak'
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        Light Leak
                      </button>
                      <button
                        onClick={() => setOverlayType('frame')}
                        className={`p-2 rounded-lg border-2 text-xs font-medium ${
                          overlayType === 'frame'
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Square className="h-4 w-4 mx-auto mb-1" />
                        Frame
                      </button>
                    </div>
                    {overlayType !== 'none' && (
                      <div className="space-y-2">
                        <label className="text-xs">Intensity</label>
                        <Slider
                          value={[overlayIntensity]}
                          onValueChange={(v) => setOverlayIntensity(v[0])}
                          min={0}
                          max={100}
                          step={1}
                        />
                        <span className="text-xs text-muted-foreground">{overlayIntensity}%</span>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
