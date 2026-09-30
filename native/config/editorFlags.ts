export const editorFlags = {
  // Phase A: enable Android Transcoder and uCrop if present
  useAndroidTranscoder: true,
  useAndroidUCrop: true,

  // Phase B: optional GPU filters (kept off by default)
  enableGPUImageAndroid: false,

  // Performance caps
  previewMaxHeightPx: 720, // stronger portrait cap for emulator/low-RAM
  exportMaxHeightPx: 1920,  // up to 1080p height for 9:16

  // Stability toggles
  disableGPUOnEmulator: true,
  disableGPUOnLowRam: true,

  // Low-RAM threshold (bytes)
  lowRamThresholdBytes: 2 * 1024 * 1024 * 1024, // 2GB

  // Global kill switch to stabilize: allow only text tool
  disableNonTextFeatures: false,
  // Skip optional heavy video steps (filters/audio merge) even if user tries
  disableAdvancedVideoPipeline: true,
};
