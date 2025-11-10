import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SliderStickerProps {
  id: string;
  question: string;
  emoji: string;
  x: number;
  y: number;
  isSelected: boolean;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

export function SliderSticker({
  id,
  question,
  emoji,
  x,
  y,
  isSelected,
  onUpdate,
  onDelete,
  onSelect,
}: SliderStickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ x, y });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPos({ x, y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      onUpdate(id, {
        x: initialPos.x + deltaX,
        y: initialPos.y + deltaY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useState(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  return (
    <div
      className={`absolute cursor-move select-none ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-black' : ''
      }`}
      style={{
        left: x,
        top: y,
        zIndex: isSelected ? 100 : 10,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Slider Card */}
      <div className="bg-gradient-to-br from-orange-500/90 to-yellow-500/90 backdrop-blur-md rounded-2xl p-4 min-w-[280px] shadow-2xl">
        <div className="text-white space-y-3">
          <p className="font-bold text-center">{question}</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{emoji}</span>
            <div className="flex-1 h-12 bg-white/30 rounded-full relative overflow-hidden">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-2xl">
                {emoji}
              </div>
            </div>
            <span className="text-3xl">{emoji}</span>
          </div>
        </div>
      </div>

      {/* Delete Button */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="absolute -top-3 -right-3 p-2 bg-red-500 rounded-full hover:bg-red-600 shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <X className="h-4 w-4 text-white" />
        </button>
      )}
    </div>
  );
}

// Creator Component
export function SliderStickerCreator({ onCreateSlider }: { onCreateSlider: (question: string, emoji: string) => void }) {
  const [question, setQuestion] = useState('');
  const [emoji, setEmoji] = useState('😍');

  const handleCreate = () => {
    if (question.trim()) {
      onCreateSlider(question, emoji);
      setQuestion('');
    }
  };

  const emojis = ['😍', '❤️', '🔥', '⭐', '👍', '😂', '😎', '🎉'];

  return (
    <div className="space-y-3 p-4 bg-black/50 rounded-lg">
      <h3 className="text-white font-semibold">Emoji Slider</h3>
      <Input
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="bg-white/10 text-white border-white/20"
      />
      <div className="flex gap-2 flex-wrap">
        {emojis.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            className={`text-2xl p-2 rounded-lg ${
              emoji === e ? 'bg-primary/30 ring-2 ring-primary' : 'bg-white/10'
            }`}
          >
            {e}
          </button>
        ))}
      </div>
      <Button onClick={handleCreate} className="w-full bg-primary">
        Add Slider
      </Button>
    </div>
  );
}
