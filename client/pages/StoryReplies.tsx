import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const options = [
  { id: "everyone", name: "Everyone", description: "Anyone can reply to your glimpses" },
  { id: "following", name: "People You Follow", description: "Only people you follow can reply" },
  { id: "followers", name: "Your Followers", description: "Only your followers can reply" },
  { id: "off", name: "Off", description: "No one can reply to your glimpses" },
];

export default function StoryReplies() {
  const { toast } = useToast();
  const [selected, setSelected] = useState("everyone");

  const handleSelect = (id: string) => {
    setSelected(id);
    const option = options.find(o => o.id === id);
    toast({
      title: "Story replies updated",
      description: option?.description || "Settings saved",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Story Replies</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Control who can reply to your glimpses and stories
        </p>

        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={`w-full text-left p-4 border-2 rounded-xl transition-all ${
              selected === option.id ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold">{option.name}</div>
                <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
              </div>
              {selected === option.id && (
                <Check className="h-5 w-5 text-primary flex-shrink-0 ml-3" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
