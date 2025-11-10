import { useState, useRef, useEffect } from 'react';
import { Mic, X, Send, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Start timer
      timerRef.current = setInterval(() => {
        if (!isPaused) {
          setDuration(prev => prev + 1);
        }
      }, 1000);

      console.log('🎙️ Recording started');
    } catch (error) {
      console.error('❌ Recording error:', error);
      toast({
        title: 'Recording Failed',
        description: 'Could not access microphone',
        variant: 'destructive',
      });
      onCancel();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      pausedTimeRef.current = Date.now();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, duration);
    } else {
      stopRecording();
      setTimeout(() => {
        if (audioBlob) {
          onSend(audioBlob, duration);
        }
      }, 100);
    }
  };

  const handleCancel = () => {
    stopRecording();
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-black via-gray-900 to-transparent z-50 p-4">
      <div className="max-w-md mx-auto bg-gray-800 rounded-2xl p-4 shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Mic className="h-6 w-6 text-red-500" />
              </div>
              {isRecording && !isPaused && (
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
              )}
            </div>
            <div>
              <p className="text-white font-semibold">
                {isPaused ? 'Paused' : 'Recording...'}
              </p>
              <p className="text-white/60 text-sm">{formatTime(duration)}</p>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Waveform Visualization (Placeholder) */}
        <div className="mb-4 h-16 bg-gray-900 rounded-lg flex items-center justify-center gap-1 px-4">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-red-500 rounded-full transition-all duration-150"
              style={{
                height: isRecording && !isPaused 
                  ? `${Math.random() * 100}%` 
                  : '20%',
                opacity: isRecording && !isPaused ? 1 : 0.3,
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleCancel}
            className="flex-1"
          >
            <X className="h-5 w-5 mr-2" />
            Cancel
          </Button>

          {isRecording && (
            <Button
              variant="outline"
              size="icon"
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="w-12 h-12"
            >
              {isPaused ? (
                <Play className="h-5 w-5" />
              ) : (
                <Pause className="h-5 w-5" />
              )}
            </Button>
          )}

          <Button
            onClick={handleSend}
            size="lg"
            className="flex-1 bg-primary"
          >
            <Send className="h-5 w-5 mr-2" />
            Send
          </Button>
        </div>

        {/* Tips */}
        <p className="text-center text-white/40 text-xs mt-3">
          Max duration: 60 seconds
        </p>
      </div>
    </div>
  );
}
