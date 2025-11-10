import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { userService } from '../../src/services/user.service';
import { messageService } from '../../src/services/message.service';
import { ChevronLeft, Search, Users, Upload, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewGroup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedUserId = searchParams.get('userId');
  
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [following, setFollowing] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadFollowing();
  }, [user]);

  useEffect(() => {
    if (preselectedUserId && following.length > 0) {
      setSelectedUsers(new Set([preselectedUserId]));
    }
  }, [preselectedUserId, following]);

  useEffect(() => {
    if (search.trim()) {
      const filtered = following.filter(
        (u) =>
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          u.displayName?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(following);
    }
  }, [search, following]);

  const loadFollowing = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const followingIds = await userService.getFollowing(user.userId, 100);
      const users = await Promise.all(
        followingIds.map(async (userId) => {
          try {
            return await userService.getUser(userId);
          } catch (err) {
            return null;
          }
        })
      );
      setFollowing(users.filter((u) => u !== null));
      setFilteredUsers(users.filter((u) => u !== null));
    } catch (error) {
      console.error('Failed to load following:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupIcon(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || selectedUsers.size < 2) {
      toast({
        title: 'Select at least 2 members',
        description: 'A group needs at least 2 other members',
        variant: 'destructive',
      });
      return;
    }

    if (!groupName.trim()) {
      toast({
        title: 'Enter group name',
        description: 'Please provide a name for the group',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const participantIds = Array.from(selectedUsers);
      
      // Create group conversation
      const conversationId = await messageService.createGroupConversation(
        user.userId,
        participantIds,
        groupName,
        groupIcon || undefined
      );

      toast({
        title: 'Group created',
        description: `${groupName} has been created successfully`,
      });

      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Failed to create group:', error);
      toast({
        title: 'Failed to create group',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-background z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-full transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="font-semibold text-lg">New Group</h1>
            <p className="text-xs text-muted-foreground">
              {selectedUsers.size} {selectedUsers.size === 1 ? 'member' : 'members'} selected
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreateGroup}
          disabled={creating || selectedUsers.size < 2 || !groupName.trim()}
          className="px-6"
        >
          {creating ? 'Creating...' : 'Create'}
        </Button>
      </div>

      {/* Group Details */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Input
              type="file"
              accept="image/*"
              onChange={handleIconUpload}
              className="hidden"
              id="group-icon"
            />
            <label htmlFor="group-icon" className="cursor-pointer">
              {groupIcon ? (
                <div className="relative">
                  <img
                    src={groupIcon}
                    alt="Group icon"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setGroupIcon(null);
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/30 hover:border-primary transition-colors">
                  <Upload className="h-6 w-6 text-primary/70" />
                </div>
              )}
            </label>
          </div>
          <div className="flex-1">
            <Input
              placeholder="Group name (required)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="text-base"
            />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Selected Members Preview */}
      {selectedUsers.size > 0 && (
        <div className="px-4 py-2 bg-primary/5 border-b">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from(selectedUsers).map((userId) => {
              const user = following.find((u) => u.userId === userId);
              if (!user) return null;
              return (
                <div
                  key={userId}
                  className="flex items-center gap-2 bg-background rounded-full pl-1 pr-3 py-1 border"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatarURL} />
                    <AvatarFallback className="text-xs">
                      {user.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{user.username}</span>
                  <button
                    onClick={() => toggleUser(userId)}
                    className="hover:bg-accent rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Users className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center">
              {search ? 'No users found' : 'Follow people to add them to groups'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredUsers.map((user) => (
              <div
                key={user.userId}
                onClick={() => toggleUser(user.userId)}
                className="flex items-center gap-3 p-4 hover:bg-accent cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={selectedUsers.has(user.userId)}
                  onCheckedChange={() => toggleUser(user.userId)}
                />
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatarURL} />
                  <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.username}</p>
                  {user.displayName && (
                    <p className="text-sm text-muted-foreground truncate">
                      {user.displayName}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
