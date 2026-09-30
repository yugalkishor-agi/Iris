import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, runOnJS, withTiming } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const SNAP_POINTS_X = [width / 2, width / 3, (2 * width) / 3];
const SNAP_POINTS_Y = [height / 2, height / 3, (2 * height) / 3];
const SNAP_THRESHOLD = 0; // px (disable snapping for smoothness)

function snap(val: number, points: number[], threshold = SNAP_THRESHOLD) {
  let best = val;
  let bestDist = threshold + 1;
  for (const p of points) {
    const d = Math.abs(val - p);
    if (d < bestDist && d <= threshold) {
      best = p;
      bestDist = d;
    }
  }
  return best;
}

interface DraggableTextProps {
  id: string;
  text: string;
  initialX: number;
  initialY: number;
  color: string;
  fontSize: number;
  onUpdate: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  scale?: number;
  rotation?: number;
  onTransform?: (id: string, t: { scale: number; rotation: number }) => void;
  boxWidth?: number;
  boxHeight?: number;
  clampRect?: { left: number; top: number; right: number; bottom: number };
  snapToCenter?: boolean;
  snapToGrid?: boolean;
  snapThreshold?: number;
  onActiveChange?: (active: boolean) => void;
  simple?: boolean;
}

function DraggableTextComp({
  id,
  text,
  initialX,
  initialY,
  color,
  fontSize,
  onUpdate,
  onSelect,
  isSelected,
  scale = 1,
  rotation = 0,
  onTransform,
  boxWidth,
  boxHeight,
  clampRect,
  snapToCenter = false,
  snapToGrid = false,
  snapThreshold = 0,
  onActiveChange,
  simple = false,
}: DraggableTextProps) {
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const rScale = useSharedValue(scale);
  const rRotation = useSharedValue((rotation || 0) * Math.PI / 180);
  const [dragEnabled, setDragEnabled] = useState(true);
  const renderOpacity = useSharedValue(0.99);

  useEffect(() => {
    renderOpacity.value = withTiming(1, { duration: 1 });
  }, []);

  // Keep internal position in sync with props after parent updates
  useEffect(() => {
    translateX.value = initialX;
    translateY.value = initialY;
  }, [initialX, initialY]);
  const last = useRef({ x: initialX, y: initialY });
  useEffect(() => { last.current = { x: initialX, y: initialY }; }, [initialX, initialY]);

  // Build RNGH gestures only on native to avoid web findDOMNode warnings
  const RNGH: any = Platform.OS === 'web' ? null : require('react-native-gesture-handler');
  const Gesture = RNGH ? RNGH.Gesture : null;
  const GestureDetectorComp: any = RNGH ? RNGH.GestureDetector : null;

  const startScaleRef = useRef(rScale.value);
  const startRotationRef = useRef(rRotation.value);
  let composed: any = null;
  let handlePan: any = null;
  if (Gesture) {
    const tap = Gesture.Tap().maxDuration(220).onEnd(() => {
      runOnJS(onSelect)(id);
    });

    const pan = Gesture.Pan().enabled(dragEnabled).minDistance(2)
      .onBegin(() => {
        runOnJS(onSelect)(id);
        last.current = { x: translateX.value, y: translateY.value };
        if (onActiveChange) runOnJS(onActiveChange)(true);
      })
      .onUpdate((e: any) => {
        let nx = last.current.x + e.translationX;
        let ny = last.current.y + e.translationY;
        if (clampRect) {
          const minX = clampRect.left;
          const maxX = clampRect.right;
          const minY = clampRect.top;
          const maxY = clampRect.bottom;
          nx = Math.max(minX, Math.min(maxX, nx));
          ny = Math.max(minY, Math.min(maxY, ny));
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
          nx = snap(nx, pointsX, snapThreshold);
          ny = snap(ny, pointsY, snapThreshold);
        }
        translateX.value = nx;
        translateY.value = ny;
      })
      .onEnd((_e: any) => {
        const x = translateX.value;
        const y = translateY.value;
        runOnJS(onUpdate)(id, x, y);
        if (onActiveChange) runOnJS(onActiveChange)(false);
      });

    if (simple) {
      composed = Gesture.Simultaneous(tap, pan);
    } else {
      const pinch = Gesture.Pinch()
        .onBegin(() => { startScaleRef.current = rScale.value; if (onActiveChange) runOnJS(onActiveChange)(true); })
        .onUpdate((e: any) => {
          rScale.value = startScaleRef.current * e.scale;
        })
        .onEnd(() => {
          if (onTransform) {
            runOnJS(onTransform)(id, { scale: rScale.value, rotation: (rRotation.value * 180) / Math.PI });
          }
          if (onActiveChange) runOnJS(onActiveChange)(false);
        });

      const rotationGesture = Gesture.Rotation()
        .onBegin(() => { startRotationRef.current = rRotation.value; if (onActiveChange) runOnJS(onActiveChange)(true); })
        .onUpdate((e: any) => {
          rRotation.value = startRotationRef.current + e.rotation;
        })
        .onEnd(() => {
          if (onTransform) {
            runOnJS(onTransform)(id, { scale: rScale.value, rotation: (rRotation.value * 180) / Math.PI });
          }
          if (onActiveChange) runOnJS(onActiveChange)(false);
        });

      handlePan = Gesture.Pan()
        .onBegin(() => {
          runOnJS(setDragEnabled)(false);
          startScaleRef.current = rScale.value;
          startRotationRef.current = rRotation.value;
          if (onActiveChange) runOnJS(onActiveChange)(true);
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
          if (onActiveChange) runOnJS(onActiveChange)(false);
        });

      composed = Gesture.Simultaneous(tap, pinch, rotationGesture, pan);
    }
  }

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: renderOpacity.value,
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
    onSelect(id);
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
    onUpdate(id, x, y);
  };

  if (Platform.OS === 'web') {
    return (
      <Animated.View
        style={[styles.container, (boxWidth || boxHeight) ? { width: boxWidth, height: boxHeight } : null, animatedStyle as any]}
        onStartShouldSetResponder={() => true}
        onResponderStart={onResponderStartWeb}
        onResponderMove={onResponderMoveWeb}
        onResponderRelease={onResponderReleaseWeb}
      >
        <View style={[styles.textContainer, isSelected && styles.selected]}>
          <Text
            style={[
              styles.text,
              {
                color,
                fontSize,
              },
            ]}
          >
            {text}
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <GestureDetectorComp gesture={composed}>
      <Animated.View
        style={[styles.container, (boxWidth || boxHeight) ? { width: boxWidth, height: boxHeight } : null, animatedStyle as any]}
        removeClippedSubviews={false}
        collapsable={false}
        shouldRasterizeIOS
      >
        <View style={[styles.textContainer, isSelected && styles.selected]}>
          <Text
            style={[
              styles.text,
              {
                color,
                fontSize,
              },
            ]}
          >
            {text}
          </Text>
        </View>
        {isSelected && GestureDetectorComp && !simple && (
          <GestureDetectorComp gesture={handlePan}>
            <View style={styles.transformHandle} />
          </GestureDetectorComp>
        )}
      </Animated.View>
    </GestureDetectorComp>
  );
}

export const DraggableText = React.memo(DraggableTextComp);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
    overflow: 'visible',
  },
  textContainer: {
    padding: 8,
    borderRadius: 4,
    overflow: 'visible',
  },
  selected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
