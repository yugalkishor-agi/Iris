import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Camera, Image as ImageIcon, Sparkles, Users, Globe, Lock, Zap, FlipHorizontal, Star, Edit3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { storyService } from "../../src/services/story.service";
import { mediaService } from "../../src/services/media.service";
import { extractAllMentions } from "@/utils/extractMentions";
import { StoryEditor } from "@/components/story/StoryEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StoryCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const mentionReplyTo = location.state?.mentionReplyTo;
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [audience, setAudience] = useState<'public' | 'followers' | 'closeFriends'>('followers');
  const [uploading, setUploading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [storySettings, setStorySettings] = useState<any>(null);

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 50MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setMediaType(file.type.startsWith('video') ? 'video' : 'image');
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedMedia(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditorSave = (editedUrl: string, settings: any) => {
    setEditedImageUrl(editedUrl);
    setStorySettings(settings);
    setShowEditor(false);
  };

  const handleShare = async () => {
    if (!user || !selectedFile) return;

    try {
      setUploading(true);

      // Upload media to Supabase
      const uploadResult = await mediaService.uploadStoryMedia(user.userId, selectedFile);

      // Get duration (5s for images, use video duration for videos)
      const duration = mediaType === 'image' ? 5 : await getVideoDuration(selectedFile);

      // Extract text overlay, mentions, and mention stickers from editor settings
      const textOverlay = storySettings?.textOverlay;
      const mentions = storySettings?.mentions || [];
      const mentionStickers = storySettings?.mentionStickers || [];

      // Create story in Firestore
      await storyService.createStory(
        user.userId,
        user.username,
        user.avatarURL || '',
        uploadResult.mediaURL,
        mediaType,
        duration,
        uploadResult.thumbnailURL,
        textOverlay,
        audience,
        undefined, // selectedMusic
        undefined, // caption
        mentions,
        [], // tags
        [], // taggedUsers
        mentionStickers
      );

      toast({
        title: "Story shared!",
        description: "Your story is now visible to your audience",
      });

      navigate("/");
    } catch (error) {
      console.error('Failed to create story:', error);
      toast({
        title: "Failed to share story",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 z-10">
        <Link to="/" className="text-white">
          <X className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-semibold text-white">Create Story</h1>
        {selectedMedia ? (
          <Button 
            onClick={handleShare} 
            size="sm" 
            className="bg-primary hover:bg-primary/90"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Share"}
          </Button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {!selectedMedia ? (
          <div className="w-full max-w-md space-y-6">
            {/* Capture Options */}
            <div className="grid grid-cols-2 gap-4">
              {/* Camera Option */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,video/*"
                  capture="environment"
                  onChange={handleMediaSelect}
                  className="hidden"
                  id="camera-capture"
                />
                <label
                  htmlFor="camera-capture"
                  className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-primary/50 rounded-2xl cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <Camera className="h-12 w-12 text-primary mb-2" />
                  <span className="text-sm font-medium text-white">Camera</span>
                </label>
              </div>

              {/* Gallery Option */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaSelect}
                  className="hidden"
                  id="gallery-upload"
                />
                <label
                  htmlFor="gallery-upload"
                  className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-primary/50 rounded-2xl cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <ImageIcon className="h-12 w-12 text-primary mb-2" />
                  <span className="text-sm font-medium text-white">Gallery</span>
                </label>
              </div>
            </div>

            {/* Info */}
            <div className="bg-primary/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">Story Tips</span>
              </div>
              <ul className="text-xs text-white/80 space-y-1 ml-6 list-disc">
                <li>Stories disappear after 24 hours</li>
                <li>Add text, stickers, and filters</li>
                <li>Share moments with your followers</li>
                <li>Control who can reply to your story</li>
              </ul>
            </div>

            {/* Camera Controls Info */}
            <div className="text-center text-white/60 text-xs space-y-1">
              <p className="flex items-center justify-center gap-2">
                <Zap className="h-3 w-3" /> Flash
                <span className="mx-2">•</span>
                <FlipHorizontal className="h-3 w-3" /> Flip
              </p>
              <p>Camera controls will appear when capturing</p>
            </div>
          </div>
        ) : showEditor ? (
          <StoryEditor
            imageUrl={selectedMedia!}
            onSave={handleEditorSave}
            onCancel={() => setShowEditor(false)}
          />
        ) : (
          <div className="relative w-full max-w-md aspect-[9/16] rounded-2xl overflow-hidden">
            {/* Preview */}
            <img src={editedImageUrl || selectedMedia} alt="Story preview" className="w-full h-full object-cover" />

            {/* Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />

            {/* Remove Button */}
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Edit Button */}
            <button
              onClick={() => setShowEditor(true)}
              className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-primary/90 backdrop-blur-md rounded-full text-white hover:bg-primary transition-all"
            >
              <Edit3 className="h-4 w-4" />
              <span className="text-sm font-medium">Edit</span>
            </button>

            {/* Audience Selector */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
              <div className="bg-black/60 backdrop-blur-md rounded-lg p-3">
                <label className="text-white text-sm font-medium mb-2 block">
                  Share with:
                </label>
                <Select value={audience} onValueChange={(value: any) => setAudience(value)}>
                  <SelectTrigger className={`border-white/20 text-white ${
                    audience === 'closeFriends' 
                      ? 'bg-green-600/90 border-green-500' 
                      : 'bg-white/10'
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="followers">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Followers</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="closeFriends" className="bg-green-500/10 hover:bg-green-500/20">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-green-500 fill-green-500" />
                        <span className="text-green-600 dark:text-green-400 font-semibold">Close Friends</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Public</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
