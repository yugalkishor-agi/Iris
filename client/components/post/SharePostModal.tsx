import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Copy,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  MessageCircle,
  Plus,
  X,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { ShareToStoryModal } from "./ShareToStoryModal";

interface SharePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postUrl: string;
  postCaption?: string;
  postImageUrl?: string;
}

export function SharePostModal({
  isOpen,
  onClose,
  postId,
  postUrl,
  postCaption,
  postImageUrl,
}: SharePostModalProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareToStory, setShowShareToStory] = useState(false);

  // Load followers and following when modal opens
  useEffect(() => {
    const loadUsers = async () => {
      if (!isOpen) return;
      
      try {
        setLoading(true);
        const { useAuth } = await import("../../contexts/AuthContext");
        const { user: currentUser } = useAuth();
        
        if (!currentUser) return;
        
        const { userService } = await import("../../../src/services/user.service");
        
        // Get followers and following
        const [followerIds, followingIds] = await Promise.all([
          userService.getFollowers(currentUser.userId),
          userService.getFollowing(currentUser.userId),
        ]);
        
        // Combine and deduplicate
        const allUserIds = [...new Set([...followerIds, ...followingIds])];
        
        // Get user details
        const userDetails = await Promise.all(
          allUserIds.slice(0, 50).map(async (userId) => {
            try {
              const user = await userService.getUser(userId);
              return user;
            } catch (error) {
              return null;
            }
          })
        );
        
        setUsers(userDetails.filter(u => u !== null));
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, [isOpen]);

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link Copied",
        description: "Post link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleShareToExternal = (platform: string) => {
    const text = postCaption
      ? `${postCaption.substring(0, 100)}...`
      : "Check out this post!";

    switch (platform) {
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
          "_blank"
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`,
          "_blank"
        );
        break;
      case "linkedin":
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
          "_blank"
        );
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text + " " + postUrl)}`,
          "_blank"
        );
        break;
      case "email":
        window.location.href = `mailto:?subject=${encodeURIComponent("Check out this post")}&body=${encodeURIComponent(text + "\n\n" + postUrl)}`;
        break;
    }
    
    toast({
      title: "Opening...",
      description: `Sharing to ${platform}`,
    });
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendToDMs = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No recipients",
        description: "Please select at least one person",
        variant: "destructive",
      });
      return;
    }

    try {
      const { useAuth } = await import("../../contexts/AuthContext");
      const { user: currentUser } = useAuth();
      
      if (!currentUser) return;
      
      const { messageService } = await import("../../../src/services/message.service");
      
      // Send post to each selected user
      await Promise.all(
        selectedUsers.map(async (userId) => {
          // Get or create conversation
          const conversationId = await messageService.getOrCreateDirectConversation(currentUser.userId, userId);
          
          // Send message with post link
          await messageService.sendMessage(
            conversationId,
            {
              senderId: currentUser.userId,
              senderUsername: currentUser.username,
              senderAvatarURL: currentUser.avatarURL || '',
              text: `Check out this post: ${postUrl}`
            }
          );
        })
      );
      
      toast({
        title: "Post Shared!",
        description: `Sent to ${selectedUsers.length} ${selectedUsers.length === 1 ? "person" : "people"}`,
      });
      
      setSelectedUsers([]);
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to share post",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="p-4 pb-3 border-b">
          <DialogTitle className="text-center">Share</DialogTitle>
        </DialogHeader>

        {/* Share to People */}
        <div className="p-4 border-b max-h-[300px] overflow-y-auto">
          <h3 className="font-semibold text-sm mb-3">Share to</h3>
          
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3"
          />

          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-2 hover:bg-accent rounded-lg cursor-pointer"
                onClick={() => handleToggleUser(user.userId)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatarURL} />
                    <AvatarFallback>
                      {user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">{user.username}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.displayName}
                    </div>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedUsers.includes(user.userId)
                      ? "bg-primary border-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {selectedUsers.includes(user.userId) && (
                    <Check className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedUsers.length > 0 && (
            <Button onClick={handleSendToDMs} className="w-full mt-3">
              <Send className="h-4 w-4 mr-2" />
              Send to {selectedUsers.length} {selectedUsers.length === 1 ? "person" : "people"}
            </Button>
          )}
        </div>

        {/* Share Options */}
        <div className="p-4 space-y-2">
          {/* Share to Story - Top Priority */}
          {postImageUrl && (
            <button
              onClick={() => setShowShareToStory(true)}
              className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <ImageIcon className="h-5 w-5" />
              <span className="font-semibold">Share to Your Story</span>
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
            <span className="font-medium">
              {copied ? "Link Copied!" : "Copy Link"}
            </span>
          </button>

          <button
            onClick={() => handleShareToExternal("whatsapp")}
            className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors"
          >
            <MessageCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium">Share to WhatsApp</span>
          </button>

          <button
            onClick={() => handleShareToExternal("facebook")}
            className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors"
          >
            <Facebook className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Share to Social Platform 1</span>
          </button>

          <button
            onClick={() => handleShareToExternal("twitter")}
            className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors"
          >
            <Twitter className="h-5 w-5 text-sky-500" />
            <span className="font-medium">Share to Social Platform 2</span>
          </button>

          <button
            onClick={() => handleShareToExternal("linkedin")}
            className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors"
          >
            <Linkedin className="h-5 w-5 text-blue-700" />
            <span className="font-medium">Share to LinkedIn</span>
          </button>

          <button
            onClick={() => handleShareToExternal("email")}
            className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors"
          >
            <Mail className="h-5 w-5" />
            <span className="font-medium">Share via Email</span>
          </button>
        </div>
      </DialogContent>
      
      {/* Share to Story Modal */}
      {showShareToStory && postImageUrl && (
        <ShareToStoryModal
          isOpen={showShareToStory}
          onClose={() => setShowShareToStory(false)}
          postId={postId}
          postImageUrl={postImageUrl}
          postCaption={postCaption}
        />
      )}
    </Dialog>
  );
}
