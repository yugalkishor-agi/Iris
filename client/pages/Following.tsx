import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { ChevronLeft, Search, UserMinus, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useFollowActions } from "@/hooks/useUser";
import { userService } from "../../src/services/user.service";
import { suggestionService } from "../../src/services/suggestion.service";
import { SuggestionListItem } from "../components/suggestions/SuggestionListItem";
import type { User } from "../../src/types/database";
import type { SuggestedUser } from "../../src/services/suggestion.service";

export default function Following() {
  const { toast } = useToast();
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const { unfollowUser } = useFollowActions();
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [unfollowingUserId, setUnfollowingUserId] = useState<string | null>(null);
  
  // Pagination state for following list
  const [displayedFollowingCount, setDisplayedFollowingCount] = useState(20);
  
  // Suggestions state
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showMoreCount, setShowMoreCount] = useState(0);
  const [hasMoreSuggestions, setHasMoreSuggestions] = useState(true);

  // Load following list
  useEffect(() => {
    const loadFollowing = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        
        // If username param exists, get that user's ID first
        let targetUserId = currentUser.userId;
        if (username) {
          const targetUser = await userService.getUser(username);
          if (targetUser) {
            targetUserId = targetUser.userId;
          }
        }
        
        const followingIds = await userService.getFollowing(targetUserId);
        
        const followingDetails = await Promise.all(
          followingIds.map(id => userService.getUser(id))
        );
        
        setFollowing(followingDetails.filter(u => u !== null) as User[]);
        
        // Load suggestions after following list loads
        if (currentUser && targetUserId) {
          loadSuggestions(targetUserId, 7, 0);
        }
      } catch (error) {
        console.error('Error loading following:', error);
        toast({
          title: "Error",
          description: "Failed to load following list",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadFollowing();
  }, [currentUser, username, toast]);
  
  // Load suggestions
  const loadSuggestions = async (contextUserId: string, limit: number, offset: number) => {
    if (!currentUser) return;
    
    setLoadingSuggestions(true);
    try {
      const data = await suggestionService.getMutualSuggestions(
        currentUser.userId,
        contextUserId,
        limit
      );
      
      // Check if we got fewer suggestions than requested (no more available)
      if (data.length < limit) {
        setHasMoreSuggestions(false);
      }
      
      if (offset === 0) {
        setSuggestions(data);
        // Reset hasMore on initial load
        setHasMoreSuggestions(data.length >= limit);
      } else {
        setSuggestions(prev => [...prev, ...data]);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setHasMoreSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };
  
  // Show more suggestions
  const handleShowMore = async () => {
    if (!currentUser || !username) return;
    
    const targetUser = await userService.getUser(username);
    if (!targetUser) return;
    
    const loadCount = showMoreCount === 0 ? 4 : 6;
    await loadSuggestions(targetUser.userId, loadCount, suggestions.length);
    setShowMoreCount(prev => prev + 1);
  };

  const handleUnfollow = async (userId: string, username: string) => {
    try {
      setUnfollowingUserId(userId);
      await unfollowUser(userId);
      
      setFollowing(prev => prev.filter(u => u.userId !== userId));
      
      toast({
        title: "Unfollowed",
        description: `You unfollowed @${username}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow",
        variant: "destructive",
      });
    } finally {
      setUnfollowingUserId(null);
    }
  };

  const filteredFollowing = following.filter(u =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Apply pagination only when NOT searching
  const displayedFollowing = searchQuery 
    ? filteredFollowing 
    : filteredFollowing.slice(0, displayedFollowingCount);
  
  // Check if more following to show
  const hasMoreFollowing = !searchQuery && displayedFollowingCount < filteredFollowing.length;
  
  // Load more following handler
  const handleLoadMoreFollowing = () => {
    setDisplayedFollowingCount(prev => prev + 20);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to="/me" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold">Following</h1>
          </div>
          <span className="text-sm text-muted-foreground">{following.length}</span>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search following..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {loading ? (
          <LoadingState text="Loading following..." />
        ) : displayedFollowing.length > 0 ? (
          <>
            <div className="divide-y">
              {displayedFollowing.map((user) => {
              const isUnfollowing = unfollowingUserId === user.userId;
              
              return (
                <div key={user.userId} className="flex items-center gap-3 p-4">
                  <Link to={`/profile/${user.username}`}>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatarURL} />
                      <AvatarFallback>{user.displayName?.[0] || user.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <Link to={`/profile/${user.username}`} className="flex-1 min-w-0">
                    <div className="font-semibold hover:underline flex items-center gap-1">
                      <span className="truncate">{user.displayName}</span>
                      {user.verified && <VerifiedBadge size="sm" />}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <span className="truncate">@{user.username}</span>
                      {user.verified && <VerifiedBadge size="sm" />}
                    </div>
                    {user.bio && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{user.bio}</div>
                    )}
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnfollow(user.userId, user.username)}
                    disabled={isUnfollowing}
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    {isUnfollowing ? "Unfollowing..." : "Following"}
                  </Button>
                </div>
              );
            })}
          </div>
          
          {/* Show More Following Button */}
          {hasMoreFollowing && (
            <button
              onClick={handleLoadMoreFollowing}
              className="w-full py-3 text-sm font-medium text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 border-t"
            >
              Show More Following ({filteredFollowing.length - displayedFollowingCount} remaining)
            </button>
          )}
        </>
        ) : (
          <EmptyState
            icon={Users}
            title="No following yet"
            description={searchQuery ? "No users match your search" : "Start following people to see them here"}
          />
        )}
        
        {/* Suggestions Section - Show at bottom after ALL following */}
        {!loading && !searchQuery && suggestions.length > 0 && (() => {
          // Filter out users already in following list to avoid duplicate keys
          const followingIds = new Set(following.map(f => f.userId));
          const uniqueSuggestions = suggestions.filter(s => !followingIds.has(s.userId));
          
          if (uniqueSuggestions.length === 0) return null;
          
          return (
            <div className="mt-6">
              <div className="px-4 py-2 bg-muted/50 border-t">
                <h4 className="text-sm font-semibold text-muted-foreground">Suggested for You</h4>
              </div>
              
              <div>
                {uniqueSuggestions.map(user => (
                  <SuggestionListItem
                    key={user.userId}
                    user={user}
                    onFollowSuccess={() => {
                      // Refresh suggestions after following
                      if (currentUser && username) {
                        userService.getUser(username).then(targetUser => {
                          if (targetUser) {
                            loadSuggestions(targetUser.userId, 7, 0);
                            setShowMoreCount(0);
                          }
                        });
                      }
                    }}
                  />
                ))}
              </div>
            
              {/* Show More Button - Only show if more suggestions available */}
              {hasMoreSuggestions && (
                <button
                  onClick={handleShowMore}
                  disabled={loadingSuggestions}
                  className="w-full py-3 text-sm font-medium text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 border-t"
                >
                  {loadingSuggestions ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Show More (${showMoreCount === 0 ? 4 : 6})`
                  )}
                </button>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
