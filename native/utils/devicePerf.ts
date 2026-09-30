import * as Device from 'expo-device';
import { Camera } from 'expo-camera';
import { Platform } from 'react-native';
import { editorFlags } from '../config/editorFlags';

export type PerfProfile = {
  isEmulator: boolean;
  isBlueStacks: boolean;
  totalMemoryBytes?: number;
  isLowRam: boolean;
  enableGPUFilters: boolean;
};

const DEFINITE_VIRTUAL_DEVICE_REGEX = /bluestacks|nox|genymotion|vbox|sdk_gphone|generic_x86|google_sdk|simulator/;
const SOFT_VIRTUAL_DEVICE_REGEX = /\bemulator\b|\bandroid sdk\b|\bvirtual\b/;
const X86_ONLY_REGEX = /\bx86\b|\bx86_64\b/;

export async function isLikelyVirtualDevice(): Promise<{ isEmulator: boolean; isBlueStacks: boolean }> {
  let deviceName = '';
  try {
    deviceName = (await (Device as any).getDeviceNameAsync?.()) || '';
  } catch {}

  const fingerprint = [
    Device.modelName || '',
    deviceName || '',
    (Device as any).productName || '',
    (Device as any).brand || '',
    (Device as any).manufacturer || '',
    (Device as any).designName || '',
  ]
    .join(' ')
    .toLowerCase();

  const isBlueStacks = /bluestacks|nox|genymotion|vbox/.test(fingerprint);
  const hasDefiniteVirtualFingerprint = DEFINITE_VIRTUAL_DEVICE_REGEX.test(fingerprint);
  const hasSoftVirtualFingerprint = SOFT_VIRTUAL_DEVICE_REGEX.test(fingerprint);
  const isPhysicalDevice = Device.isDevice === true;
  const hasKnownVirtualFingerprint = hasDefiniteVirtualFingerprint || (!isPhysicalDevice && hasSoftVirtualFingerprint);
  const isLikelyX86Virtual = Platform.OS === 'android' && !isPhysicalDevice && X86_ONLY_REGEX.test(fingerprint);
  const isEmulator = !!(hasKnownVirtualFingerprint || isLikelyX86Virtual || isBlueStacks);

  return { isEmulator, isBlueStacks };
}

export async function canUseExpoCameraHardware(): Promise<boolean> {
  try {
    const cameraTypes = await (Camera as any).getAvailableCameraTypesAsync?.();
    if (Array.isArray(cameraTypes)) {
      return cameraTypes.length > 0;
    }
  } catch {}

  return true;
}

export async function getPerfProfile(): Promise<PerfProfile> {
  const { isEmulator, isBlueStacks } = await isLikelyVirtualDevice();

  let totalMemoryBytes: number | undefined = undefined;
  try { totalMemoryBytes = await (Device as any).getTotalMemoryAsync?.(); } catch {}
  if (!totalMemoryBytes) {
    try { totalMemoryBytes = (Device as any)?.totalMemory; } catch {}
  }
  const isLowRam = !!totalMemoryBytes && totalMemoryBytes < editorFlags.lowRamThresholdBytes;

  let enableGPUFilters = Platform.OS === 'android' && !isEmulator && !isBlueStacks && !isLowRam && editorFlags.enableGPUImageAndroid;

  if (editorFlags.disableGPUOnEmulator && isEmulator) enableGPUFilters = false;
  if (editorFlags.disableGPUOnLowRam && isLowRam) enableGPUFilters = false;

  return { isEmulator, isBlueStacks, totalMemoryBytes, isLowRam, enableGPUFilters };
}
