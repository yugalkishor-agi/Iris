import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Undo2, Redo2, Download, Loader2, ChevronUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useGlimpseEditorStore } from '@/stores/glimpseEditorStore';
import { useToast } from '@/hooks/use-toast';
import { EditorToolbar } from './EditorToolbar';
import { VideoPreview } from './VideoPreview';
import { TimelinePanel } from './TimelinePanel';
import { TextEditor } from './TextEditor';
import { AudioMixer } from './AudioMixer';
import { FilterPanel } from './FilterPanel';
import { StickerPicker } from './StickerPicker';
import { DrawingCanvas } from './DrawingCanvas';

interface AdvancedGlimpseEditorProps {
  initialVideo: File;
  onDone: (videoBlob: Blob, coverBlob: Blob) => void;
  onBack: () => void;
}

export function AdvancedGlimpseEditor({ initialVideo, onDone, onBack }: AdvancedGlimpseEditorProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Zustand store
  const {
    ffmpegLoaded,
    initFFmpeg,
    currentTime,
    duration,
    isPlaying,
    setCurrentTime,
    setDuration,
    setPlaying,
    activeTool,
    setActiveTool,
    showTimeline,
    setShowTimeline,
    isExporting,
    exportProgress,
    exportVideo,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    addClip,
  } = useGlimpseEditorStore();

  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize FFmpeg and load video
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        // Create video URL first (so user can see video immediately)
        const url = URL.createObjectURL(initialVideo);
        console.log('📹 Video URL created:', url);
        setVideoUrl(url);
        setVideoLoaded(true);
        
        // Add initial clip to store
        addClip({
          id: 'main-clip',
          url,
          file: initialVideo,
          startTime: 0,
          duration: 0,
          trimStart: 0,
          trimEnd: 100,
          speed: 1,
          volume: 100,
        });
        
        // Load editor immediately without waiting for FFmpeg
        setLoading(false);
        
        toast({
          title: 'Editor Ready',
          description: 'Loading video processor in background...',
        });
        
        // Initialize FFmpeg in background (non-blocking)
        initFFmpeg()
          .then(() => {
            console.log('✅ FFmpeg loaded successfully');
            toast({
              title: 'Export Ready',
              description: 'Video processor loaded - you can now export',
            });
          })
          .catch((error) => {
            console.error('⚠️ FFmpeg load failed:', error);
            toast({
              title: 'Limited Mode',
              description: 'Editor ready, but export may be limited. Refresh to retry.',
              variant: 'default',
            });
          });
        
      } catch (error) {
        console.error('Init failed:', error);
        setLoading(false); // Still show editor
        toast({
          title: 'Editor Loaded',
          description: 'Some features may be limited',
          variant: 'default',
        });
      }
    };

    init();

    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      reset();
    };
  }, []);

  // Video metadata loaded
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoUrl]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) {
      console.error('No video element');
      return;
    }
    
    if (!videoUrl) {
      console.error('No video URL');
      return;
    }

    try {
      if (isPlaying) {
        video.pause();
        setPlaying(false);
        console.log('⏸️ Video paused');
      } else {
        // Ensure video is loaded
        if (video.readyState < 2) {
          console.log('⏳ Waiting for video to load...');
          await new Promise((resolve) => {
            video.addEventListener('loadeddata', resolve, { once: true });
          });
        }
        await video.play();
        setPlaying(true);
        console.log('▶️ Video playing');
      }
    } catch (error) {
      console.error('❌ Playback error:', error);
      toast({
        title: 'Playback Error',
        description: 'Could not play video. Try refreshing.',
        variant: 'destructive',
      });
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportVideo();
      if (!blob) {
        throw new Error('Export failed');
      }

      // Generate cover image (first frame)
      const video = videoRef.current;
      if (!video) throw new Error('No video element');

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      canvas.toBlob((coverBlob) => {
        if (coverBlob) {
          onDone(blob, coverBlob);
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not export video',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-white text-lg">Loading Editor...</p>
        <p className="text-white/60 text-sm mt-2">Preparing your workspace...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-white/10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <X className="h-5 w-5 text-white" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo}
            className="text-white disabled:opacity-30"
          >
            <Undo2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            className="text-white disabled:opacity-30"
          >
            <Redo2 className="h-5 w-5" />
          </Button>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="bg-primary hover:bg-primary/90"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {exportProgress}%
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Done
            </>
          )}
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Video Preview */}
        <VideoPreview
          videoRef={videoRef}
          videoUrl={videoUrl}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
        />

        {/* Playback Controls */}
        <div className="bg-black/95 backdrop-blur-sm border-t border-white/10 p-4">
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="flex-shrink-0"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 text-white" />
              ) : (
                <Play className="h-5 w-5 text-white" />
              )}
            </Button>
            <span className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTimeline(!showTimeline)}
              className="text-white"
            >
              <ChevronUp className={`h-5 w-5 transition-transform ${showTimeline ? '' : 'rotate-180'}`} />
            </Button>
          </div>
          
          {/* Timeline Scrubber */}
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={([value]) => handleSeek(value)}
            className="w-full"
          />
        </div>

        {/* Timeline (Collapsible) */}
        {showTimeline && (
          <TimelinePanel
            videoRef={videoRef}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
          />
        )}

        {/* Tool Panels */}
        {activeTool === 'text' && <TextEditor />}
        {activeTool === 'audio' && <AudioMixer />}
        {activeTool === 'filter' && <FilterPanel videoRef={videoRef} />}
        {activeTool === 'sticker' && <StickerPicker />}
        {activeTool === 'draw' && <DrawingCanvas videoRef={videoRef} />}

        {/* Bottom Toolbar */}
        <EditorToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
        />
      </div>
    </div>
  );
}
