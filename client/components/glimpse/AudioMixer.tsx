import { useState, useRef } from 'react';
import { X, Music, Mic, Upload, Volume2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useGlimpseEditorStore, AudioTrack } from '@/stores/glimpseEditorStore';
import { useToast } from '@/hooks/use-toast';

export function AudioMixer() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const {
    audioTracks,
    addAudioTrack,
    updateAudioTrack,
    deleteAudioTrack,
    masterVolume,
    setMasterVolume,
    currentTime,
    setActiveTool,
  } = useGlimpseEditorStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an audio file',
        variant: 'destructive',
      });
      return;
    }

    const url = URL.createObjectURL(file);
    const audio = new Audio(url);

    audio.onloadedmetadata = () => {
      const newTrack: AudioTrack = {
        id: `audio-${Date.now()}`,
        url,
        file,
        name: file.name,
        type: 'music',
        volume: 100,
        startTime: currentTime,
        duration: audio.duration,
        fadeIn: 0,
        fadeOut: 0,
        loop: false,
      };

      addAudioTrack(newTrack);

      toast({
        title: 'Audio Added',
        description: file.name,
      });
    };
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);

        const newTrack: AudioTrack = {
          id: `voiceover-${Date.now()}`,
          url,
          name: `Voiceover ${recordingTime}s`,
          type: 'voiceover',
          volume: 100,
          startTime: currentTime,
          duration: recordingTime,
          fadeIn: 0,
          fadeOut: 0,
          loop: false,
        };

        addAudioTrack(newTrack);
        setRecordingTime(0);

        toast({
          title: 'Voiceover Added',
          description: `Recorded ${recordingTime} seconds`,
        });
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Auto stop after 60 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
          clearInterval(interval);
          stream.getTracks().forEach(track => track.stop());
        }
      }, 60000);
    } catch (error) {
      console.error('Recording failed:', error);
      toast({
        title: 'Recording Failed',
        description: 'Could not access microphone',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-black via-gray-900 to-transparent z-40 p-6 max-h-[80vh] overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Music className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-white text-lg font-semibold">Audio Mixer</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setActiveTool('none')}>
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Add Audio Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="h-24 flex-col gap-2 border-white/20 hover:bg-white/10"
          >
            <Upload className="h-6 w-6 text-white" />
            <span className="text-white">Upload Music</span>
          </Button>

          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant="outline"
            className={`h-24 flex-col gap-2 border-white/20 ${
              isRecording ? 'bg-red-500/20 border-red-500' : 'hover:bg-white/10'
            }`}
          >
            <Mic className={`h-6 w-6 ${isRecording ? 'text-red-500' : 'text-white'}`} />
            <span className="text-white">
              {isRecording ? `Recording ${recordingTime}s` : 'Record Voiceover'}
            </span>
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Master Volume */}
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Volume2 className="h-5 w-5 text-white" />
            <span className="text-white font-medium">Master Volume</span>
            <span className="text-white/60 text-sm ml-auto">{masterVolume}%</span>
          </div>
          <Slider
            value={[masterVolume]}
            min={0}
            max={100}
            step={1}
            onValueChange={([val]) => setMasterVolume(val)}
            className="w-full"
          />
        </div>

        {/* Audio Tracks */}
        {audioTracks.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-white font-medium mb-3">Audio Tracks</h4>
            {audioTracks.map((track) => (
              <div key={track.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {track.type === 'voiceover' ? (
                      <Mic className="h-5 w-5 text-red-400" />
                    ) : (
                      <Music className="h-5 w-5 text-green-400" />
                    )}
                    <div>
                      <p className="text-white font-medium">{track.name}</p>
                      <p className="text-white/60 text-xs">
                        {track.duration.toFixed(1)}s • {track.type}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAudioTrack(track.id)}
                    className="text-red-400 hover:text-red-500"
                  >
                    Delete
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/80 text-sm">Volume</span>
                      <span className="text-white/60 text-sm">{track.volume}%</span>
                    </div>
                    <Slider
                      value={[track.volume]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([val]) => updateAudioTrack(track.id, { volume: val })}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-white/80 text-sm block mb-1">Fade In</span>
                      <Slider
                        value={[track.fadeIn]}
                        min={0}
                        max={5}
                        step={0.1}
                        onValueChange={([val]) => updateAudioTrack(track.id, { fadeIn: val })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <span className="text-white/80 text-sm block mb-1">Fade Out</span>
                      <Slider
                        value={[track.fadeOut]}
                        min={0}
                        max={5}
                        step={0.1}
                        onValueChange={([val]) => updateAudioTrack(track.id, { fadeOut: val })}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateAudioTrack(track.id, { loop: !track.loop })}
                    className={track.loop ? 'bg-primary/20 border-primary' : ''}
                  >
                    {track.loop ? 'Looping' : 'Loop Off'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {audioTracks.length === 0 && (
          <div className="text-center py-12">
            <Music className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No audio tracks yet</p>
            <p className="text-white/40 text-sm">Add music or record a voiceover to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
