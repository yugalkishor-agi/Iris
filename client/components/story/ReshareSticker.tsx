import { useState } from 'react';
import { Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReshareContent {
  type: 'post' | 'story';
  postId?: string;
  imageUrl?: string;
  caption?: string;
  authorUsername?: string;
  authorAvatar?: string;
}

interface ReshareStickerProps {
  content: ReshareContent;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  onUpdate: (updates: Partial<ReshareStickerProps>) => void;
  onRemove: () => void;
  isSelected: boolean;
}

export function ReshareSticker({
  content,
  position,
  scale,
  rotation,
  onUpdate,
  onRemove,
  isSelected,
}: ReshareStickerProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className="absolute cursor-move select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        transformOrigin: 'center',
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        e.stopPropagation();
      }}
      onTouchMove={(e) => {
        if (isDragging && e.touches.length === 1) {
          const touch = e.touches[0];
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const rect = parent.getBoundingClientRect();
            onUpdate({
              position: {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top,
              },
            });
          }
        }
      }}
      onTouchEnd={() => setIsDragging(false)}
    >
      <div
        className={`relative bg-black/40 backdrop-blur-md rounded-2xl p-3 border-2 transition-all ${
          isSelected ? 'border-white shadow-lg shadow-white/20' : 'border-white/30'
        }`}
        style={{ minWidth: '280px', maxWidth: '320px' }}
      >
        {/* Remove button */}
        {isSelected && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Reshare header */}
        <div className="flex items-center gap-2 mb-2">
          <Share2 className="h-4 w-4 text-white" />
          <span className="text-white text-xs font-semibold">Shared Post</span>
        </div>

        {/* Post preview */}
        <div className="bg-black/20 rounded-xl overflow-hidden">
          {content.imageUrl && (
            <img
              src={content.imageUrl}
              alt="Shared post"
              className="w-full h-48 object-cover"
            />
          )}
          
          {/* Author info */}
          {content.authorUsername && (
            <div className="p-2 flex items-center gap-2">
              {content.authorAvatar && (
                <img
                  src={content.authorAvatar}
                  alt={content.authorUsername}
                  className="w-6 h-6 rounded-full border border-white/30"
                />
              )}
              <span className="text-white text-xs font-medium">
                {content.authorUsername}
              </span>
            </div>
          )}
          
          {/* Caption preview */}
          {content.caption && (
            <div className="px-2 pb-2">
              <p className="text-white/80 text-xs line-clamp-2">
                {content.caption}
              </p>
            </div>
          )}
        </div>

        {/* Tap to view indicator */}
        <div className="mt-2 text-center">
          <span className="text-white/60 text-[10px] font-medium">
            Tap to view post
          </span>
        </div>
      </div>
    </div>
  );
}

// Sticker data interface for saving
export interface ReshareStickerData {
  type: 'reshare';
  content: ReshareContent;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}
