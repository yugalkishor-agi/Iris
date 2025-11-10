import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/ui/verified-badge';

interface StoryReplyMessageProps {
  replyText: string;
  storyPreview?: {
    mediaURL: string;
    authorUsername: string;
    authorAvatar?: string;
    authorVerified?: boolean;
  };
}

export function StoryReplyMessage({ replyText, storyPreview }: StoryReplyMessageProps) {
  return (
    <div className="max-w-[280px]">
      {/* Story Context Card or Deleted Story Indicator */}
      {storyPreview ? (
        <div className="mb-2 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {/* Story Thumbnail */}
            <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 border border-purple-500/30">
              <img
                src={storyPreview.mediaURL}
                alt="Story"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Author Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5 border border-purple-500/30">
                  <AvatarImage src={storyPreview.authorAvatar} />
                  <AvatarFallback className="text-[8px] bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    {storyPreview.authorUsername?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                  {storyPreview.authorUsername}
                </p>
                {storyPreview.authorVerified && <VerifiedBadge size="sm" />}
              </div>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                Replied to story
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Deleted story - show grey indicator
        <div className="mb-2">
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            replied to your story
          </p>
        </div>
      )}

      {/* Reply Text */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl px-4 py-2.5 shadow-sm border border-gray-200 dark:border-gray-800">
        <p className="text-sm text-gray-900 dark:text-gray-100 break-words">
          {replyText}
        </p>
      </div>
    </div>
  );
}
