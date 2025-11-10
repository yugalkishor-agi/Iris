import { useState, useEffect } from 'react';
import { X, Search, UserX, Users, MessageCircleOff, Share2, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { storyService } from '../../../src/services/story.service';
import { userService } from '../../../src/services/user.service';
import { useToast } from '@/hooks/use-toast';

interface StorySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  storyId: string;
  currentUserId: string;
  currentSettings: {
    allowReplies: boolean;
    allowSharing: boolean;
    hiddenFrom: string[];
  };
  onSettingsUpdate: () => void;
}

export default function StorySettingsModal({
  isOpen,
  onClose,
  onOpen,
  storyId,
  currentUserId,
  currentSettings,
  onSettingsUpdate,
}: StorySettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'closeFriends' | 'hideFrom'>('closeFriends');
  const [searchQueryCloseFriends, setSearchQueryCloseFriends] = useState('');
  const [searchQueryHideFrom, setSearchQueryHideFrom] = useState('');
  const [closeFriends, setCloseFriends] = useState<any[]>([]);
  const [hiddenUsers, setHiddenUsers] = useState<any[]>([]);
  const [searchResultsCloseFriends, setSearchResultsCloseFriends] = useState<any[]>([]);
  const [searchResultsHideFrom, setSearchResultsHideFrom] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [allowReplies, setAllowReplies] = useState(currentSettings.allowReplies);
  const [allowSharing, setAllowSharing] = useState(currentSettings.allowSharing);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      onOpen?.(); // Trigger pause callback
      loadCloseFriends();
      loadHiddenUsers();
      setAllowReplies(currentSettings.allowReplies);
      setAllowSharing(currentSettings.allowSharing);
    }
  }, [isOpen, currentSettings, onOpen]);

  const loadCloseFriends = async () => {
    try {
      const friendIds = await userService.getCloseFriends(currentUserId);
      const friends = await Promise.all(
        friendIds.map(userId => userService.getUser(userId))
      );
      setCloseFriends(friends.filter(Boolean));
    } catch (error) {
      console.error('Failed to load close friends:', error);
    }
  };

  const loadHiddenUsers = async () => {
    try {
      if (currentSettings.hiddenFrom.length === 0) {
        setHiddenUsers([]);
        return;
      }
      const users = await Promise.all(
        currentSettings.hiddenFrom.map(userId => userService.getUser(userId))
      );
      setHiddenUsers(users.filter(Boolean));
    } catch (error) {
      console.error('Failed to load hidden users:', error);
    }
  };

  const handleSearchCloseFriends = async (query: string) => {
    setSearchQueryCloseFriends(query);
    if (query.trim().length < 2) {
      setSearchResultsCloseFriends([]);
      return;
    }

    try {
      setLoading(true);
      const results = await userService.searchUsers(query, 10);
      const closeFriendIds = closeFriends.map(f => f.userId);
      const filtered = results.filter(
        user => user.userId !== currentUserId && 
        !closeFriendIds.includes(user.userId)
      );
      setSearchResultsCloseFriends(filtered);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchHideFrom = async (query: string) => {
    setSearchQueryHideFrom(query);
    if (query.trim().length < 2) {
      setSearchResultsHideFrom([]);
      return;
    }

    try {
      setLoading(true);
      const results = await userService.searchUsers(query, 10);
      const hiddenUserIds = hiddenUsers.map(u => u.userId);
      const filtered = results.filter(
        user => user.userId !== currentUserId && 
        !hiddenUserIds.includes(user.userId)
      );
      setSearchResultsHideFrom(filtered);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCloseFriend = async (userId: string) => {
    try {
      await userService.addCloseFriend(currentUserId, userId);
      toast({ title: 'Added', description: 'User added to close friends' });
      setSearchQueryCloseFriends('');
      setSearchResultsCloseFriends([]);
      await loadCloseFriends();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add close friend', variant: 'destructive' });
    }
  };

  const handleRemoveCloseFriend = async (userId: string) => {
    try {
      await userService.removeCloseFriend(currentUserId, userId);
      toast({ title: 'Removed', description: 'User removed from close friends' });
      await loadCloseFriends();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove close friend', variant: 'destructive' });
    }
  };

  const handleAddHiddenUser = async (userId: string) => {
    try {
      await storyService.hideStoryFrom(storyId, currentUserId, [userId]);
      toast({ title: 'User hidden', description: 'This user will not see your story' });
      setSearchQueryHideFrom('');
      setSearchResultsHideFrom([]);
      
      // Update current settings
      currentSettings.hiddenFrom = [...currentSettings.hiddenFrom, userId];
      await loadHiddenUsers();
      onSettingsUpdate();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to hide story from user', variant: 'destructive' });
    }
  };

  const handleRemoveHiddenUser = async (userId: string) => {
    try {
      await storyService.unhideStoryFrom(storyId, currentUserId, [userId]);
      toast({ title: 'User unhidden', description: 'This user can now see your story' });
      
      // Update current settings
      currentSettings.hiddenFrom = currentSettings.hiddenFrom.filter(id => id !== userId);
      await loadHiddenUsers();
      onSettingsUpdate();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to unhide story', variant: 'destructive' });
    }
  };

  const handleToggleReplies = async () => {
    try {
      const newStatus = !allowReplies;
      await storyService.updateStorySettings(storyId, currentUserId, {
        allowReplies: newStatus,
      });
      setAllowReplies(newStatus);
      toast({
        title: newStatus ? 'Replies enabled' : 'Replies disabled',
        description: newStatus ? 'Viewers can reply to this story' : 'Viewers cannot reply to this story',
      });
      onSettingsUpdate();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' });
    }
  };

  const handleToggleSharing = async () => {
    try {
      const newStatus = !allowSharing;
      await storyService.updateStorySettings(storyId, currentUserId, {
        allowSharing: newStatus,
      });
      setAllowSharing(newStatus);
      toast({
        title: newStatus ? 'Sharing enabled' : 'Sharing disabled',
        description: newStatus ? 'Viewers can share this story' : 'Viewers cannot share this story',
      });
      onSettingsUpdate();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-black/95 border border-white/10 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-white text-lg font-semibold">Story Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Toggle Controls */}
        <div className="px-4 py-3 border-b border-white/10 space-y-3">
          <button
            onClick={handleToggleReplies}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageCircleOff className="h-5 w-5 text-white" />
              <div className="text-left">
                <p className="text-white text-sm font-medium">Replies</p>
                <p className="text-white/50 text-xs">
                  {allowReplies ? 'Viewers can reply' : 'Replies disabled'}
                </p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${allowReplies ? 'bg-teal-500' : 'bg-white/20'}`}>
              <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${allowReplies ? 'ml-6' : 'ml-0.5'}`}></div>
            </div>
          </button>

          <button
            onClick={handleToggleSharing}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Share2 className="h-5 w-5 text-white" />
              <div className="text-left">
                <p className="text-white text-sm font-medium">Sharing</p>
                <p className="text-white/50 text-xs">
                  {allowSharing ? 'Viewers can share' : 'Sharing disabled'}
                </p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${allowSharing ? 'bg-teal-500' : 'bg-white/20'}`}>
              <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${allowSharing ? 'ml-6' : 'ml-0.5'}`}></div>
            </div>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('closeFriends')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'closeFriends' ? 'text-white' : 'text-white/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              Close Friends
            </div>
            {activeTab === 'closeFriends' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('hideFrom')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'hideFrom' ? 'text-white' : 'text-white/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserX className="h-4 w-4" />
              Hide From
            </div>
            {activeTab === 'hideFrom' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500"></div>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'closeFriends' ? (
            <div className="p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  value={searchQueryCloseFriends}
                  onChange={(e) => handleSearchCloseFriends(e.target.value)}
                  placeholder="Search users to add..."
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              {/* Search Results */}
              {searchQueryCloseFriends && searchResultsCloseFriends.length > 0 && (
                <div className="space-y-1">
                  <p className="text-white/50 text-xs px-2 mb-2">Search Results</p>
                  {searchResultsCloseFriends.map((user, idx) => (
                    <button
                      key={user?.userId || `search-cf-${idx}`}
                      onClick={() => handleAddCloseFriend(user.userId)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarURL} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                          {user.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-white text-sm font-medium truncate">{user.username}</p>
                        <p className="text-white/50 text-xs truncate">{user.displayName}</p>
                      </div>
                      <div className="text-teal-500 text-xs font-medium">Add</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Close Friends List */}
              {closeFriends.length > 0 && (
                <div className="space-y-1">
                  <p className="text-white/50 text-xs px-2 mb-2">
                    Close Friends ({closeFriends.length})
                  </p>
                  {closeFriends.map((friend, idx) => (
                    <div
                      key={friend?.userId || `friend-${idx}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={friend.avatarURL} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
                          {friend.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{friend.username}</p>
                        <p className="text-white/50 text-xs truncate">{friend.displayName}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveCloseFriend(friend.userId)}
                        className="px-3 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {closeFriends.length === 0 && !searchQueryCloseFriends && (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50 text-sm mb-2">No close friends yet</p>
                  <p className="text-white/30 text-xs">Search above to add close friends</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  value={searchQueryHideFrom}
                  onChange={(e) => handleSearchHideFrom(e.target.value)}
                  placeholder="Search users to hide from..."
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              {/* Search Results */}
              {searchQueryHideFrom && searchResultsHideFrom.length > 0 && (
                <div className="space-y-1">
                  <p className="text-white/50 text-xs px-2 mb-2">Search Results</p>
                  {searchResultsHideFrom.map((user, idx) => (
                    <button
                      key={user?.userId || `search-hide-${idx}`}
                      onClick={() => handleAddHiddenUser(user.userId)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarURL} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                          {user.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-white text-sm font-medium truncate">{user.username}</p>
                        <p className="text-white/50 text-xs truncate">{user.displayName}</p>
                      </div>
                      <div className="text-teal-500 text-xs font-medium">Hide</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Hidden Users List */}
              {hiddenUsers.length > 0 && (
                <div className="space-y-1">
                  <p className="text-white/50 text-xs px-2 mb-2">
                    Hidden From ({hiddenUsers.length})
                  </p>
                  {hiddenUsers.map((user, idx) => (
                    <div
                      key={user?.userId || `hidden-${idx}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarURL} />
                        <AvatarFallback className="bg-gradient-to-br from-gray-600 to-gray-700 text-white">
                          {user.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{user.username}</p>
                        <p className="text-white/50 text-xs truncate">{user.displayName}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveHiddenUser(user.userId)}
                        className="px-3 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {hiddenUsers.length === 0 && !searchQueryHideFrom && (
                <div className="text-center py-12">
                  <UserX className="h-16 w-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50 text-sm mb-2">No hidden users</p>
                  <p className="text-white/30 text-xs">Search above to hide your story from specific users</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
