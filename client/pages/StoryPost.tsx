import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { X, Music, Hash, Video, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { storyService } from "../../src/services/story.service";
import { mediaService } from "../../src/services/media.service";

export default function StoryPost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [caption, setCaption] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaType(file.type.startsWith("video") ? "video" : "image");
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedMedia(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShare = async () => {
    if (!user || !mediaFile) return;

    setIsUploading(true);
    try {
      // Upload media to Supabase
      const uploadResult = await mediaService.uploadStoryMedia(user.userId, mediaFile);
      
      // Create story in Firestore
      await storyService.createStory(
        user.userId,
        user.username,
        user.avatarURL || '',
        uploadResult.mediaURL,
        mediaType,
        mediaType === 'video' ? 15 : 7, // Duration in seconds
        uploadResult.thumbnailURL,
        undefined, // text overlay
        'followers', // audience
        undefined, // background music
        caption || undefined,
        [] // mentions
      );

      toast({
        title: "Story shared!",
        description: "Your glimpse is now live",
      });

      navigate("/");
    } catch (error: any) {
      console.error('Failed to share story:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to share story",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 z-10">
        <Link to="/" className="text-white">
          <X className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Create Glimpse</h1>
        <Button 
          onClick={handleShare} 
          disabled={!selectedMedia || isUploading}
          size="sm"
          className="bg-primary hover:bg-primary/90"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            "Share"
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {!selectedMedia ? (
          <div className="w-full max-w-md space-y-6">
            {/* Upload Options */}
            <div className="space-y-4">
              <input
                type="file"
                accept="video/*,image/*"
                onChange={handleMediaSelect}
                className="hidden"
                id="media-upload"
              />
              <label
                htmlFor="media-upload"
                className="flex flex-col items-center justify-center w-full aspect-[9/16] border-2 border-dashed border-primary/50 rounded-2xl cursor-pointer hover:bg-primary/10 transition-colors"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-primary/20 rounded-full">
                    <Video className="h-12 w-12 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-white mb-1">
                      Select Video or Photo
                    </p>
                    <p className="text-sm text-white/60">
                      Share your moment as a glimpse
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {/* Tips */}
            <div className="bg-primary/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">Tips for great glimpses</span>
              </div>
              <ul className="text-xs text-white/80 space-y-1 ml-6 list-disc">
                <li>Keep it vertical (9:16 ratio works best)</li>
                <li>Make it engaging in the first 3 seconds</li>
                <li>Add music to enhance the mood</li>
                <li>Use hashtags to reach more people</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-md aspect-[9/16] rounded-2xl overflow-hidden bg-black">
            {/* Preview */}
            {mediaType === "video" ? (
              <video src={selectedMedia} className="w-full h-full object-contain" controls />
            ) : (
              <img src={selectedMedia} alt="Selected" className="w-full h-full object-contain" />
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />

            {/* Remove Button */}
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Caption Input */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
              <Textarea
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm resize-none"
                rows={3}
              />

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 p-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20">
                  <Music className="h-4 w-4" />
                  <span className="text-xs">Add Music</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 p-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20">
                  <Hash className="h-4 w-4" />
                  <span className="text-xs">Add Hashtags</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
