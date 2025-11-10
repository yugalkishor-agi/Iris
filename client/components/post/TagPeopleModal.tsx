import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X } from "lucide-react";
import { searchService } from "../../../src/services/search.service";

interface TaggedUser {
  userId: string;
  username: string;
  avatarURL?: string;
  x: number; // Position on image (0-100%)
  y: number; // Position on image (0-100%)
}

interface TagPeopleModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (tags: TaggedUser[]) => void;
  existingTags?: TaggedUser[];
}

export function TagPeopleModal({ isOpen, onClose, imageUrl, onSave, existingTags = [] }: TagPeopleModalProps) {
  const [tags, setTags] = useState<TaggedUser[]>(existingTags);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<{ x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setSelectedPosition({ x, y });
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length === 0) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchService.searchUsers(query, 5);
      setSearchResults(results);
    } catch (error) {
      console.error("Failed to search users:", error);
    }
  };

  const handleSelectUser = (user: any) => {
    if (!selectedPosition) return;

    // Check if user already tagged
    if (tags.some(tag => tag.userId === user.userId)) {
      return;
    }

    const newTag: TaggedUser = {
      userId: user.userId,
      username: user.username,
      avatarURL: user.avatarURL,
      x: selectedPosition.x,
      y: selectedPosition.y,
    };

    setTags([...tags, newTag]);
    setSelectedPosition(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveTag = (userId: string) => {
    setTags(tags.filter(tag => tag.userId !== userId));
  };

  const handleSave = () => {
    onSave(tags);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tag People</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image with tags */}
          <div
            ref={imageRef}
            className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden cursor-crosshair"
            onClick={handleImageClick}
          >
            <img
              src={imageUrl}
              alt="Post"
              className="w-full h-full object-cover"
            />
            
            {/* Tag markers */}
            {tags.map((tag) => (
              <div
                key={tag.userId}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
              >
                <div className="bg-background/90 backdrop-blur-sm border-2 border-primary rounded-full px-3 py-1 text-sm font-medium flex items-center gap-2 shadow-lg">
                  <span>{tag.username}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTag(tag.userId);
                    }}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}

            {/* Selected position indicator */}
            {selectedPosition && (
              <div
                className="absolute w-3 h-3 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                style={{ left: `${selectedPosition.x}%`, top: `${selectedPosition.y}%` }}
              />
            )}
          </div>

          {/* Instructions */}
          <p className="text-sm text-muted-foreground">
            {selectedPosition
              ? "Search for a user to tag at this position"
              : "Click on the image where you want to tag someone"}
          </p>

          {/* Search bar (only show when position selected) */}
          {selectedPosition && (
            <div className="space-y-2">
              <Input
                placeholder="Search for people..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.userId}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors"
                      disabled={tags.some(tag => tag.userId === user.userId)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarURL} />
                        <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{user.username}</p>
                        {user.displayName && (
                          <p className="text-xs text-muted-foreground">{user.displayName}</p>
                        )}
                      </div>
                      {tags.some(tag => tag.userId === user.userId) && (
                        <span className="text-xs text-muted-foreground">Already tagged</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tagged users list */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Tagged ({tags.length})</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag.userId}
                    className="flex items-center gap-2 bg-accent rounded-full pl-1 pr-3 py-1"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={tag.avatarURL} />
                      <AvatarFallback>{tag.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{tag.username}</span>
                    <button
                      onClick={() => handleRemoveTag(tag.userId)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Tags ({tags.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
