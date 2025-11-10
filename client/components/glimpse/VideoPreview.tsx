import { RefObject } from 'react';
import { Play, Pause } from 'lucide-react';
import { useGlimpseEditorStore } from '@/stores/glimpseEditorStore';
import { Button } from '@/components/ui/button';

interface VideoPreviewProps {
  videoRef: RefObject<HTMLVideoElement>;
  videoUrl: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function VideoPreview({ videoRef, videoUrl, isPlaying, onTogglePlay }: VideoPreviewProps) {
  const { currentFilter, textLayers, stickerLayers } = useGlimpseEditorStore();

  const filterStyle = {
    filter: `
      brightness(${currentFilter.brightness}%)
      contrast(${currentFilter.contrast}%)
      saturate(${currentFilter.saturation}%)
      blur(${currentFilter.blur}px)
    `,
  };

  console.log('📺 VideoPreview render - URL:', videoUrl, 'Playing:', isPlaying);

  return (
    <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
      {/* Video Element */}
      <div className="relative w-full max-w-md aspect-[9/16]">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain bg-black"
            style={filterStyle}
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error('❌ Video error:', e);
              const video = e.currentTarget;
              console.error('Error details:', {
                error: video.error,
                networkState: video.networkState,
                readyState: video.readyState,
                src: video.src
              });
            }}
            onLoadedData={() => console.log('✅ Video loaded successfully')}
            onCanPlay={() => console.log('✅ Video can play')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <p>No video loaded</p>
          </div>
        )}

        {/* Text Layers Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {textLayers.map((layer) => (
            <div
              key={layer.id}
              className="absolute pointer-events-auto cursor-move"
              style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                transform: `rotate(${layer.rotation}deg) scale(${layer.scale})`,
                fontSize: `${layer.fontSize}px`,
                fontFamily: layer.fontFamily,
                color: layer.fill,
                fontWeight: layer.fontWeight,
                fontStyle: layer.fontStyle,
                textAlign: layer.align,
                textDecoration: layer.textDecoration,
                backgroundColor: layer.backgroundColor,
                padding: layer.backgroundColor ? '8px 16px' : '0',
                borderRadius: layer.backgroundColor ? '8px' : '0',
                textShadow: layer.shadow ? `2px 2px ${layer.shadowBlur}px ${layer.shadowColor}` : 'none',
              }}
            >
              {layer.content}
            </div>
          ))}
        </div>

        {/* Sticker Layers Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {stickerLayers.map((layer) => (
            <div
              key={layer.id}
              className="absolute pointer-events-auto cursor-move"
              style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                transform: `rotate(${layer.rotation}deg) scale(${layer.scale})`,
                width: `${layer.width}px`,
                height: `${layer.height}px`,
                opacity: layer.opacity,
              }}
            >
              {layer.type === 'emoji' ? (
                <div className="text-6xl">{layer.url}</div>
              ) : (
                <img src={layer.url} alt="Sticker" className="w-full h-full object-contain" />
              )}
            </div>
          ))}
        </div>

        {/* Center Play/Pause Button */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={onTogglePlay}
              size="lg"
              className="w-16 h-16 rounded-full bg-white/90 hover:bg-white shadow-2xl"
            >
              <Play className="h-8 w-8 text-black ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
