import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Line, Transformer, Rect, Group } from 'react-konva';
import { X, Check, Type, AlignLeft, AlignCenter, AlignRight, Palette, Sparkles, Pencil, Smile, Music, Image as ImageIcon, Wand2, Settings, Users, UserCheck, Share2, ChevronDown, Search, Play, Pause } from 'lucide-react';
import Konva from 'konva';
import { FONTS } from './EditorTypes';
import { searchTracks, getTrendingTracks, formatDuration, getTrackStreamUrl, type AudiusTrack } from '../../services/audius.service';
import StorySettingsModal from './StorySettingsModal';
import { MentionStickerCreator } from './MentionSticker';
import { useAuth } from '@/contexts/AuthContext';
import { GifPickerModal } from '@/components/ui/gif-picker-modal';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  rotation: number;
  scaleX: number;
  scaleY: number;
  align: 'left' | 'center' | 'right';
  textEffect: 'none' | 'shadow' | 'outline';
}

interface DrawLine {
  id: string;
  points: number[];
  stroke: string;
  strokeWidth: number;
}

interface StickerElement {
  id: string;
  emoji: string;
  x: number;
  y: number;
  fontSize: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

interface MentionStickerElement {
  id: string;
  userId: string;
  username: string;
  avatarURL: string;
  verified: boolean;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

interface MusicSticker {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  artworkUrl: string;
  style: 'circle' | 'rectangle' | 'square';
  backgroundColor: string;
  clipStart: number;
  clipEnd: number;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

interface GifElement {
  id: string;
  gifUrl: string;
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

interface InstagramTextEditorProps {
  imageUrl: string;
  onSave: (canvasBlob: Blob, audience: 'followers' | 'closeFriends', backgroundMusic?: {
    track: any;
    clipStart: number;
    clipEnd: number;
  } | null, mentionStickers?: Array<{
    userId: string;
    username: string;
    avatarURL: string;
    verified: boolean;
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
  }>) => void;
  onCancel: () => void;
}

type Tab = 'color' | 'alignment' | 'text' | 'effects';
type Tool = 'none' | 'text' | 'draw' | 'sticker' | 'gif' | 'filter' | 'music';

const TEXT_STYLES = [
  { name: 'Classic', fontFamily: 'Arial', effect: 'none' },
  { name: 'Modern', fontFamily: 'Helvetica', effect: 'none' },
  { name: 'Bold', fontFamily: 'Impact', effect: 'none' },
  { name: 'Neon', fontFamily: 'Arial', effect: 'shadow' },
  { name: 'Typewriter', fontFamily: 'Courier New', effect: 'none' },
  { name: 'Elegant', fontFamily: 'Georgia', effect: 'none' },
  { name: 'Playful', fontFamily: 'Comic Sans MS', effect: 'none' },
  { name: 'Handwritten', fontFamily: 'Brush Script MT', effect: 'none' },
  { name: 'Serif', fontFamily: 'Times New Roman', effect: 'none' },
  { name: 'Monospace', fontFamily: 'Consolas', effect: 'none' },
  { name: 'Rounded', fontFamily: 'Verdana', effect: 'none' },
  { name: 'Narrow', fontFamily: 'Arial Narrow', effect: 'none' },
  { name: 'Wide', fontFamily: 'Impact', effect: 'outline' },
  { name: 'Fancy', fontFamily: 'Palatino Linotype', effect: 'none' },
  { name: 'Tech', fontFamily: 'Courier New', effect: 'outline' },
];

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FF69B4', '#32CD32', '#1E90FF', '#FFD700', '#FF1493'
];

const FILTERS = [
  { 
    id: 'none', 
    name: 'Original',
    css: 'none'
  },
  { 
    id: 'clarendon', 
    name: 'Vivid Pop',
    css: 'contrast(1.2) saturate(1.35) brightness(1.1)'
  },
  { 
    id: 'gingham', 
    name: 'Soft Glow',
    css: 'brightness(1.05) hue-rotate(-10deg)'
  },
  { 
    id: 'moon', 
    name: 'Moonlight',
    css: 'grayscale(1) contrast(1.1) brightness(1.1)'
  },
  { 
    id: 'lark', 
    name: 'Morning Dew',
    css: 'contrast(0.9) brightness(1.1) saturate(1.2)'
  },
  { 
    id: 'reyes', 
    name: 'Golden Hour',
    css: 'sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)'
  },
  { 
    id: 'juno', 
    name: 'Vibrant Life',
    css: 'contrast(1.2) saturate(1.4) brightness(1.1) sepia(0.2)'
  },
  { 
    id: 'slumber', 
    name: 'Dreamy Haze',
    css: 'saturate(0.66) brightness(1.05)'
  },
  { 
    id: 'crema', 
    name: 'Vintage Cream',
    css: 'contrast(0.9) brightness(1.1) saturate(0.9) sepia(0.5)'
  },
  { 
    id: 'ludwig', 
    name: 'Electric Blue',
    css: 'brightness(1.05) saturate(1.8) contrast(1.1)'
  },
  { 
    id: 'aden', 
    name: 'Cool Breeze',
    css: 'contrast(0.9) brightness(1.2) saturate(0.85) hue-rotate(-20deg)'
  },
  { 
    id: 'perpetua', 
    name: 'Sharp Focus',
    css: 'contrast(1.1) brightness(1.05) saturate(1.1)'
  },
  { 
    id: 'amaro', 
    name: 'Tropical Sunset',
    css: 'contrast(0.9) brightness(1.1) saturate(1.5) hue-rotate(-10deg)'
  },
  { 
    id: 'mayfair', 
    name: 'Pink Blush',
    css: 'contrast(1.1) saturate(1.1) brightness(1.15)'
  },
  { 
    id: 'rise', 
    name: 'Sunrise Glow',
    css: 'brightness(1.05) sepia(0.2) contrast(0.9) saturate(0.9)'
  },
  { 
    id: 'hudson', 
    name: 'Icy Blue',
    css: 'brightness(1.2) contrast(0.9) saturate(1.1)'
  },
  { 
    id: 'valencia', 
    name: 'Warm Embrace',
    css: 'contrast(1.08) brightness(1.08) sepia(0.08)'
  },
  { 
    id: 'xpro2', 
    name: 'Dark Vintage',
    css: 'sepia(0.3) contrast(1.3) brightness(0.8) saturate(1.5)'
  },
  { 
    id: 'sierra', 
    name: 'Mountain Air',
    css: 'contrast(0.9) brightness(1.1) saturate(0.9) sepia(0.25)'
  },
  { 
    id: 'willow', 
    name: 'Misty Gray',
    css: 'grayscale(0.5) contrast(0.95) brightness(0.9)'
  },
  { 
    id: 'lofi', 
    name: 'Bold Punch',
    css: 'saturate(1.1) contrast(1.5)'
  },
  { 
    id: 'inkwell', 
    name: 'Pure B&W',
    css: 'grayscale(1) brightness(1.1) contrast(1.1)'
  },
  { 
    id: 'hefe', 
    name: 'Neon Pop',
    css: 'contrast(1.1) brightness(1.1) saturate(1.4)'
  },
  { 
    id: 'nashville', 
    name: 'Country Gold',
    css: 'sepia(0.2) contrast(1.2) brightness(1.05) saturate(1.2)'
  },
  { 
    id: 'stinson', 
    name: 'Soft Focus',
    css: 'contrast(0.75) brightness(1.15) saturate(0.85)'
  },
  { 
    id: 'vesper', 
    name: 'Evening Amber',
    css: 'sepia(0.3) brightness(1.1) contrast(0.9) hue-rotate(10deg)'
  },
  { 
    id: 'earlybird', 
    name: 'Dawn Light',
    css: 'contrast(0.9) sepia(0.2) brightness(1.1)'
  },
  { 
    id: 'brannan', 
    name: 'Rustic Bronze',
    css: 'sepia(0.5) contrast(1.4)'
  },
  { 
    id: 'sutro', 
    name: 'Moody Dark',
    css: 'brightness(0.9) contrast(1.1) sepia(0.4) saturate(1.4)'
  },
  { 
    id: 'toaster', 
    name: 'Burnt Orange',
    css: 'contrast(1.5) brightness(0.9) sepia(0.2)'
  },
  { 
    id: 'walden', 
    name: 'Forest Green',
    css: 'brightness(1.1) hue-rotate(-10deg) sepia(0.3) saturate(1.6)'
  },
  { 
    id: '1977', 
    name: 'Retro Film',
    css: 'contrast(1.1) brightness(1.1) saturate(1.3) sepia(0.1)'
  },
  { 
    id: 'kelvin', 
    name: 'Ultra Vivid',
    css: 'contrast(1.5) brightness(1.1) saturate(2)'
  },
  { 
    id: 'maven', 
    name: 'Desert Sand',
    css: 'sepia(0.25) brightness(0.95) contrast(0.95) saturate(1.5)'
  },
  { 
    id: 'ginza', 
    name: 'Tokyo Nights',
    css: 'sepia(0.06) brightness(1.1) saturate(1.1)'
  },
];

const TRENDING_GIFS = [
  { id: '1', name: 'Happy', emoji: '🎉' },
  { id: '2', name: 'Love', emoji: '❤️' },
  { id: '3', name: 'Party', emoji: '🥳' },
  { id: '4', name: 'Fire', emoji: '🔥' },
  { id: '5', name: 'Cool', emoji: '😎' },
  { id: '6', name: 'Thumbs', emoji: '👍' },
];

export function InstagramTextEditor({ imageUrl, onSave, onCancel }: InstagramTextEditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Cache for images and audio
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const audioCache = useRef<Map<string, string>>(new Map());
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 375, height: 667, x: 0, y: 0 });
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [drawLines, setDrawLines] = useState<DrawLine[]>([]);
  const [stickers, setStickers] = useState<StickerElement[]>([]);
  const [mentionStickers, setMentionStickers] = useState<MentionStickerElement[]>([]);
  const [musicStickers, setMusicStickers] = useState<MusicSticker[]>([]);
  const [gifElements, setGifElements] = useState<GifElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('none');
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [currentTextId, setCurrentTextId] = useState<string | null>(null);
  
  // Style state
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [textFont, setTextFont] = useState('Arial');
  const [textEffect, setTextEffect] = useState<'none' | 'shadow' | 'outline'>('none');
  const [textSize] = useState(40);
  
  // Panel state
  const [activeTab, setActiveTab] = useState<Tab>('text');
  const [showStickerTypeSelection, setShowStickerTypeSelection] = useState(true);
  const [showMentionDialog, setShowMentionDialog] = useState(false);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(5);
  const [currentLine, setCurrentLine] = useState<number[]>([]);
  
  // Filter state
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [currentFilterIndex, setCurrentFilterIndex] = useState(0);
  
  // Music state
  const [searchMusic, setSearchMusic] = useState('');
  const [musicResults, setMusicResults] = useState<AudiusTrack[]>([]);
  const [trendingMusic, setTrendingMusic] = useState<AudiusTrack[]>([]);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<AudiusTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMusicCustomizer, setShowMusicCustomizer] = useState(false);
  const [musicStickerStyle, setMusicStickerStyle] = useState<'circle' | 'rectangle' | 'square'>('circle');
  const [musicStickerBg, setMusicStickerBg] = useState('#8B5CF6');
  const [currentTime, setCurrentTime] = useState(0);
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(30);
  const [backgroundMusic, setBackgroundMusic] = useState<{
    track: AudiusTrack;
    clipStart: number;
    clipEnd: number;
  } | null>(null);
  
  // GIF state
  const [searchGif, setSearchGif] = useState('');
  
  // Share state
  const [showAudienceMenu, setShowAudienceMenu] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<'followers' | 'closeFriends'>('followers');
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [storySettings, setStorySettings] = useState({
    allowReplies: true,
    allowSharing: true,
    hiddenFrom: [] as string[]
  });
  const { user: currentUser } = useAuth();
  
  // Load trending music when music tool opens
  useEffect(() => {
    if (activeTool === 'music' && trendingMusic.length === 0) {
      loadTrendingMusic();
    }
  }, [activeTool, trendingMusic.length]);
  
  const loadTrendingMusic = async () => {
    setIsLoadingMusic(true);
    try {
      const tracks = await getTrendingTracks(20);
      setTrendingMusic(tracks);
    } catch (error) {
      console.error('Failed to load trending music:', error);
    } finally {
      setIsLoadingMusic(false);
    }
  };
  
  const handleMusicSearch = async () => {
    if (!searchMusic.trim()) {
      setMusicResults([]);
      return;
    }
    
    setIsLoadingMusic(true);
    try {
      const tracks = await searchTracks(searchMusic, 20);
      setMusicResults(tracks);
    } catch (error) {
      // Silent fail - search continues to work
    } finally {
      setIsLoadingMusic(false);
    }
  };
  
  const handleSelectTrack = async (track: AudiusTrack) => {
    setSelectedTrack(track);
    
    // Fast audio with caching
    try {
      // Stop previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      
      // Check cache first
      let streamUrl = audioCache.current.get(track.id);
      if (!streamUrl) {
        streamUrl = await getTrackStreamUrl(track.id);
        audioCache.current.set(track.id, streamUrl);
      }
      
      const audio = new Audio(streamUrl);
      audio.crossOrigin = 'anonymous';
      audio.volume = 0.7;
      
      audioRef.current = audio;
      
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
      audio.addEventListener('error', () => setIsPlaying(false));
      
      audio.play().catch(() => {});
      
    } catch (error) {
      setIsPlaying(false);
    }
  };
  
  const handleOpenMusicCustomizer = () => {
    if (!selectedTrack) return;
    setShowMusicCustomizer(true);
  };
  
  const handleAddMusicToStory = () => {
    if (!selectedTrack) return;
    
    // Set background music (no sticker on canvas)
    setBackgroundMusic({
      track: selectedTrack,
      clipStart,
      clipEnd
    });
    
    // Close customizer and music panel
    setShowMusicCustomizer(false);
    setActiveTool('none');
    
    // Set audio to play from clip start
    if (audioRef.current) {
      audioRef.current.currentTime = clipStart;
    }
  };
  
  const handleRemoveBackgroundMusic = () => {
    setBackgroundMusic(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPlaying(false);
  };
  
  const handleClipStartChange = (value: number) => {
    const newStart = Math.floor(value);
    const maxDuration = selectedTrack?.duration || 30;
    
    setClipStart(newStart);
    
    // Ensure 30 second clip or remaining duration
    const newEnd = Math.min(newStart + 30, maxDuration);
    setClipEnd(newEnd);
    
    // Update audio position
    if (audioRef.current) {
      audioRef.current.currentTime = newStart;
    }
  };
  
  const toggleMusicPlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        // Silent fail - audio source may not be loaded
      });
    }
  };
  
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Calculate dimensions to fit image while maintaining aspect ratio (object-fit: contain)
      const canvasWidth = 375;
      const canvasHeight = 667;
      const imgAspect = img.width / img.height;
      const canvasAspect = canvasWidth / canvasHeight;
      
      let renderWidth, renderHeight, x, y;
      
      if (imgAspect > canvasAspect) {
        // Image is wider - fit to width
        renderWidth = canvasWidth;
        renderHeight = canvasWidth / imgAspect;
        x = 0;
        y = (canvasHeight - renderHeight) / 2;
      } else {
        // Image is taller - fit to height
        renderHeight = canvasHeight;
        renderWidth = canvasHeight * imgAspect;
        x = (canvasWidth - renderWidth) / 2;
        y = 0;
      }
      
      setImageDimensions({ width: renderWidth, height: renderHeight, x, y });
      setImage(img);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Handle transformer
  useEffect(() => {
    if (!transformerRef.current || !selectedId || isEditing) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const selectedNode = stage.findOne(`#${selectedId}`);
    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, isEditing]);

  // Auto-focus input when editing starts
  useEffect(() => {
    if (isEditing && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isEditing]);

  // Start editing new text
  const startNewText = useCallback(() => {
    setActiveTool('text');
    setIsEditing(true);
    setEditingText('');
    setCurrentTextId(null);
    setActiveTab('text');
  }, []);
  
  // Drawing handlers
  const handleMouseDown = (e: any) => {
    if (activeTool === 'draw') {
      setIsDrawing(true);
      const pos = e.target.getStage().getPointerPosition();
      setCurrentLine([pos.x, pos.y]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (activeTool === 'draw' && isDrawing) {
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      setCurrentLine([...currentLine, point.x, point.y]);
    }
  };

  const handleMouseUp = () => {
    // Handle drawing
    if (isDrawing && activeTool === 'draw') {
      setIsDrawing(false);
      
      if (currentLine.length > 0) {
        const newLine: DrawLine = {
          id: `line-${Date.now()}`,
          points: currentLine,
          stroke: brushColor,
          strokeWidth: brushSize
        };
        
        setDrawLines([...drawLines, newLine]);
        setCurrentLine([]);
      }
    }
  };

// Handle transformer
useEffect(() => {
  if (!transformerRef.current || !selectedId || isEditing) return;
  
  const stage = stageRef.current;
  if (!stage) return;
  
  const selectedNode = stage.findOne(`#${selectedId}`);
  if (selectedNode) {
    transformerRef.current.nodes([selectedNode]);
    transformerRef.current.getLayer()?.batchDraw();
  }
}, [selectedId, isEditing]);

// Auto-focus input when editing starts
useEffect(() => {
  if (isEditing && textInputRef.current) {
    textInputRef.current.focus();
  }
}, [isEditing]);

// Add sticker
const handleAddSticker = useCallback((emoji: string) => {
  const newSticker: StickerElement = {
    id: `sticker-${Date.now()}`,
    emoji,
    x: 100,
    y: 100,
    fontSize: 40,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  };
  setStickers((prev) => [...prev, newSticker]);
  setSelectedId(newSticker.id);
}, [setStickers, setSelectedId]);

  // Add mention sticker
  const handleAddMentionSticker = useCallback((userId: string, username: string, avatarURL: string, verified: boolean) => {
    const newMentionSticker: MentionStickerElement = {
      id: `mention-${Date.now()}`,
      userId,
      username,
      avatarURL,
      verified,
      x: 150,
      y: 150,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    };
    setMentionStickers((prev) => [...prev, newMentionSticker]);
    setSelectedId(newMentionSticker.id);
  }, []);

  // Add GIF element
  const handleAddGif = useCallback((gifUrl: string) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxWidth = 250;
      const maxHeight = 250;
      let width = img.width;
      let height = img.height;
      
      // Scale down if too large
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height);
        width = width * scale;
        height = height * scale;
      }
      
      const newGif: GifElement = {
        id: `gif-${Date.now()}`,
        gifUrl,
        image: img,
        x: 100,
        y: 200,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      };
      setGifElements((prev) => [...prev, newGif]);
      setSelectedId(newGif.id);
    };
    img.onerror = () => {
      console.error('Failed to load GIF:', gifUrl);
    };
    img.src = gifUrl;
  }, []);

  // Start editing existing text
  const startEditExisting = useCallback((textEl: TextElement) => {
    setIsEditing(true);
    setEditingText(textEl.text);
    setCurrentTextId(textEl.id);
    setTextColor(textEl.fill);
    setTextAlign(textEl.align);
    setTextFont(textEl.fontFamily);
    setTextEffect(textEl.textEffect);
    setSelectedId(textEl.id);
    setActiveTab('text');
  }, []);

  // Finalize text
  const handleDone = useCallback(() => {
    if (!editingText.trim()) {
      setIsEditing(false);
      setActiveTool('none');
      return;
    }

    if (currentTextId) {
      // Update existing
      setTextElements(prev => prev.map(t =>
        t.id === currentTextId
          ? { ...t, text: editingText, fill: textColor, align: textAlign, fontFamily: textFont, textEffect }
          : t
      ));
    } else {
      // Create new
      const newText: TextElement = {
        id: `text-${Date.now()}`,
        text: editingText,
        x: 375 / 2,
        y: 667 / 2,
        fontSize: textSize,
        fontFamily: textFont,
        fill: textColor,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        align: textAlign,
        textEffect
      };
      setTextElements(prev => [...prev, newText]);
    }

    setIsEditing(false);
    setEditingText('');
    setCurrentTextId(null);
    setActiveTool('none');
  }, [editingText, currentTextId, textColor, textAlign, textFont, textEffect, textSize]);

  // Delete selected element
  const handleDelete = useCallback(() => {
    if (selectedId) {
      setTextElements(prev => prev.filter(t => t.id !== selectedId));
      setStickers(prev => prev.filter(s => s.id !== selectedId));
      setDrawLines(prev => prev.filter(l => l.id !== selectedId));
      setMusicStickers(prev => prev.filter(m => m.id !== selectedId));
      setGifElements(prev => prev.filter(g => g.id !== selectedId));
      setMentionStickers(prev => prev.filter(m => m.id !== selectedId));
      setSelectedId(null);
    }
  }, [selectedId]);

  const handleTextDoubleClick = (id: string) => {
    // Prevent editing music stickers
    if (id.startsWith('music-')) return;
    
    const element = textElements.find((el) => el.id === id);
    if (!element) return;
    
    startEditExisting(element);
  };

  // Export canvas as blob with all elements
  const exportCanvas = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!stageRef.current) {
        reject(new Error('Stage not ready'));
        return;
      }

      try {
        // Hide transformer before export
        if (transformerRef.current) {
          transformerRef.current.nodes([]);
        }

        // Export as data URL
        const dataURL = stageRef.current.toDataURL({
          pixelRatio: 2, // Higher quality
          mimeType: 'image/jpeg',
          quality: 0.9
        });

        // Convert data URL to Blob
        fetch(dataURL)
          .then(res => res.blob())
          .then(blob => resolve(blob))
          .catch(err => reject(err));
      } catch (error) {
        reject(error);
      }
    });
  };

return (
<div className="fixed inset-0 bg-black z-50 flex flex-col">
  {/* Top Bar */}
  <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
    <button onClick={onCancel} className="text-white hover:text-white/80">
      <X className="h-8 w-8" />
    </button>
    
    {/* Background Music Indicator */}
    {backgroundMusic && (
      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-2">
        <Music className="h-4 w-4 text-white" />
        <span className="text-white text-xs font-medium max-w-[150px] truncate">
          {backgroundMusic.track.title}
        </span>
        <button
          onClick={handleRemoveBackgroundMusic}
          className="text-white/60 hover:text-white ml-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )}
    
    <div className="flex items-center gap-2">
      {!isEditing && selectedId && (
        <button 
          onClick={handleDelete} 
          className="p-3 bg-red-500/40 backdrop-blur-md rounded-full hover:bg-red-500/60 transition-all"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      )}
      
      {selectedTrack && (
        <button
          onClick={toggleMusicPlayback}
          className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg transition-all"
          title={isPlaying ? 'Pause music' : 'Play music'}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 text-white" />
          ) : (
            <Play className="h-4 w-4 text-white" />
          )}
        </button>
      )}
      
      {/* Share Button with Dropdown */}
      {!isEditing && activeTool === 'none' && (
        <div className="relative">
          <button
            onClick={() => setShowAudienceMenu(!showAudienceMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-full font-bold hover:shadow-lg transition-all active:scale-95"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-sm">Share</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          
          {/* Audience Menu */}
          {showAudienceMenu && (
            <div className="absolute top-full mt-2 right-0 bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden min-w-[200px] shadow-2xl">
              <button
                onClick={async () => {
                  setSelectedAudience('followers');
                  try {
                    const blob = await exportCanvas();
                    // Normalize mention sticker positions to percentages
                    const normalizedMentions = mentionStickers.map(m => ({
                      userId: m.userId,
                      username: m.username,
                      avatarURL: m.avatarURL,
                      verified: m.verified,
                      x: (m.x / 375) * 100, // Convert to percentage
                      y: (m.y / 667) * 100,
                      rotation: m.rotation,
                      scaleX: m.scaleX,
                      scaleY: m.scaleY
                    }));
                    onSave(blob, 'followers', backgroundMusic, normalizedMentions);
                  } catch (error) {
                    console.error('Failed to export canvas:', error);
                  }
                  setShowAudienceMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all flex items-center gap-3"
              >
                <Users className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="font-medium">Everyone</p>
                  <p className="text-xs text-white/60">Followers or public based on account privacy</p>
                </div>
              </button>
              
              <button
                onClick={async () => {
                  setSelectedAudience('closeFriends');
                  try {
                    const blob = await exportCanvas();
                    // Normalize mention sticker positions to percentages
                    const normalizedMentions = mentionStickers.map(m => ({
                      userId: m.userId,
                      username: m.username,
                      avatarURL: m.avatarURL,
                      verified: m.verified,
                      x: (m.x / 375) * 100,
                      y: (m.y / 667) * 100,
                      rotation: m.rotation,
                      scaleX: m.scaleX,
                      scaleY: m.scaleY
                    }));
                    onSave(blob, 'closeFriends', backgroundMusic, normalizedMentions);
                  } catch (error) {
                    console.error('Failed to export canvas:', error);
                  }
                  setShowAudienceMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all flex items-center gap-3 border-t border-white/10"
              >
                <UserCheck className="h-5 w-5 text-green-400" />
                <div>
                  <p className="font-medium">Close Friends</p>
                  <p className="text-xs text-white/60">Only your close friends can see</p>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
      
      <button 
        onClick={() => setShowSettings(true)}
        className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
      >
        <Settings className="h-5 w-5 text-white" />
      </button>
    </div>
  </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-[375px] h-[667px] bg-black shadow-2xl">
          <Stage
            ref={stageRef}
            width={375}
            height={667}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            onClick={(e) => {
              const clickedOnEmpty = e.target === e.target.getStage() || e.target.getClassName() === 'Image';
              if (clickedOnEmpty && !isEditing) {
                setSelectedId(null);
              }
            }}
            style={{
              filter: FILTERS[currentFilterIndex].css
            }}
          >
            <Layer>
              {/* Background Image with Filter */}
              {image && (
                <>
                  <KonvaImage
                    image={image}
                    x={imageDimensions.x}
                    y={imageDimensions.y}
                    width={imageDimensions.width}
                    height={imageDimensions.height}
                  />
                  {/* Filter overlay using CSS filter on a div */}
                </>
              )}
              
              {/* Draw Lines */}
              {drawLines.map((line) => (
                <Line
                  key={line.id}
                  id={line.id}
                  points={line.points}
                  stroke={line.stroke}
                  strokeWidth={line.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              ))}
              
              {/* Current drawing line */}
              {currentLine.length > 0 && (
                <Line
                  points={currentLine}
                  stroke={brushColor}
                  strokeWidth={brushSize}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
              
              {/* Text Elements */}
              {textElements.map((textEl) => (
                <KonvaText
                  key={textEl.id}
                  id={textEl.id}
                  text={textEl.text}
                  x={textEl.x}
                  y={textEl.y}
                  fontSize={textEl.fontSize}
                  fontFamily={textEl.fontFamily}
                  fill={textEl.fill}
                  rotation={textEl.rotation}
                  scaleX={textEl.scaleX}
                  scaleY={textEl.scaleY}
                  align={textEl.align}
                  draggable={!isEditing}
                  visible={!isEditing || textEl.id !== currentTextId}
                  shadowColor={textEl.textEffect === 'shadow' ? 'rgba(0,0,0,0.8)' : undefined}
                  shadowBlur={textEl.textEffect === 'shadow' ? 10 : 0}
                  shadowOffset={textEl.textEffect === 'shadow' ? { x: 3, y: 3 } : undefined}
                  stroke={textEl.textEffect === 'outline' ? '#000000' : undefined}
                  strokeWidth={textEl.textEffect === 'outline' ? 2 : 0}
                  onClick={(e) => {
                    if (!isEditing) {
                      e.cancelBubble = true;
                      setSelectedId(textEl.id);
                    }
                  }}
                  onDblClick={() => handleTextDoubleClick(textEl.id)}
                  onDblTap={() => handleTextDoubleClick(textEl.id)}
                  onDragEnd={(e) => {
                    setTextElements(prev => prev.map(t =>
                      t.id === textEl.id ? { ...t, x: e.target.x(), y: e.target.y() } : t
                    ));
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    setTextElements(prev => prev.map(t =>
                      t.id === textEl.id
                        ? {
                            ...t,
                            x: node.x(),
                            y: node.y(),
                            rotation: node.rotation(),
                            scaleX: node.scaleX(),
                            scaleY: node.scaleY()
                          }
                        : t
                    ));
                  }}
                />
              ))}
              
              {/* Stickers */}
              {stickers.map((sticker) => (
                <KonvaText
                  key={sticker.id}
                  id={sticker.id}
                  text={sticker.emoji}
                  x={sticker.x}
                  y={sticker.y}
                  fontSize={sticker.fontSize}
                  rotation={sticker.rotation}
                  scaleX={sticker.scaleX}
                  scaleY={sticker.scaleY}
                  draggable={!isEditing && activeTool === 'none'}
                  onClick={() => setSelectedId(sticker.id)}
                  onTap={() => setSelectedId(sticker.id)}
                  onDragEnd={(e) => {
                    const newStickers = stickers.map((s) =>
                      s.id === sticker.id ? { ...s, x: e.target.x(), y: e.target.y() } : s
                    );
                    setStickers(newStickers);
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const newStickers = stickers.map((s) =>
                      s.id === sticker.id
                        ? {
                            ...s,
                            rotation: node.rotation(),
                            scaleX: node.scaleX(),
                            scaleY: node.scaleY()
                          }
                        : s
                    );
                    setStickers(newStickers);
                  }}
                />
              ))}
              
              {/* GIF Elements */}
              {gifElements.map((gif) => (
                <KonvaImage
                  key={gif.id}
                  id={gif.id}
                  image={gif.image}
                  x={gif.x}
                  y={gif.y}
                  width={gif.width}
                  height={gif.height}
                  rotation={gif.rotation}
                  scaleX={gif.scaleX}
                  scaleY={gif.scaleY}
                  draggable={!isEditing && activeTool === 'none'}
                  onClick={() => setSelectedId(gif.id)}
                  onTap={() => setSelectedId(gif.id)}
                  onDragEnd={(e) => {
                    const newGifs = gifElements.map((g) =>
                      g.id === gif.id ? { ...g, x: e.target.x(), y: e.target.y() } : g
                    );
                    setGifElements(newGifs);
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const newGifs = gifElements.map((g) =>
                      g.id === gif.id
                        ? {
                            ...g,
                            rotation: node.rotation(),
                            scaleX: node.scaleX(),
                            scaleY: node.scaleY(),
                            width: node.width() * node.scaleX(),
                            height: node.height() * node.scaleY()
                          }
                        : g
                    );
                    setGifElements(newGifs);
                    node.scaleX(1);
                    node.scaleY(1);
                  }}
                />
              ))}
              
              {/* Music Stickers - Optimized */}
              {musicStickers.map((musicSticker) => {                
                // Get cached image synchronously
                const cachedImg = imageCache.current.get(musicSticker.artworkUrl);
                
                // Async load if not cached (runs once per unique URL)
                if (musicSticker.artworkUrl && !cachedImg && !imageCache.current.has(musicSticker.artworkUrl + '_loading')) {
                  imageCache.current.set(musicSticker.artworkUrl + '_loading', null as any);
                  const img = new window.Image();
                  img.crossOrigin = 'anonymous';
                  img.onload = () => {
                    imageCache.current.set(musicSticker.artworkUrl, img);
                    imageCache.current.delete(musicSticker.artworkUrl + '_loading');
                    setMusicStickers(prev => [...prev]); // Force re-render
                  };
                  img.onerror = () => {
                    imageCache.current.delete(musicSticker.artworkUrl + '_loading');
                  };
                  img.src = musicSticker.artworkUrl;
                }
                
                return (
                  <Group
                    key={musicSticker.id}
                    id={musicSticker.id}
                    x={musicSticker.x}
                    y={musicSticker.y}
                    rotation={musicSticker.rotation}
                    scaleX={musicSticker.scaleX}
                    scaleY={musicSticker.scaleY}
                    draggable={!isEditing}
                    onClick={(e) => {
                      if (!isEditing) {
                        e.cancelBubble = true;
                        setSelectedId(musicSticker.id);
                      }
                    }}
                    onTap={(e) => {
                      if (!isEditing) {
                        e.cancelBubble = true;
                        setSelectedId(musicSticker.id);
                      }
                    }}
                    onDblClick={() => {
                      // Prevent text editor from opening
                      return;
                    }}
                    onDblTap={() => {
                      // Prevent text editor from opening
                      return;
                    }}
                    onDragEnd={(e) => {
                      setMusicStickers(prev => prev.map((m) =>
                        m.id === musicSticker.id ? { ...m, x: e.target.x(), y: e.target.y() } : m
                      ));
                    }}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      setMusicStickers(prev => prev.map((m) =>
                        m.id === musicSticker.id
                          ? {
                              ...m,
                              rotation: node.rotation(),
                              scaleX: node.scaleX(),
                              scaleY: node.scaleY()
                            }
                          : m
                      ));
                    }}
                  >
                  <Rect
                    x={0}
                    y={0}
                    width={220}
                    height={60}
                    cornerRadius={12}
                    fill="#FFFFFF"
                    stroke="#E5E7EB"
                    strokeWidth={1}
                    perfectDrawEnabled={false}
                    listening={false}
                  />
                  {cachedImg ? (
                    <KonvaImage
                      image={cachedImg}
                      x={8}
                      y={8}
                      width={44}
                      height={44}
                      cornerRadius={8}
                      perfectDrawEnabled={false}
                      listening={false}
                    />
                  ) : (
                    <Rect
                      x={8}
                      y={8}
                      width={44}
                      height={44}
                      cornerRadius={8}
                      fill="#D1D5DB"
                      perfectDrawEnabled={false}
                      listening={false}
                    />
                  )}
                  <KonvaText
                    text={musicSticker.title}
                    x={60}
                    y={16}
                    width={150}
                    fontSize={13}
                    fontStyle="bold"
                    fill="#000000"
                    perfectDrawEnabled={false}
                    listening={false}
                  />
                  <KonvaText
                    text={musicSticker.artist}
                    x={60}
                    y={34}
                    width={150}
                    fontSize={11}
                    fill="#6B7280"
                    perfectDrawEnabled={false}
                    listening={false}
                  />
                </Group>
              );
              })}
              
              {/* Mention Stickers - Draggable Groups */}
              {mentionStickers.map((mentionSticker) => {
              // Cache avatar image
              const avatarKey = `avatar-${mentionSticker.userId}`;
              let cachedAvatar = imageCache.current.get(avatarKey);
              
              if (!cachedAvatar && mentionSticker.avatarURL) {
                const img = new window.Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                  imageCache.current.set(avatarKey, img);
                  setImage(prev => prev); // Force re-render
                };
                img.src = mentionSticker.avatarURL;
              }
              
              return (
                <Group
                  key={mentionSticker.id}
                  id={mentionSticker.id}
                  x={mentionSticker.x}
                  y={mentionSticker.y}
                  rotation={mentionSticker.rotation}
                  scaleX={mentionSticker.scaleX}
                  scaleY={mentionSticker.scaleY}
                  draggable={!isEditing}
                  onClick={(e) => {
                    if (!isEditing) {
                      e.cancelBubble = true;
                      setSelectedId(mentionSticker.id);
                    }
                  }}
                  onTap={(e) => {
                    if (!isEditing) {
                      e.cancelBubble = true;
                      setSelectedId(mentionSticker.id);
                    }
                  }}
                  onDragEnd={(e) => {
                    setMentionStickers(prev => prev.map((m) =>
                      m.id === mentionSticker.id ? { ...m, x: e.target.x(), y: e.target.y() } : m
                    ));
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    setMentionStickers(prev => prev.map((m) =>
                      m.id === mentionSticker.id
                        ? {
                            ...m,
                            rotation: node.rotation(),
                            scaleX: node.scaleX(),
                            scaleY: node.scaleY()
                          }
                        : m
                    ));
                  }}
                >
                  {/* Background rounded rectangle */}
                  <Rect
                    x={0}
                    y={0}
                    width={180}
                    height={50}
                    cornerRadius={25}
                    fill="rgba(0, 0, 0, 0.7)"
                    shadowColor="black"
                    shadowBlur={10}
                    shadowOpacity={0.3}
                    perfectDrawEnabled={false}
                    listening={false}
                  />
                  
                  {/* Avatar circle */}
                  {cachedAvatar ? (
                    <Group>
                      <Rect
                        x={8}
                        y={8}
                        width={34}
                        height={34}
                        cornerRadius={17}
                        fill="#FFFFFF"
                        perfectDrawEnabled={false}
                        listening={false}
                      />
                      <KonvaImage
                        image={cachedAvatar}
                        x={10}
                        y={10}
                        width={30}
                        height={30}
                        cornerRadius={15}
                        perfectDrawEnabled={false}
                        listening={false}
                      />
                    </Group>
                  ) : (
                    <Rect
                      x={8}
                      y={8}
                      width={34}
                      height={34}
                      cornerRadius={17}
                      fill="#9CA3AF"
                      perfectDrawEnabled={false}
                      listening={false}
                    />
                  )}
                  
                  {/* Username */}
                  <KonvaText
                    text={`@${mentionSticker.username}`}
                    x={48}
                    y={17}
                    width={125}
                    fontSize={14}
                    fontStyle="bold"
                    fill="#FFFFFF"
                    perfectDrawEnabled={false}
                    listening={false}
                  />
                  
                  {/* Verified badge if applicable */}
                  {mentionSticker.verified && (
                    <KonvaText
                      text="✓"
                      x={48 + mentionSticker.username.length * 8}
                      y={15}
                      fontSize={16}
                      fill="#3B82F6"
                      perfectDrawEnabled={false}
                      listening={false}
                    />
                  )}
                </Group>
              );
              })}
              
              {/* Transformer */}
              {!isEditing && activeTool === 'none' && selectedId && (
                <Transformer ref={transformerRef} />
              )}
            </Layer>
          </Stage>
          
          {/* Center Text Input Overlay (while editing) */}
          {isEditing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <textarea
                ref={textInputRef}
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                placeholder="Type here..."
                className="pointer-events-auto bg-transparent text-white text-center resize-none outline-none w-[90%] max-h-[400px] overflow-y-auto"
                style={{
                  fontSize: `${textSize}px`,
                  fontFamily: textFont,
                  color: textColor,
                  textAlign: textAlign,
                  textShadow: textEffect === 'shadow' ? '3px 3px 10px rgba(0,0,0,0.8)' : 'none',
                  WebkitTextStroke: textEffect === 'outline' ? '2px black' : 'none',
                }}
                rows={3}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Toolbar - Horizontal Swipeable */}
      {!isEditing && activeTool === 'none' && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
            <button
              onClick={startNewText}
              className="flex-shrink-0 w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-3xl font-medium text-xs flex flex-col items-center justify-center gap-1.5 hover:bg-white/20 transition-all active:scale-95 snap-start"
            >
              <Type className="h-6 w-6" />
              <span>Text</span>
            </button>
            
            <button
              onClick={() => setActiveTool('draw')}
              className="flex-shrink-0 w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-3xl font-medium text-xs flex flex-col items-center justify-center gap-1.5 hover:bg-white/20 transition-all active:scale-95 snap-start"
            >
              <Pencil className="h-6 w-6" />
              <span>Draw</span>
            </button>
            
            <button
              onClick={() => setActiveTool('sticker')}
              className="flex-shrink-0 w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-3xl font-medium text-xs flex flex-col items-center justify-center gap-1.5 hover:bg-white/20 transition-all active:scale-95 snap-start"
            >
              <Smile className="h-6 w-6" />
              <span>Sticker</span>
            </button>
            
            <button
              onClick={() => setActiveTool('gif')}
              className="flex-shrink-0 w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-3xl font-medium text-xs flex flex-col items-center justify-center gap-1.5 hover:bg-white/20 transition-all active:scale-95 snap-start"
            >
              <ImageIcon className="h-6 w-6" />
              <span>GIF</span>
            </button>
            
            <button
              onClick={() => setActiveTool('filter')}
              className="flex-shrink-0 w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-3xl font-medium text-xs flex flex-col items-center justify-center gap-1.5 hover:bg-white/20 transition-all active:scale-95 snap-start"
            >
              <Wand2 className="h-6 w-6" />
              <span>Filter</span>
            </button>
            
            <button
              onClick={() => setActiveTool('music')}
              className="flex-shrink-0 w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-3xl font-medium text-xs flex flex-col items-center justify-center gap-1.5 hover:bg-white/20 transition-all active:scale-95 snap-start"
            >
              <Music className="h-6 w-6" />
              <span>Music</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Drawing Panel */}
      {activeTool === 'draw' && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/95 border-t border-white/10 p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Draw</h3>
              <button
                onClick={() => setActiveTool('none')}
                className="p-2 hover:bg-white/10 rounded-full"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            
            {/* Brush Size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/60 text-xs font-medium">Brush Size</label>
                <span className="text-white text-sm font-bold">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            {/* Brush Color */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-2 block">Brush Color</label>
              <div className="flex gap-2 overflow-x-auto">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBrushColor(color)}
                    className={`w-10 h-10 rounded-full flex-shrink-0 border-2 ${
                      brushColor === color ? 'border-primary scale-110' : 'border-white/30'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setActiveTool('none')}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}
      
      {/* Sticker Panel */}
      {activeTool === 'sticker' && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/95 border-t border-white/10 p-5 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Stickers</h3>
              <button
                onClick={() => {
                  setActiveTool('none');
                  setShowStickerTypeSelection(true);
                }}
                className="p-2 hover:bg-white/10 rounded-full"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            
            {/* Sticker Type Selection */}
            {showStickerTypeSelection && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowStickerTypeSelection(false)}
                  className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Smile className="h-8 w-8 text-yellow-400" />
                  <span className="text-white text-sm font-medium">Emoji</span>
                </button>
                <button
                  onClick={() => setShowMentionDialog(true)}
                  className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Users className="h-8 w-8 text-purple-400" />
                  <span className="text-white text-sm font-medium">Mention</span>
                </button>
              </div>
            )}
            
            {/* Emoji Categories */}
            {!showStickerTypeSelection && (
              <div>
                <button
                  onClick={() => setShowStickerTypeSelection(true)}
                  className="text-white/60 text-sm hover:text-white transition-colors mb-3"
                >
                  ← Back to stickers
                </button>
                <div className="space-y-4">
              {/* Smileys & Emotions */}
              <div>
                <p className="text-white/60 text-xs mb-2 font-medium">Smileys & Emotions</p>
                <div className="grid grid-cols-8 gap-2">
                  {['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleAddSticker(emoji);
                        setActiveTool('none');
                      }}
                      className="text-3xl hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Hearts & Love */}
              <div>
                <p className="text-white/60 text-xs mb-2 font-medium">Hearts & Love</p>
                <div className="grid grid-cols-8 gap-2">
                  {['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleAddSticker(emoji);
                        setActiveTool('none');
                      }}
                      className="text-3xl hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Gestures & Hands */}
              <div>
                <p className="text-white/60 text-xs mb-2 font-medium">Gestures</p>
                <div className="grid grid-cols-8 gap-2">
                  {['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏', '🦶', '🦵', '🦿'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleAddSticker(emoji);
                        setActiveTool('none');
                      }}
                      className="text-3xl hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Symbols & Icons */}
              <div>
                <p className="text-white/60 text-xs mb-2 font-medium">Symbols</p>
                <div className="grid grid-cols-8 gap-2">
                  {['🔥', '⭐', '✨', '💫', '🌟', '💥', '💦', '💨', '🌈', '☀️', '🌙', '⚡', '☁️', '❄️', '🌊', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🎯', '🎮', '🎵', '🎶', '🎤', '🎧', '📱'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleAddSticker(emoji);
                        setActiveTool('none');
                      }}
                      className="text-3xl hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Food & Drinks */}
              <div>
                <p className="text-white/60 text-xs mb-2 font-medium">Food & Drinks</p>
                <div className="grid grid-cols-8 gap-2">
                  {['🍕', '🍔', '🍟', '🌭', '🍿', '🥓', '🥚', '🧀', '🥗', '🍝', '🍜', '🍲', '🥘', '🍱', '🍛', '🍣', '🍤', '🍙', '🍚', '🥟', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '☕', '🍵', '🥤', '🍷'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleAddSticker(emoji);
                        setActiveTool('none');
                      }}
                      className="text-3xl hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Animals & Nature */}
              <div>
                <p className="text-white/60 text-xs mb-2 font-medium">Animals</p>
                <div className="grid grid-cols-8 gap-2">
                  {['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleAddSticker(emoji);
                        setActiveTool('none');
                      }}
                      className="text-3xl hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* GIF Picker Modal */}
      <GifPickerModal
        open={activeTool === 'gif'}
        onOpenChange={(open) => setActiveTool(open ? 'gif' : 'none')}
        onSelect={(gifUrl, type) => {
          // Stories show visual content directly, no need to distinguish in UI
          handleAddGif(gifUrl);
          setActiveTool('none');
        }}
        title="Add GIF to Story"
      />
      
      {/* Filter Panel - Swipeable Selector */}
      {activeTool === 'filter' && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/95 border-t border-white/10 p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Filters</h3>
              <button
                onClick={() => setActiveTool('none')}
                className="p-2 hover:bg-white/10 rounded-full"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            
            {/* Filter Selector - Horizontal Swipe */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
              {FILTERS.map((filter, index) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    setCurrentFilterIndex(index);
                    setSelectedFilter(filter.id);
                  }}
                  className={`flex-shrink-0 flex flex-col items-center gap-2 snap-start transition-all ${
                    currentFilterIndex === index ? 'scale-110' : 'scale-100'
                  }`}
                >
                  {/* Filter Preview */}
                  <div
                    className={`w-20 h-20 rounded-2xl border-3 transition-all overflow-hidden ${
                      currentFilterIndex === index
                        ? 'border-primary shadow-lg shadow-primary/50'
                        : 'border-white/20'
                    }`}
                    style={{
                      backgroundImage: `url(${image?.src})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      backgroundColor: '#000',
                      filter: filter.css,
                    }}
                  />
                  {/* Filter Name */}
                  <span className={`text-xs font-medium transition-all ${
                    currentFilterIndex === index ? 'text-primary' : 'text-white/60'
                  }`}>
                    {filter.name}
                  </span>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setActiveTool('none')}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}
      
      {/* Music Panel - Audius Integration */}
      {activeTool === 'music' && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/95 border-t border-white/10 p-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Add Music</h3>
              <button
                onClick={() => setActiveTool('none')}
                className="p-2 hover:bg-white/10 rounded-full"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchMusic}
                onChange={(e) => setSearchMusic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMusicSearch()}
                placeholder="Search songs, artists..."
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-20 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
              <button
                onClick={handleMusicSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary rounded-lg text-white text-sm font-medium hover:bg-primary/80 transition-all"
              >
                Search
              </button>
            </div>
            
            {/* Loading State */}
            {isLoadingMusic && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                <p className="text-white/60 text-sm mt-2">Loading tracks...</p>
              </div>
            )}
            
            {/* Search Results */}
            {!isLoadingMusic && musicResults.length > 0 && (
              <div>
                <p className="text-white/60 text-xs font-medium mb-3">Search Results</p>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {musicResults.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handleSelectTrack(track)}
                      className={`w-full p-3 border rounded-xl flex items-center gap-3 transition-all group ${
                        selectedTrack?.id === track.id 
                          ? 'bg-primary/20 border-primary' 
                          : 'bg-white/5 hover:bg-white/10 border-white/10'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
                        {track.artwork?.['150x150'] ? (
                          <img 
                            src={track.artwork['150x150']} 
                            alt={track.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg></div>';
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-white font-medium text-sm truncate">{track.title}</p>
                        <p className="text-white/60 text-xs truncate">{track.user.name}</p>
                        <p className="text-white/40 text-xs">{formatDuration(track.duration)} • {track.genre}</p>
                      </div>
                      <Play className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Trending Music */}
            {!isLoadingMusic && musicResults.length === 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Music className="h-4 w-4 text-primary" />
                  <p className="text-white/60 text-xs font-medium">Trending on Audius</p>
                </div>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {trendingMusic.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handleSelectTrack(track)}
                      className={`w-full p-3 border rounded-xl flex items-center gap-3 transition-all group ${
                        selectedTrack?.id === track.id 
                          ? 'bg-primary/20 border-primary' 
                          : 'bg-white/5 hover:bg-white/10 border-white/10'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
                        {track.artwork?.['150x150'] ? (
                          <img 
                            src={track.artwork['150x150']} 
                            alt={track.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg></div>';
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-white font-medium text-sm truncate">{track.title}</p>
                        <p className="text-white/60 text-xs truncate">{track.user.name}</p>
                        <p className="text-white/40 text-xs">{formatDuration(track.duration)} • {track.play_count.toLocaleString()} plays</p>
                      </div>
                      <Play className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Music Preview Player */}
            {selectedTrack && (
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-primary/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {selectedTrack.artwork?.['150x150'] ? (
                      <img 
                        src={selectedTrack.artwork['150x150']} 
                        alt={selectedTrack.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>';
                          }
                        }}
                      />
                    ) : (
                      <Music className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{selectedTrack.title}</p>
                    <p className="text-white/70 text-xs truncate">{selectedTrack.user.name}</p>
                  </div>
                  <button
                    onClick={toggleMusicPlayback}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all flex-shrink-0"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 text-white" />
                    ) : (
                      <Play className="h-5 w-5 text-white ml-0.5" />
                    )}
                  </button>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all"
                      style={{ width: `${(currentTime / selectedTrack.duration) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-white/60 text-xs">
                    <span>{formatDuration(Math.floor(currentTime))}</span>
                    <span>{formatDuration(selectedTrack.duration)}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleOpenMusicCustomizer}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  Customize & Add
                </button>
              </div>
            )}
            
            <p className="text-white/40 text-xs text-center">Powered by Audius - Free decentralized music</p>
          </div>
        </div>
      )}

      {/* Music Customizer Panel - Instagram Style */}
      {showMusicCustomizer && selectedTrack && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col">
          {/* Top Bar - Minimal */}
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setShowMusicCustomizer(false)} className="text-white">
              <X className="h-7 w-7" />
            </button>
            <button
              onClick={handleAddMusicToStory}
              className="text-white font-semibold text-base"
            >
              Done
            </button>
          </div>

          {/* Main Content - Centered */}
          <div className="flex-1 flex items-center justify-center px-4">
            {/* Music Sticker Preview */}
            <div 
              className="bg-white rounded-2xl shadow-2xl flex items-center gap-3 px-4 py-3 max-w-xs"
              style={{ minWidth: '280px' }}
            >
              {/* Album Art */}
              <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-gray-200">
                {selectedTrack.artwork?.['150x150'] ? (
                  <img 
                    src={selectedTrack.artwork['150x150']} 
                    alt={selectedTrack.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-black text-sm font-bold truncate leading-tight">{selectedTrack.title}</p>
                <p className="text-gray-600 text-xs font-medium truncate">{selectedTrack.user.name}</p>
              </div>
            </div>
          </div>

          {/* Bottom Controls - Timeline */}
          <div className="p-6 space-y-4">
            {/* Timeline Duration Display */}
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-xs font-medium">
                {formatDuration(clipStart)}
              </span>
              <span className="text-white text-xs font-semibold">
                {formatDuration(clipEnd - clipStart)}s clip
              </span>
              <span className="text-white/60 text-xs font-medium">
                {formatDuration(clipEnd)}
              </span>
            </div>

            {/* Timeline Scrubber */}
            <div className="relative">
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{ 
                    width: `${((clipEnd - clipStart) / selectedTrack.duration) * 100}%`,
                    marginLeft: `${(clipStart / selectedTrack.duration) * 100}%`
                  }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, selectedTrack.duration - 30)}
                step="1"
                value={clipStart}
                onChange={(e) => handleClipStartChange(Number(e.target.value))}
                onMouseDown={() => audioRef.current?.pause()}
                onTouchStart={() => audioRef.current?.pause()}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Center Controls */}
            <div className="flex items-center justify-center gap-8 pt-2">
              {/* Music Icon */}
              <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Music className="h-6 w-6 text-white" />
              </button>
              
              {/* Play/Pause */}
              <button
                onClick={toggleMusicPlayback}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg"
              >
                {isPlaying ? (
                  <Pause className="h-7 w-7 text-black" />
                ) : (
                  <Play className="h-7 w-7 text-black ml-1" />
                )}
              </button>
              
              {/* Clip Length Icon */}
              <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-white text-xs font-bold">30s</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OLD CUSTOMIZER CODE - REMOVE THIS SECTION */}
      {false && showMusicCustomizer && selectedTrack && (
        <div className="hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Sticker Style Selection */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Choose Style
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {/* Circle Style - Vinyl Record */}
                <button
                  onClick={() => setMusicStickerStyle('circle')}
                  className={`aspect-square rounded-2xl border-2 transition-all ${
                    musicStickerStyle === 'circle'
                      ? 'border-primary bg-primary/20 shadow-lg shadow-primary/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="p-2 flex flex-col items-center justify-center h-full gap-1">
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden shadow-xl relative"
                      style={{ backgroundColor: musicStickerBg }}
                    >
                      {selectedTrack.artwork?.['150x150'] ? (
                        <img 
                          src={selectedTrack.artwork['150x150']} 
                          alt={selectedTrack.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Music className="h-6 w-6 text-white" />
                      )}
                      {/* Vinyl record effect */}
                      <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                    </div>
                    <p className="text-white text-[10px] font-bold truncate w-full text-center leading-tight">{selectedTrack.title}</p>
                    <p className="text-white/60 text-[8px] truncate w-full text-center">Vinyl</p>
                  </div>
                </button>

                {/* Rectangle Style - Wave */}
                <button
                  onClick={() => setMusicStickerStyle('rectangle')}
                  className={`aspect-square rounded-2xl border-2 transition-all ${
                    musicStickerStyle === 'rectangle'
                      ? 'border-primary bg-primary/20 shadow-lg shadow-primary/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="p-2 flex flex-col items-center justify-center h-full gap-1">
                    <div 
                      className="w-20 h-10 rounded-lg flex items-center justify-center overflow-hidden shadow-lg relative"
                      style={{ backgroundColor: musicStickerBg }}
                    >
                      {selectedTrack.artwork?.['150x150'] ? (
                        <img 
                          src={selectedTrack.artwork['150x150']} 
                          alt={selectedTrack.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Music className="h-5 w-5 text-white" />
                      )}
                      {/* Wave bars effect */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    </div>
                    <p className="text-white text-[10px] font-bold truncate w-full text-center leading-tight">{selectedTrack.title}</p>
                    <p className="text-white/60 text-[8px] truncate w-full text-center">Wave</p>
                  </div>
                </button>

                {/* Square Style - Horizontal Card */}
                <button
                  onClick={() => setMusicStickerStyle('square')}
                  className={`aspect-square rounded-2xl border-2 transition-all ${
                    musicStickerStyle === 'square'
                      ? 'border-primary bg-primary/20 shadow-lg shadow-primary/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="p-2 flex items-center justify-center h-full">
                    {/* Horizontal Layout Preview */}
                    <div 
                      className="rounded-lg overflow-hidden flex items-center gap-2 px-2 py-1.5 shadow-lg"
                      style={{ backgroundColor: musicStickerBg }}
                    >
                      {/* Album Art - Left */}
                      <div className="w-10 h-10 rounded-md flex-shrink-0 overflow-hidden bg-black/20">
                        {selectedTrack.artwork?.['150x150'] ? (
                          <img 
                            src={selectedTrack.artwork['150x150']} 
                            alt={selectedTrack.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                      {/* Text - Right */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[9px] font-bold truncate leading-tight">{selectedTrack.title}</p>
                        <p className="text-white/80 text-[7px] truncate">{selectedTrack.user.name}</p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Background Color Picker */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                Background Color
              </h3>
              <div className="grid grid-cols-8 gap-2">
                {[
                  '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6',
                  '#EF4444', '#F87171', '#6366F1', '#14B8A6', '#F97316',
                  '#84CC16', '#06B6D4', '#A855F7', '#D946EF', '#F43F5E',
                  '#6B7280'
                ].map((color, idx) => (
                  <button
                    key={`color-${idx}`}
                    onClick={() => setMusicStickerBg(color)}
                    className={`w-10 h-10 rounded-full transition-all ${
                      musicStickerBg === color
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Timeline Scrubber - Select 30 Second Clip */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary" />
                  Select 30 Second Clip
                </h3>
                <div className="text-primary text-sm font-mono">
                  {formatDuration(clipStart)} - {formatDuration(clipEnd)}
                </div>
              </div>
              
              {/* Timeline */}
              <div className="space-y-3">
                <div className="relative h-12 bg-white/10 rounded-xl overflow-hidden">
                  {/* Full track bar */}
                  <div className="absolute inset-0" />
                  
                  {/* Selected clip highlight */}
                  <div 
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-purple-500/40 to-pink-500/40 border-2 border-primary"
                    style={{
                      left: `${(clipStart / selectedTrack.duration) * 100}%`,
                      width: `${((clipEnd - clipStart) / selectedTrack.duration) * 100}%`
                    }}
                  />
                  
                  {/* Current playback position */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                    style={{ left: `${(currentTime / selectedTrack.duration) * 100}%` }}
                  />
                  
                  {/* Time markers */}
                  <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                    <span className="text-white/60 text-xs font-mono">0:00</span>
                    <span className="text-white/60 text-xs font-mono">{formatDuration(selectedTrack.duration)}</span>
                  </div>
                </div>
                
                {/* Scrubber */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-white/60 text-xs">Start Time</label>
                    <span className="text-white text-xs font-mono bg-white/10 px-2 py-0.5 rounded">
                      {formatDuration(clipStart)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, selectedTrack.duration - 30)}
                    step="1"
                    value={clipStart}
                    onChange={(e) => handleClipStartChange(Number(e.target.value))}
                    onMouseDown={() => audioRef.current?.pause()}
                    onTouchStart={() => audioRef.current?.pause()}
                    className="w-full h-3 bg-gradient-to-r from-white/10 to-white/20 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-5
                      [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-gradient-to-r
                      [&::-webkit-slider-thumb]:from-purple-500
                      [&::-webkit-slider-thumb]:to-pink-500
                      [&::-webkit-slider-thumb]:cursor-grab
                      [&::-webkit-slider-thumb]:shadow-xl
                      [&::-webkit-slider-thumb]:border-2
                      [&::-webkit-slider-thumb]:border-white
                      [&::-webkit-slider-thumb]:active:cursor-grabbing
                      [&::-webkit-slider-thumb]:active:scale-110
                      [&::-webkit-slider-thumb]:transition-transform"
                  />
                  <div className="flex items-center justify-between text-[10px] text-white/40">
                    <span>Drag to select</span>
                    <span>30 sec clip</span>
                  </div>
                </div>
                
                {/* Preview Button */}
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = clipStart;
                      audioRef.current.play();
                    }
                  }}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Preview Clip
                </button>
              </div>
            </div>

            {/* Preview of final sticker */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Final Preview
              </h3>
              <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/20 rounded-2xl p-8 flex items-center justify-center backdrop-blur-sm">
                {musicStickerStyle === 'square' ? (
                  /* Horizontal Card Layout */
                  <div 
                    className="rounded-2xl overflow-hidden flex items-center gap-4 px-4 py-3 shadow-2xl max-w-xs"
                    style={{ backgroundColor: musicStickerBg }}
                  >
                    {/* Album Art - Left */}
                    <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden bg-black/30 shadow-lg">
                      {selectedTrack.artwork?.['480x480'] ? (
                        <img 
                          src={selectedTrack.artwork['480x480']} 
                          alt={selectedTrack.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                    {/* Text - Right */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-base font-bold truncate leading-tight mb-1">{selectedTrack.title}</p>
                      <p className="text-white/90 text-sm font-medium truncate mb-1">{selectedTrack.user.name}</p>
                      <p className="text-white/60 text-xs font-mono">
                        {formatDuration(clipStart)}-{formatDuration(clipEnd)}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Circle & Rectangle Vertical Layout */
                  <div className="flex flex-col items-center gap-3">
                    <div 
                      className={`flex items-center justify-center overflow-hidden shadow-2xl relative ${
                        musicStickerStyle === 'circle' ? 'w-24 h-24 rounded-full' :
                        'w-40 h-20 rounded-2xl'
                      }`}
                      style={{ backgroundColor: musicStickerBg }}
                    >
                      {selectedTrack.artwork?.['480x480'] ? (
                        <img 
                          src={selectedTrack.artwork['480x480']} 
                          alt={selectedTrack.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Music className="h-12 w-12 text-white" />
                      )}
                      {musicStickerStyle === 'circle' && (
                        <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                      )}
                      {musicStickerStyle === 'rectangle' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-white text-base font-bold mb-1">{selectedTrack.title}</p>
                      <p className="text-white/80 text-sm font-medium mb-1">{selectedTrack.user.name}</p>
                      <p className="text-white/60 text-xs font-mono">
                        {formatDuration(clipStart)} - {formatDuration(clipEnd)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Story Settings Modal */}
      {showSettings && currentUser && (
        <StorySettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          storyId="temp-editor-story-id"
          currentUserId={currentUser.userId}
          currentSettings={storySettings}
          onSettingsUpdate={() => {
            // Settings will be applied when story is saved
          }}
        />
      )}

      {/* Keyboard-style Panel (while editing) */}
      {isEditing && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/95 border-t border-white/10">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-semibold">Add Text</h3>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingText('');
                setCurrentTextId(null);
                setActiveTool('none');
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-all"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'text' ? 'text-white border-b-2 border-primary' : 'text-white/50'}`}
            >
              Text
            </button>
            <button
              onClick={() => setActiveTab('color')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'color' ? 'text-white border-b-2 border-primary' : 'text-white/50'}`}
            >
              <Palette className="h-5 w-5 mx-auto" />
            </button>
            <button
              onClick={() => setActiveTab('alignment')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'alignment' ? 'text-white border-b-2 border-primary' : 'text-white/50'}`}
            >
              Align
            </button>
            <button
              onClick={() => setActiveTab('effects')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'effects' ? 'text-white border-b-2 border-primary' : 'text-white/50'}`}
            >
              <Sparkles className="h-5 w-5 mx-auto" />
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4 max-h-[200px] overflow-y-auto">
            {/* Text Styles Tab */}
            {activeTab === 'text' && (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {TEXT_STYLES.map((style) => (
                  <button
                    key={style.name}
                    onClick={() => {
                      setTextFont(style.fontFamily);
                      setTextEffect(style.effect as any);
                    }}
                    className={`flex-shrink-0 px-6 py-3 rounded-xl border-2 transition-all ${
                      textFont === style.fontFamily
                        ? 'border-primary bg-primary/20 text-white'
                        : 'border-white/20 bg-white/5 text-white/70'
                    }`}
                    style={{ fontFamily: style.fontFamily }}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            )}

            {/* Color Tab */}
            {activeTab === 'color' && (
              <div className="grid grid-cols-5 gap-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setTextColor(color)}
                    className={`w-full aspect-square rounded-xl border-2 transition-all ${
                      textColor === color ? 'border-primary scale-110' : 'border-white/30'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}

            {/* Alignment Tab */}
            {activeTab === 'alignment' && (
              <div className="flex gap-3">
                <button
                  onClick={() => setTextAlign('left')}
                  className={`flex-1 py-4 rounded-xl border-2 ${
                    textAlign === 'left' ? 'border-primary bg-primary/20' : 'border-white/20 bg-white/5'
                  }`}
                >
                  <AlignLeft className="h-6 w-6 mx-auto text-white" />
                </button>
                <button
                  onClick={() => setTextAlign('center')}
                  className={`flex-1 py-4 rounded-xl border-2 ${
                    textAlign === 'center' ? 'border-primary bg-primary/20' : 'border-white/20 bg-white/5'
                  }`}
                >
                  <AlignCenter className="h-6 w-6 mx-auto text-white" />
                </button>
                <button
                  onClick={() => setTextAlign('right')}
                  className={`flex-1 py-4 rounded-xl border-2 ${
                    textAlign === 'right' ? 'border-primary bg-primary/20' : 'border-white/20 bg-white/5'
                  }`}
                >
                  <AlignRight className="h-6 w-6 mx-auto text-white" />
                </button>
              </div>
            )}

            {/* Effects Tab */}
            {activeTab === 'effects' && (
              <div className="flex gap-3">
                <button
                  onClick={() => setTextEffect('none')}
                  className={`flex-1 py-4 rounded-xl border-2 ${
                    textEffect === 'none' ? 'border-primary bg-primary/20' : 'border-white/20 bg-white/5'
                  }`}
                >
                  <span className="text-white font-bold">None</span>
                </button>
                <button
                  onClick={() => setTextEffect('shadow')}
                  className={`flex-1 py-4 rounded-xl border-2 ${
                    textEffect === 'shadow' ? 'border-primary bg-primary/20' : 'border-white/20 bg-white/5'
                  }`}
                >
                  <span className="text-white font-bold" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                    Shadow
                  </span>
                </button>
                <button
                  onClick={() => setTextEffect('outline')}
                  className={`flex-1 py-4 rounded-xl border-2 ${
                    textEffect === 'outline' ? 'border-primary bg-primary/20' : 'border-white/20 bg-white/5'
                  }`}
                >
                  <span className="text-white font-bold" style={{ WebkitTextStroke: '1px black' }}>
                    Outline
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Done Button */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleDone}
              disabled={!editingText.trim()}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check className="h-5 w-5" />
              Done
            </button>
          </div>
        </div>
      )}

      {/* Mention Sticker Creator Dialog */}
      {showMentionDialog && (
        <MentionStickerCreator
          onAdd={(userId, username, avatarURL, verified) => {
            handleAddMentionSticker(userId, username, avatarURL, verified);
            setShowMentionDialog(false);
            setActiveTool('none');
          }}
          onClose={() => setShowMentionDialog(false)}
        />
      )}
    </div>
  );
}
