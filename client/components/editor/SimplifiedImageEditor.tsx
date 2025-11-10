import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ImprovedCropTool } from "./ImprovedCropTool";
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
}

const FILTERS = [
  { name: "Normal", id: "none" },
  { name: "Warm", id: "warm" },
  { name: "Cool", id: "cool" },
  { name: "Retro", id: "retro" },
  { name: "Fade", id: "fade" },
  { name: "Vibe", id: "vibe" },
  { name: "B&W", id: "bw" },
  { name: "Sepia", id: "sepia" },
  { name: "Vivid", id: "vivid" },
];

export function SimplifiedImageEditor({ isOpen, onClose, imageUrl, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filterPreviewCanvasRefs = useRef<{ [key: string]: HTMLCanvasElement }>({});
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  
  const [adjustments, setAdjustments] = useState<Adjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    vignette: 0,
  });
  
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [showCropTool, setShowCropTool] = useState(false);
  
  // Undo/Redo state
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [currentTab, setCurrentTab] = useState('filters');

  // Load image
  useEffect(() => {
    if (!isOpen) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      originalImageRef.current = img;
      applyEdits();
      generateFilterPreviews();
    };
    img.src = imageUrl;
  }, [isOpen, imageUrl]);

  // Generate filter preview thumbnails
  const generateFilterPreviews = () => {
    const img = originalImageRef.current;
    if (!img) return;

    FILTERS.forEach(filter => {
      const canvas = document.createElement('canvas');
      const size = 100;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate crop to center square
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      // Draw cropped image
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      // Apply filter
      if (filter.id !== 'none') {
        ctx.filter = getFilterEffect(filter.id, 100);
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = 'none';
      }

      filterPreviewCanvasRefs.current[filter.id] = canvas;
    });
  };

  // Save state to history
  const saveToHistory = () => {
    const newState: EditorState = {
      adjustments: { ...adjustments },
      selectedFilter,
      filterIntensity,
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

    canvas.width = img.width;
    canvas.height = img.height;

    // Draw original image
    ctx.drawImage(img, 0, 0);

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
      filterStr += getFilterEffect(selectedFilter, filterIntensity);
    }

    if (filterStr) {
      ctx.filter = filterStr;
      ctx.drawImage(img, 0, 0);
      ctx.filter = "none";
    }

    // Apply vignette
    if (adjustments.vignette > 0) {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      );
      gradient.addColorStop(0, `rgba(0,0,0,0)`);
      gradient.addColorStop(1, `rgba(0,0,0,${adjustments.vignette / 100})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const getFilterEffect = (filterId: string, intensity: number): string => {
    const i = intensity / 100;
    
    switch (filterId) {
      case "warm":
        return `sepia(${20 * i}%) saturate(${120 * i}%) `;
      case "cool":
        return `hue-rotate(${-20 * i}deg) saturate(${110 * i}%) `;
      case "retro":
        return `sepia(${40 * i}%) contrast(${110 * i}%) `;
      case "fade":
        return `contrast(${90 * i}%) brightness(${105 * i}%) `;
      case "vibe":
        return `saturate(${150 * i}%) contrast(${105 * i}%) `;
      case "bw":
        return `grayscale(${100 * i}%) `;
      case "sepia":
        return `sepia(${100 * i}%) `;
      case "vivid":
        return `saturate(${150 * i}%) contrast(${110 * i}%) `;
      default:
        return "";
    }
  };

  // Re-apply edits whenever changes
  useEffect(() => {
    if (isOpen) {
      applyEdits();
    }
  }, [adjustments, selectedFilter, filterIntensity, isOpen]);

  const handleAdjustmentChange = (key: keyof Adjustments, value: number[]) => {
    setAdjustments(prev => ({ ...prev, [key]: value[0] }));
    saveToHistory();
  };

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);
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

  // Show crop tool if active
  if (showCropTool) {
    return (
      <ImprovedCropTool
        imageUrl={imageUrl}
        aspectRatio={null}
        onCrop={(croppedUrl) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            originalImageRef.current = img;
            applyEdits();
            generateFilterPreviews();
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
        <DialogTitle className="sr-only">Edit Image</DialogTitle>
        
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b bg-background">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-9">
            <X className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="h-9"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="h-9"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <Button size="sm" onClick={handleSave} className="bg-primary h-9">
            <Check className="h-4 w-4 mr-1.5" />
            Done
          </Button>
        </div>

        {/* Canvas Preview */}
        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Bottom Tabs */}
        <div className="bg-background border-t">
          {/* Tab Buttons */}
          <div className="flex border-b">
            <button
              onClick={() => setCurrentTab('filters')}
              className={`flex-1 flex flex-col items-center gap-1 py-3 border-b-2 transition-colors ${
                currentTab === 'filters'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              <Wand2 className="h-5 w-5" />
              <span className="text-xs font-medium">Filters</span>
            </button>
            
            <button
              onClick={() => setCurrentTab('adjust')}
              className={`flex-1 flex flex-col items-center gap-1 py-3 border-b-2 transition-colors ${
                currentTab === 'adjust'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              <Sliders className="h-5 w-5" />
              <span className="text-xs font-medium">Adjust</span>
            </button>
            
            <button
              onClick={() => setCurrentTab('crop')}
              className={`flex-1 flex flex-col items-center gap-1 py-3 border-b-2 transition-colors ${
                currentTab === 'crop'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              <CropIcon className="h-5 w-5" />
              <span className="text-xs font-medium">Crop</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {/* Filters Tab */}
            {currentTab === 'filters' && (
              <div className="space-y-4">
                {/* Horizontal Scrollable Filter List */}
                <div className="overflow-x-auto -mx-4 px-4">
                  <div className="flex gap-3 pb-2">
                    {FILTERS.map((filter) => {
                      const previewCanvas = filterPreviewCanvasRefs.current[filter.id];
                      return (
                        <button
                          key={filter.id}
                          onClick={() => handleFilterSelect(filter.id)}
                          className="flex-shrink-0 flex flex-col items-center gap-2"
                        >
                          <div className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            selectedFilter === filter.id
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-border'
                          }`}>
                            {previewCanvas && (
                              <img
                                src={previewCanvas.toDataURL()}
                                alt={filter.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <span className={`text-xs font-medium ${
                            selectedFilter === filter.id ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            {filter.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter Intensity Slider */}
                {selectedFilter !== 'none' && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Intensity</label>
                      <span className="text-xs text-muted-foreground">{filterIntensity}%</span>
                    </div>
                    <Slider
                      value={[filterIntensity]}
                      onValueChange={(v) => {
                        setFilterIntensity(v[0]);
                        saveToHistory();
                      }}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Adjust Tab */}
            {currentTab === 'adjust' && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Brightness</label>
                    <span className="text-xs text-muted-foreground">{adjustments.brightness}</span>
                  </div>
                  <Slider
                    value={[adjustments.brightness]}
                    onValueChange={(v) => handleAdjustmentChange("brightness", v)}
                    min={-100}
                    max={100}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Contrast</label>
                    <span className="text-xs text-muted-foreground">{adjustments.contrast}</span>
                  </div>
                  <Slider
                    value={[adjustments.contrast]}
                    onValueChange={(v) => handleAdjustmentChange("contrast", v)}
                    min={-100}
                    max={100}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Saturation</label>
                    <span className="text-xs text-muted-foreground">{adjustments.saturation}</span>
                  </div>
                  <Slider
                    value={[adjustments.saturation]}
                    onValueChange={(v) => handleAdjustmentChange("saturation", v)}
                    min={-100}
                    max={100}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Vignette</label>
                    <span className="text-xs text-muted-foreground">{adjustments.vignette}</span>
                  </div>
                  <Slider
                    value={[adjustments.vignette]}
                    onValueChange={(v) => handleAdjustmentChange("vignette", v)}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            )}

            {/* Crop Tab */}
            {currentTab === 'crop' && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground text-center">
                  Crop and resize your image with an interactive grid
                </p>
                <Button
                  onClick={() => setShowCropTool(true)}
                  className="w-full bg-primary h-12"
                  size="lg"
                >
                  <CropIcon className="h-5 w-5 mr-2" />
                  Open Crop Tool
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
