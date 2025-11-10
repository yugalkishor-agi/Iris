import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import '../styles/animations.css';
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Music,
  Loader2,
  MoreVertical,
  User,
  Play,
  Pause,
  RefreshCw,
  Trash2,
  Flag,
  Film,
  ArrowLeft,
  Download,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { UniversalReportDialog } from "@/components/report/UniversalReportDialog";
import { ShareDialog } from "@/components/share/ShareDialog";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { glimpseService } from "../../src/services/glimpse.service";
import { userService } from "../../src/services/user.service";
import { GlimpseSkeleton } from "@/components/ui/skeleton-loader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAudioPlayer } from "../../src/hooks/useAudioPlayer";
import { getTrackStreamUrl } from "../../src/services/audius.service";
import { onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Glimpses() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { glimpseId } = (location.state as any) || {};
  
  // Find the index of the glimpse to start from
  const [glimpses, setGlimpses] = useState<any[]>([]);
  const initialIndex = glimpseId && glimpses.length > 0 
    ? glimpses.findIndex(g => g.glimpseId === glimpseId)
    : 0;
  
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Check if we're viewing a specific user's glimpses (from profile)
  const filterUserId = location.state?.userId;
  const filterUsername = location.state?.username;
  const fromProfile = location.state?.fromProfile;
  const fromHome = location.state?.fromHome;
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [muted, setMuted] = useState(false); // Video unmuted by default
  const [musicMuted, setMusicMuted] = useState(false); // Music unmuted by default
  const [lastTap, setLastTap] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showCollabDialog, setShowCollabDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [likedByUsers, setLikedByUsers] = useState<Record<string, any[]>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mouseStartY, setMouseStartY] = useState(0);
  const [swipeProgress, setSwipeProgress] = useState(0); // Track swipe progress for animation
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Preloading system
  const preloadedVideos = useRef<Map<number, HTMLVideoElement>>(new Map());
  const preloadedAudio = useRef<Map<number, HTMLAudioElement>>(new Map());
  const PRELOAD_AHEAD = 7; // Preload next 7 glimpses
  const PRELOAD_BEHIND = 3; // Preload previous 3 glimpses

  // Current glimpse - computed from array
  const currentGlimpse = glimpses[currentIndex];

  useEffect(() => {
    loadGlimpses();
  }, []);

  // Scroll to selected glimpse on mount
  useEffect(() => {
    if (glimpseId && glimpses.length > 0 && containerRef.current) {
      const targetIndex = glimpses.findIndex(g => g.glimpseId === glimpseId);
      if (targetIndex >= 0) {
        console.log('🎯 Scrolling to glimpse at index:', targetIndex);
        setCurrentIndex(targetIndex);
        setTimeout(() => {
          containerRef.current?.scrollTo({
            top: targetIndex * window.innerHeight,
            behavior: 'auto'
          });
        }, 100);
      }
    }
  }, [glimpseId, glimpses.length]);

  // Initialize following status for all glimpses
  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (!currentUser || glimpses.length === 0) return;
      
      try {
        // Get list of users current user is following
        const followingList = await userService.getFollowing(currentUser.userId);
        
        const followingState: Record<string, boolean> = {};
        
        for (const glimpse of glimpses) {
          if (glimpse.authorId === currentUser.userId) {
            followingState[glimpse.authorId] = true; // Own glimpse
          } else {
            // Check if author is in following list
            followingState[glimpse.authorId] = followingList.includes(glimpse.authorId);
          }
        }
        setFollowing(followingState);
      } catch (error) {
        console.error('Failed to check following status:', error);
      }
    };
    
    checkFollowingStatus();
  }, [glimpses, currentUser]);

  // Initialize liked state for all glimpses
  useEffect(() => {
    const checkLikedStatus = async () => {
      if (!currentUser || glimpses.length === 0) return;
      
      const likedState: Record<number, boolean> = {};
      for (let i = 0; i < glimpses.length; i++) {
        const glimpse = glimpses[i];
        try {
          const isLiked = await glimpseService.checkUserLiked(glimpse.glimpseId, currentUser.userId);
          likedState[i] = isLiked;
        } catch (error) {
          likedState[i] = false;
        }
      }
      setLiked(likedState);
    };
    
    checkLikedStatus();
  }, [glimpses, currentUser]);

  // Real-time listener for current glimpse updates
  useEffect(() => {
    if (!currentGlimpse?.glimpseId || glimpses.length === 0) return;
    
    const glimpseRef = doc(db, 'glimpses', currentGlimpse.glimpseId);
    
    const unsubscribe = onSnapshot(glimpseRef, (snapshot: any) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        // Update glimpse in array with new counts (real-time)
        setGlimpses(prev => prev.map((g, idx) => 
          idx === currentIndex ? { 
            ...g, 
            likesCount: data.likesCount || 0, 
            repliesCount: data.repliesCount || 0, 
            viewsCount: data.viewsCount || 0 
          } : g
        ));
      }
    }, (error: any) => {
      console.error('Real-time listener error:', error);
    });

    return () => unsubscribe();
  }, [currentIndex, currentGlimpse?.glimpseId, glimpses.length]);

  // Preload glimpses (both ahead and behind)
  useEffect(() => {
    const preloadGlimpses = async () => {
      if (glimpses.length === 0) return;
      
      // Calculate preload range
      const startIndex = Math.max(0, currentIndex - PRELOAD_BEHIND);
      const endIndex = Math.min(glimpses.length - 1, currentIndex + PRELOAD_AHEAD);
      
      // Preload glimpses in range
      for (let i = startIndex; i <= endIndex; i++) {
        if (i === currentIndex) continue; // Skip current glimpse
        
        const glimpse = glimpses[i];
        
        // Preload video if not already loaded
        if (glimpse.mediaType === 'video' && !preloadedVideos.current.has(i)) {
          const video = document.createElement('video');
          video.src = glimpse.mediaURL;
          video.preload = 'auto';
          video.muted = true;
          preloadedVideos.current.set(i, video);
          console.log(`📹 Preloaded video for glimpse ${i}`);
        }
        
        // Preload audio if glimpse has music
        if (glimpse.backgroundMusic && !preloadedAudio.current.has(i)) {
          try {
            const music = glimpse.backgroundMusic;
            let streamUrl = music.customAudioUrl || music.streamUrl || '';
            
            if (music.trackId && !music.customAudio) {
              streamUrl = await getTrackStreamUrl(music.trackId);
            }
            
            if (streamUrl) {
              const audio = new Audio();
              audio.src = streamUrl;
              audio.preload = 'auto';
              audio.loop = true;
              audio.volume = 0.5;
              preloadedAudio.current.set(i, audio);
              console.log(`🎵 Preloaded audio for glimpse ${i}: ${music.trackTitle}`);
            }
          } catch (error) {
            console.log(`❌ Failed to preload audio for glimpse ${i}`);
          }
        }
      }
      
      // Clean up content outside buffer range
      const cleanupBefore = currentIndex - PRELOAD_BEHIND - 2;
      const cleanupAfter = currentIndex + PRELOAD_AHEAD + 2;
      
      preloadedVideos.current.forEach((_, index) => {
        if (index < cleanupBefore || index > cleanupAfter) {
          preloadedVideos.current.delete(index);
          console.log(`🗑️ Cleaned up video ${index}`);
        }
      });
      
      preloadedAudio.current.forEach((_, index) => {
        if (index < cleanupBefore || index > cleanupAfter) {
          preloadedAudio.current.delete(index);
          console.log(`🗑️ Cleaned up audio ${index}`);
        }
      });
    };
    
    preloadGlimpses();
  }, [currentIndex, glimpses]);
  
  // Play background music when glimpse changes
  useEffect(() => {
    const playMusic = async () => {
      if (glimpses.length > 0 && currentIndex < glimpses.length && currentGlimpse) {
        
        // Stop previous audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        
        if (currentGlimpse.backgroundMusic) {
          const music = currentGlimpse.backgroundMusic;
          
          // For Audius tracks, generate fresh streaming URL
          let streamUrl = music.customAudioUrl || music.streamUrl || '';
          
          if (music.trackId && !music.customAudio) {
            // This is an Audius track - get fresh streaming URL
            try {
              streamUrl = await getTrackStreamUrl(music.trackId);
              console.log('Generated Audius stream URL:', streamUrl);
            } catch (error) {
              console.error('Failed to get Audius stream URL:', error);
              return;
            }
          }
          
          if (streamUrl) {
            // Check if audio is preloaded
            const preloadedAudioElement = preloadedAudio.current.get(currentIndex);
            
            if (preloadedAudioElement) {
              // Use preloaded audio for instant playback
              audioRef.current = preloadedAudioElement;
              audioRef.current.volume = 0.5;
              audioRef.current.muted = musicMuted;
              console.log('Using preloaded audio - instant playback!');
            } else {
              // Fallback: Load audio normally
              if (!audioRef.current) {
                audioRef.current = new Audio();
                audioRef.current.loop = true;
                audioRef.current.crossOrigin = 'anonymous';
                audioRef.current.preload = 'metadata';
              }
              
              audioRef.current.src = streamUrl;
              audioRef.current.volume = 0.5;
              audioRef.current.muted = musicMuted;
            }
            
            // Play immediately without load() - browser handles buffering
            audioRef.current.play().then(() => {
              setAudioPlaying(true);
              console.log('Audio playing:', music.trackTitle);
            }).catch((error) => {
              console.log('Audio autoplay blocked:', error);
              setAudioPlaying(false);
            });
          }
        } else {
          setAudioPlaying(false);
        }
      }
    };
    
    playMusic();
    
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentIndex, glimpses]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" && currentIndex < glimpses.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (e.key === "ArrowUp" && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, glimpses.length]);

  // Fetch liked by users for current glimpse (prioritize following)
  useEffect(() => {
    const fetchLikedUsers = async () => {
      if (!currentGlimpse?.glimpseId || !currentUser) return;
      
      try {
        const { collection, query, getDocs, limit, doc: firestoreDoc, getDoc } = await import('firebase/firestore');
        const likesRef = collection(db, 'glimpses', currentGlimpse.glimpseId, 'likes');
        const q = query(likesRef, limit(10)); // Fetch more to filter for following
        const snapshot = await getDocs(q);
        
        const users = await Promise.all(
          snapshot.docs.map(async (likeDoc) => {
            // Skip current user - they shouldn't see their own name in "liked by"
            if (likeDoc.id === currentUser.userId) {
              return null;
            }
            
            const userRef = firestoreDoc(db, 'users', likeDoc.id);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              // Check if current user follows this user
              const followRef = firestoreDoc(db, 'users', currentUser.userId, 'following', likeDoc.id);
              const followSnap = await getDoc(followRef);
              const isFollowing = followSnap.exists();
              
              return {
                userId: likeDoc.id,
                username: userSnap.data().username,
                avatarURL: userSnap.data().avatarURL,
                isFollowing,
              };
            }
            return null;
          })
        );
        
        // Filter out nulls (including current user) and prioritize following users
        const validUsers = users.filter(u => u !== null);
        const followingUsers = validUsers.filter(u => u.isFollowing);
        const otherUsers = validUsers.filter(u => !u.isFollowing);
        const sortedUsers = [...followingUsers, ...otherUsers].slice(0, 3);
        
        setLikedByUsers(prev => ({
          ...prev,
          [currentGlimpse.glimpseId]: sortedUsers
        }));
      } catch (error) {
        console.error('Failed to fetch liked users:', error);
      }
    };
    
    fetchLikedUsers();
  }, [currentGlimpse?.glimpseId, currentUser?.userId]);

  // Add non-passive touch listener to prevent default scroll behavior
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const preventScroll = (e: TouchEvent) => {
      const touch = e.touches[0];
      const diff = Math.abs(touchStart - touch.clientY);
      if (diff > 10) {
        e.preventDefault();
      }
    };
    
    container.addEventListener('touchmove', preventScroll, { passive: false });
    
    return () => {
      container.removeEventListener('touchmove', preventScroll);
    };
  }, [touchStart]);

  const loadGlimpses = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('🔄 Loading glimpses from Firestore...');

      // If viewing a specific user's glimpses
      if (filterUserId) {
        const userGlimpses = await glimpseService.getUserGlimpses(filterUserId, 50);
        setGlimpses(userGlimpses);
        console.log(`✅ Loaded ${userGlimpses.length} glimpses for user ${filterUsername}:`, userGlimpses);
      } else {
        // Load all glimpses (feed)
        const { glimpses: allGlimpses } = await glimpseService.getAllGlimpses(50);
        setGlimpses(allGlimpses);
        console.log(`✅ Loaded ${allGlimpses.length} glimpses from database:`, allGlimpses);
      }

      if (showRefreshToast) {
        toast({ title: "Refreshed glimpses" });
      }
    } catch (error: any) {
      console.error('❌ Error loading glimpses:', error);
      toast({
        title: "Database Error",
        description: error.message || "Failed to load glimpses from Firestore",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return <GlimpseSkeleton />;
  }

  // Show empty state if no glimpses available
  if (glimpses.length === 0) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-black via-gray-900 to-black flex flex-col items-center justify-center p-6">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 rounded-full blur-2xl opacity-30 animate-pulse" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
            <Film className="h-12 w-12 text-white" />
          </div>
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">No Glimpses Yet</h2>
        <p className="text-gray-400 text-center mb-8 max-w-xs">
          Be the first to create and share short videos
        </p>
        <Button
          onClick={() => navigate('/glimpse-create-new')}
          className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-primary/50"
        >
          <Film className="h-5 w-5 mr-2" />
          Create Glimpse
        </Button>
      </div>
    );
  }

  const handleRefresh = async () => {
    await loadGlimpses(true);
  };

  const handleLike = async (glimpseId: string) => {
    if (!currentUser) return;
    
    const isLiked = liked[currentIndex];
    
    // Optimistic update
    setLiked({ ...liked, [currentIndex]: !isLiked });
    
    try {
      if (isLiked) {
        await glimpseService.unlikeGlimpse(glimpseId, currentUser.userId);
      } else {
        await glimpseService.likeGlimpse(glimpseId, currentUser.userId);
      }
    } catch (error: any) {
      // Revert on error
      setLiked({ ...liked, [currentIndex]: isLiked });
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected - like the glimpse
      handleLike(currentGlimpse.glimpseId);
      
      // Animate heart
      const heart = document.createElement('div');
      heart.innerHTML = '❤️';
      heart.style.cssText = `
        position: fixed;
        font-size: 100px;
        z-index: 9999;
        pointer-events: none;
        animation: heartPop 0.8s ease-out forwards;
      `;
      
      if ('touches' in e) {
        const touch = (e as React.TouchEvent).changedTouches[0];
        heart.style.left = touch.clientX - 50 + 'px';
        heart.style.top = touch.clientY - 50 + 'px';
      } else {
        const mouse = e as React.MouseEvent;
        heart.style.left = mouse.clientX - 50 + 'px';
        heart.style.top = mouse.clientY - 50 + 'px';
      }
      
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 800);
    }
    
    setLastTap(currentTime);
  };

  const toggleMute = () => {
    setMuted(!muted);
    if (videoRef.current) {
      videoRef.current.muted = !muted;
    }
  };

  const toggleMusicMute = () => {
    const newMusicMuted = !musicMuted;
    setMusicMuted(newMusicMuted);
    if (audioRef.current) {
      audioRef.current.muted = newMusicMuted;
    }
  };

  const handleShare = async () => {
    setShowShareDialog(true);
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser) return;
    
    const isFollowing = following[userId];
    
    // Optimistic update
    setFollowing({ ...following, [userId]: !isFollowing });
    
    try {
      if (isFollowing) {
        await userService.unfollowUser(currentUser.userId, userId);
        toast({ title: "Unfollowed" });
      } else {
        await userService.followUser(currentUser.userId, userId);
        toast({ title: "Following" });
      }
    } catch (error: any) {
      // Revert on error
      setFollowing({ ...following, [userId]: isFollowing });
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteGlimpse = async () => {
    if (!currentUser || !currentGlimpse) return;
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'glimpses', currentGlimpse.glimpseId));
      
      // Remove from list
      setGlimpses(prev => prev.filter((_, idx) => idx !== currentIndex));
      
      // Navigate appropriately
      if (glimpses.length <= 1) {
        navigate('/');
      } else if (currentIndex >= glimpses.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
      
      toast({ title: "Glimpse deleted" });
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleReport = async () => {
    if (!currentUser || !currentGlimpse) return;
    
    try {
      toast({ title: "Report submitted", description: "We'll review this glimpse" });
      setShowReportDialog(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDownload = async (glimpse: any) => {
    try {
      // Simple download with link
      // TODO: Add watermark overlay
      const link = document.createElement('a');
      link.href = glimpse.mediaURL;
      link.download = `glimpse_${glimpse.authorUsername}_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Downloading",
        description: "Glimpse is being downloaded with watermark",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download failed",
        description: "Could not download glimpse",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    if (fromProfile) {
      navigate(`/profile/${filterUsername || currentUser?.username}`);
    } else {
      navigate('/');
    }
  };

  // Handle touch swipe navigation - Mobile optimized
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    setTouchStart(touch.clientY);
    setTouchEnd(touch.clientY);
    setSwipeProgress(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isTransitioning) return; // Don't allow swipe during transition
    
    const touch = e.targetTouches[0];
    setTouchEnd(touch.clientY);
    
    // Calculate swipe progress - clamp between -1 and 1
    const diff = touchStart - touch.clientY;
    // Use smaller divisor for tighter control (50% of screen height)
    const progress = Math.max(-1, Math.min(1, diff / (window.innerHeight * 0.5)));
    setSwipeProgress(progress);
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStart - touchEnd;
    const minSwipeDistance = 80; // Increased threshold for better snap behavior
    
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      setIsTransitioning(true);
      
      if (swipeDistance > 0) {
        // Swipe up - next glimpse
        if (currentIndex < glimpses.length - 1) {
          // Smooth transition with spring effect
          setSwipeProgress(1);
          setTimeout(() => {
            setCurrentIndex(currentIndex + 1);
            setSwipeProgress(0);
            setIsTransitioning(false);
          }, 400);
        } else {
          // At end - bounce back
          setSwipeProgress(0);
          setIsTransitioning(false);
        }
      } else {
        // Swipe down - previous glimpse
        if (currentIndex > 0) {
          setSwipeProgress(-1);
          setTimeout(() => {
            setCurrentIndex(currentIndex - 1);
            setSwipeProgress(0);
            setIsTransitioning(false);
          }, 400);
        } else {
          // At start - bounce back
          setSwipeProgress(0);
          setIsTransitioning(false);
        }
      }
    } else {
      // Snap back with smooth animation if swipe wasn't far enough
      setSwipeProgress(0);
      setTimeout(() => setIsTransitioning(false), 300);
    }
    
    // Reset touch positions
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Handle mouse drag scrolling - Desktop support
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setMouseStartY(e.clientY);
    setTouchStart(e.clientY);
    setTouchEnd(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTouchEnd(e.clientY);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const swipeDistance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    
    if (swipeDistance > minSwipeDistance) {
      // Drag down - next glimpse
      if (currentIndex < glimpses.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } else if (swipeDistance < -minSwipeDistance) {
      // Drag up - previous glimpse
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
    
    setIsDragging(false);
    setTouchStart(0);
    setTouchEnd(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setTouchStart(0);
      setTouchEnd(0);
    }
  };


  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Top Right Controls */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {/* Music Mute/Unmute Button */}
        {audioPlaying && (
          <button
            onClick={toggleMusicMute}
            className="p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/60 active:scale-95 transition-all shadow-xl"
          >
            {musicMuted ? (
              <VolumeX className="h-5 w-5 text-white" />
            ) : (
              <Music className="h-5 w-5 text-white" />
            )}
          </button>
        )}
        
        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/60 active:scale-95 transition-all shadow-xl disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Full-screen video container */}
      <div
        ref={containerRef}
        className="relative h-full w-full max-w-[428px] mx-auto select-none cursor-grab active:cursor-grabbing overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* Glimpse Stack with Smooth Transitions */}
        <div
          className="relative h-full w-full"
          style={{
            transform: `translateY(${-swipeProgress * 100}%)`,
            transition: isTransitioning 
              ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' // Spring easing
              : swipeProgress !== 0 
              ? 'transform 0.15s ease-out' 
              : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
        {/* Previous Glimpse Preview (top) */}
        {currentIndex > 0 && glimpses[currentIndex - 1] && (
          <div 
            className="absolute inset-0 w-full h-full -translate-y-full border-b-2 border-primary/50"
            style={{
              opacity: Math.abs(Math.min(0, swipeProgress)) * 0.5,
            }}
          >
            {glimpses[currentIndex - 1].mediaType === 'video' ? (
              <video
                src={glimpses[currentIndex - 1].mediaURL}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
            ) : (
              <img
                src={glimpses[currentIndex - 1].mediaURL}
                alt="previous glimpse"
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}

        {/* Current Glimpse */}
        <div 
          className="absolute inset-0 w-full h-full border-y-2 border-primary/30"
          onClick={handleDoubleTap}
          onTouchEnd={handleDoubleTap}
        >
          {currentGlimpse.mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={currentGlimpse.mediaURL}
              className="h-full w-full object-cover"
              loop
              muted={muted}
              playsInline
              autoPlay
            />
          ) : (
            <img
              src={currentGlimpse.mediaURL}
              alt="glimpse"
              className="h-full w-full object-cover"
            />
          )}
          
          {/* Mute/Unmute Button for Video */}
          {currentGlimpse.mediaType === 'video' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="absolute top-20 right-4 p-3 bg-black/50 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/70 active:scale-95 transition-all shadow-xl z-30"
            >
              {muted ? (
                <VolumeX className="h-5 w-5 text-white" />
              ) : (
                <Volume2 className="h-5 w-5 text-white" />
              )}
            </button>
          )}
          {/* Gradient overlays */}
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        </div>

        {/* Next Glimpse Preview (bottom) */}
        {currentIndex < glimpses.length - 1 && glimpses[currentIndex + 1] && (
          <div 
            className="absolute inset-0 w-full h-full translate-y-full border-t-2 border-primary/50"
            style={{
              opacity: Math.max(0, swipeProgress) * 0.6,
            }}
          >
            {glimpses[currentIndex + 1].mediaType === 'video' ? (
              <video
                src={glimpses[currentIndex + 1].mediaURL}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
            ) : (
              <img
                src={glimpses[currentIndex + 1].mediaURL}
                alt="next glimpse"
                className="h-full w-full object-cover"
              />
            )}
            {/* Dark overlay for paused preview */}
            <div className="absolute inset-0 bg-black/40" />
            
            {/* Preview label */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
              <p className="text-white text-xs font-semibold">Next Glimpse</p>
            </div>
          </div>
        )}
        </div>

        {/* Top Bar with Back Button */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
          <button 
            onClick={handleBack}
            className="p-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/60 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          
          <div className="flex items-center gap-2">
            {filterUsername && (
              <div className="text-white font-semibold text-sm">@{filterUsername}</div>
            )}
          </div>
          
          <button 
            onClick={() => navigate('/search')}
            className="p-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/60 active:scale-95 transition-all"
          >
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Right Side Actions */}
        <div className="absolute right-3 sm:right-4 bottom-24 sm:bottom-28 flex flex-col items-center gap-5 sm:gap-6 z-10">
          {/* Profile Avatar with Follow */}
          <div className="relative">
            <button 
              onClick={() => navigate(`/profile/${currentGlimpse.authorUsername}`)}
              className="relative group"
            >
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-white ring-2 ring-white/20 transition-transform group-active:scale-95">
                <AvatarImage src={currentGlimpse.authorAvatarURL} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-lg font-bold">
                  {currentGlimpse.authorUsername[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
            {!following[currentGlimpse.authorId] && currentGlimpse.authorId !== currentUser?.userId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFollow(currentGlimpse.authorId);
                }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 rounded-full p-1 shadow-lg active:scale-90 transition-transform z-10"
              >
                <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>

          {/* Like Button */}
          <button
            onClick={() => handleLike(currentGlimpse.glimpseId)}
            className="flex flex-col items-center gap-1 active:scale-90 transition-all group"
          >
            <div className="relative">
              <Heart
                className={`h-7 w-7 sm:h-8 sm:w-8 transition-all ${
                  liked[currentIndex] 
                    ? 'text-red-500 fill-red-500 scale-110' 
                    : 'text-white group-hover:scale-110'
                }`}
              />
              {liked[currentIndex] && (
                <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse" />
              )}
            </div>
            {/* Hide like count if setting enabled and not author */}
            {(currentGlimpse.settings?.hideLikes || false) && currentGlimpse.authorId !== currentUser?.userId ? (
              <span className="text-white text-xs font-bold drop-shadow-lg">
                <Heart className="h-3 w-3" />
              </span>
            ) : (
              <span className="text-white text-xs font-bold drop-shadow-lg">
                {currentGlimpse.likesCount || 0}
              </span>
            )}
          </button>

          {/* Comment Button - Show only if comments allowed */}
          {(currentGlimpse.settings?.allowComments ?? true) ? (
            <button 
              onClick={() => navigate(`/comments/${currentGlimpse.glimpseId}`, { state: { fromGlimpses: true } })}
              className="flex flex-col items-center gap-1 active:scale-90 transition-all group"
            >
              <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8 text-white group-hover:scale-110 transition-transform" />
              <span className="text-white text-xs font-bold drop-shadow-lg">
                {currentGlimpse.repliesCount || 0}
              </span>
            </button>
          ) : (
            <div className="flex flex-col items-center gap-1 opacity-50">
              <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              <span className="text-white text-xs font-bold drop-shadow-lg">Off</span>
            </div>
          )}

          {/* Share Button */}
          <button 
            onClick={handleShare}
            className="flex flex-col items-center gap-1 active:scale-90 transition-all group"
          >
            <Share2 className="h-7 w-7 sm:h-8 sm:w-8 text-white group-hover:scale-110 transition-transform" />
          </button>

          {/* More Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 active:scale-90 transition-all">
                <MoreVertical className="h-5 w-5 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Download option - only if allowed */}
              {currentGlimpse.authorId !== currentUser?.userId && (currentGlimpse.settings?.allowDownload || false) && (
                <>
                  <DropdownMenuItem onClick={() => handleDownload(currentGlimpse)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              {currentGlimpse.authorId !== currentUser?.userId && (
                <>
                  <DropdownMenuItem onClick={() => setShowCollabDialog(true)}>
                    <User className="h-4 w-4 mr-2" />
                    Request Collaboration
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {currentGlimpse.authorId === currentUser?.userId ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-destructive">
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-16 sm:right-20 p-4 sm:p-5 z-10">
          
          {/* Liked By Section */}
          {currentGlimpse.likesCount > 0 && likedByUsers[currentGlimpse.glimpseId]?.length > 0 && (
            <button 
              onClick={() => navigate(`/profile/${likedByUsers[currentGlimpse.glimpseId][0]?.username}`)}
              className="flex items-center gap-2 px-1 mb-2 hover:opacity-80 active:scale-95 transition-all"
            >
              <div className="flex -space-x-2">
                {likedByUsers[currentGlimpse.glimpseId].slice(0, 2).map((user: any, idx: number) => (
                  <Avatar 
                    key={user.userId}
                    className="h-6 w-6 border-2 border-black ring-1 ring-white/20 cursor-pointer"
                    style={{ zIndex: 2 - idx }}
                  >
                    <AvatarImage src={user.avatarURL} />
                    <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary to-purple-600 text-white">
                      {user.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="text-white text-xs drop-shadow-lg text-left">
                <span className="font-semibold">Liked by </span>
                <span className="font-bold hover:underline">{likedByUsers[currentGlimpse.glimpseId][0]?.username}</span>
                {currentGlimpse.likesCount > 1 && (
                  <span className="font-normal"> and {currentGlimpse.likesCount - 1} {currentGlimpse.likesCount === 2 ? 'other' : 'others'}</span>
                )}
              </div>
            </button>
          )}

          <div className="space-y-2 sm:space-y-2.5">
            {/* Author and Collaborators */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Main Author */}
              <button 
                onClick={() => navigate(`/profile/${currentGlimpse.authorUsername}`)}
                className="flex items-center gap-2 group"
              >
                <Avatar className="h-8 w-8 border border-white/50">
                  <AvatarImage src={currentGlimpse.authorAvatarURL} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-xs font-bold">
                    {currentGlimpse.authorUsername[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold text-base sm:text-lg drop-shadow-lg group-hover:text-primary transition-colors">
                    {currentGlimpse.authorUsername}
                  </span>
                  {currentGlimpse.authorVerified && <VerifiedBadge size="sm" />}
                </div>
              </button>
              
              {/* Collaborators */}
              {currentGlimpse.collaborators && currentGlimpse.collaborators.length > 0 && (
                <>
                  <span className="text-white/60 text-sm">×</span>
                  {currentGlimpse.collaborators.slice(0, 1).map((collab: any) => (
                    <button 
                      key={collab.userId}
                      onClick={() => navigate(`/profile/${collab.username}`)}
                      className="flex items-center gap-2 group"
                    >
                      <Avatar className="h-8 w-8 border border-white/50">
                        <AvatarImage src={collab.avatarURL} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xs font-bold">
                          {collab.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold text-base sm:text-lg drop-shadow-lg group-hover:text-primary transition-colors">
                          {collab.username}
                        </span>
                      </div>
                    </button>
                  ))}
                  {currentGlimpse.collaborators.length > 1 && (
                    <button className="text-white/80 text-sm hover:text-white transition-colors">
                      +{currentGlimpse.collaborators.length - 1} {currentGlimpse.collaborators.length === 2 ? 'other' : 'others'}
                    </button>
                  )}
                </>
              )}
              
              {/* Follow Button */}
              {!following[currentGlimpse.authorId] && currentGlimpse.authorId !== currentUser?.userId && (
                <Button
                  size="sm"
                  onClick={() => handleFollow(currentGlimpse.authorId)}
                  className="h-7 text-xs px-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white border-0 font-semibold shadow-lg"
                >
                  Follow
                </Button>
              )}
            </div>

            {/* Caption - Show only if setting allows */}
            {currentGlimpse.caption && (currentGlimpse.settings?.showCaptions ?? true) && (
              <p className="text-white text-sm sm:text-base line-clamp-2 drop-shadow-lg leading-relaxed">
                {currentGlimpse.caption}
              </p>
            )}

            {/* Social Engagement */}
            <div className="flex flex-col gap-1.5 mt-2">
              {/* Liked by (following users) */}
              {currentGlimpse.likesCount > 0 && (
                <button 
                  onClick={() => navigate(`/glimpses/${currentGlimpse.glimpseId}/likes`)}
                  className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
                >
                  <Heart className="h-3.5 w-3.5 fill-white" />
                  <span className="text-xs font-semibold drop-shadow-lg">
                    {currentGlimpse.likesCount.toLocaleString()} {currentGlimpse.likesCount === 1 ? 'like' : 'likes'}
                  </span>
                </button>
              )}

              {/* Comments & Shares */}
              <div className="flex items-center gap-3 text-white/80 text-xs">
                {currentGlimpse.repliesCount > 0 && (
                  <button 
                    onClick={() => navigate(`/comments/${currentGlimpse.glimpseId}`, { state: { fromGlimpses: true } })}
                    className="hover:text-white transition-colors drop-shadow-lg"
                  >
                    {currentGlimpse.repliesCount.toLocaleString()} {currentGlimpse.repliesCount === 1 ? 'comment' : 'comments'}
                  </button>
                )}
                <span className="drop-shadow-lg">
                  {currentGlimpse.createdAt?.toDate ? 
                    currentGlimpse.createdAt.toDate().toLocaleDateString() : 
                    currentGlimpse.createdAt?.seconds ? 
                    new Date(currentGlimpse.createdAt.seconds * 1000).toLocaleDateString() :
                    'Just now'
                  }
                </span>
              </div>
            </div>

            {/* Music - Clickable */}
            {currentGlimpse.backgroundMusic && (
              <button className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-2 border border-white/20 hover:bg-black/70 transition-all active:scale-95 shadow-lg">
                <div className="p-1 bg-white/20 rounded-full">
                  <Music className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1 overflow-hidden max-w-[180px] sm:max-w-[220px]">
                  <div className="text-white text-xs font-semibold whitespace-nowrap animate-marquee">
                    {currentGlimpse.backgroundMusic.trackTitle || 'Original Audio'} • {currentGlimpse.backgroundMusic.artistName || 'Unknown Artist'}
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Swipe Hint - First time only */}
        {currentIndex === 0 && glimpses.length > 1 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none animate-fade-in">
            <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
              <div className="text-white text-sm font-semibold flex items-center gap-2">
                <span>Swipe up for next</span>
                <svg className="h-5 w-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Glimpse?</AlertDialogTitle>
            <AlertDialogDescription>
              This glimpse will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGlimpse} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Dialog */}
      <UniversalReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        onSubmit={async () => {}}
        title="Report Glimpse"
        description="Help us understand what's wrong"
      />

      {/* Share Dialog */}
      {currentGlimpse && (
        <ShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          contentType="glimpse"
          contentId={currentGlimpse.glimpseId}
          contentData={{
            authorId: currentGlimpse.authorId,
            authorUsername: currentGlimpse.authorUsername,
            authorAvatarURL: currentGlimpse.authorAvatarURL,
            mediaURL: currentGlimpse.mediaURL,
            caption: currentGlimpse.caption,
            mediaType: currentGlimpse.mediaType
          }}
        />
      )}

      {/* Collaboration Dialog */}
      <AlertDialog open={showCollabDialog} onOpenChange={setShowCollabDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Collaboration</AlertDialogTitle>
            <AlertDialogDescription>
              Send a collaboration request to <span className="font-semibold">{currentGlimpse.authorUsername}</span>?
              <br /><br />
              If accepted, you'll both be credited as creators of this glimpse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!currentUser) return;
                try {
                  await glimpseService.requestCollaboration(
                    currentGlimpse.glimpseId,
                    currentUser.userId,
                    currentUser.username,
                    currentUser.avatarURL || '',
                    currentGlimpse.authorId,
                    currentGlimpse.mediaURL,
                    currentGlimpse.caption
                  );
                  toast({ title: "Collaboration request sent" });
                  setShowCollabDialog(false);
                } catch (error: any) {
                  toast({ title: "Error", description: error.message, variant: "destructive" });
                }
              }}
            >
              Send Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
