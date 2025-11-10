import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Sparkles, Zap, TestTube } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../src/config/firebase";

export default function Experimental() {
  const { user } = useAuth();
  const [features, setFeatures] = useState({ aiCaptions: false, advancedFilters: false, betaUI: false });

  useEffect(() => {
    if (user?.settings?.experimentalFeatures) {
      setFeatures(user.settings.experimentalFeatures);
    }
  }, [user]);

  const handleToggle = async (key: string, value: boolean) => {
    if (!user) return;
    
    const newFeatures = { ...features, [key]: value };
    setFeatures(newFeatures);
    
    try {
      const userRef = doc(db, "users", user.userId);
      await updateDoc(userRef, {
        "settings.experimentalFeatures": newFeatures,
      });
    } catch (error) {
      console.error("Failed to update experimental features:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Experimental Features</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <p className="text-sm text-orange-600 dark:text-orange-400">
            <TestTube className="h-4 w-4 inline mr-1" />
            These features are in beta. They may be unstable.
          </p>
        </div>

        {[
          { key: "aiCaptions", icon: Sparkles, name: "AI Captions", desc: "Auto-generate captions" },
          { key: "advancedFilters", icon: Zap, name: "Advanced Filters", desc: "New photo filters" },
          { key: "betaUI", icon: TestTube, name: "Beta UI", desc: "Try new interface" },
        ].map(({ key, icon: Icon, name, desc }) => (
          <div key={key} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">{name}</div>
                  <div className="text-sm text-muted-foreground">{desc}</div>
                </div>
              </div>
              <Switch
                checked={features[key as keyof typeof features]}
                onCheckedChange={(v) => handleToggle(key, v)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
