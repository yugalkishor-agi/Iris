import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { storyService } from '../../src/services/story.service';
import type { Highlight, Story } from '../../src/types/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function HighlightViewer() {
  const { id: highlightId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [storyViews, setStoryViews] = useState<Array<{
    userId: string;
    username: string;
    avatarURL: string;
  }>>([]);
  const [storyLikes, setStoryLikes] = useState<Array<{
    userId: string;
    username: string;
    avatarURL: string;
  }>>([]);
  const [showStoryViewers, setShowStoryViewers] = useState(false);
  const [showStoryLikers, setShowStoryLikers] = useState(false);

  useEffect(() => {
    if (!highlightId || !user) return;
    loadHighlight();
  }, [highlightId, user]);

  useEffect(() => {
    if (!highlight || !user || !stories[currentIndex]) return;
    // Load story engagement if viewing own highlight
    if (highlight.userId === user.userId) {
      loadStoryEngagement(stories[currentIndex].storyId);
    }
  }, [currentIndex, highlight, user, stories]);

  const loadHighlight = async () => {
    if (!highlightId) return;
    
    try {
      setLoading(true);
      
      // Get highlight details
      const highlightData = await storyService.getHighlight(highlightId);
      if (!highlightData) {
        console.error('Highlight not found');
        navigate('/');
        return;
      }
      
      setHighlight(highlightData);
      
      // Get stories in highlight
      const highlightStories = await storyService.getHighlightStories(highlightId);
      setStories(highlightStories);
      
    } catch (error) {
      console.error('Failed to load highlight:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadStoryEngagement = async (storyId: string) => {
    try {
      // Load views
      const views = await storyService.getStoryViews(storyId);
      setStoryViews(views);
      
      // Load likes
      const likes = await storyService.getStoryLikes(storyId);
      setStoryLikes(likes);
    } catch (error) {
      console.error('Failed to load story engagement:', error);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white">Loading highlight...</div>
      </div>
    );
  }

  if (!highlight || stories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center">
          <p>No stories in this highlight</p>
          <Button onClick={handleClose} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentStory = stories[currentIndex];

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 border-2 border-white">
                <AvatarImage src={highlight.coverImageURL} />
                <AvatarFallback>{highlight.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-white font-semibold text-sm">
                  {highlight.name}
                </h3>
                <p className="text-white/70 text-xs">
                  {currentIndex + 1} / {stories.length}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Story Engagement Circles (Views/Likes) - Only for own highlights */}
        {highlight?.userId === user?.userId && (storyViews.length > 0 || storyLikes.length > 0) && (
          <div className="flex gap-4 mt-3">
            {/* Views */}
            {storyViews.length > 0 && (
              <button
                onClick={() => setShowStoryViewers(true)}
                className="flex items-center gap-1"
              >
                <div className="flex -space-x-2">
                  {storyViews.slice(0, 3).map((view, idx) => (
                    <Avatar key={idx} className="w-6 h-6 border-2 border-black">
                      <AvatarImage src={view.avatarURL} />
                      <AvatarFallback className="text-xs">
                        {view.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {storyViews.length > 3 && (
                  <span className="text-white text-xs ml-1">+{storyViews.length - 3}</span>
                )}
              </button>
            )}

            {/* Likes */}
            {storyLikes.length > 0 && (
              <button
                onClick={() => setShowStoryLikers(true)}
                className="flex items-center gap-1"
              >
                <div className="flex -space-x-2">
                  {storyLikes.slice(0, 3).map((like, idx) => (
                    <Avatar key={idx} className="w-6 h-6 border-2 border-black">
                      <AvatarImage src={like.avatarURL} />
                      <AvatarFallback className="text-xs">
                        {like.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                {storyLikes.length > 3 && (
                  <span className="text-white text-xs ml-1">+{storyLikes.length - 3}</span>
                )}
              </button>
            )}
          </div>
        )}

        {/* Progress bars */}
        <div className="flex gap-1 mt-3">
          {stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  index < currentIndex
                    ? 'w-full'
                    : index === currentIndex
                    ? 'w-full'
                    : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Story Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Navigation Areas */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
          onClick={handlePrev}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
          onClick={handleNext}
        />

        {/* Story Media */}
        {currentStory.mediaType === 'video' ? (
          <video
            key={currentStory.storyId}
            src={currentStory.mediaURL}
            className="max-w-full max-h-full object-contain"
            autoPlay
            playsInline
            onEnded={handleNext}
          />
        ) : (
          <img
            key={currentStory.storyId}
            src={currentStory.mediaURL}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        )}

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-4 right-4 text-white text-center">
            <p className="text-sm drop-shadow-lg">{currentStory.caption}</p>
          </div>
        )}
      </div>

      {/* Story Viewers Modal */}
      <Dialog open={showStoryViewers} onOpenChange={setShowStoryViewers}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Viewers</DialogTitle>
          </DialogHeader>

          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {storyViews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No views yet</p>
              </div>
            ) : (
              storyViews.map((view) => (
                <button
                  key={view.userId}
                  onClick={() => {
                    setShowStoryViewers(false);
                    navigate(`/profile/${view.username}`);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-all"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={view.avatarURL} />
                    <AvatarFallback>{view.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1">
                    <p className="font-semibold">{view.username}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Story Likers Modal */}
      <Dialog open={showStoryLikers} onOpenChange={setShowStoryLikers}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Likes</DialogTitle>
          </DialogHeader>

          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {storyLikes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No likes yet</p>
              </div>
            ) : (
              storyLikes.map((like) => (
                <button
                  key={like.userId}
                  onClick={() => {
                    setShowStoryLikers(false);
                    navigate(`/profile/${like.username}`);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-all"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={like.avatarURL} />
                    <AvatarFallback>{like.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1">
                    <p className="font-semibold">{like.username}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
