/**
 * Story Capture Bridge - Hidden component for capturing native story render
 * 
 * This component renders NativeStoryRenderer off-screen and captures it
 * using react-native-view-shot. Used during story export to get a
 * consistent native-rendered image.
 */

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { NativeStoryRenderer } from './NativeStoryRenderer';

interface StoryCaptureBridgeProps {
    mediaURL: string;
    mediaType: 'image' | 'video';
    textElements: any[];
    stickers: any[];
    drawings: any[];
    filters?: {
        brightness?: number;
        contrast?: number;
        saturation?: number;
    };
    onCaptureReady?: (capture: () => Promise<string>) => void;
}

export interface StoryCaptureBridgeRef {
    capture: () => Promise<string>;
}

// Stage dimensions (same as editor)
const STAGE_W = 375;
const STAGE_H = 667;

/**
 * Prepare story data for native renderer
 */
function prepareRenderData(
    mediaURL: string,
    mediaType: 'image' | 'video',
    textElements: any[],
    stickers: any[],
    drawings: any[],
    filters?: any
) {
    return {
        mediaURL,
        mediaType,
        textElements: textElements.map(el => ({
            id: el.id || String(Date.now()),
            x: el.x ?? 0.5,
            y: el.y ?? 0.5,
            text: el.text || '',
            fontSize: el.fontSize || el.size || 24,
            fontFamily: el.fontFamily,
            fontWeight: el.fontWeight || 'bold',
            color: el.color || '#fff',
            rotation: el.rotation ?? 0,
            scale: el.scale ?? 1,
            scaleX: el.scaleX ?? el.scale ?? 1,
            scaleY: el.scaleY ?? el.scale ?? 1,
        })),
        stickers: stickers.map(st => ({
            id: st.id || String(Date.now()),
            kind: st.kind || st.type,
            type: st.type || st.kind,
            x: st.x ?? 0.5,
            y: st.y ?? 0.5,
            rotation: st.rotation ?? 0,
            scale: st.scale ?? 1,
            scaleX: st.scaleX ?? st.scale ?? 1,
            scaleY: st.scaleY ?? st.scale ?? 1,
            content: st.content,
            data: st.data || st.content,
            src: st.src,
            emoji: st.emoji,
        })),
        drawings: drawings.map(dr => ({
            id: dr.id || String(Date.now()),
            svgData: dr.svgData,
            points: dr.points,
            stroke: dr.stroke || '#fff',
            strokeWidth: dr.strokeWidth || 3,
        })),
        filters,
        stageWidth: STAGE_W,
        stageHeight: STAGE_H,
    };
}

/**
 * Renders NativeStoryRenderer and exposes capture method
 */
export const StoryCaptureBridge = forwardRef<StoryCaptureBridgeRef, StoryCaptureBridgeProps>(
    (
        {
            mediaURL,
            mediaType,
            textElements,
            stickers,
            drawings,
            filters,
            onCaptureReady,
        },
        ref
    ) => {
        const viewRef = useRef<View>(null);

        // Prepare data for native renderer
        const renderData = prepareRenderData(
            mediaURL,
            mediaType,
            textElements,
            stickers,
            drawings,
            filters
        );

        // Capture function
        const capture = async (): Promise<string> => {
            if (!viewRef.current) {
                throw new Error('View ref not available for capture');
            }

            try {
                const uri = await captureRef(viewRef, {
                    format: 'png',
                    quality: 1,
                    result: 'tmpfile',
                });

                console.log('[StoryCaptureBridge] Captured native story:', uri);
                return uri;
            } catch (error) {
                console.error('[StoryCaptureBridge] Capture failed:', error);
                throw error;
            }
        };

        // Expose capture method via ref
        useImperativeHandle(ref, () => ({
            capture,
        }));

        // Notify parent when capture is ready
        useEffect(() => {
            // Small delay to ensure render is complete
            const timeout = setTimeout(() => {
                onCaptureReady?.(capture);
            }, 100);

            return () => clearTimeout(timeout);
        }, [onCaptureReady]);

        return (
            <View style={styles.container} collapsable={false}>
                <View ref={viewRef} style={styles.captureArea} collapsable={false}>
                    <NativeStoryRenderer
                        mediaURL={renderData.mediaURL}
                        mediaType={renderData.mediaType}
                        textElements={renderData.textElements}
                        stickers={renderData.stickers}
                        drawings={renderData.drawings}
                        filters={renderData.filters}
                        stageWidth={renderData.stageWidth}
                        stageHeight={renderData.stageHeight}
                    />
                </View>
            </View>
        );
    }
);

StoryCaptureBridge.displayName = 'StoryCaptureBridge';

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: -9999, // Off-screen
        top: 0,
        width: 375,
        height: 667,
    },
    captureArea: {
        width: 375,
        height: 667,
        backgroundColor: '#000',
    },
});

export default StoryCaptureBridge;
