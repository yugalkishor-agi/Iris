import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, VolumeX, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MutedChat {
  id: number;
  name: string;
  avatar?: string;
  mutedDate: string;
}

const mockChats: MutedChat[] = [
  { id: 1, name: "Group Chat", mutedDate: "1 day ago" },
  { id: 2, name: "John Doe", mutedDate: "3 days ago" },
];

export default function MutedChats() {
  const { toast } = useToast();
  const [chats, setChats] = useState(mockChats);

  const handleUnmute = (id: number) => {
    setChats(chats.filter(c => c.id !== id));
    toast({
      title: "Chat unmuted",
      description: "You'll receive notifications again",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Muted Chats</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {chats.length > 0 ? (
          <div className="divide-y">
            {chats.map((chat) => (
              <div key={chat.id} className="px-4 py-3 flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={chat.avatar} />
                  <AvatarFallback>{chat.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{chat.name}</div>
                  <div className="text-sm text-muted-foreground">Muted {chat.mutedDate}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleUnmute(chat.id)}>
                  <Volume2 className="h-4 w-4 mr-1" />
                  Unmute
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <VolumeX className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No muted chats</h3>
            <p className="text-sm text-muted-foreground">
              Muted conversations will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
