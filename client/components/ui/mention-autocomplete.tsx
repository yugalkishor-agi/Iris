import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { searchService } from "../../../src/services/search.service";

interface User {
  userId: string;
  username: string;
  displayName?: string;
  avatarURL?: string;
}

interface MentionAutocompleteProps {
  searchQuery: string;
  onSelect: (username: string) => void;
  position: { top: number; left: number };
}

export function MentionAutocomplete({ searchQuery, onSelect, position }: MentionAutocompleteProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length === 0) {
        setUsers([]);
        return;
      }

      try {
        const results = await searchService.searchUsers(searchQuery, 10);
        setUsers(results);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Failed to search users:", error);
        setUsers([]);
      }
    };

    const debounce = setTimeout(searchUsers, 200);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelect = (username: string) => {
    onSelect(username);
  };

  if (users.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute z-50 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl max-h-80 overflow-hidden w-80 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/50 bg-muted/30">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Suggestions</p>
      </div>
      
      {/* User List */}
      <div className="overflow-y-auto max-h-72 custom-scrollbar">
        {users.map((user, index) => (
          <button
            key={user.userId}
            onClick={() => handleSelect(user.username)}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 group ${
              index === selectedIndex 
                ? 'bg-primary/10 border-l-4 border-primary' 
                : 'hover:bg-muted/50 border-l-4 border-transparent'
            }`}
          >
            <Avatar className="h-10 w-10 ring-2 ring-border group-hover:ring-primary/50 transition-all">
              <AvatarImage src={user.avatarURL} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {user.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                @{user.username}
              </p>
              {user.displayName && (
                <p className="text-xs text-muted-foreground truncate">
                  {user.displayName}
                </p>
              )}
            </div>
            
            {/* Arrow indicator for selected */}
            {index === selectedIndex && (
              <div className="text-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-border/50 bg-muted/20">
        <p className="text-[10px] text-muted-foreground text-center">
          Press Enter to select • Esc to cancel
        </p>
      </div>
    </div>
  );
}
