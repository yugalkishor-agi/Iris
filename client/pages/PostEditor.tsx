import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, Image as ImageIcon, Sliders, RotateCw, Crop, ZoomIn, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

export default function PostEditor() {
  const [selectedImage, setSelectedImage] = useState<string | null>("/placeholder.svg");
  const [filters, setFilters] = useState<ImageFilters>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
  });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [cropMode, setCropMode] = useState(false);

  const handleFilterChange = (key: keyof ImageFilters, value: number[]) => {
    setFilters({ ...filters, [key]: value[0] });
  };

  const handleRotate = () => {
    setRotation((rotation + 90) % 360);
  };

  const handleReset = () => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
    });
    setRotation(0);
    setZoom(100);
  };

  const getImageStyle = () => {
    return {
      filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px)`,
      transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
    };
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <Link to="/post/new" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Edit Photo</h1>
          <Button size="sm">
            <Check className="h-4 w-4 mr-2" />
            Done
          </Button>
        </div>
      </div>

      {/* Image Preview */}
      <div className="flex-1 bg-muted flex items-center justify-center p-4 overflow-hidden">
        {selectedImage ? (
          <div className="relative max-w-full max-h-full">
            <img
              src={selectedImage}
              alt="Preview"
              style={getImageStyle()}
              className="max-w-full max-h-[60vh] object-contain transition-all duration-200"
            />
            {cropMode && (
              <div className="absolute inset-0 border-2 border-dashed border-primary pointer-events-none" />
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Select an image to edit</p>
          </div>
        )}
      </div>

      {/* Editor Tools */}
      <div className="border-t bg-background">
        <Tabs defaultValue="filters" className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
            <TabsTrigger value="filters">
              <Sliders className="h-4 w-4 mr-2" />
              Filters
            </TabsTrigger>
            <TabsTrigger value="adjust">
              <RotateCw className="h-4 w-4 mr-2" />
              Adjust
            </TabsTrigger>
            <TabsTrigger value="crop">
              <Crop className="h-4 w-4 mr-2" />
              Crop
            </TabsTrigger>
          </TabsList>

          {/* Filters Tab */}
          <TabsContent value="filters" className="p-4 space-y-6 max-h-64 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Brightness</label>
                <span className="text-sm text-muted-foreground">{filters.brightness}%</span>
              </div>
              <Slider
                value={[filters.brightness]}
                onValueChange={(value) => handleFilterChange("brightness", value)}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Contrast</label>
                <span className="text-sm text-muted-foreground">{filters.contrast}%</span>
              </div>
              <Slider
                value={[filters.contrast]}
                onValueChange={(value) => handleFilterChange("contrast", value)}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Saturation</label>
                <span className="text-sm text-muted-foreground">{filters.saturation}%</span>
              </div>
              <Slider
                value={[filters.saturation]}
                onValueChange={(value) => handleFilterChange("saturation", value)}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Blur</label>
                <span className="text-sm text-muted-foreground">{filters.blur}px</span>
              </div>
              <Slider
                value={[filters.blur]}
                onValueChange={(value) => handleFilterChange("blur", value)}
                min={0}
                max={10}
                step={0.5}
                className="w-full"
              />
            </div>

            <Button variant="outline" className="w-full" onClick={handleReset}>
              Reset All
            </Button>
          </TabsContent>

          {/* Adjust Tab */}
          <TabsContent value="adjust" className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Rotation</label>
                <span className="text-sm text-muted-foreground">{rotation}°</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4 mr-2" />
                  Rotate 90°
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Zoom</label>
                <span className="text-sm text-muted-foreground">{zoom}%</span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={50}
                max={200}
                step={5}
                className="w-full"
              />
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <ZoomIn className="h-4 w-4" />
                <span>Pinch or scroll to zoom</span>
              </div>
            </div>
          </TabsContent>

          {/* Crop Tab */}
          <TabsContent value="crop" className="p-4 space-y-4">
            <div className="text-sm text-muted-foreground text-center mb-4">
              Select an aspect ratio to crop your image
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => setCropMode(true)}>1:1<br/>Square</Button>
              <Button variant="outline" onClick={() => setCropMode(true)}>4:5<br/>Portrait</Button>
              <Button variant="outline" onClick={() => setCropMode(true)}>16:9<br/>Landscape</Button>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setCropMode(true)}>
              Free Crop
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
