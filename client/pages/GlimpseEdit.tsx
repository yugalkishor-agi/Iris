import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Music, X, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { glimpseService } from "../../src/services/glimpse.service";
import MusicSearch from "./MusicSearch";

export default function GlimpseEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [glimpse, setGlimpse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedMusic, setSelectedMusic] = useState<any>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);

  useEffect(() => {
    loadGlimpse();
  }, [id]);

  const loadGlimpse = async () => {
    try {
      setLoading(true);
      const data = await glimpseService.getGlimpse(id!);
      
      if (!data) {
        toast({
          title: "Error",
          description: "Glimpse not found",
          variant: "destructive",
        });
        navigate(-1);
        return;
      }

      // Check if user owns this glimpse
      if (data.authorId !== currentUser?.userId) {
        toast({
          title: "Unauthorized",
          description: "You can only edit your own glimpses",
          variant: "destructive",
        });
        navigate(-1);
        return;
      }

      setGlimpse(data);
      setCaption(data.caption || "");
      setSelectedMusic(data.backgroundMusic || null);
    } catch (error) {
      console.error('Failed to load glimpse:', error);
      toast({
        title: "Error",
        description: "Failed to load glimpse",
        variant: "destructive",
      });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser || !glimpse) return;

    try {
      setSaving(true);

      // Prepare music data
      let musicData = undefined;
      if (selectedMusic) {
        if (selectedMusic.customAudioFile) {
          musicData = {
            trackId: 'custom',
            trackTitle: selectedMusic.title,
            artistName: 'Custom Audio',
            coverArtURL: '',
            clipStart: 0,
            clipEnd: 0,
            customAudio: true,
            customAudioUrl: selectedMusic.customAudioUrl,
          };
        } else {
          musicData = {
            trackId: selectedMusic.id,
            trackTitle: selectedMusic.title,
            artistName: selectedMusic.user?.name || 'Unknown Artist',
            coverArtURL: selectedMusic.artwork?.['480x480'] || selectedMusic.artwork?.['150x150'] || '',
            clipStart: 0,
            clipEnd: 0,
            streamUrl: selectedMusic.streamUrl || '',
          };
        }
      }

      // Update glimpse in Firestore
      await glimpseService.updateGlimpse(glimpse.glimpseId, {
        caption,
        backgroundMusic: musicData,
        mentions: extractMentions(caption),
        tags: extractHashtags(caption),
      });

      toast({
        title: "Glimpse updated!",
        description: "Your changes have been saved",
      });

      navigate(-1);
    } catch (error: any) {
      console.error('Failed to update glimpse:', error);
      toast({
        title: "Failed to update glimpse",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Extract mentions from caption
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(m => m.substring(1)) : [];
  };

  // Extract hashtags from caption
  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(h => h.substring(1)) : [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!glimpse) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="text-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold">Edit Glimpse</h1>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Save</>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Media Preview */}
        <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[9/16] max-h-[600px]">
          {glimpse.mediaType === 'video' ? (
            <video
              src={glimpse.mediaURL}
              className="w-full h-full object-contain"
              controls
              muted
              playsInline
            />
          ) : (
            <img
              src={glimpse.mediaURL}
              alt="glimpse"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Caption Editor */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Caption</label>
          <Textarea
            placeholder="Write a caption... Use @ to mention, # for hashtags"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[100px] resize-none"
            maxLength={2200}
          />
          <div className="text-xs text-muted-foreground text-right">
            {caption.length}/2200
          </div>
        </div>

        {/* Music Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Background Music</label>
          {selectedMusic ? (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
              {selectedMusic.artwork?.['150x150'] && (
                <img
                  src={selectedMusic.artwork['150x150']}
                  alt={selectedMusic.title}
                  className="w-12 h-12 rounded-lg"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedMusic.title || selectedMusic.trackTitle}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedMusic.user?.name || selectedMusic.artistName || 'Unknown Artist'}
                </p>
              </div>
              <Button
                onClick={() => setSelectedMusic(null)}
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowMusicPicker(true)}
              variant="outline"
              className="w-full"
            >
              <Music className="h-4 w-4 mr-2" />
              Add Music
            </Button>
          )}
        </div>

        {/* Metadata Display */}
        <div className="space-y-2 p-4 bg-muted rounded-xl">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Views</span>
            <span className="font-medium">{glimpse.stats?.viewsCount || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Likes</span>
            <span className="font-medium">{glimpse.stats?.likesCount || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Comments</span>
            <span className="font-medium">{glimpse.stats?.commentsCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Music Picker Modal */}
      {showMusicPicker && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Add Music</h2>
              <Button
                onClick={() => setShowMusicPicker(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MusicSearch
                onSelect={(track) => {
                  setSelectedMusic(track);
                  setShowMusicPicker(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
