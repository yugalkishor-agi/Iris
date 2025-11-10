import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { RefreshCw, Loader2, BadgeCheck } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "@/hooks/useSearch";
import { useAuth } from "@/contexts/AuthContext";
import { useFollowActions } from "@/hooks/useUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon, TrendingUp, Hash, MapPin, Grid3x3, Video, Play, Users, X, ArrowLeft, MessageCircle, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { User, Post } from "../../src/types/database";

type MediaFilter = "all" | "photos" | "videos" | "reels";

export default function Search() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { followUser, unfollowUser } = useFollowActions();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<MediaFilter>("all");
  const [activeTab, setActiveTab] = useState("all");
  
  // Backend integration
  const {
    loading,
    searchUsers,
    searchPosts,
    searchHashtag,
    getTrendingHashtags,
    getSuggestedUsers,
    getExplorePosts,
    saveSearch,
    getRecentSearches,
    clearRecentSearches,
  } = useSearch();
  
  const [searchResults, setSearchResults] = useState<{
    users: User[];
    posts: Post[];
  }>({ users: [], posts: [] });
  const [trendingHashtags, setTrendingHashtags] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [explorePosts, setExplorePosts] = useState<Post[]>([]);
  const [exploreGlimpses, setExploreGlimpses] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  // Load initial data and following status
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch glimpses
        const { glimpseService } = await import('../../src/services/glimpse.service');
        const glimpses = await glimpseService.getExploreGlimpses(15);
        
        const [hashtags, suggested, explore, recent] = await Promise.all([
          getTrendingHashtags(),
          getSuggestedUsers(),
          getExplorePosts(),
          Promise.resolve(getRecentSearches()),
        ]);
        
        setTrendingHashtags(hashtags);
        setSuggestedUsers(suggested);
        setExplorePosts(explore);
        setExploreGlimpses(glimpses);
        setRecentSearches(recent);
        
        // Load following status for suggested users
        if (currentUser && suggested.length > 0) {
          const { userService } = await import('../../src/services/user.service');
          const followingIds = await userService.getFollowing(currentUser.userId);
          setFollowingUsers(new Set(followingIds));
        }
      } catch (error) {
        console.error('Failed to load initial data', error);
      }
    };

    loadInitialData();
  }, [currentUser]);

  // Handle search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults({ users: [], posts: [] });
      return;
    }

    const performSearch = async () => {
      try {
        if (searchQuery.startsWith('#')) {
          // Search hashtag
          const posts = await searchHashtag(searchQuery);
          setSearchResults({ users: [], posts });
        } else {
          // Search users and posts
          const [users, posts] = await Promise.all([
            searchUsers(searchQuery),
            searchPosts(searchQuery),
          ]);
          
          // Filter out current user from results
          const filteredUsers = users.filter(user => user.userId !== currentUser?.userId);
          
          setSearchResults({ users: filteredUsers, posts });
        }
        
        // Save search
        saveSearch(searchQuery);
        setRecentSearches(getRecentSearches());
      } catch (error) {
        console.error('Search failed', error);
      }
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, currentUser]);

  const handleRefresh = async () => {
    try {
      const [hashtags, suggested, explore] = await Promise.all([
        getTrendingHashtags(),
        getSuggestedUsers(),
        getExplorePosts(),
      ]);
      
      setTrendingHashtags(hashtags);
      setSuggestedUsers(suggested);
      setExplorePosts(explore);
      
      toast({
        title: "Search refreshed",
        description: "Trending content updated!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh",
        variant: "destructive",
      });
    }
  };
  
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults({ users: [], posts: [] });
  };
  
  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const { isPulling, isRefreshing, pullDistance, pullProgress } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header with Back Button and Action Icons */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Back button and Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold">Explore</h1>
          </div>
          
          {/* Right: Discovery, Messages, Notifications */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/discovery')}
              className="p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Discover People"
            >
              <Users className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/messages')}
              className="p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Messages"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/notifications')}
              className="p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="px-4 pt-2">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search users, hashtags, glimpses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-6">
          {/* Recent Searches - Show when no search query */}
          {!searchQuery && recentSearches.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Recent</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearRecent}
                  className="text-primary hover:text-primary/80"
                >
                  Clear All
                </Button>
              </div>
              <div className="space-y-2">
                {recentSearches.map((search, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-card rounded-lg hover:bg-accent transition-colors group"
                  >
                    <button
                      onClick={() => setSearchQuery(search)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <SearchIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{search}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = recentSearches.filter((_, idx) => idx !== i);
                        setRecentSearches(updated);
                        if (currentUser) {
                          localStorage.setItem(
                            `recentSearches_${currentUser.userId}`,
                            JSON.stringify(updated)
                          );
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Search Results - Users */}
          {searchQuery && searchResults.users.length > 0 && (
            <section>
              <h2 className="font-semibold mb-3">Users</h2>
              <div className="space-y-2">
                {searchResults.users.slice(0, 3).map((user) => (
                  <Link key={user.userId} to={`/profile/${user.username}`}>
                    <div className="flex items-center gap-3 p-3 bg-card rounded-lg hover:bg-accent transition-colors">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatarURL} />
                        <AvatarFallback>{user.displayName?.[0] || user.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-sm truncate">{user.displayName}</p>
                          {user.verified && <VerifiedBadge size="sm" />}
                        </div>
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                          {user.verified && <VerifiedBadge size="sm" />}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
                {searchResults.users.length > 3 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("users")}
                  >
                    See all {searchResults.users.length} users
                  </Button>
                )}
              </div>
            </section>
          )}

          {/* Search Results - Posts */}
          {searchQuery && searchResults.posts.length > 0 && (
            <section>
              <h2 className="font-semibold mb-3">Posts</h2>
              <div className="grid grid-cols-3 gap-1">
                {searchResults.posts.slice(0, 6).map((post) => (
                  <Link
                    key={post.postId}
                    to={`/post/${post.postId}`}
                    className="relative aspect-square overflow-hidden"
                  >
                    <img
                      src={post.mediaURLs[0]}
                      alt="post"
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ))}
              </div>
              {searchResults.posts.length > 6 && (
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => setActiveTab("hashtags")}
                >
                  See all {searchResults.posts.length} posts
                </Button>
              )}
            </section>
          )}

          {/* Media Type Filters - Only show when no search */}
          {!searchQuery && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("all")}
                className="flex-shrink-0"
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                All
              </Button>
              <Button
                variant={activeFilter === "photos" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("photos")}
                className="flex-shrink-0"
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                Photos
              </Button>
              <Button
                variant={activeFilter === "videos" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("videos")}
                className="flex-shrink-0"
              >
                <Video className="h-4 w-4 mr-2" />
                Videos
              </Button>
              <Button
                variant={activeFilter === "reels" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("reels")}
                className="flex-shrink-0"
              >
                <Play className="h-4 w-4 mr-2" />
                Reels
              </Button>
            </div>
          )}

          {/* Trending Hashtags - Only show when no search */}
          {!searchQuery && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Trending Hashtags</h2>
              </div>
            <div className="space-y-2">
              {trendingHashtags.map((item, i) => (
                <Link
                  key={i}
                  to={`/hashtag/${item.tag.slice(1)}`}
                  className="flex items-center justify-between p-3 bg-card rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Hash className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{item.tag}</div>
                      <div className="text-xs text-muted-foreground">{item.postCount} posts</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            </section>
          )}

          {/* People You May Know - Only show when no search */}
          {!searchQuery && (
            <section>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">People You May Know</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {suggestedUsers.map((user) => (
                <Card key={user.userId} className="min-w-[160px] p-4 text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-2">
                    <AvatarImage src={user.avatarURL} />
                    <AvatarFallback>{user.displayName?.[0] || user.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center justify-center gap-1">
                    <div className="font-semibold text-sm truncate">{user.displayName}</div>
                    {user.verified && <VerifiedBadge size="sm" />}
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
                    {user.verified && <VerifiedBadge size="sm" />}
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">{user.stats.followersCount} followers</div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    variant={followingUsers.has(user.userId) ? "outline" : "default"}
                    onClick={async (e) => {
                      e.preventDefault();
                      if (followingUsers.has(user.userId)) {
                        await unfollowUser(user.userId);
                        setFollowingUsers(prev => {
                          const next = new Set(prev);
                          next.delete(user.userId);
                          return next;
                        });
                      } else {
                        await followUser(user.userId);
                        setFollowingUsers(prev => new Set(prev).add(user.userId));
                      }
                    }}
                  >
                    {followingUsers.has(user.userId) ? 'Following' : 'Follow'}
                  </Button>
                </Card>
              ))}
            </div>
            </section>
          )}

          {/* Explore Grid - Only show when no search */}
          {!searchQuery && (
            <section>
            <h2 className="font-semibold mb-3">Explore</h2>
            {loading ? (
              <div className="grid grid-cols-3 gap-1">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse" />
                ))}
              </div>
            ) : (explorePosts.length > 0 || exploreGlimpses.length > 0) ? (
              <div className="grid grid-cols-3 gap-1">
                {/* Mix posts and glimpses */}
                {[...explorePosts, ...exploreGlimpses]
                  .sort((a, b) => (b.stats?.likesCount || 0) - (a.stats?.likesCount || 0))
                  .slice(0, 30)
                  .map((item) => {
                    const isGlimpse = 'glimpseId' in item;
                    // For glimpses, prefer cover image, fallback to mediaURL
                    const imageUrl = isGlimpse 
                      ? (item.coverImageURL || item.mediaURL || '') 
                      : (item.mediaURLs?.[0] || '');
                    
                    return (
                      <Link
                        key={isGlimpse ? item.glimpseId : item.postId}
                        to={isGlimpse ? `/glimpses/${item.glimpseId}` : `/post/${item.postId}`}
                        className="relative aspect-square group overflow-hidden bg-muted"
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="explore"
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            onError={(e) => {
                              // Fallback to placeholder on error
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23cccccc" width="100" height="100"/%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {/* Glimpse indicator */}
                        {isGlimpse && (
                          <div className="absolute top-2 right-2">
                            <div className="p-1 bg-black/60 rounded-full">
                              <Video className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                        {/* Video indicator for posts */}
                        {!isGlimpse && item.mediaType === "video" && (
                          <div className="absolute top-2 right-2">
                            <div className="p-1 bg-black/60 rounded-full">
                              <Play className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-4 text-white">
                            <div className="flex items-center gap-1">
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-semibold">{item.stats?.likesCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            ) : (
              <EmptyState
                icon={Grid3x3}
                title="No content yet"
                description="Explore content will appear here"
              />
            )}
            </section>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          {loading ? (
            <LoadingState text="Searching users..." />
          ) : searchQuery && searchResults.users.length > 0 ? (
            <div className="space-y-3">
              {searchResults.users.map((user) => (
                <div key={user.userId} className="flex items-center justify-between p-3 bg-card rounded-lg hover:bg-accent transition-colors">
                  <Link to={`/profile/${user.username}`} className="flex items-center gap-3 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatarURL} />
                      <AvatarFallback>{user.displayName?.[0] || user.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <div className="font-semibold">{user.displayName}</div>
                        {user.verified && <VerifiedBadge size="sm" />}
                      </div>
                      <div className="text-sm text-muted-foreground">@{user.username}</div>
                      <div className="text-xs text-muted-foreground">{user.stats.followersCount} followers</div>
                    </div>
                  </Link>
                  <Button 
                    size="sm"
                    variant={followingUsers.has(user.userId) ? "outline" : "default"}
                    onClick={async (e) => {
                      e.preventDefault();
                      if (followingUsers.has(user.userId)) {
                        await unfollowUser(user.userId);
                        setFollowingUsers(prev => {
                          const next = new Set(prev);
                          next.delete(user.userId);
                          return next;
                        });
                      } else {
                        await followUser(user.userId);
                        setFollowingUsers(prev => new Set(prev).add(user.userId));
                      }
                    }}
                  >
                    {followingUsers.has(user.userId) ? 'Following' : 'Follow'}
                  </Button>
                </div>
              ))}
            </div>
          ) : suggestedUsers.length > 0 ? (
            <div className="space-y-3">
              {suggestedUsers.map((user) => (
                <div key={user.userId} className="flex items-center justify-between p-3 bg-card rounded-lg hover:bg-accent transition-colors">
                  <Link to={`/profile/${user.username}`} className="flex items-center gap-3 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatarURL} />
                      <AvatarFallback>{user.displayName?.[0] || user.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <div className="font-semibold">{user.displayName}</div>
                        {user.verified && <VerifiedBadge size="sm" />}
                      </div>
                      <div className="text-sm text-muted-foreground">@{user.username}</div>
                      <div className="text-xs text-muted-foreground">{user.stats.followersCount} followers</div>
                    </div>
                  </Link>
                  <Button 
                    size="sm"
                    variant={followingUsers.has(user.userId) ? "outline" : "default"}
                    onClick={async (e) => {
                      e.preventDefault();
                      if (followingUsers.has(user.userId)) {
                        await unfollowUser(user.userId);
                        setFollowingUsers(prev => {
                          const next = new Set(prev);
                          next.delete(user.userId);
                          return next;
                        });
                      } else {
                        await followUser(user.userId);
                        setFollowingUsers(prev => new Set(prev).add(user.userId));
                      }
                    }}
                  >
                    {followingUsers.has(user.userId) ? 'Following' : 'Follow'}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No users found"
              description="Try searching for someone"
            />
          )}
        </TabsContent>

        <TabsContent value="hashtags" className="mt-4">
          {loading ? (
            <LoadingState text="Loading hashtags..." />
          ) : trendingHashtags.length > 0 ? (
            <div className="space-y-2">
              {trendingHashtags.map((item, i) => (
                <Link
                  key={i}
                  to={`/hashtag/${item.tag.slice(1)}`}
                  className="flex items-center justify-between p-3 bg-card rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Hash className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{item.tag}</div>
                      <div className="text-xs text-muted-foreground">{item.postCount} posts</div>
                    </div>
                  </div>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Hash}
              title="No trending hashtags"
              description="Hashtags will appear as users post"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
