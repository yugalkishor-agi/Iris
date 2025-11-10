import React from 'react';
import { CornerDownRight, Move, Trash2, Copy, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import './editor-animations.css';

interface SelectionIndicatorProps {
  type: 'text' | 'sticker' | 'video' | 'audio';
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  isLocked?: boolean;
  onMove?: (id: string, dx: number, dy: number) => void;
  onRotate?: (id: string, angle: number) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onLockToggle?: (id: string, locked: boolean) => void;
  onSelect?: (id: string) => void;
}

export function SelectionIndicator({
  type,
  id,
  x,
  y,
  width,
  height,
  rotation = 0,
  isLocked = false,
  onMove,
  onRotate,
  onDelete,
  onDuplicate,
  onLockToggle,
  onSelect
}: SelectionIndicatorProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = React.useState(false);
  const [rotateStart, setRotateStart] = React.useState(0);
  
  // Colors based on element type
  const colors = {
    text: 'yellow',
    sticker: 'pink',
    video: 'blue',
    audio: 'green'
  };
  
  const color = colors[type];
  
  // Handle element movement
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLocked || !onMove) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.stopPropagation();
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !onMove) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    onMove(id, dx, dy);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsRotating(false);
  };
  
  // Handle rotation
  const handleRotateStart = (e: React.MouseEvent) => {
    if (isLocked || !onRotate) return;
    
    setIsRotating(true);
    
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate initial angle
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    setRotateStart(angle);
    
    e.stopPropagation();
  };
  
  const handleRotateMove = (e: React.MouseEvent) => {
    if (!isRotating || !onRotate) return;
    
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate new angle
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const deltaAngle = angle - rotateStart;
    
    // Convert to degrees
    const degrees = deltaAngle * (180 / Math.PI);
    
    onRotate(id, degrees);
    setRotateStart(angle);
  };
  
  React.useEffect(() => {
    if (isDragging || isRotating) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isRotating]);
  
  return (
    <div 
      className="absolute pointer-events-none animate-scale-in"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${rotation}deg)`,
        zIndex: 1000
      }}
      onClick={() => onSelect?.(id)}
    >
      {/* Selection border */}
      <div 
        className={`absolute inset-0 border-2 border-${color}-500 rounded pointer-events-auto animate-pulse-ring`}
        style={{ boxShadow: `0 0 0 1px ${color}, 0 0 10px rgba(0,0,0,0.5)` }}
        onMouseDown={handleMouseDown}
      ></div>
      
      {/* Corner handles */}
      <div className="absolute -left-2 -top-2 w-4 h-4 bg-white border-2 border-black rounded-full pointer-events-auto cursor-nwse-resize"></div>
      <div className="absolute -right-2 -top-2 w-4 h-4 bg-white border-2 border-black rounded-full pointer-events-auto cursor-nesw-resize"></div>
      <div className="absolute -left-2 -bottom-2 w-4 h-4 bg-white border-2 border-black rounded-full pointer-events-auto cursor-nesw-resize"></div>
      <div className="absolute -right-2 -bottom-2 w-4 h-4 bg-white border-2 border-black rounded-full pointer-events-auto cursor-nwse-resize"></div>
      
      {/* Rotation handle */}
      {onRotate && (
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 pointer-events-auto"
          onMouseDown={handleRotateStart}
          onMouseMove={isRotating ? handleRotateMove : undefined}
        >
          <div className="w-6 h-6 rounded-full bg-white border-2 border-black flex items-center justify-center cursor-alias">
            <CornerDownRight className="h-3 w-3 text-black" />
          </div>
          <div className="absolute left-1/2 bottom-0 w-0.5 h-4 bg-black -translate-x-1/2"></div>
        </div>
      )}
      
      {/* Control buttons */}
      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-black/80 rounded-full p-1 pointer-events-auto">
        {onMove && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-full hover:bg-white/20"
                onClick={handleMouseDown}
              >
                <Move className="h-4 w-4 text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Move</TooltipContent>
          </Tooltip>
        )}
        
        {onDuplicate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-full hover:bg-white/20"
                onClick={() => onDuplicate(id)}
              >
                <Copy className="h-4 w-4 text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Duplicate</TooltipContent>
          </Tooltip>
        )}
        
        {onLockToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-full hover:bg-white/20"
                onClick={() => onLockToggle(id, !isLocked)}
              >
                {isLocked ? (
                  <Lock className="h-4 w-4 text-white" />
                ) : (
                  <Unlock className="h-4 w-4 text-white" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{isLocked ? 'Unlock' : 'Lock'}</TooltipContent>
          </Tooltip>
        )}
        
        {onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-full hover:bg-red-500/50"
                onClick={() => onDelete(id)}
              >
                <Trash2 className="h-4 w-4 text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Delete</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}