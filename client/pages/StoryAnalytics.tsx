import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Eye, Users, TrendingUp, Share2, Heart, MessageCircle, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { storyService } from "../../src/services/story.service";
import { userService } from "../../src/services/user.service";
import { useAuth } from "@/contexts/AuthContext";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import type { User } from "../../src/types/database";

export default function StoryAnalytics() {
  const { storyId } = useParams();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewers, setViewers] = useState<User[]>([]);
  const [viewerIds, setViewerIds] = useState<string[]>([]);

  // Load story data
  useEffect(() => {
    const loadStoryData = async () => {
      if (!storyId) return;
      
      try {
        setLoading(true);
        const storyData = await storyService.getStory(storyId);
        setStory(storyData);
        
        // Load viewers
        const viewerIdsList = await storyService.getStoryViews(storyId);
        setViewerIds(viewerIdsList);
        
        // Fetch full user data for viewers
        const viewersData = await Promise.all(
          viewerIdsList.map(async (userId) => {
            try {
              return await userService.getUser(userId);
            } catch (err) {
              console.error('Failed to fetch viewer:', userId);
              return null;
            }
          })
        );
        setViewers(viewersData.filter((v): v is User => v !== null));
      } catch (error) {
        console.error('Failed to load story analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoryData();
  }, [storyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Story not found</p>
          <Link to="/" className="text-primary hover:underline mt-2">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  const stats = {
    views: story.viewsCount || 0,
    reach: viewerIds.length,
    interactions: (story.likesCount || 0) + (story.repliesCount || 0),
    shares: story.sharesCount || 0,
    replies: story.repliesCount || 0,
    likes: story.likesCount || 0,
    profileVisits: 0,
  };

  const engagementRate = stats.views > 0 ? ((stats.interactions / stats.views) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to="/me" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold">Story Insights</h1>
          </div>
          <Button variant="ghost" size="sm">
            Export
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Story Preview */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-16 h-28 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg" />
            <div>
              <div className="text-sm text-muted-foreground">Posted 2 hours ago</div>
              <div className="text-xs text-muted-foreground mt-1">Active for 22 hours</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 p-4 border-b">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm">Views</span>
            </div>
            <div className="text-3xl font-bold">{stats.views.toLocaleString()}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">Reach</span>
            </div>
            <div className="text-3xl font-bold">{stats.reach.toLocaleString()}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Engagement</span>
            </div>
            <div className="text-3xl font-bold">{engagementRate}%</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Share2 className="h-4 w-4" />
              <span className="text-sm">Shares</span>
            </div>
            <div className="text-3xl font-bold">{stats.shares}</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="viewers">Viewers</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4 space-y-6">
            {/* Interactions Breakdown */}
            <div>
              <h3 className="font-semibold mb-3">Interactions</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span>Likes</span>
                  </div>
                  <span className="font-semibold">{stats.interactions}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <span>Replies</span>
                  </div>
                  <span className="font-semibold">{stats.replies}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Share2 className="h-5 w-5 text-primary" />
                    <span>Shares</span>
                  </div>
                  <span className="font-semibold">{stats.shares}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Profile Visits</span>
                  </div>
                  <span className="font-semibold">{stats.profileVisits}</span>
                </div>
              </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div>
              <h3 className="font-semibold mb-3">Views Over Time</h3>
              <div className="h-48 bg-muted/50 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Chart visualization</p>
                  <p className="text-xs">(requires backend integration)</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Viewers Tab */}
          <TabsContent value="viewers" className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{viewers.length} Viewers</h3>
                <Button variant="outline" size="sm">
                  Sort by
                </Button>
              </div>

              {viewers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No viewers yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {viewers.map((viewer) => (
                    <Link
                      key={viewer.userId}
                      to={`/profile/${viewer.username}`}
                      className="py-3 flex items-center gap-3 hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={viewer.avatarURL} />
                        <AvatarFallback>{viewer.displayName?.[0] || viewer.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-sm truncate">{viewer.displayName}</span>
                          {viewer.verified && <VerifiedBadge size="sm" />}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          @{viewer.username}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
