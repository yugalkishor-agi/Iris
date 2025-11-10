// FFmpeg.wasm - Client-side video processing
// Runs entirely in the browser, no server needed!

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;

  /**
   * Initialize FFmpeg (loads ~30MB WebAssembly files)
   */
  async initialize(onProgress?: (progress: number) => void): Promise<void> {
    if (this.loaded) return;

    this.ffmpeg = new FFmpeg();
    
    // Progress callback
    if (onProgress) {
      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    // Load FFmpeg from CDN
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    this.loaded = true;
    console.log('✅ FFmpeg loaded successfully (client-side)');
  }

  /**
   * Check if FFmpeg is loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get video duration in seconds
   */
  async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Trim video (client-side processing)
   */
  async trimVideo(
    file: File,
    startTime: number,
    endTime: number,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized');

    // Write input file
    const data = await file.arrayBuffer();
    await this.ffmpeg.writeFile('input.mp4', new Uint8Array(data));

    // Trim command
    await this.ffmpeg.exec([
      '-i', 'input.mp4',
      '-ss', startTime.toString(),
      '-to', endTime.toString(),
      '-c', 'copy',
      'output.mp4'
    ]);

    // Read output
    const output = await this.ffmpeg.readFile('output.mp4');
    return new Blob([output], { type: 'video/mp4' });
  }

  /**
   * Compress video to fit size limits
   */
  async compressVideo(
    file: File,
    maxSizeMB: number = 100,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized');

    const data = await file.arrayBuffer();
    await this.ffmpeg.writeFile('input.mp4', new Uint8Array(data));

    // Calculate target bitrate
    const duration = await this.getVideoDuration(file);
    const targetSizeBytes = maxSizeMB * 1024 * 1024;
    const targetBitrate = Math.floor((targetSizeBytes * 8) / duration / 1000); // kbps

    // Compress with target bitrate
    await this.ffmpeg.exec([
      '-i', 'input.mp4',
      '-b:v', `${targetBitrate}k`,
      '-maxrate', `${targetBitrate}k`,
      '-bufsize', `${targetBitrate * 2}k`,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-c:a', 'aac',
      '-b:a', '128k',
      'output.mp4'
    ]);

    const output = await this.ffmpeg.readFile('output.mp4');
    return new Blob([output], { type: 'video/mp4' });
  }

  /**
   * Extract frames from video
   */
  async extractFrames(file: File, frameCount: number = 10): Promise<string[]> {
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized');

    const data = await file.arrayBuffer();
    await this.ffmpeg.writeFile('input.mp4', new Uint8Array(data));

    const duration = await this.getVideoDuration(file);
    const interval = duration / frameCount;

    const frames: string[] = [];

    for (let i = 0; i < frameCount; i++) {
      const time = i * interval;
      
      await this.ffmpeg.exec([
        '-ss', time.toString(),
        '-i', 'input.mp4',
        '-vframes', '1',
        '-q:v', '2',
        `frame${i}.jpg`
      ]);

      const frameData = await this.ffmpeg.readFile(`frame${i}.jpg`);
      const blob = new Blob([frameData], { type: 'image/jpeg' });
      frames.push(URL.createObjectURL(blob));
    }

    return frames;
  }

  /**
   * Merge video with audio
   */
  async mergeVideoAudio(videoFile: File, audioFile: File): Promise<Blob> {
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized');

    const videoData = await videoFile.arrayBuffer();
    const audioData = await audioFile.arrayBuffer();

    await this.ffmpeg.writeFile('video.mp4', new Uint8Array(videoData));
    await this.ffmpeg.writeFile('audio.mp3', new Uint8Array(audioData));

    await this.ffmpeg.exec([
      '-i', 'video.mp4',
      '-i', 'audio.mp3',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-shortest',
      'output.mp4'
    ]);

    const output = await this.ffmpeg.readFile('output.mp4');
    return new Blob([output], { type: 'video/mp4' });
  }

  /**
   * Apply video filter (brightness, contrast, saturation)
   */
  async applyFilters(
    file: File,
    brightness: number = 0, // -1 to 1
    contrast: number = 1,   // 0 to 2
    saturation: number = 1  // 0 to 3
  ): Promise<Blob> {
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized');

    const data = await file.arrayBuffer();
    await this.ffmpeg.writeFile('input.mp4', new Uint8Array(data));

    // Build filter string
    const filters = [];
    if (brightness !== 0) filters.push(`eq=brightness=${brightness}`);
    if (contrast !== 1) filters.push(`eq=contrast=${contrast}`);
    if (saturation !== 1) filters.push(`eq=saturation=${saturation}`);

    const filterStr = filters.length > 0 ? filters.join(',') : 'null';

    await this.ffmpeg.exec([
      '-i', 'input.mp4',
      '-vf', filterStr,
      '-c:a', 'copy',
      'output.mp4'
    ]);

    const output = await this.ffmpeg.readFile('output.mp4');
    return new Blob([output], { type: 'video/mp4' });
  }

  /**
   * Change video speed
   */
  async changeSpeed(file: File, speed: number = 1): Promise<Blob> {
    if (!this.ffmpeg) throw new Error('FFmpeg not initialized');

    const data = await file.arrayBuffer();
    await this.ffmpeg.writeFile('input.mp4', new Uint8Array(data));

    // Calculate PTS and audio tempo
    const videoPTS = 1 / speed;
    const audioTempo = speed;

    await this.ffmpeg.exec([
      '-i', 'input.mp4',
      '-filter_complex',
      `[0:v]setpts=${videoPTS}*PTS[v];[0:a]atempo=${audioTempo}[a]`,
      '-map', '[v]',
      '-map', '[a]',
      'output.mp4'
    ]);

    const output = await this.ffmpeg.readFile('output.mp4');
    return new Blob([output], { type: 'video/mp4' });
  }

  /**
   * Get video metadata
   */
  async getMetadata(file: File): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
    bitrate: number;
  }> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          fps: 30, // Default, can't get exact FPS from video element
          bitrate: 0, // Can't get bitrate from video element
        });
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Clean up FFmpeg resources
   */
  terminate(): void {
    if (this.ffmpeg) {
      this.ffmpeg.terminate();
      this.ffmpeg = null;
      this.loaded = false;
    }
  }
}

// Singleton instance
export const ffmpegService = new FFmpegService();
