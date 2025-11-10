import { useUpload } from '@/contexts/UploadContext';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function GlobalUploadProgress() {
  const { isUploading, uploadProgress, uploadType } = useUpload();

  if (!isUploading) return null;

  const isComplete = uploadProgress >= 100;
  const typeLabel = uploadType === 'story' ? 'Story' : uploadType === 'glimpse' ? 'Glimpse' : 'Post';

  return (
    <div className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 border-b border-border/50 animate-fade-in">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            {isComplete ? (
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-bounce-once">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              </div>
            )}
          </div>

          {/* Text and Progress */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-foreground">
                {isComplete ? `${typeLabel} Posted!` : `Uploading ${typeLabel}...`}
              </p>
              <span className="text-xs text-muted-foreground font-medium">
                {Math.round(uploadProgress)}%
              </span>
            </div>
            
            {!isComplete && (
              <Progress value={uploadProgress} className="h-1.5" />
            )}
            
            {isComplete && (
              <p className="text-xs text-green-600 dark:text-green-400">
                ✓ Your {typeLabel.toLowerCase()} is now live
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
