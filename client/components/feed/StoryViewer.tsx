import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, MoreVertical, Send, Heart, Eye, ChevronLeft, ChevronRight, Volume2, VolumeX, Smile, Laugh, HeartHandshake, Sparkles, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { storyService } from "../../../src/services/story.service";
import type { Story as DBStory } from "../../../src/types/database";

interface StoryUser {
  userId: string;
  username: string;
  avatarURL?: string;
  stories: DBStory[];
  hasActiveStory: boolean;
}

interface StoryViewerProps {
  open: boolean;
  onClose: () => void;
  initialUser: StoryUser;
  allUsers: StoryUser[];
}

interface Viewer {
  id: number;
  name: string;
  avatar?: string;
  viewedAt: string;
}

// Viewers will be fetched from API
const mockViewers: Viewer[] = [];

export function StoryViewer({ open, onClose, initialUser, allUsers }: StoryViewerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentUserIndex, setCurrentUserIndex] = useState(
    allUsers.findIndex(u => u.userId === initialUser.userId)
  );
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const emojis = [
    { icon: Heart, label: '❤️', color: 'text-red-500' },
    { icon: Laugh, label: '😂', color: 'text-yellow-500' },
    { icon: HeartHandshake, label: '😍', color: 'text-pink-500' },
    { icon: Sparkles, label: '😮', color: 'text-blue-500' },
    { icon: ThumbsUp, label: '👍', color: 'text-green-500' },
  ];

  const currentUser = allUsers[currentUserIndex];
  const currentStory = currentUser?.stories[currentStoryIndex];
  const isOwnStory = currentUser?.userId === user?.userId;

  // Story progress animation
  useEffect(() => {
    if (!open || isPaused || !currentStory) return;

    const duration = 5000; // 5 seconds per story
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [open, isPaused, currentStoryIndex, currentUserIndex]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [currentStoryIndex, currentUserIndex]);

  // Mark story as viewed when displayed
  useEffect(() => {
    const markAsViewed = async () => {
      if (!open || !currentStory || !user) return;
      
      try {
        // Mark this story as viewed
        await storyService.viewStory(currentStory.storyId, user.userId);
      } catch (error) {
        console.error('Failed to mark story as viewed:', error);
      }
    };

    markAsViewed();
  }, [open, currentStory, user]);

  // Prevent body scroll
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

  const nextStory = () => {
    if (currentStoryIndex < currentUser.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentUserIndex < allUsers.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      setCurrentStoryIndex(allUsers[currentUserIndex - 1].stories.length - 1);
    }
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const threshold = rect.width / 3;

    if (x < threshold) {
      prevStory();
    } else if (x > threshold * 2) {
      nextStory();
    }
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    toast({
      title: "Reply sent",
      description: `Your reply to ${currentUser.username}'s story has been sent`,
    });
    setReplyText("");
  };

  const handleEmojiReaction = (emoji: string) => {
    toast({
      title: "Reaction sent",
      description: `You reacted with ${emoji}`,
    });
  };

  // Swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentTouch = e.targetTouches[0].clientY;
    const distance = currentTouch - touchStart;
    if (distance > 0) {
      setSwipeDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    if (swipeDistance > 100) {
      onClose();
    }
    setSwipeDistance(0);
  };

  if (!open || !currentUser || !currentStory) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-500"
      style={{
        backgroundColor: swipeDistance > 0 ? `rgba(0, 0, 0, ${1 - swipeDistance / 200})` : 'rgb(0, 0, 0)',
        backdropFilter: swipeDistance > 0 ? `blur(${swipeDistance / 10}px)` : 'none'
      }}
    >
      {/* Story Container */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-md h-full bg-black flex flex-col transition-transform duration-300"
        style={{
          transform: `translateY(${swipeDistance}px) scale(${1 - swipeDistance / 1000})`,
          borderRadius: swipeDistance > 0 ? `${swipeDistance / 5}px` : '0px'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Story Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
          {currentUser.stories.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ 
                  width: index === currentStoryIndex 
                    ? `${progress}%` 
                    : index < currentStoryIndex 
                      ? '100%' 
                      : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-10 px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Avatar className="h-10 w-10 ring-2 ring-white/50">
                <AvatarImage src={currentUser.avatarURL} />
                <AvatarFallback className="bg-primary/20 text-white">{currentUser.username[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{currentUser.username}</p>
                <p className="text-white/70 text-xs">{currentStory.createdAt ? new Date(currentStory.createdAt.toDate()).toLocaleString() : ''}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Mute/Unmute */}
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-white" />
                ) : (
                  <Volume2 className="h-5 w-5 text-white" />
                )}
              </button>

              {/* More Options */}
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <MoreVertical className="h-5 w-5 text-white" />
              </button>

              {/* Close */}
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Story Content */}
        <div 
          className="flex-1 relative"
          onClick={handleTap}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Story Image/Video */}
          <img
            src={currentStory?.mediaURL || '/placeholder.svg'}
            alt="Story"
            className="w-full h-full object-contain"
          />

          {/* Previous/Next Buttons (Desktop) */}
          {currentUserIndex > 0 && (
            <button
              onClick={prevStory}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-all hidden sm:block z-20"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
          )}
          {(currentUserIndex < allUsers.length - 1 || currentStoryIndex < currentUser.stories.length - 1) && (
            <button
              onClick={nextStory}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-all hidden sm:block z-20"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
          )}

        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          {/* Views Count (Own Story) */}
          {isOwnStory && (
            <button
              onClick={() => setShowViewers(true)}
              className="flex items-center gap-2 text-white mb-3 hover:bg-white/10 rounded-full px-3 py-2 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">{currentStory.viewsCount} views</span>
            </button>
          )}

          {/* Emoji Reactions */}
          {!isOwnStory && (
            <div className="flex items-center justify-center gap-3 mb-3 overflow-x-auto scrollbar-hide">
              {emojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiReaction(emoji.label)}
                  className="flex-shrink-0 p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 active:scale-90 transition-all duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <emoji.icon className={`h-6 w-6 ${emoji.color}`} />
                </button>
              ))}
            </div>
          )}

          {/* Reply Input */}
          {!isOwnStory && (
            <form onSubmit={handleReply} className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Send message"
                className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2.5 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 transition-all"
              />
              {replyText.trim() ? (
                <button
                  type="submit"
                  className="p-2.5 bg-white rounded-full hover:bg-white/90 transition-all active:scale-90"
                >
                  <Send className="h-5 w-5 text-black" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleEmojiReaction('❤️')}
                  className="p-2.5 hover:bg-white/10 rounded-full transition-all active:scale-90"
                >
                  <Heart className="h-6 w-6 text-white" />
                </button>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Viewers List Modal */}
      {showViewers && isOwnStory && (
        <div className="absolute inset-0 bg-black/90 z-20 flex items-end">
          <div className="w-full max-w-md mx-auto bg-background rounded-t-3xl" style={{ height: '60vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Viewers ({mockViewers.length})</h3>
              <button
                onClick={() => setShowViewers(false)}
                className="p-1.5 hover:bg-accent rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Viewers List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mockViewers.map((viewer) => (
                <div key={viewer.id} className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={currentUser.avatarURL} className="object-cover" />
                    <AvatarFallback className="text-lg bg-gradient-to-br from-primary/30 to-primary/10">
                      {currentUser.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{currentUser.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {currentStory.createdAt ? new Date(currentStory.createdAt.toDate()).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
