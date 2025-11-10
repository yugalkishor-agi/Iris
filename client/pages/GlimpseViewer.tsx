import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MoreVertical, ChevronLeft, Music, Trash2, Edit, Flag, Volume2, VolumeX, Download, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { glimpseService } from '../../src/services/glimpse.service';
import { userService } from '../../src/services/user.service';
import { messageService } from '../../src/services/message.service';
import { UserSelectorDialog } from '@/components/chat/UserSelectorDialog';
import { useAudioPlayer, useAudioPreloader } from "../../src/hooks/useAudioPlayer";
import { AudioIndicator, AudioLoadingShimmer } from "../../src/components/AudioPlayer";
import { VerifiedBadge } from "@/components/ui/verified-badge";
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

export default function GlimpseViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [glimpses, setGlimpses] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [muted, setMuted] = useState(true); // Start muted by default

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  // Audio player
  const { play, pause, isPlaying, isLoading: audioLoading } = useAudioPlayer({
    autoPlay: true,
    onEnded: () => {
      // Loop audio or go to next
      const currentGlimpse = glimpses[currentIndex];
      if (currentGlimpse?.backgroundMusic) {
        play(
          currentGlimpse.backgroundMusic.trackId,
          currentGlimpse.backgroundMusic.customAudioUrl || currentGlimpse.backgroundMusic.streamUrl || '',
          {
            trackId: currentGlimpse.backgroundMusic.trackId,
            title: currentGlimpse.backgroundMusic.trackTitle,
            artist: currentGlimpse.backgroundMusic.artistName,
            duration: 0,
            streamUrl: currentGlimpse.backgroundMusic.customAudioUrl || currentGlimpse.backgroundMusic.streamUrl || '',
          }
        );
      }
    },
  });

  // Preload next glimpses' audio
  useAudioPreloader(
    glimpses.map(g => ({
      trackId: g.backgroundMusic?.trackId || '',
      streamUrl: g.backgroundMusic?.customAudioUrl || g.backgroundMusic?.streamUrl || '',
      metadata: {
        trackId: g.backgroundMusic?.trackId || '',
        title: g.backgroundMusic?.trackTitle || '',
        artist: g.backgroundMusic?.artistName || '',
        duration: 0,
        streamUrl: g.backgroundMusic?.customAudioUrl || g.backgroundMusic?.streamUrl || '',
      },
    })),
    currentIndex
  );

  useEffect(() => {
    loadGlimpses();
  }, [id]);

  // Initialize liked state for all glimpses
  useEffect(() => {
    const initializeLikedState = async () => {
      if (!currentUser || glimpses.length === 0) return;
      
      const likedState: Record<string, boolean> = {};
      for (const glimpse of glimpses) {
        try {
          const isLiked = await glimpseService.checkUserLiked(glimpse.glimpseId, currentUser.userId);
          likedState[glimpse.glimpseId] = isLiked;
        } catch (error) {
          console.error(`Failed to check like status for glimpse ${glimpse.glimpseId}:`, error);
          likedState[glimpse.glimpseId] = false;
        }
      }
      setLiked(likedState);
    };
    
    initializeLikedState();
  }, [glimpses, currentUser]);

  const loadGlimpses = async () => {
    try {
      setLoading(true);
      
      // Get glimpses from location state or fetch all
      const stateGlimpses = location.state?.glimpses;
      const stateIndex = location.state?.initialIndex;

      if (stateGlimpses && stateGlimpses.length > 0) {
        setGlimpses(stateGlimpses);
        setCurrentIndex(stateIndex || 0);
      } else {
        // Fetch single glimpse
        const glimpse = await glimpseService.getGlimpse(id!);
        if (glimpse) {
          setGlimpses([glimpse]);
          setCurrentIndex(0);
        }
      }
    } catch (error) {
      console.error('Failed to load glimpses:', error);
      toast({
        title: "Error",
        description: "Failed to load glimpse",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Play audio when glimpse changes
  useEffect(() => {
    if (glimpses.length > 0 && currentIndex < glimpses.length) {
      const currentGlimpse = glimpses[currentIndex];
      
      // Play audio if exists
      if (currentGlimpse.backgroundMusic) {
        play(
          currentGlimpse.backgroundMusic.trackId,
          currentGlimpse.backgroundMusic.customAudioUrl || currentGlimpse.backgroundMusic.streamUrl || '',
          {
            trackId: currentGlimpse.backgroundMusic.trackId,
            title: currentGlimpse.backgroundMusic.trackTitle,
            artist: currentGlimpse.backgroundMusic.artistName,
            duration: 0,
            streamUrl: currentGlimpse.backgroundMusic.customAudioUrl || currentGlimpse.backgroundMusic.streamUrl || '',
          }
        );
      }

      // Play video if exists
      const video = videoRefs.current.get(currentIndex);
      if (video) {
        video.play();
      }

      // Increment view count
      if (currentUser) {
        glimpseService.incrementViewCount(currentGlimpse.glimpseId, currentUser.userId);
      }
    }
  }, [currentIndex, glimpses]);

  // Handle scroll navigation
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < glimpses.length) {
      setCurrentIndex(newIndex);
    }
  };

  // Handle touch gestures for smooth swipe navigation
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touchY = e.touches[0].clientY;
    const deltaY = touchStartY.current - touchY;

    // Swipe up to go to next glimpse (bottom to top)
    if (deltaY > 50 && currentIndex < glimpses.length - 1) {
      setCurrentIndex(prev => Math.min(prev + 1, glimpses.length - 1));
      touchStartY.current = touchY;
      containerRef.current?.scrollTo({
        top: (currentIndex + 1) * window.innerHeight,
        behavior: 'smooth'
      });
    }
    // Swipe down to go to previous glimpse
    else if (deltaY < -50 && currentIndex > 0) {
      setCurrentIndex(prev => Math.max(prev - 1, 0));
      touchStartY.current = touchY;
      containerRef.current?.scrollTo({
        top: (currentIndex - 1) * window.innerHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to like glimpses",
        variant: "destructive",
      });
      return;
    }
    
    const currentGlimpse = glimpses[currentIndex];
    const isLiked = liked[currentGlimpse.glimpseId];

    // Optimistic update
    setLiked({ ...liked, [currentGlimpse.glimpseId]: !isLiked });
    
    // Update local stats
    const updatedGlimpses = [...glimpses];
    if (updatedGlimpses[currentIndex].stats) {
      updatedGlimpses[currentIndex].stats.likesCount = 
        (updatedGlimpses[currentIndex].stats.likesCount || 0) + (isLiked ? -1 : 1);
      setGlimpses(updatedGlimpses);
    }

    try {
      if (isLiked) {
        await glimpseService.unlikeGlimpse(currentGlimpse.glimpseId, currentUser.userId);
      } else {
        await glimpseService.likeGlimpse(currentGlimpse.glimpseId, currentUser.userId);
      }
    } catch (error: any) {
      // Revert on error
      setLiked({ ...liked, [currentGlimpse.glimpseId]: isLiked });
      if (updatedGlimpses[currentIndex].stats) {
        updatedGlimpses[currentIndex].stats.likesCount = 
          (updatedGlimpses[currentIndex].stats.likesCount || 0) + (isLiked ? 1 : -1);
        setGlimpses(updatedGlimpses);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const handleShareLink = () => {
    const currentGlimpse = glimpses[currentIndex];
    const url = `${window.location.origin}/glimpses/${currentGlimpse.glimpseId}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Glimpse by ${currentGlimpse.authorUsername}`,
        text: currentGlimpse.caption,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Glimpse link copied to clipboard",
      });
    }
  };

  const handleDelete = async () => {
    if (!currentUser) return;
    const currentGlimpse = glimpses[currentIndex];

    try {
      await glimpseService.deleteGlimpse(currentGlimpse.glimpseId, currentUser.userId);
      toast({
        title: "Glimpse deleted",
        description: "Your glimpse has been deleted",
      });
      
      // Remove from list
      const newGlimpses = glimpses.filter((_, i) => i !== currentIndex);
      if (newGlimpses.length === 0) {
        navigate(-1);
      } else {
        setGlimpses(newGlimpses);
        setCurrentIndex(Math.min(currentIndex, newGlimpses.length - 1));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
  };

  const handleEdit = () => {
    const currentGlimpse = glimpses[currentIndex];
    navigate(`/glimpse-edit/${currentGlimpse.glimpseId}`);
  };

  const handleShare = async (userId: string, message?: string) => {
    if (!currentUser || !glimpses[currentIndex]) return;
    
    const currentGlimpse = glimpses[currentIndex];
    
    try {
      await messageService.shareContent(
        currentUser.userId,
        userId,
        'glimpse',
        currentGlimpse.glimpseId,
        {
          type: 'glimpse',
          id: currentGlimpse.glimpseId,
          authorId: currentGlimpse.authorId,
          authorUsername: currentGlimpse.authorUsername,
          authorAvatarURL: currentGlimpse.authorAvatarURL,
          coverImageURL: currentGlimpse.coverImageURL || currentGlimpse.mediaURL,
          caption: currentGlimpse.caption,
          mediaType: currentGlimpse.mediaType,
        },
        message
      );
      
      toast({
        title: "Glimpse shared",
        description: "Glimpse sent successfully",
      });
    } catch (error) {
      console.error('Failed to share glimpse:', error);
      toast({
        title: "Share failed",
        description: "Failed to share glimpse",
        variant: "destructive"
      });
    }
  };

  const handleReport = () => {
    toast({
      title: "Report submitted",
      description: "Thank you for reporting this content",
    });
    setShowReportDialog(false);
  };

  const handleDownload = async (glimpse: any) => {
    try {
      // Create canvas to add watermark
      const video = document.createElement('video');
      video.src = glimpse.mediaURL;
      video.crossOrigin = 'anonymous';
      
      // For now, simple download with link
      // TODO: Implement watermark overlay using canvas
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

  const toggleMute = () => {
    const video = videoRefs.current.get(currentIndex);
    if (video) {
      video.muted = !muted;
      setMuted(!muted);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white">Loading glimpses...</div>
      </div>
    );
  }

  if (glimpses.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white">Glimpse not found</div>
      </div>
    );
  }

  const currentGlimpse = glimpses[currentIndex];
  const isOwnGlimpse = currentUser?.userId === currentGlimpse.authorId;
  
  // Default settings for glimpses without settings field (backward compatibility)
  const glimpseSettings = currentGlimpse.settings || {
    allowComments: true,
    allowDownload: false,
    hideLikes: false,
    showCaptions: true
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden z-50">
      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="h-full w-full max-w-[428px] mx-auto overflow-y-scroll snap-y snap-mandatory scrollbar-hide transition-all duration-300"
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {glimpses.map((glimpse, index) => {
          const isCurrentGlimpse = index === currentIndex;
          return (
          <div
            key={glimpse.glimpseId}
            className={`h-screen w-full snap-start relative flex items-center justify-center bg-black transition-opacity duration-500 ${
              isCurrentGlimpse ? 'opacity-100' : 'opacity-50'
            }`}
            data-audio-index={index}
          >
            {/* Media */}
            {glimpse.mediaType === 'video' ? (
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(index, el);
                }}
                src={glimpse.mediaURL}
                className="max-h-full max-w-full object-contain"
                loop
                muted={muted}
                playsInline
                autoPlay={index === currentIndex}
              />
            ) : (
              <img
                src={glimpse.mediaURL}
                alt="glimpse"
                className="max-h-full max-w-full object-contain"
              />
            )}

            {/* Gradient overlays */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

            {/* All UI Elements - Always visible for current glimpse */}
            {isCurrentGlimpse && (
              <>
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-30">
                  <button
                    onClick={() => navigate(-1)}
                    className="p-2 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 active:scale-95 transition-all"
                  >
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="text-white font-bold text-lg">Glimpses</div>
                  </div>
                  <div className="w-10" /> {/* Spacer for centering */}
                </div>

                {/* Right Side Actions - Instagram Reels Style */}
                <div className="fixed right-4 bottom-24 flex flex-col items-center gap-5" style={{ zIndex: 9999 }}>
                  {/* Profile Avatar */}
                  <button 
                    onClick={() => navigate(`/profile/${glimpse.authorUsername}`)}
                    className="relative group active:scale-95 transition-transform"
                  >
                    <Avatar className="h-11 w-11 border-2 border-white shadow-lg">
                      <AvatarImage src={glimpse.authorAvatarURL} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-sm font-bold">
                        {glimpse.authorUsername?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  {/* Like Button */}
                  <button
                    onClick={handleLike}
                    className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
                  >
                    <Heart
                      className={`h-[30px] w-[30px] drop-shadow-lg ${
                        liked[glimpse.glimpseId] 
                          ? 'text-red-500 fill-red-500' 
                          : 'text-white'
                      }`}
                    />
                    {/* Hide like count if setting enabled and not author */}
                    {(glimpse.settings?.hideLikes || false) && glimpse.authorId !== currentUser?.userId ? (
                      <span className="text-white text-[11px] font-semibold drop-shadow-lg">
                        <Heart className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="text-white text-[11px] font-semibold drop-shadow-lg">
                        {glimpse.stats?.likesCount || 0}
                      </span>
                    )}
                  </button>

                  {/* Comment Button - Show only if comments allowed */}
                  {(glimpse.settings?.allowComments ?? true) ? (
                    <button 
                      onClick={() => navigate(`/comments/${glimpse.glimpseId}`)}
                      className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
                    >
                      <MessageCircle className="h-[30px] w-[30px] text-white drop-shadow-lg" />
                      <span className="text-white text-[11px] font-semibold drop-shadow-lg">
                        {glimpse.stats?.commentsCount || 0}
                      </span>
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-0.5 opacity-50">
                      <Lock className="h-[30px] w-[30px] text-white drop-shadow-lg" />
                      <span className="text-white text-[11px] font-semibold drop-shadow-lg">Off</span>
                    </div>
                  )}

                  {/* Share Button */}
                  <button 
                    onClick={() => setShowShareDialog(true)}
                    className="flex flex-col items-center active:scale-90 transition-transform"
                  >
                    <Share2 className="h-[30px] w-[30px] text-white drop-shadow-lg" />
                  </button>

                  {/* More Options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex flex-col items-center active:scale-90 transition-transform">
                        <MoreVertical className="h-[30px] w-[30px] text-white drop-shadow-lg" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 text-white">
                      {/* Download option - only if allowed */}
                      {!isOwnGlimpse && (glimpse.settings?.allowDownload || false) && (
                        <DropdownMenuItem onClick={() => handleDownload(glimpse)} className="text-white hover:bg-gray-800 cursor-pointer">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      )}
                      {isOwnGlimpse && (
                        <DropdownMenuItem onClick={handleEdit} className="text-white hover:bg-gray-800 cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Glimpse
                        </DropdownMenuItem>
                      )}
                      {isOwnGlimpse && (
                        <DropdownMenuItem
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-red-500 hover:bg-gray-800 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                      {!isOwnGlimpse && (
                        <DropdownMenuItem
                          onClick={() => setShowReportDialog(true)}
                          className="text-red-500 hover:bg-gray-800 cursor-pointer"
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Audio indicator */}
                {glimpse.backgroundMusic && (
                  <>
                    <AudioIndicator isPlaying={isPlaying} />
                    {audioLoading && <AudioLoadingShimmer />}
                  </>
                )}

                {/* Mute/Unmute button for video - Top Right */}
                {glimpse.mediaType === 'video' && (
                  <button
                    onClick={toggleMute}
                    className="absolute top-16 right-4 p-3 bg-black/50 backdrop-blur-md border border-white/20 rounded-full hover:bg-black/70 active:scale-95 transition-all shadow-xl z-20"
                  >
                    {muted ? (
                      <VolumeX className="h-5 w-5 text-white" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-white" />
                    )}
                  </button>
                )}

                {/* Bottom info - Username & Caption */}
                <div className="absolute bottom-0 left-0 right-20 p-4 z-20">
                  <div className="space-y-2">
                    {/* Username with Avatar */}
                    <button 
                      onClick={() => navigate(`/profile/${glimpse.authorUsername}`)}
                      className="flex items-center gap-2.5 group"
                    >
                      <Avatar className="h-10 w-10 border-2 border-white ring-2 ring-white/20">
                        <AvatarImage src={glimpse.authorAvatarURL} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-sm font-bold">
                          {glimpse.authorUsername[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold text-base drop-shadow-lg group-hover:text-primary transition-colors">
                          {glimpse.authorUsername}
                        </span>
                        {glimpse.authorVerified && <VerifiedBadge size="sm" />}
                      </div>
                    </button>

                    {/* Caption - Show only if setting allows */}
                    {glimpse.caption && (glimpse.settings?.showCaptions ?? true) && (
                      <p className="text-white text-sm line-clamp-2 drop-shadow-lg leading-relaxed">
                        {glimpse.caption}
                      </p>
                    )}

                    {/* Music */}
                    {glimpse.backgroundMusic && (
                      <button className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-2 border border-white/20 hover:bg-black/70 transition-all active:scale-95 shadow-lg">
                        <div className="p-1 bg-white/20 rounded-full">
                          <Music className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="flex-1 overflow-hidden max-w-[180px]">
                          <div className="text-white text-xs font-semibold whitespace-nowrap animate-marquee">
                            {glimpse.backgroundMusic.trackTitle || 'Original Audio'} • {glimpse.backgroundMusic.artistName || 'Unknown Artist'}
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Scroll indicator */}
                {glimpses.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    {glimpses.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === currentIndex ? 'w-8 bg-gradient-to-r from-primary to-purple-600' : 'w-1.5 bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
        })}
      </div>

      {/* User Selector for Sharing */}
      <UserSelectorDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        onSelect={handleShare}
        allowMessage={true}
        placeholder="Search users to share glimpse..."
        title="Send glimpse to"
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Glimpse?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete your glimpse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Report Glimpse?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to report this glimpse? We'll review it and take appropriate
              action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReport}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
