import { supabase, getMediaUrl, STORAGE_BUCKETS } from '../config/supabase';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';

function getInputContentType(input: any, fallback = 'image/jpeg'): string {
  const rawType = String(input?.mimeType || input?.type || fallback || '').toLowerCase();
  if (rawType.includes('/')) {
    return rawType;
  }

  const uri = String(getInputUri(input) || '').toLowerCase();
  if (rawType === 'image') {
    if (uri.endsWith('.png')) return 'image/png';
    if (uri.endsWith('.webp')) return 'image/webp';
    if (uri.endsWith('.gif')) return 'image/gif';
    return 'image/jpeg';
  }
  if (rawType === 'video') {
    if (uri.endsWith('.mov')) return 'video/quicktime';
    return 'video/mp4';
  }
  if (rawType === 'audio') {
    if (uri.endsWith('.wav')) return 'audio/wav';
    if (uri.endsWith('.m4a')) return 'audio/m4a';
    return 'audio/mpeg';
  }

  return fallback;
}

function getInputUri(input: any): string | null {
  if (input && typeof input === 'object' && typeof input.uri === 'string') {
    return input.uri;
  }
  if (typeof input === 'string' && (input.startsWith('file:') || input.startsWith('content:') || input.startsWith('http://') || input.startsWith('https://'))) {
    return input;
  }
  return null;
}

function extFromMime(contentType: string, fallback = 'jpg'): string {
  const normalized = String(contentType || '').toLowerCase();
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('webp')) return 'webp';
  if (normalized.includes('gif')) return 'gif';
  if (normalized.includes('mp4')) return 'mp4';
  if (normalized.includes('mov')) return 'mov';
  if (normalized.includes('heic')) return 'heic';
  if (normalized.includes('audio') || normalized.includes('m4a')) return 'm4a';
  if (normalized.includes('mpeg') || normalized.includes('mp3')) return 'mp3';
  if (normalized.includes('wav')) return 'wav';
  if (normalized.includes('aac')) return 'aac';
  if (normalized.includes('ogg')) return 'ogg';
  return fallback;
}

function atobPolyfill(b64: string): string {
  try {
    const BufferAny = (global as any).Buffer || undefined;
    if (BufferAny) return BufferAny.from(b64, 'base64').toString('binary');
  } catch {}

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < b64.length; i++) {
    const val = chars.indexOf(b64[i]);
    if (val < 0) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >>> bits) & 0xff);
    }
  }
  return output;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const atobFn: any = (global as any).atob || atobPolyfill;
  const binaryString = atobFn(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function toBlob(input: any, fallbackContentType = 'image/jpeg'): Promise<{ blob: Blob; contentType: string }> {
  if (input && typeof input === 'object' && typeof (input as any).arrayBuffer === 'function') {
    const blob = input as Blob;
    const type = (blob as any).type || fallbackContentType;
    return { blob, contentType: type };
  }

  const uri = getInputUri(input);
  if (uri) {
    const type = getInputContentType(input, fallbackContentType);
    const res = await fetch(uri);
    const blob = await res.blob();
    return { blob, contentType: getInputContentType(input, (blob as any).type || type) };
  }

  const empty = new Blob([] as any, { type: 'application/octet-stream' } as any);
  return { blob: empty, contentType: 'application/octet-stream' };
}

async function uploadBlob(
  bucket: string,
  path: string,
  blob: Blob,
  contentType: string,
  upsert = false
): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    contentType,
    cacheControl: '3600',
    upsert,
  });

  if (error) throw error;
  return getMediaUrl(`${bucket}/${path}`, false);
}

async function ensureUploadableUri(uri: string, contentType: string): Promise<{ uploadUri: string; cleanupUri?: string }> {
  if (uri.startsWith('file:')) {
    return { uploadUri: uri };
  }

  if (!uri.startsWith('content:')) {
    return { uploadUri: uri };
  }

  const ext = extFromMime(contentType, 'bin');
  const cleanupUri = `${FileSystem.cacheDirectory || ''}iris-upload-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  await FileSystem.copyAsync({ from: uri, to: cleanupUri });
  return { uploadUri: cleanupUri, cleanupUri };
}

async function uploadLocalUri(
  bucket: string,
  path: string,
  uri: string,
  contentType: string,
  upsert = false
): Promise<string> {
  const { uploadUri, cleanupUri } = await ensureUploadableUri(uri, contentType);

  try {
    const filesApi: any = supabase.storage.from(bucket);
    const canSign = typeof filesApi?.createSignedUploadUrl === 'function';

    if (canSign && (uploadUri.startsWith('file:') || uploadUri.startsWith('/'))) {
      const { data, error } = await filesApi.createSignedUploadUrl(path);
      if (error || !data?.signedUrl) throw error || new Error('Failed to create signed upload URL');

      const publicBase = getMediaUrl('', false).split('/storage')[0];
      const signedUrl = data.signedUrl.startsWith('http') ? data.signedUrl : `${publicBase}${data.signedUrl}`;
      const result = await FileSystem.uploadAsync(signedUrl, uploadUri, {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          'x-upsert': upsert ? 'true' : 'false',
          'Cache-Control': '3600',
          'Content-Type': contentType,
        },
      });

      if (result.status !== 200 && result.status !== 201) {
        throw new Error(`Signed upload failed with status ${result.status}`);
      }
    } else {
      const base64 = await FileSystem.readAsStringAsync(uploadUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = base64ToUint8Array(base64);
      const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer as any, {
        contentType,
        cacheControl: '3600',
        upsert,
      });
      if (error) throw error;
    }

    return getMediaUrl(`${bucket}/${path}`, false);
  } finally {
    if (cleanupUri) {
      try {
        await FileSystem.deleteAsync(cleanupUri, { idempotent: true });
      } catch {}
    }
  }
}


async function createLowQualityPreviewUri(input: any): Promise<string | null> {
  const uri = getInputUri(input);
  const contentType = getInputContentType(input, 'image/jpeg');

  if (!uri || !contentType.startsWith('image/')) {
    return null;
  }

  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: 240 } },
      ],
      {
        compress: 0.18,
        format: (ImageManipulator as any).SaveFormat?.JPEG || 'jpeg',
      }
    );

    return result.uri || null;
  } catch (error) {
    console.warn('createLowQualityPreviewUri failed:', error);
    return null;
  }
}
async function createCompressedImageUri(
  input: any,
  options?: { maxWidth?: number; compress?: number }
): Promise<string | null> {
  const uri = getInputUri(input);
  const contentType = getInputContentType(input, 'image/jpeg');

  if (!uri || !contentType.startsWith('image/')) {
    return null;
  }

  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: Math.max(720, Math.round(options?.maxWidth || 1600)) } }],
      {
        compress: Math.max(0.35, Math.min(0.9, options?.compress ?? 0.8)),
        format: (ImageManipulator as any).SaveFormat?.JPEG || 'jpeg',
      }
    );

    return result.uri || null;
  } catch (error) {
    console.warn('createCompressedImageUri failed:', error);
    return null;
  }
}

async function prepareCompressedImageInput(
  input: any,
  options?: { maxWidth?: number; compress?: number }
): Promise<{ preparedInput: any; contentType: string; cleanupUri?: string }> {
  const contentType = getInputContentType(input, 'image/jpeg');
  if (!contentType.startsWith('image/')) {
    return { preparedInput: input, contentType };
  }

  const compressedUri = await createCompressedImageUri(input, options);
  if (!compressedUri) {
    return { preparedInput: input, contentType };
  }

  return {
    preparedInput: { uri: compressedUri, type: 'image/jpeg', mimeType: 'image/jpeg' },
    contentType: 'image/jpeg',
    cleanupUri: compressedUri,
  };
}

async function createVideoThumbnailUri(input: any): Promise<string | null> {
  const uri = getInputUri(input);
  const contentType = getInputContentType(input, 'video/mp4');

  if (!uri || !contentType.startsWith('video/')) {
    return null;
  }

  let cleanupUploadUri: string | undefined;
  try {
    const prepared = await ensureUploadableUri(uri, contentType);
    cleanupUploadUri = prepared.cleanupUri;

    const uploadInfo = await FileSystem.getInfoAsync(prepared.uploadUri);
    if ((uploadInfo as any)?.exists && typeof (uploadInfo as any)?.size === 'number') {
      const maxThumbInputBytes = 120 * 1024 * 1024;
      if ((uploadInfo as any).size > maxThumbInputBytes) {
        return null;
      }
    }

    const result = await VideoThumbnails.getThumbnailAsync(prepared.uploadUri, {
      time: 900,
      quality: 0.6,
    });
    return result?.uri || null;
  } catch (error) {
    console.warn('createVideoThumbnailUri failed:', error);
    return null;
  } finally {
    await cleanupLocalTempUri(cleanupUploadUri);
  }
}

async function cleanupLocalTempUri(uri?: string | null): Promise<void> {
  if (!uri) return;
  if (!(uri.startsWith('file:') || uri.startsWith('/'))) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {}
}

async function uploadStoryVideoThumbnail(userId: string, input: any): Promise<string | null> {
  const thumbnailUri = await createVideoThumbnailUri(input);
  if (!thumbnailUri) return null;

  const thumbFileName = `${userId}/thumb_${Date.now()}.jpg`;
  try {
    return await uploadLocalUri(STORAGE_BUCKETS.STORIES, thumbFileName, thumbnailUri, 'image/jpeg');
  } finally {
    await cleanupLocalTempUri(thumbnailUri);
  }
}

async function uploadInput(
  bucket: string,
  path: string,
  input: any,
  fallbackContentType: string,
  upsert = false
): Promise<string> {
  const uri = getInputUri(input);
  const contentType = getInputContentType(input, fallbackContentType);

  if (uri && (uri.startsWith('file:') || uri.startsWith('content:'))) {
    return uploadLocalUri(bucket, path, uri, contentType, upsert);
  }

  const { blob, contentType: resolvedType } = await toBlob(input, fallbackContentType);
  return uploadBlob(bucket, path, blob, resolvedType || contentType, upsert);
}

export class MediaServiceNative {
  async uploadAvatar(userId: string, file: any): Promise<string> {
    const contentType = getInputContentType(file, 'image/jpeg');
    const ext = extFromMime(contentType, 'jpg');
    const fileName = `${userId}/${Date.now()}.${ext}`;
    return uploadInput(STORAGE_BUCKETS.AVATARS, fileName, file, contentType, true);
  }

  async uploadBanner(userId: string, file: any): Promise<string> {
    const contentType = getInputContentType(file, 'image/jpeg');
    const ext = extFromMime(contentType, 'jpg');
    const fileName = `banners/${userId}/${Date.now()}.${ext}`;
    return uploadInput(STORAGE_BUCKETS.AVATARS, fileName, file, contentType, true);
  }

  async deleteAvatar(avatarUrl: string): Promise<void> {
    try {
      const parts = avatarUrl.split('/storage/v1/object/public/');
      if (parts.length < 2) return;
      const path = parts[1];
      const bucket = path.split('/')[0];
      const filePath = path.split('/').slice(1).join('/');
      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      if (error) throw error;
    } catch (e) {
      console.error('deleteAvatar failed:', e);
    }
  }

  async uploadPostMedia(userId: string, postId: string, files: any[]): Promise<{ mediaURLs: string[]; thumbnailURL: string }> {
    const urls: string[] = [];
    let thumbnailURL = '';

    for (let i = 0; i < files.length; i++) {
      const contentType = getInputContentType(files[i], 'image/jpeg');
      const ext = extFromMime(contentType, 'jpg');
      const fileName = `${userId}/${postId}/${i}_${Date.now()}.${ext}`;
      const url = await uploadInput(STORAGE_BUCKETS.POSTS, fileName, files[i], contentType);
      urls.push(url);

      if (!thumbnailURL) {
        const previewUri = await createLowQualityPreviewUri(files[i]);
        if (previewUri) {
          const thumbFileName = `${userId}/${postId}/thumb_${i}_${Date.now()}.jpg`;
          thumbnailURL = await uploadLocalUri(STORAGE_BUCKETS.POSTS, thumbFileName, previewUri, 'image/jpeg');
          try {
            if (previewUri.startsWith('file:') || previewUri.startsWith('/') ) {
              await FileSystem.deleteAsync(previewUri, { idempotent: true });
            }
          } catch {}
        } else {
          thumbnailURL = url;
        }
      }
    }

    return { mediaURLs: urls, thumbnailURL: thumbnailURL || urls[0] || '' };
  }
  async uploadMessageMedia(userId: string, conversationId: string, file: any): Promise<string> {
    const contentType = getInputContentType(file, 'image/jpeg');
    const ext = extFromMime(contentType, 'jpg');
    const fileName = `${userId}/${conversationId}/${Date.now()}-${Math.random().toString(16).slice(2, 8)}.${ext}`;
    return uploadInput(STORAGE_BUCKETS.MESSAGES, fileName, file, contentType);
  }

  async uploadStoryMedia(userId: string, file: any): Promise<{ mediaURL: string; thumbnailURL: string }> {
    const initialContentType = getInputContentType(file, 'image/jpeg');

    if (initialContentType.startsWith('video/')) {
      const ext = extFromMime(initialContentType, 'mp4');
      const fileName = `${userId}/${Date.now()}.${ext}`;
      const mediaURL = await uploadInput(STORAGE_BUCKETS.STORIES, fileName, file, initialContentType);
      let thumbnailURL: string | null = null;
      try {
        thumbnailURL = await uploadStoryVideoThumbnail(userId, file);
      } catch (error) {
        console.warn('uploadStoryMedia thumbnail upload failed:', error);
      }
      return { mediaURL, thumbnailURL: thumbnailURL || mediaURL };
    }

    const { preparedInput, contentType, cleanupUri } = await prepareCompressedImageInput(file, {
      maxWidth: 1600,
      compress: 0.8,
    });
    const ext = extFromMime(contentType, 'jpg');
    const fileName = `${userId}/${Date.now()}.${ext}`;

    try {
      const mediaURL = await uploadInput(STORAGE_BUCKETS.STORIES, fileName, preparedInput, contentType);
      return { mediaURL, thumbnailURL: mediaURL };
    } finally {
      await cleanupLocalTempUri(cleanupUri);
    }
  }

  async uploadStoryVideo(userId: string, file: any): Promise<{ mediaURL: string; thumbnailURL: string }> {
    const contentType = getInputContentType(file, 'video/mp4');
    const ext = extFromMime(contentType, 'mp4');
    const fileName = `${userId}/${Date.now()}.${ext}`;
    const mediaURL = await uploadInput(STORAGE_BUCKETS.STORIES, fileName, file, contentType);
    let thumbnailURL: string | null = null;
    try {
      thumbnailURL = await uploadStoryVideoThumbnail(userId, file);
    } catch (error) {
      console.warn('uploadStoryVideo thumbnail upload failed:', error);
    }
    return { mediaURL, thumbnailURL: thumbnailURL || mediaURL };
  }

  async uploadStoryThumbnail(userId: string, file: any): Promise<string> {
    const { preparedInput, contentType, cleanupUri } = await prepareCompressedImageInput(file, {
      maxWidth: 1200,
      compress: 0.7,
    });
    const ext = extFromMime(contentType, 'jpg');
    const fileName = `${userId}/thumb_${Date.now()}.${ext}`;
    try {
      return await uploadInput(STORAGE_BUCKETS.STORIES, fileName, preparedInput, contentType);
    } finally {
      await cleanupLocalTempUri(cleanupUri);
    }
  }

  async uploadStoryImagePath(userId: string, fileUri: string): Promise<{ mediaURL: string; thumbnailURL: string }> {
    const fileName = `${userId}/${Date.now()}.jpg`;
    const mediaURL = await uploadLocalUri(STORAGE_BUCKETS.STORIES, fileName, fileUri, 'image/jpeg');
    return { mediaURL, thumbnailURL: mediaURL };
  }

  async uploadStoryVideoPath(userId: string, fileUri: string): Promise<{ mediaURL: string; thumbnailURL: string }> {
    const fileName = `${userId}/${Date.now()}.mp4`;
    const mediaURL = await uploadLocalUri(STORAGE_BUCKETS.STORIES, fileName, fileUri, 'video/mp4');
    let thumbnailURL: string | null = null;
    try {
      thumbnailURL = await uploadStoryVideoThumbnail(userId, fileUri);
    } catch (error) {
      console.warn('uploadStoryVideoPath thumbnail upload failed:', error);
    }
    return { mediaURL, thumbnailURL: thumbnailURL || mediaURL };
  }

  async deletePostMedia(mediaUrls: string[]): Promise<void> {
    try {
      const pathsByBucket: Record<string, string[]> = {};
      for (const url of mediaUrls) {
        const parts = url.split('/storage/v1/object/public/');
        if (parts.length < 2) continue;
        const path = parts[1];
        const bucket = path.split('/')[0];
        const filePath = path.split('/').slice(1).join('/');
        if (!pathsByBucket[bucket]) pathsByBucket[bucket] = [];
        pathsByBucket[bucket].push(filePath);
      }

      for (const bucket of Object.keys(pathsByBucket)) {
        const { error } = await supabase.storage.from(bucket).remove(pathsByBucket[bucket]);
        if (error) throw error;
      }
    } catch (e) {
      console.error('deletePostMedia failed:', e);
    }
  }
}

export const mediaService = new MediaServiceNative();








