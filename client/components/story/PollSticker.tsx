import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PollStickerProps {
  id: string;
  question: string;
  options: string[];
  x: number;
  y: number;
  isSelected: boolean;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

export function PollSticker({
  id,
  question,
  options,
  x,
  y,
  isSelected,
  onUpdate,
  onDelete,
  onSelect,
}: PollStickerProps) {
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
      {/* Poll Card */}
      <div className="bg-gradient-to-br from-purple-500/90 to-pink-500/90 backdrop-blur-md rounded-2xl p-4 min-w-[280px] shadow-2xl">
        <div className="text-white space-y-3">
          <p className="font-bold text-lg text-center">{question}</p>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div
                key={index}
                className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center font-medium hover:bg-white/30 transition-all cursor-pointer"
              >
                {option}
              </div>
            ))}
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
export function PollStickerCreator({ onCreatePoll }: { onCreatePoll: (question: string, options: string[]) => void }) {
  const [question, setQuestion] = useState('');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');

  const handleCreate = () => {
    if (question.trim() && option1.trim() && option2.trim()) {
      onCreatePoll(question, [option1, option2]);
      setQuestion('');
      setOption1('');
      setOption2('');
    }
  };

  return (
    <div className="space-y-3 p-4 bg-black/50 rounded-lg">
      <h3 className="text-white font-semibold">Create Poll</h3>
      <Input
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="bg-white/10 text-white border-white/20"
      />
      <Input
        placeholder="Option 1"
        value={option1}
        onChange={(e) => setOption1(e.target.value)}
        className="bg-white/10 text-white border-white/20"
      />
      <Input
        placeholder="Option 2"
        value={option2}
        onChange={(e) => setOption2(e.target.value)}
        className="bg-white/10 text-white border-white/20"
      />
      <Button onClick={handleCreate} className="w-full bg-primary">
        Add Poll
      </Button>
    </div>
  );
}
