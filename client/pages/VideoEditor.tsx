import { useState, useRef } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Volume2,
  VolumeX,
  Sparkles,
  Music,
  Type,
  Sticker,
  Download,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const filters = [
  { name: "Normal", class: "" },
  { name: "Bright", class: "brightness-110 contrast-105" },
  { name: "Vintage", class: "sepia-[.3] contrast-110" },
  { name: "Cool", class: "hue-rotate-15 saturate-125" },
  { name: "Warm", class: "hue-rotate-[-15deg] saturate-110" },
  { name: "B&W", class: "grayscale" },
  { name: "Vivid", class: "saturate-150 contrast-110" },
  { name: "Fade", class: "brightness-105 contrast-90 saturate-75" },
];

export default function VideoEditor() {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30); // seconds
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [volume, setVolume] = useState([80]);
  const [trimStart, setTrimStart] = useState([0]);
  const [trimEnd, setTrimEnd] = useState([30]);
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturation, setSaturation] = useState([100]);

  const handleSave = () => {
    toast({
      title: "Video saved!",
      description: "Your edited video has been saved successfully.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Exporting video...",
      description: "Your video is being processed. This may take a moment.",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <PageHeader
        title="Video Editor"
        gradient
        rightElement={
          <Button size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        }
      />

      {/* Video Preview */}
      <div className="flex-1 flex items-center justify-center bg-black/5 p-4">
        <div className="relative w-full max-w-md aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-2xl">
          {/* Placeholder video preview */}
          <div
            className={`w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center ${filters[selectedFilter].class}`}
          >
            <div className="text-white text-center">
              <div className="text-6xl mb-2">🎬</div>
              <p className="text-sm opacity-75">Video Preview</p>
            </div>
          </div>

          {/* Play/Pause Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 hover:bg-white/30"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8 text-white" fill="white" />
              ) : (
                <Play className="h-8 w-8 text-white ml-1" fill="white" />
              )}
            </Button>
          </div>

          {/* Timeline Indicator */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Editing Tools */}
      <div className="border-t bg-background">
        <Tabs defaultValue="filters" className="w-full">
          <TabsList className="w-full grid grid-cols-4 rounded-none border-b">
            <TabsTrigger value="filters">
              <Sparkles className="h-4 w-4 mr-2" />
              Filters
            </TabsTrigger>
            <TabsTrigger value="adjust">
              <RotateCcw className="h-4 w-4 mr-2" />
              Adjust
            </TabsTrigger>
            <TabsTrigger value="trim">
              <Scissors className="h-4 w-4 mr-2" />
              Trim
            </TabsTrigger>
            <TabsTrigger value="audio">
              <Music className="h-4 w-4 mr-2" />
              Audio
            </TabsTrigger>
          </TabsList>

          {/* Filters Tab */}
          <TabsContent value="filters" className="p-4 max-h-[240px] overflow-y-auto">
            <div className="grid grid-cols-4 gap-3">
              {filters.map((filter, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedFilter(index)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`w-full aspect-square rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 ${
                      filter.class
                    } ${
                      selectedFilter === index
                        ? "ring-2 ring-primary ring-offset-2"
                        : "opacity-70"
                    } transition-all`}
                  />
                  <span className="text-xs font-medium">{filter.name}</span>
                  {selectedFilter === index && (
                    <Badge variant="default" className="text-xs px-2 py-0">
                      <Check className="h-3 w-3" />
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Adjust Tab */}
          <TabsContent value="adjust" className="p-4 space-y-6 max-h-[240px] overflow-y-auto">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Brightness</label>
                <span className="text-sm text-muted-foreground">{brightness[0]}%</span>
              </div>
              <Slider
                value={brightness}
                onValueChange={setBrightness}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Contrast</label>
                <span className="text-sm text-muted-foreground">{contrast[0]}%</span>
              </div>
              <Slider
                value={contrast}
                onValueChange={setContrast}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Saturation</label>
                <span className="text-sm text-muted-foreground">{saturation[0]}%</span>
              </div>
              <Slider
                value={saturation}
                onValueChange={setSaturation}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setBrightness([100]);
                setContrast([100]);
                setSaturation([100]);
              }}
            >
              Reset All
            </Button>
          </TabsContent>

          {/* Trim Tab */}
          <TabsContent value="trim" className="p-4 space-y-6 max-h-[240px] overflow-y-auto">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Start Time</label>
                <span className="text-sm text-muted-foreground">{trimStart[0]}s</span>
              </div>
              <Slider
                value={trimStart}
                onValueChange={setTrimStart}
                min={0}
                max={duration}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">End Time</label>
                <span className="text-sm text-muted-foreground">{trimEnd[0]}s</span>
              </div>
              <Slider
                value={trimEnd}
                onValueChange={setTrimEnd}
                min={0}
                max={duration}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Final Duration</p>
              <p className="text-2xl font-bold text-primary">
                {(trimEnd[0] - trimStart[0]).toFixed(1)}s
              </p>
            </div>
          </TabsContent>

          {/* Audio Tab */}
          <TabsContent value="audio" className="p-4 space-y-6 max-h-[240px] overflow-y-auto">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="shrink-0"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <div className="flex-1">
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                  disabled={isMuted}
                />
              </div>
              <span className="text-sm text-muted-foreground w-12 text-right">
                {volume[0]}%
              </span>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full gap-2">
                <Music className="h-4 w-4" />
                Add Background Music
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <Type className="h-4 w-4" />
                Add Voiceover
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom Action Bar */}
        <div className="p-4 border-t flex gap-3">
          <Button variant="outline" className="flex-1" size="lg">
            Cancel
          </Button>
          <Button className="flex-1" size="lg" onClick={handleSave}>
            <Check className="h-5 w-5 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
