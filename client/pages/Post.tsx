import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { FollowButton } from "@/components/ui/follow-button";
import { ViewLikesModal } from "@/components/post/ViewLikesModal";
import { ReportDialog } from "@/components/post/ReportDialog";
import { UserMentionAutocomplete } from "@/components/ui/user-mention-autocomplete";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { ShareDialog } from "@/components/share/ShareDialog";
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
import { UserSelectorDialog } from "@/components/chat/UserSelectorDialog";
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
  Share2,
  UserPlus,
  Copy,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function Post() {
  const { id: postId } = useParams();
  const [searchParams] = useSearchParams();
  const highlightCommentId = searchParams.get('comment');
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const commentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ username: string; commentId: string } | null>(null);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [highlightedComment, setHighlightedComment] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [commentSort, setCommentSort] = useState<'recent' | 'top'>('recent');
  const [showComments, setShowComments] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showHideDialog, setShowHideDialog] = useState(false);
  const [showRichShareDialog, setShowRichShareDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Load post and comments from backend
  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return;

      try {
        setLoading(true);
        const [postData, commentsData] = await Promise.all([
          postService.getPost(postId),
          postService.getComments(postId),
        ]);

        if (postData) {
          setPost(postData);

          // Check if current user has liked/saved
          if (currentUser) {
            const [liked, saved] = await Promise.all([
              postService.hasLiked(postId, currentUser.userId),
              postService.hasSaved(postId, currentUser.userId),
            ]);
            setIsLiked(liked);
            setIsSaved(saved);
          }
        }

        setComments(commentsData.comments);
        
        // Handle comment highlighting from notification
        if (highlightCommentId && commentsData.comments.length > 0) {
          const targetComment = commentsData.comments.find(c => c.commentId === highlightCommentId);
          if (targetComment) {
            // Find parent comment if this is a reply
            const isReply = /^@[\w.]+/.test(targetComment.text.trim());
            if (isReply) {
              const mentionMatch = targetComment.text.match(/@([\w.]+)/);
              if (mentionMatch) {
                const parentUsername = mentionMatch[1];
                const parentComment = commentsData.comments.find(c => c.authorUsername === parentUsername);
                if (parentComment) {
                  setExpandedComments(new Set([parentComment.commentId]));
                }
              }
            }
            setHighlightedComment(highlightCommentId);
            // Scroll after a short delay to ensure rendering
            setTimeout(() => {
              const element = commentRefs.current[highlightCommentId];
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 300);
            // Remove highlight after 3 seconds
            setTimeout(() => setHighlightedComment(null), 3000);
          }
        }
      } catch (error: any) {
        console.error('=== POST LOAD ERROR ===');
        console.error('Full error:', error);
        console.error('Error code:', error?.code);
        console.error('Error message:', error?.message);
        console.error('Post ID:', postId);
        console.error('Current User:', currentUser?.userId);
        console.error('======================');
        
        const errorMessage = error?.message || 'Failed to load post';
        setError(errorMessage);
        
        toast({
          title: "Error Loading Post",
          description: `${errorMessage} (Check console for details)`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId, currentUser]);

  const handleLike = async () => {
    if (!currentUser || !postId) return;

    try {
      if (isLiked) {
        await postService.unlikePost(postId, currentUser.userId);
      } else {
        await postService.likePost(postId, currentUser.userId);
      }
      setIsLiked(!isLiked);

      // Update post stats
      if (post) {
        setPost({
          ...post,
          stats: {
            ...post.stats,
            likesCount: isLiked ? post.stats.likesCount - 1 : post.stats.likesCount + 1,
          },
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!currentUser || !postId) return;

    try {
      if (isSaved) {
        await postService.unsavePost(postId, currentUser.userId);
      } else {
        await postService.savePost(postId, currentUser.userId);
      }
      setIsSaved(!isSaved);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!currentUser || !postId) return;

    const isLiked = likedComments.has(commentId);

    // Optimistic update
    if (isLiked) {
      setLikedComments(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    } else {
      setLikedComments(prev => new Set(prev).add(commentId));
    }

    // Update like count
    setComments(comments.map(c =>
      c.commentId === commentId
        ? { 
            ...c, 
            likesCount: isLiked ? Math.max(0, c.likesCount - 1) : c.likesCount + 1,
            likedByAuthor: !isLiked && currentUser.userId === post?.authorId ? true : c.likedByAuthor
          }
        : c
    ));

    try {
      await postService.likeComment(postId, commentId, currentUser.userId);
    } catch (error: any) {
      // Revert on error
      if (isLiked) {
        setLikedComments(prev => new Set(prev).add(commentId));
      } else {
        setLikedComments(prev => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
      }
      setComments(comments.map(c =>
        c.commentId === commentId
          ? { ...c, likesCount: isLiked ? c.likesCount + 1 : c.likesCount - 1 }
          : c
      ));
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async () => {
    if (!currentUser || !postId || !commentText.trim()) return;

    try {
      const commentId = await postService.addComment(
        postId,
        currentUser.userId,
        currentUser.username,
        currentUser.avatarURL || '',
        commentText,
        replyingTo?.commentId || undefined
      );

      // If this is a reply, send notification to parent comment author
      if (replyingTo && post) {
        try {
          const { userService } = await import('../../src/services/user.service');
          const parentUser = await userService.getUser(replyingTo.username);
          if (parentUser && parentUser.userId !== currentUser.userId) {
            await notificationService.createNotification(
              parentUser.userId,
              'comment_reply',
              currentUser.userId,
              currentUser.username,
              currentUser.avatarURL || '',
              postId,
              `replied to your comment: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`
            );
          }
        } catch (err) {
          console.error('Failed to send reply notification:', err);
        }
      }

      // Send mention notifications (for additional @mentions in the reply)
      const mentions = commentText.match(/@([\w.]+)/g);
      if (mentions && post) {
        for (const mention of mentions) {
          const username = mention.substring(1);
          // Skip if mentioning yourself or the person you're replying to (already notified)
          if (username !== currentUser.username && username !== replyingTo?.username) {
            try {
              // Find user by username and send notification
              const { userService } = await import('../../src/services/user.service');
              const mentionedUser = await userService.getUser(username);
              if (mentionedUser) {
                await notificationService.createNotification(
                  mentionedUser.userId,
                  'mention',
                  currentUser.userId,
                  currentUser.username,
                  currentUser.avatarURL || '',
                  postId,
                  `mentioned you in a comment: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`
                );
              }
            } catch (err) {
              console.error('Failed to send mention notification:', err);
            }
          }
        }
      }

      // Reload comments
      const { comments: newComments } = await postService.getComments(postId);
      setComments(newComments);
      setCommentText("");
      setReplyingTo(null);

      toast({ title: replyingTo ? "Reply added!" : "Comment added!" });
      
      // Auto-expand parent comment if this was a reply
      if (replyingTo) {
        setExpandedComments(prev => {
          const next = new Set(prev);
          next.add(replyingTo.commentId);
          return next;
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReply = (username: string, commentId: string) => {
    setReplyingTo({ username, commentId });
    setCommentText(`@${username} `);
  };

  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  // Group comments by parent (replies vs top-level)
  // A comment is top-level if it has no parentCommentId
  let topLevelComments = comments.filter(c => !c.parentCommentId);

  // Apply sorting
  if (commentSort === 'top') {
    topLevelComments = topLevelComments.sort((a, b) => {
      // Pinned comments always on top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Sort by likes count
      return b.likesCount - a.likesCount;
    });
  } else {
    // Recent (default) - sort by creation date, pinned first
    topLevelComments = topLevelComments.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime; // Most recent first
    });
  }
  
  const getRepliesForComment = (commentId: string) => {
    return comments.filter(c => c.parentCommentId === commentId);
  };

  const timeAgo = (timestamp: any) => {
    if (!timestamp) return 'just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
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
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!postId) return;

    try {
      await postService.deleteComment(postId, commentId);
      setComments(comments.filter(c => c.commentId !== commentId));
      toast({ title: "Comment deleted" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReport = () => {
    toast({
      title: "Report Submitted",
      description: "Thank you for helping keep our community safe.",
    });
  };

  const handleShareToChat = async (userId: string, message?: string) => {
    if (!currentUser || !post) return;
    
    try {
      const { messageService } = await import('../../src/services/message.service');
      await messageService.shareContent(
        currentUser.userId,
        userId,
        'post',
        post.postId,
        {
          type: 'post',
          id: post.postId,
          authorId: post.authorId,
          authorUsername: post.authorUsername,
          authorAvatarURL: post.authorAvatarURL,
          coverImageURL: post.mediaURLs[0] || '',
          caption: post.caption,
          mediaType: post.mediaType,
        },
        message
      );
      
      toast({
        title: "Post shared",
        description: "Post sent successfully",
      });
    } catch (error) {
      console.error('Failed to share post:', error);
      toast({
        title: "Share failed",
        description: "Failed to share post",
        variant: "destructive"
      });
    }
  };

  const handleShare = async (platform?: string) => {
    // Open rich share dialog for DMs
    if (!platform || platform === 'dm') {
      setShowRichShareDialog(true);
      return;
    }
    
    const url = `${window.location.origin}/post/${postId}`;
    const text = `Check out this post by ${post?.authorUsername}`;
    
    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: 'Share Post',
          text: text,
          url: url,
        });
        return;
      } catch (err) {
        console.log('Share cancelled');
      }
    }
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent('Check out this post')}&body=${encodeURIComponent(text + '\n\n' + url)}`;
    } else if (platform === 'copy') {
      // Copy link
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Post link copied to clipboard",
      });
    }
  };

  const handleCollabRequest = async () => {
    if (!currentUser || !postId || !post) return;

    try {
      await postService.requestCollaboration(
        postId,
        currentUser.userId,
        currentUser.username,
        currentUser.avatarURL || '',
        'I would like to collaborate on this post'
      );

      // Send notification to post owner
      await notificationService.createNotification(
        post.authorId,
        'collaboration_request',
        currentUser.userId,
        currentUser.username,
        currentUser.avatarURL || '',
        postId,
        'wants to collaborate on your post'
      );

      toast({
        title: "Collaboration Request Sent",
        description: "The creator will be notified of your request.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async () => {
    if (!currentUser || !postId || !post) return;

    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await postService.deletePost(postId, currentUser.userId);
      
      toast({
        title: "Post Deleted",
        description: "Your post has been deleted successfully",
      });

      // Navigate back to profile or home
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <LoadingState text="Loading post..." />;
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] p-8 text-center">
        <div className="p-4 bg-destructive/10 rounded-full mb-4">
          <MessageCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Failed to Load Post</h2>
        <p className="text-muted-foreground mb-4">
          {error || 'Post not found or you may not have permission to view it.'}
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-semibold">Post</h1>
        <div className="w-6" />
      </div>

      {/* Post Image */}
      <div className="relative aspect-square bg-muted">
        <img
          src={post.mediaURLs[0]}
          alt="Post"
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Failed to load post image');
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
      </div>

      {/* Scrollable Post Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto pb-20">
          {/* Post Author Info */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 flex-1">
              <Link to={`/profile/${post.authorUsername}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.authorAvatarURL} />
                  <AvatarFallback>{post.authorUsername[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link to={`/profile/${post.authorUsername}`} className="font-semibold text-sm hover:underline flex items-center gap-1">
                    {post.authorUsername}
                    {post.authorVerified && <VerifiedBadge size="sm" />}
                  </Link>
                  {currentUser && currentUser.userId !== post.authorId && (
                    <FollowButton authorId={post.authorId} />
                  )}
                </div>
                {post.collaborators && post.collaborators.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">with</span>
                    <div className="flex items-center -space-x-2">
                      {post.collaborators.slice(0, 3).map((collab) => (
                        <Link key={collab.userId} to={`/profile/${collab.username}`}>
                          <Avatar className="h-5 w-5 border-2 border-background hover:z-10 transition-all">
                            <AvatarImage src={collab.avatarURL} />
                            <AvatarFallback className="text-[10px]">{collab.username[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </Link>
                      ))}
                    </div>
                    <Link to={`/post/${post.postId}/collaborators`} className="text-xs font-semibold hover:underline">
                      {post.collaborators.slice(0, 3).map(c => c.username).join(", ")}
                      {post.collaborators.length > 3 && ` +${post.collaborators.length - 3}`}
                    </Link>
                  </div>
                )}
                {post.location && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{post.location}</span>
                  </div>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {currentUser?.userId === post.authorId ? (
                  <>
                    <DropdownMenuItem onClick={() => {
                      setNewCaption(post.caption || "");
                      setShowEditDialog(true);
                    }}>
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Caption
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteDialog(true)}>
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Post
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => setShowHideDialog(true)}>
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                      Hide Post
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                      <Flag className="mr-2 h-4 w-4" />
                      Report Post
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCollabRequest}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Request Collaboration
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => handleShare('dm')}>
                  <Send className="mr-2 h-4 w-4" />
                  Send in Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('copy')}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('facebook')}>
                  <Facebook className="mr-2 h-4 w-4" />
                  Social Platform 1
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('twitter')}>
                  <Twitter className="mr-2 h-4 w-4" />
                  Social Platform 2
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('linkedin')}>
                  <Linkedin className="mr-2 h-4 w-4" />
                  LinkedIn
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('email')}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleReport} className="text-destructive focus:text-destructive">
                  <Flag className="mr-2 h-4 w-4" />
                  Report Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className="flex items-center gap-1 group"
              >
                <Heart
                  className={`h-6 w-6 transition-all ${
                    isLiked
                      ? "fill-red-500 text-red-500 scale-110"
                      : "group-hover:scale-110"
                  }`}
                />
              </button>
              <button 
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1 group"
              >
                <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => setShowRichShareDialog(true)}
                className="flex items-center gap-1 group"
              >
                <Send className="h-6 w-6 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            <button
              onClick={handleSave}
              className="group"
            >
              <Bookmark
                className={`h-6 w-6 transition-all ${
                  isSaved
                    ? "fill-foreground scale-110"
                    : "group-hover:scale-110"
                }`}
              />
            </button>
          </div>

          {/* Likes */}
          <div className="px-4">
            <button
              onClick={() => setShowLikesModal(true)}
              className="font-semibold text-sm hover:text-muted-foreground transition-colors"
            >
              {post.stats.likesCount.toLocaleString()} {post.stats.likesCount === 1 ? 'like' : 'likes'}
            </button>
          </div>

          {/* Caption */}
          <div className="text-sm px-4">
            {editingCaption ? (
              <div className="space-y-2">
                <textarea
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full p-2 border rounded-lg resize-none"
                  rows={3}
                  placeholder="Write a caption..."
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await postService.updatePost(postId!, { caption: newCaption });
                        setPost({ ...post, caption: newCaption });
                        setEditingCaption(false);
                        toast({
                          title: "Caption Updated",
                          description: "Your caption has been updated successfully",
                        });
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to update caption",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingCaption(false);
                      setNewCaption(post.caption || "");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Link to={`/profile/${post.authorUsername}`} className="font-semibold hover:underline inline-flex items-center gap-1">
                  {post.authorUsername}
                  {post.authorVerified && <VerifiedBadge size="sm" />}
                </Link>{" "}
                <ParsedCaption text={post.caption || ""} />
              </>
            )}
          </div>

          {/* Hashtags */}
          <div className="flex flex-wrap gap-2 px-4">
            {post.tags?.map((tag) => (
              <Link
                key={tag}
                to={`/search?q=${tag}`}
                className="text-sm text-primary hover:underline"
              >
                #{tag}
              </Link>
            ))}
          </div>

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground px-4">
            {post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'Recently'}
          </div>

          {/* View All Comments Button */}
          {!showComments && comments.length > 0 && (
            <button
              onClick={() => setShowComments(true)}
              className="text-sm text-muted-foreground hover:text-foreground px-4"
            >
              View all {comments.filter(c => !c.parentCommentId).length} comments
            </button>
          )}

          {/* Comments Section */}
          {showComments && (
          <div className="border-t pt-4 space-y-4 px-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm">Comments</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCommentSort('recent')}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    commentSort === 'recent'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Recent
                </button>
                <button
                  onClick={() => setCommentSort('top')}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    commentSort === 'top'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Top
                </button>
              </div>
            </div>

            {topLevelComments.map((comment) => {
              const isOwner = currentUser?.userId === comment.authorId;
              const replies = getRepliesForComment(comment.commentId);
              const isExpanded = expandedComments.has(comment.commentId);
              
              return (
                <div 
                  key={comment.commentId} 
                  className="space-y-3"
                  ref={(el) => { commentRefs.current[comment.commentId] = el; }}
                >
                  {/* Pinned Badge */}
                  {comment.isPinned && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Pin className="h-3 w-3" />
                      <span>Pinned by creator</span>
                    </div>
                  )}

                  {/* Main Comment */}
                  <div className={`group relative transition-all duration-300 ${
                    highlightedComment === comment.commentId ? 'bg-primary/10 -mx-2 px-2 py-2 rounded-lg' : ''
                  }`}>
                    <div className="flex gap-3">
                      <Link to={`/profile/${comment.authorUsername}`} className="flex-shrink-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.authorAvatarURL} />
                          <AvatarFallback>{comment.authorUsername[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Link to={`/profile/${comment.authorUsername}`} className="font-semibold text-sm hover:underline">
                                {comment.authorUsername}
                              </Link>
                              {isOwner && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-sm mt-0.5">{comment.text}</p>
                            <div className="text-xs text-muted-foreground flex items-center gap-3">
                              <span>{timeAgo(comment.createdAt)}</span>
                              {comment.likesCount > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleCommentLike(comment.commentId)}
                                    className="hover:text-foreground font-semibold"
                                  >
                                    {comment.likesCount} {comment.likesCount === 1 ? 'like' : 'likes'}
                                  </button>
                                  {comment.likedByAuthor && (
                                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-semibold">
                                      ❤️ Author
                                    </span>
                                  )}
                                </div>
                              )}
                              <button 
                                onClick={() => handleReply(comment.authorUsername, comment.commentId)}
                                className="hover:text-foreground font-semibold"
                              >
                                Reply
                              </button>
                            </div>
                            
                            {/* View Replies Button */}
                            {replies.length > 0 && (
                              <button
                                onClick={() => toggleReplies(comment.commentId)}
                                className="text-xs font-semibold text-muted-foreground hover:text-foreground mt-1"
                              >
                                {isExpanded ? '━' : '―'} View replies ({replies.length})
                              </button>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            {/* Like Button */}
                            <button
                              onClick={() => handleCommentLike(comment.commentId)}
                              className="flex-shrink-0 transition-transform hover:scale-110"
                            >
                              <Heart
                                className={`h-4 w-4 transition-all ${
                                  likedComments.has(comment.commentId)
                                    ? "fill-red-500 text-red-500"
                                    : "text-muted-foreground hover:text-red-400"
                                }`}
                              />
                            </button>

                            {/* Pin button - Always visible when pinned, else on hover */}
                            {currentUser?.userId === post?.authorId && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!postId) return;
                                  try {
                                    if (comment.isPinned) {
                                      await postService.unpinComment(postId, comment.commentId);
                                      toast({ title: "Comment unpinned" });
                                    } else {
                                      await postService.pinComment(postId, comment.commentId);
                                      toast({ title: "Comment pinned" });
                                    }
                                    const { comments: newComments } = await postService.getComments(postId);
                                    setComments(newComments);
                                  } catch (error: any) {
                                    toast({
                                      title: "Error",
                                      description: error.message,
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className={`p-1 hover:bg-accent rounded transition-colors ${
                                  comment.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}
                                title={comment.isPinned ? "Unpin comment" : "Pin comment"}
                              >
                                <Pin className={`h-4 w-4 transition-colors ${
                                  comment.isPinned ? 'text-primary fill-primary' : 'text-muted-foreground hover:text-foreground'
                                }`} />
                              </button>
                            )}

                            {/* Comment Actions Menu */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">

                              {/* More options dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 hover:bg-accent rounded transition-colors">
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {isOwner && (
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteComment(comment.commentId)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                  {!isOwner && currentUser && (
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        if (!postId || !currentUser) return;
                                        try {
                                          await postService.reportComment(
                                            postId,
                                            comment.commentId,
                                            currentUser.userId,
                                            'inappropriate'
                                          );
                                          toast({
                                            title: "Comment Reported",
                                            description: "Thank you for keeping our community safe",
                                          });
                                        } catch (error: any) {
                                          toast({
                                            title: "Error",
                                            description: error.message,
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Flag className="mr-2 h-4 w-4" />
                                      Report
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nested Replies */}
                  {isExpanded && replies.length > 0 && (
                    <div className="ml-11 space-y-3 pl-4 border-l-2 border-muted">
                      {replies.map((reply) => {
                        const isReplyOwner = currentUser?.userId === reply.authorId;
                        return (
                          <div 
                            key={reply.commentId} 
                            className={`group relative transition-all duration-300 ${
                              highlightedComment === reply.commentId ? 'bg-primary/10 -mx-2 px-2 py-2 rounded-lg' : ''
                            }`}
                            ref={(el) => { commentRefs.current[reply.commentId] = el; }}
                          >
                            <div className="flex gap-3">
                              <Link to={`/profile/${reply.authorUsername}`} className="flex-shrink-0">
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={reply.authorAvatarURL} />
                                  <AvatarFallback>{reply.authorUsername[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                              </Link>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Link to={`/profile/${reply.authorUsername}`} className="font-semibold text-sm hover:underline">
                                        {reply.authorUsername}
                                      </Link>
                                      {isReplyOwner && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                          You
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm mt-0.5">{reply.text}</p>
                                    <div className="text-xs text-muted-foreground flex items-center gap-3">
                                      <span>{timeAgo(reply.createdAt)}</span>
                                      {reply.likesCount > 0 && (
                                        <button
                                          onClick={() => handleCommentLike(reply.commentId)}
                                          className="hover:text-foreground font-semibold"
                                        >
                                          {reply.likesCount} {reply.likesCount === 1 ? 'like' : 'likes'}
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => handleReply(reply.authorUsername, comment.commentId)}
                                        className="hover:text-foreground font-semibold"
                                      >
                                        Reply
                                      </button>
                                    </div>
                                  </div>

                                  {/* Reply Action Buttons */}
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleCommentLike(reply.commentId)}
                                      className="flex-shrink-0 transition-transform hover:scale-110"
                                    >
                                      <Heart
                                        className={`h-4 w-4 transition-all ${
                                          likedComments.has(reply.commentId)
                                            ? "fill-red-500 text-red-500"
                                            : "text-muted-foreground hover:text-red-400"
                                        }`}
                                      />
                                    </button>

                                    {/* Reply Actions Menu */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="p-1 hover:bg-accent rounded transition-colors">
                                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          {isReplyOwner && (
                                            <DropdownMenuItem
                                              onClick={() => handleDeleteComment(reply.commentId)}
                                              className="text-destructive focus:text-destructive"
                                            >
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Delete
                                            </DropdownMenuItem>
                                          )}
                                          {!isReplyOwner && currentUser && (
                                            <DropdownMenuItem
                                              onClick={async () => {
                                                if (!postId || !currentUser) return;
                                                try {
                                                  await postService.reportComment(
                                                    postId,
                                                    reply.commentId,
                                                    currentUser.userId,
                                                    'inappropriate'
                                                  );
                                                  toast({
                                                    title: "Reply Reported",
                                                    description: "Thank you for keeping our community safe",
                                                  });
                                                } catch (error: any) {
                                                  toast({
                                                    title: "Error",
                                                    description: error.message,
                                                    variant: "destructive",
                                                  });
                                                }
                                              }}
                                              className="text-destructive focus:text-destructive"
                                            >
                                              <Flag className="mr-2 h-4 w-4" />
                                              Report
                                            </DropdownMenuItem>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* Reply Banner */}
      {replyingTo && (
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
            <span className="text-sm text-muted-foreground">
              Replying to <span className="font-semibold">@{replyingTo.username}</span>
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setReplyingTo(null);
                setCommentText("");
              }}
              className="h-6 px-2 text-xs"
            >
              Cancel
            </Button>
          </div>
      )}

      {/* Add Comment Input */}
      <div className="border-t bg-background">
        <div className="flex items-center gap-2 p-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser?.avatarURL} />
            <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase() || 'Y'}</AvatarFallback>
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
                handleAddComment();
              }
            }}
            className="flex-1"
          />
          <Button variant="ghost" size="icon">
            <Smile className="h-5 w-5" />
          </Button>
          {commentText.trim() && (
            <Button size="sm" onClick={handleAddComment}>
              {replyingTo ? "Reply" : "Post"}
            </Button>
          )}
        </div>
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
                if (!postId || !currentUser) return;
                try {
                  await postService.deletePost(postId, currentUser.userId);
                  toast({ title: "Post deleted successfully" });
                  setTimeout(() => window.history.back(), 500);
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
              Update your post caption. You can add emojis and hashtags.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              placeholder="Write a caption..."
              className="min-h-[120px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {newCaption.length} characters
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!postId) return;
                try {
                  await postService.updatePost(postId, { caption: newCaption });
                  setPost(post ? { ...post, caption: newCaption } : null);
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
                toast({ 
                  title: "Post hidden", 
                  description: "You won't see this post in your feed anymore" 
                });
                setTimeout(() => window.history.back(), 500);
              }}
            >
              Hide Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals - SharePostModal removed, using ShareDialog instead */}
      <ViewLikesModal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        postId={postId || ''}
      />

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Flag className="h-5 w-5" />
              Report Post
            </DialogTitle>
            <DialogDescription>
              Help us understand what's wrong with this post.
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

      {/* Rich Share Dialog */}
      {post && (
        <ShareDialog
          open={showRichShareDialog}
          onOpenChange={setShowRichShareDialog}
          contentType="post"
          contentId={postId!}
          contentData={{
            authorId: post.authorId,
            authorUsername: post.authorUsername,
            authorAvatarURL: post.authorAvatarURL,
            mediaURL: post.mediaURLs?.[0] || '',
            caption: post.caption,
            mediaType: post.postType === 'video' ? 'video' : 'image'
          }}
        />
      )}
      {/* Share Dialog */}
      <UserSelectorDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        onSelect={handleShareToChat}
        allowMessage={true}
        placeholder="Search users to share post..."
        title="Send post to"
      />
    </div>
  );
}
