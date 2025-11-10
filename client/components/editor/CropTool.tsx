import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw, FlipHorizontal, FlipVertical, Check } from "lucide-react";

interface CropToolProps {
  imageUrl: string;
  aspectRatio: number | null;
  onCrop: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

export function CropTool({ imageUrl, aspectRatio, onCrop, onCancel }: CropToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      // Initialize crop area
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;
      setCropArea({ x, y, width: size, height: size });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = image.width;
    canvas.height = image.height;

    // Draw image
    ctx.drawImage(image, 0, 0);

    // Draw dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop area
    ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    ctx.drawImage(
      image,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height
    );

    // Draw crop grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    
    // Outer border
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    
    // Grid lines (rule of thirds)
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(cropArea.x + cropArea.width / 3, cropArea.y);
    ctx.lineTo(cropArea.x + cropArea.width / 3, cropArea.y + cropArea.height);
    ctx.moveTo(cropArea.x + (cropArea.width * 2) / 3, cropArea.y);
    ctx.lineTo(cropArea.x + (cropArea.width * 2) / 3, cropArea.y + cropArea.height);
    ctx.stroke();
    
    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(cropArea.x, cropArea.y + cropArea.height / 3);
    ctx.lineTo(cropArea.x + cropArea.width, cropArea.y + cropArea.height / 3);
    ctx.moveTo(cropArea.x, cropArea.y + (cropArea.height * 2) / 3);
    ctx.lineTo(cropArea.x + cropArea.width, cropArea.y + (cropArea.height * 2) / 3);
    ctx.stroke();

    // Draw corner handles
    const handleSize = 20;
    ctx.fillStyle = "white";
    const corners = [
      [cropArea.x, cropArea.y],
      [cropArea.x + cropArea.width, cropArea.y],
      [cropArea.x, cropArea.y + cropArea.height],
      [cropArea.x + cropArea.width, cropArea.y + cropArea.height],
    ];
    
    corners.forEach(([x, y]) => {
      ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
    });
  }, [image, cropArea]);

  const getScaleRatio = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return { scaleX: 1, scaleY: 1 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = image.width / rect.width;
    const scaleY = image.height / rect.height;
    return { scaleX, scaleY };
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    setIsDragging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setDragStart({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !image) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;
    
    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;
    
    // Scale delta to image coordinates
    const { scaleX, scaleY } = getScaleRatio();
    const scaledDeltaX = deltaX * scaleX;
    const scaledDeltaY = deltaY * scaleY;
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(prev.x + scaledDeltaX, image.width - prev.width)),
      y: Math.max(0, Math.min(prev.y + scaledDeltaY, image.height - prev.height)),
    }));
    
    setDragStart({ x: currentX, y: currentY });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !image) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;
    
    // Scale delta to image coordinates
    const { scaleX, scaleY } = getScaleRatio();
    const scaledDeltaX = deltaX * scaleX;
    const scaledDeltaY = deltaY * scaleY;
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(prev.x + scaledDeltaX, image.width - prev.width)),
      y: Math.max(0, Math.min(prev.y + scaledDeltaY, image.height - prev.height)),
    }));
    
    setDragStart({ x: currentX, y: currentY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApplyCrop = () => {
    if (!image) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;
    
    ctx.drawImage(
      image,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    );
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      onCrop(url);
    }, "image/jpeg", 0.95);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <h2 className="text-white font-semibold">Crop Image</h2>
        <Button variant="ghost" size="sm" onClick={handleApplyCrop}>
          <Check className="h-5 w-5 text-primary" />
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        />
      </div>

      {/* Bottom toolbar */}
      <div className="p-4 bg-black/50 backdrop-blur flex gap-2 justify-center">
        <Button variant="outline" size="sm">
          <RotateCw className="h-4 w-4 mr-2" />
          Rotate
        </Button>
        <Button variant="outline" size="sm">
          <FlipHorizontal className="h-4 w-4 mr-2" />
          Flip H
        </Button>
        <Button variant="outline" size="sm">
          <FlipVertical className="h-4 w-4 mr-2" />
          Flip V
        </Button>
      </div>
    </div>
  );
}
