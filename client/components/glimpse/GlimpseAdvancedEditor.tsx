import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Undo, Redo, Scissors, Copy, Plus, Trash2, Mic, Volume2, Palette, Crop as CropIcon, Zap, Image as ImageIcon, Film, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaLibrary } from './MediaLibrary';
import { VideoTimeline } from './VideoTimeline';
import { TrimmerTool } from './TrimmerTool';
import { CropTool } from './CropTool';

interface VideoClip {
  id: string;
  url: string;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
}

interface AudioTrack {
  id: string;
  url: string;
  volume: number;
  startTime: number;
  duration: number;
}

interface EditorAction {
  type: string;
  data: any;
}

interface GlimpseAdvancedEditorProps {
  initialVideo: string;
  onDone: (videoBlob: Blob) => void;
  onBack: () => void;
}

export function GlimpseAdvancedEditor({ initialVideo, onDone, onBack }: GlimpseAdvancedEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoClips, setVideoClips] = useState<VideoClip[]>([{
    id: 'clip-1',
    url: initialVideo,
    startTime: 0,
    duration: 0,
    trimStart: 0,
    trimEnd: 100,
  }]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip-1');
  const [history, setHistory] = useState<EditorAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeTool, setActiveTool] = useState<'frame' | 'clip' | 'audio' | 'color' | 'crop' | 'speed' | 'library' | 'effects' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [trimmerType, setTrimmerType] = useState<'video' | 'audio'>('video');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      const clips = [...videoClips];
      if (clips[0]) {
        clips[0].duration = video.duration;
        setVideoClips(clips);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleError = (e: Event) => {
      console.error('Video error:', e);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleError);

    // Load the video
    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleError);
    };
  }, [initialVideo]);

  const togglePlay = async () => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          await videoRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Playback error:', error);
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const addAction = (action: EditorAction) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(action);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      // Apply previous state
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      // Apply next state
    }
  };

  const duplicateClip = () => {
    if (!selectedClipId) return;
    const selectedClip = videoClips.find(c => c.id === selectedClipId);
    if (selectedClip) {
      const newClip: VideoClip = {
        ...selectedClip,
        id: `clip-${Date.now()}`,
        startTime: selectedClip.startTime + selectedClip.duration,
      };
      setVideoClips([...videoClips, newClip]);
      addAction({ type: 'duplicate', data: newClip });
    }
  };

  const splitClip = () => {
    if (!selectedClipId) return;
    const clipIndex = videoClips.findIndex(c => c.id === selectedClipId);
    if (clipIndex === -1) return;
    
    const clip = videoClips[clipIndex];
    const splitPoint = currentTime - clip.startTime;
    
    const clip1: VideoClip = {
      ...clip,
      duration: splitPoint,
      trimEnd: (splitPoint / clip.duration) * 100,
    };
    
    const clip2: VideoClip = {
      ...clip,
      id: `clip-${Date.now()}`,
      startTime: clip.startTime + splitPoint,
      duration: clip.duration - splitPoint,
      trimStart: (splitPoint / clip.duration) * 100,
    };
    
    const newClips = [...videoClips];
    newClips.splice(clipIndex, 1, clip1, clip2);
    setVideoClips(newClips);
    addAction({ type: 'split', data: { clip1, clip2 } });
  };

  const deleteClip = () => {
    if (!selectedClipId) return;
    const newClips = videoClips.filter(c => c.id !== selectedClipId);
    setVideoClips(newClips);
    setSelectedClipId(null);
    addAction({ type: 'delete', data: selectedClipId });
  };

  const startVoiceOver = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const newTrack: AudioTrack = {
          id: `audio-${Date.now()}`,
          url,
          volume: 100,
          startTime: currentTime,
          duration: 0,
        };
        setAudioTracks([...audioTracks, newTrack]);
        setIsRecording(false);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Stop after 10 seconds max
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 10000);
    } catch (error) {
      console.error('Voice recording failed:', error);
    }
  };

  const stopVoiceOver = () => {
    setIsRecording(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectImage = (url: string) => {
    // Add image as a new clip
    const newClip: VideoClip = {
      id: `clip-${Date.now()}`,
      url,
      startTime: duration,
      duration: 3, // 3 seconds for images
      trimStart: 0,
      trimEnd: 100,
    };
    setVideoClips([...videoClips, newClip]);
    addAction({ type: 'add', data: newClip });
    setShowMediaLibrary(false);
  };

  const handleSelectGif = (url: string) => {
    // Add GIF as a new clip
    const newClip: VideoClip = {
      id: `clip-${Date.now()}`,
      url,
      startTime: duration,
      duration: 3, // 3 seconds for GIFs
      trimStart: 0,
      trimEnd: 100,
    };
    setVideoClips([...videoClips, newClip]);
    addAction({ type: 'add', data: newClip });
    setShowMediaLibrary(false);
  };

  const handleDone = () => {
    // Export final video with all edits
    // For now, just pass the original
    fetch(initialVideo)
      .then(r => r.blob())
      .then(blob => onDone(blob));
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/90 backdrop-blur border-b border-white/10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <X className="h-5 w-5 text-white" />
        </Button>
        <h1 className="text-white font-semibold">Advanced Editor</h1>
        <Button onClick={handleDone} className="bg-primary">
          Done
        </Button>
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="relative w-full max-w-md aspect-[9/16]">
          <video
            ref={videoRef}
            src={initialVideo}
            className="w-full h-full object-contain bg-black"
            style={{
              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
            }}
            playsInline
            preload="metadata"
          />
        </div>
      </div>

      {/* Playback Controls */}
      <div className="bg-black/90 backdrop-blur border-t border-white/10 p-4">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="icon" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white" />}
          </Button>
          <span className="text-white text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex <= 0}>
            <Undo className="h-4 w-4 text-white" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo className="h-4 w-4 text-white" />
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

      {/* Timeline */}
      <div className="bg-black/95 backdrop-blur border-t border-white/10 p-4 max-h-32 overflow-y-auto">
        <div className="space-y-2">
          {/* Video Track */}
          <div>
            <p className="text-white/60 text-xs mb-1">Video</p>
            <div className="flex gap-2 overflow-x-auto">
              {videoClips.map(clip => (
                <button
                  key={clip.id}
                  onClick={() => setSelectedClipId(clip.id)}
                  className={`flex-shrink-0 h-12 rounded bg-primary/20 border-2 px-2 ${
                    selectedClipId === clip.id ? 'border-primary' : 'border-transparent'
                  }`}
                  style={{ width: `${(clip.duration / duration) * 200}px` }}
                >
                  <Film className="h-4 w-4 text-white" />
                </button>
              ))}
            </div>
          </div>
          
          {/* Audio Track */}
          {audioTracks.length > 0 && (
            <div>
              <p className="text-white/60 text-xs mb-1">Audio</p>
              <div className="flex gap-2 overflow-x-auto">
                {audioTracks.map(track => (
                  <div
                    key={track.id}
                    className="flex-shrink-0 h-12 rounded bg-green-500/20 border border-green-500/50 px-2 flex items-center"
                    style={{ width: `${(track.duration / duration) * 200}px` }}
                  >
                    <Volume2 className="h-4 w-4 text-green-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tools Panel - Always Visible */}
      <div className="bg-gradient-to-t from-black via-gray-900 to-black border-t border-white/20">
        {!activeTool ? (
          <div className="p-4">
            <p className="text-white/60 text-xs mb-3 text-center">Editing Tools</p>
            <div className="grid grid-cols-4 gap-3">
              <button 
                onClick={() => setActiveTool('frame')} 
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
              >
                <Copy className="h-6 w-6 text-primary" />
                <span className="text-xs text-white font-medium">Frame</span>
              </button>
              <button 
                onClick={() => setActiveTool('clip')} 
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
              >
                <Scissors className="h-6 w-6 text-blue-400" />
                <span className="text-xs text-white font-medium">Clip</span>
              </button>
              <button 
                onClick={() => setActiveTool('audio')} 
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
              >
                <Mic className="h-6 w-6 text-red-400" />
                <span className="text-xs text-white font-medium">Audio</span>
              </button>
              <button 
                onClick={() => setActiveTool('color')} 
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
              >
                <Palette className="h-6 w-6 text-purple-400" />
                <span className="text-xs text-white font-medium">Color</span>
              </button>
              <button 
                onClick={() => setActiveTool('crop')} 
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
              >
                <CropIcon className="h-6 w-6 text-green-400" />
                <span className="text-xs text-white font-medium">Crop</span>
              </button>
              <button 
                onClick={() => setActiveTool('speed')} 
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
              >
                <Zap className="h-6 w-6 text-yellow-400" />
                <span className="text-xs text-white font-medium">Speed</span>
              </button>
              <button 
                onClick={() => setShowMediaLibrary(true)} 
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
              >
                <ImageIcon className="h-6 w-6 text-cyan-400" />
                <span className="text-xs text-white font-medium">Library</span>
              </button>
              <button 
                onClick={() => setActiveTool('effects')} 
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
              >
                <Film className="h-6 w-6 text-pink-400" />
                <span className="text-xs text-white font-medium">Effects</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Frame Tools */}
        {activeTool === 'frame' && (
          <div className="p-4 space-y-2">
            <Button onClick={duplicateClip} className="w-full">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate Frame
            </Button>
            <Button onClick={splitClip} className="w-full">
              <Scissors className="h-4 w-4 mr-2" />
              Split at Playhead
            </Button>
            <Button onClick={deleteClip} variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Frame
            </Button>
            <Button variant="ghost" onClick={() => setActiveTool(null)} className="w-full">
              Close
            </Button>
          </div>
        )}

        {/* Clip Tools */}
        {activeTool === 'clip' && (
          <div className="p-4 space-y-2">
            <Button onClick={() => setShowTrimmer(true)} className="w-full bg-blue-600">
              <Scissors className="h-4 w-4 mr-2" />
              Trim Video
            </Button>
            <Button onClick={splitClip} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Split at Playhead
            </Button>
            <Button onClick={duplicateClip} className="w-full">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate Clip
            </Button>
            <Button variant="ghost" onClick={() => setActiveTool(null)} className="w-full">
              Close
            </Button>
          </div>
        )}

        {/* Audio Tools */}
        {activeTool === 'audio' && (
          <div className="p-4 space-y-2">
            {!isRecording ? (
              <Button onClick={startVoiceOver} className="w-full bg-red-600">
                <Mic className="h-4 w-4 mr-2" />
                Start Voice Over
              </Button>
            ) : (
              <Button onClick={stopVoiceOver} variant="destructive" className="w-full animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                  Stop Recording
                </div>
              </Button>
            )}
            <Button onClick={() => setShowTrimmer(true)} className="w-full" disabled={audioTracks.length === 0}>
              <Scissors className="h-4 w-4 mr-2" />
              Trim Audio
            </Button>
            <Button variant="ghost" onClick={() => setActiveTool(null)} className="w-full">
              Close
            </Button>
          </div>
        )}

        {/* Color Grading */}
        {activeTool === 'color' && (
          <div className="p-4 space-y-4">
            <div>
              <label className="text-white text-sm">Brightness</label>
              <Slider
                value={[brightness]}
                min={0}
                max={200}
                step={1}
                onValueChange={([value]) => setBrightness(value)}
              />
            </div>
            <div>
              <label className="text-white text-sm">Contrast</label>
              <Slider
                value={[contrast]}
                min={0}
                max={200}
                step={1}
                onValueChange={([value]) => setContrast(value)}
              />
            </div>
            <div>
              <label className="text-white text-sm">Saturation</label>
              <Slider
                value={[saturation]}
                min={0}
                max={200}
                step={1}
                onValueChange={([value]) => setSaturation(value)}
              />
            </div>
            <Button variant="ghost" onClick={() => setActiveTool(null)} className="w-full">
              Close
            </Button>
          </div>
        )}

        {/* Crop Tool */}
        {activeTool === 'crop' && (
          <div className="p-4 space-y-3">
            <p className="text-white text-sm font-medium">Aspect Ratio</p>
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => setShowCrop(true)} variant="outline" className="h-16">
                <div className="text-center">
                  <p className="text-xs">Free</p>
                </div>
              </Button>
              <Button onClick={() => setShowCrop(true)} variant="outline" className="h-16">
                <div className="text-center">
                  <p className="text-xs">1:1</p>
                  <p className="text-xs text-white/60">Square</p>
                </div>
              </Button>
              <Button onClick={() => setShowCrop(true)} variant="outline" className="h-16">
                <div className="text-center">
                  <p className="text-xs">4:5</p>
                  <p className="text-xs text-white/60">Portrait</p>
                </div>
              </Button>
              <Button onClick={() => setShowCrop(true)} variant="outline" className="h-16">
                <div className="text-center">
                  <p className="text-xs">9:16</p>
                  <p className="text-xs text-white/60">Vertical</p>
                </div>
              </Button>
              <Button onClick={() => setShowCrop(true)} variant="outline" className="h-16">
                <div className="text-center">
                  <p className="text-xs">16:9</p>
                  <p className="text-xs text-white/60">Horizontal</p>
                </div>
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setActiveTool(null)} className="w-full">
              Close
            </Button>
          </div>
        )}

        {/* Speed Tool */}
        {activeTool === 'speed' && (
          <div className="p-4 space-y-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Playback Speed: {speed}x</label>
              <Slider
                value={[speed]}
                min={0.25}
                max={4}
                step={0.25}
                onValueChange={([value]) => {
                  setSpeed(value);
                  if (videoRef.current) {
                    videoRef.current.playbackRate = value;
                  }
                }}
                className="mb-4"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Button onClick={() => { setSpeed(0.25); if(videoRef.current) videoRef.current.playbackRate = 0.25; }} variant="outline" size="sm">0.25x</Button>
              <Button onClick={() => { setSpeed(0.5); if(videoRef.current) videoRef.current.playbackRate = 0.5; }} variant="outline" size="sm">0.5x</Button>
              <Button onClick={() => { setSpeed(1); if(videoRef.current) videoRef.current.playbackRate = 1; }} variant="outline" size="sm" className="bg-primary">1x</Button>
              <Button onClick={() => { setSpeed(1.5); if(videoRef.current) videoRef.current.playbackRate = 1.5; }} variant="outline" size="sm">1.5x</Button>
              <Button onClick={() => { setSpeed(2); if(videoRef.current) videoRef.current.playbackRate = 2; }} variant="outline" size="sm">2x</Button>
              <Button onClick={() => { setSpeed(3); if(videoRef.current) videoRef.current.playbackRate = 3; }} variant="outline" size="sm">3x</Button>
              <Button onClick={() => { setSpeed(4); if(videoRef.current) videoRef.current.playbackRate = 4; }} variant="outline" size="sm">4x</Button>
            </div>
            <Button variant="ghost" onClick={() => setActiveTool(null)} className="w-full mt-4">
              Close
            </Button>
          </div>
        )}

        {/* Effects Tool */}
        {activeTool === 'effects' && (
          <div className="p-4 space-y-3">
            <p className="text-white text-sm font-medium mb-2">Video Effects</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-20 flex flex-col gap-1">
                <span className="text-xs">Blur</span>
                <span className="text-xs text-white/60">Background</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-1">
                <span className="text-xs">Vignette</span>
                <span className="text-xs text-white/60">Dark edges</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-1">
                <span className="text-xs">Sharpen</span>
                <span className="text-xs text-white/60">Enhance</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-1">
                <span className="text-xs">Grain</span>
                <span className="text-xs text-white/60">Film look</span>
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setActiveTool(null)} className="w-full mt-4">
              Close
            </Button>
          </div>
        )}
      </div>

      {/* Trimmer Tool Modal */}
      {showTrimmer && (
        <TrimmerTool
          type={trimmerType}
          duration={duration}
          initialStart={0}
          initialEnd={duration}
          onTrim={(start, end) => {
            console.log('Trim:', start, end);
            setShowTrimmer(false);
          }}
          onCancel={() => setShowTrimmer(false)}
        />
      )}

      {/* Crop Tool Modal */}
      {showCrop && initialVideo && (
        <CropTool
          videoUrl={initialVideo}
          onCrop={(cropData) => {
            console.log('Crop:', cropData);
            setShowCrop(false);
          }}
          onCancel={() => setShowCrop(false)}
        />
      )}

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <MediaLibrary
          onSelectImage={handleSelectImage}
          onSelectGif={handleSelectGif}
          onClose={() => setShowMediaLibrary(false)}
        />
      )}
    </div>
  );
}
