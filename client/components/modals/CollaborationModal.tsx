import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Search, Loader2 } from "lucide-react";
import { searchService } from "../../../src/services/search.service";

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCollaborators: Array<{ userId: string; username: string }>;
  onAddCollaborator: (user: { userId: string; username: string }) => void;
  onRemoveCollaborator: (userId: string) => void;
}

export default function CollaborationModal({
  isOpen,
  onClose,
  selectedCollaborators,
  onAddCollaborator,
  onRemoveCollaborator,
}: CollaborationModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await searchService.searchUsers(searchQuery, 10);
      setSearchResults(results);
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
      <div className="h-full flex flex-col max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Add Collaborators</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Selected Collaborators */}
        {selectedCollaborators.length > 0 && (
          <div className="p-4 border-b border-white/10">
            <p className="text-sm text-gray-400 mb-3">Selected ({selectedCollaborators.length})</p>
            <div className="flex flex-wrap gap-2">
              {selectedCollaborators.map((collab) => (
                <div
                  key={collab.userId}
                  className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full"
                >
                  <span className="text-white text-sm">{collab.username}</span>
                  <button
                    onClick={() => onRemoveCollaborator(collab.userId)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y divide-white/10">
              {searchResults.map((user) => {
                const isSelected = selectedCollaborators.some(
                  (c) => c.userId === user.userId
                );
                return (
                  <div
                    key={user.userId}
                    className="p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatarURL} />
                          <AvatarFallback>
                            {user.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">{user.username}</p>
                          {user.fullName && (
                            <p className="text-sm text-gray-400">{user.fullName}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          isSelected
                            ? onRemoveCollaborator(user.userId)
                            : onAddCollaborator({
                                userId: user.userId,
                                username: user.username,
                              })
                        }
                        size="sm"
                        variant={isSelected ? "outline" : "default"}
                        className={
                          isSelected
                            ? "border-white/20 text-white hover:bg-white/10"
                            : ""
                        }
                      >
                        {isSelected ? "Remove" : "Add"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <p className="text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Search className="h-12 w-12 text-gray-600 mb-4" />
              <p className="text-gray-400">Search for users to collaborate</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
