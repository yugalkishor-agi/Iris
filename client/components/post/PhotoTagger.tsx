import { useState } from "react";
import { X, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { userService } from "../../../src/services/user.service";
import type { User } from "../../../src/types/database";

interface TagPosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  userId: string;
  username: string;
}

interface PhotoTaggerProps {
  imageUrl: string;
  existingTags?: Array<{ userId: string; username: string; x: number; y: number }>;
  onTagsChange: (tags: Array<{ userId: string; username: string; x: number; y: number }>) => void;
  onClose?: () => void;
  isEditable?: boolean;
}

export function PhotoTagger({ imageUrl, existingTags = [], onTagsChange, onClose, isEditable = true }: PhotoTaggerProps) {
  const [tags, setTags] = useState<TagPosition[]>(existingTags);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditable) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingPosition({ x, y });
    setShowSearch(true);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await userService.searchUsers(query, 10);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: User) => {
    if (!pendingPosition) return;

    const newTag: TagPosition = {
      x: pendingPosition.x,
      y: pendingPosition.y,
      userId: user.userId,
      username: user.username,
    };

    const updatedTags = [...tags, newTag];
    setTags(updatedTags);
    onTagsChange(updatedTags);

    // Reset
    setShowSearch(false);
    setPendingPosition(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveTag = (index: number) => {
    const updatedTags = tags.filter((_, i) => i !== index);
    setTags(updatedTags);
    onTagsChange(updatedTags);
  };

  return (
    <div className="relative w-full h-full">
      {/* Image with tags */}
      <div
        className="relative w-full h-full cursor-crosshair overflow-hidden"
        onClick={handleImageClick}
      >
        <img
          src={imageUrl}
          alt="Tagged"
          className="w-full h-full object-contain"
          draggable={false}
        />

        {/* Tag indicators */}
        {tags.map((tag, index) => (
          <div
            key={index}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
          >
            {/* White circle indicator */}
            <div className="h-8 w-8 rounded-full bg-white border-2 border-white shadow-lg flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-primary" />
            </div>

            {/* Username popup */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap pointer-events-none">
              @{tag.username}
            </div>

            {/* Remove button (only when editable) */}
            {isEditable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(index);
                }}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {/* Pending tag indicator */}
        {pendingPosition && showSearch && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 animate-pulse"
            style={{ left: `${pendingPosition.x}%`, top: `${pendingPosition.y}%` }}
          >
            <div className="h-8 w-8 rounded-full bg-white border-2 border-primary shadow-lg flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-primary" />
            </div>
          </div>
        )}
      </div>

      {/* User search modal */}
      {showSearch && (
        <div className="absolute inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowSearch(false)}>
          <div
            className="bg-background rounded-t-3xl w-full max-w-md p-4 space-y-4 max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Tag People</h3>
              <Button size="icon" variant="ghost" onClick={() => setShowSearch(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {/* Search results */}
            <div className="space-y-2">
              {isSearching ? (
                <div className="text-center py-4 text-muted-foreground">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <button
                    key={user.userId}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarURL} />
                      <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="font-medium">@{user.username}</div>
                      <div className="text-sm text-muted-foreground">{user.displayName}</div>
                    </div>
                  </button>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-4 text-muted-foreground">No users found</div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">Type to search users</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Close button */}
      {onClose && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
