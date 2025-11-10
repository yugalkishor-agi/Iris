import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { ChevronLeft, Search, Send, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { messageService } from "../../src/services/message.service";
import { userService } from "../../src/services/user.service";
import { postService } from "../../src/services/post.service";
import type { User, Post } from "../../src/types/database";

export default function SharePost() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [following, setFollowing] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser || !postId) return;
      
      try {
        setLoading(true);
        
        // Load post details
        const postData = await postService.getPost(postId);
        setPost(postData);
        
        // Load following users
        const followingIds = await userService.getFollowing(currentUser.userId);
        const users = await Promise.all(
          followingIds.map(id => userService.getUser(id))
        );
        setFollowing(users.filter(u => u !== null) as User[]);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser, postId]);

  const filteredUsers = following.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleShare = async () => {
    if (!currentUser || !postId || selectedUsers.size === 0) return;

    try {
      setSending(true);
      
      const postUrl = `${window.location.origin}/post/${postId}`;
      const shareText = `Check out this post: ${postUrl}`;

      // Send to each selected user
      for (const userId of selectedUsers) {
        const conversationId = await messageService.getOrCreateDirectConversation(
          currentUser.userId,
          userId
        );
        
        await messageService.sendMessage(conversationId, {
          senderId: currentUser.userId,
          senderUsername: currentUser.username,
          senderAvatarURL: currentUser.avatarURL || '',
          text: shareText,
        });
      }

      toast({
        title: "Post shared!",
        description: `Sent to ${selectedUsers.size} ${selectedUsers.size === 1 ? 'person' : 'people'}`,
      });

      navigate(-1);
    } catch (error) {
      console.error('Failed to share post:', error);
      toast({
        title: "Error",
        description: "Failed to share post",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <LoadingState text="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold flex-1">Share Post</h1>
          <Button 
            onClick={handleShare}
            disabled={selectedUsers.size === 0 || sending}
            size="sm"
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>

      {/* Post Preview */}
      {post && (
        <div className="px-4 py-4 border-b">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <img 
              src={post.mediaURLs[0]} 
              alt="Post" 
              className="h-16 w-16 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">@{post.authorUsername}</p>
              <p className="text-xs text-muted-foreground truncate">
                {post.caption || 'Post'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Selected Count */}
      {selectedUsers.size > 0 && (
        <div className="px-4 py-2 bg-primary/5 border-b">
          <p className="text-sm text-primary font-medium">
            {selectedUsers.size} selected
          </p>
        </div>
      )}

      {/* User List */}
      <div className="px-4 py-2">
        {filteredUsers.length > 0 ? (
          <div className="space-y-2">
            {filteredUsers.map((user) => {
              const isSelected = selectedUsers.has(user.userId);
              
              return (
                <button
                  key={user.userId}
                  onClick={() => toggleUser(user.userId)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isSelected 
                      ? 'bg-primary/10 border-2 border-primary' 
                      : 'hover:bg-accent border-2 border-transparent'
                  }`}
                >
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={user.avatarURL} />
                    <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-sm truncate">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0 h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? 'No users found' : 'No following users'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
