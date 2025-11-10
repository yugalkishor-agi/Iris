import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, MapPin, Hash, Image as ImageIcon, Smile, Rocket, Search, Loader2, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { postService } from "../../src/services/post.service";
import { mediaService } from "../../src/services/media.service";
import { PhotoTagger } from "@/components/post/PhotoTagger";

export default function NewPost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showTagging, setShowTagging] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState<Array<{ userId: string; username: string; x: number; y: number }>>([]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShare = async () => {
    if (!user || !imageFile || !caption.trim()) {
      toast({
        title: "Missing information",
        description: "Please add an image and caption",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    try {
      // Generate temporary postId for upload
      const tempPostId = `post_${Date.now()}_${user.userId}`;
      
      // Upload image to Supabase
      const { mediaURLs } = await mediaService.uploadPostMedia(
        user.userId,
        tempPostId,
        [imageFile]
      );
      
      // Create post in Firestore
      await postService.createPost({
        authorId: user.userId,
        authorUsername: user.username,
        authorAvatarURL: user.avatarURL || '',
        caption: caption,
        mediaURLs: mediaURLs,
        mediaType: 'image',
        postType: 'image',
        aspectRatio: 1,
        location: location || undefined,
        tags: [],
        mentions: [],
        taggedUsers: taggedUsers.length > 0 ? taggedUsers : undefined,
      });

      toast({
        title: "Post shared!",
        description: "Your post is now live",
      });

      navigate("/");
    } catch (error: any) {
      console.error('Failed to create post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <X className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-semibold">Create Post</h1>
        <div className="w-6" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Image Upload Area */}
        {!selectedImage ? (
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <ImageIcon className="h-16 w-16 text-primary mb-4" />
              <p className="text-sm font-medium text-primary">Select Photo</p>
              <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
            </label>
          </div>
        ) : showTagging ? (
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <PhotoTagger
              imageUrl={selectedImage}
              existingTags={taggedUsers}
              onTagsChange={setTaggedUsers}
              onClose={() => setShowTagging(false)}
            />
          </div>
        ) : (
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
            {/* Tag People button */}
            <button
              onClick={() => setShowTagging(true)}
              className="absolute bottom-2 right-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <UserPlus className="h-4 w-4" />
              Tag People {taggedUsers.length > 0 && `(${taggedUsers.length})`}
            </button>
          </div>
        )}

        {/* User Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage />
            <AvatarFallback>WJ</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-sm">WanderJoy</div>
          </div>
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <Label htmlFor="caption">Caption</Label>
          <Textarea
            id="caption"
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-foreground">
              <Smile className="h-4 w-4" />
              <span>Add emoji</span>
            </button>
            <span>{caption.length}/2200</span>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Add Location
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="location"
              type="text"
              placeholder="Search location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10"
            />
          </div>
          {location && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">{location}</span>
              <button
                onClick={() => setLocation("")}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Suggested Hashtags */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Suggested Hashtags
          </Label>
          <div className="flex flex-wrap gap-2">
            {["#Photography", "#Nature", "#Travel", "#Adventure", "#Sunset"].map((tag) => (
              <button
                key={tag}
                onClick={() => setCaption(caption + " " + tag)}
                className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-3 pt-4 border-t">
          <button className="flex items-center justify-between w-full p-3 hover:bg-accent rounded-lg transition-colors">
            <span className="text-sm font-medium">Tag People</span>
            <span className="text-xs text-muted-foreground">0 people tagged</span>
          </button>
          <button className="flex items-center justify-between w-full p-3 hover:bg-accent rounded-lg transition-colors">
            <span className="text-sm font-medium">Accessibility</span>
            <span className="text-xs text-muted-foreground">Add alt text</span>
          </button>
          <button className="flex items-center justify-between w-full p-3 hover:bg-accent rounded-lg transition-colors">
            <span className="text-sm font-medium">Advanced Settings</span>
            <span className="text-xs text-muted-foreground">Turn off commenting</span>
          </button>
        </div>

        {/* Glowing Share Button */}
        <div className="pt-6 pb-4">
          <button
            onClick={handleShare}
            disabled={!selectedImage}
            className="relative w-full group"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur-lg opacity-60 group-hover:opacity-80 group-disabled:opacity-30 transition-opacity animate-pulse-glow" />
            
            {/* Button */}
            <div className="relative flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-primary to-purple-600 rounded-xl text-white font-semibold shadow-lg group-hover:shadow-xl transition-all group-disabled:opacity-50 group-disabled:cursor-not-allowed">
              <Rocket className="h-5 w-5" />
              <span>Share to Iris</span>
            </div>
          </button>
          
          {!selectedImage && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Please select an image to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
