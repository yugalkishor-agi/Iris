import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Search, Send } from "lucide-react";

interface Chat {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  lastMessage?: string;
}

const mockChats: Chat[] = [
  { id: 1, name: "Sarah Chen", username: "@sarahchen", lastMessage: "See you tomorrow!" },
  { id: 2, name: "Mike Johnson", username: "@mikej", lastMessage: "Thanks!" },
  { id: 3, name: "Alex Kumar", username: "@alexk", lastMessage: "Got it 👍" },
  { id: 4, name: "Emma Wilson", username: "@emmaw", lastMessage: "Sounds good" },
  { id: 5, name: "David Lee", username: "@davidlee", lastMessage: "Sure thing" },
  { id: 6, name: "Tech Squad", username: "Group", lastMessage: "5 members" },
];

export default function ForwardMessage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChats, setSelectedChats] = useState<number[]>([]);
  const [message] = useState("Hey! Check this out 🔥"); // The message being forwarded

  const handleToggleChat = (chatId: number) => {
    setSelectedChats(prev =>
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = () => {
    // Forward logic here
    console.log("Forwarding to:", selectedChats);
    navigate(-1);
  };

  const filteredChats = mockChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to="/chat/1" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold">Forward Message</h1>
              {selectedChats.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedChats.length} selected
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleForward}
            disabled={selectedChats.length === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Message Preview */}
      <div className="p-4 border-b bg-muted/30">
        <div className="text-sm text-muted-foreground mb-1">Forwarding message:</div>
        <div className="bg-background border rounded-lg p-3">
          <p className="text-sm">{message}</p>
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length > 0 ? (
          <div className="divide-y">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleToggleChat(chat.id)}
                className="px-4 py-3 hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedChats.includes(chat.id)}
                    onCheckedChange={() => handleToggleChat(chat.id)}
                    className="flex-shrink-0"
                  />
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={chat.avatar} />
                    <AvatarFallback>{chat.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{chat.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="font-semibold mb-2">No chats found</h3>
            <p className="text-sm text-muted-foreground">
              Try a different search term
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
