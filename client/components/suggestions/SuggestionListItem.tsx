import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { userService } from '../../../src/services/user.service';
import { suggestionService } from '../../../src/services/suggestion.service';
import { useAuth } from '../../contexts/AuthContext';
import type { SuggestedUser } from '../../../src/services/suggestion.service';

interface SuggestionListItemProps {
  user: SuggestedUser;
  onFollowSuccess?: () => void;
}

/**
 * List item component for displaying user suggestions
 * Used in Following/Followers lists
 */
export const SuggestionListItem = ({ user, onFollowSuccess }: SuggestionListItemProps) => {
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
        
        // Clear cache
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

  const handleClick = () => {
    navigate(`/profile/${user.username}`);
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-accent cursor-pointer transition-colors"
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={user.avatarURL} alt={user.username} />
        <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{user.displayName || user.username}</p>
        <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {user.reason}
        </p>
      </div>

      <Button
        size="sm"
        variant={isFollowing ? "outline" : "default"}
        onClick={handleFollow}
        disabled={loading}
        className="shrink-0"
      >
        {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
      </Button>
    </div>
  );
};
