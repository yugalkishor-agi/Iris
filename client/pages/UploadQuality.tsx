import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Check, Image, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const qualityOptions = [
  {
    id: "low",
    name: "Data Saver",
    description: "Smaller file size, faster upload",
    icon: Zap,
    details: "~500KB per image • Good for slow connections",
  },
  {
    id: "medium",
    name: "Standard",
    description: "Balanced quality and size",
    icon: Image,
    details: "~1-2MB per image • Recommended",
  },
  {
    id: "high",
    name: "High Quality",
    description: "Best quality, larger files",
    icon: Image,
    details: "~3-5MB per image • Uses more data",
  },
  {
    id: "original",
    name: "Original",
    description: "Uncompressed, maximum quality",
    icon: Image,
    details: "Full resolution • Only on Wi-Fi",
  },
];

export default function UploadQuality() {
  const { toast } = useToast();
  const [selected, setSelected] = useState("medium");

  const handleSelect = (id: string) => {
    setSelected(id);
    toast({
      title: "Upload quality updated",
      description: "Your preference has been saved",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Media Upload Quality</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {qualityOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={`w-full text-left p-4 border-2 rounded-xl transition-all ${
              selected === option.id ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <option.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold">{option.name}</h3>
                  {selected === option.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                <p className="text-xs text-muted-foreground">{option.details}</p>
              </div>
            </div>
          </button>
        ))}

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-600 dark:text-blue-400">
          <strong>Tip:</strong> Choose "Data Saver" when on mobile data to save bandwidth
        </div>
      </div>
    </div>
  );
}
