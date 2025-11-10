import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Heart, Send, MoreVertical, X, Pause, Play, MessageCircle, Share2, Bookmark, Settings, Users, Star } from "lucide-react";
import { storyService } from "../../src/services/story.service";
import { messageService } from "../../src/services/message.service";
import { useAuth } from "@/contexts/AuthContext";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { useToast } from "@/hooks/use-toast";
import StorySettingsModal from "@/components/story/StorySettingsModal";
import ShareStoryModal from "@/components/story/ShareStoryModal";
import { MentionSticker } from "@/components/story/MentionSticker";
import './story-futuristic-animations.css';

const STORY_DURATION = 7000; // 7 seconds per story

export default function StoryViewer() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [isPaused, setIsPaused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStory, setCurrentStory] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storyUser, setStoryUser] = useState<any>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [insightsTab, setInsightsTab] = useState<'views' | 'likes'>('views');
  const [realtimeViews, setRealtimeViews] = useState(0);
  const [newNotifications, setNewNotifications] = useState<Array<{type: 'like' | 'view' | 'reply', username: string, timestamp: number}>>([]);
  const [viewersList, setViewersList] = useState<string[]>([]);
  const [viewersData, setViewersData] = useState<any[]>([]);
  const [likersData, setLikersData] = useState<string[]>([]);
  const [likesList, setLikesList] = useState<string[]>([]);
  const [repliesList, setRepliesList] = useState<any[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsCache, setInsightsCache] = useState<Map<string, {viewers: any[], likers: string[]}>>(new Map());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEmojiReactions, setShowEmojiReactions] = useState(false);
  const [showViewerMenu, setShowViewerMenu] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const viewerMenuRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Swipe up gesture handler
  const handleViewersTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleViewersTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const swipeDistance = touchStartY - touchEndY;
    
    // If swiped up more than 50px, open viewers sheet
    if (swipeDistance > 50) {
      setShowViewersSheet(true);
    }
  };

  // Real-time notifications disabled - will implement with proper Firebase listeners later
  // No fake notifications anymore

  // Load stories from Firebase
  useEffect(() => {
    const loadStories = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const userStories = await storyService.getUserActiveStories(userId);
        setStories(userStories);
        if (userStories.length > 0) {
          setStoryUser({
            username: userStories[0].authorUsername,
            avatarURL: userStories[0].authorAvatarURL,
            verified: userStories[0].authorVerified || false,
          });
        }
      } catch (error) {
        console.error('Failed to load stories:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStories();
  }, [userId]);

  // Close More menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
        setIsPaused(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  // Close Viewer menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewerMenuRef.current && !viewerMenuRef.current.contains(event.target as Node)) {
        setShowViewerMenu(false);
        setIsPaused(false);
      }
    };

    if (showViewerMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showViewerMenu]);

  // Play background music if story has music
  useEffect(() => {
    if (stories.length === 0 || !stories[currentStory]) return;
    
    const story = stories[currentStory];
    if (story.backgroundMusic?.streamUrl) {
      // Create or update audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      // Background music detected
      
      // Set the audio source and play
      if (audioRef.current) {
        audioRef.current.src = story.backgroundMusic.streamUrl;
        audioRef.current.volume = 0.5;
        audioRef.current.loop = true;
        audioRef.current.play().catch(() => {
          // Silently fail - user can tap to play
        });
      }
    } else {
      // Stop audio if no music or no stream URL
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    }
    
    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [currentStory, stories]);

  // Mark story as viewed when displayed (for all stories including own)
  useEffect(() => {
    const markAsViewed = async () => {
      if (!currentUser || stories.length === 0 || !stories[currentStory]) return;
      
      const story = stories[currentStory];
      
      try {
        // Always mark as viewed (service will handle owner vs viewer logic)
        // Owner's view is recorded but doesn't increment count
        await storyService.viewStory(story.storyId, currentUser.userId);
        console.log('✅ Story marked as viewed:', story.storyId, 'by', currentUser.userId);
      } catch (error) {
        console.error('Failed to mark story as viewed:', error);
      }
    };

    markAsViewed();
  }, [currentStory, stories, currentUser]);

  // Preload insights data immediately when story loads (not just when panel opens)
  useEffect(() => {
    const preloadInsightsData = async () => {
      if (!stories[currentStory] || userId !== currentUser?.userId) return;
      
      const storyId = stories[currentStory].storyId;
      
      // Check if already cached
      if (insightsCache.has(storyId)) {
        const cached = insightsCache.get(storyId)!;
        setViewersData(cached.viewers);
        setLikersData(cached.likers);
        setViewersList(cached.viewers.map(v => v.userId));
        return;
      }
      
      try {
        setLoadingInsights(true);
        console.log('📊 Preloading insights for story:', storyId);
        
        // Fetch viewer IDs and liker IDs in parallel
        const [viewerIds, likerIds] = await Promise.all([
          storyService.getStoryViews(storyId),
          storyService.getStoryLikes(storyId)
        ]);
        
        setViewersList(viewerIds);
        setLikersData(likerIds);
        
        // Batch fetch all unique user IDs
        const uniqueUserIds = Array.from(new Set([...viewerIds, ...likerIds]));
        
        if (uniqueUserIds.length === 0) {
          setViewersData([]);
          setLoadingInsights(false);
          return;
        }
        
        // Fetch all user data in parallel (much faster)
        const { userService } = await import('../../src/services/user.service');
        const usersData = await Promise.all(
          uniqueUserIds.map(async (userId) => {
            try {
              return await userService.getUser(userId);
            } catch (err) {
              console.error('Failed to fetch user:', userId);
              return null;
            }
          })
        );
        
        // Create user map for quick lookup
        const userMap = new Map();
        usersData.filter(u => u !== null).forEach(user => {
          userMap.set(user.userId, user);
        });
        
        // Build viewers data with hasLiked flag
        const validUsers = usersData.filter(u => u !== null) as any[];
        const ownerId = currentUser?.userId;
        
        // Filter out owner from viewers list (owner should not see themselves in viewers)
        const viewersWithLikeStatus = validUsers
          .filter(user => user.userId !== ownerId)
          .map(user => ({
            ...user,
            hasLiked: likerIds.includes(user.userId)
          }));
        
        console.log('✅ Insights preloaded:', viewersWithLikeStatus.length, 'viewers (owner filtered out)');
        
        setViewersData(viewersWithLikeStatus);
        
        // Cache the results
        setInsightsCache(prev => new Map(prev).set(storyId, {
          viewers: viewersWithLikeStatus,
          likers: likerIds
        }));
      } catch (error) {
        console.error('Failed to preload insights:', error);
      } finally {
        setLoadingInsights(false);
      }
    };

    preloadInsightsData();
  }, [currentStory, stories, userId, currentUser]);

  // Auto-pause story when viewing insights
  useEffect(() => {
    if (showInsights) {
      setIsPaused(true);
    } else {
      setIsPaused(false);
    }
  }, [showInsights]);

  // Check if current user has liked the story
  useEffect(() => {
    const checkIfLiked = async () => {
      if (!currentUser || !stories[currentStory]) return;
      
      // This would require a method to check if user has liked
      // For now, keeping local state
    };
    checkIfLiked();
  }, [currentStory, stories, currentUser]);

  useEffect(() => {
    if (isPaused || isTyping) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Move to next story
          if (currentStory < stories.length - 1) {
            setCurrentStory(currentStory + 1);
            return 0;
          } else {
            // End of stories - use setTimeout to avoid setState during render
            setTimeout(() => navigate('/'), 0);
            return prev;
          }
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, isTyping, currentStory, navigate, stories.length]);

  const handlePrevious = () => {
    if (currentStory > 0) {
      setCurrentStory(currentStory - 1);
      setProgress(0);
    } else {
      navigate('/');
    }
  };

  const handleNext = () => {
    if (currentStory < stories.length - 1) {
      setCurrentStory(currentStory + 1);
      setProgress(0);
    } else {
      navigate('/');
    }
  };

  // Check if current user is mentioned in this story
  const isCurrentUserMentioned = useMemo(() => {
    if (!currentUser || !stories[currentStory]) return false;
    const story = stories[currentStory];
    
    // Check mentions array
    if (story.mentions?.includes(currentUser.username)) return true;
    
    // Check mentionStickers array
    if (story.mentionStickers?.some((m: any) => m.username === currentUser.username)) return true;
    
    return false;
  }, [currentUser, stories, currentStory]);

  const handleMentionReply = () => {
    if (!currentUser || !stories[currentStory]) return;
    const story = stories[currentStory];
    
    // Navigate to story creation with mention data
    navigate('/story/create', {
      state: {
        mentionReplyTo: {
          userId: story.authorId,
          username: story.authorUsername,
          avatarURL: story.authorAvatarURL,
          verified: storyUser?.verified || false,
          storyId: story.storyId,
        },
      },
    });
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !currentUser || !userId || !stories[currentStory]) return;
    
    try {
      const story = stories[currentStory];
      
      // Get or create conversation
      const conversationId = await messageService.getOrCreateDirectConversation(
        currentUser.userId,
        userId
      );

      // Send message with story reply context
      await messageService.sendMessage(conversationId, {
        senderId: currentUser.userId,
        senderUsername: currentUser.username,
        text: replyText,
        type: 'story_reply',
        storyReply: {
          storyId: story.storyId,
          mediaURL: story.mediaURL,
          authorUsername: storyUser?.username || 'User',
          authorAvatar: storyUser?.avatarURL,
          authorVerified: storyUser?.verified || false,
        },
      });

      toast({
        title: 'Reply sent!',
        description: 'Your message was sent',
      });
      
      setReplyText('');
      setIsTyping(false);
      setIsPaused(false);
      setShowEmojiReactions(false);
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStory = async () => {
    if (!currentUser || !stories[currentStory]) return;
    
    const story = stories[currentStory];
    
    try {
      await storyService.deleteStory(story.storyId, currentUser.userId);
      
      toast({
        title: "Story deleted",
        description: "Your story has been deleted successfully.",
      });
      
      setShowDeleteDialog(false);
      navigate('/');
      setTimeout(() => window.location.reload(), 100);
    } catch (error: any) {
      console.error('Failed to delete story:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete story",
        variant: "destructive",
      });
    }
  };

  const handleRepost = async () => {
    if (!currentUser || stories.length === 0) return;

    const story = stories[currentStory];
    
    // Check if user is mentioned
    if (!story.mentions?.includes(currentUser.username)) {
      toast({
        title: "Cannot repost",
        description: "You can only repost stories where you're mentioned",
        variant: "destructive",
      });
      return;
    }

    try {
      await storyService.repostStory(
        story.storyId,
        currentUser.userId,
        currentUser.username,
        currentUser.avatarURL || ''
      );

      toast({
        title: "Story reposted!",
        description: "Shared to your story",
      });
    } catch (error: any) {
      console.error('Failed to repost:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to repost story",
        variant: "destructive",
      });
    }
  };

  const handleLike = async () => {
    if (!currentUser || !stories[currentStory]) return;
    
    try {
      const story = stories[currentStory];
      
      if (isLiked) {
        await storyService.unlikeStory(story.storyId, currentUser.userId);
        setIsLiked(false);
        // Update local count
        const updatedStories = [...stories];
        updatedStories[currentStory].likesCount = Math.max(0, (updatedStories[currentStory].likesCount || 0) - 1);
        setStories(updatedStories);
      } else {
        await storyService.likeStory(story.storyId, currentUser.userId);
        setIsLiked(true);
        // Update local count
        const updatedStories = [...stories];
        updatedStories[currentStory].likesCount = (updatedStories[currentStory].likesCount || 0) + 1;
        setStories(updatedStories);
      }
    } catch (error) {
      console.error('Failed to like/unlike story:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (loading || stories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white">Loading stories...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{
                width: `${
                  index < currentStory
                    ? 100
                    : index === currentStory
                    ? progress
                    : 0
                }%`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Instagram-style Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between p-3">
          {/* User Info */}
          <div className="flex items-center gap-2 flex-1">
            <Avatar className="h-8 w-8 border border-white/30">
              <AvatarImage src={storyUser?.avatarURL} />
              <AvatarFallback className="bg-gray-800 text-white text-xs">
                {storyUser?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-semibold text-sm">{storyUser?.username}</span>
                {storyUser?.verified && <VerifiedBadge size="sm" />}
                {stories[currentStory]?.audience === 'closeFriends' && (
                  <div className="flex items-center gap-0.5 bg-green-600/90 px-1.5 py-0.5 rounded-full">
                    <Star className="h-2.5 w-2.5 text-white fill-white" />
                    <span className="text-[9px] text-white font-semibold uppercase tracking-wide">Close Friends</span>
                  </div>
                )}
              </div>
              <span className="text-white/80 text-xs">
                {stories[currentStory]?.createdAt && (() => {
                  const now = new Date();
                  const storyTime = new Date(stories[currentStory].createdAt.toDate());
                  const diffMs = now.getTime() - storyTime.getTime();
                  const diffMinutes = Math.floor(diffMs / 60000);
                  const diffSeconds = Math.floor(diffMs / 1000);
                  
                  // Show seconds for very recent stories (< 1 minute)
                  if (diffMinutes < 1) {
                    if (diffSeconds < 5) return 'Just now';
                    return `${diffSeconds}s ago`;
                  }
                  
                  // Show minutes
                  if (diffMinutes < 60) return `${diffMinutes}m ago`;
                  
                  // Show hours when >= 60 minutes
                  const diffHours = Math.floor(diffMinutes / 60);
                  if (diffHours < 24) return `${diffHours}h ago`;
                  
                  // Show days if > 24 hours
                  const diffDays = Math.floor(diffHours / 24);
                  return `${diffDays}d ago`;
                })()}
              </span>
            </div>
          </div>

          {/* Right: Pause + More buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
            >
              {isPaused ? <Play className="h-5 w-5 text-white" /> : <Pause className="h-5 w-5 text-white" />}
            </button>
            {userId === currentUser?.userId ? (
              <button
                onClick={() => setShowSettingsMenu(true)}
                className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
              >
                <Settings className="h-5 w-5 text-white" />
              </button>
            ) : (
              <div className="relative" ref={viewerMenuRef}>
                <button
                  onClick={() => {
                    setShowViewerMenu(!showViewerMenu);
                    setIsPaused(true);
                  }}
                  className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
                >
                  <MoreVertical className="h-5 w-5 text-white" />
                </button>
                
                {showViewerMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-black/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 overflow-hidden z-50">
                    {stories[currentStory]?.allowSharing && (
                      <button
                        onClick={() => {
                          setShowViewerMenu(false);
                          setIsPaused(false);
                          setShowShareModal(true);
                          setIsPaused(true);
                        }}
                        className="w-full px-4 py-3 text-left text-white text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <Share2 className="h-4 w-4" />
                        Share Story
                      </button>
                    )}
                    {stories[currentStory]?.mentions?.includes(currentUser?.username || '') && (
                      <button
                        onClick={() => {
                          setShowViewerMenu(false);
                          setIsPaused(false);
                          handleRepost();
                        }}
                        className="w-full px-4 py-3 text-left text-white text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Add to your story
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowViewerMenu(false);
                        setIsPaused(false);
                        navigate(`/profile/${storyUser?.username}`);
                      }}
                      className="w-full px-4 py-3 text-left text-white text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Visit Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowViewerMenu(false);
                        setIsPaused(false);
                        toast({
                          title: 'Report sent',
                          description: 'Thank you for reporting this story',
                        });
                      }}
                      className="w-full px-4 py-3 text-left text-red-500 text-sm hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Report Story
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Story Settings Modal */}
        {userId === currentUser?.userId && stories[currentStory] && (
          <StorySettingsModal
            isOpen={showSettingsMenu}
            onClose={() => {
              setShowSettingsMenu(false);
              // Story will auto-resume from isPaused state
            }}
            onOpen={() => {
              // Auto-pause story when modal opens
              setIsPaused(true);
            }}
            storyId={stories[currentStory].storyId}
            currentUserId={currentUser!.userId}
            currentSettings={{
              allowReplies: stories[currentStory]?.allowReplies ?? true,
              allowSharing: stories[currentStory]?.allowSharing ?? true,
              hiddenFrom: stories[currentStory]?.hiddenFrom || [],
            }}
            onSettingsUpdate={async () => {
              // Refresh story data
              const updatedStory = await storyService.getStory(stories[currentStory].storyId);
              if (updatedStory) {
                const updatedStories = [...stories];
                updatedStories[currentStory] = updatedStory;
                setStories(updatedStories);
              }
            }}
          />
        )}

        
        {/* Music Player Bar */}
        {stories[currentStory]?.backgroundMusic && (
          <div className="mx-3 mb-3 flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-sm rounded-full">
            <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {stories[currentStory].backgroundMusic.title}
              </p>
              <p className="text-white/60 text-[10px] truncate">
                {stories[currentStory].backgroundMusic.artist}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Story Content */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        onTouchStart={userId === currentUser?.userId ? handleViewersTouchStart : undefined}
        onTouchEnd={userId === currentUser?.userId ? handleViewersTouchEnd : undefined}
      >
        <div className="relative w-full h-full max-w-md">
          {/* Navigation Areas - Left half for previous, Right half for next */}
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-0 bottom-0 w-1/2 z-10"
            aria-label="Previous story"
          />
          <button
            onClick={handleNext}
            className="absolute right-0 top-0 bottom-0 w-1/2 z-10"
            aria-label="Next story"
          />

          {/* Story Image */}
          {stories[currentStory] && (
            <>
              <img
                src={stories[currentStory].mediaURL || '/placeholder.svg'}
                alt="Story"
                className="w-full h-full object-contain"
              />
              
              {/* Mention Stickers Overlay */}
              {stories[currentStory].mentionStickers?.map((mention: any) => (
                <div
                  key={mention.userId}
                  className="absolute z-20 cursor-pointer hover:scale-105 transition-transform"
                  style={{
                    left: `${mention.x}%`,
                    top: `${mention.y}%`,
                    transform: `translate(-50%, -50%) rotate(${mention.rotation || 0}deg) scale(${mention.scaleX || 1}, ${mention.scaleY || 1})`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${mention.username}`);
                  }}
                >
                  <MentionSticker
                    username={mention.username}
                    avatarURL={mention.avatarURL}
                    verified={mention.verified}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Instagram-style Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent">
        <div className="p-4 space-y-4">
          {/* Send message input (for viewing others) */}
          {userId !== currentUser?.userId && (
            <div className="space-y-2">
              {/* Quick Emoji Reactions with slide animation - only if replies allowed */}
              {stories[currentStory]?.allowReplies !== false && (
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    showEmojiReactions ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="flex items-center justify-center gap-3 px-4 py-2">
                    {['❤️', '😂', '😮', '😢', '👏', '🔥', '🎉', '💯'].map((emoji, idx) => (
                      <button
                        key={emoji}
                        onClick={async () => {
                          setShowEmojiReactions(false);
                          setIsPaused(false);
                          
                          if (!currentUser || !userId || !stories[currentStory]) return;
                          
                          try {
                            const story = stories[currentStory];
                            const conversationId = await messageService.getOrCreateDirectConversation(
                              currentUser.userId,
                              userId
                            );

                            await messageService.sendMessage(conversationId, {
                              senderId: currentUser.userId,
                              senderUsername: currentUser.username,
                              text: emoji,
                              type: 'story_reply',
                              storyReply: {
                                storyId: story.storyId,
                                mediaURL: story.mediaURL,
                                authorUsername: storyUser?.username || 'User',
                                authorAvatar: storyUser?.avatarURL,
                                authorVerified: storyUser?.verified || false,
                              },
                            });

                            toast({
                              title: '👍 Reaction sent!',
                              description: 'Your reaction was sent',
                            });
                          } catch (error) {
                            console.error('Failed to send reaction:', error);
                          }
                        }}
                        className="text-2xl hover:scale-125 active:scale-95 transition-all"
                        style={{
                          animation: showEmojiReactions ? `slideUp 0.3s ease-out ${idx * 0.05}s both` : 'none'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Mention Reply Button - Shows if current user is mentioned */}
              {isCurrentUserMentioned && (
                <button
                  onClick={handleMentionReply}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 rounded-2xl transition-all active:scale-95 shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-white/50">
                      <AvatarImage src={stories[currentStory]?.authorAvatarURL} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xs">
                        {stories[currentStory]?.authorUsername[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white font-semibold text-sm">
                      @{stories[currentStory]?.authorUsername}
                    </span>
                    {storyUser?.verified && (
                      <VerifiedBadge size="sm" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-white" />
                    <span className="text-white font-bold">Reply with Story</span>
                  </div>
                </button>
              )}
              
              {/* Reply Input with Like button */}
              <div className="flex items-center gap-2">
                {stories[currentStory]?.allowReplies !== false ? (
                  <>
                    {/* When replies active: Input - Like - Send */}
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Send message"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onFocus={() => {
                          setIsTyping(true);
                          setIsPaused(true);
                          setShowEmojiReactions(true);
                        }}
                        onBlur={() => {
                          if (!replyText.trim()) {
                            setIsTyping(false);
                            setIsPaused(false);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && replyText.trim()) {
                            handleSendReply();
                            setShowEmojiReactions(false);
                          }
                        }}
                        className="bg-transparent border border-white/40 text-white placeholder:text-white/60 rounded-full h-11 px-4 text-sm"
                      />
                    </div>
                    <button onClick={handleLike} className="p-2 hover:scale-110 active:scale-95 transition-transform">
                      <Heart className={`h-6 w-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                    </button>
                    {replyText.trim() && (
                      <button onClick={handleSendReply} className="p-2 hover:scale-110 active:scale-95 transition-transform">
                        <Send className="h-5 w-5 text-primary" />
                      </button>
                    )}
                  </>
                ) : (
                  /* When replies disabled: Only Like button on left */
                  <button onClick={handleLike} className="p-2 hover:scale-110 active:scale-95 transition-transform">
                    <Heart className={`h-6 w-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bottom action bar (for own story) */}
          {userId === currentUser?.userId && (
            <div className="flex items-center justify-between pt-2 border-t border-white/10 px-4">
              {/* Left: Viewers section */}
              <button 
                onClick={() => setShowViewersSheet(true)}
                onTouchStart={handleViewersTouchStart}
                onTouchEnd={handleViewersTouchEnd}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity py-2 active:scale-95"
              >
                <div className="relative w-28 h-10 flex items-center justify-center">
                  {viewersData.length === 0 ? (
                    <img 
                      src="/icons8-group-48.png" 
                      alt="No viewers" 
                      className="h-10 w-10 opacity-60"
                    />
                  ) : (
                    viewersData.slice(0, 4).map((viewer, idx) => (
                      <Avatar 
                        key={idx} 
                        className="h-8 w-8 border-2 border-black absolute transition-transform hover:scale-110"
                        style={{
                          left: idx === 0 ? '0px' : idx === 1 ? '20px' : idx === 2 ? '40px' : '60px',
                          top: idx === 0 ? '4px' : idx === 1 ? '0px' : idx === 2 ? '8px' : '4px',
                          zIndex: 4 - idx
                        }}
                      >
                        <AvatarImage src={viewer.avatarURL} />
                        <AvatarFallback className="bg-gray-700 text-white text-xs">
                          {viewer.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))
                  )}
                </div>
              </button>

              {/* Right: Action buttons grouped */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    setShowShareModal(true);
                    setIsPaused(true);
                  }}
                  className="flex flex-col items-center gap-1 py-2"
                >
                  <Share2 className="h-6 w-6 text-white" />
                  <span className="text-white text-xs">Share</span>
                </button>
                <button className="flex flex-col items-center gap-1 py-2">
                  <Bookmark className="h-6 w-6 text-white" />
                  <span className="text-white text-xs">Highlight</span>
                </button>
                <div className="relative" ref={moreMenuRef}>
                  <button 
                    onClick={() => {
                      const newState = !showMoreMenu;
                      setShowMoreMenu(newState);
                      if (newState) {
                        setIsPaused(true); // Pause when menu opens
                      }
                    }}
                    className="flex flex-col items-center gap-1 py-2"
                  >
                    <MoreVertical className="h-6 w-6 text-white" />
                    <span className="text-white text-xs">More</span>
                  </button>
                  
                  {/* More Menu Dropdown */}
                  {showMoreMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/10 overflow-hidden z-50">
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          setIsPaused(false); // Resume when menu closes
                          setShowViewersSheet(true);
                        }}
                        className="w-full px-4 py-3 text-left text-white text-sm hover:bg-white/10 transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        View Insights
                      </button>
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          setIsPaused(false); // Resume when menu closes
                          setShowDeleteDialog(true);
                        }}
                        className="w-full px-4 py-3 text-left text-red-500 text-sm hover:bg-red-500/10 transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Story
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Real-time Notifications */}
      {userId === currentUser?.userId && newNotifications.length > 0 && (
        <div className="absolute top-20 left-0 right-0 z-20 flex flex-col items-center gap-2 pointer-events-none">
          {newNotifications.slice(-3).map((notif) => (
            <div
              key={notif.timestamp}
              className="px-6 py-3 rounded-full backdrop-blur-xl shadow-2xl animate-slideDown flex items-center gap-3"
              style={{
                background: notif.type === 'like' 
                  ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(239, 68, 68, 0.9) 100%)'
                  : notif.type === 'view'
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
              }}
            >
              {notif.type === 'like' && <Heart className="h-5 w-5 text-white fill-white animate-bounce" />}
              {notif.type === 'view' && (
                <svg className="h-5 w-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              {notif.type === 'reply' && <Send className="h-5 w-5 text-white animate-bounce" />}
              <span className="text-white font-bold text-sm" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)' }}>
                <span className="opacity-90">{notif.username}</span>
                {notif.type === 'like' && ' liked your moment'}
                {notif.type === 'view' && ' viewed your moment'}
                {notif.type === 'reply' && ' replied to your moment'}
              </span>
            </div>
          ))}
        </div>
      )}
      
      
      
      {/* Viewers Bottom Sheet */}
      {showViewersSheet && (
        <div 
          className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          onClick={() => setShowViewersSheet(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-black/95 rounded-t-3xl border-t border-white/10 max-h-[70vh] overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-white/30 rounded-full"></div>
            </div>

            {/* Header with Tabs */}
            <div className="px-4 pt-3 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white text-lg font-semibold">Insights</h3>
                <button
                  onClick={() => setShowViewersSheet(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-8">
                <button
                  onClick={() => setInsightsTab('views')}
                  className={`pb-3 text-sm font-medium transition-colors relative ${
                    insightsTab === 'views' ? 'text-white' : 'text-white/50'
                  }`}
                >
                  Views {viewersData.length > 0 && `(${viewersData.length})`}
                  {insightsTab === 'views' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
                  )}
                </button>
                <button
                  onClick={() => setInsightsTab('likes')}
                  className={`pb-3 text-sm font-medium transition-colors relative ${
                    insightsTab === 'likes' ? 'text-white' : 'text-white/50'
                  }`}
                >
                  Likes {likersData.length > 0 && `(${likersData.length})`}
                  {insightsTab === 'likes' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Content List */}
            <div className="overflow-y-auto max-h-[calc(70vh-120px)] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {loadingInsights ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
                </div>
              ) : insightsTab === 'views' ? (
                viewersData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-xl"></div>
                      <div className="relative bg-gradient-to-br from-pink-500/20 to-purple-500/20 p-6 rounded-full">
                        <img 
                          src="/icons8-group-48.png" 
                          alt="No views" 
                          className="h-16 w-16"
                        />
                      </div>
                    </div>
                    <p className="text-white text-base font-medium">No views yet</p>
                    <p className="text-white/60 text-xs mt-1">Share your story to get views</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {viewersData
                      .sort((a, b) => {
                        // Sort: liked users first, then by time (descending)
                        const aLiked = likersData.includes(a.userId);
                        const bLiked = likersData.includes(b.userId);
                        if (aLiked && !bLiked) return -1;
                        if (!aLiked && bLiked) return 1;
                        return 0; // Keep original order (already descending by time)
                      })
                      .map((viewer) => (
                        <Link
                          key={viewer.userId}
                          to={`/profile/${viewer.username}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors"
                          onClick={() => setShowViewersSheet(false)}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={viewer.avatarURL || viewer.coverImageURL} />
                            <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white font-semibold">
                              {viewer.displayName?.[0] || viewer.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-semibold text-sm truncate">
                                {viewer.displayName || viewer.username}
                              </span>
                              {viewer.verified && <VerifiedBadge size="sm" />}
                            </div>
                            <span className="text-white/50 text-xs truncate block">@{viewer.username}</span>
                          </div>
                          {likersData.includes(viewer.userId) && (
                            <Heart className="h-5 w-5 text-red-500 fill-red-500 flex-shrink-0" />
                          )}
                        </Link>
                      ))}
                  </div>
                )
              ) : (
                likersData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <Heart className="h-16 w-16 text-white/20 mb-4" />
                    <p className="text-white/50 text-sm">No likes yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {viewersData
                      .filter(viewer => likersData.includes(viewer.userId))
                      .map((liker) => (
                        <Link
                          key={liker.userId}
                          to={`/profile/${liker.username}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors"
                          onClick={() => setShowViewersSheet(false)}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={liker.avatarURL || liker.coverImageURL} />
                            <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white font-semibold">
                              {liker.displayName?.[0] || liker.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-white font-semibold text-sm truncate">
                                {liker.displayName || liker.username}
                              </span>
                              {liker.verified && <VerifiedBadge size="sm" />}
                            </div>
                            <span className="text-white/50 text-xs truncate block">@{liker.username}</span>
                          </div>
                          <Heart className="h-5 w-5 text-red-500 fill-red-500 flex-shrink-0" />
                        </Link>
                      ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Story Modal */}
      {stories[currentStory] && (
        <ShareStoryModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setIsPaused(false);
          }}
          storyId={stories[currentStory].storyId}
          storyAuthor={storyUser?.username || 'User'}
          storyCover={stories[currentStory].mediaURL || ''}
          authorVerified={storyUser?.verified || false}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-black/95 border border-white/10 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-white text-lg font-semibold mb-2">Delete Story?</h3>
            <p className="text-white/70 text-sm mb-6">
              This story will be permanently deleted. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteStory}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
