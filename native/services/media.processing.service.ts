import { manipulateAsync, SaveFormat, ImageResult } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { EventEmitter } from 'events';

export interface ProcessingProgress {
  id: string;
  type: 'image' | 'video';
  stage: 'compressing' | 'filtering' | 'uploading' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  originalSize?: number;
  compressedSize?: number;
  estimatedTime?: number;
}

export interface ProcessingOptions {
  quality: number; // 0.1 - 1.0
  maxWidth?: number;
  maxHeight?: number;
  format?: SaveFormat;
  enableFilters?: boolean;
  enableCompression?: boolean;
}

class MediaProcessingService extends EventEmitter {
  private processingQueue: Map<string, ProcessingProgress> = new Map();
  private activeProcesses: Set<string> = new Set();

  // Default processing options for stories
  private defaultStoryOptions: ProcessingOptions = {
    quality: 0.8,
    maxWidth: 1080,
    maxHeight: 1920,
    format: SaveFormat.JPEG,
    enableFilters: true,
    enableCompression: true,
  };

  // Generate unique processing ID
  private generateProcessingId(): string {
    return `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start processing media for story
  async processStoryMedia(
    mediaUri: string,
    mediaType: 'image' | 'video',
    options: Partial<ProcessingOptions> = {}
  ): Promise<string> {
    const processingId = this.generateProcessingId();
    const finalOptions = { ...this.defaultStoryOptions, ...options };

    // Initialize progress tracking
    const progress: ProcessingProgress = {
      id: processingId,
      type: mediaType,
      stage: 'compressing',
      progress: 0,
      message: 'Starting compression...',
    };

    this.processingQueue.set(processingId, progress);
    this.activeProcesses.add(processingId);
    this.emit('progressUpdate', progress);

    try {
      let processedUri: string;

      if (mediaType === 'image') {
        processedUri = await this.processImage(mediaUri, finalOptions, processingId);
      } else {
        processedUri = await this.processVideo(mediaUri, finalOptions, processingId);
      }

      // Mark as complete
      const finalProgress: ProcessingProgress = {
        ...progress,
        stage: 'complete',
        progress: 100,
        message: 'Processing complete!',
      };

      this.processingQueue.set(processingId, finalProgress);
      this.emit('progressUpdate', finalProgress);

      // Clean up after delay
      setTimeout(() => {
        this.processingQueue.delete(processingId);
        this.activeProcesses.delete(processingId);
      }, 3000);

      return processedUri;
    } catch (error) {
      console.error('Media processing failed:', error);
      
      const errorProgress: ProcessingProgress = {
        ...progress,
        stage: 'error',
        progress: 0,
        message: 'Processing failed. Please try again.',
      };

      this.processingQueue.set(processingId, errorProgress);
      this.emit('progressUpdate', errorProgress);
      
      throw error;
    }
  }

  // Process image with compression and optimization
  private async processImage(
    imageUri: string,
    options: ProcessingOptions,
    processingId: string
  ): Promise<string> {
    const progress = this.processingQueue.get(processingId)!;

    try {
      // Get original file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const originalSize = (fileInfo as any && typeof (fileInfo as any).size === 'number')
        ? (fileInfo as any).size
        : 0;

      // Update progress - compression start
      this.updateProgress(processingId, {
        ...progress,
        progress: 10,
        message: 'Analyzing image...',
        originalSize,
      });

      // Step 1: Resize if needed
      let processedImage: ImageResult = { uri: imageUri, width: 0, height: 0 };

      if (options.maxWidth || options.maxHeight) {
        this.updateProgress(processingId, {
          ...progress,
          progress: 30,
          message: 'Resizing image...',
        });

        processedImage = await manipulateAsync(
          imageUri,
          [
            {
              resize: {
                width: options.maxWidth,
                height: options.maxHeight,
              },
            },
          ],
          {
            compress: options.quality,
            format: options.format,
          }
        );
      }

      // Step 2: Apply compression
      this.updateProgress(processingId, {
        ...progress,
        progress: 60,
        message: 'Compressing image...',
      });

      const compressedImage = await manipulateAsync(
        processedImage.uri,
        [], // No additional manipulations, just compression
        {
          compress: options.quality,
          format: options.format,
        }
      );

      // Step 3: Get final file size
      const compressedFileInfo = await FileSystem.getInfoAsync(compressedImage.uri);
      const compressedSize = (compressedFileInfo as any && typeof (compressedFileInfo as any).size === 'number')
        ? (compressedFileInfo as any).size
        : 0;

      this.updateProgress(processingId, {
        ...progress,
        progress: 90,
        message: 'Finalizing...',
        compressedSize,
      });

      console.log(`📸 Image compressed: ${originalSize} → ${compressedSize} bytes`);
      console.log(`📸 Compression ratio: ${((1 - compressedSize / originalSize) * 100).toFixed(1)}%`);

      return compressedImage.uri;
    } catch (error) {
      console.error('Image processing failed:', error);
      throw error;
    }
  }

  // Process video with compression
  private async processVideo(
    videoUri: string,
    options: ProcessingOptions,
    processingId: string
  ): Promise<string> {
    const progress = this.processingQueue.get(processingId)!;

    try {
      // Get original file info
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      const originalSize = (fileInfo as any && typeof (fileInfo as any).size === 'number')
        ? (fileInfo as any).size
        : 0;

      this.updateProgress(processingId, {
        ...progress,
        progress: 10,
        message: 'Analyzing video...',
        originalSize,
      });

      // For now, return original video (video compression is complex)
      // In production, you'd use FFmpeg or similar for video compression
      this.updateProgress(processingId, {
        ...progress,
        progress: 50,
        message: 'Processing video...',
      });

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.updateProgress(processingId, {
        ...progress,
        progress: 90,
        message: 'Finalizing video...',
        compressedSize: originalSize, // Same size for now
      });

      console.log(`🎥 Video processed: ${originalSize} bytes`);

      return videoUri;
    } catch (error) {
      console.error('Video processing failed:', error);
      throw error;
    }
  }

  // Update progress and emit event
  private updateProgress(processingId: string, progress: ProcessingProgress) {
    this.processingQueue.set(processingId, progress);
    this.emit('progressUpdate', progress);
  }

  // Get all active processes
  getActiveProcesses(): ProcessingProgress[] {
    return Array.from(this.processingQueue.values()).filter(
      p => p.stage !== 'complete' && p.stage !== 'error'
    );
  }

  // Get specific process progress
  getProcessProgress(processingId: string): ProcessingProgress | null {
    return this.processingQueue.get(processingId) || null;
  }

  // Cancel processing
  cancelProcessing(processingId: string): void {
    if (this.activeProcesses.has(processingId)) {
      this.activeProcesses.delete(processingId);
      this.processingQueue.delete(processingId);
      this.emit('processingCancelled', processingId);
    }
  }

  // Clear completed processes
  clearCompleted(): void {
    for (const [id, progress] of this.processingQueue.entries()) {
      if (progress.stage === 'complete' || progress.stage === 'error') {
        this.processingQueue.delete(id);
        this.activeProcesses.delete(id);
      }
    }
  }

  // Get compression stats
  getCompressionStats(processingId: string): {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    savedBytes: number;
  } | null {
    const progress = this.processingQueue.get(processingId);
    if (!progress || !progress.originalSize || !progress.compressedSize) {
      return null;
    }

    const originalSize = progress.originalSize;
    const compressedSize = progress.compressedSize;
    const savedBytes = originalSize - compressedSize;
    const compressionRatio = (savedBytes / originalSize) * 100;

    return {
      originalSize,
      compressedSize,
      compressionRatio,
      savedBytes,
    };
  }
}

// Export singleton instance
export const mediaProcessingService = new MediaProcessingService();
export default mediaProcessingService;
