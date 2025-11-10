import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Heart } from "lucide-react";

interface ViewLikesModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

interface LikeUser {
  userId: string;
  username: string;
  displayName: string;
  avatarURL: string;
  verified?: boolean;
  isFollowing?: boolean;
}

export function ViewLikesModal({
  isOpen,
  onClose,
  postId,
}: ViewLikesModalProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [likes, setLikes] = useState<LikeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    if (isOpen) {
      loadLikes();
    }
  }, [isOpen, postId]);

  const loadLikes = async () => {
    setLoading(true);
    try {
      const { postService } = await import("../../../src/services/post.service");
      const { userService } = await import("../../../src/services/user.service");
      
      // Get users who liked the post
      const likeUsers = await postService.getPostLikes(postId);
      
      // Check if current user follows these users
      if (currentUser) {
        const followingList = await userService.getFollowing(currentUser.userId);
        const states: { [key: string]: boolean } = {};
        likeUsers.forEach((user: any) => {
          states[user.userId] = followingList.includes(user.userId);
        });
        setFollowingStates(states);
      }
      
      setLikes(likeUsers as LikeUser[]);
    } catch (error: any) {
      console.error("Failed to load likes:", error);
      toast({
        title: "Error",
        description: "Failed to load likes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser) return;

    try {
      const { userService } = await import("../../../src/services/user.service");
      
      if (followingStates[userId]) {
        await userService.unfollowUser(currentUser.userId, userId);
      } else {
        await userService.followUser(currentUser.userId, userId);
      }

      setFollowingStates((prev) => ({
        ...prev,
        [userId]: !prev[userId],
      }));

      toast({
        title: followingStates[userId] ? "Unfollowed" : "Following",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 max-h-[80vh]">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="text-center">Likes</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto">
          {loading ? (
            <div className="p-8">
              <LoadingState text="Loading likes..." />
            </div>
          ) : likes.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Heart}
                title="No likes yet"
                description="Be the first to like this post"
              />
            </div>
          ) : (
            <div className="divide-y">
              {likes.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
                >
                  <Link
                    to={`/profile/${user.username}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                    onClick={onClose}
                  >
                    <Avatar className="h-11 w-11 flex-shrink-0">
                      <AvatarImage src={user.avatarURL} />
                      <AvatarFallback>
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <div className="font-semibold text-sm truncate">
                          {user.username}
                        </div>
                        {user.verified && <VerifiedBadge size="sm" />}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {user.displayName}
                      </div>
                    </div>
                  </Link>

                  {currentUser && currentUser.userId !== user.userId && (
                    <Button
                      size="sm"
                      variant={followingStates[user.userId] ? "outline" : "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollow(user.userId);
                      }}
                      className="ml-3"
                    >
                      {followingStates[user.userId] ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
