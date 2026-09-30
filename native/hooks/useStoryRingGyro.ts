import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  SharedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const MAX_TILT = 6.4;
const DEAD_ZONE = 0.018;
const LOW_PASS = 0.18;
const SAMPLE_MS = 24;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function applyDeadZone(value: number, deadZone: number) {
  if (Math.abs(value) < deadZone) {
    return 0;
  }
  return value;
}

function resolveSensorsModule() {
  try {
    return require('react-native-sensors');
  } catch {
    return null;
  }
}

export interface StoryRingGyroMotion {
  tiltX: SharedValue<number>;
  tiltY: SharedValue<number>;
}

export function useStoryRingGyro(enabled: boolean): StoryRingGyroMotion {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    const settleToZero = () => {
      cancelAnimation(tiltX);
      cancelAnimation(tiltY);
      tiltX.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
      tiltY.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
    };

    if (!enabled) {
      settleToZero();
      return;
    }

    const sensorsModule = resolveSensorsModule();
    const accelerometer = sensorsModule?.accelerometer;
    const gyroscope = sensorsModule?.gyroscope;
    const sensorTypes = sensorsModule?.SensorTypes;
    const setUpdateIntervalForType = sensorsModule?.setUpdateIntervalForType;

    if (typeof setUpdateIntervalForType !== 'function' || !sensorTypes) {
      settleToZero();
      return;
    }

    const sensorStream = accelerometer?.subscribe ? accelerometer : gyroscope?.subscribe ? gyroscope : null;
    const sensorType = accelerometer?.subscribe ? sensorTypes.accelerometer : gyroscope?.subscribe ? sensorTypes.gyroscope : null;

    if (!sensorStream?.subscribe || !sensorType) {
      settleToZero();
      return;
    }

    let lastFrameAt = 0;
    let filteredX = 0;
    let filteredY = 0;
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      setUpdateIntervalForType(sensorType, SAMPLE_MS);
      subscription = sensorStream.subscribe({
        next: ({ x, y }: { x: number; y: number }) => {
          const now = Date.now();
          if (now - lastFrameAt < SAMPLE_MS) {
            return;
          }
          lastFrameAt = now;

          filteredX = filteredX + LOW_PASS * (x - filteredX);
          filteredY = filteredY + LOW_PASS * (y - filteredY);

          const scaledX = sensorType === sensorTypes.accelerometer ? filteredX * 8.8 : filteredY * 4.6;
          const scaledY = sensorType === sensorTypes.accelerometer ? filteredY * 8.8 : filteredX * 4.6;

          const nextX = clamp(applyDeadZone(scaledX, DEAD_ZONE), -MAX_TILT, MAX_TILT);
          const nextY = clamp(applyDeadZone(scaledY, DEAD_ZONE), -MAX_TILT, MAX_TILT);

          tiltX.value = withTiming(nextX, { duration: 110, easing: Easing.out(Easing.quad) });
          tiltY.value = withTiming(nextY, { duration: 110, easing: Easing.out(Easing.quad) });
        },
        error: () => {
          settleToZero();
        },
      });
    } catch {
      settleToZero();
      subscription = null;
    }

    return () => {
      try {
        subscription?.unsubscribe?.();
      } catch {}
      settleToZero();
    };
  }, [enabled, tiltX, tiltY]);

  return { tiltX, tiltY };
}

