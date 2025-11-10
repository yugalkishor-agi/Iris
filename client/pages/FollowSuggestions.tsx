import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, X } from "lucide-react";
import { VerifiedBadge } from "@/components/ui/verified-badge";

interface User {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  verified: boolean;
  followers: string;
  mutualFollowers: number;
  bio: string;
}

const suggestedUsers: User[] = [
  {
    id: 1,
    name: "Creative Minds",
    username: "creativeminds",
    verified: true,
    followers: "125K",
    mutualFollowers: 12,
    bio: "Digital artist & designer | Creating magic ✨",
  },
  {
    id: 2,
    name: "Tech Guru",
    username: "techguru",
    verified: true,
    followers: "89K",
    mutualFollowers: 8,
    bio: "Tech reviews & tutorials 🎮💻",
  },
  {
    id: 3,
    name: "Foodie Delights",
    username: "foodiedelights",
    verified: false,
    followers: "45K",
    mutualFollowers: 5,
    bio: "Food blogger | Recipe creator 🍕🍰",
  },
  {
    id: 4,
    name: "Fitness Pro",
    username: "fitnesspro",
    verified: true,
    followers: "210K",
    mutualFollowers: 15,
    bio: "Personal trainer | Wellness coach 💪",
  },
  {
    id: 5,
    name: "Travel Tales",
    username: "traveltales",
    verified: false,
    followers: "67K",
    mutualFollowers: 9,
    bio: "World explorer 🌍 | Adventure seeker",
  },
];

export default function FollowSuggestions() {
  const [following, setFollowing] = useState<Record<number, boolean>>({});
  const [dismissed, setDismissed] = useState<Record<number, boolean>>({});

  const handleFollow = (id: number) => {
    setFollowing({ ...following, [id]: !following[id] });
  };

  const handleDismiss = (id: number) => {
    setDismissed({ ...dismissed, [id]: true });
  };

  const visibleUsers = suggestedUsers.filter((user) => !dismissed[user.id]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Suggested For You</h1>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto">
        {visibleUsers.length > 0 ? (
          <div className="p-4 space-y-4">
            {visibleUsers.map((user) => (
              <div key={user.id} className="flex items-start gap-3 p-4 border rounded-lg">
                <Link to={`/profile/${user.username}`}>
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${user.username}`} className="block">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-sm truncate">{user.name}</span>
                      {user.verified && <VerifiedBadge size="sm" />}
                    </div>
                    <div className="text-xs text-muted-foreground">@{user.username}</div>
                  </Link>

                  <div className="mt-1 text-xs text-muted-foreground">
                    {user.followers} followers • {user.mutualFollowers} mutual
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{user.bio}</p>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <Button
                    size="sm"
                    variant={following[user.id] ? "outline" : "default"}
                    onClick={() => handleFollow(user.id)}
                    className="min-w-[80px]"
                  >
                    {following[user.id] ? "Following" : "Follow"}
                  </Button>
                  <button
                    onClick={() => handleDismiss(user.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground">No more suggestions</div>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
