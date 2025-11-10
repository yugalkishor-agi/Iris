import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Smile, Link2, Check, Loader2 } from "lucide-react";
import { StickerPicker } from "@/components/ui/StickerPicker";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "../../src/services/user.service";
import { useToast } from "@/hooks/use-toast";

export default function BioEditor() {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState("");

  // Load current bio
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const loadBio = async () => {
      try {
        setLoading(true);
        const userData = await userService.getUser(currentUser.userId);
        if (userData) {
          setBio(userData.bio || "");
        }
      } catch (error) {
        console.error('Error loading bio:', error);
        toast({
          title: "Error",
          description: "Failed to load bio",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadBio();
  }, [currentUser, navigate, toast]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const textareaRef = useState<HTMLTextAreaElement | null>(null);

  const characterLimit = 150;
  const remainingChars = characterLimit - bio.length;

  const handleEmojiSelect = (emoji: string) => {
    setBio(bio + emoji);
    setShowEmojiPicker(false);
  };

  const handleAddLink = () => {
    if (linkText && linkUrl) {
      const linkMarkdown = `[${linkText}](${linkUrl})`;
      setBio(bio + " " + linkMarkdown);
      setLinkText("");
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);
      await userService.updateUser(currentUser.userId, {
        bio: bio.trim(),
      });

      // Refresh user in context
      await refreshUser();

      toast({
        title: "Bio updated",
        description: "Your bio has been saved successfully",
      });

      setTimeout(() => navigate("/profile-settings"), 500);
    } catch (error: any) {
      console.error('Error saving bio:', error);
      toast({
        title: "Error",
        description: "Failed to save bio",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <Link to="/edit-profile" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Edit Bio</h1>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Bio Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Bio</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, characterLimit))}
            placeholder="Tell us about yourself..."
            className="min-h-[120px] resize-none"
            maxLength={characterLimit}
          />
          <div className="flex items-center justify-between text-sm">
            <span className={remainingChars < 20 ? "text-destructive" : "text-muted-foreground"}>
              {remainingChars} characters remaining
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="h-4 w-4 mr-2" />
            Add Emoji
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLinkInput(!showLinkInput)}
          >
            <Link2 className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="animate-slide-down">
            <StickerPicker onSelect={handleEmojiSelect} />
          </div>
        )}

        {/* Link Input */}
        {showLinkInput && (
          <div className="border rounded-lg p-4 space-y-3 animate-slide-down">
            <h3 className="font-semibold text-sm">Add Link</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Link text (e.g., My Website)"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              />
              <input
                type="url"
                placeholder="URL (e.g., https://example.com)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLinkInput(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddLink}>
                Add Link
              </Button>
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-sm">Preview</h3>
          <div className="text-sm whitespace-pre-wrap break-words">
            {bio || <span className="text-muted-foreground italic">Your bio will appear here...</span>}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-sm">Tips</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use emojis to make your bio more expressive</li>
            <li>• Add links to your website or other social profiles</li>
            <li>• Keep it concise and engaging</li>
            <li>• Update regularly to reflect your current interests</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
