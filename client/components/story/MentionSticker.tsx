import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, AtSign } from 'lucide-react';
import { searchService } from '../../../src/services/search.service';

interface MentionStickerProps {
  username: string;
  avatarURL?: string;
  verified?: boolean;
  style?: React.CSSProperties;
}

export function MentionSticker({ username, avatarURL, verified, style }: MentionStickerProps) {
  return (
    <div
      style={{
        ...style,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(236, 72, 153, 0.9) 100%)',
        borderRadius: '24px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        userSelect: 'none',
      }}
    >
      <Avatar className="h-8 w-8 border-2 border-white/50">
        <AvatarImage src={avatarURL} />
        <AvatarFallback className="bg-white/20 text-white text-xs">
          {username?.[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span
        style={{
          color: 'white',
          fontSize: '16px',
          fontWeight: '600',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        }}
      >
        @{username}
      </span>
      {verified && (
        <svg
          style={{ width: '16px', height: '16px', color: '#3b82f6' }}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
    </div>
  );
}

interface MentionStickerCreatorProps {
  onAdd: (userId: string, username: string, avatarURL: string, verified: boolean) => void;
  onClose: () => void;
}

export function MentionStickerCreator({ onAdd, onClose }: MentionStickerCreatorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchService.searchUsers(query, 10);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user: any) => {
    onAdd(user.userId, user.username, user.avatarURL || '', user.verified || false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <AtSign className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Mention Someone</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {searching ? (
            <div className="p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-white/60 text-sm">Searching...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center">
              <AtSign className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60 text-sm">
                {searchQuery ? 'No users found' : 'Search for a user to mention'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {searchResults.map((user) => (
                <button
                  key={user.userId}
                  onClick={() => handleSelectUser(user)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                >
                  <Avatar className="h-12 w-12 border-2 border-white/20">
                    <AvatarImage src={user.avatarURL} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {user.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-semibold text-sm">@{user.username}</span>
                      {user.verified && (
                        <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    {user.fullName && (
                      <span className="text-white/60 text-xs">{user.fullName}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
