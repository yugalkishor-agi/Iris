import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, Type, AlignLeft, AlignCenter, AlignRight, Check } from "lucide-react";

const fonts = ["Inter", "Roboto", "Playfair", "Montserrat", "Pacifico"];
const colors = ["#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"];

interface TextOverlay {
  text: string;
  font: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  alignment: "left" | "center" | "right";
  x: number;
  y: number;
}

export default function GlimpseTextEditor() {
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [currentText, setCurrentText] = useState<TextOverlay>({
    text: "",
    font: "Inter",
    fontSize: 24,
    color: "#FFFFFF",
    backgroundColor: "#000000",
    backgroundOpacity: 50,
    alignment: "center",
    x: 50,
    y: 50,
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleAddText = () => {
    if (currentText.text.trim()) {
      setTextOverlays([...textOverlays, { ...currentText }]);
      setCurrentText({
        ...currentText,
        text: "",
        y: currentText.y + 10,
      });
      setIsEditing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <Link to="/story-create" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Add Text</h1>
          <Button size="sm" onClick={handleAddText}>
            <Check className="h-4 w-4 mr-2" />
            Done
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-muted flex items-center justify-center p-4 relative overflow-hidden">
        <div className="relative w-full max-w-md aspect-[9/16] bg-background rounded-lg overflow-hidden">
          {/* Background Image/Video Placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />

          {/* Text Overlays */}
          {textOverlays.map((overlay, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                transform: "translate(-50%, -50%)",
                fontFamily: overlay.font,
                fontSize: `${overlay.fontSize}px`,
                color: overlay.color,
                textAlign: overlay.alignment,
                maxWidth: "80%",
              }}
            >
              <div
                style={{
                  backgroundColor: overlay.backgroundColor,
                  opacity: overlay.backgroundOpacity / 100,
                  padding: "8px 16px",
                  borderRadius: "4px",
                }}
              />
              <div style={{ position: "absolute", inset: 0, padding: "8px 16px" }}>
                {overlay.text}
              </div>
            </div>
          ))}

          {/* Current Text Preview */}
          {isEditing && currentText.text && (
            <div
              style={{
                position: "absolute",
                left: `${currentText.x}%`,
                top: `${currentText.y}%`,
                transform: "translate(-50%, -50%)",
                fontFamily: currentText.font,
                fontSize: `${currentText.fontSize}px`,
                color: currentText.color,
                textAlign: currentText.alignment,
                maxWidth: "80%",
              }}
            >
              <div
                style={{
                  backgroundColor: currentText.backgroundColor,
                  opacity: currentText.backgroundOpacity / 100,
                  padding: "8px 16px",
                  borderRadius: "4px",
                }}
              />
              <div style={{ position: "absolute", inset: 0, padding: "8px 16px" }}>
                {currentText.text}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Tools */}
      <div className="border-t bg-background p-4 space-y-4 max-h-80 overflow-y-auto">
        {/* Text Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Your Text</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentText.text}
              onChange={(e) => {
                setCurrentText({ ...currentText, text: e.target.value });
                setIsEditing(true);
              }}
              placeholder="Type something..."
              className="flex-1 px-3 py-2 border rounded-lg bg-background"
            />
            <Button variant="ghost" size="icon">
              <Type className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Font Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Font</label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {fonts.map((font) => (
              <Button
                key={font}
                variant={currentText.font === font ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentText({ ...currentText, font })}
                style={{ fontFamily: font }}
              >
                {font}
              </Button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Size</label>
            <span className="text-sm text-muted-foreground">{currentText.fontSize}px</span>
          </div>
          <Slider
            value={[currentText.fontSize]}
            onValueChange={(value) => setCurrentText({ ...currentText, fontSize: value[0] })}
            min={12}
            max={72}
            step={2}
          />
        </div>

        {/* Text Color */}
        <div>
          <label className="text-sm font-medium mb-2 block">Text Color</label>
          <div className="flex gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentText({ ...currentText, color })}
                className={`w-10 h-10 rounded-full border-2 ${
                  currentText.color === color ? "border-primary" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Background Color */}
        <div>
          <label className="text-sm font-medium mb-2 block">Background</label>
          <div className="flex gap-2 mb-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentText({ ...currentText, backgroundColor: color })}
                className={`w-10 h-10 rounded-full border-2 ${
                  currentText.backgroundColor === color ? "border-primary" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Opacity</span>
            <span className="text-sm text-muted-foreground">{currentText.backgroundOpacity}%</span>
          </div>
          <Slider
            value={[currentText.backgroundOpacity]}
            onValueChange={(value) => setCurrentText({ ...currentText, backgroundOpacity: value[0] })}
            min={0}
            max={100}
            step={5}
          />
        </div>

        {/* Alignment */}
        <div>
          <label className="text-sm font-medium mb-2 block">Alignment</label>
          <div className="flex gap-2">
            <Button
              variant={currentText.alignment === "left" ? "default" : "outline"}
              size="icon"
              onClick={() => setCurrentText({ ...currentText, alignment: "left" })}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={currentText.alignment === "center" ? "default" : "outline"}
              size="icon"
              onClick={() => setCurrentText({ ...currentText, alignment: "center" })}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant={currentText.alignment === "right" ? "default" : "outline"}
              size="icon"
              onClick={() => setCurrentText({ ...currentText, alignment: "right" })}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
