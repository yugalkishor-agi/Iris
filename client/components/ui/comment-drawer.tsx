import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Heart, Send, X, FileImage } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { postService } from "../../../src/services/post.service";
import { GifPickerModal } from "@/components/ui/gif-picker-modal";
import { isGiphyUrl } from "@/utils/gifUtils";

interface QuickComment {
  id: number;
  user: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  text: string;
  time: string;
  likes: number;
  isLiked: boolean;
}

interface CommentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  totalComments: number;
}

// Helper to format comment timestamp
const formatCommentTime = (timestamp: any): string => {
  if (!timestamp) return 'Just now';
  
  try {
    const date = typeof timestamp === 'object' && 'toDate' in timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp);
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
  } catch {
    return 'Recently';
  }
};

export function CommentDrawer({ open, onOpenChange, postId, totalComments }: CommentDrawerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [comments, setComments] = useState<QuickComment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  // Load real comments when drawer opens
  useEffect(() => {
    if (open && postId) {
      loadComments();
    }
  }, [open, postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const result = await postService.getComments(postId);
      const postComments = result.comments || [];
      
      // Transform backend comments to match QuickComment interface
      const transformedComments: QuickComment[] = postComments.map((comment: any) => ({
        id: comment.commentId,
        user: {
          name: comment.authorUsername || 'User',
          avatar: comment.authorAvatarURL || '',
          verified: comment.authorVerified || false
        },
        text: comment.text,
        time: formatCommentTime(comment.createdAt),
        likes: comment.likesCount || 0,
        isLiked: comment.isLikedByCurrentUser || false
      }));
      
      setComments(transformedComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || submitting) return;

    try {
      setSubmitting(true);
      
      // Add comment through backend with all required parameters
      await postService.addComment(
        postId,
        user.userId,
        user.username,
        user.avatarURL || '',
        text.trim()
      );
      
      // Reload comments to get fresh data
      await loadComments();
      
      setText("");
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: number) => {
    if (!user) return;
    
    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;
      
      // Optimistic update
      setComments(
        comments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: !c.isLiked,
                likes: c.isLiked ? c.likes - 1 : c.likes + 1,
              }
            : c
        )
      );
      
      // Backend update
      if (comment.isLiked) {
        await postService.unlikeComment(postId, commentId.toString(), user.userId);
      } else {
        await postService.likeComment(postId, commentId.toString(), user.userId);
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
      // Revert on error
      setComments(
        comments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: !c.isLiked,
                likes: c.isLiked ? c.likes + 1 : c.likes - 1,
              }
            : c
        )
      );
    }
  };

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-in fade-in-0 duration-300"
        onClick={() => onOpenChange(false)}
        aria-label="Close comments"
      />
      
      {/* Mobile Comment Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="mx-auto max-w-md">
          <div className="bg-background rounded-t-3xl shadow-2xl flex flex-col border-t border-border/50" style={{ height: '70vh' }}>
            {/* Drag Handle */}
            <div className="flex-shrink-0 flex justify-center py-3">
              <div className="w-12 h-1.5 bg-muted-foreground/40 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b">
              <div className="w-8" />
              <h2 className="text-base font-semibold tracking-tight">Comments ({totalComments})</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 hover:bg-accent/50 rounded-full transition-all duration-200 hover:scale-110 active:scale-90"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : comments.map((comment, index) => (
                <div 
                  key={comment.id} 
                  className="flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms`, animationDuration: '300ms' }}
                >
                  <Avatar className="h-9 w-9 flex-shrink-0 ring-1 ring-border/50">
                    <AvatarImage src={comment.user.avatar} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary/10 to-primary/5">{comment.user.name[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-sm">{comment.user.name}</span>
                          {comment.user.verified && <VerifiedBadge size="sm" />}
                        </div>
                        {(() => {
                          // Check if it's a sticker (has STICKER: prefix)
                          const isSticker = comment.text.startsWith('STICKER:');
                          const actualUrl = isSticker ? comment.text.replace('STICKER:', '') : comment.text;
                          
                          if (isSticker || isGiphyUrl(actualUrl)) {
                            return (
                              <div className="rounded-lg overflow-hidden max-w-xs mt-2">
                                <img 
                                  src={actualUrl} 
                                  alt={isSticker ? "Sticker" : "GIF"}
                                  className="w-full h-auto"
                                  loading="lazy"
                                />
                              </div>
                            );
                          }
                          
                          return (
                            <p className="text-sm mt-1 break-words leading-relaxed">{comment.text}</p>
                          );
                        })()}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="font-medium">{comment.time}</span>
                          {comment.likes > 0 && (
                            <span className="font-semibold">{comment.likes} likes</span>
                          )}
                          <button className="font-semibold hover:text-foreground transition-colors">Reply</button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleLike(comment.id)}
                        className={`transition-all duration-200 mt-1 active:scale-90 ${
                          comment.isLiked ? "text-red-500 scale-110" : "text-muted-foreground hover:text-foreground hover:scale-110"
                        }`}
                        aria-label="Like comment"
                      >
                        <Heart
                          className="h-4 w-4"
                          fill={comment.isLiked ? "currentColor" : "none"}
                          strokeWidth={comment.isLiked ? 0 : 2}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No comments yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Be the first to comment!</p>
                </div>
              )}
            </div>

            {/* Fixed Input Bar */}
            <div className="flex-shrink-0 border-t border-border/50 bg-background p-3.5 pb-safe">
              <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0 ring-1 ring-border/50">
                  <AvatarImage />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-primary/10 to-primary/5">Y</AvatarFallback>
                </Avatar>

                <div className="flex-1 flex items-center gap-2 bg-muted/60 rounded-full px-4 py-2.5 border border-border/50 focus-within:border-primary/50 focus-within:bg-muted/80 transition-all">
                  <button
                    type="button"
                    onClick={() => setShowGifPicker(true)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Add GIF"
                  >
                    <FileImage className="h-4 w-4" />
                  </button>
                  
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-auto px-0 text-sm placeholder:text-muted-foreground/60"
                  />
                  
                  {text.trim() && (
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="text-primary font-bold hover:text-primary/80 transition-all duration-200 text-sm hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {submitting ? 'Posting...' : 'Post'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* GIF Picker Modal */}
      <GifPickerModal
        open={showGifPicker}
        onOpenChange={setShowGifPicker}
        onSelect={async (gifUrl, type) => {
          if (!user || submitting) return;
          try {
            setSubmitting(true);
            // Add prefix for stickers to distinguish from GIFs
            const commentText = type === 'sticker' ? `STICKER:${gifUrl}` : gifUrl;
            
            // Post GIF/Sticker as comment
            await postService.addComment(
              postId,
              user.userId,
              user.username,
              user.avatarURL || '',
              commentText  // GIF/Sticker URL as comment text
            );
            await loadComments();
            toast({
              title: type === 'sticker' ? "Sticker posted" : "GIF posted",
              description: `Your ${type === 'sticker' ? 'sticker' : 'GIF'} comment has been added`,
            });
          } catch (error) {
            console.error('Failed to post:', error);
            toast({
              title: "Error",
              description: "Failed to post comment",
              variant: "destructive"
            });
          } finally {
            setSubmitting(false);
          }
        }}
        title="Add GIF to Comment"
      />
    </>,
    document.body
  );
}
