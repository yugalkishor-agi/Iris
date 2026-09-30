import { create } from 'zustand';

// ==================== TYPES ====================
export interface VideoClip {
  id: string;
  url: string;
  file?: File;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  volume: number;
}

export interface AudioTrack {
  id: string;
  url: string;
  file?: File;
  name: string;
  type: 'music' | 'voiceover' | 'original';
  volume: number;
  startTime: number;
  duration: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
}

export interface TextLayer {
  id: string;
  content: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  stroke?: string;
  strokeWidth: number;
  align: 'left' | 'center' | 'right';
  fontStyle: 'normal' | 'italic';
  fontWeight: 'normal' | 'bold';
  underline: boolean;
  textDecoration: 'none' | 'underline' | 'line-through';
  animation: 'none' | 'fade' | 'bounce' | 'slide' | 'zoom' | 'typewriter';
  startTime: number;
  endTime: number;
  backgroundColor?: string;
  shadow: boolean;
  shadowBlur: number;
  shadowColor: string;
}

export interface StickerLayer {
  id: string;
  type: 'sticker' | 'gif' | 'emoji';
  url: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  width: number;
  height: number;
  startTime: number;
  endTime: number;
  opacity: number;
}

export interface DrawingStroke {
  id: string;
  tool: 'pen' | 'marker' | 'neon' | 'highlighter' | 'arrow';
  points: number[];
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface FilterState {
  name: string;
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  temperature: number;
  sharpness: number;
  blur: number;
  vignette: number;
}

export interface EditorAction {
  type: string;
  timestamp: number;
  data: any;
}

// ==================== STORE ====================
interface GlimpseEditorState {
  // Core Engine
  ffmpeg: any;
  ffmpegLoaded: boolean;
  initFFmpeg: () => Promise<void>;

  // Project
  projectId: string | null;
  projectName: string;
  setProjectName: (name: string) => void;

  // Video Clips
  clips: VideoClip[];
  addClip: (clip: VideoClip) => void;
  updateClip: (id: string, updates: Partial<VideoClip>) => void;
  deleteClip: (id: string) => void;
  splitClip: (id: string, splitTime: number) => void;
  duplicateClip: (id: string) => void;
  selectedClipId: string | null;
  setSelectedClip: (id: string | null) => void;

  // Audio Tracks
  audioTracks: AudioTrack[];
  addAudioTrack: (track: AudioTrack) => void;
  updateAudioTrack: (id: string, updates: Partial<AudioTrack>) => void;
  deleteAudioTrack: (id: string) => void;
  masterVolume: number;
  setMasterVolume: (volume: number) => void;

  // Text Layers
  textLayers: TextLayer[];
  addTextLayer: (layer: TextLayer) => void;
  updateTextLayer: (id: string, updates: Partial<TextLayer>) => void;
  deleteTextLayer: (id: string) => void;
  selectedTextId: string | null;
  setSelectedText: (id: string | null) => void;

  // Sticker Layers
  stickerLayers: StickerLayer[];
  addStickerLayer: (layer: StickerLayer) => void;
  updateStickerLayer: (id: string, updates: Partial<StickerLayer>) => void;
  deleteStickerLayer: (id: string) => void;
  selectedStickerId: string | null;
  setSelectedSticker: (id: string | null) => void;

  // Drawing
  drawings: DrawingStroke[];
  addDrawing: (stroke: DrawingStroke) => void;
  deleteDrawing: (id: string) => void;
  clearDrawings: () => void;
  isDrawingMode: boolean;
  setDrawingMode: (enabled: boolean) => void;
  currentDrawingTool: DrawingStroke['tool'];
  setDrawingTool: (tool: DrawingStroke['tool']) => void;
  drawingColor: string;
  setDrawingColor: (color: string) => void;
  drawingStrokeWidth: number;
  setDrawingStrokeWidth: (width: number) => void;

  // Filters & Color
  currentFilter: FilterState;
  updateFilter: (updates: Partial<FilterState>) => void;
  resetFilter: () => void;
  presetFilters: { name: string; filter: FilterState }[];

  // Timeline
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  isPlaying: boolean;
  setPlaying: (playing: boolean) => void;
  zoom: number;
  setZoom: (zoom: number) => void;

  // Recording
  isRecording: boolean;
  recordingStartTime: number;
  startRecording: () => void;
  stopRecording: () => void;

  // History (Undo/Redo)
  history: EditorAction[];
  historyIndex: number;
  addToHistory: (action: EditorAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // UI State
  activeTool: 'none' | 'text' | 'sticker' | 'audio' | 'filter' | 'draw' | 'effects' | 'crop' | 'trim' | 'speed';
  setActiveTool: (tool: GlimpseEditorState['activeTool']) => void;
  showTimeline: boolean;
  setShowTimeline: (show: boolean) => void;

  // Export
  isExporting: boolean;
  exportProgress: number;
  setExportProgress: (progress: number) => void;
  exportVideo: () => Promise<Blob | null>;

  // Cover Image
  coverImage: Blob | null;
  setCoverImage: (image: Blob | null) => void;

  // Caption & Metadata
  caption: string;
  setCaption: (caption: string) => void;
  hashtags: string[];
  setHashtags: (tags: string[]) => void;
  linkedGlimpseId: string | null;
  setLinkedGlimpse: (id: string | null) => void;

  // Reset
  reset: () => void;
}

// Default filter state
const defaultFilter: FilterState = {
  name: 'none',
  brightness: 100,
  contrast: 100,
  saturation: 100,
  exposure: 0,
  temperature: 0,
  sharpness: 0,
  blur: 0,
  vignette: 0,
};

// Preset filters
const presetFilters = [
  { name: 'None', filter: defaultFilter },
  { name: 'Vintage', filter: { ...defaultFilter, name: 'vintage', saturation: 80, temperature: 20, vignette: 0.3 } },
  { name: 'Cool', filter: { ...defaultFilter, name: 'cool', temperature: -15, saturation: 110 } },
  { name: 'Warm', filter: { ...defaultFilter, name: 'warm', temperature: 15, brightness: 105 } },
  { name: 'B&W', filter: { ...defaultFilter, name: 'bw', saturation: 0, contrast: 110 } },
  { name: 'Dramatic', filter: { ...defaultFilter, name: 'dramatic', contrast: 130, brightness: 90, vignette: 0.5 } },
];

// Initial state
const initialState = {
  ffmpeg: null,
  ffmpegLoaded: false,
  projectId: null,
  projectName: 'Untitled Glimpse',
  clips: [],
  audioTracks: [],
  textLayers: [],
  stickerLayers: [],
  drawings: [],
  selectedClipId: null,
  selectedTextId: null,
  selectedStickerId: null,
  masterVolume: 100,
  isDrawingMode: false,
  currentDrawingTool: 'pen' as const,
  drawingColor: '#ffffff',
  drawingStrokeWidth: 5,
  currentFilter: defaultFilter,
  presetFilters,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  zoom: 1,
  isRecording: false,
  recordingStartTime: 0,
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  activeTool: 'none' as const,
  showTimeline: true,
  isExporting: false,
  exportProgress: 0,
  coverImage: null,
  caption: '',
  hashtags: [],
  linkedGlimpseId: null,
};

// ==================== STORE IMPLEMENTATION ====================
export const useGlimpseEditorStore = create<GlimpseEditorState>((set, get) => ({
  ...initialState,

  // FFmpeg initialization (stubbed for native)
  initFFmpeg: async () => {
    const { ffmpegLoaded } = get();
    if (ffmpegLoaded) return;
    // No-op on native; web implementation should be separate
    set({ ffmpeg: null, ffmpegLoaded: false });
  },

  setProjectName: (name) => set({ projectName: name }),

  // Video Clips
  addClip: (clip) => set((state) => ({
    clips: [...state.clips, clip],
    selectedClipId: clip.id,
    duration: Math.max(state.duration, clip.startTime + clip.duration),
  })),

  updateClip: (id, updates) => set((state) => ({
    clips: state.clips.map((clip) =>
      clip.id === id ? { ...clip, ...updates } : clip
    ),
  })),

  deleteClip: (id) => set((state) => ({
    clips: state.clips.filter((clip) => clip.id !== id),
    selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
  })),

  splitClip: (id, splitTime) => set((state) => {
    const clipIndex = state.clips.findIndex((c) => c.id === id);
    if (clipIndex === -1) return state;

    const clip = state.clips[clipIndex];
    const relativeTime = splitTime - clip.startTime;

    const clip1: VideoClip = {
      ...clip,
      duration: relativeTime,
      trimEnd: (relativeTime / clip.duration) * 100,
    };

    const clip2: VideoClip = {
      ...clip,
      id: `clip-${Date.now()}`,
      startTime: clip.startTime + relativeTime,
      duration: clip.duration - relativeTime,
      trimStart: (relativeTime / clip.duration) * 100,
    };

    const newClips = [...state.clips];
    newClips.splice(clipIndex, 1, clip1, clip2);

    return { clips: newClips };
  }),

  duplicateClip: (id) => set((state) => {
    const clip = state.clips.find((c) => c.id === id);
    if (!clip) return state;

    const newClip: VideoClip = {
      ...clip,
      id: `clip-${Date.now()}`,
      startTime: clip.startTime + clip.duration,
    };

    return { clips: [...state.clips, newClip] };
  }),

  setSelectedClip: (id) => set({ selectedClipId: id }),

  // Audio Tracks
  addAudioTrack: (track) => set((state) => ({
    audioTracks: [...state.audioTracks, track],
    duration: Math.max(state.duration, track.startTime + track.duration),
  })),

  updateAudioTrack: (id, updates) => set((state) => ({
    audioTracks: state.audioTracks.map((track) =>
      track.id === id ? { ...track, ...updates } : track
    ),
  })),

  deleteAudioTrack: (id) => set((state) => ({
    audioTracks: state.audioTracks.filter((track) => track.id !== id),
  })),

  setMasterVolume: (volume) => set({ masterVolume: volume }),

  // Text Layers
  addTextLayer: (layer) => set((state) => ({
    textLayers: [...state.textLayers, layer],
    selectedTextId: layer.id,
  })),

  updateTextLayer: (id, updates) => set((state) => ({
    textLayers: state.textLayers.map((layer) =>
      layer.id === id ? { ...layer, ...updates } : layer
    ),
  })),

  deleteTextLayer: (id) => set((state) => ({
    textLayers: state.textLayers.filter((layer) => layer.id !== id),
    selectedTextId: state.selectedTextId === id ? null : state.selectedTextId,
  })),

  setSelectedText: (id) => set({ selectedTextId: id }),

  // Sticker Layers
  addStickerLayer: (layer) => set((state) => ({
    stickerLayers: [...state.stickerLayers, layer],
    selectedStickerId: layer.id,
  })),

  updateStickerLayer: (id, updates) => set((state) => ({
    stickerLayers: state.stickerLayers.map((layer) =>
      layer.id === id ? { ...layer, ...updates } : layer
    ),
  })),

  deleteStickerLayer: (id) => set((state) => ({
    stickerLayers: state.stickerLayers.filter((layer) => layer.id !== id),
    selectedStickerId: state.selectedStickerId === id ? null : state.selectedStickerId,
  })),

  setSelectedSticker: (id) => set({ selectedStickerId: id }),

  // Drawing
  addDrawing: (stroke) => set((state) => ({
    drawings: [...state.drawings, stroke],
  })),

  deleteDrawing: (id) => set((state) => ({
    drawings: state.drawings.filter((d) => d.id !== id),
  })),

  clearDrawings: () => set({ drawings: [] }),

  setDrawingMode: (enabled) => set({ isDrawingMode: enabled }),

  setDrawingTool: (tool) => set({ currentDrawingTool: tool }),

  setDrawingColor: (color) => set({ drawingColor: color }),

  setDrawingStrokeWidth: (width) => set({ drawingStrokeWidth: width }),

  // Filters
  updateFilter: (updates) => set((state) => ({
    currentFilter: { ...state.currentFilter, ...updates },
  })),

  resetFilter: () => set({ currentFilter: defaultFilter }),

  // Timeline
  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration }),

  setPlaying: (playing) => set({ isPlaying: playing }),

  setZoom: (zoom) => set({ zoom }),

  // Recording
  startRecording: () => set({
    isRecording: true,
    recordingStartTime: get().currentTime,
  }),

  stopRecording: () => set({ isRecording: false }),

  // History
  addToHistory: (action) => set((state) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(action);

    return {
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: true,
      canRedo: false,
    };
  }),

  undo: () => set((state) => {
    if (state.historyIndex <= 0) return state;
    
    const newIndex = state.historyIndex - 1;
    // Apply undo logic here based on action type
    
    return {
      historyIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: true,
    };
  }),

  redo: () => set((state) => {
    if (state.historyIndex >= state.history.length - 1) return state;
    
    const newIndex = state.historyIndex + 1;
    // Apply redo logic here based on action type
    
    return {
      historyIndex: newIndex,
      canUndo: true,
      canRedo: newIndex < state.history.length - 1,
    };
  }),

  // UI
  setActiveTool: (tool) => set({ activeTool: tool }),

  setShowTimeline: (show) => set({ showTimeline: show }),

  // Export
  setExportProgress: (progress) => set({ exportProgress: progress }),

  exportVideo: async () => {
    const state = get();
    const { ffmpeg, clips, audioTracks, currentFilter } = state;

    if (!ffmpeg) {
      console.error('FFmpeg not loaded');
      return null;
    }

    set({ isExporting: true, exportProgress: 0 });

    try {
      // Export logic will be implemented with FFmpeg commands
      // This is a placeholder that will be expanded
      set({ exportProgress: 100, isExporting: false });
      return null;
    } catch (error) {
      console.error('Export failed:', error);
      set({ isExporting: false, exportProgress: 0 });
      return null;
    }
  },

  // Cover & Metadata
  setCoverImage: (image) => set({ coverImage: image }),

  setCaption: (caption) => set({ caption }),

  setHashtags: (tags) => set({ hashtags: tags }),

  setLinkedGlimpse: (id) => set({ linkedGlimpseId: id }),

  // Reset
  reset: () => set(initialState),
}));
