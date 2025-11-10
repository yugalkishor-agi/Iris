import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, Image as ImageIcon } from 'lucide-react';

interface GlimpseCoverPickerProps {
  videoUrl: string;
  onSelect: (coverBlob: Blob) => void;
  onBack: () => void;
}

export function GlimpseCoverPicker({ videoUrl, onSelect, onBack }: GlimpseCoverPickerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'video' | 'gallery'>('video');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'video') {
      extractFrames();
    }
  }, [videoUrl, mode]);

  const extractFrames = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setLoading(true);

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const duration = video.duration;
      const interval = Math.max(1, duration / 10); // 10 frames
      const frameUrls: string[] = [];
      
      let currentTime = 0;
      const captureFrame = () => {
        if (currentTime >= duration) {
          setFrames(frameUrls);
          setLoading(false);
          return;
        }
        
        video.currentTime = currentTime;
        video.addEventListener('seeked', function handler() {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frameUrls.push(canvas.toDataURL('image/jpeg', 0.8));
          currentTime += interval;
          video.removeEventListener('seeked', handler);
          setTimeout(captureFrame, 100);
        }, { once: true });
      };
      
      captureFrame();
    });
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = async () => {
    let imageUrl: string;
    
    if (mode === 'video') {
      imageUrl = frames[selectedIndex];
    } else {
      imageUrl = uploadedImage!;
    }
    
    // Convert data URL to blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    onSelect(blob);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/90 backdrop-blur border-b border-white/10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5 text-white" />
        </Button>
        <h1 className="text-white font-semibold">Select Cover</h1>
        <Button onClick={handleConfirm} className="bg-primary" disabled={loading && mode === 'video'}>
          <Check className="h-4 w-4 mr-2" />
          Confirm
        </Button>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 p-4 border-b border-white/10">
        <Button
          variant={mode === 'video' ? 'default' : 'outline'}
          onClick={() => setMode('video')}
          className="flex-1"
        >
          From Video
        </Button>
        <Button
          variant={mode === 'gallery' ? 'default' : 'outline'}
          onClick={() => setMode('gallery')}
          className="flex-1"
        >
          Gallery
        </Button>
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center bg-black p-4">
        <div className="relative w-full max-w-md aspect-video bg-black/50 rounded-lg overflow-hidden">
          {loading && mode === 'video' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white">Extracting frames...</p>
            </div>
          ) : mode === 'video' && frames.length > 0 ? (
            <img
              src={frames[selectedIndex]}
              alt="Cover preview"
              className="w-full h-full object-contain"
            />
          ) : mode === 'gallery' && uploadedImage ? (
            <img
              src={uploadedImage}
              alt="Uploaded cover"
              className="w-full h-full object-contain"
            />
          ) : mode === 'gallery' ? (
            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5">
              <ImageIcon className="h-12 w-12 text-white/60 mb-2" />
              <span className="text-white/60">Upload Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleGalleryUpload}
                className="hidden"
              />
            </label>
          ) : null}
        </div>
      </div>

      {/* Frame Selector */}
      {mode === 'video' && frames.length > 0 && (
        <div className="bg-black/90 backdrop-blur border-t border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
              disabled={selectedIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </Button>
            <span className="text-white text-sm flex-1 text-center">
              Frame {selectedIndex + 1} of {frames.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedIndex(Math.min(frames.length - 1, selectedIndex + 1))}
              disabled={selectedIndex === frames.length - 1}
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </Button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto">
            {frames.map((frame, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`flex-shrink-0 w-20 h-14 rounded border-2 ${
                  selectedIndex === index ? 'border-primary' : 'border-white/20'
                }`}
              >
                <img src={frame} alt={`Frame ${index}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden video and canvas */}
      <video ref={videoRef} src={videoUrl} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
