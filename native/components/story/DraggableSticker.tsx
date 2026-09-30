import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Video, ResizeMode } from 'expo-av';
import { StoryWidget } from './widgets/StoryWidget';
import { WidgetStyleOptions } from './widgets/styles';
import { Image } from 'expo-image';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SNAP_POINTS_X = [SCREEN_W / 2, SCREEN_W / 3, (2 * SCREEN_W) / 3];
const SNAP_POINTS_Y = [SCREEN_H / 2, SCREEN_H / 3, (2 * SCREEN_H) / 3];
const SNAP_THRESHOLD = 0;
function snap(val: number, points: number[], threshold = SNAP_THRESHOLD) {
  let best = val;
  let bestDist = threshold + 1;
  for (const p of points) {
    const d = Math.abs(val - p);
    if (d < bestDist && d <= threshold) { best = p; bestDist = d; }
  }
  return best;
}


interface DraggableStickerProps {
  id: string;
  type: 'emoji' | 'label' | 'gif' | 'poll' | 'slider' | 'question' | 'quiz' | 'reshare';
  content: any;
  initialX: number;
  initialY: number;
  onUpdate: (id: string, x: number, y: number) => void;
  onSelect?: (id: string) => void;
  onLongPress?: (id: string) => void;
  isSelected?: boolean;
  scale?: number;
  rotation?: number; // in radians
  onTransform?: (id: string, t: { scale: number; rotation: number }) => void;
  onLayout?: (e: any) => void;
  boxWidth?: number;
  boxHeight?: number;
  clampRect?: { left: number; top: number; right: number; bottom: number };
  snapToCenter?: boolean;
  snapToGrid?: boolean;
  snapThreshold?: number;
  gifPreviewOnly?: boolean;
  style?: WidgetStyleOptions; // NEW: Style customization
}

function DraggableStickerComp({ id, type, content, initialX, initialY, onUpdate, onSelect, onLongPress, isSelected, scale = 1, rotation = 0, onTransform, onLayout, boxWidth, boxHeight, clampRect, snapToCenter = false, snapToGrid = false, snapThreshold = 0, gifPreviewOnly = false, style }: DraggableStickerProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const last = useRef({ x: initialX, y: initialY });
  const baseScale = useRef(scale).current;
  const baseRotation = useRef(rotation).current;
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const rScale = useSharedValue(scale);
  const rRotation = useSharedValue((rotation || 0) * Math.PI / 180);
  const [dragEnabled, setDragEnabled] = useState(true);
  const [isTransforming, setIsTransforming] = useState(false);

  // Compute widget style from style prop or content.style
  // const widgetStyle = getEditorWidgetStyle(style || content?.style); // Deprecated in favor of StoryWidget self-styling

  useEffect(() => {
    translateX.value = initialX;
    translateY.value = initialY;
    setPosition({ x: initialX, y: initialY });
    last.current = { x: initialX, y: initialY };
  }, [initialX, initialY]);

  const lastRef = useRef({ x: initialX, y: initialY });
  useEffect(() => { lastRef.current = { x: initialX, y: initialY }; }, [initialX, initialY]);

  // Build RNGH gestures only on native to avoid web findDOMNode warnings
  const RNGH: any = Platform.OS === 'web' ? null : require('react-native-gesture-handler');
  const Gesture = RNGH ? RNGH.Gesture : null;
  const GestureDetectorComp: any = RNGH ? RNGH.GestureDetector : null;

  const startScaleRef = useRef(rScale.value);
  const startRotationRef = useRef(rRotation.value);
  let composed: any = null;
  let innerBlocker: any = null;
  let handlePan: any = null;
  if (Gesture) {
    innerBlocker = (type === 'poll' || type === 'slider' || type === 'question')
      ? Gesture.Pan().minDistance(1).shouldCancelWhenOutside(false)
      : null;

    const pan = Gesture.Pan().enabled(dragEnabled).minDistance(2)
      .onBegin(() => {
        if (onSelect) {
          runOnJS(onSelect)(id);
        }
        lastRef.current = { x: translateX.value, y: translateY.value };
        runOnJS(setIsTransforming)(true);
      })
      .onUpdate((e: any) => {
        let x = lastRef.current.x + e.translationX;
        let y = lastRef.current.y + e.translationY;
        if (clampRect) {
          const minX = clampRect.left;
          const maxX = clampRect.right;
          const minY = clampRect.top;
          const maxY = clampRect.bottom;
          x = Math.max(minX, Math.min(maxX, x));
          y = Math.max(minY, Math.min(maxY, y));
        }
        const pointsX: number[] = [];
        const pointsY: number[] = [];
        if (clampRect && (snapToCenter || snapToGrid) && snapThreshold > 0) {
          const rangeX = (clampRect.right - clampRect.left);
          const rangeY = (clampRect.bottom - clampRect.top);
          if (snapToCenter) {
            pointsX.push(clampRect.left + rangeX / 2);
            pointsY.push(clampRect.top + rangeY / 2);
          }
          if (snapToGrid) {
            pointsX.push(clampRect.left + rangeX / 3, clampRect.left + 2 * rangeX / 3);
            pointsY.push(clampRect.top + rangeY / 3, clampRect.top + 2 * rangeY / 3);
          }
        }
        if (pointsX.length && pointsY.length) {
          x = snap(x, pointsX, snapThreshold);
          y = snap(y, pointsY, snapThreshold);
        }
        translateX.value = x;
        translateY.value = y;
      })
      .onEnd((_e: any) => {
        const x = translateX.value;
        const y = translateY.value;
        lastRef.current = { x, y };
        runOnJS(onUpdate)(id, x, y);
        runOnJS(setIsTransforming)(false);
      });

    const pinch = Gesture.Pinch().enabled(dragEnabled)
      .onBegin(() => { startScaleRef.current = rScale.value; runOnJS(setIsTransforming)(true); })
      .onUpdate((e: any) => {
        rScale.value = startScaleRef.current * e.scale;
      })
      .onEnd(() => {
        // Persist scale
        rScale.value = withTiming(rScale.value, { duration: 100 });
        if (onTransform) {
          runOnJS(onTransform)(id, { scale: rScale.value, rotation: (rRotation.value * 180) / Math.PI });
        }
        runOnJS(setIsTransforming)(false);
      });

    const rotationGesture = Gesture.Rotation().enabled(dragEnabled)
      .onBegin(() => { startRotationRef.current = rRotation.value; runOnJS(setIsTransforming)(true); })
      .onUpdate((e: any) => {
        rRotation.value = startRotationRef.current + e.rotation;
      })
      .onEnd(() => {
        if (onTransform) {
          runOnJS(onTransform)(id, { scale: rScale.value, rotation: (rRotation.value * 180) / Math.PI });
        }
        runOnJS(setIsTransforming)(false);
      });

    handlePan = Gesture.Pan()
      .onBegin(() => {
        runOnJS(setDragEnabled)(false);
        startScaleRef.current = rScale.value;
        startRotationRef.current = rRotation.value;
        runOnJS(setIsTransforming)(true);
      })
      .onUpdate((e: any) => {
        const ns = Math.max(0.2, Math.min(4, startScaleRef.current * (1 + (e.translationY || 0) / 240)));
        rScale.value = ns;
        rRotation.value = startRotationRef.current + (e.translationX || 0) * 0.01;
      })
      .onEnd(() => {
        runOnJS(setDragEnabled)(true);
        if (onTransform) {
          runOnJS(onTransform)(id, { scale: rScale.value, rotation: (rRotation.value * 180) / Math.PI });
        }
        runOnJS(setIsTransforming)(false);
      });

    composed = Gesture.Simultaneous(pinch, rotationGesture, pan, handlePan);
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateZ: `${rRotation.value}rad` },
      { scale: rScale.value },
    ] as any,
  }));

  // Web fallback: use responder handlers to avoid findDOMNode warnings
  const startRef = useRef<{ x0: number; y0: number; ox: number; oy: number }>({ x0: 0, y0: 0, ox: initialX, oy: initialY });
  const onResponderStartWeb = (e: any) => {
    const lx = e?.nativeEvent?.pageX ?? e?.nativeEvent?.locationX ?? 0;
    const ly = e?.nativeEvent?.pageY ?? e?.nativeEvent?.locationY ?? 0;
    startRef.current = { x0: lx, y0: ly, ox: translateX.value, oy: translateY.value };
    onSelect && onSelect(id);
  };
  const onResponderMoveWeb = (e: any) => {
    const lx = e?.nativeEvent?.pageX ?? e?.nativeEvent?.locationX ?? 0;
    const ly = e?.nativeEvent?.pageY ?? e?.nativeEvent?.locationY ?? 0;
    const dx = lx - startRef.current.x0;
    const dy = ly - startRef.current.y0;
    translateX.value = startRef.current.ox + dx;
    translateY.value = startRef.current.oy + dy;
  };
  const onResponderReleaseWeb = (e: any) => {
    const x = translateX.value;
    const y = translateY.value;
    lastRef.current = { x, y };
    onUpdate(id, x, y);
  };

  if (Platform.OS === 'web') {
    return (
      <Animated.View
        style={[styles.container, (boxWidth || boxHeight) ? { width: boxWidth, height: boxHeight } : null, animatedStyle as any]}
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onResponderStart={onResponderStartWeb}
        onResponderMove={onResponderMoveWeb}
        onResponderRelease={onResponderReleaseWeb}
      >
        <Pressable onPress={() => onSelect && onSelect(id)} onLongPress={() => onLongPress && onLongPress(id)}>
          {type === 'emoji' ? (
            <Text style={styles.emoji}>{content}</Text>
          ) : type === 'gif' ? (
            gifPreviewOnly ? (
              <Image
                source={{ uri: content?.previewUrl || content?.url || content }}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
            ) : (
              <Video
                source={{ uri: content?.mp4Url || content?.url || content }}
                style={{ width: '100%', height: '100%' }}
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                shouldPlay={!isTransforming}
                isMuted
                useNativeControls={false}
                pointerEvents="none"
                progressUpdateIntervalMillis={1200}
              />
            )
          ) : (
            <StoryWidget
              type={type}
              content={content}
              style={style}
              isInteractive={false}
            />
          )}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <GestureDetectorComp gesture={composed}>
      <Animated.View
        style={[styles.container, (boxWidth || boxHeight) ? { width: boxWidth, height: boxHeight } : null, animatedStyle as any]}
        renderToHardwareTextureAndroid
        collapsable={false}
        onLayout={onLayout}
      >
        <Pressable onPress={() => onSelect && onSelect(id)} onLongPress={() => onLongPress && onLongPress(id)}>
          {type === 'emoji' ? (
            <Text style={styles.emoji}>{content}</Text>
          ) : type === 'gif' ? (
            gifPreviewOnly ? (
              <Image
                source={{ uri: (Platform.OS === 'android' ? (content?.previewWebpUrl || content?.previewUrl) : content?.previewUrl) || content?.url || content }}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
            ) : (
              <Video
                source={{ uri: content?.mp4Url || content?.url || content }}
                style={{ width: '100%', height: '100%' }}
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                shouldPlay={!isTransforming}
                isMuted
                useNativeControls={false}
                pointerEvents="none"
                progressUpdateIntervalMillis={1200}
              />
            )
          ) : (
            <StoryWidget
              type={type}
              content={content}
              style={style}
              isInteractive={false}
            />
          )}
        </Pressable>
        {isSelected && GestureDetectorComp && (
          <GestureDetectorComp gesture={handlePan}>
            <View style={styles.transformHandle} />
          </GestureDetectorComp>
        )}
      </Animated.View>
    </GestureDetectorComp>
  );
}

export const DraggableSticker = React.memo(DraggableStickerComp);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  emoji: {
    fontSize: 60,
  },
  labelContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  labelSelected: {
    borderColor: '#3B82F6',
  },
  labelText: {
    fontWeight: '600',
    fontSize: 24,
  },
  transformHandle: {
    position: 'absolute',
    right: -12,
    bottom: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
});
