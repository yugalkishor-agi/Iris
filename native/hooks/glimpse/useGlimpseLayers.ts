import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GlimpseOverlayLayer } from '../../utils/glimpse/glimpseEditorTypes';
import { clamp, makeId } from '../../utils/glimpse/glimpseEditorCalculations';
import { 
  OVERLAY_MAX_SIZE, 
  OVERLAY_MIN_SIZE, 
  OVERLAY_STAGE_HEIGHT, 
  OVERLAY_STAGE_WIDTH 
} from '../../utils/glimpse/glimpseEditorConstants';

interface UseGlimpseLayersProps {
  overlayLayers: GlimpseOverlayLayer[];
  setOverlayLayers: React.Dispatch<React.SetStateAction<GlimpseOverlayLayer[]>>;
  selectedOverlayId: string | null;
  setSelectedOverlayId: (id: string | null) => void;
  selectedCanvasLayer: string | null;
  setSelectedCanvasLayer: (id: string | null) => void;
  setOverlayText: (text: string) => void;
  setTextOffset: (offset: { x: number; y: number }) => void;
  setTextScale: (scale: number) => void;
  setTextRotation: (rotation: number) => void;
  composerVisible: boolean;
}

export function useGlimpseLayers({
  overlayLayers,
  setOverlayLayers,
  selectedOverlayId,
  setSelectedOverlayId,
  selectedCanvasLayer,
  setSelectedCanvasLayer,
  setOverlayText,
  setTextOffset,
  setTextScale,
  setTextRotation,
  composerVisible,
}: UseGlimpseLayersProps) {

  const pickOverlayLayer = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Library permission is needed to add overlay images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ['images'], 
        quality: 1, 
        allowsEditing: false, 
        selectionLimit: 1 
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      
      const layer: GlimpseOverlayLayer = {
        id: makeId('overlay'),
        type: 'asset',
        content: '',
        assetUri: result.assets[0].uri,
        x: 72 + (overlayLayers.length % 3) * 18,
        y: 72 + (overlayLayers.length % 3) * 18,
        width: 132,
        height: 132,
        rotation: 0,
        scale: 1,
      };
      
      setOverlayLayers((prev) => [...prev, layer]);
      setSelectedOverlayId(layer.id);
      setSelectedCanvasLayer(layer.id);
    } catch {
      Alert.alert('Overlay failed', 'Could not add overlay image.');
    }
  }, [overlayLayers.length, setOverlayLayers, setSelectedCanvasLayer, setSelectedOverlayId]);

  const addStickerLayer = useCallback((sticker: string) => {
    const layer: GlimpseOverlayLayer = {
      id: makeId('sticker'),
      type: 'sticker',
      content: sticker,
      x: 88 + (overlayLayers.length % 3) * 12,
      y: 88 + (overlayLayers.length % 3) * 12,
      width: 96,
      height: 96,
      rotation: 0,
      scale: 1,
    };
    setOverlayLayers((prev) => [...prev, layer]);
    setSelectedOverlayId(layer.id);
    setSelectedCanvasLayer(layer.id);
  }, [overlayLayers.length, setOverlayLayers, setSelectedCanvasLayer, setSelectedOverlayId]);

  const moveSelectedOverlay = useCallback((deltaX: number, deltaY: number) => {
    if (!selectedOverlayId) return;
    setOverlayLayers((prev) => prev.map((layer) => {
      if (layer.id !== selectedOverlayId) return layer;
      const maxX = Math.max(0, OVERLAY_STAGE_WIDTH - layer.width);
      const maxY = Math.max(0, OVERLAY_STAGE_HEIGHT - layer.height);
      return {
        ...layer,
        x: clamp(layer.x + deltaX, 0, maxX),
        y: clamp(layer.y + deltaY, 0, maxY),
      };
    }));
  }, [selectedOverlayId, setOverlayLayers]);

  const resizeSelectedOverlay = useCallback((delta: number) => {
    if (!selectedOverlayId) return;
    setOverlayLayers((prev) => prev.map((layer) => {
      if (layer.id !== selectedOverlayId) return layer;
      const nextSize = clamp(layer.width + delta, OVERLAY_MIN_SIZE, OVERLAY_MAX_SIZE);
      const maxX = Math.max(0, OVERLAY_STAGE_WIDTH - nextSize);
      const maxY = Math.max(0, OVERLAY_STAGE_HEIGHT - nextSize);
      return {
        ...layer,
        width: nextSize,
        height: nextSize,
        x: clamp(layer.x, 0, maxX),
        y: clamp(layer.y, 0, maxY),
      };
    }));
  }, [selectedOverlayId, setOverlayLayers]);

  const removeSelectedOverlay = useCallback(() => {
    if (!selectedOverlayId) return;
    const nextLayers = overlayLayers.filter((layer) => layer.id !== selectedOverlayId);
    setOverlayLayers(nextLayers);
    const nextSelected = nextLayers[0]?.id || null;
    setSelectedOverlayId(nextSelected);
    setSelectedCanvasLayer(nextSelected);
  }, [overlayLayers, selectedOverlayId, setOverlayLayers, setSelectedCanvasLayer, setSelectedOverlayId]);

  const removeSelectedCanvasItem = useCallback(() => {
    if (selectedCanvasLayer === 'text') {
      setOverlayText('');
      setTextOffset({ x: 0, y: 0 });
      setTextScale(1);
      setTextRotation(0);
      setSelectedCanvasLayer(null);
      return;
    }
    if (selectedCanvasLayer) {
      const nextLayers = overlayLayers.filter((layer) => layer.id !== selectedCanvasLayer);
      setOverlayLayers(nextLayers);
      const nextSelected = nextLayers[0]?.id || null;
      setSelectedOverlayId(nextSelected);
      setSelectedCanvasLayer(nextSelected);
    }
  }, [overlayLayers, selectedCanvasLayer, setOverlayLayers, setOverlayText, setSelectedCanvasLayer, setSelectedOverlayId, setTextOffset, setTextRotation, setTextScale]);

  const clearCanvasSelection = useCallback(() => {
    if (composerVisible) return;
    setSelectedCanvasLayer(null);
    setSelectedOverlayId(null);
  }, [composerVisible, setSelectedCanvasLayer, setSelectedOverlayId]);

  const handleSelectOverlayLayer = useCallback((id: string) => {
    setSelectedCanvasLayer(id);
    setSelectedOverlayId(id);
  }, [setSelectedCanvasLayer, setSelectedOverlayId]);

  const handleUpdateOverlayLayer = useCallback((id: string, updates: Partial<GlimpseOverlayLayer>) => {
    setOverlayLayers((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)));
  }, [setOverlayLayers]);

  return {
    pickOverlayLayer,
    addStickerLayer,
    moveSelectedOverlay,
    resizeSelectedOverlay,
    removeSelectedOverlay,
    removeSelectedCanvasItem,
    clearCanvasSelection,
    handleSelectOverlayLayer,
    handleUpdateOverlayLayer,
  };
}
