import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../src/config/firebase";

const icons = [
  { id: "default", name: "Default", color: "bg-gradient-to-br from-purple-600 to-blue-600" },
  { id: "dark", name: "Dark", color: "bg-gradient-to-br from-gray-900 to-gray-700" },
  { id: "light", name: "Light", color: "bg-gradient-to-br from-white to-gray-100" },
  { id: "pink", name: "Pink", color: "bg-gradient-to-br from-pink-600 to-rose-600" },
  { id: "orange", name: "Orange", color: "bg-gradient-to-br from-orange-600 to-red-600" },
  { id: "green", name: "Green", color: "bg-gradient-to-br from-green-600 to-emerald-600" },
];

export default function AppIcon() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState("default");

  useEffect(() => {
    if (user?.settings?.appIcon) {
      setSelected(user.settings.appIcon);
    }
  }, [user]);

  const handleSelect = async (id: string) => {
    if (!user) return;
    
    try {
      setSelected(id);
      const userRef = doc(db, "users", user.userId);
      await updateDoc(userRef, {
        "settings.appIcon": id,
      });
      
      toast({
        title: "App icon changed",
        description: "Your preference has been saved",
      });
    } catch (error) {
      console.error("Failed to update app icon:", error);
      toast({
        title: "Error",
        description: "Failed to update icon",
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
          <h1 className="text-lg font-semibold">App Icon</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <p className="text-sm text-muted-foreground">Choose your preferred app icon style</p>
        <div className="grid grid-cols-2 gap-4">
          {icons.map((icon) => (
            <button
              key={icon.id}
              onClick={() => handleSelect(icon.id)}
              className={`relative p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
                selected === icon.id ? "border-foreground shadow-lg" : "border-transparent"
              }`}
            >
              <div className={`h-20 w-20 rounded-2xl ${icon.color} mx-auto mb-3 shadow-lg flex items-center justify-center`}>
                <span className="text-3xl font-bold text-white">I</span>
              </div>
              <div className="font-semibold text-center">{icon.name}</div>
              {selected === icon.id && (
                <div className="absolute top-3 right-3 p-1 bg-background rounded-full">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
