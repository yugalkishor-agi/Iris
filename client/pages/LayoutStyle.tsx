import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Check, Layout, Grid3x3, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../src/config/firebase";

const layouts = [
  { id: "default", name: "Default", icon: Layout, description: "Classic feed layout" },
  { id: "grid", name: "Grid View", icon: Grid3x3, description: "Compact grid display" },
  { id: "list", name: "List View", icon: List, description: "Detailed list format" },
];

export default function LayoutStyle() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState("default");

  useEffect(() => {
    if (user?.settings?.layoutStyle) {
      setSelected(user.settings.layoutStyle);
    }
  }, [user]);

  const handleSelect = async (id: string) => {
    if (!user) return;
    
    try {
      setSelected(id);
      const userRef = doc(db, "users", user.userId);
      await updateDoc(userRef, {
        "settings.layoutStyle": id,
      });
      
      toast({
        title: "Layout updated",
        description: `Switched to ${layouts.find(l => l.id === id)?.name}`,
      });
    } catch (error) {
      console.error("Failed to update layout:", error);
      toast({
        title: "Error",
        description: "Failed to update layout",
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
          <h1 className="text-lg font-semibold">Layout Style</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {layouts.map((layout) => (
          <button
            key={layout.id}
            onClick={() => handleSelect(layout.id)}
            className={`w-full p-4 border-2 rounded-xl transition-all text-left ${
              selected === layout.id ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <layout.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{layout.name}</div>
                <p className="text-sm text-muted-foreground">{layout.description}</p>
              </div>
              {selected === layout.id && <Check className="h-5 w-5 text-primary" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
