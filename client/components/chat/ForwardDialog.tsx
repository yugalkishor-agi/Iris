import { useState, useEffect } from 'react';
import { X, Search, CheckCircle2, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { userService } from '../../../src/services/user.service';
import type { User } from '../../../src/types/database';

interface ForwardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onForward: (userIds: string[]) => Promise<void>;
  messageCount: number;
}

export function ForwardDialog({ isOpen, onClose, onForward, messageCount }: ForwardDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [forwarding, setForwarding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      searchUsers('');
      setSelectedUsers(new Set());
    }
  }, [isOpen]);

  const searchUsers = async (query: string) => {
    setLoading(true);
    try {
      const results = await userService.searchUsers(query || '', 20);
      setUsers(results);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const timeoutId = setTimeout(() => searchUsers(value), 300);
    return () => clearTimeout(timeoutId);
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleForward = async () => {
    if (selectedUsers.size === 0) return;
    
    setForwarding(true);
    try {
      await onForward(Array.from(selectedUsers));
      onClose();
    } catch (error) {
      console.error('Failed to forward:', error);
    } finally {
      setForwarding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-background rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom duration-300 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">
            Forward {messageCount > 1 ? `${messageCount} messages` : 'message'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search users..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Selected count */}
        {selectedUsers.size > 0 && (
          <div className="px-4 py-2 bg-primary/10 text-sm text-primary font-medium">
            {selectedUsers.size} selected
          </div>
        )}

        {/* User list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="divide-y">
              {users.map((user) => (
                <button
                  key={user.userId}
                  onClick={() => toggleUser(user.userId)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-accent transition-colors text-left"
                >
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={user.avatarURL} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-bold">
                      {user.displayName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold truncate">{user.displayName || user.username}</span>
                      {user.verified && <VerifiedBadge size="sm" />}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                  </div>
                  {selectedUsers.has(user.userId) && (
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button
            onClick={handleForward}
            disabled={selectedUsers.size === 0 || forwarding}
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          >
            {forwarding ? (
              'Forwarding...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Forward to {selectedUsers.size} {selectedUsers.size === 1 ? 'person' : 'people'}
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
