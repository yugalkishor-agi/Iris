/**
 * Extract a frame from video at specific time
 * @param videoFile - Video file to extract frame from
 * @param timeInSeconds - Time position to capture frame
 * @returns Promise<Blob> - Frame as image blob
 */
export async function extractVideoFrame(
  videoFile: File,
  timeInSeconds: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Seek to specific time
      video.currentTime = timeInSeconds;
    };

    video.onseeked = () => {
      try {
        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }

            // Cleanup
            URL.revokeObjectURL(video.src);
          },
          'image/jpeg',
          0.95
        );
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
      URL.revokeObjectURL(video.src);
    };

    // Load video
    video.src = URL.createObjectURL(videoFile);
  });
}

/**
 * Generate multiple thumbnail frames from video
 * @param videoFile - Video file
 * @param count - Number of thumbnails to generate
 * @returns Promise<string[]> - Array of data URLs
 */
export async function generateVideoThumbnails(
  videoFile: File,
  count: number = 5
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const thumbnails: string[] = [];
    let currentIndex = 0;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const interval = duration / (count + 1);

      const captureFrame = () => {
        if (currentIndex >= count) {
          resolve(thumbnails);
          URL.revokeObjectURL(video.src);
          return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        thumbnails.push(canvas.toDataURL('image/jpeg', 0.7));

        currentIndex++;
        video.currentTime = interval * (currentIndex + 1);
      };

      video.onseeked = captureFrame;
      video.currentTime = interval;
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(videoFile);
  });
}

/**
 * Get video duration
 * @param videoFile - Video file
 * @returns Promise<number> - Duration in seconds
 */
export async function getVideoDuration(videoFile: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      resolve(video.duration);
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(videoFile);
  });
}
