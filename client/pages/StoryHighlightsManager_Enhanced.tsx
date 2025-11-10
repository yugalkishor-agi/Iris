/**
 * Enhanced Story Highlights Manager
 * Features:
 * - Create highlights from archived stories
 * - Select custom cover image
 * - Add title (shown below circle in profile)
 */

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ChevronLeft, Plus, Edit, Trash2, Image as ImageIcon, 
  Loader2, Check, X, Play 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { storyService } from "../../src/services/story.service";
import type { Highlight, Story } from "../../src/types/database";

export default function StoryHighlightsManagerEnhanced() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [archivedStories, setArchivedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create/Edit states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [highlightName, setHighlightName] = useState("");
  const [highlightTitle, setHighlightTitle] = useState("");
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [selectedCoverStory, setSelectedCoverStory] = useState<Story | null>(null);
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);

  useEffect(() => {
    loadData();
    
    // Check if we came from My Activity with selected stories
    const preselectedIds = searchParams.get('selected');
    if (preselectedIds) {
      const ids = preselectedIds.split(',');
      setSelectedStories(new Set(ids));
      setShowCreateDialog(true);
    }
  }, [user, searchParams]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [highlightsData, storiesData] = await Promise.all([
        storyService.getUserHighlights(user.userId),
        storyService.getUserArchivedStories(user.userId)
      ]);
      
      setHighlights(highlightsData);
      setArchivedStories(storiesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load highlights and stories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStorySelection = (story: Story) => {
    const newSelection = new Set(selectedStories);
    if (newSelection.has(story.storyId)) {
      newSelection.delete(story.storyId);
      // If this was the cover story, clear it
      if (selectedCoverStory?.storyId === story.storyId) {
        setSelectedCoverStory(null);
      }
    } else {
      newSelection.add(story.storyId);
      // If no cover selected, make this the cover
      if (!selectedCoverStory) {
        setSelectedCoverStory(story);
      }
    }
    setSelectedStories(newSelection);
  };

  const handleCreateHighlight = async () => {
    if (!user || !highlightName.trim() || selectedStories.size === 0) {
      toast({
        title: "Missing Information",
        description: "Please enter a name and select at least one story",
        variant: "destructive"
      });
      return;
    }

    if (!selectedCoverStory) {
      toast({
        title: "No Cover Selected",
        description: "Please select a cover image",
        variant: "destructive"
      });
      return;
    }

    try {
      // 🔍 DEBUG: Verify user.userId before calling service
      console.log('🔍 user.userId from UI:', user.userId);
      console.log('🔍 typeof user.userId:', typeof user.userId);
      
      if (!user.userId) {
        throw new Error('User not authenticated - userId is missing');
      }
      
      const title = highlightTitle.trim() || highlightName.trim();
      const coverImage = selectedCoverStory.thumbnailURL || selectedCoverStory.mediaURL;
      
      await storyService.createHighlightEnhanced(
        user.userId,
        highlightName,
        title,
        coverImage,
        Array.from(selectedStories)
      );

      toast({
        title: "Highlight Created",
        description: `"${highlightName}" has been created`,
      });

      // Reset
      setShowCreateDialog(false);
      setHighlightName("");
      setHighlightTitle("");
      setSelectedStories(new Set());
      setSelectedCoverStory(null);
      
      loadData();
    } catch (error) {
      console.error('Failed to create highlight:', error);
      toast({
        title: "Error",
        description: "Failed to create highlight",
        variant: "destructive"
      });
    }
  };

  const handleDeleteHighlight = async (highlightId: string, name: string) => {
    if (!user || !confirm(`Delete "${name}" highlight?`)) return;

    try {
      await storyService.deleteHighlight(user.userId, highlightId);
      toast({
        title: "Highlight Deleted",
        description: `"${name}" has been removed`,
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete highlight",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to="/me">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">Story Highlights</h1>
              <p className="text-xs text-muted-foreground">
                {highlights.length} highlights • {archivedStories.length} archived stories
              </p>
            </div>
          </div>
          <Button 
            size="icon" 
            onClick={() => setShowCreateDialog(true)}
            className="rounded-full"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {/* Existing Highlights */}
        {highlights.length > 0 && (
          <div className="space-y-3 mb-8">
            <h2 className="font-semibold text-sm text-muted-foreground">Your Highlights</h2>
            <div className="space-y-2">
              {highlights.map((highlight) => (
                <div 
                  key={highlight.highlightId}
                  className="flex items-center gap-4 p-3 bg-card rounded-lg border hover:border-primary/50 transition-all"
                >
                  {/* Cover */}
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={highlight.coverImageURL} />
                    <AvatarFallback>
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{highlight.name}</h3>
                    <p className="text-sm text-primary truncate">{highlight.title || highlight.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {highlight.storiesCount} {highlight.storiesCount === 1 ? 'story' : 'stories'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => navigate(`/highlight/${highlight.highlightId}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => handleDeleteHighlight(highlight.highlightId, highlight.name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {highlights.length === 0 && !showCreateDialog && (
          <div className="text-center py-12">
            <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No Highlights Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create highlights from your archived stories
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Highlight
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full max-w-2xl bg-card rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Dialog Header */}
            <div className="sticky top-0 bg-card border-b p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">New Highlight</h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="rounded-full"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setHighlightName("");
                    setHighlightTitle("");
                    setSelectedStories(new Set());
                    setSelectedCoverStory(null);
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Dialog Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Highlight Name</label>
                <Input
                  placeholder="e.g., Summer 2024, Travel, Friends..."
                  value={highlightName}
                  onChange={(e) => setHighlightName(e.target.value)}
                />
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Title</label>
                <Input
                  placeholder="Shown below circle in profile (optional)"
                  value={highlightTitle}
                  onChange={(e) => setHighlightTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use highlight name
                </p>
              </div>

              {/* Cover Selection */}
              {selectedCoverStory && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cover Image</label>
                  <div className="relative w-24 h-32 rounded-lg overflow-hidden border-2 border-primary">
                    <img
                      src={selectedCoverStory.thumbnailURL || selectedCoverStory.mediaURL}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary rounded-full p-1">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tap another story to change cover
                  </p>
                </div>
              )}

              {/* Stories Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Select Stories ({selectedStories.size} selected)
                  </label>
                  {selectedStories.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedStories(new Set());
                        setSelectedCoverStory(null);
                      }}
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {archivedStories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No archived stories yet</p>
                    <p className="text-xs">Stories will appear here after 24 hours</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {archivedStories.map((story) => {
                      const isSelected = selectedStories.has(story.storyId);
                      const isCover = selectedCoverStory?.storyId === story.storyId;

                      return (
                        <button
                          key={story.storyId}
                          onClick={() => toggleStorySelection(story)}
                          onDoubleClick={() => setSelectedCoverStory(story)}
                          className={`relative aspect-[9/16] rounded-lg overflow-hidden transition-all ${
                            isSelected
                              ? 'ring-4 ring-primary scale-95'
                              : 'hover:scale-105'
                          }`}
                        >
                          <img
                            src={story.thumbnailURL || story.mediaURL}
                            alt="Story"
                            className="w-full h-full object-cover"
                          />

                          {/* Media Type */}
                          {story.mediaType === 'video' && (
                            <div className="absolute top-2 right-2">
                              <Play className="h-4 w-4 text-white drop-shadow-lg" />
                            </div>
                          )}

                          {/* Selection Indicator */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <div className="bg-primary rounded-full p-2">
                                <Check className="h-5 w-5 text-primary-foreground" />
                              </div>
                            </div>
                          )}

                          {/* Cover Badge */}
                          {isCover && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-semibold">
                              Cover
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="sticky bottom-0 bg-card border-t p-4">
              <Button
                onClick={handleCreateHighlight}
                disabled={!highlightName.trim() || selectedStories.size === 0 || !selectedCoverStory}
                className="w-full h-12 text-base"
              >
                Create Highlight
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
