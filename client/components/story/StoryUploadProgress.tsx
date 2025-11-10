import { useEffect, useState } from 'react';
import { X, CheckCircle, Upload, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface StoryUploadProgressProps {
  isUploading: boolean;
  progress: number;
  onDismiss?: () => void;
}

export function StoryUploadProgress({ isUploading, progress, onDismiss }: StoryUploadProgressProps) {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (progress >= 100) {
      setIsComplete(true);
      // Auto-dismiss after 2 seconds
      const timer = setTimeout(() => {
        onDismiss?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [progress, onDismiss]);

  if (!isUploading && !isComplete) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="relative">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-600/10" />
        
        {/* Content */}
        <div className="relative p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              {isComplete ? (
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {isComplete ? 'Story Posted!' : 'Uploading Story...'}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {isComplete 
                  ? 'Your story is now live' 
                  : 'You can continue browsing'}
              </p>
              
              {!isComplete && (
                <div className="mt-2 space-y-1">
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {Math.round(progress)}%
                  </p>
                </div>
              )}
            </div>

            {/* Close Button */}
            {isComplete && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Animated Border */}
        {!isComplete && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-600 to-pink-600 animate-pulse" />
        )}
      </div>
    </div>
  );
}
