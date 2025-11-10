import { useState, useEffect } from 'react';
import { X, Search, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { useAuth } from '@/contexts/AuthContext';
import { messageService } from '../../../src/services/message.service';
import { userService } from '../../../src/services/user.service';
import { useToast } from '@/hooks/use-toast';
import { useConversations } from '@/hooks/useMessages';

interface ShareStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  storyAuthor: string;
  storyCover: string;
  authorVerified?: boolean;
}

export default function ShareStoryModal({
  isOpen,
  onClose,
  storyId,
  storyAuthor,
  storyCover,
  authorVerified = false
}: ShareStoryModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { conversations } = useConversations();
  const [users, setUsers] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Load suggested users on open
  useEffect(() => {
    if (isOpen && !searchQuery) {
      loadSuggestedUsers();
    } else if (isOpen && searchQuery.trim().length >= 2) {
      searchUsers();
    } else if (isOpen) {
      setUsers([]);
    }
  }, [isOpen, searchQuery]);

  const loadSuggestedUsers = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Early return if no conversations
      if (!conversations || conversations.length === 0) {
        setSuggestedUsers([]);
        setUsers([]);
        setLoading(false);
        return;
      }
      
      // Get conversation partners sorted by message count
      const conversationUsers = await Promise.all(
        conversations
          .filter(conv => conv && conv.participants && Array.isArray(conv.participants))
          .map(async (conv) => {
            const otherUserId = conv.participants.find(p => p !== user.userId);
            if (!otherUserId) return null;
          
          try {
            const userData = await userService.getUserById(otherUserId);
            return {
              ...userData,
              messageCount: conv.lastMessage?.timestamp || 0
            };
          } catch {
            return null;
          }
        })
      );
      
      const validConvUsers = conversationUsers.filter(u => u !== null);
      
      // Sort by most recent chat activity
      const topChatted = validConvUsers
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 3);
      
      let mutualWithChats: any[] = [];
      
      try {
        // Get followers and following for mutual connections
        const [followers, following] = await Promise.all([
          userService.getFollowers(user.userId),
          userService.getFollowing(user.userId)
        ]);
        
        // Find mutual followers (people who follow you AND you follow them)
        const mutualFollowerIds = followers
          .filter(f => following.some(fw => fw.userId === f.userId))
          .map(f => f.userId);
        
        // Get mutual followers who have chats with you
        mutualWithChats = validConvUsers
          .filter(u => mutualFollowerIds.includes(u.userId))
          .filter(u => !topChatted.some(tc => tc.userId === u.userId))
          .sort((a, b) => b.messageCount - a.messageCount)
          .slice(0, 4);
      } catch (error) {
        console.error('Failed to load mutual followers:', error);
        // Continue with just top chatted users
      }
      
      // Combine: top 3 chatted + 4 mutual with chats
      const suggested = [...topChatted, ...mutualWithChats];
      setSuggestedUsers(suggested);
      setUsers(suggested);
    } catch (error) {
      console.error('Failed to load suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const results = await userService.searchUsers(searchQuery, 20);
      setUsers(results.filter(u => u.userId !== user.userId));
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (!user || selectedUsers.length === 0) return;

    try {
      setSending(true);
      await Promise.all(
        selectedUsers.map(async (userId) => {
          const conversationId = await messageService.getOrCreateDirectConversation(
            user.userId,
            userId
          );
          return messageService.shareStory(
            conversationId,
            user.userId,
            storyId,
            storyAuthor,
            storyCover,
            authorVerified
          );
        })
      );

      toast({
        title: 'Story shared!',
        description: `Shared to ${selectedUsers.length} ${selectedUsers.length === 1 ? 'user' : 'users'}`,
      });

      setSelectedUsers([]);
      setSearchQuery('');
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to share story',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = searchQuery ? users : suggestedUsers;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-background rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Share Story</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for more users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary"></div>
            </div>
          ) : filteredUsers.length === 0 && !searchQuery ? (
            <div className="text-center py-12 px-4">
              <p className="text-muted-foreground">No recent chats found</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div>
              {!searchQuery && suggestedUsers.length > 0 && (
                <div className="px-4 py-2 bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Suggested
                  </p>
                </div>
              )}
              <div className="divide-y">
                {filteredUsers.map((otherUser) => {
                const isSelected = selectedUsers.includes(otherUser.userId);

                return (
                  <button
                    key={otherUser.userId}
                    onClick={() => toggleUser(otherUser.userId)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherUser?.avatarURL} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10">
                        {otherUser?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1">
                        <p className="font-medium truncate">{otherUser?.displayName}</p>
                        {otherUser?.verified && <VerifiedBadge size="sm" />}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">@{otherUser?.username}</p>
                    </div>

                    <div
                      className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-t bg-muted/30">
            <Button
              onClick={handleShare}
              disabled={sending}
              className="w-full"
              size="lg"
            >
              {sending ? (
                'Sharing...'
              ) : (
                `Share to ${selectedUsers.length} ${selectedUsers.length === 1 ? 'user' : 'users'}`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
