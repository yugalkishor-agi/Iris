import { useState, useEffect, useCallback } from 'react';
import { mediaProcessingService, ProcessingProgress, ProcessingOptions } from '../services/media.processing.service';

interface UseMediaProcessingReturn {
  // Processing state
  activeProcesses: ProcessingProgress[];
  isProcessing: boolean;
  
  // Processing functions
  processStoryMedia: (
    mediaUri: string,
    mediaType: 'image' | 'video',
    options?: Partial<ProcessingOptions>
  ) => Promise<string>;
  
  // Control functions
  cancelProcessing: (processingId: string) => void;
  clearCompleted: () => void;
  
  // Progress tracking
  getProcessProgress: (processingId: string) => ProcessingProgress | null;
  getCompressionStats: (processingId: string) => any;
}

export const useMediaProcessing = (): UseMediaProcessingReturn => {
  const [activeProcesses, setActiveProcesses] = useState<ProcessingProgress[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update active processes when progress changes
  useEffect(() => {
    const handleProgressUpdate = (progress: ProcessingProgress) => {
      setActiveProcesses(prev => {
        const updated = prev.filter(p => p.id !== progress.id);
        
        // Only add if not complete or error
        if (progress.stage !== 'complete' && progress.stage !== 'error') {
          updated.push(progress);
        }
        
        return updated;
      });
    };

    const handleCancellation = (processingId: string) => {
      setActiveProcesses(prev => prev.filter(p => p.id !== processingId));
    };

    // Listen to processing events
    mediaProcessingService.on('progressUpdate', handleProgressUpdate);
    mediaProcessingService.on('processingCancelled', handleCancellation);

    // Load initial active processes
    setActiveProcesses(mediaProcessingService.getActiveProcesses());

    return () => {
      mediaProcessingService.off('progressUpdate', handleProgressUpdate);
      mediaProcessingService.off('processingCancelled', handleCancellation);
    };
  }, []);

  // Update isProcessing based on active processes
  useEffect(() => {
    setIsProcessing(activeProcesses.length > 0);
  }, [activeProcesses.length]);

  // Process story media
  const processStoryMedia = useCallback(async (
    mediaUri: string,
    mediaType: 'image' | 'video',
    options?: Partial<ProcessingOptions>
  ): Promise<string> => {
    try {
      console.log('🎬 Starting media processing:', { mediaType, options });
      
      const processedUri = await mediaProcessingService.processStoryMedia(
        mediaUri,
        mediaType,
        options
      );
      
      console.log('✅ Media processing complete:', processedUri);
      return processedUri;
    } catch (error) {
      console.error('❌ Media processing failed:', error);
      throw error;
    }
  }, []);

  // Cancel processing
  const cancelProcessing = useCallback((processingId: string) => {
    mediaProcessingService.cancelProcessing(processingId);
  }, []);

  // Clear completed processes
  const clearCompleted = useCallback(() => {
    mediaProcessingService.clearCompleted();
    setActiveProcesses(mediaProcessingService.getActiveProcesses());
  }, []);

  // Get process progress
  const getProcessProgress = useCallback((processingId: string) => {
    return mediaProcessingService.getProcessProgress(processingId);
  }, []);

  // Get compression stats
  const getCompressionStats = useCallback((processingId: string) => {
    return mediaProcessingService.getCompressionStats(processingId);
  }, []);

  return {
    // State
    activeProcesses,
    isProcessing,
    
    // Functions
    processStoryMedia,
    cancelProcessing,
    clearCompleted,
    getProcessProgress,
    getCompressionStats,
  };
};
