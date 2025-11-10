import { useState } from "react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Volume2, Vibrate, Moon, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const sounds = [
  { id: "default", name: "Default" },
  { id: "ding", name: "Ding" },
  { id: "chime", name: "Chime" },
  { id: "bell", name: "Bell" },
  { id: "ping", name: "Ping" },
  { id: "none", name: "None" },
];

export default function NotificationSound() {
  const { toast } = useToast();
  const [selectedSound, setSelectedSound] = useState("default");
  const [vibrate, setVibrate] = useState(true);
  const [doNotDisturb, setDoNotDisturb] = useState(false);

  const handleSoundSelect = (id: string) => {
    setSelectedSound(id);
    toast({
      title: "Sound updated",
      description: `Notification sound changed to ${sounds.find(s => s.id === id)?.name}`,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Sound & Vibration</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Vibrate className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">Vibrate</div>
                  <div className="text-sm text-muted-foreground">Vibrate on notifications</div>
                </div>
              </div>
              <Switch checked={vibrate} onCheckedChange={setVibrate} />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">Do Not Disturb</div>
                  <div className="text-sm text-muted-foreground">Mute all notifications</div>
                </div>
              </div>
              <Switch checked={doNotDisturb} onCheckedChange={setDoNotDisturb} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Volume2 className="h-4 w-4" />
            NOTIFICATION SOUND
          </div>
          {sounds.map((sound) => (
            <button
              key={sound.id}
              onClick={() => handleSoundSelect(sound.id)}
              className={`w-full text-left p-4 border rounded-lg transition-all hover:bg-accent ${
                selectedSound === sound.id ? "border-primary bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{sound.name}</span>
                {selectedSound === sound.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
