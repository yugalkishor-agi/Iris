import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { userService } from "../../../src/services/user.service";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "../../../src/types/database";

interface UserMentionAutocompleteProps {
  searchQuery: string;
  onSelect: (user: User) => void;
  position: { top: number; left: number };
}

export function UserMentionAutocomplete({
  searchQuery,
  onSelect,
  position,
}: UserMentionAutocompleteProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { user: currentUser } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery || searchQuery.length < 2 || !currentUser) return;
      
      try {
        setLoading(true);
        // Search for users by username
        const results = await userService.searchUsers(searchQuery.toLowerCase(), 10);
        setUsers(results.filter(u => u.userId !== currentUser.userId));
        setSelectedIndex(0);
      } catch (error) {
        console.error("Failed to search users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 200);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (users.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % users.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
      } else if (e.key === "Enter" && users[selectedIndex]) {
        e.preventDefault();
        onSelect(users[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [users, selectedIndex, onSelect]);

  if (users.length === 0 && !loading) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-50 w-72 max-h-64 overflow-y-auto bg-popover border border-border rounded-lg shadow-xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {loading ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Searching...
        </div>
      ) : (
        <div className="py-1">
          {users.map((user, index) => (
            <button
              key={user.userId}
              onClick={() => onSelect(user)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors ${
                index === selectedIndex ? "bg-accent" : ""
              }`}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatarURL} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-bold text-sm">
                  {user.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="font-semibold text-sm truncate">
                  {user.username}
                </div>
                {user.displayName && (
                  <div className="text-xs text-muted-foreground truncate">
                    {user.displayName}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
