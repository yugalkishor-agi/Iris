import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { SharePostModal } from "@/components/post/SharePostModal";
import { UserMentionAutocomplete } from "@/components/ui/user-mention-autocomplete";
import { ViewLikesModal } from "@/components/post/ViewLikesModal";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ParsedCaption } from "@/utils/parseCaption";
import { postService } from "../../src/services/post.service";
import { notificationService } from "../../src/services/notification.service";
import type { Post as PostType, Comment as CommentType } from "../../src/types/database";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  MapPin,
  Smile,
  Pin,
  Trash2,
  Flag,
  X,
} from "lucide-react";

function PostViewer() {
  const { id: initialPostId, username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const commentInputRef = useRef<HTMLInputElement>(null);

  // State from location or fetch
  const [allPosts, setAllPosts] = useState<PostType[]>(location.state?.posts || []);
  const [currentPostIndex, setCurrentPostIndex] = useState(
    location.state?.initialIndex || 0
  );
  const [loading, setLoading] = useState(!location.state?.posts);
  const [postsLoaded, setPostsLoaded] = useState<{ [key: string]: boolean }>({});
  const [comments, setComments] = useState<{ [postId: string]: CommentType[] }>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState("");
  const [activePostId, setActivePostId] = useState(initialPostId || "");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ username: string; commentId: string } | null>(null);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showHideDialog, setShowHideDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>("");
  const [editCaption, setEditCaption] = useState("");

  // Load posts if not provided
  useEffect(() => {
    const loadPosts = async () => {
      if (allPosts.length > 0) return;

      try {
        setLoading(true);
        
        if (username) {
          // Load user's posts (from profile)
          const { userService } = await import("../../src/services/user.service");
          const userData = await userService.getUser(username);
          if (userData) {
            const userPosts = await postService.getUserPosts(userData.userId);
            setAllPosts(userPosts.posts || []);
            
            // Find index of initial post
            const idx = (userPosts.posts || []).findIndex(p => p.postId === initialPostId);
            if (idx !== -1) {
              setCurrentPostIndex(idx);
            }
          }
        } else if (initialPostId) {
          // Load single post (from notification, feed, etc)
          const post = await postService.getPost(initialPostId);
          if (post) {
            setAllPosts([post]);
            setCurrentPostIndex(0);
            setActivePostId(post.postId);
          }
        }
      } catch (error) {
        console.error("Failed to load posts:", error);
        toast({
          title: "Error",
          description: "Failed to load posts",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [initialPostId, username]);

  // Load liked state for all posts
  useEffect(() => {
    const loadLikedState = async () => {
      if (!currentUser || allPosts.length === 0) return;

      try {
        const likedPostIds = new Set<string>();
        
        await Promise.all(
          allPosts.map(async (post) => {
            const isLiked = await postService.hasLiked(post.postId, currentUser.userId);
            if (isLiked) {
              likedPostIds.add(post.postId);
            }
          })
        );

        setLikedPosts(likedPostIds);
      } catch (error) {
        console.error('Failed to load liked state:', error);
      }
    };

    loadLikedState();
  }, [allPosts, currentUser]);

  // Load comments for visible posts
  const loadCommentsForPost = async (postId: string) => {
    if (postsLoaded[postId]) return;

    try {
      const { comments: postComments } = await postService.getComments(postId);
      setComments(prev => ({ ...prev, [postId]: postComments }));
      setPostsLoaded(prev => ({ ...prev, [postId]: true }));
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  };

  // Handle scroll to load nearby posts
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      // Find which post is in view
      allPosts.forEach((post, index) => {
        const postElement = postRefs.current[post.postId];
        if (postElement) {
          const rect = postElement.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // Check if post is mostly visible
          if (rect.top >= containerRect.top && rect.top < containerRect.top + containerHeight / 2) {
            if (currentPostIndex !== index) {
              setCurrentPostIndex(index);
              setActivePostId(post.postId);
              // Update URL
              navigate(`/post/${post.postId}`, { replace: true, state: { posts: allPosts, initialIndex: index } });
            }
          }
        }
      });
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [allPosts, currentPostIndex, navigate]);

  // Load comments for current and nearby posts
  useEffect(() => {
    if (allPosts.length === 0) return;

    const loadNearbyComments = () => {
      const postsToLoad = [
        allPosts[currentPostIndex],
        allPosts[currentPostIndex - 1],
        allPosts[currentPostIndex + 1],
      ].filter(Boolean);

      postsToLoad.forEach(post => {
        if (post) loadCommentsForPost(post.postId);
      });
    };

    loadNearbyComments();
  }, [currentPostIndex, allPosts]);

  const handleAddComment = async (postId: string) => {
    if (!currentUser || !commentText.trim()) return;

    try {
      // Extract mentions from comment text
      const mentionRegex = /@(\w+)/g;
      const mentions = [...commentText.matchAll(mentionRegex)].map(m => m[1]);

      const commentId = await postService.addComment(
        postId,
        currentUser.userId,
        currentUser.username,
        currentUser.avatarURL || "",
        commentText,
        replyingTo?.commentId,
        mentions
      );

      // Send notification to post author
      const post = allPosts.find(p => p.postId === postId);
      if (post && post.authorId !== currentUser.userId) {
        await notificationService.createNotification(
          post.authorId,
          replyingTo ? 'comment_reply' : 'comment',
          currentUser.userId,
          currentUser.username,
          currentUser.avatarURL || '',
          'post',
          postId,
          commentText.substring(0, 100)
        );
      }

      // Send notifications to mentioned users
      for (const mentionedUsername of mentions) {
        try {
          const { userService } = await import("../../src/services/user.service");
          const mentionedUser = await userService.getUser(mentionedUsername);
          if (mentionedUser && mentionedUser.userId !== currentUser.userId) {
            await notificationService.createNotification(
              mentionedUser.userId,
              'mention',
              currentUser.userId,
              currentUser.username,
              currentUser.avatarURL || '',
              'post',
              postId,
              commentText.substring(0, 100)
            );
          }
        } catch (err) {
          console.error('Failed to notify mentioned user:', mentionedUsername);
        }
      }

      // Reload comments
      const { comments: newComments } = await postService.getComments(postId);
      setComments(prev => ({ ...prev, [postId]: newComments }));
      setCommentText("");
      setReplyingTo(null);

      toast({ title: "Comment added" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCommentLike = async (postId: string, commentId: string) => {
    if (!currentUser) return;

    try {
      const isLiked = likedComments.has(commentId);
      
      if (isLiked) {
        await postService.unlikeComment(postId, commentId, currentUser.userId);
        setLikedComments(prev => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
      } else {
        await postService.likeComment(postId, commentId, currentUser.userId);
        setLikedComments(prev => new Set(prev).add(commentId));

        // Check if current user is post author
        const post = allPosts.find(p => p.postId === postId);
        const isPostAuthor = currentUser.userId === post?.authorId;

        // Update local comment to show author liked
        if (isPostAuthor) {
          setComments(prev => ({
            ...prev,
            [postId]: prev[postId]?.map(c =>
              c.commentId === commentId
                ? { ...c, likesCount: c.likesCount + 1, likedByAuthor: true }
                : c
            ) || []
          }));
        } else {
          setComments(prev => ({
            ...prev,
            [postId]: prev[postId]?.map(c =>
              c.commentId === commentId
                ? { ...c, likesCount: c.likesCount + 1 }
                : c
            ) || []
          }));
        }

        // Send notification to comment author
        const comment = comments[postId]?.find(c => c.commentId === commentId);
        if (comment && comment.authorId !== currentUser.userId) {
          await notificationService.createNotification(
            comment.authorId,
            'comment_like',
            currentUser.userId,
            currentUser.username,
            currentUser.avatarURL || '',
            'comment',
            commentId,
            comment.text.substring(0, 100)
          );
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLike = async (post: PostType) => {
    if (!currentUser) return;

    try {
      const isLiked = likedPosts.has(post.postId);
      
      if (isLiked) {
        await postService.unlikePost(post.postId, currentUser.userId);
        setLikedPosts(prev => {
          const next = new Set(prev);
          next.delete(post.postId);
          return next;
        });
      } else {
        await postService.likePost(post.postId, currentUser.userId);
        setLikedPosts(prev => new Set(prev).add(post.postId));
      }

      // Update local state
      setAllPosts(prev =>
        prev.map(p =>
          p.postId === post.postId
            ? { ...p, stats: { ...p.stats, likesCount: p.stats.likesCount + (isLiked ? -1 : 1) } }
            : p
        )
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const timeAgo = (timestamp: any) => {
    if (!timestamp) return 'just now';
    
    try {
      let date: Date;
      
      // Handle Firebase Timestamp
      if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } 
      // Handle Firestore Timestamp with seconds
      else if (timestamp?.seconds) {
        date = new Date(timestamp.seconds * 1000);
      }
      // Handle regular Date or timestamp string
      else {
        date = new Date(timestamp);
      }
      
      // Validate date
      if (isNaN(date.getTime())) {
        return 'recently';
      }
      
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
      
      if (seconds < 0) return 'just now'; // Future dates
      if (seconds < 60) return 'just now';
      
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      
      const hours = Math.floor(seconds / 3600);
      if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      
      const days = Math.floor(seconds / 86400);
      if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      
      const weeks = Math.floor(seconds / 604800);
      if (weeks < 4) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
      
      const months = Math.floor(days / 30);
      if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
      
      const years = Math.floor(days / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return 'recently';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState text="Loading posts..." />
      </div>
    );
  }

  if (allPosts.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">No posts found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="font-semibold">Posts</span>
          </button>
          <span className="text-sm text-muted-foreground">
            {currentPostIndex + 1} / {allPosts.length}
          </span>
        </div>
      </div>

      {/* Scrollable Posts Container */}
      <div
        ref={scrollContainerRef}
        className="h-screen overflow-y-auto snap-y snap-mandatory"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          scrollBehavior: 'smooth'
        }}
      >
        {allPosts.map((post, index) => {
          const postComments = comments[post.postId] || [];
          const topLevelComments = postComments.filter(c => !c.parentCommentId);

          return (
            <div
              key={post.postId}
              ref={el => postRefs.current[post.postId] = el}
              className="min-h-screen snap-start flex flex-col"
            >
              {/* Post Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                  {/* Post Header */}
                  <div className="flex items-center justify-between p-4">
                    <Link
                      to={`/profile/${post.authorUsername}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.authorAvatarURL} />
                        <AvatarFallback>
                          {post.authorUsername[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-1">
                          {post.authorUsername}
                          {post.authorVerified && <VerifiedBadge size="sm" />}
                        </div>
                        {post.location && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {post.location}
                          </div>
                        )}
                      </div>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-accent rounded-full transition-colors">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {currentUser?.userId === post.authorId ? (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setSelectedPostId(post.postId);
                              setEditCaption(post.caption || "");
                              setShowEditDialog(true);
                            }}>
                              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit Caption
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => {
                              setSelectedPostId(post.postId);
                              setShowDeleteDialog(true);
                            }}>
                              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete Post
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setSelectedPostId(post.postId);
                              setShowHideDialog(true);
                            }}>
                              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                              Hide Post
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedPostId(post.postId);
                              setShowReportDialog(true);
                            }}>
                              <Flag className="mr-2 h-4 w-4" />
                              Report
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Post Image */}
                  {post.mediaURLs && post.mediaURLs.length > 0 && (
                    <div className="w-full aspect-square bg-muted">
                      <img
                        src={post.mediaURLs[0]}
                        alt="Post"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Failed to load image:', post.mediaURLs[0]);
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLike(post)}
                          className="transition-transform hover:scale-110"
                        >
                          <Heart
                            className={`h-6 w-6 transition-all ${
                              likedPosts.has(post.postId)
                                ? "fill-red-500 text-red-500 scale-110"
                                : "hover:scale-110"
                            }`}
                          />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedPostForComments(post.postId);
                            setShowCommentsSheet(true);
                          }}
                          className="transition-transform hover:scale-110"
                        >
                          <MessageCircle className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() => {
                            setActivePostId(post.postId);
                            setShowShareModal(true);
                          }}
                          className="transition-transform hover:scale-110"
                        >
                          <Send className="h-6 w-6" />
                        </button>
                      </div>
                      <button className="transition-transform hover:scale-110">
                        <Bookmark className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Likes */}
                    <button
                      onClick={() => {
                        setActivePostId(post.postId);
                        setShowLikesModal(true);
                      }}
                      className="font-semibold text-sm hover:text-muted-foreground"
                    >
                      {post.stats.likesCount.toLocaleString()} {post.stats.likesCount === 1 ? 'like' : 'likes'}
                    </button>

                    {/* Caption */}
                    {post.caption && (
                      <div className="text-sm">
                        <Link
                          to={`/profile/${post.authorUsername}`}
                          className="font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          {post.authorUsername}
                          {post.authorVerified && <VerifiedBadge size="sm" />}
                        </Link>{" "}
                        <ParsedCaption text={post.caption} />
                      </div>
                    )}

                    {/* View Comments */}
                    {comments[post.postId] && comments[post.postId].length > 0 && (
                      <button 
                        onClick={() => {
                          setSelectedPostForComments(post.postId);
                          setShowCommentsSheet(true);
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        View all {comments[post.postId].filter(c => !c.parentCommentId).length} comments
                      </button>
                    )}

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground">
                      {timeAgo(post.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Comment Input */}
              <div className="border-t p-3 bg-background">
                <div className="flex items-center gap-2 max-w-2xl mx-auto">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={currentUser?.avatarURL} />
                    <AvatarFallback>
                      {currentUser?.username?.[0]?.toUpperCase() || 'Y'}
                    </AvatarFallback>
                  </Avatar>
                  <Input
                    ref={commentInputRef}
                    placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
                    value={commentText}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCommentText(value);
                      
                      // Check for @ mention
                      const lastAtIndex = value.lastIndexOf('@');
                      if (lastAtIndex !== -1) {
                        const textAfterAt = value.substring(lastAtIndex + 1);
                        const hasSpaceAfter = textAfterAt.includes(' ');
                        
                        if (!hasSpaceAfter && textAfterAt.length > 0) {
                          setMentionQuery(textAfterAt);
                          setShowMentionDropdown(true);
                          
                          // Position dropdown near input
                          if (commentInputRef.current) {
                            const rect = commentInputRef.current.getBoundingClientRect();
                            setMentionPosition({
                              top: rect.top - 280,
                              left: rect.left,
                            });
                          }
                        } else {
                          setShowMentionDropdown(false);
                        }
                      } else {
                        setShowMentionDropdown(false);
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !showMentionDropdown) {
                        handleAddComment(post.postId);
                      }
                    }}
                    className="flex-1"
                  />
                  {commentText.trim() && selectedPostForComments && (
                    <Button size="sm" onClick={() => handleAddComment(selectedPostForComments)}>
                      {replyingTo ? 'Reply' : 'Post'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mention Autocomplete */}
      {showMentionDropdown && (
        <UserMentionAutocomplete
          searchQuery={mentionQuery}
          onSelect={(user) => {
            const lastAtIndex = commentText.lastIndexOf('@');
            const newText = commentText.substring(0, lastAtIndex) + `@${user.username} `;
            setCommentText(newText);
            setShowMentionDropdown(false);
            commentInputRef.current?.focus();
          }}
          position={mentionPosition}
        />
      )}

      {/* Modals */}
      {showShareModal && (
        <SharePostModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          postId={activePostId}
          postUrl={`${window.location.origin}/post/${activePostId}`}
          postCaption={allPosts.find(p => p.postId === activePostId)?.caption}
          postImageUrl={allPosts.find(p => p.postId === activePostId)?.mediaURLs?.[0]}
        />
      )}

      {showLikesModal && (
        <ViewLikesModal
          isOpen={showLikesModal}
          onClose={() => setShowLikesModal(false)}
          postId={activePostId}
        />
      )}

      {/* Comments Sheet */}
      <Sheet open={showCommentsSheet} onOpenChange={setShowCommentsSheet}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Comments</SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col h-[calc(85vh-5rem)]">
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedPostForComments && comments[selectedPostForComments]
                ?.filter(c => !c.parentCommentId)
                .sort((a, b) => {
                  // Pinned comments always on top
                  if (a.isPinned && !b.isPinned) return -1;
                  if (!a.isPinned && b.isPinned) return 1;
                  // Then sort by creation date (newest first)
                  const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                  const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                  return bTime - aTime;
                })
                .map((comment) => {
                const replies = comments[selectedPostForComments]?.filter(c => c.parentCommentId === comment.commentId) || [];
                const isExpanded = expandedComments.has(comment.commentId);
                const isOwner = currentUser?.userId === comment.authorId;
                const selectedPost = allPosts.find(p => p.postId === selectedPostForComments);
                const isPostAuthor = currentUser?.userId === selectedPost?.authorId;

                return (
                  <div key={comment.commentId} className="space-y-2">
                    {/* Main Comment */}
                    <div className="flex gap-3 group">
                      <Link to={`/profile/${comment.authorUsername}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.authorAvatarURL} />
                          <AvatarFallback>{comment.authorUsername[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Link>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <Link to={`/profile/${comment.authorUsername}`} className="font-semibold text-sm hover:underline inline-flex items-center gap-1">
                                {comment.authorUsername}
                                {comment.authorVerified && <VerifiedBadge size="sm" />}
                              </Link>
                              {comment.likedByAuthor && (
                                <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                              )}
                              {isPostAuthor && comment.authorId === selectedPost?.authorId && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">Creator</span>
                              )}
                            </div>
                            <p className="text-sm mt-0.5">{comment.text}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span>{timeAgo(comment.createdAt)}</span>
                              {comment.likesCount > 0 && (
                                <span>{comment.likesCount} {comment.likesCount === 1 ? 'like' : 'likes'}</span>
                              )}
                              <button 
                                onClick={() => setReplyingTo({ username: comment.authorUsername, commentId: comment.commentId })}
                                className="font-semibold hover:text-foreground"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {/* Show pin icon to everyone when pinned, only owner can click */}
                            {comment.isPinned && (
                              <div className="p-1">
                                <Pin className="h-4 w-4 fill-primary text-primary" />
                              </div>
                            )}
                            {/* Owner can pin/unpin on hover when not pinned */}
                            {isPostAuthor && !comment.isPinned && (
                              <button
                                onClick={async () => {
                                  if (!selectedPostForComments) return;
                                  try {
                                    await postService.pinComment(selectedPostForComments, comment.commentId);
                                    const { comments: updatedComments } = await postService.getComments(selectedPostForComments);
                                    setComments(prev => ({ ...prev, [selectedPostForComments]: updatedComments }));
                                  } catch (error) {
                                    console.error('Failed to pin:', error);
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                              >
                                <Pin className="h-4 w-4" />
                              </button>
                            )}
                            {/* Owner can unpin when pinned */}
                            {isPostAuthor && comment.isPinned && (
                              <button
                                onClick={async () => {
                                  if (!selectedPostForComments) return;
                                  try {
                                    await postService.unpinComment(selectedPostForComments, comment.commentId);
                                    const { comments: updatedComments } = await postService.getComments(selectedPostForComments);
                                    setComments(prev => ({ ...prev, [selectedPostForComments]: updatedComments }));
                                  } catch (error) {
                                    console.error('Failed to unpin:', error);
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleCommentLike(selectedPostForComments!, comment.commentId)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                            >
                              <Heart 
                                className={`h-4 w-4 transition-colors ${
                                  likedComments.has(comment.commentId) 
                                    ? 'fill-red-500 text-red-500' 
                                    : ''
                                }`} 
                              />
                            </button>
                          </div>
                        </div>

                        {/* Pinned Indicator */}
                        {comment.isPinned && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Pin className="h-3 w-3" />
                            <span>Pinned by creator</span>
                          </div>
                        )}

                        {/* View Replies */}
                        {replies.length > 0 && (
                          <button
                            onClick={() => {
                              setExpandedComments(prev => {
                                const next = new Set(prev);
                                if (next.has(comment.commentId)) {
                                  next.delete(comment.commentId);
                                } else {
                                  next.add(comment.commentId);
                                }
                                return next;
                              });
                            }}
                            className="text-xs font-semibold text-muted-foreground hover:text-foreground mt-2 flex items-center gap-1"
                          >
                            {isExpanded ? '━' : '―'} View replies ({replies.length})
                          </button>
                        )}

                        {/* Replies */}
                        {isExpanded && replies.length > 0 && (
                          <div className="ml-8 mt-3 space-y-3 border-l-2 border-muted pl-3">
                            {replies.map((reply) => (
                              <div key={reply.commentId} className="flex gap-2 group">
                                <Link to={`/profile/${reply.authorUsername}`}>
                                  <Avatar className="h-7 w-7">
                                    <AvatarImage src={reply.authorAvatarURL} />
                                    <AvatarFallback>{reply.authorUsername[0]?.toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                </Link>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <Link to={`/profile/${reply.authorUsername}`} className="font-semibold text-sm hover:underline inline-flex items-center gap-1">
                                          {reply.authorUsername}
                                          {reply.authorVerified && <VerifiedBadge size="sm" />}
                                        </Link>
                                        {reply.likedByAuthor && (
                                          <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                                        )}
                                      </div>
                                      <p className="text-sm mt-0.5">{reply.text}</p>
                                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                        <span>{timeAgo(reply.createdAt)}</span>
                                        {reply.likesCount > 0 && (
                                          <span>{reply.likesCount} {reply.likesCount === 1 ? 'like' : 'likes'}</span>
                                        )}
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => handleCommentLike(selectedPostForComments!, reply.commentId)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                                    >
                                      <Heart 
                                        className={`h-4 w-4 transition-colors ${
                                          likedComments.has(reply.commentId) 
                                            ? 'fill-red-500 text-red-500' 
                                            : ''
                                        }`} 
                                      />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {selectedPostForComments && (!comments[selectedPostForComments] || comments[selectedPostForComments].length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No comments yet</p>
                  <p className="text-sm">Be the first to comment</p>
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="border-t p-4 bg-background">
              {replyingTo && (
                <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                  <span>Replying to <span className="font-semibold">@{replyingTo.username}</span></span>
                  <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                    Cancel
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={currentUser?.avatarURL} />
                  <AvatarFallback>
                    {currentUser?.username?.[0]?.toUpperCase() || 'Y'}
                  </AvatarFallback>
                </Avatar>
                <Input
                  placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
                  value={commentText}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCommentText(value);
                    
                    // Check for @ mention
                    const lastAtIndex = value.lastIndexOf('@');
                    if (lastAtIndex !== -1) {
                      const textAfterAt = value.substring(lastAtIndex + 1);
                      const hasSpaceAfter = textAfterAt.includes(' ');
                      
                      if (!hasSpaceAfter && textAfterAt.length > 0) {
                        setMentionQuery(textAfterAt);
                        setShowMentionDropdown(true);
                        
                        // Position dropdown near input
                        if (commentInputRef.current) {
                          const rect = commentInputRef.current.getBoundingClientRect();
                          setMentionPosition({
                            top: rect.top - 280,
                            left: rect.left,
                          });
                        }
                      } else {
                        setShowMentionDropdown(false);
                      }
                    } else {
                      setShowMentionDropdown(false);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !showMentionDropdown) {
                      handleAddComment(selectedPostForComments!);
                    }
                  }}
                  className="flex-1"
                />
                {commentText.trim() && selectedPostForComments && (
                  <Button size="sm" onClick={() => handleAddComment(selectedPostForComments)}>
                    {replyingTo ? 'Reply' : 'Post'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Post Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Delete Post?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This action cannot be undone. Your post will be permanently deleted from your profile and feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={async () => {
                try {
                  await postService.deletePost(selectedPostId, currentUser!.userId);
                  setAllPosts(prev => prev.filter(p => p.postId !== selectedPostId));
                  toast({ title: "Post deleted successfully" });
                } catch (error: any) {
                  toast({ title: "Error", description: error.message, variant: "destructive" });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Caption Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Caption
            </DialogTitle>
            <DialogDescription>
              Update the caption for this post
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              placeholder="Write a caption..."
              className="min-h-[120px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {editCaption.length} characters
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  await postService.updatePost(selectedPostId, { caption: editCaption });
                  setAllPosts(prev => prev.map(p => 
                    p.postId === selectedPostId ? { ...p, caption: editCaption } : p
                  ));
                  setShowEditDialog(false);
                  toast({ title: "Caption updated successfully" });
                } catch (error: any) {
                  toast({ title: "Error", description: error.message, variant: "destructive" });
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hide Post Dialog */}
      <AlertDialog open={showHideDialog} onOpenChange={setShowHideDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
              Hide This Post?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              You won't see this post in your feed anymore. You can still view it on the user's profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setAllPosts(prev => prev.filter(p => p.postId !== selectedPostId));
                toast({ 
                  title: "Post hidden", 
                  description: "You won't see this post in your feed anymore" 
                });
              }}
            >
              Hide Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Post Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Flag className="h-5 w-5" />
              Report Post
            </DialogTitle>
            <DialogDescription>
              Help us understand what's wrong with this post
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup defaultValue="spam">
              <div className="flex items-center space-x-3 space-y-0">
                <RadioGroupItem value="spam" id="spam" />
                <Label htmlFor="spam" className="font-normal cursor-pointer">
                  Spam or misleading
                </Label>
              </div>
              <div className="flex items-center space-x-3 space-y-0">
                <RadioGroupItem value="inappropriate" id="inappropriate" />
                <Label htmlFor="inappropriate" className="font-normal cursor-pointer">
                  Inappropriate content
                </Label>
              </div>
              <div className="flex items-center space-x-3 space-y-0">
                <RadioGroupItem value="harassment" id="harassment" />
                <Label htmlFor="harassment" className="font-normal cursor-pointer">
                  Bullying or harassment
                </Label>
              </div>
              <div className="flex items-center space-x-3 space-y-0">
                <RadioGroupItem value="violence" id="violence" />
                <Label htmlFor="violence" className="font-normal cursor-pointer">
                  Violence or dangerous content
                </Label>
              </div>
              <div className="flex items-center space-x-3 space-y-0">
                <RadioGroupItem value="hate" id="hate" />
                <Label htmlFor="hate" className="font-normal cursor-pointer">
                  Hate speech or symbols
                </Label>
              </div>
              <div className="flex items-center space-x-3 space-y-0">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="font-normal cursor-pointer">
                  Something else
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowReportDialog(false);
                toast({ 
                  title: "Report submitted", 
                  description: "Thank you for keeping our community safe" 
                });
              }}
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PostViewer;
