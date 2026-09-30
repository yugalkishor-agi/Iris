import { useCallback, useMemo } from 'react';
import { Keyboard } from 'react-native';
import { 
  GlimpseOverlayEffect, 
  GlimpseOverlayBackground 
} from '../../utils/glimpse/glimpseEditorTypes';

interface UseGlimpseTextProps {
  setActiveTool: (tool: any) => void;
  setComposerVisible: (val: boolean) => void;
  setComposerTool: (tool: any) => void;
  setSelectedCanvasLayer: (id: string | null) => void;
  setSelectedOverlayId: (id: string | null) => void;
  setTextOffset: (offset: { x: number; y: number }) => void;
  setTextScale: (scale: number) => void;
  setTextRotation: (rotation: number) => void;
  overlayEffect: GlimpseOverlayEffect;
  textColor: string;
  overlayBackground: GlimpseOverlayBackground;
}

export function useGlimpseText({
  setActiveTool,
  setComposerVisible,
  setComposerTool,
  setSelectedCanvasLayer,
  setSelectedOverlayId,
  setTextOffset,
  setTextScale,
  setTextRotation,
  overlayEffect,
  textColor,
  overlayBackground,
}: UseGlimpseTextProps) {

  const openComposer = useCallback(() => {
    setActiveTool('text');
    setComposerVisible(true);
    setComposerTool('font');
    setSelectedCanvasLayer('text');
    setSelectedOverlayId(null);
  }, [setActiveTool, setComposerTool, setComposerVisible, setSelectedCanvasLayer, setSelectedOverlayId]);

  const closeComposer = useCallback(() => {
    setComposerVisible(false);
    setActiveTool(null);
    Keyboard.dismiss();
  }, [setActiveTool, setComposerVisible]);

  const handleSelectTextLayer = useCallback(() => {
    setSelectedCanvasLayer('text');
    setSelectedOverlayId(null);
  }, [setSelectedCanvasLayer, setSelectedOverlayId]);

  const handleTextPositionChange = useCallback((x: number, y: number) => {
    setTextOffset({ x, y });
  }, [setTextOffset]);

  const handleTextScaleChange = useCallback((scale: number) => {
    setTextScale(scale);
  }, [setTextScale]);

  const handleTextRotationChange = useCallback((rotation: number) => {
    setTextRotation(rotation);
  }, [setTextRotation]);

  const textShadowStyle = useMemo(() => {
    if (overlayEffect === 'glow') {
      return { textShadowColor: textColor, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16 };
    }
    if (overlayEffect === 'shadow') {
      return { textShadowColor: 'rgba(0,0,0,0.62)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 18 };
    }
    return { textShadowColor: 'rgba(0,0,0,0.36)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 };
  }, [overlayEffect, textColor]);

  const textBackgroundStyle = useMemo(() => {
    if (overlayBackground === 'black') {
      return { backgroundColor: 'rgba(0,0,0,0.86)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 };
    }
    if (overlayBackground === 'white') {
      return { backgroundColor: 'rgba(255,255,255,0.96)', borderColor: 'rgba(15,23,42,0.12)', borderWidth: 1 };
    }
    return { 
      backgroundColor: 'transparent', 
      borderColor: overlayEffect === 'outline' ? 'rgba(255,255,255,0.92)' : 'transparent', 
      borderWidth: overlayEffect === 'outline' ? 1.4 : 0 
    };
  }, [overlayBackground, overlayEffect]);

  return {
    openComposer,
    closeComposer,
    handleSelectTextLayer,
    handleTextPositionChange,
    handleTextScaleChange,
    handleTextRotationChange,
    textShadowStyle,
    textBackgroundStyle,
  };
}
