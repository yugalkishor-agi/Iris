import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, X, MapPin, Users, Smile, AtSign, Hash, Loader2, Tag, Type, Eye, Sliders } from "lucide-react";
import { TagPeopleModal } from "@/components/post/TagPeopleModal";
import { AltTextDialog } from "@/components/post/AltTextDialog";
import { SimplifiedImageEditor } from "@/components/editor/SimplifiedImageEditor";
import { MentionAutocomplete } from "@/components/ui/mention-autocomplete";
import { HashtagAutocomplete } from "@/components/ui/hashtag-autocomplete";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { postService } from "../../src/services/post.service";
import { mediaService } from "../../src/services/media.service";
import { cacheService } from "../../src/services/cache.service";

export default function CreatePost() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [altTexts, setAltTexts] = useState<{ [key: number]: string }>({});
  const [taggedUsers, setTaggedUsers] = useState<Array<{ userId: string; username: string; x: number; y: number }>>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showAltTextModal, setShowAltTextModal] = useState(false);
  const [currentAltTextIndex, setCurrentAltTextIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const [hashtagQuery, setHashtagQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const [hideLikeCounts, setHideLikeCounts] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    const newAltTexts = { ...altTexts };
    delete newAltTexts[index];
    setAltTexts(newAltTexts);
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCaption(value);

    // Get cursor position
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);

    // Check for @ mention
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setHashtagQuery("");
      
      // Calculate position for autocomplete dropdown
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        setCursorPosition({ top: rect.bottom + 5, left: rect.left });
      }
    }
    // Check for # hashtag
    else if (textBeforeCursor.match(/#(\w*)$/)) {
      const hashtagMatch = textBeforeCursor.match(/#(\w*)$/);
      setHashtagQuery(hashtagMatch ? hashtagMatch[1] : "");
      setMentionQuery("");
      
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        setCursorPosition({ top: rect.bottom + 5, left: rect.left });
      }
    } else {
      setMentionQuery("");
      setHashtagQuery("");
    }
  };

  const handleMentionSelect = (username: string) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = caption.substring(0, cursorPos);
    const textAfterCursor = caption.substring(cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const newText = textBeforeCursor.replace(/@\w*$/, `@${username} `) + textAfterCursor;
      setCaption(newText);
      setMentionQuery("");
      
      // Focus back on textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = textBeforeCursor.replace(/@\w*$/, `@${username} `).length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleHashtagSelect = (hashtag: string) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = caption.substring(0, cursorPos);
    const textAfterCursor = caption.substring(cursorPos);
    const hashtagMatch = textBeforeCursor.match(/#(\w*)$/);
    
    if (hashtagMatch) {
      const newText = textBeforeCursor.replace(/#\w*$/, `#${hashtag} `) + textAfterCursor;
      setCaption(newText);
      setHashtagQuery("");
      
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = textBeforeCursor.replace(/#\w*$/, `#${hashtag} `).length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handlePost = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please login to create a post",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    
    try {
      // 1. Create temporary post ID
      const tempPostId = `temp-${Date.now()}`;
      
      // 2. Upload media to Supabase
      const { mediaURLs, thumbnailURL } = await mediaService.uploadPostMedia(
        user.userId,
        tempPostId,
        selectedFiles
      );
      
      // 3. Extract hashtags and mentions from caption
      const hashtags = caption.match(/#[\w]+/g)?.map(tag => tag.substring(1)) || [];
      const mentions = caption.match(/@[\w]+/g)?.map(mention => mention.substring(1)) || [];
      
      // 4. Get alt text for first image
      const altText = altTexts[0] || '';
      
      // 5. Create post in Firestore
      const postId = await postService.createPost({
        authorId: user.userId,
        authorUsername: user.username,
        authorAvatarURL: user.avatarURL || '',
        caption,
        location,
        mediaURLs,
        thumbnailURL,
        mediaType: 'image',
        postType: 'image',
        aspectRatio: 1.0,
        tags: hashtags,
        mentions,
        taggedUsers,
        altText,
      });
      
      // 6. Send notifications to mentioned users
      if (mentions.length > 0) {
        try {
          const { userService } = await import('../../src/services/user.service');
          const { notificationService } = await import('../../src/services/notification.service');
          
          for (const username of mentions) {
            try {
              const mentionedUser = await userService.getUser(username);
              if (mentionedUser && mentionedUser.userId !== user.userId) {
                await notificationService.createNotification(
                  mentionedUser.userId,
                  'mention',
                  user.userId,
                  user.username,
                  user.avatarURL || '',
                  postId,
                  `mentioned you in a post: "${caption.substring(0, 50)}${caption.length > 50 ? '...' : ''}"`
                );
              }
            } catch (err) {
              console.error(`Failed to notify @${username}:`, err);
            }
          }
        } catch (err) {
          console.error('Failed to send mention notifications:', err);
        }
      }
      
      // 7. Send notifications to tagged users
      if (taggedUsers.length > 0) {
        try {
          const { notificationService } = await import('../../src/services/notification.service');
          
          for (const tag of taggedUsers) {
            try {
              if (tag.userId !== user.userId) {
                await notificationService.createNotification(
                  tag.userId,
                  'tag',
                  user.userId,
                  user.username,
                  user.avatarURL || '',
                  postId,
                  'tagged you in a post'
                );
              }
            } catch (err) {
              console.error(`Failed to notify tagged user ${tag.username}:`, err);
            }
          }
        } catch (err) {
          console.error('Failed to send tag notifications:', err);
        }
      }
      
      // 6. Invalidate feed cache
      cacheService.invalidateFeed(user.userId);
      
      toast({
        title: "Post created!",
        description: "Your post has been shared successfully",
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Failed to create post",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold">New Post</h1>
          </div>
          <Button onClick={handlePost} disabled={isPosting || selectedImages.length === 0}>
            {isPosting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              "Share"
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Image Upload/Preview */}
        {selectedImages.length === 0 ? (
          <label className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-accent transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Select photos</h3>
            <p className="text-sm text-muted-foreground text-center">
              Tap to select up to 10 photos
            </p>
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{selectedImages.length} photo{selectedImages.length > 1 ? 's' : ''} selected</h3>
              <label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">Add More</span>
                </Button>
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {selectedImages.map((img, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={img}
                    alt={`Selected ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  
                  {/* Edit Button */}
                  <button
                    onClick={() => {
                      setEditingImageIndex(index);
                      setShowImageEditor(true);
                    }}
                    className="absolute top-2 left-2 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary/90 to-primary/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-105 hover:shadow-lg shadow-primary/50"
                  >
                    <Sliders className="h-3.5 w-3.5 text-white" />
                    <span className="text-xs font-medium text-white">Edit</span>
                  </button>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                  
                  {/* Alt Text Input */}
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Input
                      placeholder="Alt text (optional)"
                      value={altTexts[index] || ""}
                      onChange={(e) => setAltTexts({ ...altTexts, [index]: e.target.value })}
                      className="text-xs h-7 bg-black/60 text-white border-white/20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Caption */}
        <div className="space-y-2 relative">
          <label className="text-sm font-medium">Caption</label>
          <Textarea
            ref={textareaRef}
            value={caption}
            onChange={handleCaptionChange}
            placeholder="Write a caption... Use @ to mention users, # for hashtags"
            className="min-h-[120px] resize-none"
            maxLength={2200}
          />
          
          {/* Mention Autocomplete */}
          {mentionQuery !== "" && (
            <MentionAutocomplete
              searchQuery={mentionQuery}
              onSelect={handleMentionSelect}
              position={cursorPosition}
            />
          )}
          
          {/* Hashtag Autocomplete */}
          {hashtagQuery !== "" && (
            <HashtagAutocomplete
              searchQuery={hashtagQuery}
              onSelect={handleHashtagSelect}
              position={cursorPosition}
            />
          )}
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => selectedImages.length > 0 && setShowTagModal(true)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-50"
                disabled={selectedImages.length === 0}
              >
                <Tag className="h-4 w-4" />
                <span className="text-xs">
                  Tag people {taggedUsers.length > 0 && `(${taggedUsers.length})`}
                </span>
              </button>
              <span className="text-xs text-muted-foreground">Use @ and #</span>
            </div>
            <span className={`text-xs ${caption.length > 2000 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {caption.length}/2200
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          {showLocationInput ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location..."
                className="flex-1"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowLocationInput(false);
                  setLocation("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowLocationInput(true)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          )}
        </div>

        {/* Advanced Options */}
        <div className="space-y-3 pt-4 border-t">
          <h3 className="font-semibold text-sm text-muted-foreground">ADVANCED</h3>
          
          <button 
            type="button"
            onClick={() => {
              if (selectedImages.length > 0) {
                setCurrentAltTextIndex(0);
                setShowAltTextModal(true);
              } else {
                toast({
                  title: "No images selected",
                  description: "Please add images first to write alt text",
                  variant: "destructive",
                });
              }
            }}
            className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <Type className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium text-sm">Accessibility</div>
                <div className="text-xs text-muted-foreground">
                  Write alt text {Object.keys(altTexts).length > 0 && `(${Object.keys(altTexts).length} added)`}
                </div>
              </div>
            </div>
          </button>

          <div 
            onClick={() => setHideLikeCounts(!hideLikeCounts)}
            className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium text-sm">Hide like & view counts</div>
                <div className="text-xs text-muted-foreground">
                  {hideLikeCounts ? "Hidden - Only you will see" : "Visible to everyone"}
                </div>
              </div>
            </div>
            <Switch 
              checked={hideLikeCounts} 
              onCheckedChange={(checked) => setHideLikeCounts(checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      </div>

      {/* Tag People Modal */}
      {selectedImages.length > 0 && (
        <TagPeopleModal
          isOpen={showTagModal}
          onClose={() => setShowTagModal(false)}
          imageUrl={selectedImages[0]}
          onSave={(tags) => setTaggedUsers(tags)}
          existingTags={taggedUsers}
        />
      )}

      {/* Alt Text Dialog */}
      <AltTextDialog
        isOpen={showAltTextModal}
        onClose={() => setShowAltTextModal(false)}
        images={selectedImages}
        altTexts={altTexts}
        onSave={(texts) => {
          setAltTexts(texts);
          toast({
            title: "Alt text saved",
            description: `Alt text added for ${Object.keys(texts).length} image(s)`,
          });
        }}
      />

      {/* Image Editor */}
      {selectedImages.length > 0 && (
        <SimplifiedImageEditor
          isOpen={showImageEditor}
          onClose={() => setShowImageEditor(false)}
          imageUrl={selectedImages[editingImageIndex]}
          onSave={(editedUrl) => {
            // Update the selected image with edited version
            const newImages = [...selectedImages];
            newImages[editingImageIndex] = editedUrl;
            setSelectedImages(newImages);
            
            // Convert edited blob URL back to File for upload
            fetch(editedUrl)
              .then(res => res.blob())
              .then(blob => {
                const file = new File([blob], `edited-${editingImageIndex}.jpg`, { type: 'image/jpeg' });
                const newFiles = [...selectedFiles];
                newFiles[editingImageIndex] = file;
                setSelectedFiles(newFiles);
              });
            
            toast({
              title: "Image edited",
              description: "Your changes have been applied",
            });
          }}
        />
      )}
    </div>
  );
}
