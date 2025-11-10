import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Camera, Image, X, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUpload } from "@/contexts/UploadContext";
import { storyService } from "../../src/services/story.service";
import { mediaService } from "../../src/services/media.service";
import { InstagramTextEditor } from "@/components/story/InstagramTextEditor";
import StorySettingsModal from "@/components/story/StorySettingsModal";

export default function MomentCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [storySettings, setStorySettings] = useState({
    allowReplies: true,
    allowSharing: true,
    hiddenFrom: [] as string[]
  });
  const { startUpload, updateProgress, completeUpload } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Remove auto-open - user must click button to select image

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImagePreview(url);
      setShowEditor(true);
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async (
    imageBlob: Blob, 
    audience: 'followers' | 'closeFriends',
    backgroundMusic?: {
      track: any;
      clipStart: number;
      clipEnd: number;
    } | null
  ) => {
    if (!currentUser?.userId) return;

    setIsPosting(true);
    startUpload('story');

    // Allow navigation - upload in background
    navigate('/');

    try {
      console.log('📤 Starting story upload...');
      updateProgress(10);
      
      // Upload image to Supabase storage
      const file = new File([imageBlob], `story_${Date.now()}.jpg`, { type: 'image/jpeg' });
      updateProgress(30);
      
      const { mediaURL, thumbnailURL } = await mediaService.uploadStoryMedia(currentUser.userId, file);
      updateProgress(60);
      console.log('✅ Upload complete!');

      if (!mediaURL) {
        throw new Error('Failed to upload media');
      }

      // Map audience to story visibility
      const storyAudience = audience === 'closeFriends' ? 'closeFriends' : 'public';

      // Prepare background music data if present
      const musicData = backgroundMusic ? {
        trackId: backgroundMusic.track.id.toString(),
        trackTitle: backgroundMusic.track.title,
        artistName: backgroundMusic.track.user?.name || 'Unknown Artist',
        coverArtURL: backgroundMusic.track.artwork?.['480x480'],
        clipStart: backgroundMusic.clipStart,
        clipEnd: backgroundMusic.clipEnd
      } : undefined;

      updateProgress(80);
      
      // Create story in Firestore
      await storyService.createStory(
        currentUser.userId,
        currentUser.username || 'user',
        currentUser.avatarURL || '',
        mediaURL,
        'image',
        5, // Default 5 second duration
        thumbnailURL,
        null, // textOverlay
        storyAudience,
        musicData
      );

      completeUpload();
      
      const audienceText = audience === 'closeFriends' ? 'close friends' : 'everyone';
      toast({
        title: "Moment shared!",
        description: `Shared with ${audienceText} for 24 hours`,
      });
    } catch (error: any) {
      console.error('Failed to post story:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      toast({
        title: "Failed to share moment",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  // Show editor when image is selected
  if (showEditor && imagePreview) {
    return (
      <InstagramTextEditor
        imageUrl={imagePreview}
        onSave={async (canvasBlob, audience, backgroundMusic) => {
          // Canvas blob already has all text elements, stickers, etc. rendered
          await handlePost(canvasBlob, audience, backgroundMusic);
        }}
        onCancel={() => {
          setShowEditor(false);
          setImagePreview('');
          setSelectedImage(null);
          navigate('/');
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-black/80 backdrop-blur">
        <button
          onClick={() => navigate('/')}
          className="text-white hover:text-gray-300 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h2 className="text-white font-semibold">Create Moment</h2>
        <button
          onClick={() => setShowSettingsMenu(true)}
          className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
        >
          <Settings className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center gap-6 p-8">
        <p className="text-white/60 text-center text-sm mb-4">
          Share a photo that disappears after 24 hours
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium"
            size="lg"
          >
            <Image className="h-5 w-5 mr-2" />
            Choose from Gallery
          </Button>

          <Button
            onClick={() => cameraInputRef.current?.click()}
            variant="outline"
            className="w-full h-14 border-white/20 text-white hover:bg-white/10"
            size="lg"
          >
            <Camera className="h-5 w-5 mr-2" />
            Take Photo
          </Button>
        </div>

        <p className="text-white/40 text-xs text-center mt-4">
          Add text, drawings, stickers, and more in the next step
        </p>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageSelect(file);
        }}
        className="hidden"
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageSelect(file);
        }}
        className="hidden"
      />

      {/* Settings Modal */}
      {showSettingsMenu && currentUser && (
        <StorySettingsModal
          isOpen={showSettingsMenu}
          onClose={() => setShowSettingsMenu(false)}
          storyId="temp-moment-id"
          currentUserId={currentUser.userId}
          currentSettings={storySettings}
          onSettingsUpdate={() => {
            // Settings will be applied to next story upload
          }}
        />
      )}
    </div>
  );
}
