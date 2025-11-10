import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export class FFmpegProcessor {
  private ffmpeg: FFmpeg;
  private loaded: boolean = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async load(onProgress?: (progress: number) => void): Promise<void> {
    if (this.loaded) return;

    this.ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    if (onProgress) {
      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100));
      });
    }

    try {
      await this.ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.15/dist/umd/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.15/dist/umd/ffmpeg-core.wasm',
      });
      this.loaded = true;
    } catch (error) {
      console.error('FFmpeg load failed:', error);
      throw new Error('Failed to load video processor');
    }
  }

  /**
   * Trim video from startTime to endTime
   */
  async trimVideo(
    videoFile: File,
    startTime: number,
    endTime: number,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.loaded) await this.load(onProgress);

    const inputName = 'input.mp4';
    const outputName = 'output.mp4';

    await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    const duration = endTime - startTime;
    await this.ffmpeg.exec([
      '-i', inputName,
      '-ss', startTime.toString(),
      '-t', duration.toString(),
      '-c', 'copy',
      outputName
    ]);

    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    return new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' });
  }

  /**
   * Change video playback speed
   */
  async changeSpeed(
    videoFile: File,
    speed: number,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.loaded) await this.load(onProgress);

    const inputName = 'input.mp4';
    const outputName = 'output.mp4';

    await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    const videoSpeed = 1 / speed;
    const audioSpeed = speed;

    await this.ffmpeg.exec([
      '-i', inputName,
      '-filter:v', `setpts=${videoSpeed}*PTS`,
      '-filter:a', `atempo=${audioSpeed}`,
      outputName
    ]);

    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    return new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' });
  }

  /**
   * Add audio track to video
   */
  async addAudio(
    videoFile: File,
    audioFile: File,
    videoVolume: number = 1,
    audioVolume: number = 1,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.loaded) await this.load(onProgress);

    const videoName = 'video.mp4';
    const audioName = 'audio.mp3';
    const outputName = 'output.mp4';

    await this.ffmpeg.writeFile(videoName, await fetchFile(videoFile));
    await this.ffmpeg.writeFile(audioName, await fetchFile(audioFile));

    await this.ffmpeg.exec([
      '-i', videoName,
      '-i', audioName,
      '-filter_complex',
      `[0:a]volume=${videoVolume}[a1];[1:a]volume=${audioVolume}[a2];[a1][a2]amix=inputs=2:duration=first[aout]`,
      '-map', '0:v',
      '-map', '[aout]',
      '-c:v', 'copy',
      '-c:a', 'aac',
      outputName
    ]);

    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(videoName);
    await this.ffmpeg.deleteFile(audioName);
    await this.ffmpeg.deleteFile(outputName);

    return new Blob([data.buffer], { type: 'video/mp4' });
  }

  /**
   * Replace video audio
   */
  async replaceAudio(
    videoFile: File,
    audioFile: File,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.loaded) await this.load(onProgress);

    const videoName = 'video.mp4';
    const audioName = 'audio.mp3';
    const outputName = 'output.mp4';

    await this.ffmpeg.writeFile(videoName, await fetchFile(videoFile));
    await this.ffmpeg.writeFile(audioName, await fetchFile(audioFile));

    await this.ffmpeg.exec([
      '-i', videoName,
      '-i', audioName,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-shortest',
      outputName
    ]);

    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(videoName);
    await this.ffmpeg.deleteFile(audioName);
    await this.ffmpeg.deleteFile(outputName);

    return new Blob([data.buffer], { type: 'video/mp4' });
  }

  /**
   * Extract video frame as image
   */
  async extractFrame(
    videoFile: File,
    timeInSeconds: number,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.loaded) await this.load(onProgress);

    const inputName = 'input.mp4';
    const outputName = 'frame.jpg';

    await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    await this.ffmpeg.exec([
      '-i', inputName,
      '-ss', timeInSeconds.toString(),
      '-vframes', '1',
      '-q:v', '2',
      outputName
    ]);

    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    return new Blob([new Uint8Array(data as Uint8Array)], { type: 'image/jpeg' });
  }

  /**
   * Merge multiple video clips
   */
  async mergeVideos(
    videoFiles: File[],
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.loaded) await this.load(onProgress);

    const fileList = 'filelist.txt';
    const outputName = 'output.mp4';

    // Write all videos
    const fileNames: string[] = [];
    for (let i = 0; i < videoFiles.length; i++) {
      const name = `video${i}.mp4`;
      fileNames.push(name);
      await this.ffmpeg.writeFile(name, await fetchFile(videoFiles[i]));
    }

    // Create concat file
    const concatContent = fileNames.map(name => `file '${name}'`).join('\n');
    await this.ffmpeg.writeFile(fileList, new TextEncoder().encode(concatContent));

    // Merge
    await this.ffmpeg.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', fileList,
      '-c', 'copy',
      outputName
    ]);

    const data = await this.ffmpeg.readFile(outputName);

    // Cleanup
    await this.ffmpeg.deleteFile(fileList);
    for (const name of fileNames) {
      await this.ffmpeg.deleteFile(name);
    }
    await this.ffmpeg.deleteFile(outputName);

    return new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' });
  }

  /**
   * Apply color filters to video
   */
  async applyColorFilter(
    videoFile: File,
    brightness: number = 1,
    contrast: number = 1,
    saturation: number = 1,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.loaded) await this.load(onProgress);

    const inputName = 'input.mp4';
    const outputName = 'output.mp4';

    await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    await this.ffmpeg.exec([
      '-i', inputName,
      '-vf', `eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}`,
      '-c:a', 'copy',
      outputName
    ]);

    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    return new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' });
  }

  /**
   * Crop video to aspect ratio
   */
  async cropVideo(
    videoFile: File,
    aspectRatio: '1:1' | '9:16' | '16:9' | '4:5',
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.loaded) await this.load(onProgress);

    const inputName = 'input.mp4';
    const outputName = 'output.mp4';

    await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    let cropFilter = '';
    switch (aspectRatio) {
      case '1:1':
        cropFilter = 'crop=min(iw\\,ih):min(iw\\,ih)';
        break;
      case '9:16':
        cropFilter = 'crop=ih*9/16:ih';
        break;
      case '16:9':
        cropFilter = 'crop=iw:iw*9/16';
        break;
      case '4:5':
        cropFilter = 'crop=ih*4/5:ih';
        break;
    }

    await this.ffmpeg.exec([
      '-i', inputName,
      '-vf', cropFilter,
      '-c:a', 'copy',
      outputName
    ]);

    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    return new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' });
  }

  /**
   * Add fade in/out effects
   */
  async addFadeEffects(
    videoFile: File,
    fadeInDuration: number = 0,
    fadeOutDuration: number = 0,
    videoDuration?: number,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.loaded) await this.load(onProgress);

    const inputName = 'input.mp4';
    const outputName = 'output.mp4';

    await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    let filters: string[] = [];
    
    if (fadeInDuration > 0) {
      filters.push(`fade=t=in:st=0:d=${fadeInDuration}`);
    }
    
    if (fadeOutDuration > 0 && videoDuration) {
      const fadeOutStart = videoDuration - fadeOutDuration;
      filters.push(`fade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}`);
    }

    const filterString = filters.length > 0 ? filters.join(',') : 'copy';

    await this.ffmpeg.exec([
      '-i', inputName,
      '-vf', filterString,
      '-c:a', 'copy',
      outputName
    ]);

    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    return new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' });
  }

  /**
   * Compress video for optimized upload
   */
  async compressVideo(
    videoFile: File,
    quality: 'low' | 'medium' | 'high' = 'medium',
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.loaded) await this.load(onProgress);

    const inputName = 'input.mp4';
    const outputName = 'output.mp4';

    await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    const crf = quality === 'low' ? 30 : quality === 'medium' ? 23 : 18;

    await this.ffmpeg.exec([
      '-i', inputName,
      '-c:v', 'libx264',
      '-crf', crf.toString(),
      '-preset', 'fast',
      '-c:a', 'aac',
      '-b:a', '128k',
      outputName
    ]);

    const data = await this.ffmpeg.readFile(outputName);
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    return new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' });
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata(videoFile: File): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
  }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          fps: 30, // Default, can be extracted more accurately if needed
        });
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(videoFile);
    });
  }

  /**
   * Cleanup FFmpeg instance
   */
  async cleanup(): Promise<void> {
    // FFmpeg cleanup if needed
    this.loaded = false;
  }
}

// Singleton instance
export const ffmpegProcessor = new FFmpegProcessor();
