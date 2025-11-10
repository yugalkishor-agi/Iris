import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { useToast } from "@/hooks/use-toast";
import { useBlockedUsers } from "@/hooks/useSettings";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "../../src/services/user.service";
import type { User } from "../../src/types/database";
import { ChevronLeft, Search, Ban, Check, UserPlus } from "lucide-react";

export default function BlockedUsers() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { blockedUsers: blockedUserIds, loading, unblockUser } = useBlockedUsers();
  const [blockedUsers, setBlockedUsers] = useState<Array<User & { blockedAt: any }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'blocked' | 'search'>('blocked');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);

  // Load blocked user details
  useEffect(() => {
    const loadBlockedUsers = async () => {
      if (blockedUserIds.length === 0) {
        setBlockedUsers([]);
        return;
      }

      try {
        const userDetails = await Promise.all(
          blockedUserIds.map(async (blocked) => {
            const user = await userService.getUser(blocked.userId);
            return user ? { ...user, blockedAt: blocked.blockedAt } : null;
          })
        );
        
        setBlockedUsers(userDetails.filter(u => u !== null) as any[]);
      } catch (error) {
        console.error('Failed to load blocked user details', error);
      }
    };

    if (!loading) {
      loadBlockedUsers();
    }
  }, [blockedUserIds, loading]);

  const handleUnblock = async (userId: string, username: string) => {
    try {
      setUnblockingUserId(userId);
      await unblockUser(userId);
      
      setBlockedUsers(prev => prev.filter(user => user.userId !== userId));
      
      toast({
        title: "User unblocked",
        description: `@${username} has been unblocked. They can now see your content.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unblock user",
        variant: "destructive",
      });
    } finally {
      setUnblockingUserId(null);
    }
  };

  const handleBlock = async (userId: string, username: string) => {
    if (!currentUser) return;
    
    try {
      setBlockingUserId(userId);
      await userService.blockUser(currentUser.userId, userId);
      
      setSearchResults(prev => prev.filter(user => user.userId !== userId));
      
      toast({
        title: "User blocked",
        description: `@${username} has been blocked. They can't see your content anymore.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to block user",
        variant: "destructive",
      });
    } finally {
      setBlockingUserId(null);
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
      
      // Filter out current user and already blocked users
      const filtered = results.filter(
        user => user.userId !== currentUser?.userId && 
        !blockedUserIds.some(b => b.userId === user.userId)
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
  }, [searchQuery, activeTab]);

  const getTimeSinceBlocked = (blockedAt: any) => {
    if (!blockedAt) return 'Recently';
    const seconds = Math.floor((Date.now() - blockedAt.toDate().getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    const days = Math.floor(seconds / 86400);
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const filteredUsers = blockedUsers.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings/privacy" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Blocked Accounts</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => {
              setActiveTab('blocked');
              setSearchQuery('');
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'blocked'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Blocked ({blockedUsers.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('search');
              setSearchQuery('');
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Block New User
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'blocked' ? "Search blocked accounts..." : "Search users to block..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="mx-4 mb-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Ban className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">About blocking</p>
              <ul className="space-y-1">
                <li>• Blocked users can't see your profile, posts, or stories</li>
                <li>• They won't be notified that you blocked them</li>
                <li>• You can unblock them anytime</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'blocked' ? (
          loading ? (
            <LoadingState text="Loading blocked accounts..." />
          ) : filteredUsers.length > 0 ? (
          <div className="divide-y">
            {filteredUsers.map((user) => {
              const isUnblocking = unblockingUserId === user.userId;
              
              return (
                <div key={user.userId} className="px-4 py-3 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatarURL} />
                      <AvatarFallback>{user.displayName?.[0] || user.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{user.displayName}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Blocked {getTimeSinceBlocked(user.blockedAt)}
                      </div>
                    </div>
                    <Button
                      variant={isUnblocking ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleUnblock(user.userId, user.username)}
                      disabled={isUnblocking}
                      className="min-w-[90px]"
                    >
                      {isUnblocking ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Unblocked
                        </>
                      ) : (
                        "Unblock"
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
              <Ban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">
              {searchQuery ? "No results found" : "No blocked accounts"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery
                ? "Try searching with a different name or username"
                : "When you block someone, they'll appear here"}
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
                const isBlocking = blockingUserId === user.userId;
                
                return (
                  <div key={user.userId} className="px-4 py-3 hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatarURL} />
                        <AvatarFallback>{user.displayName?.[0] || user.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{user.displayName}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          @{user.username}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBlock(user.userId, user.username)}
                        disabled={isBlocking}
                        className="min-w-[90px]"
                      >
                        {isBlocking ? (
                          <>
                            <Ban className="h-4 w-4 mr-1" />
                            Blocking...
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-1" />
                            Block
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
                  : "Type a name or username to search for users to block"}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
