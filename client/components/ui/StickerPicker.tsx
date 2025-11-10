import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Smile, Heart, Star, TrendingUp } from "lucide-react";

const stickerCategories = {
  recent: ["😊", "❤️", "🔥", "👍", "😂", "🎉", "✨", "💯"],
  smileys: ["😀", "😃", "😄", "😁", "😊", "😍", "🤩", "😘", "😜", "🤗", "🥰", "😎"],
  hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💕", "💞", "💓", "💗"],
  reactions: ["👍", "👎", "👏", "🙌", "🤝", "💪", "🙏", "✌️", "🤞", "👌", "🤘", "🤙"],
  celebrations: ["🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🎯", "⭐", "✨", "💫", "🌟", "🔥"],
};

interface StickerPickerProps {
  onSelect: (sticker: string) => void;
}

export function StickerPicker({ onSelect }: StickerPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const allStickers = Object.values(stickerCategories).flat();
  const filteredStickers = searchQuery
    ? allStickers.filter(s => s.includes(searchQuery))
    : null;

  return (
    <div className="w-full bg-popover border rounded-lg shadow-lg">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Stickers Grid */}
      {filteredStickers ? (
        <div className="p-3 grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
          {filteredStickers.map((sticker, i) => (
            <button
              key={i}
              onClick={() => onSelect(sticker)}
              className="text-2xl hover:bg-accent rounded p-2 transition-colors"
            >
              {sticker}
            </button>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="w-full grid grid-cols-5 rounded-none">
            <TabsTrigger value="recent">
              <TrendingUp className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="smileys">
              <Smile className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="hearts">
              <Heart className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="reactions">👍</TabsTrigger>
            <TabsTrigger value="celebrations">
              <Star className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          {Object.entries(stickerCategories).map(([key, stickers]) => (
            <TabsContent key={key} value={key} className="p-3">
              <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                {stickers.map((sticker, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect(sticker)}
                    className="text-2xl hover:bg-accent rounded p-2 transition-colors"
                  >
                    {sticker}
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* GIF Section Placeholder */}
      <div className="border-t p-3 text-center text-sm text-muted-foreground">
        <p>GIF search powered by Giphy (integration pending)</p>
      </div>
    </div>
  );
}
