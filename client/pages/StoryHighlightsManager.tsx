import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Plus, Edit, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { storyService } from "../../src/services/story.service";
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import type { Highlight } from "../../src/types/database";

export default function StoryHighlightsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newHighlightName, setNewHighlightName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    loadHighlights();
  }, [user]);

  const loadHighlights = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userHighlights = await storyService.getUserHighlights(user.userId);
      setHighlights(userHighlights);
    } catch (error) {
      console.error('Failed to load highlights:', error);
      toast({
        title: "Error loading highlights",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !newHighlightName.trim()) return;
    
    try {
      await storyService.createHighlight(user.userId, newHighlightName, '');
      toast({
        title: "Highlight created",
        description: `"${newHighlightName}" has been created`,
      });
      setNewHighlightName("");
      setIsCreating(false);
      await loadHighlights();
    } catch (error) {
      console.error('Failed to create highlight:', error);
      toast({
        title: "Error creating highlight",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (highlightId: string) => {
    if (!user || !editName.trim()) return;
    
    try {
      const highlightRef = doc(db, 'highlights', highlightId);
      await updateDoc(highlightRef, {
        name: editName,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Highlight updated",
        description: "Name has been changed",
      });
      setEditingId(null);
      setEditName("");
      await loadHighlights();
    } catch (error) {
      console.error('Failed to update highlight:', error);
      toast({
        title: "Error updating highlight",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (highlightId: string) => {
    if (!user) return;
    
    if (!confirm('Delete this highlight? This cannot be undone.')) return;
    
    try {
      await storyService.deleteHighlight(user.userId, highlightId);
      toast({
        title: "Highlight deleted",
        description: "The highlight has been removed",
      });
      await loadHighlights();
    } catch (error) {
      console.error('Failed to delete highlight:', error);
      toast({
        title: "Error deleting highlight",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to="/me" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold">Story Highlights</h1>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setIsCreating(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
        {/* Create New Highlight */}
        {isCreating && (
          <div className="border rounded-lg p-4 space-y-4 animate-slide-down">
            <h2 className="font-semibold">New Highlight</h2>
            <Input
              placeholder="Highlight name..."
              value={newHighlightName}
              onChange={(e) => setNewHighlightName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        )}

        {/* Highlights List */}
        <div className="space-y-4">
          {highlights.map((highlight) => (
            <div key={highlight.highlightId} className="border rounded-lg p-4">
              {editingId === highlight.highlightId ? (
                <div className="space-y-3">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(null);
                        setEditName("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleEdit(highlight.highlightId)}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {/* Cover Image */}
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      {highlight.coverImageURL ? (
                        <AvatarImage src={highlight.coverImageURL} alt={highlight.name} />
                      ) : (
                        <AvatarFallback>
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{highlight.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {highlight.storiesCount || 0} {highlight.storiesCount === 1 ? 'story' : 'stories'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(highlight.highlightId);
                        setEditName(highlight.name);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(highlight.highlightId)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {highlights.length === 0 && !isCreating && (
          <div className="text-center py-12">
            <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No highlights yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create highlights to showcase your best stories
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Highlight
            </Button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
