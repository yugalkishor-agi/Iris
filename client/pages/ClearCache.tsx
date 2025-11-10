import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trash2, Image, Video, FileText, Database, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CacheItem {
  id: string;
  name: string;
  description: string;
  size: string;
  icon: any;
}

const cacheItems: CacheItem[] = [
  {
    id: "images",
    name: "Image Cache",
    description: "Cached profile pictures and posts",
    size: "124 MB",
    icon: Image,
  },
  {
    id: "videos",
    name: "Video Cache",
    description: "Cached glimpses and reels",
    size: "89 MB",
    icon: Video,
  },
  {
    id: "temp",
    name: "Temporary Files",
    description: "Drafts and unsent media",
    size: "23 MB",
    icon: FileText,
  },
  {
    id: "data",
    name: "App Data",
    description: "Settings and preferences",
    size: "9 MB",
    icon: Database,
  },
];

export default function ClearCache() {
  const { toast } = useToast();
  const [clearing, setClearing] = useState<string | null>(null);
  const [cleared, setCleared] = useState<string[]>([]);

  const handleClear = async (id: string) => {
    setClearing(id);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setClearing(null);
    setCleared([...cleared, id]);
    toast({
      title: "Cache cleared",
      description: "Storage space has been freed up",
    });
  };

  const handleClearAll = async () => {
    setClearing("all");
    await new Promise(resolve => setTimeout(resolve, 2000));
    setClearing(null);
    setCleared(cacheItems.map(item => item.id));
    toast({
      title: "All cache cleared",
      description: "245 MB of storage space freed up",
    });
  };

  const totalSize = cacheItems.reduce((sum, item) => {
    if (!cleared.includes(item.id)) {
      return sum + parseInt(item.size);
    }
    return sum;
  }, 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Clear Cache</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Total Cache Size</h2>
            <span className="text-2xl font-bold text-primary">{totalSize} MB</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Clearing cache will free up storage space. Your login and settings will not be affected.
          </p>
        </div>

        <div className="space-y-3">
          {cacheItems.map((item) => {
            const isCleared = cleared.includes(item.id);
            const isClearing = clearing === item.id || clearing === "all";

            return (
              <div
                key={item.id}
                className="border rounded-lg p-4 flex items-center gap-4 hover:bg-accent transition-colors"
              >
                <div className="p-3 bg-primary/10 rounded-lg">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isCleared ? "Cleared" : item.size}
                  </p>
                </div>
                <Button
                  variant={isCleared ? "outline" : "destructive"}
                  size="sm"
                  onClick={() => handleClear(item.id)}
                  disabled={isClearing || isCleared}
                >
                  {isClearing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCleared ? (
                    "Cleared"
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleClearAll}
          disabled={clearing !== null || cleared.length === cacheItems.length}
        >
          {clearing === "all" ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Clearing All...
            </>
          ) : cleared.length === cacheItems.length ? (
            "All Cache Cleared"
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Cache
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
