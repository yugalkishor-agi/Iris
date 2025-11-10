import { useState } from 'react';

interface EmojiReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍', '🔥', '🎉'];

export function EmojiReactionPicker({ onSelect, onClose, position }: EmojiReactionPickerProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Reaction Picker */}
      <div
        className="fixed z-50 bg-background border rounded-full shadow-xl p-2 flex gap-1"
        style={{
          left: `${Math.min(position.x, window.innerWidth - 400)}px`,
          top: `${position.y - 60}px`,
          transform: 'translateX(-50%)',
        }}
      >
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="w-10 h-10 flex items-center justify-center text-2xl hover:scale-125 transition-transform active:scale-110 rounded-full hover:bg-accent"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
