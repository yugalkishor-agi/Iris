import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';

export type TranscodeQuality = 'low' | 'medium' | 'high';

export interface TranscodeOptions {
  quality?: TranscodeQuality;
  maxHeight?: number;
  maxFileSizeMB?: number;
  onProgress?: (pct: number) => void;
}

const safeRequire = (name: string): any => {
  try { return (eval('require') as any)(name); } catch { return undefined; }
};

class TranscoderService {
  supportsConcat(): boolean {
    try {
      const ve: any = safeRequire('react-native-video-editor');
      const api: any = ve?.default ?? ve;
      return typeof api?.concat === 'function';
    } catch {
      return false;
    }
  }

  async getVideoDuration(uri: string): Promise<number> {
    try {
      const ve: any = safeRequire('react-native-video-editor');
      if (ve) {
        const api: any = ve?.default ?? ve;
        if (typeof api?.getDuration === 'function') {
          const d = await api.getDuration({ input: uri });
          if (typeof d === 'number' && d > 0) return d;
        }
      }
    } catch {}
    // Best-effort: extract a thumbnail to ensure file exists then return a default
    try { await VideoThumbnails.getThumbnailAsync(uri, { time: 1000 }); } catch {}
    return 30; // fallback default window
  }

  async compressVideo(input: string, opts: TranscodeOptions = {}): Promise<string> {
    const { quality = 'medium', onProgress } = opts;
    let output = input;
    try {
      const Compressor: any = await import('react-native-compressor');
      if (Compressor?.Video?.compress) {
        let last = -1;
        output = await Compressor.Video.compress(
          input,
          { compressionMethod: 'auto', ...(typeof opts.maxHeight === 'number' && opts.maxHeight > 0 ? { maxHeight: Math.floor(opts.maxHeight) } : {}) },
          (p: number) => {
            const pct = Math.max(0, Math.min(100, Math.round(p * 100)));
            if (pct !== last) { last = pct; onProgress?.(pct); }
          }
        );
      }
    } catch {}

    try {
      if (typeof opts.maxHeight === 'number' && opts.maxHeight > 0) {
        const ve: any = safeRequire('react-native-video-editor');
        const api: any = ve?.default ?? ve;
        const out = `${FileSystem.documentDirectory}scale_${Date.now()}.mp4`;
        if (api && typeof api?.transcode === 'function') {
          const res = await api.transcode({ source: output, height: Math.floor(opts.maxHeight), output: out });
          output = res?.output || out;
        } else if (api && typeof api?.resize === 'function') {
          const res = await api.resize({ source: output, height: Math.floor(opts.maxHeight), output: out });
          output = res?.output || out;
        }
      }
    } catch {}
    onProgress?.(100);
    return output;
  }

  async trim(input: string, start: number, end: number, opts: TranscodeOptions = {}): Promise<string> {
    const { onProgress } = opts; onProgress?.(10);
    const out = `${FileSystem.documentDirectory}trim_${Date.now()}.mp4`;
    try {
      const ve: any = safeRequire('react-native-video-editor');
      const api: any = ve?.default ?? ve;
      if (api && typeof api?.trim === 'function') {
        const res = await api.trim({ source: input, startTime: Math.max(0, start), endTime: Math.max(start + 1, end), output: out });
        onProgress?.(100); return res?.output || out;
      }
    } catch {}
    await FileSystem.copyAsync({ from: input, to: out });
    onProgress?.(100);
    return out;
  }

  async concat(inputs: string[], opts: TranscodeOptions = {}): Promise<string> {
    const { onProgress } = opts; onProgress?.(10);
    const out = `${FileSystem.documentDirectory}concat_${Date.now()}.mp4`;
    try {
      const ve: any = safeRequire('react-native-video-editor');
      const api: any = ve?.default ?? ve;
      if (api && typeof api?.concat === 'function') {
        const res = await api.concat({ sources: inputs, output: out });
        onProgress?.(100); return res?.output || out;
      }
    } catch (error) {
      throw error;
    }
    throw new Error('Native video concat backend is unavailable on this build.');
  }

  async mute(input: string, opts: TranscodeOptions = {}): Promise<string> {
    const { onProgress } = opts; onProgress?.(10);
    const out = `${FileSystem.documentDirectory}mute_${Date.now()}.mp4`;
    try {
      const ve: any = safeRequire('react-native-video-editor');
      const api: any = ve?.default ?? ve;
      if (api && typeof api?.mute === 'function') {
        const res = await api.mute({ input, output: out });
        onProgress?.(100); return res?.output || out;
      }
    } catch {}
    await FileSystem.copyAsync({ from: input, to: out });
    onProgress?.(100);
    return out;
  }

  async extractAudio(input: string, opts: TranscodeOptions = {}): Promise<string> {
    const { onProgress } = opts; onProgress?.(10);
    const out = `${FileSystem.documentDirectory}audio_${Date.now()}.m4a`;
    try {
      const ve: any = safeRequire('react-native-video-editor');
      const api: any = ve?.default ?? ve;
      if (api && typeof api?.extractAudio === 'function') {
        const res = await api.extractAudio({ input, output: out });
        onProgress?.(100); return res?.output || out;
      }
    } catch {}
    // Fallback: copy (not real extraction)
    await FileSystem.copyAsync({ from: input, to: out });
    onProgress?.(100);
    return out;
  }

  async applyFilters(
    input: string,
    filters: { brightness?: number; contrast?: number; saturation?: number },
    opts: TranscodeOptions = {}
  ): Promise<string> {
    const { onProgress } = opts; onProgress?.(10);
    const out = `${FileSystem.documentDirectory}filtered_${Date.now()}.mp4`;
    try {
      const ve: any = safeRequire('react-native-video-editor');
      const api: any = ve?.default ?? ve;
      if (api && typeof api?.filter === 'function') {
        const res = await api.filter({ input, ...filters, output: out });
        onProgress?.(100); return res?.output || out;
      }
    } catch {}
    // Fallback: no-op copy
    try { await FileSystem.copyAsync({ from: input, to: out }); } catch { return input; }
    onProgress?.(100);
    return out;
  }

  async mergeAudio(
    videoUri: string,
    audioUri: string,
    opts: TranscodeOptions & { volume?: number; audioStart?: number; audioEnd?: number } = {}
  ): Promise<string> {
    const { onProgress } = opts; onProgress?.(10);
    const out = `${FileSystem.documentDirectory}merged_${Date.now()}.mp4`;
    try {
      const ve: any = safeRequire('react-native-video-editor');
      const api: any = ve?.default ?? ve;
      if (api && typeof api?.merge === 'function') {
        const res = await api.merge({ video: videoUri, audio: audioUri, volume: opts.volume ?? 1, output: out });
        onProgress?.(100); return res?.output || out;
      }
      if (api && typeof api?.mergeVideoAudio === 'function') {
        const res = await api.mergeVideoAudio({ video: videoUri, audio: audioUri, volume: opts.volume ?? 1, output: out });
        onProgress?.(100); return res?.output || out;
      }
      if (api && typeof api?.mixAudio === 'function') {
        const res = await api.mixAudio({ video: videoUri, audio: audioUri, volume: opts.volume ?? 1, output: out });
        onProgress?.(100); return res?.output || out;
      }
    } catch {}
    // Fallback: copy
    try { await FileSystem.copyAsync({ from: videoUri, to: out }); } catch { return videoUri; }
    onProgress?.(100);
    return out;
  }
}

export const transcoderService = new TranscoderService();

