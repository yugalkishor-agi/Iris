# 🎬 Glimpses Redesign - Part 2: Advanced Editor

## 🎥 Advanced Video Editor (CapCut-style)

### Editor Layout

```
┌──────────────────────────────────────────────────────┐
│  [Back]         Preview Area            [Done]       │
│  ┌────────────────────────────────────────────────┐  │
│  │                                                │  │
│  │          Video Preview (16:9 or 9:16)         │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  [▶] [00:00 / 00:30] [↶ Undo] [↷ Redo]             │
│                                                       │
│  ┌────────────── Timeline ──────────────────────┐   │
│  │ Video 1: ████████████████████████████        │   │
│  │ Video 2:     ████████                        │   │
│  │ Audio 1: ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈  │   │
│  │ Audio 2:         ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈  │   │
│  │ Voice:                ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈  │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ┌────────────── Tools ──────────────────────────┐  │
│  │ [Frame] [Clip] [Audio] [Filter] [Color]      │  │
│  │ [Speed] [Transition] [Text] [Sticker] [Lib]  │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## 🎞️ Core Features

### 1. Timeline Management

```typescript
interface TimelineState {
  duration: number;              // Total duration (ms)
  currentTime: number;           // Playhead position
  zoom: number;                  // 1-10
  tracks: {
    video: VideoClip[];
    audio: AudioClip[];
    voiceover: VoiceClip[];
  };
  selectedClip: string | null;
  history: EditorAction[];       // Undo/redo
  historyIndex: number;
}

interface VideoClip {
  id: string;
  url: string;
  startTime: number;             // Position in timeline
  duration: number;
  trimStart: number;             // Trim from original
  trimEnd: number;
  effects: Effect[];
  transition?: Transition;
}
```

**Features:**
- Multi-track (3 video + 3 audio)
- Drag to reorder
- Snap to grid
- Zoom timeline
- Playhead scrubbing
- Clip selection

### 2. Frame Management

```typescript
interface FrameOperation {
  duplicate: (clipId: string) => void;
  addFrame: (position: number) => void;
  removeFrame: (clipId: string) => void;
  splitClip: (clipId: string, time: number) => void;
}
```

**UI:**
- Right-click menu
- Duplicate button
- Add frame button
- Split at playhead

### 3. Clip Editor

```typescript
interface ClipEditor {
  trim: {
    start: number;
    end: number;
  };
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  speed: number;                 // 0.25x - 4x
  rotation: number;              // 0, 90, 180, 270
  flip: {
    horizontal: boolean;
    vertical: boolean;
  };
}
```

**UI:**
- Trim handles on timeline
- Crop overlay on preview
- Speed slider
- Rotation buttons
- Flip toggles

### 4. Audio Management

```typescript
interface AudioMixer {
  tracks: AudioTrack[];
  masterVolume: number;
  
  addAudio: (file: File) => void;
  trimAudio: (trackId: string, start: number, end: number) => void;
  adjustVolume: (trackId: string, volume: number) => void;
  addFade: (trackId: string, fadeIn: boolean, fadeOut: boolean) => void;
  recordVoiceOver: () => Promise<Blob>;
}

interface AudioTrack {
  id: string;
  url: string;
  volume: number;                // 0-100
  fadeIn: number;                // Duration (ms)
  fadeOut: number;
  muted: boolean;
  waveform: number[];            // Visualization
}
```

**Features:**
- Visual waveform
- Volume sliders
- Fade controls
- Mute/solo buttons
- Voice over recording (WebRTC)
- Audio trimmer

### 5. Color Grading

```typescript
interface ColorGrading {
  brightness: number;            // -100 to 100
  contrast: number;
  saturation: number;
  temperature: number;           // Cool to warm
  tint: number;                  // Green to magenta
  highlights: number;
  shadows: number;
  exposure: number;
  hue: number;                   // 0-360
  vignette: number;              // 0-100
}
```

**UI:**
- Slider controls
- Before/after split view
- Preset LUTs
- Reset button

### 6. Transitions

```typescript
interface Transition {
  type: 'fade' | 'slide' | 'zoom' | 'wipe' | 'dissolve';
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

const TRANSITIONS = [
  { name: 'Fade', type: 'fade' },
  { name: 'Slide Left', type: 'slide', direction: 'left' },
  { name: 'Slide Right', type: 'slide', direction: 'right' },
  { name: 'Zoom In', type: 'zoom', direction: 'in' },
  { name: 'Zoom Out', type: 'zoom', direction: 'out' },
  { name: 'Wipe', type: 'wipe' },
  { name: 'Dissolve', type: 'dissolve' },
];
```

**UI:**
- Transition picker between clips
- Duration slider
- Preview animation

### 7. Media Library

```typescript
interface MediaLibrary {
  // Stock Images
  searchImages: (query: string) => Promise<UnsplashImage[]>;
  
  // Stock Videos
  searchVideos: (query: string) => Promise<PexelsVideo[]>;
  
  // GIFs
  searchGifs: (query: string) => Promise<GiphyGif[]>;
  
  // Import
  addToTimeline: (media: Media, position: number) => void;
}
```

**APIs:**
- **Unsplash API** - Stock images
- **Pexels API** - Stock videos
- **Giphy API** - GIFs
- **Pixabay API** - Additional media

**UI:**
- Search bar
- Grid view
- Preview on hover
- Drag to timeline

### 8. Undo/Redo System

```typescript
interface EditorAction {
  type: 'add' | 'remove' | 'modify' | 'move';
  target: 'clip' | 'audio' | 'effect';
  data: any;
  timestamp: number;
}

class UndoRedoManager {
  private history: EditorAction[] = [];
  private currentIndex: number = -1;
  private maxHistory: number = 50;
  
  addAction(action: EditorAction): void {
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(action);
    this.currentIndex++;
    
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.currentIndex--;
    }
  }
  
  undo(): EditorAction | null {
    if (this.currentIndex < 0) return null;
    const action = this.history[this.currentIndex];
    this.currentIndex--;
    return action;
  }
  
  redo(): EditorAction | null {
    if (this.currentIndex >= this.history.length - 1) return null;
    this.currentIndex++;
    return this.history[this.currentIndex];
  }
}
```

**UI:**
- Undo button (Ctrl+Z)
- Redo button (Ctrl+Y)
- History panel
- Disabled states

### 9. Preview & Playback

```typescript
interface PlaybackControls {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;         // 0.25x - 2x
  
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: number) => void;
  
  // Frame-by-frame
  nextFrame: () => void;
  previousFrame: () => void;
}
```

**UI:**
- Play/Pause (spacebar)
- Timeline scrubber
- Time display
- Speed selector
- Frame step buttons
- Fullscreen toggle

---

## 🎨 Advanced Tools

### Voice Over Recording

```typescript
class VoiceOverRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  
  async startRecording(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: true 
    });
    
    this.mediaRecorder = new MediaRecorder(stream);
    this.chunks = [];
    
    this.mediaRecorder.ondataavailable = (e) => {
      this.chunks.push(e.data);
    };
    
    this.mediaRecorder.start();
  }
  
  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) return;
      
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        resolve(blob);
      };
      
      this.mediaRecorder.stop();
    });
  }
}
```

### Audio Trimmer

```typescript
class AudioTrimmer {
  async trimAudio(
    audioBlob: Blob, 
    startTime: number, 
    endTime: number
  ): Promise<Blob> {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.floor(endTime * sampleRate);
    const duration = endSample - startSample;
    
    const trimmedBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      duration,
      sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const trimmedData = trimmedBuffer.getChannelData(channel);
      
      for (let i = 0; i < duration; i++) {
        trimmedData[i] = channelData[startSample + i];
      }
    }
    
    return this.audioBufferToBlob(trimmedBuffer);
  }
}
```

### Clip Trimmer

```typescript
class ClipTrimmer {
  async trimVideo(
    videoBlob: Blob,
    startTime: number,
    endTime: number
  ): Promise<Blob> {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();
    
    await ffmpeg.writeFile('input.mp4', await fetchFile(videoBlob));
    
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-ss', startTime.toString(),
      '-to', endTime.toString(),
      '-c', 'copy',
      'output.mp4'
    ]);
    
    const data = await ffmpeg.readFile('output.mp4');
    return new Blob([data], { type: 'video/mp4' });
  }
}
```

### Crop Tool

```typescript
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

class VideoCropper {
  async cropVideo(
    videoBlob: Blob,
    cropArea: CropArea
  ): Promise<Blob> {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();
    
    await ffmpeg.writeFile('input.mp4', await fetchFile(videoBlob));
    
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-filter:v', `crop=${cropArea.width}:${cropArea.height}:${cropArea.x}:${cropArea.y}`,
      'output.mp4'
    ]);
    
    const data = await ffmpeg.readFile('output.mp4');
    return new Blob([data], { type: 'video/mp4' });
  }
}
```

---

## 🔧 Video Processing Service

```typescript
// services/video-editor.service.ts

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

class VideoEditorService {
  private ffmpeg: FFmpeg;
  
  constructor() {
    this.ffmpeg = new FFmpeg();
  }
  
  async initialize(): Promise<void> {
    await this.ffmpeg.load();
  }
  
  // Merge multiple clips
  async mergeClips(clips: VideoClip[]): Promise<Blob> {
    // Write all clips to FFmpeg filesystem
    for (let i = 0; i < clips.length; i++) {
      const clipBlob = await fetch(clips[i].url).then(r => r.blob());
      await this.ffmpeg.writeFile(`clip${i}.mp4`, await fetchFile(clipBlob));
    }
    
    // Create concat file
    const concatList = clips.map((_, i) => `file 'clip${i}.mp4'`).join('\n');
    await this.ffmpeg.writeFile('concat.txt', concatList);
    
    // Merge clips
    await this.ffmpeg.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat.txt',
      '-c', 'copy',
      'output.mp4'
    ]);
    
    const data = await this.ffmpeg.readFile('output.mp4');
    return new Blob([data], { type: 'video/mp4' });
  }
  
  // Extract frames from video
  async extractFrames(videoBlob: Blob, interval: number = 1): Promise<string[]> {
    await this.ffmpeg.writeFile('input.mp4', await fetchFile(videoBlob));
    
    // Extract frame every N seconds
    await this.ffmpeg.exec([
      '-i', 'input.mp4',
      '-vf', `fps=1/${interval}`,
      'frame%d.jpg'
    ]);
    
    // Read all generated frames
    const frames: string[] = [];
    let frameIndex = 1;
    
    while (true) {
      try {
        const data = await this.ffmpeg.readFile(`frame${frameIndex}.jpg`);
        const blob = new Blob([data], { type: 'image/jpeg' });
        frames.push(URL.createObjectURL(blob));
        frameIndex++;
      } catch {
        break;
      }
    }
    
    return frames;
  }
  
  // Apply filter to video
  async applyFilter(videoBlob: Blob, filter: string): Promise<Blob> {
    await this.ffmpeg.writeFile('input.mp4', await fetchFile(videoBlob));
    
    await this.ffmpeg.exec([
      '-i', 'input.mp4',
      '-vf', filter,
      'output.mp4'
    ]);
    
    const data = await this.ffmpeg.readFile('output.mp4');
    return new Blob([data], { type: 'video/mp4' });
  }
  
  // Merge video with audio
  async mergeAudioVideo(
    videoBlob: Blob,
    audioBlob: Blob
  ): Promise<Blob> {
    await this.ffmpeg.writeFile('video.mp4', await fetchFile(videoBlob));
    await this.ffmpeg.writeFile('audio.mp3', await fetchFile(audioBlob));
    
    await this.ffmpeg.exec([
      '-i', 'video.mp4',
      '-i', 'audio.mp3',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-map', '0:v:0',
      '-map', '1:a:0',
      'output.mp4'
    ]);
    
    const data = await this.ffmpeg.readFile('output.mp4');
    return new Blob([data], { type: 'video/mp4' });
  }
}

export const videoEditorService = new VideoEditorService();
```

---

**Continue to Part 3 for Publishing Flow & Series Linking...**
