import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ChevronLeft, MessageCircle, Check, X, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { messageService } from "../../src/services/message.service";
import { userService } from "../../src/services/user.service";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../src/config/firebase";
import type { Conversation } from "../../src/types/database";

// Helper to format time
const formatTime = (timestamp: any): string => {
  if (!timestamp) return 'Recently';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
};

export default function MessageRequests() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      if (!currentUser) return;
      try {
        // Get conversations that are restricted for current user
        const q = query(
          collection(db, 'conversations'),
          where('participantIds', 'array-contains', currentUser.userId)
        );
        const snapshot = await getDocs(q);
        
        // Filter conversations where current user is in restrictedBy array
        const restrictedConvos = snapshot.docs
          .map(doc => ({ conversationId: doc.id, ...doc.data() } as Conversation))
          .filter(c => c.restrictedBy?.includes(currentUser.userId));
        
        // Sort by most recent
        restrictedConvos.sort((a, b) => {
          const aTime = a.lastMessageAt?.seconds || a.createdAt?.seconds || 0;
          const bTime = b.lastMessageAt?.seconds || b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        
        // Fetch user details for each conversation
        const requestsWithUsers = await Promise.all(
          restrictedConvos.map(async (convo) => {
            try {
              const otherUserId = convo.participantIds.find(id => id !== currentUser.userId);
              if (!otherUserId) return null;
              
              const senderUser = await userService.getUser(otherUserId);
              return {
                id: convo.conversationId,
                requestId: convo.conversationId,
                conversationId: convo.conversationId,
                fromUserId: otherUserId,
                user: {
                  name: senderUser?.displayName || 'Unknown User',
                  username: senderUser?.username || 'unknown',
                  avatar: senderUser?.avatarURL || '',
                },
                message: convo.lastMessage?.text || 'Message',
                time: formatTime(convo.lastMessageAt || convo.createdAt),
                createdAt: convo.lastMessageAt || convo.createdAt,
                unreadCount: convo.unreadCounts?.[currentUser.userId] || 0,
              };
            } catch (error) {
              console.error('Failed to load user for request:', error);
              return null;
            }
          })
        );
        
        setRequests(requestsWithUsers.filter(r => r !== null));
      } catch (error) {
        console.error('Failed to load message requests', error);
        toast({
          title: "Error",
          description: "Failed to load message requests",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadRequests();
  }, [currentUser, toast]);

  const handleAccept = async (requestId: string) => {
    if (!currentUser) return;
    try {
      // Find the request
      const request = requests.find(r => r.requestId === requestId);
      if (!request) return;
      
      // Unrestrict the conversation (move back to main chats)
      await messageService.unrestrictConversation(request.conversationId, currentUser.userId);
      
      toast({
        title: "Request accepted",
        description: "Opening chat...",
      });
      
      // Navigate directly to the chat
      setTimeout(() => {
        navigate(`/chat/${request.fromUserId}`);
      }, 500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (requestId: string) => {
    if (!currentUser) return;
    try {
      const request = requests.find(r => r.requestId === requestId);
      if (!request) return;
      
      // Delete the conversation entirely
      await messageService.deleteConversation(request.conversationId, currentUser.userId);
      
      setRequests(requests.filter(r => r.requestId !== requestId));
      toast({
        title: "Request declined",
        description: "This message request has been deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to decline request",
        variant: "destructive",
      });
    }
  };

  const handleViewRequest = (request: any) => {
    // Navigate to chat with request preview mode
    navigate(`/chat/${request.fromUserId}?requestPreview=true&conversationId=${request.conversationId}`);
  };

  if (loading) {
    return <LoadingState text="Loading message requests..." />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Message Requests</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {requests.length > 0 ? (
          <div className="divide-y">
            {requests.map((request) => (
              <div key={request.id} className="p-4">
                <div 
                  className="flex items-start gap-3 mb-3 cursor-pointer hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors"
                  onClick={() => handleViewRequest(request)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={request.user.avatar} />
                    <AvatarFallback>{request.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{request.user.name}</div>
                    <div className="text-sm text-muted-foreground">{request.user.username}</div>
                    <div className="text-sm mt-2 line-clamp-2">{request.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {request.time} • {request.unreadCount} {request.unreadCount === 1 ? 'message' : 'messages'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDecline(request.id);
                    }}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccept(request.id);
                    }}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No message requests</h3>
            <p className="text-sm text-muted-foreground">
              New message requests will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
