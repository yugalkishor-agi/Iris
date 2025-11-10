import { useState, useEffect } from "react";
import { Button } from "./button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { userService } from "../../../src/services/user.service";

interface FollowButtonProps {
  authorId: string;
  className?: string;
}

export function FollowButton({ authorId, className = "" }: FollowButtonProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUser || currentUser.userId === authorId) return;

      try {
        const following = await userService.isFollowing(currentUser.userId, authorId);
        setIsFollowing(following);
      } catch (error) {
        console.error("Failed to check follow status:", error);
      }
    };

    checkFollowStatus();
  }, [currentUser, authorId]);

  const handleFollowToggle = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      if (isFollowing) {
        await userService.unfollowUser(currentUser.userId, authorId);
        setIsFollowing(false);
        toast({ title: "Unfollowed" });
      } else {
        await userService.followUser(currentUser.userId, authorId);
        setIsFollowing(true);
        toast({ title: "Following" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.userId === authorId) return null;
  if (isFollowing) return null; // Hide button if already following

  return (
    <Button
      size="sm"
      onClick={handleFollowToggle}
      disabled={loading}
      className={`h-7 px-3 text-xs font-semibold ${className}`}
    >
      {loading ? "..." : "Follow"}
    </Button>
  );
}
