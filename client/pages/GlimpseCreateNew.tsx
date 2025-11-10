import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Video, Camera, Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ProfessionalGlimpseEditor } from '@/components/glimpse/ProfessionalGlimpseEditor';
import { SimpleGlimpseEditor } from '@/components/glimpse/SimpleGlimpseEditor';
import { GlimpseCoverPicker } from '@/components/glimpse/GlimpseCoverPicker';
import { GlimpsePublishFlow, GlimpsePublishData } from '@/components/glimpse/GlimpsePublishFlow';
import { glimpseService } from '@/services/glimpse.service';

type FlowStep = 'select' | 'editor' | 'cover' | 'publish';

export default function GlimpseCreateNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Main flow state
  const [currentStep, setCurrentStep] = useState<FlowStep>('select');
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  
  // Editor states
  const [editedMedia, setEditedMedia] = useState<Blob | null>(null);
  const [coverImage, setCoverImage] = useState<Blob | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  
  // Auto-save & hints
  const [draftSaved, setDraftSaved] = useState(false);
  const [showHint, setShowHint] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (currentStep !== 'select' && selectedMedia.length > 0) {
      const interval = setInterval(() => {
        saveDraft();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentStep, selectedMedia]);

  // Load saved filter preference
  useEffect(() => {
    const savedFilter = localStorage.getItem('favorite_filter');
    if (savedFilter) {
      console.log('Recommended filter:', savedFilter);
    }
  }, []);

  const saveDraft = () => {
    try {
      localStorage.setItem('glimpse_draft', JSON.stringify({
        timestamp: Date.now(),
        step: currentStep,
        mediaCount: selectedMedia.length,
      }));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch (e) {
      console.error('Draft save failed:', e);
    }
  };

  const handleMediaSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validate files
    for (const file of fileArray) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: 'Invalid file',
          description: 'Please select only images or videos',
          variant: 'destructive',
        });
        return;
      }
    }

    // Check video duration (max 60 seconds)
    for (const file of fileArray) {
      if (file.type.startsWith('video/')) {
        const duration = await getVideoDuration(file);
        if (duration > 60) {
          toast({
            title: 'Video too long',
            description: 'Glimpses videos must be 60 seconds or less',
            variant: 'destructive',
          });
          return;
        }
      }
    }

    // Set media type based on first file
    setMediaType(fileArray[0].type.startsWith('image/') ? 'image' : 'video');
    setSelectedMedia(fileArray);

    // Create previews
    const previews = await Promise.all(
      fileArray.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      })
    );

    setMediaPreview(previews);
    
    // Temporarily skip editor - go directly to publish
    // Set edited media as original file for now
    setEditedMedia(fileArray[0]);
    
    // Generate cover from first frame if video, or use image itself
    const isVideo = fileArray[0].type.startsWith('video/');
    if (isVideo) {
      generateVideoCover(fileArray[0]);
    } else {
      // For images, use the image itself as cover
      setCoverImage(fileArray[0]);
    }
    
    // Go to publish after cover is ready
    setCurrentStep('publish');
    
    // Show hint for first-time users
    const hasSeenHint = localStorage.getItem('editor_hint_seen');
    if (!hasSeenHint) {
      setShowHint(true);
      setTimeout(() => {
        setShowHint(false);
        localStorage.setItem('editor_hint_seen', 'true');
      }, 5000);
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const generateVideoCover = (file: File) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    
    video.onloadeddata = () => {
      video.currentTime = 1; // Get frame at 1 second
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          setCoverImage(blob);
        }
        URL.revokeObjectURL(video.src);
      }, 'image/jpeg', 0.9);
    };
  };

  const handleBasicEditorSave = (blob: Blob) => {
    setEditedMedia(blob);
    setShowCoverPicker(true);
  };

  const handleAdvancedEditorDone = (blob: Blob) => {
    setEditedMedia(blob);
    setShowAdvanced(false);
    setShowCoverPicker(true);
  };

  const handleCoverSelect = (blob: Blob) => {
    setCoverImage(blob);
    setShowCoverPicker(false);
    setShowPublish(true);
  };

  const handlePublish = async (publishData: GlimpsePublishData) => {
    if (!user || !editedMedia || !coverImage) return;

    try {
      toast({
        title: 'Publishing glimpse...',
        description: 'Your content is being uploaded',
      });

      const mediaFile = new File(
        [editedMedia],
        `glimpse_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`,
        { type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg' }
      );

      let duration = 0;
      if (mediaType === 'video') {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(mediaFile);
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            duration = video.duration;
            resolve(null);
          };
        });
      }

      // Extract hashtags and mentions from caption
      const hashtags = publishData.caption.match(/#\w+/g)?.map(tag => tag.slice(1)) || [];
      const mentions = publishData.caption.match(/@\w+/g)?.map(mention => mention.slice(1)) || [];

      await glimpseService.createGlimpse(
        user.userId,
        user.username,
        user.avatarURL || '',
        user.verified || false,
        mediaFile,
        mediaType!,
        duration,
        publishData.caption,
        mentions,
        hashtags,
        [],  // taggedUsers - will be deprecated, using taggedPeople instead
        [],  // collaborators
        undefined, // backgroundMusic
        coverImage,
        publishData.taggedPeople,
        publishData.settings
      );

      // Clear draft
      localStorage.removeItem('glimpse_draft');

      toast({
        title: 'Success!',
        description: 'Your glimpse is now live',
      });

      navigate('/glimpses');
    } catch (error) {
      console.error('Failed to publish:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish glimpse',
        variant: 'destructive',
      });
    }
  };

  // Step 1: Media Selection
  if (currentStep === 'select') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-6 w-6 text-white" />
          </Button>
          <h1 className="text-white font-semibold text-lg">Create Glimpse</h1>
          <div className="w-10" />
        </div>

        {/* Selection UI */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
          <div className="text-center space-y-3 mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-primary/50">
              <Video className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-white text-2xl font-bold">Select Media</h2>
            <p className="text-white/60 text-sm max-w-xs">
              Choose photos or videos to create your glimpse
            </p>
            <div className="text-primary text-xs font-medium">
              💡 Max 60 seconds • Multiple selection supported
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-sm space-y-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-16 bg-white text-black hover:bg-white/90 text-lg font-semibold rounded-2xl shadow-xl"
            >
              <ImageIcon className="h-6 w-6 mr-3" />
              Gallery
            </Button>

            <Button
              onClick={() => cameraInputRef.current?.click()}
              variant="outline"
              className="w-full h-16 border-2 border-white/30 text-white hover:bg-white/10 text-lg font-semibold rounded-2xl"
            >
              <Camera className="h-6 w-6 mr-3" />
              Camera
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => handleMediaSelect(e.target.files)}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={(e) => handleMediaSelect(e.target.files)}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  // Step 2: Professional Video Editor (TEMPORARILY DISABLED)
  // Editor is skipped for now - goes directly from select to publish
  if (currentStep === 'editor') {
    return (
      <SimpleGlimpseEditor
        videoFile={selectedMedia[0]}
        onDone={(videoBlob, coverBlob) => {
          setEditedMedia(videoBlob);
          setCoverImage(coverBlob);
          setCurrentStep('cover');
        }}
        onBack={() => setCurrentStep('select')}
      />
    );
  }

  // Step 3: Publish Flow
  if (currentStep === 'publish' && editedMedia && coverImage) {
    return (
      <GlimpsePublishFlow
        videoBlob={editedMedia}
        coverBlob={coverImage}
        onPublish={handlePublish}
        onBack={() => setCurrentStep('select')} // Go back to select since editor is skipped
      />
    );
  }

  return null;
}
