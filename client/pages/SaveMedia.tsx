import { useState } from "react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Download, Image, Video } from "lucide-react";

export default function SaveMedia() {
  const [savePhotos, setSavePhotos] = useState(true);
  const [saveVideos, setSaveVideos] = useState(false);
  const [wifiOnly, setWifiOnly] = useState(true);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Save Chat Media</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <p className="text-sm text-muted-foreground">
          Automatically save media from chats to your device
        </p>

        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">Save Photos</div>
                  <div className="text-sm text-muted-foreground">Auto-save images</div>
                </div>
              </div>
              <Switch checked={savePhotos} onCheckedChange={setSavePhotos} />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">Save Videos</div>
                  <div className="text-sm text-muted-foreground">Auto-save videos</div>
                </div>
              </div>
              <Switch checked={saveVideos} onCheckedChange={setSaveVideos} />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">Wi-Fi Only</div>
                  <div className="text-sm text-muted-foreground">Save only on Wi-Fi</div>
                </div>
              </div>
              <Switch checked={wifiOnly} onCheckedChange={setWifiOnly} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
