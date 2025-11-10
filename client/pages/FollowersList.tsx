import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useFollowActions } from "@/hooks/useUser";
import { userService } from "../../src/services/user.service";
import { suggestionService } from "../../src/services/suggestion.service";
import { SuggestionListItem } from "../components/suggestions/SuggestionListItem";
import type { User } from "../../src/types/database";
import type { SuggestedUser } from "../../src/services/suggestion.service";
import {
  ChevronLeft,
  Search,
  ArrowUpDown,
  Check,
  UserMinus,
  Users,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOption = "default" | "name" | "recent";

export default function FollowersList() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { followUser, unfollowUser } = useFollowActions();
  
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [removingFollower, setRemovingFollower] = useState<string | null>(null);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  
  // Pagination state for followers list
  const [displayedFollowersCount, setDisplayedFollowersCount] = useState(20);
  
  // Suggestions state
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showMoreCount, setShowMoreCount] = useState(0);
  const [hasMoreSuggestions, setHasMoreSuggestions] = useState(true);

  // Load followers
  useEffect(() => {
    const loadFollowers = async () => {
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
        
        // Get followers list
        const followerIds = await userService.getFollowers(targetUserId);
        
        // Fetch user details for each follower
        const followerDetails = await Promise.all(
          followerIds.map(id => userService.getUser(id))
        );
        
        setFollowers(followerDetails.filter(u => u !== null) as User[]);
        
        // Check which ones current user is following
        if (currentUser) {
          const followingIds = await userService.getFollowing(currentUser.userId);
          setFollowingUsers(new Set(followingIds));
        }
        
        // Load suggestions after followers list loads
        if (currentUser && targetUserId) {
          loadSuggestions(targetUserId, 7, 0);
        }
      } catch (error) {
        console.error('Failed to load followers', error);
        toast({
          title: "Error",
          description: "Failed to load followers",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadFollowers();
  }, [currentUser, username]);
  
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

  const handleFollow = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      const isCurrentlyFollowing = followingUsers.has(userId);
      
      if (isCurrentlyFollowing) {
        await unfollowUser(userId);
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        await followUser(userId);
        setFollowingUsers(prev => new Set(prev).add(userId));
      }
      
      toast({
        title: isCurrentlyFollowing ? "Unfollowed" : "Following",
        description: isCurrentlyFollowing ? "You unfollowed this user" : "You are now following this user",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (userId: string) => {
    if (!currentUser) return;
    
    if (!confirm("Remove this follower? They won't be notified.")) return;
    
    try {
      setRemovingFollower(userId);
      // Remove follower by unfollowing from their side
      await userService.unfollowUser(userId, currentUser.userId);
      
      setFollowers(prev => prev.filter(u => u.userId !== userId));
      
      toast({
        title: "Follower removed",
        description: "This user no longer follows you",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove follower",
        variant: "destructive",
      });
    } finally {
      setRemovingFollower(null);
    }
  };

  const sortedFollowers = [...followers].sort((a, b) => {
    if (sortBy === "name") {
      return a.displayName.localeCompare(b.displayName);
    } else if (sortBy === "recent") {
      // Sort by createdAt if followedAt not available
      return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
    }
    return 0;
  });

  // Filter and sort followers
  const filteredFollowers = sortedFollowers
    .filter(user => 
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
  // Apply pagination only when NOT searching
  const displayedFollowers = searchQuery 
    ? filteredFollowers 
    : filteredFollowers.slice(0, displayedFollowersCount);
  
  // Check if more followers to show
  const hasMoreFollowers = !searchQuery && displayedFollowersCount < filteredFollowers.length;
  
  // Load more followers handler
  const handleLoadMoreFollowers = () => {
    setDisplayedFollowersCount(prev => prev + 20);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to="/me" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold">Followers</h1>
          </div>
          
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <ArrowUpDown className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("default")}>
                {sortBy === "default" && <Check className="h-4 w-4 mr-2" />}
                <span className={sortBy === "default" ? "ml-6" : "ml-6"}>Default</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                {sortBy === "name" && <Check className="h-4 w-4 mr-2" />}
                <span className={sortBy !== "name" ? "ml-6" : ""}>Name (A-Z)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("recent")}>
                {sortBy === "recent" && <Check className="h-4 w-4 mr-2" />}
                <span className={sortBy !== "recent" ? "ml-6" : ""}>Recently Followed</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search followers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {loading ? (
          <LoadingState text="Loading followers..." />
        ) : displayedFollowers.length > 0 ? (
          <>
            <div className="divide-y">
              {displayedFollowers.map((user) => {
              const isRemoving = removingFollower === user.userId;
              const isUserFollowing = followingUsers.has(user.userId);
              const isOwnProfile = currentUser?.userId === (username || currentUser?.userId);
              
              return (
                <div key={user.userId} className="px-4 py-3 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <Link to={`/profile/${user.username}`} className="flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatarURL} />
                        <AvatarFallback>{user.displayName?.[0] || user.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${user.username}`}>
                        <div className="font-semibold hover:underline flex items-center gap-1">
                          <span className="truncate">{user.displayName}</span>
                          {user.verified && <VerifiedBadge size="sm" />}
                        </div>
                      </Link>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <span className="truncate">@{user.username}</span>
                        {user.verified && <VerifiedBadge size="sm" />}
                      </div>
                      {user.bio && (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {user.bio}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isRemoving && currentUser && user.userId !== currentUser.userId && (
                        <>
                          <Button
                            variant={isUserFollowing ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleFollow(user.userId)}
                            className="min-w-[90px]"
                          >
                            {isUserFollowing ? "Following" : "Follow Back"}
                          </Button>
                          {isOwnProfile && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleRemove(user.userId)}
                                  className="text-destructive"
                                >
                                  Remove Follower
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </>
                      )}
                      {isRemoving && (
                        <div className="text-sm text-muted-foreground">Removing...</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Show More Followers Button */}
          {hasMoreFollowers && (
            <button
              onClick={handleLoadMoreFollowers}
              className="w-full py-3 text-sm font-medium text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 border-t"
            >
              Show More Followers ({filteredFollowers.length - displayedFollowersCount} remaining)
            </button>
          )}
        </>
        ) : (
          <EmptyState
            icon={Users}
            title="No followers found"
            description={searchQuery ? "Try a different search" : "No followers yet"}
          />
        )}
        
        {/* Suggestions Section - Show at bottom after ALL followers */}
        {!loading && !searchQuery && suggestions.length > 0 && (() => {
          // Filter out users already in followers list to avoid duplicate keys
          const followerIds = new Set(followers.map(f => f.userId));
          const uniqueSuggestions = suggestions.filter(s => !followerIds.has(s.userId));
          
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
