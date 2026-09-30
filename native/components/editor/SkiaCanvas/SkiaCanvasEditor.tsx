import React, { useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Image,
  useImage,
  Group,
  ColorMatrix,
  rect,
  Rect,
  Path,
} from '@shopify/react-native-skia';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import { useEditorStore } from '../../../stores/editorStore';
import { ElementRenderer } from './ElementRenderer';
import { createFilterMatrix } from '../../../utils/skiaFilters';

// Helper function to convert points array to SVG path
function pointsToPath(points: number[]): string {
  if (points.length < 2) return '';

  let path = `M ${points[0]} ${points[1]}`;
  for (let i = 2; i < points.length; i += 2) {
    path += ` L ${points[i]} ${points[i + 1]}`;
  }
  return path;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const CANVAS_ASPECT = CANVAS_HEIGHT / CANVAS_WIDTH;
const DISPLAY_WIDTH = SCREEN_WIDTH;
const DISPLAY_HEIGHT = DISPLAY_WIDTH * CANVAS_ASPECT;

interface SkiaCanvasEditorProps {
  imageUri: string;
}

export const SkiaCanvasEditor = React.forwardRef<any, SkiaCanvasEditorProps>(
  ({ imageUri }, ref) => {
  const canvasRef = useRef<any>(null);
  
  // Expose canvas ref to parent
  React.useImperativeHandle(ref, () => canvasRef.current);
  
  const image = useImage(imageUri);

  // Store state
  const elements = useEditorStore(state => state.elements);
  const filters = useEditorStore(state => state.filters);
  const activeTool = useEditorStore(state => state.activeTool);
  const isDrawing = useEditorStore(state => state.isDrawing);
  const currentDrawingPoints = useEditorStore(state => state.currentDrawingPoints);
  const textColor = useEditorStore(state => state.textColor);
  const textSize = useEditorStore(state => state.textSize);
  const textFont = useEditorStore(state => state.textFont);
  const brushColor = useEditorStore(state => state.brushColor);
  const brushSize = useEditorStore(state => state.brushSize);
  const selectedIds = useEditorStore(state => state.selectedIds);
  
  // Store actions
  const selectElement = useEditorStore(state => state.selectElement);
  const updateElement = useEditorStore(state => state.updateElement);
  const deselectAll = useEditorStore(state => state.deselectAll);
  const startDrawing = useEditorStore(state => state.startDrawing);
  const continueDrawing = useEditorStore(state => state.continueDrawing);
  const endDrawing = useEditorStore(state => state.endDrawing);
  const addElement = useEditorStore(state => state.addElement);

  // Shared values for gestures
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startRotation = useSharedValue(0);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = (x: number, y: number) => {
    const scaleX = CANVAS_WIDTH / DISPLAY_WIDTH;
    const scaleY = CANVAS_HEIGHT / DISPLAY_HEIGHT;
    return {
      x: x * scaleX,
      y: y * scaleY,
    };
  };

  // Handle tap (select element or add element for tools)
  const handleTap = useCallback((x: number, y: number) => {
    const canvasCoords = screenToCanvas(x, y);

    // If drawing tool is active, don't handle taps
    if (activeTool === 'draw') {
      return;
    }

    // If text tool is active, add text at tap position
    if (activeTool === 'text') {
      addElement({
        id: `text-${Date.now()}`,
        type: 'text',
        text: 'Tap to edit',
        x: canvasCoords.x,
        y: canvasCoords.y,
        width: 200,
        height: textSize * 1.5,
        rotation: 0,
        scale: 1,
        zIndex: elements.length,
        opacity: 1,
        locked: false,
        fontSize: textSize,
        fontFamily: textFont,
        color: textColor,
        textAlign: 'center',
        fontWeight: 'normal',
      });
      return;
    }

    // Check if tap hits any element
    const hitElement = elements
      .slice()
      .reverse() // Check from top to bottom
      .find(element => {
        // Simple bounding box hit test
        const halfWidth = element.width / 2;
        const halfHeight = element.height / 2;
        const dx = canvasCoords.x - element.x;
        const dy = canvasCoords.y - element.y;
        
        return (
          Math.abs(dx) <= halfWidth &&
          Math.abs(dy) <= halfHeight
        );
      });

    if (hitElement) {
      selectElement(hitElement.id, false);
    } else {
      deselectAll();
    }
  }, [activeTool, elements, textColor, textSize, textFont, addElement, selectElement, deselectAll]);

  // Tap gesture
  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      runOnJS(handleTap)(e.x, e.y);
    });

  // Pan gesture (for moving elements or drawing)
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      if (activeTool === 'draw') {
        const coords = screenToCanvas(e.x, e.y);
        runOnJS(startDrawing)(coords.x, coords.y);
      }
    })
    .onUpdate((e) => {
      if (activeTool === 'draw' && isDrawing) {
        const coords = screenToCanvas(e.x, e.y);
        runOnJS(continueDrawing)(coords.x, coords.y);
      } else {
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      }
    })
    .onEnd(() => {
      if (activeTool === 'draw' && isDrawing) {
        runOnJS(endDrawing)();
      } else {
        // Apply translation to selected elements
        if (selectedIds.length > 0) {
          const coords = screenToCanvas(translateX.value, translateY.value);
          selectedIds.forEach(id => {
            const element = elements.find(el => el.id === id);
            if (element) {
              runOnJS(updateElement)(id, {
                x: element.x + coords.x,
                y: element.y + coords.y,
              });
            }
          });
        }
        translateX.value = 0;
        translateY.value = 0;
      }
    });

  // Pinch gesture (for scaling)
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = startScale.value * e.scale;
    })
    .onEnd(() => {
      if (selectedIds.length > 0) {
        selectedIds.forEach(id => {
          const element = elements.find(el => el.id === id);
          if (element) {
            runOnJS(updateElement)(id, {
              scale: element.scale * scale.value,
            });
          }
        });
      }
      scale.value = 1;
      startScale.value = 1;
    });

  // Rotation gesture
  const rotationGesture = Gesture.Rotation()
    .onBegin(() => {
      startRotation.value = rotation.value;
    })
    .onUpdate((e) => {
      rotation.value = startRotation.value + e.rotation;
    })
    .onEnd(() => {
      if (selectedIds.length > 0) {
        selectedIds.forEach(id => {
          const element = elements.find(el => el.id === id);
          if (element) {
            runOnJS(updateElement)(id, {
              rotation: element.rotation + (rotation.value * 180) / Math.PI,
            });
          }
        });
      }
      rotation.value = 0;
      startRotation.value = 0;
    });

  // Compose gestures
  const composedGesture = Gesture.Race(
    tapGesture,
    Gesture.Simultaneous(panGesture, pinchGesture, rotationGesture)
  );

  // Create color matrix from filters
  const colorMatrix = createFilterMatrix(filters);

  // Calculate proper image rect with aspect ratio fit
  const imageRect = useMemo(() => {
    if (!image) {
      return rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    const imgWidth = image.width();
    const imgHeight = image.height();
    const imgAspect = imgWidth / imgHeight;
    const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;

    let width, height, x, y;

    if (imgAspect > canvasAspect) {
      // Image is wider - fit to canvas width
      width = CANVAS_WIDTH;
      height = width / imgAspect;
      x = 0;
      y = (CANVAS_HEIGHT - height) / 2;
    } else {
      // Image is taller - fit to canvas height
      height = CANVAS_HEIGHT;
      width = height * imgAspect;
      x = (CANVAS_WIDTH - width) / 2;
      y = 0;
    }

    return rect(x, y, width, height);
  }, [image]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Canvas
          ref={canvasRef}
          style={{
            width: DISPLAY_WIDTH,
            height: DISPLAY_HEIGHT,
          }}
        >
          {/* Background Image with Filters */}
          <Group>
            {image && (
              <Group>
                <Image
                  image={image}
                  rect={imageRect}
                  fit="cover"
                >
                  <ColorMatrix matrix={colorMatrix} />
                </Image>
              </Group>
            )}
          </Group>

          {/* Render All Elements */}
          {elements
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map(element => (
              <ElementRenderer key={element.id} element={element} />
            ))}

          {/* Current Drawing Path (while drawing) */}
          {isDrawing && currentDrawingPoints.length > 2 && (
            <Group>
              <Path
                path={pointsToPath(currentDrawingPoints)}
                color={brushColor}
                style="stroke"
                strokeWidth={brushSize}
                strokeCap="round"
                strokeJoin="round"
              />
            </Group>
          )}
        </Canvas>
      </GestureDetector>
    </View>
  );
});

SkiaCanvasEditor.displayName = 'SkiaCanvasEditor';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
 
