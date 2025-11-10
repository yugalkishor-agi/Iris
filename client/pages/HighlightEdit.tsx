import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { storyService } from '../../src/services/story.service';
import type { Highlight, Story } from '../../src/types/database';

export default function HighlightEdit() {
  const { id: highlightId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCover, setSelectedCover] = useState<string>('');

  useEffect(() => {
    if (!highlightId || !user) return;
    loadHighlight();
  }, [highlightId, user]);

  const loadHighlight = async () => {
    if (!highlightId) return;
    
    try {
      setLoading(true);
      
      const highlightData = await storyService.getHighlight(highlightId);
      if (!highlightData) {
        toast({
          title: 'Highlight not found',
          variant: 'destructive'
        });
        navigate('/story-highlights');
        return;
      }
      
      // Check ownership
      if (highlightData.userId !== user?.userId) {
        toast({
          title: 'Access denied',
          description: 'You can only edit your own highlights',
          variant: 'destructive'
        });
        navigate('/story-highlights');
        return;
      }
      
      setHighlight(highlightData);
      setName(highlightData.name);
      setTitle(highlightData.title || highlightData.name);
      setSelectedCover(highlightData.coverImageURL);
      
      // Load stories
      const highlightStories = await storyService.getHighlightStories(highlightId);
      setStories(highlightStories);
      
    } catch (error) {
      console.error('Failed to load highlight:', error);
      toast({
        title: 'Error',
        description: 'Failed to load highlight',
        variant: 'destructive'
      });
      navigate('/story-highlights');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!highlightId || !name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a highlight name',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setSaving(true);
      
      await storyService.updateHighlight(highlightId, {
        name: name.trim(),
        coverImageURL: selectedCover
      });
      
      toast({
        title: 'Saved!',
        description: 'Highlight updated successfully'
      });
      
      navigate('/story-highlights');
    } catch (error) {
      console.error('Failed to save:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!highlightId || !user) return;
    
    if (!confirm('Delete this highlight? This action cannot be undone.')) {
      return;
    }
    
    try {
      setSaving(true);
      
      await storyService.deleteHighlight(highlightId, user.userId);
      
      toast({
        title: 'Deleted',
        description: 'Highlight has been removed'
      });
      
      navigate('/story-highlights');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete highlight',
        variant: 'destructive'
      });
      setSaving(false);
    }
  };

  const handleRemoveStory = async (storyId: string) => {
    if (!highlightId || !user) return;
    
    try {
      await storyService.removeStoryFromHighlight(highlightId, storyId, user.userId);
      
      // Update local state
      setStories(stories.filter(s => s.storyId !== storyId));
      
      toast({
        title: 'Removed',
        description: 'Story removed from highlight'
      });
    } catch (error) {
      console.error('Failed to remove story:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove story',
        variant: 'destructive'
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

  if (!highlight) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/story-highlights')}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Edit Highlight</h1>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={saving}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Basic Info */}
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <div>
            <Label htmlFor="name">Highlight Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Vacation 2024"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {name.length}/50 characters
            </p>
          </div>

          <div>
            <Label htmlFor="title">Display Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Shown below highlight circle"
              maxLength={30}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/30 characters
            </p>
          </div>
        </div>

        {/* Cover Image */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Cover Image</h3>
          
          <div className="grid grid-cols-4 gap-3">
            {stories.map((story) => (
              <button
                key={story.storyId}
                onClick={() => setSelectedCover(story.thumbnailURL || story.mediaURL)}
                className={`relative aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all ${
                  selectedCover === (story.thumbnailURL || story.mediaURL)
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-transparent'
                }`}
              >
                <img
                  src={story.thumbnailURL || story.mediaURL}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Stories List */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              Stories ({stories.length})
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/my-activity')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stories
            </Button>
          </div>

          {stories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No stories in this highlight</p>
              <p className="text-xs mt-1">Add stories from your archive</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {stories.map((story) => (
                <div key={story.storyId} className="relative group">
                  <div className="aspect-[9/16] rounded-lg overflow-hidden">
                    <img
                      src={story.thumbnailURL || story.mediaURL}
                      alt="Story"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveStory(story.storyId)}
                    className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
