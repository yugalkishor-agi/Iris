import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, MessageCircle } from "lucide-react";

interface QuestionStickerProps {
  id: string;
  question: string;
  placeholder: string;
  x: number;
  y: number;
  isSelected: boolean;
  backgroundColor?: string;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

export function QuestionSticker({
  id,
  question,
  placeholder,
  x,
  y,
  isSelected,
  backgroundColor = 'from-blue-500/90 to-cyan-500/90',
  onUpdate,
  onDelete,
  onSelect,
}: QuestionStickerProps) {
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
      {/* Question Card */}
      <div className={`bg-gradient-to-br ${backgroundColor} backdrop-blur-md rounded-2xl p-4 min-w-[280px] shadow-2xl`}>
        <div className="text-white space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <p className="font-bold text-sm">{question}</p>
          </div>
          <div className="bg-white/30 backdrop-blur-sm rounded-xl p-3">
            <p className="text-white/70 text-sm text-center">{placeholder}</p>
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
export function QuestionStickerCreator({ onCreateQuestion }: { onCreateQuestion: (question: string) => void }) {
  const [question, setQuestion] = useState('');

  const handleCreate = () => {
    if (question.trim()) {
      onCreateQuestion(question);
      setQuestion('');
    }
  };

  return (
    <div className="space-y-3 p-4 bg-black/50 rounded-lg">
      <h3 className="text-white font-semibold">Ask a Question</h3>
      <Input
        placeholder="Type your question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="bg-white/10 text-white border-white/20"
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
      />
      <Button onClick={handleCreate} className="w-full bg-primary">
        Add Question
      </Button>
    </div>
  );
}
