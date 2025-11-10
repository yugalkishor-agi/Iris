import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw, Check, X } from "lucide-react";

interface CropToolProps {
  imageUrl: string;
  aspectRatio: number | null;
  onCrop: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

type HandlePosition = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'move' | null;

export function ImprovedCropTool({ imageUrl, aspectRatio, onCrop, onCancel }: CropToolProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [activeHandle, setActiveHandle] = useState<HandlePosition>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      
      // Calculate initial scale to fit container
      const container = containerRef.current;
      if (!container) return;
      
      const containerWidth = container.clientWidth - 40;
      const containerHeight = container.clientHeight - 40;
      const scale = Math.min(
        containerWidth / img.width,
        containerHeight / img.height,
        1
      );
      
      setImageScale(scale);
      
      // Center the crop area
      const displayWidth = img.width * scale;
      const displayHeight = img.height * scale;
      const cropSize = Math.min(displayWidth, displayHeight) * 0.8;
      
      setCropArea({
        x: (displayWidth - cropSize) / 2,
        y: (displayHeight - cropSize) / 2,
        width: cropSize,
        height: cropSize
      });
      
      // Center the image
      setImageOffset({
        x: (containerWidth - displayWidth) / 2,
        y: (containerHeight - displayHeight) / 2
      });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const getHandleAtPosition = (x: number, y: number): HandlePosition => {
    const handleSize = 40;
    const { x: cx, y: cy, width: cw, height: ch } = cropArea;
    
    // Check corners first
    if (Math.abs(x - cx) < handleSize && Math.abs(y - cy) < handleSize) return 'nw';
    if (Math.abs(x - (cx + cw)) < handleSize && Math.abs(y - cy) < handleSize) return 'ne';
    if (Math.abs(x - cx) < handleSize && Math.abs(y - (cy + ch)) < handleSize) return 'sw';
    if (Math.abs(x - (cx + cw)) < handleSize && Math.abs(y - (cy + ch)) < handleSize) return 'se';
    
    // Check edges
    if (Math.abs(x - cx) < handleSize && y > cy && y < cy + ch) return 'w';
    if (Math.abs(x - (cx + cw)) < handleSize && y > cy && y < cy + ch) return 'e';
    if (Math.abs(y - cy) < handleSize && x > cx && x < cx + cw) return 'n';
    if (Math.abs(y - (cy + ch)) < handleSize && x > cx && x < cx + cw) return 's';
    
    // Check if inside crop area
    if (x > cx && x < cx + cw && y > cy && y < cy + ch) return 'move';
    
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !image) return;
    
    const x = e.clientX - rect.left - imageOffset.x;
    const y = e.clientY - rect.top - imageOffset.y;
    
    const handle = getHandleAtPosition(x, y);
    if (!handle) return;
    
    setActiveHandle(handle);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      cropX: cropArea.x,
      cropY: cropArea.y,
      cropW: cropArea.width,
      cropH: cropArea.height
    });
    
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeHandle || !image) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const imageWidth = image.width * imageScale;
    const imageHeight = image.height * imageScale;
    
    let newCrop = { ...cropArea };
    
    if (activeHandle === 'move') {
      // Move the crop area
      newCrop.x = Math.max(0, Math.min(imageWidth - cropArea.width, dragStart.cropX + deltaX));
      newCrop.y = Math.max(0, Math.min(imageHeight - cropArea.height, dragStart.cropY + deltaY));
    } else {
      // Resize the crop area
      const minSize = 50;
      
      if (activeHandle.includes('w')) {
        const newX = Math.max(0, dragStart.cropX + deltaX);
        const newWidth = dragStart.cropW - (newX - dragStart.cropX);
        if (newWidth >= minSize) {
          newCrop.x = newX;
          newCrop.width = newWidth;
        }
      }
      if (activeHandle.includes('e')) {
        newCrop.width = Math.max(minSize, Math.min(imageWidth - newCrop.x, dragStart.cropW + deltaX));
      }
      if (activeHandle.includes('n')) {
        const newY = Math.max(0, dragStart.cropY + deltaY);
        const newHeight = dragStart.cropH - (newY - dragStart.cropY);
        if (newHeight >= minSize) {
          newCrop.y = newY;
          newCrop.height = newHeight;
        }
      }
      if (activeHandle.includes('s')) {
        newCrop.height = Math.max(minSize, Math.min(imageHeight - newCrop.y, dragStart.cropH + deltaY));
      }
      
      // Maintain aspect ratio if needed
      if (aspectRatio && activeHandle.length === 2) {
        if (activeHandle.includes('e') || activeHandle.includes('w')) {
          newCrop.height = newCrop.width / aspectRatio;
        } else {
          newCrop.width = newCrop.height * aspectRatio;
        }
      }
    }
    
    setCropArea(newCrop);
  };

  const handlePointerUp = () => {
    setActiveHandle(null);
  };

  const handleApplyCrop = () => {
    if (!image) return;
    
    // Convert display coordinates to image coordinates
    const scaleX = image.width / (image.width * imageScale);
    const scaleY = image.height / (image.height * imageScale);
    
    const cropX = cropArea.x * scaleX;
    const cropY = cropArea.y * scaleY;
    const cropWidth = cropArea.width * scaleX;
    const cropHeight = cropArea.height * scaleY;
    
    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;
    
    ctx.drawImage(
      image,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      onCrop(url);
    }, "image/jpeg", 0.95);
  };

  const getCursor = () => {
    if (!activeHandle) return 'default';
    
    switch (activeHandle) {
      case 'nw': case 'se': return 'nwse-resize';
      case 'ne': case 'sw': return 'nesw-resize';
      case 'n': case 's': return 'ns-resize';
      case 'e': case 'w': return 'ew-resize';
      case 'move': return 'move';
      default: return 'default';
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-black/80 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-white">
          <X className="h-5 w-5" />
        </Button>
        <h2 className="text-white font-semibold">Crop Image</h2>
        <Button variant="ghost" size="sm" onClick={handleApplyCrop} className="text-primary">
          <Check className="h-5 w-5" />
        </Button>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ cursor: getCursor() }}
      >
        {image && (
          <div 
            className="absolute"
            style={{
              left: imageOffset.x,
              top: imageOffset.y,
              width: image.width * imageScale,
              height: image.height * imageScale
            }}
          >
            {/* Image */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop"
              className="w-full h-full opacity-50"
              draggable={false}
            />
            
            {/* Bright crop area */}
            <div
              className="absolute overflow-hidden"
              style={{
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height
              }}
            >
              <img
                src={imageUrl}
                alt="Crop preview"
                className="absolute"
                style={{
                  left: -cropArea.x,
                  top: -cropArea.y,
                  width: image.width * imageScale,
                  height: image.height * imageScale
                }}
                draggable={false}
              />
            </div>
            
            {/* Crop border */}
            <div
              className="absolute border-2 border-white pointer-events-none"
              style={{
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height
              }}
            >
              {/* Grid lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/30" />
                ))}
              </div>
            </div>
            
            {/* Corner handles */}
            {['nw', 'ne', 'sw', 'se'].map((pos) => (
              <div
                key={pos}
                className="absolute w-8 h-8 border-4 border-white bg-primary rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: pos.includes('e') ? cropArea.x + cropArea.width : cropArea.x,
                  top: pos.includes('s') ? cropArea.y + cropArea.height : cropArea.y,
                  pointerEvents: 'none'
                }}
              />
            ))}
            
            {/* Edge handles */}
            {['n', 's', 'e', 'w'].map((pos) => (
              <div
                key={pos}
                className="absolute w-10 h-1.5 bg-white rounded-full"
                style={{
                  left: pos === 'e' ? cropArea.x + cropArea.width - 5 : pos === 'w' ? cropArea.x - 5 : cropArea.x + cropArea.width / 2 - 20,
                  top: pos === 's' ? cropArea.y + cropArea.height - 3 : pos === 'n' ? cropArea.y : cropArea.y + cropArea.height / 2,
                  width: pos === 'n' || pos === 's' ? '40px' : '6px',
                  height: pos === 'e' || pos === 'w' ? '40px' : '6px',
                  pointerEvents: 'none'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="p-3 bg-black/80 backdrop-blur text-center">
        <p className="text-white/60 text-sm">Drag corners to resize • Drag center to move</p>
      </div>
    </div>
  );
}
