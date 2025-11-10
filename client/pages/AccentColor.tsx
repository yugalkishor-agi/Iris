import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../src/config/firebase";

const colors = [
  { id: "purple", name: "Purple", value: "#9333ea", gradient: "from-purple-600 to-purple-400" },
  { id: "blue", name: "Blue", value: "#3b82f6", gradient: "from-blue-600 to-blue-400" },
  { id: "green", name: "Green", value: "#10b981", gradient: "from-green-600 to-green-400" },
  { id: "pink", name: "Pink", value: "#ec4899", gradient: "from-pink-600 to-pink-400" },
  { id: "orange", name: "Orange", value: "#f97316", gradient: "from-orange-600 to-orange-400" },
  { id: "red", name: "Red", value: "#ef4444", gradient: "from-red-600 to-red-400" },
  { id: "yellow", name: "Yellow", value: "#eab308", gradient: "from-yellow-600 to-yellow-400" },
  { id: "teal", name: "Teal", value: "#14b8a6", gradient: "from-teal-600 to-teal-400" },
];

export default function AccentColor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedColor, setSelectedColor] = useState("purple");

  useEffect(() => {
    if (user?.settings?.accentColor) {
      setSelectedColor(user.settings.accentColor);
    }
  }, [user]);

  const handleSelectColor = async (colorId: string) => {
    if (!user) return;
    
    try {
      setSelectedColor(colorId);
      const userRef = doc(db, "users", user.userId);
      await updateDoc(userRef, {
        "settings.accentColor": colorId,
      });
      
      toast({
        title: "Accent color updated",
        description: "Your new color theme has been applied",
      });
    } catch (error) {
      console.error("Failed to update accent color:", error);
      toast({
        title: "Error",
        description: "Failed to update color",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Accent Color</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <p className="text-sm text-muted-foreground">
          Choose a color that will be used for buttons, links, and highlights throughout the app
        </p>

        <div className="grid grid-cols-2 gap-4">
          {colors.map((color) => (
            <button
              key={color.id}
              onClick={() => handleSelectColor(color.id)}
              className={`relative p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
                selectedColor === color.id ? "border-foreground shadow-lg" : "border-transparent"
              }`}
            >
              <div className={`h-24 rounded-xl bg-gradient-to-br ${color.gradient} mb-3 shadow-md`} />
              <div className="font-semibold text-center">{color.name}</div>
              {selectedColor === color.id && (
                <div className="absolute top-3 right-3 p-1 bg-background rounded-full">
                  <Check className="h-5 w-5 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Preview</h3>
          <div className="space-y-3">
            <Button className="w-full">Primary Button</Button>
            <Button variant="outline" className="w-full">Outline Button</Button>
            <div className="flex gap-2">
              <div className="h-10 w-10 rounded-full" style={{ backgroundColor: colors.find(c => c.id === selectedColor)?.value }} />
              <div className="h-10 w-10 rounded-full" style={{ backgroundColor: colors.find(c => c.id === selectedColor)?.value, opacity: 0.7 }} />
              <div className="h-10 w-10 rounded-full" style={{ backgroundColor: colors.find(c => c.id === selectedColor)?.value, opacity: 0.4 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
