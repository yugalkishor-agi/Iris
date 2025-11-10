import { create } from 'zustand';
import Konva from 'konva';

export interface TextLayer {
  id: string;
  type: 'text';
  content: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  align: 'left' | 'center' | 'right';
  backgroundColor?: string;
  animation?: 'fade' | 'bounce' | 'slide' | 'zoom' | 'rotate' | 'none';
  shadowEnabled: boolean;
  shadowBlur: number;
  shadowColor: string;
}

export interface StickerLayer {
  id: string;
  type: 'sticker' | 'emoji';
  content: string;
  url?: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  width: number;
  height: number;
}

export interface DrawingStroke {
  id: string;
  tool: 'marker' | 'highlighter' | 'neon' | 'chalk' | 'arrow';
  points: number[];
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface MusicData {
  title: string;
  artist: string;
  url: string;
  duration: number;
  startTime: number;
}

export type MentionLayer = {
  id: string;
  type: 'mention';
  data: {
    userId: string;
    username: string;
    avatarURL: string;
    verified: boolean;
  };
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

export type Layer = TextLayer | StickerLayer | MentionLayer;

export interface BackgroundState {
  type: 'image' | 'gradient' | 'color';
  imageUrl?: string;
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number;
  };
  filter?: string;
  filterIntensity: number;
}

interface StoryEditorState {
  // Background
  background: BackgroundState;
  setBackground: (background: BackgroundState) => void;
  
  // Layers
  layers: Layer[];
  addLayer: (layer: Layer | any) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  selectedLayerId: string | null;
  setSelectedLayer: (id: string | null) => void;
  
  // Drawing
  drawings: DrawingStroke[];
  addDrawing: (stroke: DrawingStroke) => void;
  undoDrawing: () => void;
  clearDrawings: () => void;
  isDrawingMode: boolean;
  setDrawingMode: (enabled: boolean) => void;
  currentDrawingTool: DrawingStroke['tool'];
  setCurrentDrawingTool: (tool: DrawingStroke['tool']) => void;
  drawingColor: string;
  setDrawingColor: (color: string) => void;
  drawingOpacity: number;
  setDrawingOpacity: (opacity: number) => void;
  drawingStrokeWidth: number;
  setDrawingStrokeWidth: (width: number) => void;
  
  // Music
  music: MusicData | null;
  setMusic: (music: MusicData | null) => void;
  
  // Filters
  availableFilters: string[];
  currentFilter: string;
  setCurrentFilter: (filter: string) => void;
  
  // UI State
  activeTool: 'none' | 'text' | 'sticker' | 'draw' | 'filter' | 'music' | 'background';
  setActiveTool: (tool: StoryEditorState['activeTool']) => void;
  
  // History
  history: string[];
  historyIndex: number;
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Export
  stageRef: React.RefObject<Konva.Stage> | null;
  setStageRef: (ref: React.RefObject<Konva.Stage>) => void;
  exportAsImage: () => Promise<string | null>;
  
  // Reset
  reset: () => void;
}

const FILTERS = [
  'none', 'grayscale', 'sepia', 'vintage', 'warm', 'cold', 
  'bright', 'dark', 'contrast', 'saturate', 'blur', 'sharpen'
];

const initialState = {
  background: {
    type: 'color' as const,
    color: '#000000',
    filterIntensity: 0.5,
  },
  layers: [],
  drawings: [],
  music: null,
  selectedLayerId: null,
  isDrawingMode: false,
  currentDrawingTool: 'marker' as const,
  drawingColor: '#ffffff',
  drawingOpacity: 1,
  drawingStrokeWidth: 5,
  availableFilters: FILTERS,
  currentFilter: 'none',
  activeTool: 'none' as const,
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  stageRef: null,
};

export const useStoryEditorStore = create<StoryEditorState>((set, get) => ({
  ...initialState,

  setBackground: (background) => set({ background }),

  addLayer: (layer) => set((state) => ({ 
    layers: [...state.layers, layer as Layer],
    selectedLayerId: layer.id 
  })),

  updateLayer: (id, updates) => set((state) => ({
    layers: state.layers.map((layer) =>
      layer.id === id ? { ...layer, ...updates } as Layer : layer
    ) as Layer[],
  })),

  deleteLayer: (id) => set((state) => ({
    layers: state.layers.filter((layer) => layer.id !== id),
    selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
  })),

  reorderLayers: (fromIndex, toIndex) => set((state) => {
    const newLayers = [...state.layers];
    const [removed] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, removed);
    return { layers: newLayers };
  }),

  setSelectedLayer: (id) => set({ selectedLayerId: id }),

  addDrawing: (stroke) => set((state) => ({
    drawings: [...state.drawings, stroke],
  })),

  undoDrawing: () => set((state) => ({
    drawings: state.drawings.slice(0, -1),
  })),

  clearDrawings: () => set({ drawings: [] }),

  setDrawingMode: (enabled) => set({ isDrawingMode: enabled }),

  setCurrentDrawingTool: (tool) => set({ currentDrawingTool: tool }),

  setDrawingColor: (color) => set({ drawingColor: color }),

  setDrawingOpacity: (opacity) => set({ drawingOpacity: opacity }),

  setDrawingStrokeWidth: (width) => set({ drawingStrokeWidth: width }),

  setMusic: (music) => set({ music }),

  setCurrentFilter: (filter) => set({ currentFilter: filter }),

  setActiveTool: (tool) => {
    const state = get();
    
    // Cleanup when switching tools
    if (state.activeTool === 'draw' && tool !== 'draw') {
      set({ isDrawingMode: false });
    }
    
    // Deselect layer when opening tool panels (except when already in that tool)
    if (tool !== 'none' && tool !== state.activeTool) {
      set({ selectedLayerId: null });
    }
    
    set({ activeTool: tool });
  },

  saveToHistory: () => set((state) => {
    const snapshot = JSON.stringify({
      background: state.background,
      layers: state.layers,
      drawings: state.drawings,
      currentFilter: state.currentFilter,
    });
    
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(snapshot);
    
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
    const snapshot = JSON.parse(state.history[newIndex]);
    
    return {
      ...snapshot,
      historyIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: true,
    };
  }),

  redo: () => set((state) => {
    if (state.historyIndex >= state.history.length - 1) return state;
    
    const newIndex = state.historyIndex + 1;
    const snapshot = JSON.parse(state.history[newIndex]);
    
    return {
      ...snapshot,
      historyIndex: newIndex,
      canUndo: true,
      canRedo: newIndex < state.history.length - 1,
    };
  }),

  setStageRef: (ref) => set({ stageRef: ref }),

  exportAsImage: async () => {
    const { stageRef } = get();
    if (!stageRef?.current) return null;
    
    try {
      const uri = stageRef.current.toDataURL({
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: 2,
      });
      return uri;
    } catch (error) {
      console.error('Failed to export image:', error);
      return null;
    }
  },

  reset: () => set(initialState),
}));
