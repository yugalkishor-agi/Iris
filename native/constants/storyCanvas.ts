/**
 * Story Canvas Configuration
 * 
 * The web editor uses these dimensions as its reference frame.
 * All widget positions are normalized relative to this canvas.
 * The viewer rescales positions based on actual screen dimensions.
 */
export const STORY_CANVAS = {
    // Web editor canvas dimensions (from KonvaStoryEditor.tsx)
    WIDTH: 375,
    HEIGHT: 667,
    ASPECT_RATIO: 375 / 667, // ~0.562

    // Helpers
    get isPortrait() {
        return this.HEIGHT > this.WIDTH;
    }
};

export type CanvasConfig = {
    width: number;
    height: number;
    aspectRatio: number;
};

/**
 * Get default canvas config (fallback for stories without canvasConfig)
 */
export function getDefaultCanvasConfig(): CanvasConfig {
    return {
        width: STORY_CANVAS.WIDTH,
        height: STORY_CANVAS.HEIGHT,
        aspectRatio: STORY_CANVAS.ASPECT_RATIO,
    };
}

/**
 * Calculate position scaling factors from editor canvas to viewer screen
 * 
 * @param canvasConfig - The canvas config from the story (or default)
 * @param screenWidth - The viewer's screen width
 * @param screenHeight - The viewer's screen height
 * @returns Scale factors for x, y, and uniform scaling
 */
export function calculatePositionScale(
    canvasConfig: CanvasConfig,
    screenWidth: number,
    screenHeight: number
): { scaleX: number; scaleY: number; uniformScale: number; offsetX: number; offsetY: number } {
    const canvasAspect = canvasConfig.width / canvasConfig.height;
    const screenAspect = screenWidth / screenHeight;

    let scaleX: number;
    let scaleY: number;
    let offsetX = 0;
    let offsetY = 0;

    if (screenAspect > canvasAspect) {
        // Screen is wider than canvas - letterbox on sides
        // Height fills screen, calculate width that maintains aspect ratio
        const scaledWidth = screenHeight * canvasAspect;
        scaleX = scaledWidth / canvasConfig.width;
        scaleY = screenHeight / canvasConfig.height;
        offsetX = (screenWidth - scaledWidth) / 2;
    } else {
        // Screen is taller than canvas - letterbox on top/bottom
        // Width fills screen, calculate height that maintains aspect ratio
        const scaledHeight = screenWidth / canvasAspect;
        scaleX = screenWidth / canvasConfig.width;
        scaleY = scaledHeight / canvasConfig.height;
        offsetY = (screenHeight - scaledHeight) / 2;
    }

    const uniformScale = Math.min(scaleX, scaleY);

    return { scaleX, scaleY, uniformScale, offsetX, offsetY };
}
