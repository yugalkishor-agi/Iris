import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { OverlappingAvatars } from "@/components/ui/overlapping-avatars";
import { RefreshCw, Loader2 } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { useFollowActions } from "@/hooks/useUser";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, MessageCircle, UserPlus, AtSign, Clapperboard, Bell, MoreVertical, Film, Users, Check, X } from "lucide-react";
import type { NotificationType } from "../../src/types/database";

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case "like":
      return <Heart className="h-4 w-4 text-red-500" fill="currentColor" />;
    case "comment":
      return <MessageCircle className="h-4 w-4 text-blue-500" />;
    case "follow":
      return <UserPlus className="h-4 w-4 text-green-500" />;
    case "follow_request":
      return <UserPlus className="h-4 w-4 text-amber-500" />;
    case "mention":
      return <AtSign className="h-4 w-4 text-purple-500" />;
    case "dm":
      return <MessageCircle className="h-4 w-4 text-blue-500" />;
    case "story_view":
      return <Film className="h-4 w-4 text-primary" />;
    case "story_reply":
      return <MessageCircle className="h-4 w-4 text-primary" />;
    case "story_like":
      return <Heart className="h-4 w-4 text-red-500" fill="currentColor" />;
    case "collaboration_request":
      return <Users className="h-4 w-4 text-cyan-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

function NotificationItem({ notification }: { notification: any }) {
  const navigate = useNavigate();
  const { followUser } = useFollowActions();
  const { markAsRead } = useNotifications();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requestProcessing, setRequestProcessing] = useState(false);
  const [requestHandled, setRequestHandled] = useState(false);
  const [collabRequestHandled, setCollabRequestHandled] = useState(false);

  // Check if already following
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (user && notification.actorId) {
        const { userService } = await import('../../src/services/user.service');
        const followingList = await userService.getFollowing(user.userId);
        const following = followingList.includes(notification.actorId);
        setIsFollowing(following);
        setLoading(false);
      }
    };
    checkFollowStatus();
  }, [user, notification.actorId]);
  
  const handleFollow = async () => {
    try {
      await followUser(notification.actorId);
      setIsFollowing(true);
    } catch (error) {
      console.error('Failed to follow user', error);
    }
  };
  
  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsRead(notification.notificationId);
    }
  };

  const handleAcceptRequest = async () => {
    if (!user || requestProcessing) return;
    
    setRequestProcessing(true);
    try {
      const { userService } = await import('../../src/services/user.service');
      await userService.acceptFollowRequest(user.userId, notification.actorId);
      setRequestHandled(true);
      toast({
        title: "Request Accepted",
        description: `${notification.actorUsername} can now follow you`,
      });
    } catch (error) {
      console.error('Failed to accept request:', error);
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    } finally {
      setRequestProcessing(false);
    }
  };

  const handleAcceptCollaboration = async () => {
    if (!user || requestProcessing) return;
    
    setRequestProcessing(true);
    try {
      // Check if it's a glimpse or post collaboration
      if (notification.glimpseId) {
        const { glimpseService } = await import('../../src/services/glimpse.service');
        await glimpseService.acceptCollaboration(
          notification.requestId,
          notification.glimpseId,
          user.userId
        );
      } else if (notification.postId) {
        const { postService } = await import('../../src/services/post.service');
        await postService.acceptCollaboration(
          notification.postId, 
          notification.notificationId,
          user.userId
        );
      }
      
      setCollabRequestHandled(true);
      toast({
        title: "Collaboration Accepted",
        description: `You are now a collaborator`,
      });
    } catch (error) {
      console.error('Failed to accept collaboration:', error);
      toast({
        title: "Error",
        description: "Failed to accept collaboration",
        variant: "destructive",
      });
    } finally {
      setRequestProcessing(false);
    }
  };

  const handleRejectCollaboration = async () => {
    if (!user || requestProcessing) return;
    
    setRequestProcessing(true);
    try {
      // Check if it's a glimpse or post collaboration
      if (notification.glimpseId && notification.requestId) {
        const { glimpseService } = await import('../../src/services/glimpse.service');
        await glimpseService.rejectCollaboration(
          notification.requestId,
          notification.glimpseId,
          user.userId
        );
      } else if (notification.postId) {
        const { postService } = await import('../../src/services/post.service');
        // Add reject method if needed
      }
      
      setCollabRequestHandled(true);
      toast({
        title: "Collaboration Rejected",
        description: "Request has been declined",
      });
    } catch (error) {
      console.error('Failed to reject collaboration:', error);
      toast({
        title: "Error",
        description: "Failed to reject collaboration",
        variant: "destructive",
      });
    } finally {
      setRequestProcessing(false);
    }
  };
  
  const handleRejectRequest = async () => {
    if (!user || requestProcessing) return;
    
    setRequestProcessing(true);
    try {
      const { userService } = await import('../../src/services/user.service');
      await userService.rejectFollowRequest(user.userId, notification.actorId);
      setRequestHandled(true);
      toast({
        title: "Request Rejected",
        description: "Follow request rejected",
      });
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setRequestProcessing(false);
    }
  };

  const getNotificationText = () => {
    switch (notification.type) {
      case 'like': return 'liked your post';
      case 'comment': return 'commented on your post';
      case 'comment_reply': return notification.refPreview || 'replied to your comment';
      case 'comment_like': return 'liked your comment';
      case 'follow': return 'started following you';
      case 'follow_request': return 'requested to follow you';
      case 'mention': return notification.refPreview || 'mentioned you';
      case 'dm': return 'sent you a message';
      case 'story_view': return 'viewed your story';
      case 'story_reply': return 'replied to your story';
      case 'story_like': {
        const likers = notification.likersData || [];
        const totalCount = notification.totalLikesCount || 1;
        const othersCount = totalCount - Math.min(likers.length, 2);
        
        if (likers.length === 1) {
          return 'liked your story';
        } else if (likers.length === 2) {
          if (othersCount > 0) {
            return `and ${othersCount} ${othersCount === 1 ? 'other' : 'others'} liked your story`;
          }
          return 'liked your story';
        } else {
          if (othersCount > 0) {
            return `and ${othersCount} ${othersCount === 1 ? 'other' : 'others'} liked your story`;
          }
          return 'liked your story';
        }
      }
      case 'collaboration_request': return notification.glimpseId ? 'wants to collaborate on a glimpse with you' : 'wants to collaborate on a post with you';
      default: return 'interacted with you';
    }
  };
  
  const getNotificationLink = () => {
    if (notification.type === "like" || notification.type === "comment") {
      return `/post/${notification.postId}`;
    }
    if (notification.type === "follow" || notification.type === "follow_request") {
      return `/profile/${notification.actorId}`;
    }
    if (notification.type === "mention") {
      return notification.postId ? `/post/${notification.postId}` : `/profile/${notification.actorId}`;
    }
    if (notification.type === "dm") {
      return `/chat/${notification.actorId}`;
    }
    if (notification.type === "story_view" || notification.type === "story_reply") {
      return `/glimpses/${notification.actorId}`;
    }
    if (notification.type === "story_like") {
      // Navigate to story viewer with the story owner's ID
      return `/story/${notification.userId}`;
    }
    if (notification.type === "collaboration_request") {
      if (notification.glimpseId) {
        return `/glimpses?userId=${notification.actorId}`;
      }
      return `/post/${notification.postId}`;
    }
    return "#";
  };

  const getNotificationAction = () => {
    if (notification.type === "follow" && !loading) {
      return (
        <Button
          size="sm"
          variant={isFollowing ? "outline" : "default"}
          onClick={(e) => {
            e.stopPropagation();
            if (!isFollowing) handleFollow();
          }}
          disabled={isFollowing}
          className="ml-auto"
        >
          {isFollowing ? "Following" : "Follow Back"}
        </Button>
      );
    }

    if (notification.type === "follow_request" && !requestHandled) {
      return (
        <div className="flex gap-2 ml-auto">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAcceptRequest();
            }}
            disabled={requestProcessing}
          >
            {requestProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleRejectRequest();
            }}
            disabled={requestProcessing}
          >
            Decline
          </Button>
        </div>
      );
    }

    if (notification.type === "collaboration_request" && !collabRequestHandled) {
      return (
        <div className="flex gap-2 ml-auto">
          <Button
            size="sm"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              handleAcceptCollaboration();
            }}
            disabled={requestProcessing}
          >
            {requestProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Accept
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleRejectCollaboration();
            }}
            disabled={requestProcessing}
          >
            <X className="h-4 w-4 mr-1" />
            Decline
          </Button>
        </div>
      );
    }

    return null;
  };

  const timeAgo = (timestamp: any) => {
    if (!timestamp) return 'just now';
    const seconds = Math.floor((Date.now() - timestamp.toDate().getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  // Skip rendering if no actor username
  if (!notification.actorUsername) {
    return null;
  }

  const notificationLink = getNotificationLink();
  const isClickableNotification = notification.type !== 'follow' && notification.type !== 'follow_request';

  // Special rendering for story_like (aggregated)
  if (notification.type === 'story_like' && notification.likersData && notification.likersData.length > 0) {
    const likers = notification.likersData;
    const totalCount = notification.totalLikesCount || 1;
    const displayNames = likers.slice(0, 2).map(l => l.username).join(', ');
    const othersCount = totalCount - Math.min(likers.length, 2);
    
    return (
      <div
        className={`flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer ${
          !notification.isRead ? 'bg-primary/5' : ''
        }`}
        onClick={() => {
          handleClick();
          navigate(notificationLink);
        }}
      >
        {/* Overlapping Avatars */}
        <OverlappingAvatars likers={likers} maxDisplay={3} />

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-semibold">{displayNames}</span>
            {othersCount > 0 && (
              <span className="text-muted-foreground">
                {' '}and <span className="font-semibold">{othersCount}</span> {othersCount === 1 ? 'other' : 'others'}
              </span>
            )}
            <span className="text-muted-foreground"> liked your story</span>
          </p>
          <span className="text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</span>
        </div>

        {/* Story Thumbnail - Rounded Square */}
        {notification.refMediaURL && (
          <div className="flex-shrink-0">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden ring-2 ring-background">
              <img
                src={notification.refMediaURL}
                alt="story"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer ${
        !notification.isRead ? 'bg-primary/5' : ''
      }`}
      onClick={() => {
        handleClick();
        if (isClickableNotification) {
          navigate(notificationLink);
        }
      }}
    >
      <div 
        className="relative cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/profile/${notification.actorUsername}`);
        }}
      >
        <Avatar className="h-11 w-11">
          <AvatarImage src={notification.actorAvatarURL} />
          <AvatarFallback>{notification.actorUsername[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
          <NotificationIcon type={notification.type} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span 
            className="font-semibold hover:underline inline-flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${notification.actorId}`);
            }}
          >
            {notification.actorUsername}
            {notification.actorVerified && <VerifiedBadge size="sm" />}
          </span>{" "}
          <span className="text-muted-foreground">{getNotificationText()}</span>
        </p>
        {notification.refPreview && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{notification.refPreview}</p>
        )}
        <span className="text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</span>

        {getNotificationAction()}

        {notification.refMediaURL && (
          <div className="flex-shrink-0">
            <img
              src={notification.refMediaURL}
              alt="content"
              className="w-12 h-12 object-cover rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Notifications() {
  const { toast } = useToast();
  const { notifications, loading, error, markAllAsRead, unreadCount } = useNotifications();
  const [activeTab, setActiveTab] = useState("all");

  const handleRefresh = async () => {
    window.location.reload();
    toast({
      title: "Notifications refreshed",
      description: "You're all caught up!",
    });
  };
  
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast({
        title: "Marked all as read",
        description: "All notifications marked as read",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
    }
  };
  
  const allNotifications = notifications;
  const mentionNotifications = notifications.filter((n) => n.type === "mention");
  const followNotifications = notifications.filter((n) => n.type === "follow" || n.type === "follow_request");

  const { isPulling, isRefreshing, pullDistance, pullProgress } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  return (
    <div className="animate-fade-in min-h-screen pb-20">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="sticky top-0 bg-background z-10 border-b">
          <TabsList className="w-full grid grid-cols-3 rounded-none h-12">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mentions">Mentions</TabsTrigger>
            <TabsTrigger value="follows">Follows</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          <div className="divide-y">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <NotificationItem key={notification.notificationId} notification={notification} />
              ))
            ) : (
              <EmptyState
                icon={Bell}
                title="No notifications yet"
                description="You'll see updates about your activity here"
                variant="default"
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="mentions" className="mt-0">
          <div className="divide-y">
            {mentionNotifications.length > 0 ? (
              mentionNotifications.map((notification) => (
                <NotificationItem key={notification.notificationId} notification={notification} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <AtSign className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No mentions yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="follows" className="mt-0">
          <div className="divide-y">
            {followNotifications.length > 0 ? (
              followNotifications.map((notification) => (
                <NotificationItem key={notification.notificationId} notification={notification} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <UserPlus className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No new followers</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
