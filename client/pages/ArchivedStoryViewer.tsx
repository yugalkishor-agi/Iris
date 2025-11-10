import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, X, Plus, Heart, MessageCircle, Share2, MoreVertical, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { storyService } from '../../src/services/story.service';
import type { Story, Highlight } from '../../src/types/database';

export default function ArchivedStoryViewer() {
  const { id: storyId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [creatingHighlight, setCreatingHighlight] = useState(false);

  useEffect(() => {
    if (!storyId) return;
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    if (!storyId) return;
    
    try {
      setLoading(true);
      const storyData = await storyService.getStory(storyId);
      
      if (!storyData) {
        toast({
          title: 'Story not found',
          variant: 'destructive'
        });
        navigate('/my-activity');
        return;
      }
      
      setStory(storyData);
    } catch (error) {
      console.error('Failed to load story:', error);
      toast({
        title: 'Error loading story',
        variant: 'destructive'
      });
      navigate('/my-activity');
    } finally {
      setLoading(false);
    }
  };

  const loadHighlights = async () => {
    if (!user) return;
    
    try {
      const userHighlights = await storyService.getUserHighlights(user.userId);
      setHighlights(userHighlights);
    } catch (error) {
      console.error('Failed to load highlights:', error);
    }
  };

  const handleAddToHighlight = async (highlightId: string) => {
    if (!user || !story) return;
    
    try {
      await storyService.addStoryToHighlight(highlightId, story.storyId, user.userId);
      
      toast({
        title: 'Added to highlight!',
        description: 'Story successfully added to highlight'
      });
      
      setShowHighlightModal(false);
    } catch (error) {
      console.error('Failed to add to highlight:', error);
      toast({
        title: 'Failed to add',
        description: 'Could not add story to highlight',
        variant: 'destructive'
      });
    }
  };

  const handleCreateNewHighlight = () => {
    if (!story) return;
    // Navigate to highlight manager with this story pre-selected
    navigate(`/story-highlights?selected=${story.storyId}`);
  };

  const openHighlightSelector = async () => {
    await loadHighlights();
    setShowHighlightModal(true);
  };

  const handleClose = () => {
    const from = searchParams.get('from');
    if (from === 'activity') {
      navigate('/my-activity');
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white">Loading story...</div>
      </div>
    );
  }

  if (!story) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black z-50">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <div className="text-white text-sm">
              {story.createdAt?.toDate?.().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
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
        </div>

        {/* Story Content */}
        <div className="relative w-full h-full flex items-center justify-center">
          {story.mediaType === 'video' ? (
            <video
              src={story.mediaURL}
              className="max-w-full max-h-full object-contain"
              controls
              playsInline
            />
          ) : (
            <img
              src={story.mediaURL}
              alt="Story"
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-6">
          {/* Caption */}
          {story.caption && (
            <p className="text-white text-sm mb-4 text-center">
              {story.caption}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex items-center gap-2 text-white">
              <Heart className="w-5 h-5" />
              <span className="text-sm">{story.likesCount || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{story.repliesCount || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-sm">{story.viewsCount || 0}</span>
            </div>
          </div>

          {/* Add to Highlight Button */}
          <Button
            onClick={openHighlightSelector}
            className="w-full rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
            size="lg"
          >
            <Bookmark className="w-5 h-5 mr-2" />
            Add to Highlight
          </Button>
        </div>
      </div>

      {/* Highlight Selector Modal */}
      <Dialog open={showHighlightModal} onOpenChange={setShowHighlightModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Highlight</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {/* Create New Highlight */}
            <button
              onClick={handleCreateNewHighlight}
              className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Create New Highlight</p>
                <p className="text-sm text-muted-foreground">Start a new collection</p>
              </div>
            </button>

            {/* Existing Highlights */}
            {highlights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No highlights yet</p>
                <p className="text-xs mt-1">Create your first highlight above</p>
              </div>
            ) : (
              highlights.map((highlight) => (
                <button
                  key={highlight.highlightId}
                  onClick={() => handleAddToHighlight(highlight.highlightId)}
                  className="w-full flex items-center gap-3 p-4 rounded-lg hover:bg-accent transition-all"
                >
                  <img
                    src={highlight.coverImageURL}
                    alt={highlight.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="text-left flex-1">
                    <p className="font-semibold">{highlight.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {highlight.storiesCount || 0} stories
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
