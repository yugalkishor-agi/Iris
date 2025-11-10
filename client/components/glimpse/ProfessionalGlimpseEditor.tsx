import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Maximize2, Scissors, Split, Gauge, Palette, Wand2, Upload, Plus, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface ProfessionalGlimpseEditorProps {
  videoFile: File;
  onDone: (videoBlob: Blob, coverBlob: Blob) => void;
  onBack: () => void;
}

export function ProfessionalGlimpseEditor({ videoFile, onDone, onBack }: ProfessionalGlimpseEditorProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [videoUrl, setVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTool, setActiveTool] = useState<'trim' | 'split' | 'speed' | 'filters' | 'effects' | 'export' | 'none'>('none');
  const [audioWaveform, setAudioWaveform] = useState<number[]>([]);
  const [tracks, setTracks] = useState<any[]>([
    { id: 'video-1', type: 'video', name: 'Video Track 1', clips: [], height: 80 },
    { id: 'audio-1', type: 'audio', name: 'Audio Track 1', clips: [], height: 60 },
    { id: 'overlay-1', type: 'overlay', name: 'Overlay Track 1', clips: [], height: 60 },
  ]);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showClipProperties, setShowClipProperties] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [clipProperties, setClipProperties] = useState({
    speed: 1.0,
    volume: 100,
    opacity: 100,
    rotation: 0,
    scale: 100
  });

  // Video setup
  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    extractAudioWaveform(videoFile);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  // Extract real audio waveform
  const extractAudioWaveform = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const rawData = audioBuffer.getChannelData(0);
      const samples = 100;
      const blockSize = Math.floor(rawData.length / samples);
      const waveformData: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[i * blockSize + j]);
        }
        waveformData.push((sum / blockSize) * 100);
      }
      
      setAudioWaveform(waveformData);
    } catch (error) {
      console.error('Error extracting waveform:', error);
      // Fallback to random data
      setAudioWaveform(Array(100).fill(0).map(() => Math.random() * 80 + 20));
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoUrl]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekBackward = () => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.max(0, video.currentTime - 1);
  };

  const seekForward = () => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.min(duration, video.currentTime + 1);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDone = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((coverBlob) => {
        if (coverBlob) {
          onDone(videoFile, coverBlob);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const tools = [
    { id: 'trim', icon: Scissors, label: 'Trim' },
    { id: 'split', icon: Split, label: 'Split' },
    { id: 'speed', icon: Gauge, label: 'Speed' },
    { id: 'filters', icon: Palette, label: 'Filters' },
    { id: 'effects', icon: Wand2, label: 'Effects' },
    { id: 'export', icon: Upload, label: 'Export' },
  ];

  return (
    <div className="fixed inset-0 bg-[#1E1E1E] flex flex-col">
      {/* App Header Bar - Enhanced */}
      <div className="h-14 bg-gradient-to-r from-[#282828] to-[#1E1E1E] flex items-center justify-between px-4 border-b border-[#4CAF50]/20">
        <button onClick={onBack} className="p-2 hover:bg-[#4CAF50]/20 rounded-lg transition-all duration-200 active:scale-95">
          <X className="h-6 w-6 text-white" />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[#CCCCCC] text-sm font-medium">Video Editor</span>
          <div className="w-px h-6 bg-white/10" />
          <button 
            onClick={handleDone}
            className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-5 py-2 text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-[#4CAF50]/30 transition-all duration-200 active:scale-95"
          >
            Next
          </button>
        </div>
      </div>

      {/* Video Preview Area - Enhanced */}
      <div className="relative bg-gradient-to-b from-black via-[#0a0a0a] to-[#1E1E1E]" style={{ height: '45%' }}>
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              playsInline
              onClick={togglePlay}
            />
            {/* Play overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <button 
                  onClick={togglePlay}
                  className="w-20 h-20 bg-[#4CAF50]/90 rounded-full flex items-center justify-center hover:bg-[#4CAF50] transition-all duration-200 hover:scale-110 shadow-2xl shadow-[#4CAF50]/50"
                >
                  <Play className="h-10 w-10 text-white ml-1" />
                </button>
              </div>
            )}
            {/* Active border */}
            <div className="absolute inset-0 border-2 border-[#4CAF50]/50 pointer-events-none rounded-lg" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 border-4 border-[#4CAF50]/30 border-t-[#4CAF50] rounded-full animate-spin" />
            <p className="text-white/60 text-sm">Loading video...</p>
          </div>
        )}
      </div>

      {/* Playback & Timeline Navigation Controls - Enhanced */}
      <div className="bg-gradient-to-b from-[#282828] to-[#1E1E1E] py-4 border-b border-white/5">
        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4 px-4 mb-4">
          <button 
            onClick={seekBackward} 
            className="p-2.5 hover:bg-[#4CAF50]/20 rounded-lg transition-all duration-200 group active:scale-95"
          >
            <SkipBack className="h-5 w-5 text-white/80 group-hover:text-[#4CAF50] transition-colors" />
          </button>
          
          <button 
            onClick={togglePlay} 
            className="p-3 bg-[#4CAF50]/20 hover:bg-[#4CAF50]/30 rounded-full transition-all duration-200 active:scale-95 shadow-lg shadow-[#4CAF50]/20"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 text-[#4CAF50]" />
            ) : (
              <Play className="h-6 w-6 text-[#4CAF50] ml-0.5" />
            )}
          </button>
          
          <button 
            onClick={seekForward} 
            className="p-2.5 hover:bg-[#4CAF50]/20 rounded-lg transition-all duration-200 group active:scale-95"
          >
            <SkipForward className="h-5 w-5 text-white/80 group-hover:text-[#4CAF50] transition-colors" />
          </button>
          
          <div className="flex-1" />
          
          {/* Volume control */}
          <button className="p-2.5 hover:bg-white/10 rounded-lg transition-all duration-200 group">
            <svg className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
          
          <button className="p-2.5 hover:bg-white/10 rounded-lg transition-all duration-200 group">
            <Maximize2 className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Timecode Display - Enhanced */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-2 bg-black/30 px-4 py-1.5 rounded-full">
            <span className="text-[#4CAF50] text-sm font-mono font-semibold">
              {formatTime(currentTime)}
            </span>
            <span className="text-white/40 text-xs">/</span>
            <span className="text-white/60 text-sm font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Mini-Timeline Markers - Enhanced */}
        <div className="flex items-center justify-center gap-4 px-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#4CAF50]/30">
          {[...Array(Math.ceil(duration))].map((_, i) => (
            <button
              key={i}
              className="text-[#CCCCCC] text-xs whitespace-nowrap hover:text-[#4CAF50] transition-colors px-2 py-1 rounded hover:bg-white/5"
              onClick={() => {
                const video = videoRef.current;
                if (video) video.currentTime = i;
              }}
            >
              {formatTime(i)}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTION-GRADE Timeline Panel */}
      <div className="flex-1 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] overflow-hidden flex relative">
        {/* Main Timeline Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
        {/* Professional Timeline Header */}
        <div className="h-14 bg-[#252525] border-b-2 border-[#4CAF50]/30 flex items-center justify-between px-6 shadow-xl">
          {/* Left Section */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#4CAF50] to-[#66BB6A] rounded-lg flex items-center justify-center shadow-lg shadow-[#4CAF50]/30">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Timeline</h3>
                <p className="text-white/50 text-xs">Multi-Track Editor</p>
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-white/50 text-xs">Frame</span>
                <span className="text-[#4CAF50] text-sm font-mono font-bold">{Math.floor(currentTime * 30)}</span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-white/50 text-xs">FPS</span>
                <span className="text-white text-sm font-mono">30</span>
              </div>
            </div>
          </div>

          {/* Center Section - Zoom Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setZoom(0.5)}
              className="px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded transition-all"
            >
              Fit
            </button>
            <div className="flex items-center gap-2 bg-black/40 rounded-lg border border-white/10 overflow-hidden">
              <button
                onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                className="px-3 py-2 hover:bg-[#4CAF50]/20 transition-all group"
              >
                <svg className="w-4 h-4 text-white/60 group-hover:text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <div className="px-4 py-2 bg-black/30 min-w-[80px] text-center">
                <span className="text-white text-sm font-mono">{Math.round(zoom * 100)}%</span>
              </div>
              <button
                onClick={() => setZoom(Math.min(4, zoom + 0.25))}
                className="px-3 py-2 hover:bg-[#4CAF50]/20 transition-all group"
              >
                <svg className="w-4 h-4 text-white/60 group-hover:text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-all" title="Snap to Grid">
              <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-all" title="Settings">
              <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Professional Track Headers */}
          <div className="w-52 bg-gradient-to-b from-[#252525] to-[#1f1f1f] border-r-2 border-white/5 overflow-y-auto">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="border-b border-white/5 relative group"
                style={{ height: `${track.height + 10}px` }}
              >
                {/* Track Control Panel */}
                <div className="absolute inset-0 flex flex-col p-2">
                  {/* Top Row - Name & Type */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full shadow-lg ${
                        track.type === 'video' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                        track.type === 'audio' ? 'bg-gradient-to-br from-green-400 to-green-600' : 
                        'bg-gradient-to-br from-purple-400 to-purple-600'
                      }`} />
                      <input
                        type="text"
                        value={track.name}
                        className="bg-transparent text-white text-xs font-semibold w-24 outline-none border-b border-transparent hover:border-white/20 focus:border-[#4CAF50] transition-all"
                        onChange={(e) => {
                          const newTracks = [...tracks];
                          const index = tracks.findIndex(t => t.id === track.id);
                          newTracks[index].name = e.target.value;
                          setTracks(newTracks);
                        }}
                      />
                    </div>
                    <button className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-all">
                      <svg className="w-3.5 h-3.5 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>

                  {/* Middle Row - Track Controls */}
                  <div className="flex items-center gap-1.5 mb-2">
                    {/* Solo */}
                    <button 
                      className="w-6 h-6 rounded bg-black/30 hover:bg-yellow-500/20 border border-white/10 hover:border-yellow-500 flex items-center justify-center transition-all group/solo"
                      title="Solo"
                    >
                      <span className="text-[10px] font-bold text-white/60 group-hover/solo:text-yellow-500">S</span>
                    </button>
                    {/* Mute */}
                    <button 
                      className="w-6 h-6 rounded bg-black/30 hover:bg-red-500/20 border border-white/10 hover:border-red-500 flex items-center justify-center transition-all group/mute"
                      title="Mute"
                    >
                      <span className="text-[10px] font-bold text-white/60 group-hover/mute:text-red-500">M</span>
                    </button>
                    {/* Lock */}
                    <button 
                      className="w-6 h-6 rounded bg-black/30 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500 flex items-center justify-center transition-all group/lock"
                      title="Lock"
                    >
                      <svg className="w-3 h-3 text-white/60 group-hover/lock:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </button>
                  </div>

                  {/* Bottom Row - Volume/Opacity */}
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      defaultValue="80"
                      className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#4CAF50]"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add Track Button - Enhanced */}
            <button className="w-full py-4 bg-gradient-to-r from-[#4CAF50]/10 to-[#66BB6A]/10 hover:from-[#4CAF50]/20 hover:to-[#66BB6A]/20 border-t border-[#4CAF50]/20 flex items-center justify-center gap-2 transition-all group">
              <div className="w-6 h-6 rounded-full bg-[#4CAF50]/20 group-hover:bg-[#4CAF50]/30 flex items-center justify-center transition-all">
                <Plus className="w-4 h-4 text-[#4CAF50]" />
              </div>
              <span className="text-[#4CAF50] text-xs font-semibold">Add New Track</span>
            </button>
          </div>

          {/* Timeline Tracks Area */}
          <div className="flex-1 overflow-auto relative bg-[#1a1a1a]">
            {/* Professional Time Ruler */}
            <div className="sticky top-0 h-10 bg-gradient-to-b from-[#2a2a2a] to-[#252525] border-b-2 border-[#4CAF50]/20 flex items-center z-20 shadow-lg">
              {[...Array(Math.ceil(duration * zoom * 4))].map((_, i) => {
                const timeValue = i / (zoom * 4);
                const isSecond = i % 4 === 0;
                return (
                  <div
                    key={i}
                    className="flex-shrink-0 border-l h-full relative"
                    style={{ 
                      width: `${15 * zoom}px`,
                      borderColor: isSecond ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'
                    }}
                  >
                    {isSecond && (
                      <div className="absolute top-1 left-1 flex flex-col">
                        <span className="text-white/60 text-[10px] font-mono font-bold">{formatTime(timeValue)}</span>
                        <span className="text-white/30 text-[8px] font-mono">F{Math.floor(timeValue * 30)}</span>
                      </div>
                    )}
                    {!isSecond && (
                      <div className="absolute top-0 left-0 w-px h-2 bg-white/10" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tracks */}
            <div className="relative">
              {tracks.map((track, trackIndex) => (
                <div
                  key={track.id}
                  className="border-b border-white/5 relative"
                  style={{ height: `${track.height}px` }}
                >
                  {/* Track Background Grid - Enhanced */}
                  <div className="absolute inset-0 flex">
                    {[...Array(Math.ceil(duration * zoom * 4))].map((_, i) => {
                      const isSecond = i % 4 === 0;
                      return (
                        <div
                          key={i}
                          className="flex-shrink-0 border-l"
                          style={{ 
                            width: `${15 * zoom}px`,
                            borderColor: isSecond ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)'
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Video Track Content - Professional */}
                  {track.type === 'video' && (
                    <div className="absolute inset-0 flex items-center px-2">
                      {/* Professional Video Clip */}
                      <div
                        className={`relative rounded-lg overflow-hidden cursor-move group transition-all duration-200 ${
                          selectedClip === 'video-clip-1' 
                            ? 'ring-2 ring-[#4CAF50] ring-offset-2 ring-offset-[#1a1a1a] shadow-2xl shadow-[#4CAF50]/30' 
                            : 'shadow-lg hover:shadow-xl'
                        }`}
                        style={{ 
                          width: `${duration * 60 * zoom}px`,
                          height: `${track.height - 10}px`
                        }}
                        onClick={() => setSelectedClip('video-clip-1')}
                      >
                        {/* Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-blue-500/30 to-blue-700/40" />
                        
                        {/* Video Thumbnails Strip */}
                        <div className="absolute inset-0 flex">
                          {[...Array(Math.max(4, Math.floor(duration * 2)))].map((_, i) => (
                            <div
                              key={i}
                              className="flex-1 relative bg-gradient-to-br from-gray-800 to-gray-900 border-r border-blue-900/20"
                            >
                              {/* Frame number */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white/20 text-xs font-mono">{i * 15}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Clip Info Overlay */}
                        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent p-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            <span className="text-white text-[10px] font-semibold truncate max-w-[150px]">
                              {videoFile.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-white/60 text-[9px] font-mono">
                            <span>{formatTime(0)}</span>
                            <span>→</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                        </div>
                        
                        {/* Trim Handles - Professional */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-r from-blue-400 to-transparent cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-8 bg-blue-400 rounded-r shadow-lg" />
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-l from-blue-400 to-transparent cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-8 bg-blue-400 rounded-l shadow-lg" />
                        </div>
                        
                        {/* Duration Indicator */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 flex items-center justify-center">
                          <span className="text-white/80 text-[10px] font-mono font-bold">{formatTime(duration)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audio Track Content - Professional */}
                  {track.type === 'audio' && (
                    <div className="absolute inset-0 flex items-center px-2">
                      {/* Professional Audio Clip */}
                      <div
                        className={`relative rounded-lg overflow-hidden cursor-move group transition-all duration-200 ${
                          selectedClip === 'audio-clip-1' 
                            ? 'ring-2 ring-[#4CAF50] ring-offset-2 ring-offset-[#1a1a1a] shadow-2xl shadow-[#4CAF50]/30' 
                            : 'shadow-lg hover:shadow-xl'
                        }`}
                        style={{ 
                          width: `${duration * 60 * zoom}px`,
                          height: `${track.height - 10}px`
                        }}
                        onClick={() => setSelectedClip('audio-clip-1')}
                      >
                        {/* Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 via-emerald-800/20 to-green-950/40" />
                        
                        {/* Real Audio Waveform - Enhanced */}
                        <div className="absolute inset-0 flex items-center justify-center px-2">
                          <div className="w-full h-full flex items-center gap-px">
                            {audioWaveform.map((height, i) => (
                              <div key={i} className="flex-1 flex items-center justify-center">
                                <div
                                  className="w-full rounded-full transition-all duration-100 hover:bg-[#66BB6A]"
                                  style={{ 
                                    height: `${height}%`,
                                    background: `linear-gradient(to top, #4CAF50 0%, #66BB6A 50%, #4CAF50 100%)`
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Audio Info Overlay */}
                        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-1.5 flex items-center justify-between z-10">
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5">
                              <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                              <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                              <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-white text-[9px] font-semibold">Audio</span>
                          </div>
                          <div className="flex items-center gap-1 text-white/50 text-[8px] font-mono">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                            </svg>
                            <span>80%</span>
                          </div>
                        </div>
                        
                        {/* Trim Handles - Professional */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-r from-green-400 to-transparent cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all z-10">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-8 bg-green-400 rounded-r shadow-lg" />
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-l from-green-400 to-transparent cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all z-10">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-8 bg-green-400 rounded-l shadow-lg" />
                        </div>
                        
                        {/* Duration Indicator */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1 flex items-center justify-center z-10">
                          <span className="text-white/80 text-[9px] font-mono font-bold">{formatTime(duration)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Overlay Track Content */}
                  {track.type === 'overlay' && (
                    <div className="absolute inset-0 flex items-center px-2">
                      <button className="px-3 py-1.5 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/50 rounded text-white text-xs transition-all">
                        + Add Overlay
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Professional Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-red-400 to-red-500 z-30 shadow-2xl shadow-red-500/50 pointer-events-none"
                style={{ left: `${currentTime * 60 * zoom}px` }}
              >
                {/* Top Handle */}
                <div className="absolute -top-3 -left-3 w-6 h-6 bg-gradient-to-br from-red-400 to-red-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                {/* Time Display */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] font-mono font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  {formatTime(currentTime)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Timeline Tools Bar */}
        <div className="h-16 bg-gradient-to-r from-[#252525] via-[#2a2a2a] to-[#252525] border-t-2 border-[#4CAF50]/20 flex items-center justify-between px-6 shadow-2xl">
          {/* Left - Edit Tools */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/10 hover:from-blue-600/30 hover:to-blue-500/20 border border-blue-500/30 rounded-lg transition-all group">
              <Scissors className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
              <span className="text-white text-xs font-semibold">Split</span>
              <kbd className="ml-1 px-1.5 py-0.5 bg-black/40 text-[9px] text-white/60 rounded border border-white/10">S</kbd>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-purple-500/10 hover:from-purple-600/30 hover:to-purple-500/20 border border-purple-500/30 rounded-lg transition-all group">
              <svg className="w-4 h-4 text-purple-400 group-hover:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
              <span className="text-white text-xs font-semibold">Trim</span>
              <kbd className="ml-1 px-1.5 py-0.5 bg-black/40 text-[9px] text-white/60 rounded border border-white/10">T</kbd>
            </button>
            <div className="h-8 w-px bg-white/10" />
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg transition-all">
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span className="text-white/60 text-xs">Snap</span>
            </button>
          </div>

          {/* Center - Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-lg border border-white/10">
              <svg className="w-4 h-4 text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white/50 text-xs">Duration</span>
              <span className="text-white font-mono font-bold text-sm">{formatTime(duration)}</span>
            </div>
            {selectedClip && (
              <div className="flex items-center gap-2 bg-[#4CAF50]/20 px-4 py-2 rounded-lg border border-[#4CAF50]/30">
                <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse" />
                <span className="text-[#4CAF50] text-xs font-semibold">Clip Selected</span>
              </div>
            )}
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 hover:bg-white/5 rounded-lg transition-all" title="Undo">
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button className="px-3 py-2 hover:bg-white/5 rounded-lg transition-all" title="Redo">
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Bottom Editing Tools Bar - Enhanced */}
      <div className="h-24 bg-gradient-to-t from-[#282828] to-[#1E1E1E] border-t-2 border-[#4CAF50]/20 shadow-2xl">
        <div className="flex items-center justify-around h-full px-3 overflow-x-auto scrollbar-thin scrollbar-thumb-[#4CAF50]/30">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as any)}
              className={`relative flex flex-col items-center justify-center min-w-[70px] px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTool === tool.id
                  ? 'bg-gradient-to-br from-[#4CAF50]/30 to-[#66BB6A]/20 scale-105'
                  : 'hover:bg-white/5 active:scale-95'
              }`}
            >
              <div className={`p-2 rounded-lg mb-1.5 transition-all duration-200 ${
                activeTool === tool.id
                  ? 'bg-[#4CAF50]/20'
                  : 'bg-transparent group-hover:bg-white/5'
              }`}>
                <tool.icon className={`h-6 w-6 transition-all duration-200 ${
                  activeTool === tool.id ? 'text-[#4CAF50]' : 'text-white/80 group-hover:text-white'
                }`} />
              </div>
              <span className={`text-xs font-medium transition-all duration-200 ${
                activeTool === tool.id ? 'text-[#4CAF50] font-semibold' : 'text-white/70 group-hover:text-white'
              }`}>
                {tool.label}
              </span>
              {activeTool === tool.id && (
                <>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-transparent via-[#4CAF50] to-transparent rounded-full" />
                  <div className="absolute inset-0 border-2 border-[#4CAF50]/30 rounded-xl" />
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
