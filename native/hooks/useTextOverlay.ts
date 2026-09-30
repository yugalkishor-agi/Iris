import { useState, useCallback } from 'react';

export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  backgroundColor?: string;
  rotation: number;
  opacity: number;
}

export const useTextOverlay = () => {
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const addTextLayer = useCallback((text: string, x: number = 100, y: number = 100) => {
    const newLayer: TextLayer = {
      id: Date.now().toString(),
      text,
      x,
      y,
      fontSize: 24,
      color: '#FFFFFF',
      fontFamily: 'System',
      rotation: 0,
      opacity: 1,
    };

    setTextLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    return newLayer.id;
  }, []);

  const updateTextLayer = useCallback((id: string, updates: Partial<TextLayer>) => {
    setTextLayers(prev =>
      prev.map(layer =>
        layer.id === id ? { ...layer, ...updates } : layer
      )
    );
  }, []);

  const deleteTextLayer = useCallback((id: string) => {
    setTextLayers(prev => prev.filter(layer => layer.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  }, [selectedLayerId]);

  const duplicateTextLayer = useCallback((id: string) => {
    const layer = textLayers.find(l => l.id === id);
    if (layer) {
      const newLayer: TextLayer = {
        ...layer,
        id: Date.now().toString(),
        x: layer.x + 20,
        y: layer.y + 20,
      };
      setTextLayers(prev => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
      return newLayer.id;
    }
    return null;
  }, [textLayers]);

  const moveLayerToFront = useCallback((id: string) => {
    setTextLayers(prev => {
      const layer = prev.find(l => l.id === id);
      if (layer) {
        const others = prev.filter(l => l.id !== id);
        return [...others, layer];
      }
      return prev;
    });
  }, []);

  const moveLayerToBack = useCallback((id: string) => {
    setTextLayers(prev => {
      const layer = prev.find(l => l.id === id);
      if (layer) {
        const others = prev.filter(l => l.id !== id);
        return [layer, ...others];
      }
      return prev;
    });
  }, []);

  const clearAllLayers = useCallback(() => {
    setTextLayers([]);
    setSelectedLayerId(null);
  }, []);

  const getSelectedLayer = useCallback(() => {
    return textLayers.find(layer => layer.id === selectedLayerId) || null;
  }, [textLayers, selectedLayerId]);

  return {
    textLayers,
    selectedLayerId,
    selectedLayer: getSelectedLayer(),
    setSelectedLayerId,
    addTextLayer,
    updateTextLayer,
    deleteTextLayer,
    duplicateTextLayer,
    moveLayerToFront,
    moveLayerToBack,
    clearAllLayers,
  };
};
