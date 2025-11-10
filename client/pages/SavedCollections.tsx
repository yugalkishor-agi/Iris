import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { useCollections } from "@/hooks/useCollection";
import {
  ChevronLeft,
  Plus,
  MoreVertical,
  Lock,
  Globe,
  Trash2,
  Edit,
  FolderOpen,
} from "lucide-react";

export default function SavedCollections() {
  const { toast } = useToast();
  const { collections, loading, error, createCollection, deleteCollection, updateCollection } = useCollections();
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a collection name",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreatingCollection(true);
      await createCollection(newCollectionName.trim(), isPrivate);
      setNewCollectionName("");
      setShowNewCollection(false);
      setIsPrivate(false);
      toast({
        title: "Collection created",
        description: `"${newCollectionName}" has been created`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create collection",
        variant: "destructive",
      });
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleDeleteCollection = async (collectionId: string, name: string) => {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      try {
        await deleteCollection(collectionId);
        toast({
          title: "Collection deleted",
          description: `"${name}" has been deleted`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete collection",
          variant: "destructive",
        });
      }
    }
  };

  const totalPosts = collections.reduce((sum, col) => sum + col.postsCount, 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to="/me" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold">Saved Collections</h1>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowNewCollection(!showNewCollection)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {loading && <LoadingState text="Loading collections..." />}
        
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}
        
        {!loading && !error && (
          <>
        {/* New Collection Form */}
        {showNewCollection && (
          <div className="border rounded-lg p-4 space-y-4 animate-slide-down">
            <h2 className="font-semibold">New Collection</h2>
            <Input
              placeholder="Collection name..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="w-full"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrivate(!isPrivate)}
                  className="flex items-center gap-2 text-sm"
                >
                  {isPrivate ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>{isPrivate ? "Private" : "Public"}</span>
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNewCollection(false);
                    setNewCollectionName("");
                    setIsPrivate(false);
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreateCollection} disabled={creatingCollection}>
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* All Saved Posts */}
        <Link
          to="/saved/all"
          className="block border rounded-lg p-4 hover:bg-accent transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">All Saved Posts</h3>
              <p className="text-sm text-muted-foreground">
                {totalPosts} posts
              </p>
            </div>
            <ChevronLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
          </div>
        </Link>

        {/* Collections Grid */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground">
            MY COLLECTIONS ({collections.length})
          </h2>
          {collections.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {collections.map((collection) => (
                <div
                  key={collection.collectionId}
                  className="group relative border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link to={`/saved/collection/${collection.collectionId}`}>
                  {/* Cover Image or Placeholder */}
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {collection.coverImageURL ? (
                      <img
                        src={collection.coverImageURL}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-6xl text-muted-foreground">📁</div>
                    )}
                  </div>

                  {/* Collection Info */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {collection.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {collection.postsCount} posts
                        </p>
                      </div>
                      {collection.isPrivate && (
                        <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </Link>

                  {/* Options Menu */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteCollection(collection.collectionId, collection.name);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="No collections yet"
              description="Create a collection to organize your saved posts"
            />
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
