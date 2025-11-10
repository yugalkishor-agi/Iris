import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { userService } from '../../../src/services/user.service';
import { messageService } from '../../../src/services/message.service';
import type { User } from '../../../src/types/database';

interface UserSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (userId: string, message?: string) => Promise<void>;
  title?: string;
  allowMessage?: boolean;
  placeholder?: string;
}

export function UserSelectorDialog({ 
  isOpen, 
  onClose, 
  onSelect,
  title = "Share with",
  allowMessage = false,
  placeholder = 'Search users...'
}: UserSelectorDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setUsers([]);
        return;
      }

      try {
        setLoading(true);
        const results = await userService.searchUsers(searchQuery);
        setUsers(results);
      } catch (error) {
        console.error('Search failed:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleShare = async (userId: string) => {
    try {
      setSending(true);
      await onSelect(userId, messageText);
      setMessageText('');
      onClose();
    } catch (error) {
      console.error('Failed to share:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:max-w-md sm:rounded-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
        </div>

        {/* Optional Message Input */}
        {allowMessage && (
          <div className="px-4 pb-3">
            <input
              type="text"
              placeholder="Add a message (optional)..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full px-4 py-2.5 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length > 0 ? (
            <div className="divide-y">
              {users.map((user) => (
                <button
                  key={user.userId}
                  onClick={() => {
                    handleShare(user.userId);
                  }}
                  disabled={sending}
                  className="w-full flex items-center gap-3 p-4 hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatarURL} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-bold">
                      {user.displayName?.[0] || user.username?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">
                        {user.displayName || user.username}
                      </span>
                      {user.verified && <VerifiedBadge size="sm" />}
                    </div>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Search for people to share with
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
