import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fontSizes = [
  { id: "small", name: "Small", scale: 0.875, description: "Compact text" },
  { id: "medium", name: "Medium", scale: 1, description: "Default size" },
  { id: "large", name: "Large", scale: 1.125, description: "Easier to read" },
  { id: "x-large", name: "Extra Large", scale: 1.25, description: "Maximum readability" },
];

export default function FontSize() {
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState("medium");

  const handleSelectSize = (sizeId: string) => {
    setSelectedSize(sizeId);
    toast({
      title: "Font size updated",
      description: "Text size has been changed throughout the app",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Font Size</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="space-y-4">
          {fontSizes.map((size) => (
            <button
              key={size.id}
              onClick={() => handleSelectSize(size.id)}
              className={`w-full text-left p-6 rounded-xl border-2 transition-all hover:bg-accent ${
                selectedSize === size.id ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold" style={{ fontSize: `${size.scale}rem` }}>
                  {size.name}
                </h3>
                {selectedSize === size.id && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-sm">{size.description}</p>
              <div className="mt-4 space-y-1" style={{ fontSize: `${size.scale}rem` }}>
                <p>The quick brown fox jumps over the lazy dog</p>
                <p className="text-muted-foreground">Sample text preview</p>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Note</h3>
          <p className="text-sm text-muted-foreground">
            Font size changes will apply to all text throughout the app for better readability
          </p>
        </div>
      </div>
    </div>
  );
}
