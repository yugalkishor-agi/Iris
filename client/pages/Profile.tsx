import { useState, useEffect, useRef, useCallback } from "react";
import { SuggestionCarousel } from "../components/suggestions/SuggestionCarousel";
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Grid3x3, Film, Tag, Settings, Share2, BadgeCheck, Plus, UserPlus, UserCheck, MessageCircle, Camera, Loader2, Heart, Users, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUser, useFollowActions } from "@/hooks/useUser";
import { useStories } from "@/hooks/useStories";
import { postService } from "../../src/services/post.service";
import { userService } from "../../src/services/user.service";
import { mediaService } from "../../src/services/media.service";
import { glimpseService } from "../../src/services/glimpse.service";
import { storyService } from "../../src/services/story.service";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { ANONYMOUS_USER } from "@/utils/anonymizeBlocked";
import { AvatarOptionsSheet } from "@/components/profile/AvatarOptionsSheet";
import type { Highlight, User } from "../../src/types/database";

export default function Profile() {
  const { id: usernameOrId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { blockedUsers } = useBlockedUsers();
  const [activeTab, setActiveTab] = useState("posts");
  const [profileUserId, setProfileUserId] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(false);
  const [mutualFollowers, setMutualFollowers] = useState<User[]>([]);
  const [loadingMutual, setLoadingMutual] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  
  // Determine if viewing own profile
  const isOwnProfile = !usernameOrId || usernameOrId === currentUser?.username || usernameOrId === currentUser?.userId;
  
  // Load suggestions visibility preference
  useEffect(() => {
    if (currentUser && isOwnProfile) {
      const hiddenKey = `suggestions_hidden_${currentUser.userId}`;
      const hidden = localStorage.getItem(hiddenKey);
      setSuggestionsVisible(hidden !== 'true');
    }
  }, [currentUser, isOwnProfile]);
  
  // Fetch user data - hook will handle username or userId
  const { user: profileUser, loading: userLoading } = useUser(usernameOrId || currentUser?.userId || '');
  
  // Check if this user is blocked
  const isBlockedUser = profileUser && blockedUsers.includes(profileUser.userId);
  
  // Load mutual followers (people current user follows who also follow this profile)
  useEffect(() => {
    const loadMutualFollowers = async () => {
      if (!currentUser || !profileUser || isOwnProfile || isBlockedUser) {
        setMutualFollowers([]);
        return;
      }
      
      try {
        setLoadingMutual(true);
        
        // Get current user's following list
        const myFollowing = await userService.getFollowing(currentUser.userId);
        
        // Get profile user's followers
        const profileFollowers = await userService.getFollowers(profileUser.userId);
        
        // Find mutual followers (people I follow who follow this profile)
        const mutualIds = myFollowing.filter(id => profileFollowers.includes(id));
        
        // Get top 3 mutual followers details
        const mutualUsers = await Promise.all(
          mutualIds.slice(0, 3).map(id => userService.getUser(id))
        );
        
        setMutualFollowers(mutualUsers.filter(u => u !== null) as User[]);
      } catch (error) {
        console.error('Error loading mutual followers:', error);
      } finally {
        setLoadingMutual(false);
      }
    };
    
    loadMutualFollowers();
  }, [currentUser, profileUser, isOwnProfile, isBlockedUser]);

  // Display anonymous profile if user is blocked
  const displayUser = isBlockedUser ? ANONYMOUS_USER : profileUser;

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const handleAvatarUpload = async () => {
    if (!currentUser || !selectedImage || !croppedAreaPixels) return;

    setUploadingAvatar(true);
    try {
      // Create cropped image blob
      const croppedBlob = await createCroppedImage(selectedImage, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });

      // Upload to Supabase
      const avatarURL = await mediaService.uploadAvatar(currentUser.userId, croppedFile);
      
      // Update user profile in Firestore
      await userService.updateUser(currentUser.userId, {
        avatarURL,
      });

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully",
      });

      // Reload page to show new avatar
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentUser || !profileUser?.avatarURL) return;

    setUploadingAvatar(true);
    try {
      // Delete avatar from Supabase
      await mediaService.deleteAvatar(profileUser.avatarURL);
      
      // Update user profile in Firestore to remove avatarURL
      await userService.updateUser(currentUser.userId, {
        avatarURL: '',
      });

      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed",
      });

      // Reload page to show changes
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove profile picture",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  // Fetch user's posts
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  
  // Fetch user's stories/glimpses (24hr stories - not used for glimpses tab)
  const { stories: userStories, loading: storiesLoading } = useStories(profileUserId);
  
  // Fetch user's glimpses (permanent reels)
  const [userGlimpses, setUserGlimpses] = useState<any[]>([]);
  const [glimpsesLoading, setGlimpsesLoading] = useState(true);
  
  // Fetch tagged posts
  const [taggedPosts, setTaggedPosts] = useState<any[]>([]);
  const [taggedGlimpses, setTaggedGlimpses] = useState<any[]>([]);
  const [taggedLoading, setTaggedLoading] = useState(true);
  
  // Following state - MUST be declared before any conditional returns
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasRequestedFollow, setHasRequestedFollow] = useState(false);
  
  // Check if account is private and user can view content
  const canViewContent = isOwnProfile || !profileUser?.isPrivate || isFollowing;
  
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!profileUserId) return;
      
      try {
        setPostsLoading(true);
        const posts = await postService.getUserPosts(profileUserId);
        setUserPosts(posts.posts);
      } catch (error: any) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setPostsLoading(false);
      }
    };
    
    fetchUserPosts();
  }, [profileUserId]);
  
  // Fetch user's glimpses
  useEffect(() => {
    const fetchUserGlimpses = async () => {
      if (!profileUserId) return;
      
      try {
        setGlimpsesLoading(true);
        const glimpses = await glimpseService.getUserGlimpses(profileUserId, 50);
        setUserGlimpses(glimpses);
      } catch (error: any) {
        console.error('Failed to fetch glimpses:', error);
        setUserGlimpses([]);
      } finally {
        setGlimpsesLoading(false);
      }
    };
    
    fetchUserGlimpses();
  }, [profileUserId]);
  
  // Fetch tagged posts and glimpses
  useEffect(() => {
    const fetchTaggedContent = async () => {
      if (!profileUserId || !profileUser?.username) return;
      
      try {
        setTaggedLoading(true);
        
        // Get posts where user is tagged
        const { posts: photoTagged } = await postService.getPostsByTaggedUser(profileUserId);
        const { posts: mentionedPosts } = await postService.getPostsByMention(profileUser.username);
        const allTaggedPosts = [...(photoTagged || []), ...(mentionedPosts || [])];
        const uniquePosts = Array.from(
          new Map(allTaggedPosts.map(post => [post.postId, post])).values()
        );
        uniquePosts.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });
        setTaggedPosts(uniquePosts);
        
        // Get glimpses where user is tagged
        const taggedGlimpsesData = await glimpseService.getGlimpsesByTaggedUser(profileUserId);
        setTaggedGlimpses(taggedGlimpsesData || []);
      } catch (error: any) {
        console.error('Failed to fetch tagged content:', error);
        setTaggedPosts([]);
        setTaggedGlimpses([]);
      } finally {
        setTaggedLoading(false);
      }
    };
    
    if (profileUser?.username) {
      fetchTaggedContent();
    }
  }, [profileUserId, profileUser]);
  
  // Load highlights
  useEffect(() => {
    const loadHighlights = async () => {
      if (!profileUserId) return;
      
      try {
        setHighlightsLoading(true);
        const userHighlights = await storyService.getUserHighlights(profileUserId);
        setHighlights(userHighlights);
      } catch (error) {
        console.error('Failed to load highlights:', error);
      } finally {
        setHighlightsLoading(false);
      }
    };
    
    loadHighlights();
  }, [profileUserId]);
  
  useEffect(() => {
    if (profileUser) {
      setProfileUserId(profileUser.userId);
    } else if (!usernameOrId && currentUser) {
      setProfileUserId(currentUser.userId);
    }
  }, [profileUser, usernameOrId, currentUser]);

  const { followUser, unfollowUser, following: followActionLoading } = useFollowActions();
  
  // Check if current user is following this profile and if there's a pending request
  useEffect(() => {
    const checkFollowing = async () => {
      if (!currentUser || !profileUser || isOwnProfile) return;
      
      try {
        const followingList = await userService.getFollowing(currentUser.userId);
        const following = followingList.includes(profileUser.userId);
        setIsFollowing(following);
        
        // Check for pending follow request if account is private
        if (profileUser.isPrivate && !following) {
          const requested = await userService.hasRequestedFollow(currentUser.userId, profileUser.userId);
          setHasRequestedFollow(requested);
        }
      } catch (error) {
        console.error('Failed to check following status:', error);
        setIsFollowing(false);
        setHasRequestedFollow(false);
      }
    };
    checkFollowing();
  }, [currentUser, profileUser, isOwnProfile]);
  
  const handleFollow = async () => {
    if (!currentUser || !profileUser || followActionLoading) return;
    
    try {
      if (isFollowing) {
        // Unfollow
        await unfollowUser(profileUser.userId);
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You unfollowed ${profileUser.displayName}`,
        });
      } else if (hasRequestedFollow) {
        // Cancel follow request
        await userService.cancelFollowRequest(currentUser.userId, profileUser.userId);
        setHasRequestedFollow(false);
        toast({
          title: "Request Cancelled",
          description: "Follow request cancelled",
        });
      } else {
        // Follow or send request
        if (profileUser.isPrivate) {
          // Send follow request for private accounts
          await userService.sendFollowRequest(currentUser.userId, profileUser.userId);
          setHasRequestedFollow(true);
          toast({
            title: "Request Sent",
            description: `Follow request sent to ${profileUser.displayName}`,
          });
        } else {
          // Directly follow public accounts
          await followUser(profileUser.userId);
          setIsFollowing(true);
          toast({
            title: "Following",
            description: `You are now following ${profileUser.displayName}`,
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to follow/unfollow:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive",
      });
    }
  };
  
  if (userLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  
  if (!profileUser) {
    return (
      <EmptyState
        icon={UserPlus}
        title="User not found"
        description="This profile doesn't exist"
      />
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Profile Header */}
      <div className="p-4 space-y-4">
        {/* Avatar and Stats */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar 
              className="h-24 w-24 border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity"
              onClick={isOwnProfile ? () => fileInputRef.current?.click() : undefined}
            >
              <AvatarImage src={profileUser.avatarURL} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {profileUser.displayName?.[0] || profileUser.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            {/* Camera button for own profile */}
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setShowAvatarOptions(true)}
                className="absolute bottom-0 right-0 h-8 w-8 bg-primary rounded-full flex items-center justify-center border-2 border-background hover:bg-primary/90 transition-colors z-10"
                disabled={uploadingAvatar}
              >
                <Camera className="h-4 w-4 text-primary-foreground" />
              </button>
            )}
            {/* Verification Badge */}
            {profileUser.verified && (
              <div className="absolute top-0 right-0 bg-primary rounded-full p-1">
                <BadgeCheck className="h-5 w-5 text-white fill-primary" />
              </div>
            )}
          </div>

          {/* Gallery input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (!file.type.startsWith('image/')) {
                  toast({
                    title: "Invalid file",
                    description: "Please select an image file",
                    variant: "destructive",
                  });
                  return;
                }

                if (file.size > 5 * 1024 * 1024) {
                  toast({
                    title: "File too large",
                    description: "Please select an image smaller than 5MB",
                    variant: "destructive",
                  });
                  return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                  setSelectedImage(event.target?.result as string);
                  setSelectedFile(file);
                  setShowCropModal(true);
                };
                reader.readAsDataURL(file);
              }
              e.target.value = '';
            }}
            className="hidden"
          />

          {/* Camera input */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (!file.type.startsWith('image/')) {
                  toast({
                    title: "Invalid file",
                    description: "Please select an image file",
                    variant: "destructive",
                  });
                  return;
                }

                if (file.size > 5 * 1024 * 1024) {
                  toast({
                    title: "File too large",
                    description: "Please select an image smaller than 5MB",
                    variant: "destructive",
                  });
                  return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                  setSelectedImage(event.target?.result as string);
                  setSelectedFile(file);
                  setShowCropModal(true);
                };
                reader.readAsDataURL(file);
              }
              e.target.value = '';
            }}
            className="hidden"
          />

          <div className="flex-1 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold">{profileUser?.stats?.postsCount || 0}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
            {canViewContent ? (
              <Link to={`/followers/${profileUser.username || profileUser.userId}`} className="hover:opacity-70 transition-opacity">
                <div className="text-xl font-bold">{(profileUser?.stats?.followersCount || 0) >= 1000 ? `${((profileUser?.stats?.followersCount || 0) / 1000).toFixed(1)}K` : (profileUser?.stats?.followersCount || 0)}</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </Link>
            ) : (
              <div>
                <div className="text-xl font-bold">{(profileUser?.stats?.followersCount || 0) >= 1000 ? `${((profileUser?.stats?.followersCount || 0) / 1000).toFixed(1)}K` : (profileUser?.stats?.followersCount || 0)}</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </div>
            )}
            {canViewContent ? (
              <Link to={`/following/${profileUser.username || profileUser.userId}`} className="hover:opacity-70 transition-opacity">
                <div className="text-xl font-bold">{profileUser?.stats?.followingCount || 0}</div>
                <div className="text-xs text-muted-foreground">Following</div>
              </Link>
            ) : (
              <div>
                <div className="text-xl font-bold">{profileUser?.stats?.followingCount || 0}</div>
                <div className="text-xs text-muted-foreground">Following</div>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{profileUser.displayName}</span>
            {profileUser.verified && <VerifiedBadge size="md" />}
          </div>
          {profileUser.bio && profileUser.bio.trim() && (
            <div className="text-sm">{profileUser.bio}</div>
          )}
          {profileUser.website && (
            <a href={profileUser.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block">
              {profileUser.website.replace('https://', '')}
            </a>
          )}
          
          {/* Followed By - Compact inline style */}
          {!isOwnProfile && !isBlockedUser && mutualFollowers.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              {/* Small overlapping avatars */}
              <div className="flex -space-x-2">
                {mutualFollowers.map((follower, index) => (
                  <Link
                    key={follower.userId}
                    to={`/profile/${follower.username}`}
                    className="relative inline-block group/avatar"
                    style={{ zIndex: mutualFollowers.length - index }}
                  >
                    <Avatar className="h-5 w-5 border-2 border-background group-hover/avatar:scale-110 group-hover/avatar:border-primary/50 transition-all duration-200 shadow-sm">
                      <AvatarImage src={follower.avatarURL} alt={follower.username} />
                      <AvatarFallback className="text-[9px] font-semibold">
                        {follower.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                ))}
              </div>
              
              {/* Compact text */}
              <div className="text-[12px] leading-tight">
                <span className="text-muted-foreground">Followed by </span>
                <Link 
                  to={`/profile/${mutualFollowers[0].username}`}
                  className="font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {mutualFollowers[0].username}
                </Link>
                {mutualFollowers.length === 2 && (
                  <>
                    <span className="text-muted-foreground"> and </span>
                    <Link 
                      to={`/profile/${mutualFollowers[1].username}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {mutualFollowers[1].username}
                    </Link>
                  </>
                )}
                {mutualFollowers.length > 2 && (
                  <span className="text-muted-foreground"> + {mutualFollowers.length - 1} more</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Story Highlights */}
        {(highlights.length > 0 || isOwnProfile) && (
          <div className="px-4 py-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4">
              {/* Actual Highlights */}
              {highlights.map((highlight) => (
                <Link 
                  key={highlight.highlightId}
                  to={`/highlight/${highlight.highlightId}`} 
                  className="flex flex-col items-center gap-1.5 flex-shrink-0"
                >
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-2 border-primary p-0.5">
                      <Avatar className="h-full w-full">
                        <AvatarImage src={highlight.coverImageURL} className="object-cover" />
                        <AvatarFallback className="bg-muted">
                          <Film className="h-6 w-6 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <span className="text-xs text-center max-w-[70px] truncate font-medium">
                    {highlight.title || highlight.name}
                  </span>
                </Link>
              ))}
              
              {/* Add New Highlight - Only on own profile */}
              {isOwnProfile && (
                <Link to="/story-highlights" className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary transition-colors">
                    <Plus className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <span className="text-xs text-muted-foreground">New</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isOwnProfile ? (
          <>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link to="/profile/edit">Edit Profile</Link>
              </Button>
              <Button 
                variant="outline"
                size="icon"
                onClick={() => {
                  const newState = !suggestionsVisible;
                  setSuggestionsVisible(newState);
                  const hiddenKey = `suggestions_hidden_${currentUser?.userId}`;
                  localStorage.setItem(hiddenKey, String(!newState));
                  // Dispatch custom event to notify SuggestionCarousel
                  window.dispatchEvent(new CustomEvent('suggestionsToggle', { detail: { visible: newState } }));
                }}
                title={suggestionsVisible ? 'Hide Suggestions' : 'Show Suggestions'}
              >
                {suggestionsVisible ? <Users className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Suggestion Carousel - Only on own profile */}
            {profileUser && <SuggestionCarousel userId={profileUser.userId} />}
          </>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={handleFollow}
              className="flex-1"
              variant={isFollowing ? "outline" : hasRequestedFollow ? "secondary" : "default"}
              disabled={followActionLoading}
            >
              {followActionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isFollowing ? (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Following
                </>
              ) : hasRequestedFollow ? (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Requested
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Follow
                </>
              )}
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to={`/chat/${profileUserId}`}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Link>
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Private Account Message */}
      {!canViewContent && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
          <div className="p-6 bg-muted rounded-full">
            <svg className="h-16 w-16 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">This Account is Private</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Follow this account to see their photos, videos, and glimpses.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {canViewContent && (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="sticky top-14 bg-background z-10 border-y">
          <TabsList className="w-full grid grid-cols-3 rounded-none h-12">
            <TabsTrigger value="posts" className="gap-2">
              <Grid3x3 className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="glimpses" className="gap-2">
              <Film className="h-4 w-4" />
              Glimpses
            </TabsTrigger>
            <TabsTrigger value="tagged" className="gap-2">
              <Tag className="h-4 w-4" />
              Tagged
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Posts Grid */}
        <TabsContent value="posts" className="mt-0">
          {postsLoading ? (
            <div className="grid grid-cols-3 gap-1">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse" />
              ))}
            </div>
          ) : userPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {userPosts.map((post, index) => (
                <Link
                  key={post.postId}
                  to={`/p/${post.postId}/${profileUser?.username || ''}`}
                  state={{ posts: userPosts, initialIndex: index }}
                  className="relative aspect-square group overflow-hidden bg-muted"
                >
                  <img
                    src={post.thumbnailURL || post.mediaURLs[0]}
                    alt="post"
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = post.mediaURLs[0];
                      console.error('Failed to load thumbnail, trying full image');
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-4 text-white">
                      <div className="flex items-center gap-1">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold">{post.stats.likesCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold">{post.stats.commentsCount}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Grid3x3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          )}
        </TabsContent>

        {/* Glimpses Grid */}
        <TabsContent value="glimpses" className="mt-0">
          {glimpsesLoading ? (
            <div className="grid grid-cols-3 gap-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[9/16] bg-muted animate-pulse" />
              ))}
            </div>
          ) : userGlimpses.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {userGlimpses.map((glimpse, index) => (
                <button
                  key={glimpse.glimpseId}
                  onClick={() => navigate('/glimpses', { 
                    state: { 
                      userId: profileUserId, 
                      username: profileUser?.username,
                      initialIndex: index 
                    } 
                  })}
                  className="relative aspect-[9/16] group overflow-hidden bg-muted cursor-pointer"
                >
                  <img
                    src={glimpse.coverImageURL || glimpse.mediaURL}
                    alt="glimpse"
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to mediaURL if cover fails to load
                      e.currentTarget.src = glimpse.mediaURL;
                    }}
                  />
                  <div className="absolute top-2 left-2">
                    <Film className="h-4 w-4 text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold">{glimpse.stats?.viewsCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold">{glimpse.stats?.likesCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Film className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No glimpses yet</p>
              {isOwnProfile && (
                <Button asChild className="mt-4" variant="outline">
                  <Link to="/glimpse-create">Create Glimpse</Link>
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* Tagged Grid - Shows both Posts and Glimpses */}
        <TabsContent value="tagged" className="mt-0">
          {taggedLoading ? (
            <div className="grid grid-cols-3 gap-1">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse" />
              ))}
            </div>
          ) : (taggedPosts.length > 0 || taggedGlimpses.length > 0) ? (
            <div className="grid grid-cols-3 gap-1">
              {/* Tagged Glimpses */}
              {taggedGlimpses.map((glimpse) => (
                <Link
                  key={glimpse.glimpseId}
                  to={`/glimpses/${glimpse.glimpseId}`}
                  state={{ glimpses: taggedGlimpses, initialIndex: taggedGlimpses.findIndex(g => g.glimpseId === glimpse.glimpseId) }}
                  className="relative aspect-square overflow-hidden bg-black group"
                >
                  <img
                    src={glimpse.coverImageURL || glimpse.mediaURL}
                    alt="tagged glimpse"
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute top-2 right-2">
                    <Film className="h-4 w-4 text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-sm font-semibold flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      {glimpse.stats?.likesCount || 0}
                    </div>
                  </div>
                </Link>
              ))}
              
              {/* Tagged Posts */}
              {taggedPosts.map((item) => (
                <Link
                  key={item.postId}
                  to={`/post/${item.postId}`}
                  className="relative aspect-square overflow-hidden bg-muted group"
                >
                  <img
                    src={item.mediaURLs[0]}
                    alt="tagged post"
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-sm font-semibold flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      {item.likesCount || 0}
                      <MessageCircle className="h-4 w-4 ml-2" />
                      {item.commentsCount || 0}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Tag className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No tagged content yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    )}

    {/* Crop Modal */}
    <Sheet open={showCropModal} onOpenChange={setShowCropModal}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Crop Profile Picture</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 relative bg-black rounded-lg overflow-hidden my-4">
          {selectedImage && (
            <Cropper
              image={selectedImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <SheetFooter className="flex flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowCropModal(false);
                setSelectedImage(null);
                setSelectedFile(null);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setCroppedAreaPixels(null);
              }}
              disabled={uploadingAvatar}
            >
              Discard
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setShowCropModal(false);
                handleAvatarUpload();
              }}
              disabled={uploadingAvatar || !croppedAreaPixels}
            >
              Upload
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Avatar Options Sheet */}
      <AvatarOptionsSheet
        open={showAvatarOptions}
        onOpenChange={setShowAvatarOptions}
        onCameraSelect={() => cameraInputRef.current?.click()}
        onGallerySelect={() => fileInputRef.current?.click()}
        onRemove={handleRemoveAvatar}
        hasAvatar={!!profileUser?.avatarURL}
      />

      {/* Uploading Popup */}
      {uploadingAvatar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Uploading...</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we update your profile picture
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
