import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { ChevronLeft, Search, VolumeX, Volume2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { settingsService } from "../../src/services/settings.service";
import { userService } from "../../src/services/user.service";
import type { User } from "../../src/types/database";

export default function MutedAccounts() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [mutedUsers, setMutedUsers] = useState<Array<User & { mutedAt: any; mutedUntil: any }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [unmutingUserId, setUnmutingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'muted' | 'search'>('muted');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [mutingUserId, setMutingUserId] = useState<string | null>(null);

  // Load muted users
  useEffect(() => {
    const loadMutedUsers = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const mutedList = await settingsService.getMutedUsers(currentUser.userId);
        
        // Fetch user details for each muted user
        const mutedDetails = await Promise.all(
          mutedList.map(async (muted) => {
            const user = await userService.getUser(muted.userId);
            return user ? { ...user, mutedAt: muted.mutedAt, mutedUntil: muted.mutedUntil } : null;
          })
        );
        
        setMutedUsers(mutedDetails.filter(u => u !== null) as any[]);
      } catch (error) {
        console.error('Failed to load muted users', error);
        toast({
          title: "Error",
          description: "Failed to load muted accounts",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadMutedUsers();
  }, [currentUser]);

  const handleUnmute = async (userId: string, username: string) => {
    if (!currentUser) return;

    try {
      setUnmutingUserId(userId);
      await settingsService.unmuteUser(currentUser.userId, userId);
      
      setMutedUsers(prev => prev.filter(user => user.userId !== userId));
      
      toast({
        title: "Account unmuted",
        description: `@${username} has been unmuted. You'll now see their posts and stories.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unmute account",
        variant: "destructive",
      });
    } finally {
      setUnmutingUserId(null);
    }
  };

  const handleMute = async (userId: string, username: string) => {
    if (!currentUser) return;
    
    try {
      setMutingUserId(userId);
      await settingsService.muteUser(currentUser.userId, userId);
      
      setSearchResults(prev => prev.filter(user => user.userId !== userId));
      
      toast({
        title: "Account muted",
        description: `@${username} has been muted. You won't see their posts or stories.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mute account",
        variant: "destructive",
      });
    } finally {
      setMutingUserId(null);
    }
  };

  const handleSearchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchingUsers(true);
      const results = await userService.searchUsers(query, 20);
      
      // Filter out current user and already muted users
      const mutedUserIds = mutedUsers.map(u => u.userId);
      const filtered = results.filter(
        user => user.userId !== currentUser?.userId && 
        !mutedUserIds.includes(user.userId)
      );
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Failed to search users', error);
      setSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'search') {
      const timer = setTimeout(() => {
        handleSearchUsers(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, activeTab, mutedUsers]);

  const getTimeSinceMuted = (mutedAt: any) => {
    if (!mutedAt) return 'Recently';
    const seconds = Math.floor((Date.now() - mutedAt.toDate().getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    const days = Math.floor(seconds / 86400);
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const filteredUsers = mutedUsers.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Muted Accounts</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search muted accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="mx-4 mb-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <VolumeX className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">About muting</p>
              <ul className="space-y-1">
                <li>• You won't see their posts in your feed</li>
                <li>• Their stories will be hidden</li>
                <li>• They won't know you muted them</li>
                <li>• You'll still get DMs from them</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'muted' ? (
          loading ? (
            <LoadingState text="Loading muted accounts..." />
          ) : filteredUsers.length > 0 ? (
          <div className="divide-y">
            {filteredUsers.map((user) => {
              const isUnmuting = unmutingUserId === user.userId;
              
              return (
                <div key={user.userId} className="px-4 py-3 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <Link to={`/profile/${user.username}`}>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatarURL} />
                        <AvatarFallback>{user.displayName?.[0] || user.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${user.username}`}>
                        <div className="font-semibold truncate hover:underline">{user.displayName}</div>
                      </Link>
                      <div className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Muted {getTimeSinceMuted(user.mutedAt)}
                      </div>
                      {user.mutedUntil && (
                        <div className="text-xs text-primary">
                          Auto-unmutes {new Date(user.mutedUntil).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <Button
                      variant={isUnmuting ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleUnmute(user.userId, user.username)}
                      disabled={isUnmuting}
                      className="min-w-[90px]"
                    >
                      {isUnmuting ? (
                        <>
                          <Volume2 className="h-4 w-4 mr-1" />
                          Unmuted
                        </>
                      ) : (
                        "Unmute"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <VolumeX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">
              {searchQuery ? "No results found" : "No muted accounts"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery
                ? "Try searching with a different name or username"
                : "When you mute someone, they'll appear here"}
            </p>
          </div>
        )
        ) : (
          // Search tab
          searchingUsers ? (
            <LoadingState text="Searching users..." />
          ) : searchResults.length > 0 ? (
            <div className="divide-y">
              {searchResults.map((user) => {
                const isMuting = mutingUserId === user.userId;
                
                return (
                  <div key={user.userId} className="px-4 py-3 hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <Link to={`/profile/${user.username}`}>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatarURL} />
                          <AvatarFallback>{user.displayName?.[0] || user.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${user.username}`}>
                          <div className="font-semibold truncate hover:underline">{user.displayName}</div>
                        </Link>
                        <div className="text-sm text-muted-foreground truncate">
                          @{user.username}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMute(user.userId, user.username)}
                        disabled={isMuting}
                        className="min-w-[90px]"
                      >
                        {isMuting ? (
                          <>
                            <VolumeX className="h-4 w-4 mr-1" />
                            Muting...
                          </>
                        ) : (
                          <>
                            <VolumeX className="h-4 w-4 mr-1" />
                            Mute
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <UserPlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">
                {searchQuery ? "No users found" : "Search for users"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchQuery
                  ? "Try searching with a different name or username"
                  : "Type a name or username to search for users to mute"}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
