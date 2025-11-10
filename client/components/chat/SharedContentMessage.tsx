import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { Play } from 'lucide-react';

interface SharedContentMessageProps {
  sharedContent: {
    type: 'post' | 'glimpse' | 'story';
    contentId?: string;
    id?: string;
    authorId?: string;
    username?: string;
    authorUsername?: string;
    authorAvatarURL?: string;
    coverImage?: string;
    coverImageURL?: string;
    caption?: string;
    mediaType?: 'image' | 'video';
    verified?: boolean;
  };
  message?: string;
}

export function SharedContentMessage({ sharedContent, message }: SharedContentMessageProps) {
  const navigate = useNavigate();

  // Handle different field names from backend
  const contentId = sharedContent.contentId || sharedContent.id || '';
  const authorUsername = sharedContent.username || sharedContent.authorUsername || 'User';
  const coverImage = sharedContent.coverImage || sharedContent.coverImageURL || '';
  const isVerified = sharedContent.verified || false;

  const handleClick = () => {
    if (sharedContent.type === 'post') {
      navigate(`/post/${contentId}`);
    } else if (sharedContent.type === 'glimpse') {
      navigate('/glimpses', { state: { glimpseId: contentId } });
    } else if (sharedContent.type === 'story') {
      navigate(`/story/${sharedContent.authorId}`, { state: { storyId: contentId } });
    }
  };

  return (
    <div className="max-w-[280px]">
      {message && (
        <p className="text-sm mb-2 px-1">{message}</p>
      )}
      
      <div
        onClick={handleClick}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 shadow-sm"
      >
        {/* Media Preview */}
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
          {sharedContent.mediaType === 'video' ? (
            <video
              src={coverImage}
              className="w-full h-full object-cover"
              preload="metadata"
            />
          ) : (
            <img
              src={coverImage}
              alt="Shared content"
              className="w-full h-full object-cover"
            />
          )}
          {/* Play button overlay for videos/glimpses */}
          {(sharedContent.mediaType === 'video' || sharedContent.type === 'glimpse') && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 shadow-2xl">
                <Play className="h-8 w-8 text-white fill-white" />
              </div>
            </div>
          )}
          
          {/* Gradient overlay for better text visibility */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Author Info */}
        <div className="p-3 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9 border-2 border-gray-200 dark:border-gray-700">
              <AvatarImage src={sharedContent.authorAvatarURL} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {authorUsername?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {authorUsername}
                </p>
                {isVerified && <VerifiedBadge size="sm" />}
              </div>
              {sharedContent.caption && (
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate line-clamp-1">
                  {sharedContent.caption}
                </p>
              )}
            </div>
          </div>
          
          {/* Type Badge */}
          <div className="mt-2 flex items-center gap-1.5">
            <div className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full">
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                {sharedContent.type === 'glimpse' ? '⚡ Glimpse' : sharedContent.type === 'story' ? '📖 Story' : '📸 Post'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
