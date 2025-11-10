import { useState, useEffect, useRef } from "react";
import { Link, useParams, useLocation, useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { X, Heart, MoreHorizontal, MessageCircle, Pin, Trash2, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useComments } from "@/hooks/usePost";
import { UniversalReportDialog } from "@/components/report/UniversalReportDialog";
import { reportService } from "../../src/services/report.service";

export default function Comments() {
  const { toast } = useToast();
  const { id: postId } = useParams<{ id: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const highlightCommentId = searchParams.get('comment');
  const { user: currentUser } = useAuth();
  const commentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Detect if this is from glimpses
  const isFromGlimpses = (location.state as any)?.fromGlimpses || 
                         document.referrer.includes('/glimpses') || 
                         window.location.pathname.includes('/glimpses');
  
  // Handle missing postId
  if (!postId) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
        <EmptyState
          icon={MessageCircle}
          title="Invalid Link"
          description="Could not find the post or glimpse."
          variant="minimal"
        />
        <Button onClick={() => window.history.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }
  
  // Load comments from appropriate collection
  const { comments, loading, addComment, likeComment, unlikeComment, deleteComment } = useComments(
    postId, 
    isFromGlimpses ? 'glimpses' : 'posts'
  );
  
  const [text, setText] = useState("");
  const [commentSort, setCommentSort] = useState<'recent' | 'top'>('recent');
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{ username: string; commentId: string } | null>(null);
  const [highlightedComment, setHighlightedComment] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [glimpseAuthorId, setGlimpseAuthorId] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [commentToReport, setCommentToReport] = useState<{ id: string; authorId: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch glimpse/post author ID
  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const { doc: firestoreDoc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../src/config/firebase');
        const docRef = firestoreDoc(db, isFromGlimpses ? 'glimpses' : 'posts', postId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGlimpseAuthorId(docSnap.data().authorId || docSnap.data().userId);
        }
      } catch (error) {
        console.error('Failed to fetch author:', error);
      }
    };
    if (postId) fetchAuthor();
  }, [postId, isFromGlimpses]);

  // Helper function for time display
  const timeAgo = (timestamp: any) => {
    if (!timestamp) return 'just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  };

  // Get top-level comments (no parent)
  console.log('📊 All comments:', comments.length, comments.map(c => ({ id: c.commentId, hasParent: !!c.parentCommentId })));
  const topLevelComments = comments
    .filter(c => !c.parentCommentId)
    .sort((a, b) => {
      if (commentSort === 'top') {
        return (b.likesCount || 0) - (a.likesCount || 0);
      }
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return bTime.getTime() - aTime.getTime();
    });

  // Get replies for a comment
  const getRepliesForComment = (commentId: string) => {
    return comments.filter(c => c.parentCommentId === commentId);
  };

  // Toggle reply expansion
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

  // Handle reply
  const handleReply = (username: string, commentId: string) => {
    setReplyingTo({ username, commentId });
    setText(`@${username} `);
  };

  if (loading) {
    return <LoadingState text="Loading comments..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !postId || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Pass parentCommentId if replying to a comment
      await addComment(text.trim(), replyingTo?.commentId);
      setText("");
      setReplyingTo(null);
      toast({
        title: replyingTo ? "Reply posted" : "Comment posted",
        description: replyingTo ? "Your reply has been added" : "Your comment has been added",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!currentUser) return;

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

    try {
      if (isLiked) {
        await unlikeComment(commentId, glimpseAuthorId || undefined);
      } else {
        await likeComment(commentId, glimpseAuthorId || undefined);
      }
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
      toast({
        title: "Error",
        description: error.message || "Failed to like comment",
        variant: "destructive",
      });
    }
  };

  if (comments.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Comments</h2>
          <button onClick={() => window.history.back()} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={MessageCircle}
            title="No comments yet"
            description="Be the first to comment"
            variant="minimal"
          />
        </div>
        <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1"
          />
          <Button type="submit" disabled={!text.trim()}>
            Post
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => window.history.back()} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">Comments</h1>
          <div className="w-6" />
        </div>
      </div>

      {/* Sort Tabs */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4 py-2">
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

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-4">
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
              {/* Main Comment */}
              <div className={`group relative ${
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
                          {comment.isVerified && (
                            <svg className="h-4 w-4 text-primary fill-primary" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          )}
                          {isOwner && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              You
                            </span>
                          )}
                          {!isOwner && comment.authorId === glimpseAuthorId && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                              Creator
                            </span>
                          )}
                        </div>
                        <p className="text-sm mt-0.5">{comment.text}</p>
                        <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                          <span>{timeAgo(comment.createdAt)}</span>
                          {comment.likesCount > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold">
                                {comment.likesCount} {comment.likesCount === 1 ? 'like' : 'likes'}
                              </span>
                              {comment.likedByCreator && (
                                <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded text-[10px] font-semibold flex items-center gap-1">
                                  <Heart className="h-3 w-3 fill-red-500" /> Creator
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
                        <button
                          onClick={() => handleLike(comment.commentId)}
                          className="flex-shrink-0 transition-transform hover:scale-110"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              likedComments.has(comment.commentId)
                                ? "fill-red-500 text-red-500"
                                : "text-muted-foreground hover:text-red-400"
                            }`}
                          />
                        </button>

                        {/* Pin button - Only for creator */}
                        {currentUser?.userId === glimpseAuthorId && (
                          <button
                            onClick={async () => {
                              const newPinState = !comment.isPinned;
                              try {
                                const { doc: firestoreDoc, updateDoc } = await import('firebase/firestore');
                                const { db } = await import('../../src/config/firebase');
                                const commentRef = firestoreDoc(db, isFromGlimpses ? 'glimpses' : 'posts', postId, 'comments', comment.commentId);
                                await updateDoc(commentRef, {
                                  isPinned: newPinState
                                });
                                toast({
                                  title: newPinState ? "Comment pinned" : "Comment unpinned",
                                });
                                // Force re-fetch comments to update UI
                                window.location.reload();
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

                        {/* More options */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 hover:bg-accent rounded">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isOwner && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setCommentToDelete(comment.commentId);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                              {!isOwner && (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setCommentToReport({ id: comment.commentId, authorId: comment.authorId });
                                    setShowReportDialog(true);
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
                      <div key={reply.commentId} className="group flex gap-3">
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
                                {reply.isVerified && (
                                  <svg className="h-4 w-4 text-primary fill-primary" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                  </svg>
                                )}
                                {isReplyOwner && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                    You
                                  </span>
                                )}
                                {!isReplyOwner && reply.authorId === glimpseAuthorId && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                    Creator
                                  </span>
                                )}
                              </div>
                              <p className="text-sm mt-0.5">{reply.text}</p>
                              <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                                <span>{timeAgo(reply.createdAt)}</span>
                                {reply.likesCount > 0 && (
                                  <span className="font-semibold">
                                    {reply.likesCount} {reply.likesCount === 1 ? 'like' : 'likes'}
                                  </span>
                                )}
                                <button 
                                  onClick={() => handleReply(reply.authorUsername, comment.commentId)}
                                  className="hover:text-foreground font-semibold"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleLike(reply.commentId)}
                                className="flex-shrink-0 transition-transform hover:scale-110"
                              >
                                <Heart
                                  className={`h-4 w-4 ${
                                    likedComments.has(reply.commentId)
                                      ? "fill-red-500 text-red-500"
                                      : "text-muted-foreground hover:text-red-400"
                                  }`}
                                />
                              </button>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="p-1 hover:bg-accent rounded">
                                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {isReplyOwner && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setCommentToDelete(reply.commentId);
                                          setShowDeleteDialog(true);
                                        }}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    )}
                                    {!isReplyOwner && (
                                      <DropdownMenuItem className="text-destructive focus:text-destructive">
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
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reply Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-t">
          <span className="text-sm text-muted-foreground">
            Replying to <span className="font-semibold">@{replyingTo.username}</span>
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setReplyingTo(null);
              setText("");
            }}
            className="h-6 px-2 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-20">
        <div className="max-w-md mx-auto p-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={currentUser?.avatarURL} />
              <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex items-center gap-2 bg-accent/50 rounded-full px-4 py-2 border border-border/50">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
              />
              {text.trim() && (
                <Button 
                  type="submit" 
                  size="sm" 
                  className="h-8 px-4 rounded-full font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (commentToDelete) {
                  try {
                    await deleteComment(commentToDelete);
                    toast({
                      title: "Comment deleted",
                      description: "Your comment has been removed",
                    });
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "Failed to delete comment",
                      variant: "destructive",
                    });
                  } finally {
                    setShowDeleteDialog(false);
                    setCommentToDelete(null);
                  }
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Dialog */}
      <UniversalReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        title="Report Comment"
        description="Help us understand what's wrong with this comment"
        onSubmit={async (category, subcategory, customReason) => {
          if (!commentToReport || !currentUser) return;
          try {
            await reportService.reportComment(
              commentToReport.id,
              commentToReport.authorId,
              currentUser.userId,
              currentUser.username,
              category,
              subcategory,
              customReason
            );
            toast({
              title: "Report submitted",
              description: "Thank you for keeping our community safe",
            });
            setCommentToReport(null);
          } catch (error: any) {
            toast({
              title: "Error",
              description: error.message || "Failed to submit report",
              variant: "destructive",
            });
          }
        }}
      />
    </div>
  );
}
