/**
 * Native Story Renderer - Renders story with overlays using native React Native components
 * 
 * Uses the unified StoryOverlayRenderer for consistent rendering across:
 * - Editor export (static capture)
 * - Story viewer (interactive)
 * 
 * Coordinate System:
 * - Uses normalized positions (0-1 range)
 * - Positions are CENTER-based (x,y is center of element)
 * - Scales to fit container while maintaining aspect ratio
 */

import React, { forwardRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { StoryOverlayRenderer } from './StoryOverlayRenderer';
import { CanvasConfig } from '../../constants/storyCanvas';
import { Image } from 'expo-image';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Default stage dimensions (same as editor)
const DEFAULT_STAGE_W = 375;
const DEFAULT_STAGE_H = 667;

interface StoryOverlay {
    id: string;
    type?: string;
    kind?: string;
    x?: number;
    y?: number;
    rotation?: number;
    scale?: number;
    text?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    textAlign?: string;
    backgroundColor?: string;
    content?: any;
    transform?: {
        x?: number;
        y?: number;
        w?: number;
        h?: number;
        rotation?: number;
        scale?: number;
        z?: number;
    };
    size?: { w?: number; h?: number };
}

interface Drawing {
    id: string;
    svgData?: string;
}

interface NativeStoryRendererProps {
    mediaURL: string;
    mediaType: 'image' | 'video';
    textElements?: StoryOverlay[];
    stickers?: StoryOverlay[];
    drawings?: Drawing[];
    filters?: {
        brightness?: number;
        contrast?: number;
        saturation?: number;
    };
    stageWidth?: number;
    stageHeight?: number;
    containerWidth?: number;
    containerHeight?: number;
    canvasConfig?: CanvasConfig;
}

/**
 * NativeStoryRenderer - Renders a complete story with media and overlays
 * 
 * Uses StoryOverlayRenderer in static mode (isInteractive=false) for export capture.
 */
export const NativeStoryRenderer = forwardRef<View, NativeStoryRendererProps>(
    function NativeStoryRenderer(props, ref) {
        const {
            mediaURL,
            mediaType,
            textElements = [],
            stickers = [],
            drawings = [],
            filters,
            stageWidth = SCREEN_WIDTH,
            stageHeight = SCREEN_HEIGHT,
            containerWidth = SCREEN_WIDTH,
            containerHeight = SCREEN_HEIGHT,
            canvasConfig,
        } = props;

        // Convert text elements to overlay format
        const formattedTextElements = useMemo(() => {
            return textElements.map((el, idx) => ({
                id: el.id || `text_${idx}`,
                text: el.text || '',
                x: el.transform?.x ?? el.x ?? 0.5,
                y: el.transform?.y ?? el.y ?? 0.5,
                transform: el.transform,
                size: el.size,
                scale: el.scale,
                rotation: el.rotation,
                color: el.color || '#FFFFFF',
                fontSize: el.fontSize || 24,
                fontWeight: el.fontWeight || 'bold',
                textAlign: el.textAlign || 'center',
                backgroundColor: el.backgroundColor,
            }));
        }, [textElements]);

        // Convert stickers to overlay format
        const formattedStickers = useMemo(() => {
            return stickers.map((st, idx) => ({
                id: st.id || `sticker_${idx}`,
                type: st.type || st.kind || 'label',
                kind: st.kind,
                content: st.content,
                x: st.transform?.x ?? st.x ?? 0.5,
                y: st.transform?.y ?? st.y ?? 0.5,
                transform: st.transform,
                size: st.size,
                scale: st.scale,
                rotation: st.rotation,
            }));
        }, [stickers]);

        // Convert drawings to overlay format
        const formattedDrawings = useMemo(() => {
            return drawings
                .filter(d => d.svgData)
                .map((d, idx) => ({
                    id: d.id || `drawing_${idx}`,
                    svgData: d.svgData!,
                }));
        }, [drawings]);

        // Filter overlay (brightness)
        const brightnessOverlay = useMemo(() => {
            const b = filters?.brightness;
            if (typeof b === 'number' && b !== 0) {
                return (
                    <View
                        pointerEvents="none"
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                backgroundColor: b > 0 ? '#FFFFFF' : '#000000',
                                opacity: Math.min(0.35, Math.abs(b) * 0.35),
                            },
                        ]}
                    />
                );
            }
            return null;
        }, [filters?.brightness]);

        return (
            <View ref={ref} style={[styles.container, { width: containerWidth, height: containerHeight }]}>
                {/* Media Layer */}
                {mediaType === 'video' ? (
                    <Video
                        source={{ uri: mediaURL }}
                        style={StyleSheet.absoluteFill}
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay={false}
                        isMuted
                    />
                ) : (
                    <Image
                        source={{ uri: mediaURL }}
                        style={StyleSheet.absoluteFill}
                        contentFit="contain"
                    />
                )}

                {/* Brightness Filter Overlay */}
                {brightnessOverlay}

                {/* Unified Overlay Renderer - Static mode for export */}
                <StoryOverlayRenderer
                    containerWidth={containerWidth}
                    containerHeight={containerHeight}
                    textElements={formattedTextElements}
                    stickers={formattedStickers as any}
                    drawings={formattedDrawings}
                    isInteractive={false}
                    positionSpace="screen"
                    canvasConfig={canvasConfig}
                />
            </View>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#000000',
        overflow: 'hidden',
    },
});

export default NativeStoryRenderer;
