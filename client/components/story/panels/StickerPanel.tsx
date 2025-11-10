import { useState } from 'react';
import { useStoryEditorStore } from '@/stores/storyEditorStore';
import { Smile, AtSign, MessageCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { MentionStickerCreator } from '../MentionSticker';

const STICKER_TYPES = [
  { id: 'emoji', label: 'Emoji', icon: Smile, color: 'text-yellow-400' },
  { id: 'mention', label: 'Mention', icon: AtSign, color: 'text-purple-400' },
  { id: 'poll', label: 'Poll', icon: BarChart3, color: 'text-purple-400' },
  { id: 'question', label: 'Question', icon: MessageCircle, color: 'text-blue-400' },
];

type StickerType = 'emoji' | 'mention' | 'poll' | 'question';

export function StickerPanel() {
  const [activeStickerType, setActiveStickerType] = useState<StickerType | null>(null);
  const { addLayer, setActiveTool, setSelectedLayer } = useStoryEditorStore();

  // Debug log
  console.log('StickerPanel - activeStickerType:', activeStickerType);

  const handleEmojiSelect = (emoji: any) => {
    const stickerId = `sticker-${Date.now()}`;
    const newSticker = {
      id: stickerId,
      type: 'emoji' as const,
      content: emoji.native,
      x: 540,
      y: 960,
      rotation: 0,
      scale: 1,
      width: 100,
      height: 100,
    };
    addLayer(newSticker);
    setSelectedLayer(stickerId);
    setActiveTool('none');
  };

  const handleAddMention = (userId: string, username: string, avatarURL: string, verified: boolean) => {
    const stickerId = `mention-${Date.now()}`;
    const newSticker: any = {
      id: stickerId,
      type: 'mention' as const,
      data: { userId, username, avatarURL, verified },
      x: 540,
      y: 960,
      rotation: 0,
      scale: 1,
    };
    addLayer(newSticker);
    setSelectedLayer(stickerId);
    setActiveStickerType(null);
    setActiveTool('none');
  };

  return (
    <div className="absolute inset-x-0 bottom-24 max-w-md mx-auto p-4 bg-black/90 backdrop-blur-xl rounded-t-3xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smile className="h-5 w-5 text-purple-400" />
            <h3 className="text-white font-semibold">Stickers</h3>
          </div>
          <Button onClick={() => { setActiveStickerType(null); setActiveTool('none'); }} variant="ghost" size="sm" className="text-white/60 hover:text-white">Done</Button>
        </div>

        {activeStickerType === null && (
          <div className="grid grid-cols-2 gap-3">
            {STICKER_TYPES.map((type) => (
              <button 
                key={type.id} 
                onClick={() => {
                  console.log('Sticker type clicked:', type.id);
                  setActiveStickerType(type.id as StickerType);
                }} 
                className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
              >
                <type.icon className={`h-8 w-8 ${type.color}`} />
                <span className="text-white text-sm font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        )}

        {activeStickerType === 'emoji' && (
          <div className="space-y-3">
            <button onClick={() => setActiveStickerType(null)} className="text-white/60 text-sm hover:text-white transition-colors">← Back to stickers</button>
            <div className="max-h-96 overflow-y-auto rounded-2xl">
              <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="dark" previewPosition="none" skinTonePosition="search" searchPosition="sticky" navPosition="bottom" perLine={8} emojiSize={32} emojiButtonSize={40} maxFrequentRows={2} />
            </div>
          </div>
        )}

        {activeStickerType === 'mention' && (
          <MentionStickerCreator onAdd={handleAddMention} onClose={() => setActiveStickerType(null)} />
        )}
      </div>
    </div>
  );
}
