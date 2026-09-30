import { supabase, getMediaUrl, STORAGE_BUCKETS } from '../config/supabase';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export class MediaService {
  // Convert base64 string to Uint8Array (RN-safe)
  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = global.atob ? global.atob(base64) : this.atobPolyfill(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }

  // Small atob polyfill using Buffer if available
  private atobPolyfill(b64: string): string {
    try {
      // @ts-ignore
      const BufferAny = (global as any).Buffer || undefined;
      if (BufferAny) {
        return BufferAny.from(b64, 'base64').toString('binary');
      }
    } catch {}
    // Fallback: manual decode (limited)
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
  // ==========================================
  // IMAGE COMPRESSION & OPTIMIZATION
  // ==========================================

  /**
   * Compress image before upload
   */
  private async compressImage(
    file: Blob,
    maxWidth = 1080,
    quality = 0.8
  ): Promise<Blob> {
    // On native, skip DOM-based compression and return original blob
    if (Platform.OS !== 'web') {
      return Promise.resolve(file);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Maintain aspect ratio
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  }

  /**
   * Generate thumbnail from image
   */
  private async generateThumbnail(
    file: Blob,
    width = 300,
    height = 300
  ): Promise<Blob> {
    // On native, skip DOM canvas thumbnail and return original blob
    if (Platform.OS !== 'web') {
      return Promise.resolve(file);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          
          // Calculate crop dimensions (center crop)
          const aspectRatio = img.width / img.height;
          let cropWidth = img.width;
          let cropHeight = img.height;
          let cropX = 0;
          let cropY = 0;
          
          if (aspectRatio > 1) {
            cropWidth = img.height;
            cropX = (img.width - cropWidth) / 2;
          } else {
            cropHeight = img.width;
            cropY = (img.height - cropHeight) / 2;
          }
          
          ctx?.drawImage(
            img,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            width,
            height
          );
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to generate thumbnail'));
              }
            },
            'image/jpeg',
            0.7
          );
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  }

  // ==========================================
  // AVATAR UPLOAD
  // ==========================================

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      // Compress image
      const compressed = await this.compressImage(file, 400, 0.85);
      
      const fileName = `${userId}/${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .upload(fileName, compressed, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      return getMediaUrl(`${STORAGE_BUCKETS.AVATARS}/${fileName}`, false);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      throw new Error('Failed to upload avatar');
    }
  }

  async uploadBanner(userId: string, file: Blob): Promise<string> {
    try {
      const compressed = await this.compressImage(file, 1920, 0.85);
      const fileName = `banners/${userId}/${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .upload(fileName, compressed, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        });
      if (error) throw error;
      return getMediaUrl(`${STORAGE_BUCKETS.AVATARS}/${fileName}`, false);
    } catch (error) {
      console.error('Banner upload failed:', error);
      throw new Error('Failed to upload banner');
    }
  }

  /**
   * Delete avatar
   */
  async deleteAvatar(avatarUrl: string): Promise<void> {
    try {
      // Extract path from URL
      const path = avatarUrl.split('/').slice(-2).join('/');
      
      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      console.error('Avatar deletion failed:', error);
      throw new Error('Failed to delete avatar');
    }
  }

  // ==========================================
  // POST MEDIA UPLOAD
  // ==========================================

  /**
   * Upload post media (single or multiple)
   */
  async uploadPostMedia(
    userId: string,
    postId: string,
    files: File[]
  ): Promise<{ mediaURLs: string[]; thumbnailURL: string }> {
    try {
      const uploadPromises = files.map(async (file, index) => {
        // Compress image
        const compressed = await this.compressImage(file, 1080, 0.8);
        
        const fileName = `${userId}/${postId}/${index}_${Date.now()}.jpg`;
        
        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKETS.POSTS)
          .upload(fileName, compressed, {
            contentType: 'image/jpeg',
          });

        if (error) throw error;

        return getMediaUrl(`${STORAGE_BUCKETS.POSTS}/${fileName}`, false);
      });

      const mediaURLs = await Promise.all(uploadPromises);

      // Generate thumbnail from first image
      const thumbnail = await this.generateThumbnail(files[0]);
      const thumbFileName = `${userId}/${postId}/thumb_${Date.now()}.jpg`;
      
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from(STORAGE_BUCKETS.POSTS)
        .upload(thumbFileName, thumbnail, {
          contentType: 'image/jpeg',
        });

      if (thumbError) throw thumbError;

      const thumbnailURL = getMediaUrl(`${STORAGE_BUCKETS.POSTS}/${thumbFileName}`, false);

      return { mediaURLs, thumbnailURL };
    } catch (error) {
      console.error('Post media upload failed:', error);
      throw new Error('Failed to upload post media');
    }
  }

  /**
   * Delete post media
   */
  async deletePostMedia(mediaUrls: string[]): Promise<void> {
    try {
      const paths = mediaUrls.map((url) => {
        const parts = url.split('/');
        return parts.slice(-3).join('/'); // user/post/file
      });

      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.POSTS)
        .remove(paths);

      if (error) throw error;
    } catch (error) {
      console.error('Post media deletion failed:', error);
      throw new Error('Failed to delete post media');
    }
  }

  // ==========================================
  // STORY MEDIA UPLOAD
  // ==========================================

  /**
   * Upload story media - Fast and simple
   */
  async uploadStoryMedia(userId: string, file: Blob): Promise<{ mediaURL: string; thumbnailURL: string }> {
    const startTime = Date.now();
    console.log('⏱️ Upload started:', new Date().toLocaleTimeString());
    console.log('📦 Original size:', file.size, 'bytes');
    
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}.jpg`;
    
    // On web, compress aggressively; on native, use original blob
    let uploadBlob: Blob = file;
    if (Platform.OS === 'web') {
      console.log('🗜️ Starting compression to 360p...');
      const compressStart = Date.now();
      uploadBlob = await this.compressImage(file, 360, 0.75);
      console.log(`✅ Compressed in ${Date.now() - compressStart}ms to ${uploadBlob.size} bytes`);
    }
    
    // Direct simple upload
    console.log('📤 Uploading to Supabase stories bucket...');
    const uploadStart = Date.now();
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.STORIES)
      .upload(fileName, uploadBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log(`✅ Upload complete in ${Date.now() - uploadStart}ms`);
    console.log(`⏱️ Total time: ${Date.now() - startTime}ms`);
    
    const mediaURL = getMediaUrl(`${STORAGE_BUCKETS.STORIES}/${fileName}`, false);
    
    return { mediaURL, thumbnailURL: mediaURL };
  }

  /**
   * Upload story video
   */
  async uploadStoryVideo(userId: string, file: Blob): Promise<{ mediaURL: string; thumbnailURL: string }> {
    try {
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}.mp4`;

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.STORIES)
        .upload(fileName, file, {
          contentType: 'video/mp4',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const mediaURL = getMediaUrl(`${STORAGE_BUCKETS.STORIES}/${fileName}`, false);
      const thumbnailURL = mediaURL;
      return { mediaURL, thumbnailURL };
    } catch (error) {
      console.error('Story video upload failed:', error);
      throw new Error('Failed to upload story video');
    }
  }

  /**
   * Upload story image from a local file path (Native). Avoids creating a large Blob in JS memory.
   */
  async uploadStoryImagePath(userId: string, fileUri: string): Promise<{ mediaURL: string; thumbnailURL: string }> {
    try {
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}.jpg`;
      const filesApi: any = supabase.storage.from(STORAGE_BUCKETS.STORIES);
      const canSign = typeof filesApi?.createSignedUploadUrl === 'function';
      if (canSign) {
        console.log('[MediaService] Using signed URL flow for image');
        const { data, error } = await filesApi.createSignedUploadUrl(fileName);
        if (error || !data?.signedUrl) throw error || new Error('Failed to create signed upload URL');
        const baseFromPublic = getMediaUrl('', false);
        const supaBase = baseFromPublic.split('/storage')[0];
        const signedUrl = (data.signedUrl.startsWith('http') ? data.signedUrl : `${supaBase}${data.signedUrl}`);
        const result = await FileSystem.uploadAsync(signedUrl, fileUri, {
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: {
            'x-upsert': 'false',
            'Cache-Control': '3600',
            'Content-Type': 'image/jpeg',
          },
        });
        if (result.status !== 200 && result.status !== 201) {
          console.error('[MediaService] Signed image upload failed', { status: result.status, body: String(result.body || '').slice(0, 300) });
          throw new Error(`Signed image upload failed with status ${result.status}`);
        }
      } else {
        console.log('[MediaService] Using direct storage.upload flow for image (fallback)');
        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
        const bytes = this.base64ToUint8Array(base64);
        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKETS.STORIES)
          .upload(fileName, bytes as any, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false });
        if (upErr) throw upErr;
      }

      const mediaURL = getMediaUrl(`${STORAGE_BUCKETS.STORIES}/${fileName}`, false);
      return { mediaURL, thumbnailURL: mediaURL };
    } catch (error) {
      console.error('Story image path upload failed:', error);
      throw new Error('Failed to upload story image');
    }
  }

  /**
   * Upload story video from a local file path (Native). Avoids creating a large Blob in JS memory.
   */
  async uploadStoryVideoPath(userId: string, fileUri: string): Promise<{ mediaURL: string; thumbnailURL: string }> {
    try {
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}.mp4`;
      const filesApi: any = supabase.storage.from(STORAGE_BUCKETS.STORIES);
      const canSign = typeof filesApi?.createSignedUploadUrl === 'function';
      if (canSign) {
        console.log('[MediaService] Using signed URL flow for video');
        const { data, error } = await filesApi.createSignedUploadUrl(fileName);
        if (error || !data?.signedUrl) throw error || new Error('Failed to create signed upload URL');
        const baseFromPublic = getMediaUrl('', false);
        const supaBase = baseFromPublic.split('/storage')[0];
        const signedUrl = (data.signedUrl.startsWith('http') ? data.signedUrl : `${supaBase}${data.signedUrl}`);
        const result = await FileSystem.uploadAsync(signedUrl, fileUri, {
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: {
            'x-upsert': 'false',
            'Cache-Control': '3600',
            'Content-Type': 'video/mp4',
          },
        });
        if (result.status !== 200 && result.status !== 201) {
          console.error('[MediaService] Signed video upload failed', { status: result.status, body: String(result.body || '').slice(0, 300) });
          throw new Error(`Signed video upload failed with status ${result.status}`);
        }
      } else {
        console.log('[MediaService] Using direct storage.upload flow for video (fallback)');
        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
        const bytes = this.base64ToUint8Array(base64);
        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKETS.STORIES)
          .upload(fileName, bytes as any, { contentType: 'video/mp4', cacheControl: '3600', upsert: false });
        if (upErr) throw upErr;
      }

      const mediaURL = getMediaUrl(`${STORAGE_BUCKETS.STORIES}/${fileName}`, false);
      const thumbnailURL = mediaURL;
      return { mediaURL, thumbnailURL };
    } catch (error) {
      console.error('Story video path upload failed:', error);
      throw new Error('Failed to upload story video');
    }
  }

  /**
   * Upload a story thumbnail (jpg blob)
   */
  async uploadStoryThumbnail(userId: string, blob: Blob): Promise<string> {
    try {
      const fileName = `${userId}/thumb_${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.STORIES)
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });
      if (error) throw error;
      return getMediaUrl(`${STORAGE_BUCKETS.STORIES}/${fileName}`, false);
    } catch (error) {
      console.error('Story thumbnail upload failed:', error);
      throw new Error('Failed to upload story thumbnail');
    }
  }

  // ==========================================
  // MESSAGE MEDIA UPLOAD
  // ==========================================

  /**
   * Upload message media (private)
   */
  async uploadMessageMedia(
    userId: string,
    conversationId: string,
    file: File
  ): Promise<string> {
    try {
      // Compress image
      const compressed = await this.compressImage(file, 1080, 0.8);
      
      const fileName = `${userId}/${conversationId}/${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.MESSAGES)
        .upload(fileName, compressed, {
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      return getMediaUrl(`${STORAGE_BUCKETS.MESSAGES}/${fileName}`, false);
    } catch (error) {
      console.error('Message media upload failed:', error);
      throw new Error('Failed to upload message media');
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Get file size in MB
   */
  getFileSizeMB(file: File): number {
    return file.size / (1024 * 1024);
  }

  /**
   * Validate file size (max 10MB)
   */
  validateFileSize(file: File, maxSizeMB = 10): boolean {
    return this.getFileSizeMB(file) <= maxSizeMB;
  }

  /**
   * Validate file type
   */
  validateFileType(file: File, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(file: File): Promise<{ width: number; height: number; aspectRatio: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height,
            aspectRatio: img.width / img.height,
          });
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  }
}

// Export singleton instance
export const mediaService = new MediaService();
