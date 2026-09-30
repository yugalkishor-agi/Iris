declare module 'expo-video-thumbnails' {
  export function getThumbnailAsync(
    uri: string,
    options?: { time?: number; quality?: number }
  ): Promise<{ uri: string }>;
}

declare module 'react-native-video-editor' {
  const api: {
    trim?: (args: { source: string; startTime: number; endTime: number; output?: string }) => Promise<{ output?: string } | void>;
    concat?: (args: { sources: string[]; output?: string }) => Promise<{ output?: string } | void>;
    mute?: (args: { input: string; output?: string }) => Promise<{ output?: string } | void>;
    extractAudio?: (args: { input: string; output?: string }) => Promise<{ output?: string } | void>;
    merge?: (args: { video: string; audio: string; volume?: number; output?: string }) => Promise<{ output?: string } | void>;
    mergeVideoAudio?: (args: { video: string; audio: string; volume?: number; output?: string }) => Promise<{ output?: string } | void>;
    mixAudio?: (args: { video: string; audio: string; volume?: number; output?: string }) => Promise<{ output?: string } | void>;
    transcode?: (args: { source: string; height?: number; width?: number; bitrate?: number; fps?: number; output?: string }) => Promise<{ output?: string } | void>;
    resize?: (args: { source: string; height?: number; width?: number; output?: string }) => Promise<{ output?: string } | void>;
    filter?: (args: { input: string; brightness?: number; contrast?: number; saturation?: number; output?: string }) => Promise<{ output?: string } | void>;
    getDuration?: (args: { input: string }) => Promise<number>;
  };
  export default api;
}

declare module 'react-native-ucrop' {
  export type UCropResult = { uri?: string; path?: string };
  export function openCropper(params: any): Promise<UCropResult>;
  export function startCrop(params: any): Promise<UCropResult>;
  const _default: { openCropper?: typeof openCropper; startCrop?: typeof startCrop };
  export default _default;
}

declare module 'react-native-compressor' {
  export const Video: {
    compress: (
      uri: string,
      options?: any,
      onProgress?: (progress: number) => void
    ) => Promise<string>;
  };
}

declare module 'react-native-image-crop-picker' {
  export type CropResult = {
    path?: string;
    sourceURL?: string;
    uri?: string;
    width?: number;
    height?: number;
  };
  export function openCropper(options: any): Promise<CropResult>;
  const _default: { openCropper?: typeof openCropper };
  export default _default;
}

declare module 'expo-haptics' {
  export enum ImpactFeedbackStyle {
    Light = 0,
    Medium = 1,
    Heavy = 2,
  }
  export function impactAsync(style?: ImpactFeedbackStyle): Promise<void>;
  export function selectionAsync(): Promise<void>;
}

declare module 'expo-document-picker' {
  export type DocumentPickerAsset = {
    uri: string;
    name?: string;
    size?: number;
    mimeType?: string;
  };
  export type DocumentPickerResult =
    | { type: 'cancel' }
    | { type: 'success'; assets: DocumentPickerAsset[] };
  export function getDocumentAsync(options?: { type?: string | string[]; multiple?: boolean; copyToCacheDirectory?: boolean }): Promise<DocumentPickerResult>;
}

// Image modules for TS to allow static imports
declare module '*.png' {
  const value: any;
  export default value;
}
declare module '*.jpg' {
  const value: any;
  export default value;
}
declare module '*.jpeg' {
  const value: any;
  export default value;
}
declare module '*.gif' {
  const value: any;
  export default value;
}
declare module '*.webp' {
  const value: any;
  export default value;
}
