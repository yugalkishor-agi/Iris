import { useState } from 'react';
import { X, Search, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlimpseEditorStore, StickerLayer } from '@/stores/glimpseEditorStore';

const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤩', '😭', '😱', '🔥', '❤️', '✨', '⭐', '🎉', '🎊', '💯', '👍', '👏', '🙌', '💪', '🤝'];

export function StickerPicker() {
  const { addStickerLayer, currentTime, setActiveTool } = useGlimpseEditorStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);

  const handleAddEmoji = (emoji: string) => {
    const newSticker: StickerLayer = {
      id: `sticker-${Date.now()}`,
      type: 'emoji',
      url: emoji,
      x: 50,
      y: 50,
      rotation: 0,
      scale: 1,
      width: 80,
      height: 80,
      startTime: currentTime,
      endTime: currentTime + 5,
      opacity: 1,
    };

    addStickerLayer(newSticker);
  };

  const searchGifs = async () => {
    // Placeholder for GIPHY API integration
    console.log('Search GIFs:', searchQuery);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-black via-gray-900 to-transparent z-40 p-6 max-h-[80vh] overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Smile className="h-5 w-5 text-pink-400" />
            </div>
            <h3 className="text-white text-lg font-semibold">Stickers & GIFs</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setActiveTool('none')}>
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>

        <Tabs defaultValue="emoji" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="emoji">Emojis</TabsTrigger>
            <TabsTrigger value="gif">GIFs</TabsTrigger>
          </TabsList>

          <TabsContent value="emoji">
            <div className="grid grid-cols-5 gap-3">
              {emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddEmoji(emoji)}
                  className="aspect-square rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary transition-all flex items-center justify-center text-4xl active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gif">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search GIFs..."
                  className="flex-1 bg-white/10 border-white/20 text-white"
                />
                <Button onClick={searchGifs} className="bg-primary">
                  <Search className="h-5 w-5" />
                </Button>
              </div>

              <div className="text-center py-12">
                <Smile className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">Search for GIFs</p>
                <p className="text-white/40 text-sm mt-2">Connect GIPHY API key in settings</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
