import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import {
  Star,
  Search,
  UserPlus,
  Users,
  Info,
  Sparkles,
  UserCheck,
  UserMinus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCloseFriends } from "@/hooks/useSettings";
import { userService } from "../../src/services/user.service";
import type { User } from "../../src/types/database";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function CloseFriends() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { closeFriends, loading, addCloseFriend, removeCloseFriend } = useCloseFriends();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(true);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [showOnlyCloseFriends, setShowOnlyCloseFriends] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("search");

  // Load following and followers lists
  useEffect(() => {
    const loadLists = async () => {
      if (!currentUser) return;

      try {
        // Load following
        setLoadingFollowing(true);
        const followingIds = await userService.getFollowing(currentUser.userId);
        const followingDetails = await Promise.all(
          followingIds.map(id => userService.getUser(id))
        );
        setFollowing(followingDetails.filter(u => u !== null) as User[]);
      } catch (error) {
        console.error('Failed to load following', error);
      } finally {
        setLoadingFollowing(false);
      }

      try {
        // Load followers
        setLoadingFollowers(true);
        const followerIds = await userService.getFollowers(currentUser.userId);
        const followerDetails = await Promise.all(
          followerIds.map(id => userService.getUser(id))
        );
        setFollowers(followerDetails.filter(u => u !== null) as User[]);
      } catch (error) {
        console.error('Failed to load followers', error);
      } finally {
        setLoadingFollowers(false);
      }
    };

    loadLists();
  }, [currentUser]);

  // Search for users
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const results = await userService.searchUsers(query, 20);
      const filtered = results.filter(u => u.userId !== currentUser?.userId);
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Search failed",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const toggleCloseFriend = async (userId: string, username: string) => {
    if (!currentUser || togglingUserId) return;

    try {
      setTogglingUserId(userId);
      const isCurrentlyCloseFriend = closeFriends.includes(userId);

      if (isCurrentlyCloseFriend) {
        await removeCloseFriend(userId);
        toast({
          title: "Removed from Close Friends",
          description: `@${username} will no longer see your close friends stories`,
        });
      } else {
        await addCloseFriend(userId);
        toast({
          title: "Added to Close Friends",
          description: `@${username} can now see your close friends stories`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update close friends",
        variant: "destructive",
      });
    } finally {
      setTogglingUserId(null);
    }
  };

  const currentList = activeTab === "following" ? following : followers;
  
  const filteredFriends = currentList.filter((friend) => {
    const matchesSearch =
      friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase());
    const isCloseFriend = closeFriends.includes(friend.userId);
    const matchesFilter = showOnlyCloseFriends ? isCloseFriend : true;
    return matchesSearch && matchesFilter;
  });

  const closeFriendsCount = closeFriends.length;

  if (loading || loadingFollowing || loadingFollowers) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <PageHeader title="Close Friends" subtitle="Loading..." gradient />
        <LoadingState text="Loading close friends..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader
        title="Close Friends"
        subtitle={`${closeFriendsCount} ${closeFriendsCount === 1 ? 'person' : 'people'}`}
        gradient
      />

      {/* Info Banner */}
      <div className="p-4">
        <Alert className="border-green-500/20 bg-green-500/5">
          <Sparkles className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700 dark:text-green-400">
            Share with Close Friends
          </AlertTitle>
          <AlertDescription className="text-green-600/90 dark:text-green-500/80">
            Stories shared with close friends have a green ring and are only visible to
            people on this list.
          </AlertDescription>
        </Alert>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="following" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Following
          </TabsTrigger>
          <TabsTrigger value="followers" className="gap-2">
            <Users className="h-4 w-4" />
            Followers
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search Tab Content */}
      {activeTab === "search" && (
        <div className="px-4 pb-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users to add or remove..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-muted/50"
            />
          </div>

          {/* Search Results */}
          <div className="flex-1">
            {searching ? (
              <LoadingState text="Searching..." />
            ) : searchQuery.trim().length < 2 ? (
              <EmptyState
                icon={Search}
                title="Search for users"
                description="Type at least 2 characters to search"
                variant="minimal"
              />
            ) : searchResults.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No users found"
                description="Try searching with a different name"
                variant="minimal"
              />
            ) : (
              <div className="divide-y">
                {searchResults.map((user) => {
                  const isCloseFriend = closeFriends.includes(user.userId);
                  const isToggling = togglingUserId === user.userId;

                  return (
                    <div
                      key={user.userId}
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <Link to={`/profile/${user.username}`} className="relative">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={user.avatarURL} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10">
                            {user.displayName?.[0] || user.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {isCloseFriend && (
                          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-background">
                            <Star className="h-3 w-3 text-white" fill="white" />
                          </div>
                        )}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link to={`/profile/${user.username}`}>
                            <p className="font-semibold hover:underline flex items-center gap-1">
                              <span className="truncate">{user.displayName}</span>
                              {user.verified && <VerifiedBadge size="sm" />}
                            </p>
                          </Link>
                          {isCloseFriend && (
                            <Badge
                              variant="outline"
                              className="border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400 text-xs flex-shrink-0"
                            >
                              Close Friend
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                      </div>

                      <Button
                        variant={isCloseFriend ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCloseFriend(user.userId, user.username)}
                        disabled={isToggling}
                        className={
                          isCloseFriend
                            ? "bg-green-600 hover:bg-green-700 border-green-600"
                            : ""
                        }
                      >
                        {isToggling ? (
                          "..."
                        ) : isCloseFriend ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-1" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Following/Followers Filter */}
      {(activeTab === "following" || activeTab === "followers") && (
        <div className="px-4 pb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter list..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Show only close friends</span>
            </div>
            <Switch
              checked={showOnlyCloseFriends}
              onCheckedChange={setShowOnlyCloseFriends}
            />
          </div>
        </div>
      )}

      {/* Friends List */}
      {(activeTab === "following" || activeTab === "followers") && (
        <div className="flex-1 pb-20">
        {currentList.length === 0 ? (
          <EmptyState
            icon={Users}
            title={activeTab === "following" ? "Not following anyone" : "No followers yet"}
            description={activeTab === "following" 
              ? "Follow people to add them to your close friends list"
              : "When people follow you, they'll appear here"}
            variant="colorful"
          />
        ) : filteredFriends.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No results found"
            description="Try searching with a different name"
            variant="minimal"
          />
        ) : (
          <div className="divide-y">
            {filteredFriends.map((friend) => {
              const isCloseFriend = closeFriends.includes(friend.userId);
              const isToggling = togglingUserId === friend.userId;
              
              return (
                <div
                  key={friend.userId}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <Link to={`/profile/${friend.username}`} className="relative">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={friend.avatarURL} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10">
                        {friend.displayName?.[0] || friend.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {isCloseFriend && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-background">
                        <Star className="h-3 w-3 text-white" fill="white" />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${friend.username}`}>
                        <p className="font-semibold hover:underline flex items-center gap-1">
                          <span className="truncate">{friend.displayName}</span>
                          {friend.verified && <VerifiedBadge size="sm" />}
                        </p>
                      </Link>
                      {isCloseFriend && (
                        <Badge
                          variant="outline"
                          className="border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400 text-xs flex-shrink-0"
                        >
                          Close Friend
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <span className="truncate">@{friend.username}</span>
                      {friend.verified && <VerifiedBadge size="sm" />}
                    </p>
                  </div>

                  <Button
                    variant={isCloseFriend ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCloseFriend(friend.userId, friend.username)}
                    disabled={isToggling}
                    className={
                      isCloseFriend
                        ? "bg-green-600 hover:bg-green-700 border-green-600"
                        : ""
                    }
                  >
                    {isToggling ? (
                      "..."
                    ) : isCloseFriend ? (
                      <>
                        <Star className="h-4 w-4 mr-1" fill="currentColor" />
                        Added
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        </div>
      )}

      {/* Stats Footer */}
      {closeFriendsCount > 0 && (
        <div className="sticky bottom-0 p-4 border-t bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-lime-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500/20 rounded-full">
                <Star className="h-4 w-4 text-green-600 dark:text-green-400" fill="currentColor" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {closeFriendsCount} Close {closeFriendsCount === 1 ? 'Friend' : 'Friends'}
                </p>
                <p className="text-xs text-green-600/80 dark:text-green-500/80">
                  Can see your exclusive stories
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
