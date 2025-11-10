import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { userService } from '../../../src/services/user.service';
import { suggestionService } from '../../../src/services/suggestion.service';
import { useAuth } from '../../contexts/AuthContext';
import type { SuggestedUser } from '../../../src/services/suggestion.service';

interface SuggestionCardProps {
  user: SuggestedUser;
  compact?: boolean; // For horizontal carousel
  onFollowSuccess?: () => void;
}

/**
 * Card component for displaying user suggestions
 * Used in Discovery tab and Profile carousel
 */
export const SuggestionCard = ({ user, compact = false, onFollowSuccess }: SuggestionCardProps) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUser) return;
    
    setLoading(true);
    try {
      if (isFollowing) {
        await userService.unfollowUser(currentUser.userId, user.userId);
        setIsFollowing(false);
      } else {
        await userService.followUser(currentUser.userId, user.userId);
        setIsFollowing(true);
        
        // Clear cache so suggestions refresh
        suggestionService.clearCache(currentUser.userId);
        
        if (onFollowSuccess) {
          onFollowSuccess();
        }
      }
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/profile/${user.username}`);
  };

  if (compact) {
    // Compact card for horizontal carousel
    return (
      <div
        onClick={handleCardClick}
        className="flex flex-col items-center p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
      >
        <Avatar className="h-16 w-16 mb-2">
          <AvatarImage src={user.avatarURL} alt={user.username} />
          <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="text-center mb-2 w-full">
          <p className="font-semibold text-sm truncate">{user.displayName || user.username}</p>
          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
        </div>

        <p className="text-xs text-muted-foreground text-center mb-2 line-clamp-1">
          {user.reason}
        </p>

        <Button
          size="sm"
          variant={isFollowing ? "outline" : "default"}
          onClick={handleFollow}
          disabled={loading}
          className="w-full text-xs"
        >
          {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
        </Button>
      </div>
    );
  }

  // Full card for grid view (Discovery tab)
  return (
    <div
      onClick={handleCardClick}
      className="flex flex-col p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
    >
      <Avatar className="h-20 w-20 mx-auto mb-3">
        <AvatarImage src={user.avatarURL} alt={user.username} />
        <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="text-center mb-2">
        <p className="font-semibold truncate">{user.displayName || user.username}</p>
        <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-4 text-xs text-muted-foreground mb-2">
        <span>{user.followersCount || 0} followers</span>
      </div>

      <p className="text-xs text-muted-foreground text-center mb-3 line-clamp-2 min-h-[2.5rem]">
        {user.reason}
      </p>

      <Button
        size="sm"
        variant={isFollowing ? "outline" : "default"}
        onClick={handleFollow}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
      </Button>
    </div>
  );
};
