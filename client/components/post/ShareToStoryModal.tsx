import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Image as ImageIcon, X } from "lucide-react";

interface ShareToStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postImageUrl: string;
  postCaption?: string;
}

export function ShareToStoryModal({
  isOpen,
  onClose,
  postId,
  postImageUrl,
  postCaption,
}: ShareToStoryModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sharing, setSharing] = useState(false);

  const handleShareToStory = async () => {
    try {
      setSharing(true);
      
      // Store the post data in sessionStorage to pass to story editor
      const shareData = {
        type: 'post-share',
        postId,
        imageUrl: postImageUrl,
        caption: postCaption,
        timestamp: Date.now(),
      };
      
      sessionStorage.setItem('story-share-data', JSON.stringify(shareData));
      
      // Navigate to story editor with the post image
      navigate('/moment-create', { 
        state: { 
          sharedPost: shareData 
        } 
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to share to story:', error);
      toast({
        title: "Error",
        description: "Failed to share post to story",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Share to Story</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview */}
          <div className="relative aspect-[9/16] max-h-[300px] rounded-lg overflow-hidden bg-muted">
            <img
              src={postImageUrl}
              alt="Post preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white text-sm font-medium line-clamp-2">
                {postCaption || "Shared post"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleShareToStory}
              disabled={sharing}
              className="w-full gap-2"
              size="lg"
            >
              <ImageIcon className="h-5 w-5" />
              {sharing ? "Sharing..." : "Share to Your Story"}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You can add text, stickers, and effects in the story editor
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
