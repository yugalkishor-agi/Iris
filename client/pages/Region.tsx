import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, MapPin, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../src/config/firebase";

export default function Region() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showTrending, setShowTrending] = useState(true);
  const [showLocation, setShowLocation] = useState(true);

  useEffect(() => {
    if (user?.settings?.showTrending !== undefined) {
      setShowTrending(user.settings.showTrending);
    }
    if (user?.settings?.showLocationContent !== undefined) {
      setShowLocation(user.settings.showLocationContent);
    }
  }, [user]);

  const handleToggle = async (key: string, value: boolean) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.userId);
      await updateDoc(userRef, { [`settings.${key}`]: value });
    } catch (error) {
      console.error("Failed to update setting:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Region Preferences</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">Show Trending in Your Region</div>
                  <div className="text-sm text-muted-foreground">See local trending posts</div>
                </div>
              </div>
              <Switch checked={showTrending} onCheckedChange={(v) => { setShowTrending(v); handleToggle("showTrending", v); }} />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">Show Location-Based Content</div>
                  <div className="text-sm text-muted-foreground">Posts from nearby</div>
                </div>
              </div>
              <Switch checked={showLocation} onCheckedChange={(v) => { setShowLocation(v); handleToggle("showLocationContent", v); }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
