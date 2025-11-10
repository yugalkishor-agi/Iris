import { useState, useEffect, useRef, useCallback } from "react";
import { StoryRing } from "@/components/feed/StoryRing";
import PostCard from "@/components/feed/PostCard";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle, TrendingUp, RefreshCw, Loader2, Users, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useFeed, usePostActions } from "@/hooks/usePost";
import { useAuth } from "@/contexts/AuthContext";
import { useStories } from "@/hooks/useStories";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { filterBlockedPosts } from "@/utils/anonymizeBlocked";
import { storyService } from "../../src/services/story.service";
import { glimpseService } from "../../src/services/glimpse.service";
import { GlobalUploadProgress } from "@/components/story/GlobalUploadProgress";

// Removed hardcoded mock users - will use real stories from backend

export default function Home() {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [momentsUsers, setMomentsUsers] = useState<any[]>([]);
  const [loadingMoments, setLoadingMoments] = useState(true);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const { posts: feedPosts, loading: isLoading, error } = useFeed(page);
  const { likePost, unlikePost } = usePostActions();
  const { user } = useAuth();
  const { toast } = useToast();
  const { blockedUsers } = useBlockedUsers();
  
  // Filter out blocked users from feed
  const posts = filterBlockedPosts(feedPosts, blockedUsers);
  const navigate = useNavigate();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // Load user's liked posts and glimpses when feed loads
  useEffect(() => {
    const loadLikedContent = async () => {
      if (!user || posts.length === 0) return;
      
      try {
        const { postService } = await import('../../src/services/post.service');
        const { glimpseService } = await import('../../src/services/glimpse.service');
        
        // Separate posts and glimpses
        const regularPosts = posts.filter(p => (p as any).postType !== 'glimpse');
        const glimpses = posts.filter(p => (p as any).postType === 'glimpse');
        
        // Get liked posts
        const postIds = regularPosts.map(p => p.postId);
        const likedPostIds = postIds.length > 0 
          ? await postService.getUserLikedPosts(user.userId, postIds)
          : [];
        
        // Get liked glimpses
        const glimpseIds = glimpses.map(p => p.postId);
        const likedGlimpseIds = glimpseIds.length > 0
          ? await glimpseService.getUserLikedGlimpses(user.userId, glimpseIds)
          : [];
        
        // Combine both
        setLikedPosts(new Set([...likedPostIds, ...likedGlimpseIds]));
      } catch (error) {
        console.error('Failed to load liked content:', error);
      }
    };

    loadLikedContent();
  }, [user, posts]);

  // Reload stories when page becomes visible (after viewing stories)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('🔄 Page visible again, reloading stories...');
        // Trigger reload by incrementing trigger
        setReloadTrigger(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Also reload when navigating back (using focus event)
  useEffect(() => {
    const handleFocus = async () => {
      if (user && feedPosts.length > 0) {
        console.log('🔄 Window focused, reloading stories and liked state...');
        setReloadTrigger(prev => prev + 1);
        
        // Refresh liked state when returning to page
        try {
          const { postService } = await import('../../src/services/post.service');
          const posts = feedPosts.filter((p: any) => p.postType !== 'glimpse');
          const glimpses = feedPosts.filter((p: any) => p.postType === 'glimpse');
          
          const postIds = posts.map(p => p.postId);
          const glimpseIds = glimpses.map(p => p.postId);
          
          const likedPostIds = postIds.length > 0 
            ? await postService.getUserLikedPosts(user.userId, postIds)
            : [];
          
          let likedGlimpseIds: string[] = [];
          if (glimpseIds.length > 0) {
            likedGlimpseIds = await glimpseService.getUserLikedGlimpses(user.userId, glimpseIds);
          }
          
          const allLikedIds = [...likedPostIds, ...likedGlimpseIds];
          setLikedPosts(new Set(allLikedIds));
        } catch (error) {
          console.error('Failed to refresh liked state:', error);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, feedPosts]);

  // Load moments/stories from following users
  useEffect(() => {
    const loadMoments = async () => {
      if (!user) return;
      try {
        setLoadingMoments(true);
        
        // Get stories from following users
        const followingStories = await storyService.getFollowingStories(user.userId);
        
        // Get current user's stories
        const myStories = await storyService.getUserActiveStories(user.userId);
        
        // Combine all stories
        const stories = [...myStories, ...followingStories];
        
        // Group stories by author
        const userStories: {[key: string]: any} = {};
        stories.forEach((story: any) => {
          if (!userStories[story.authorId]) {
            userStories[story.authorId] = {
              userId: story.authorId,
              username: story.authorUsername,
              avatarURL: story.authorAvatarURL,
              hasActiveStory: true,
              hasViewedAll: false,
              isCurrentUser: story.authorId === user.userId,
              isCloseFriendsStory: false, // Will be set to true if any story is close friends
            };
          }
          // Check if any story from this author is close friends
          if (story.audience === 'closeFriends') {
            userStories[story.authorId].isCloseFriendsStory = true;
          }
        });
        
        // Check if user has viewed all stories from each author
        const authorsToCheck = Object.keys(userStories);
        await Promise.all(
          authorsToCheck.map(async (authorId) => {
            const hasViewedAll = await storyService.hasViewedAllStoriesFrom(authorId, user.userId);
            console.log(`📊 User ${authorId} - Has viewed all:`, hasViewedAll);
            userStories[authorId].hasViewedAll = hasViewedAll;
          })
        );
        
        // Preload story media for instant loading
        console.log('📸 Preloading story media for cache...');
        stories.forEach((story: any) => {
          if (story.mediaURL) {
            const img = new Image();
            img.src = story.mediaURL;
          }
          if (story.thumbnailURL && story.thumbnailURL !== story.mediaURL) {
            const thumb = new Image();
            thumb.src = story.thumbnailURL;
          }
        });
        
        // Check if current user has viewed their own stories
        const userHasStory = stories.some((s: any) => s.authorId === user.userId);
        const hasViewedOwnStories = userHasStory 
          ? await storyService.hasViewedAllStoriesFrom(user.userId, user.userId)
          : false; // Default to false so ring shows colorful for own unviewed stories
        
        console.log('🎯 Own stories viewed:', hasViewedOwnStories, 'Has story:', userHasStory);
        
        // Add current user if they have stories
        const myCloseFriendsStory = myStories.some((s: any) => s.audience === 'closeFriends');
        const currentUserData = {
          userId: user.userId,
          username: user.username,
          avatarURL: user.avatarURL,
          hasActiveStory: userHasStory,
          hasViewedAll: hasViewedOwnStories,
          isCurrentUser: true,
          isCloseFriendsStory: myCloseFriendsStory,
        };
        
        // Add current user
        const allUsers = [
          currentUserData,
          ...Object.values(userStories).filter((u: any) => u.userId !== user.userId)
        ];
        
        setMomentsUsers(allUsers);
      } catch (error) {
        console.error('Failed to load moments:', error);
      } finally {
        setLoadingMoments(false);
      }
    };
    
    loadMoments();
  }, [user, reloadTrigger]); // Added reloadTrigger to dependencies

  // Memoized load more function to prevent infinite loops
  const loadMorePosts = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);
    
    // Simulate loading more posts
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if we have more posts (in real scenario, check backend response)
    if (feedPosts.length >= 50) {
      setHasMore(false);
    } else {
      setPage(prev => prev + 1);
    }
    
    setIsLoadingMore(false);
    isLoadingRef.current = false;
  }, [hasMore, feedPosts.length]);

  // Infinite scroll observer
  useEffect(() => {
    if (isLoading || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && feedPosts.length > 0 && !isLoadingRef.current) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoading, hasMore, loadMorePosts]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    
    // Wait a bit for the feed to reload
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Feed refreshed",
        description: "You're all caught up!",
      });
    }, 1000);
  };

  const handlePostLike = async (postId: string, isLiked: boolean, postType?: string) => {
    try {
      // Route to correct service based on content type
      if (postType === 'glimpse') {
        if (isLiked) {
          await glimpseService.unlikeGlimpse(postId, user!.userId);
          setLikedPosts(prev => {
            const next = new Set(prev);
            next.delete(postId);
            return next;
          });
        } else {
          await glimpseService.likeGlimpse(postId, user!.userId);
          setLikedPosts(prev => new Set(prev).add(postId));
        }
      } else {
        // Regular post
        if (isLiked) {
          await unlikePost(postId);
          setLikedPosts(prev => {
            const next = new Set(prev);
            next.delete(postId);
            return next;
          });
        } else {
          await likePost(postId);
          setLikedPosts(prev => new Set(prev).add(postId));
        }
      }
    } catch (error: any) {
      console.error('Failed to like/unlike:', error);
      console.error('Error details:', { postId, isLiked, postType, message: error.message });
      toast({
        title: "Error",
        description: error.message || "Failed to update like status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        {/* Stories Row */}
        <div className="px-4 py-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* Posts Skeleton */}
        <section className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border-b pb-4">
              <div className="px-4 py-3 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="w-full aspect-square" />
              <div className="px-4 py-3 space-y-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </section>
      </div>
    );
  }

  if (posts.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-fade-in">
        <div className="p-6 bg-primary/10 rounded-full mb-4">
          <TrendingUp className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Follow people to see their posts in your feed
        </p>
        <Button asChild>
          <Link to="/search">
            Discover People
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in relative">
      {/* Refresh Button */}
      <div className="fixed top-16 right-4 z-40">
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-full shadow-lg"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Moments Section */}
      <section className="px-4 pt-4 pb-2 border-b">
        <div className="flex items-center justify-between mb-3 -mt-0.5">
          <h2 className="text-base font-bold border border-border rounded-lg px-3 py-1">Moments</h2>
        </div>
        
        {loadingMoments ? (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-1 pt-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : momentsUsers.length === 1 && momentsUsers[0].isCurrentUser && !momentsUsers[0].hasActiveStory ? (
          // Only show current user if no one else has stories
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-1 pt-1">
            <button
              onClick={() => navigate('/moment-create')}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div className="relative">
                <Avatar className="h-16 w-16 ring-2 ring-border">
                  <AvatarImage src={user?.avatarURL} />
                  <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 h-5 w-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                  <Plus className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>
              <span className="text-xs max-w-[48px] truncate">Your Mo...</span>
            </button>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-1 pt-1">
            {momentsUsers.map((momentUser) => (
              <button
                key={momentUser.userId}
                onClick={() => {
                  if (momentUser.isCurrentUser && !momentUser.hasActiveStory) {
                    navigate('/moment-create');
                  } else {
                    navigate(`/story/${momentUser.userId}`);
                  }
                }}
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <div className="relative">
                  {/* Gradient Ring for Active Stories */}
                  {momentUser.hasActiveStory && (
                    <div className={`absolute -inset-[4px] rounded-full p-[4px] ${
                      momentUser.hasViewedAll 
                        ? 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600'
                        : momentUser.isCloseFriendsStory
                        ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-400'
                        : 'bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400'
                    }`}>
                      <div className="h-full w-full rounded-full bg-background" />
                    </div>
                  )}
                  
                  <Avatar className={`h-16 w-16 relative z-10 ${
                    momentUser.hasActiveStory 
                      ? 'ring-[2.5px] ring-transparent' 
                      : 'ring-2 ring-border'
                  }`}>
                    <AvatarImage src={momentUser.avatarURL} />
                    <AvatarFallback>{momentUser.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  {/* Only show + button if current user AND no active story */}
                  {momentUser.isCurrentUser && !momentUser.hasActiveStory && (
                    <div className="absolute bottom-0 right-0 h-5 w-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                      <Plus className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <span className="text-xs max-w-[48px] truncate">
                  {momentUser.isCurrentUser ? 'Your Mo...' : momentUser.username}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Upload Progress - Shows above feed when uploading */}
      <GlobalUploadProgress />

      {/* Posts Feed */}
      <section className="space-y-4 pb-20">
        {posts.length > 0 ? (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.postId}
                postId={post.postId}
                postType={(post as any).postType === 'glimpse' ? 'glimpse' : 'post'}
                mediaType={(post as any).mediaType}
                backgroundMusic={(post as any).backgroundMusic}
                user={{
                  name: post.authorUsername,
                  avatar: post.authorAvatarURL,
                  username: post.authorUsername,
                  isVerified: post.authorVerified,
                  userId: post.authorId,
                }}
                image={post.mediaURLs?.[0] || ''}
                caption={post.caption || ''}
                location={post.location}
                time={post.createdAt as any}
                likes={post.stats?.likesCount || 0}
                comments={post.stats?.commentsCount || 0}
                isLiked={likedPosts.has(post.postId)}
                onLike={() => handlePostLike(post.postId, likedPosts.has(post.postId), (post as any).postType)}
                settings={(post as any).settings}
              />
            ))}
            
            {/* Loading More */}
            {isLoadingMore && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            
            {/* Load More Trigger */}
            <div ref={loadMoreRef} className="h-4" />
                
            {/* End of Feed */}
            {!hasMore && feedPosts.length > 10 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-muted/50 rounded-full mb-3">
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">You're all caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">Check back later for more posts</p>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No posts yet"
            description="Follow people to see their posts in your feed"
            variant="colorful"
          />
        )}
      </section>
    </div>
  );
}
