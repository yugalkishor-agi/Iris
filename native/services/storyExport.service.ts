/**
 * Story Export Service - Captures native story renderer as an image
 * 
 * Uses react-native-view-shot to capture the NativeStoryRenderer component
 * and produce a PNG/JPG image file for uploading.
 */

import { RefObject } from 'react';
import { View } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';

export interface CaptureOptions {
    format?: 'png' | 'jpg';
    quality?: number;
    width?: number;
    height?: number;
}

/**
 * Capture a View ref as an image file
 * @param viewRef - React ref to the View component to capture
 * @param options - Capture options (format, quality, dimensions)
 * @returns Promise<string> - URI of the captured image file
 */
export async function captureStoryAsImage(
    viewRef: RefObject<View>,
    options: CaptureOptions = {}
): Promise<string> {
    const {
        format = 'png',
        quality = 1,
        width,
        height,
    } = options;

    if (!viewRef.current) {
        throw new Error('View ref is not available');
    }

    try {
        const uri = await captureRef(viewRef, {
            format,
            quality,
            width,
            height,
            result: 'tmpfile', // Save to temp file
        });

        console.log('[StoryExport] Captured story image:', uri);
        return uri;
    } catch (error) {
        console.error('[StoryExport] Failed to capture story:', error);
        throw error;
    }
}

/**
 * Capture story as base64 string (useful for preview/debugging)
 */
export async function captureStoryAsBase64(
    viewRef: RefObject<View>,
    options: CaptureOptions = {}
): Promise<string> {
    const {
        format = 'png',
        quality = 1,
    } = options;

    if (!viewRef.current) {
        throw new Error('View ref is not available');
    }

    try {
        const base64 = await captureRef(viewRef, {
            format,
            quality,
            result: 'base64',
        });

        return `data:image/${format};base64,${base64}`;
    } catch (error) {
        console.error('[StoryExport] Failed to capture story as base64:', error);
        throw error;
    }
}

/**
 * Recommended dimensions for story export
 */
export const STORY_EXPORT_DIMENSIONS = {
    // Standard story dimensions (9:16 aspect ratio)
    width: 1080,
    height: 1920,

    // Stage dimensions used in editor
    stageWidth: 375,
    stageHeight: 667,
};

export default {
    captureStoryAsImage,
    captureStoryAsBase64,
    STORY_EXPORT_DIMENSIONS,
};
