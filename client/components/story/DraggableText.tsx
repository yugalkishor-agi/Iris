import { useState } from "react";
import { Trash2, ZoomIn, RotateCw } from "lucide-react";

interface DraggableTextProps {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  backgroundColor: string;
  font: string;
  rotation: number;
  isSelected: boolean;
  onUpdate: (id: string, updates: Partial<TextElement>) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

interface TextElement {
  x: number;
  y: number;
  fontSize: number;
  rotation: number;
}

export function DraggableText({
  id,
  text,
  x,
  y,
  fontSize,
  color,
  backgroundColor,
  font,
  rotation,
  isSelected,
  onUpdate,
  onDelete,
  onSelect,
}: DraggableTextProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialState, setInitialState] = useState({ x, y, fontSize, rotation });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialState({ x, y, fontSize, rotation });
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialState({ x, y, fontSize, rotation });
  };

  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRotating(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialState({ x, y, fontSize, rotation });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      onUpdate(id, {
        x: initialState.x + deltaX,
        y: initialState.y + deltaY,
      });
    } else if (isResizing) {
      const deltaY = e.clientY - dragStart.y;
      const newFontSize = Math.max(16, Math.min(120, initialState.fontSize + deltaY * 0.5));
      onUpdate(id, { fontSize: newFontSize });
    } else if (isRotating) {
      const centerX = x + 100;
      const centerY = y + 30;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      onUpdate(id, { rotation: angle });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
  };

  // Add/remove event listeners
  useState(() => {
    if (isDragging || isResizing || isRotating) {
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
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
        zIndex: isSelected ? 100 : 10,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Text Content */}
      <div
        className="px-4 py-2 rounded-lg whitespace-nowrap"
        style={{
          background: backgroundColor,
          color: color,
          fontSize: `${fontSize}px`,
          fontFamily: font,
          fontWeight: 'bold',
          textShadow: backgroundColor === 'transparent' ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {text}
      </div>

      {/* Control Buttons */}
      {isSelected && (
        <>
          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            className="absolute -top-10 -right-2 p-2 bg-red-500 rounded-full hover:bg-red-600 shadow-lg transition-all"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-4 w-4 text-white" />
          </button>

          {/* Resize Button */}
          <button
            onMouseDown={handleResizeStart}
            className="absolute -bottom-10 -right-2 p-2 bg-primary rounded-full hover:bg-primary/80 shadow-lg transition-all"
          >
            <ZoomIn className="h-4 w-4 text-white" />
          </button>

          {/* Rotate Button */}
          <button
            onMouseDown={handleRotateStart}
            className="absolute -bottom-10 -left-2 p-2 bg-primary rounded-full hover:bg-primary/80 shadow-lg transition-all"
          >
            <RotateCw className="h-4 w-4 text-white" />
          </button>
        </>
      )}
    </div>
  );
}
