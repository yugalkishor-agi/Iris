import React from 'react';

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '🙏', '🔥', '👍', '👎'];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

export function EmojiPicker({ onSelect, onClose, position }: EmojiPickerProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50"
        onClick={onClose}
      />
      
      {/* Picker */}
      <div
        className="fixed z-50 bg-background border shadow-2xl rounded-2xl p-2 animate-in zoom-in-95 duration-200"
        style={{
          left: Math.min(position.x, window.innerWidth - 300),
          top: Math.max(20, position.y - 60),
        }}
      >
        <div className="flex gap-2">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className="text-2xl p-2 hover:bg-accent rounded-lg active:scale-95 transition-all"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
