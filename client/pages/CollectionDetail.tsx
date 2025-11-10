import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, MoreVertical, Trash2, Grid3x3, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCollectionPosts } from "@/hooks/useCollection";
import { collectionService } from "../../src/services/collection.service";
import type { Post } from "../../src/types/database";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Collection {
  collectionId: string;
  name: string;
  postsCount: number;
  isPrivate: boolean;
  coverImageURL?: string;
  createdAt: any;
  updatedAt: any;
}

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { posts, loading } = useCollectionPosts(id || '');
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loadingCollection, setLoadingCollection] = useState(true);
  const [removingPostId, setRemovingPostId] = useState<string | null>(null);

  // Load collection details
  useEffect(() => {
    const loadCollection = async () => {
      if (!currentUser || !id) return;

      try {
        setLoadingCollection(true);
        const collections = await collectionService.getUserCollections(currentUser.userId);
        const found = collections.find(c => c.collectionId === id);
        setCollection(found || null);
      } catch (error) {
        console.error('Failed to load collection', error);
        toast({
          title: "Error",
          description: "Failed to load collection",
          variant: "destructive",
        });
      } finally {
        setLoadingCollection(false);
      }
    };

    loadCollection();
  }, [currentUser, id]);

  const handleRemovePost = async (postId: string) => {
    if (!currentUser || !id) return;

    try {
      setRemovingPostId(postId);
      await collectionService.unsavePost(currentUser.userId, postId, id);
      
      toast({
        title: "Post removed",
        description: "Post removed from collection",
      });
      
      // Reload posts
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove post",
        variant: "destructive",
      });
    } finally {
      setRemovingPostId(null);
    }
  };

  const handleDeleteCollection = async () => {
    if (!currentUser || !id || !collection) return;
    
    if (!confirm(`Delete "${collection.name}"? This cannot be undone.`)) return;

    try {
      await collectionService.deleteCollection(currentUser.userId, id);
      
      toast({
        title: "Collection deleted",
        description: `"${collection.name}" has been deleted`,
      });
      
      navigate('/saved');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete collection",
        variant: "destructive",
      });
    }
  };

  if (loadingCollection) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-3 p-4">
            <Link to="/saved" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold">Loading...</h1>
          </div>
        </div>
        <LoadingState text="Loading collection..." />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-3 p-4">
            <Link to="/saved" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold">Not Found</h1>
          </div>
        </div>
        <EmptyState
          icon={Grid3x3}
          title="Collection not found"
          description="This collection may have been deleted"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to="/saved" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{collection.name}</h1>
                {collection.isPrivate && <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground">{collection.postsCount} posts</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDeleteCollection}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {loading ? (
          <LoadingState text="Loading posts..." />
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <div key={post.postId} className="relative group">
                <Link
                  to={`/post/${post.postId}`}
                  className="aspect-square bg-muted rounded overflow-hidden block"
                >
                  <img
                    src={post.mediaURLs?.[0] || '/placeholder.svg'}
                    alt="Post"
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                  />
                </Link>
                {/* Remove button on hover */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemovePost(post.postId);
                  }}
                  disabled={removingPostId === post.postId}
                  className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Grid3x3}
            title="No posts yet"
            description="Posts you save to this collection will appear here"
          />
        )}
      </div>
    </div>
  );
}
