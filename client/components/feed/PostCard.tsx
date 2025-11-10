import { useState, useEffect, useRef, memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LikeAnimation } from "@/components/ui/like-animation";
import { SaveAnimation } from "@/components/ui/save-animation";
import { MessageCircle, Send, MoreHorizontal, MapPin, MoreVertical, Heart, Bookmark, Share2, VolumeX, Volume2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CommentDrawer } from "@/components/ui/comment-drawer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { collectionService } from "../../../src/services/collection.service";
import { ParsedCaption } from "@/utils/parseCaption";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { UserSelectorDialog } from "@/components/chat/UserSelectorDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper function to format timestamps
const formatPostTime = (timestamp: any): string => {
  if (!timestamp) return 'Just now';
  
  try {
    // Handle Firestore Timestamp
    if (typeof timestamp === 'object' && 'toDate' in timestamp) {
      const date = timestamp.toDate();
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString();
    }
    
    // Handle Date object
    if (timestamp instanceof Date) {
      const now = new Date();
      const diffMs = now.getTime() - timestamp.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      return timestamp.toLocaleDateString();
    }
    
    // Handle string
    return timestamp.toString();
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Recently';
  }
};

interface PostCardProps {
  postId: string;
  postType?: 'post' | 'glimpse'; // Add postType to identify glimpses
  mediaType?: 'image' | 'video'; // Media type for video handling
  backgroundMusic?: any; // Audio data for glimpses
  user: { name: string; avatar?: string; username?: string; isVerified?: boolean; userId?: string };
  image: string;
  caption: string;
  location?: string;
  time: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isSaved?: boolean;
  onLike?: () => void;
  onSaveChange?: (saved: boolean) => void;
  settings?: {
    allowComments?: boolean;
    allowDownload?: boolean;
    hideLikes?: boolean;
    showCaptions?: boolean;
  };
}

const PostCard = ({
  postId,
  postType,
  mediaType,
  backgroundMusic,
  user,
  image,
  caption,
  location,
  time,
  likes,
  comments,
  isLiked: initialLiked = false,
  isSaved: initialSaved = false,
  onLike,
  onSaveChange,
  settings,
}: PostCardProps) => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isSaving, setIsSaving] = useState(false);
  const [likesCount, setLikesCount] = useState(likes || 0);
  const [showCommentDrawer, setShowCommentDrawer] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update saved state if prop changes
  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  // Update liked state if prop changes
  useEffect(() => {
    setIsLiked(initialLiked);
  }, [initialLiked]);

  // Autoplay video when in viewport (for glimpses)
  useEffect(() => {
    if (postType !== 'glimpse' || mediaType !== 'video' || !videoRef.current || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {
              // Autoplay blocked or video failed to load - silently ignore
            });
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [postType, mediaType]);

  const handleLike = () => {
    if (isLiked) {
      setLikesCount(likesCount - 1);
    } else {
      setLikesCount(likesCount + 1);
      if (onLike) onLike();
    }
    setIsLiked(!isLiked);
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLiked) {
      setIsLiked(true);
      setLikesCount(likesCount + 1);
      if (onLike) onLike();
    }
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 1000);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    // Prevent navigation if this was part of a double-click
    if (e.detail === 2) return;
    
    if (postType === 'glimpse') {
      navigate(`/glimpses/${postId}`);
    } else {
      navigate(`/post/${postId}`);
    }
  };

  const handleSave = async () => {
    if (!currentUser || isSaving) return;

    try {
      setIsSaving(true);
      const newSavedState = !isSaved;

      if (newSavedState) {
        // Save post to default collection
        await collectionService.savePost(currentUser.userId, postId);
        toast({
          title: "Post saved",
          description: "Added to your saved posts",
        });
      } else {
        // Unsave post - find which collection it's in and remove
        const collections = await collectionService.getUserCollections(currentUser.userId);
        const defaultCollection = collections.find(c => c.name === 'All');
        
        if (defaultCollection) {
          await collectionService.unsavePost(currentUser.userId, postId, defaultCollection.collectionId);
        }
        
        toast({
          title: "Post removed",
          description: "Removed from saved posts",
        });
      }

      setIsSaved(newSavedState);
      if (onSaveChange) onSaveChange(newSavedState);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save post",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareToChat = async (userId: string, message?: string) => {
    if (!currentUser) return;
    
    try {
      const { messageService } = await import('../../../src/services/message.service');
      await messageService.shareContent(
        currentUser.userId,
        userId,
        postType === 'glimpse' ? 'glimpse' : 'post',
        postId,
        {
          type: postType === 'glimpse' ? 'glimpse' : 'post',
          id: postId,
          authorId: user.username || '',
          authorUsername: user.username || '',
          authorAvatarURL: user.avatar || '',
          coverImageURL: image,
          caption: caption || '',
          mediaType: mediaType || 'image',
        },
        message
      );
      
      setShowShareDialog(false);
      toast({
        title: "Shared!",
        description: `${postType === 'glimpse' ? 'Glimpse' : 'Post'} sent successfully`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
      toast({
        title: "Share failed",
        description: "Failed to share content",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-card rounded-3xl border border-border/50 p-4 mb-4 shadow-sm hover:shadow-md transition-all animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3 flex-1">
          <Link to={`/profile/${user.username}`}>
            <Avatar className="h-10 w-10 ring-2 ring-background cursor-pointer hover:ring-primary transition-all">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">{user.name[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${user.username}`} className="hover:underline">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold truncate">{user.name}</span>
                {user.isVerified && <VerifiedBadge size="sm" />}
              </div>
            </Link>
            {location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="text-xs text-muted-foreground">
                  {location}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-accent rounded-full" aria-label="More options">
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {currentUser?.userId !== user.username && (
              <>
                <DropdownMenuItem onClick={() => navigate(`/profile/${user.username}`)}>
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem>Report</DropdownMenuItem>
                <DropdownMenuItem>Not Interested</DropdownMenuItem>
              </>
            )}
            {currentUser?.userId === user.username && (
              <>
                <DropdownMenuItem onClick={() => navigate(`/post/${postId}`)}>Go to Post</DropdownMenuItem>
                <DropdownMenuItem className="text-red-500">Delete Post</DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
              <Send className="mr-2 h-4 w-4" />
              Send to Chat
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
              toast({ title: "Link copied", description: "Post link copied to clipboard" });
            }}>
              Copy Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Media (Image or Video for Glimpses) */}
      <div ref={containerRef} className="relative">
        {postType === 'glimpse' && mediaType === 'video' && !videoError ? (
          <>
            <video
              ref={videoRef}
              src={image}
              className="w-full aspect-square object-cover cursor-pointer"
              onClick={handleImageClick}
              onDoubleClick={handleDoubleTap}
              onError={() => {
                // Video failed to load - show fallback image instead
                setVideoError(true);
              }}
              loop
              muted={muted}
              playsInline
            />
            {/* Mute/Unmute Button - Only show if video is loaded */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMuted(!muted);
              }}
              className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-all z-10"
            >
              {muted ? (
                <VolumeX className="h-4 w-4 text-white" />
              ) : (
                <Volume2 className="h-4 w-4 text-white" />
              )}
            </button>
          </>
        ) : (
          <img 
            src={image ?? "/placeholder.svg"} 
            alt="post" 
            className="w-full aspect-square object-cover cursor-pointer" 
            onClick={handleImageClick}
            onDoubleClick={handleDoubleTap}
          />
        )}
        {/* Double-tap Heart Animation */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart 
              className="h-24 w-24 text-white drop-shadow-2xl animate-ping" 
              fill="currentColor"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3.5 py-3 space-y-2.5">
        <div className="flex items-center gap-3">
          <LikeAnimation
            isLiked={isLiked}
            onToggle={handleLike}
            showCount={false}
            size="md"
          />
          {postType !== 'glimpse' && (
            <button 
              onClick={() => setShowCommentDrawer(true)}
              className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-90"
              aria-label="Comment"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
          )}
          <button 
            onClick={() => {
              navigate(`/share/post/${postId}`);
            }}
            className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-90"
            aria-label="Share"
          >
            <Send className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <SaveAnimation
            isSaved={isSaved}
            onToggle={handleSave}
            size="md"
          />
        </div>

        {/* Likes - Hide count for glimpses if hideLikes enabled and not author */}
        {postType === 'glimpse' ? (
          // For glimpses, check settings
          (settings?.hideLikes && user.userId !== currentUser?.userId) ? null : (
            likesCount > 0 && (
              <button className="text-sm font-semibold hover:text-muted-foreground transition-colors">
                {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
              </button>
            )
          )
        ) : (
          // For regular posts, always show likes
          likesCount > 0 && (
            <button className="text-sm font-semibold hover:text-muted-foreground transition-colors">
              {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
            </button>
          )
        )}

        {/* Caption - Hide for glimpses if showCaptions disabled or caption is empty */}
        {postType === 'glimpse' ? (
          // For glimpses, check settings and caption exists
          caption && (settings?.showCaptions ?? true) && (
            <div className="text-sm leading-relaxed">
              <span className="font-semibold mr-1.5 inline-flex items-center gap-1">
                {user.name}
                {user.isVerified && <VerifiedBadge size="sm" />}
              </span>
              <span className="text-foreground/90">
                <ParsedCaption text={caption} />
              </span>
            </div>
          )
        ) : (
          // For regular posts, always show caption section (even if empty)
          <div className="text-sm leading-relaxed">
            <span className="font-semibold mr-1.5 inline-flex items-center gap-1">
              {user.name}
              {user.isVerified && <VerifiedBadge size="sm" />}
            </span>
            {caption && (
              <span className="text-foreground/90">
                <ParsedCaption text={caption} />
              </span>
            )}
          </div>
        )}

        {/* View Comments */}
        {comments && comments > 0 && (
          <button 
            onClick={() => setShowCommentDrawer(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            View all {comments} comments
          </button>
        )}

        {/* Time */}
        <div className="text-xs text-muted-foreground/70 uppercase tracking-wide">{formatPostTime(time)}</div>
      </div>

      {/* Comment Drawer */}
      <CommentDrawer 
        open={showCommentDrawer}
        onOpenChange={setShowCommentDrawer}
        postId={postId}
        totalComments={comments}
      />

      {/* Share to Chat Dialog */}
      <UserSelectorDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        onSelect={handleShareToChat}
        allowMessage={true}
        placeholder={`Search users to share ${postType === 'glimpse' ? 'glimpse' : 'post'}...`}
        title={`Send ${postType === 'glimpse' ? 'glimpse' : 'post'} to`}
      />
    </div>
  );
};

// Memoized export with custom comparison
export default memo(PostCard, (prevProps, nextProps) => {
  // Only re-render if critical post data changes
  return (
    prevProps.postId === nextProps.postId &&
    prevProps.likes === nextProps.likes &&
    prevProps.comments === nextProps.comments &&
    prevProps.isLiked === nextProps.isLiked &&
    prevProps.isSaved === nextProps.isSaved &&
    prevProps.onLike === nextProps.onLike &&
    prevProps.onSaveChange === nextProps.onSaveChange &&
    JSON.stringify(prevProps.settings) === JSON.stringify(nextProps.settings)
  );
});
