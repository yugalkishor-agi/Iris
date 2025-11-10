import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '../../../src/services/user.service';
import { shareService } from '../../../src/services/share.service';
import { useToast } from '@/hooks/use-toast';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: 'post' | 'glimpse' | 'story';
  contentId: string;
  contentData: {
    authorId: string;
    authorUsername: string;
    authorAvatarURL: string;
    mediaURL: string;
    caption?: string;
    mediaType: 'image' | 'video';
  };
}

export function ShareDialog({
  open,
  onOpenChange,
  contentType,
  contentId,
  contentData,
}: ShareDialogProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open && currentUser) {
      loadUsers();
    }
  }, [open, currentUser]);

  useEffect(() => {
    if (search.trim()) {
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(search.toLowerCase()) ||
          user.displayName?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [search, users]);

  const loadUsers = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Get user's following list
      const followingIds = await userService.getFollowing(currentUser.userId, 50);
      
      // Get full user details for each following
      const followingUsers = await Promise.all(
        followingIds.map(async (userId) => {
          try {
            return await userService.getUser(userId);
          } catch (err) {
            console.error('Failed to load user:', userId, err);
            return null;
          }
        })
      );
      
      // Filter out null values
      const validUsers = followingUsers.filter(u => u !== null);
      setUsers(validUsers);
      setFilteredUsers(validUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (toUserId: string) => {
    console.log('🔵 handleShare clicked:', { toUserId, currentUser: currentUser?.username, contentType });
    
    if (!currentUser || sending[toUserId]) {
      console.log('⚠️ Blocked:', { hasUser: !!currentUser, alreadySending: sending[toUserId] });
      return;
    }

    setSending({ ...sending, [toUserId]: true });

    try {
      if (contentType === 'post') {
        await shareService.sharePostInDM(
          contentId,
          contentData,
          currentUser.userId,
          currentUser.username,
          currentUser.avatarURL || '',
          toUserId
        );
      } else if (contentType === 'glimpse') {
        await shareService.shareGlimpseInDM(
          contentId,
          contentData,
          currentUser.userId,
          currentUser.username,
          currentUser.avatarURL || '',
          toUserId
        );
      } else if (contentType === 'story') {
        await shareService.shareStoryInDM(
          contentId,
          contentData,
          currentUser.userId,
          currentUser.username,
          currentUser.avatarURL || '',
          toUserId
        );
      }

      console.log('✅ Share successful');
      toast({
        title: 'Shared!',
        description: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} sent successfully`,
      });
    } catch (error: any) {
      console.error('❌ Share failed:', error);
      toast({
        title: 'Failed to share',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setSending({ ...sending, [toUserId]: false });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Share {contentType}</DialogTitle>
          <DialogDescription>Send to your followers</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {search ? 'No users found' : 'Follow users to share with them'}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatarURL} />
                    <AvatarFallback>{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{user.username}</p>
                    {user.displayName && (
                      <p className="text-xs text-muted-foreground">{user.displayName}</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleShare(user.userId)}
                  disabled={sending[user.userId]}
                  className="gap-2"
                >
                  {sending[user.userId] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
