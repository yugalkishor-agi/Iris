import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../../src/config/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { GifPickerModal } from "@/components/ui/gif-picker-modal";
import { isGiphyUrl } from "@/utils/gifUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { userService } from "../../src/services/user.service";
import { settingsService } from "../../src/services/settings.service";
import { messageService } from "../../src/services/message.service";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { ANONYMOUS_USER, anonymizeUser } from "@/utils/anonymizeBlocked";
import { SharedContentMessage } from "@/components/chat/SharedContentMessage";
import { StoryReplyMessage } from "@/components/chat/StoryReplyMessage";
import { CollaborationRequestMessage } from "@/components/chat/CollaborationRequestMessage";
import { EmojiReactionPicker } from "@/components/chat/EmojiReactionPicker";
import { ForwardDialog } from "../components/chat/ForwardDialog";
import { ChatProfileDrawer } from '@/components/chat/ChatProfileDrawer';
import { UserSelectorDialog } from '@/components/chat/UserSelectorDialog';
import type { User } from "../../src/types/database";
import {
  ChevronLeft,
  Phone,
  Video,
  MoreVertical,
  Send,
  Camera,
  Mic,
  Smile,
  FileImage,
  User as UserIcon,
  VolumeX,
  Ban,
  Flag,
  Trash2,
  X,
  Reply,
  Image as ImageIcon,
  Plus,
  Heart,
  ArrowLeft,
  Check,
  Paperclip,
  VideoIcon,
  Info,
  MessageCircle,
} from "lucide-react";

interface Message {
  id: number;
  from: "me" | "other";
  text: string;
  time: string;
  seen: boolean;
  replyTo?: {
    id: number;
    text: string;
    from: "me" | "other";
  };
}

export default function Chat() {
  const { id: otherUserId } = useParams(); // This is the other user's ID from profile
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { blockedUsers } = useBlockedUsers();
  const [conversationId, setConversationId] = useState<string>('');
  const { messages: chatMessages, loading, sendMessage, markAsRead } = useMessages(conversationId);
  
  // Check if viewing from request preview
  const urlParams = new URLSearchParams(window.location.search);
  const requestPreview = urlParams.get('requestPreview') === 'true';
  const previewConversationId = urlParams.get('conversationId') || '';
  
  // Debug: Log messages when they update
  useEffect(() => {
    console.log('💬 Chat messages updated:', chatMessages.length);
    chatMessages.forEach((msg, idx) => {
      console.log(`Message ${idx}:`, { type: msg.type, hasSharedContent: !!msg.sharedContent, text: msg.text?.substring(0, 30) });
    });
  }, [chatMessages]);
  const [messageText, setMessageText] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Anonymize blocked user display
  const displayUser = otherUser && blockedUsers.includes(otherUser.userId)
    ? anonymizeUser(otherUser, otherUser.userId, blockedUsers)
    : otherUser;
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [swipeDistance, setSwipeDistance] = useState<{[key: string]: number}>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [canMessage, setCanMessage] = useState<boolean>(true);
  const [requestMode, setRequestMode] = useState<boolean>(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [longPressedMessage, setLongPressedMessage] = useState<any>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionPickerPosition, setReactionPickerPosition] = useState({ x: 0, y: 0 });
  const [reactingToMessage, setReactingToMessage] = useState<any>(null);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [chatWallpaper, setChatWallpaper] = useState<string>('default');
  const [blockingUser, setBlockingUser] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [swipedMessageId, setSwipedMessageId] = useState<string | null>(null);

  // Create or get conversation and fetch other user's data with real-time updates
  useEffect(() => {
    const initializeChat = async () => {
      if (!otherUserId || !user) return;
      
      try {
        setLoadingUser(true);
        
        // Step 1: Fetch user data IMMEDIATELY and show it
        const userDataPromise = userService.getUser(otherUserId);
        userDataPromise.then(userData => {
          setOtherUser(userData);
          setLoadingUser(false); // Show user info immediately
        });
        
        // Step 2: Parallel fetch all checks (don't wait for user data)
        const [userData, privacy, myFollowing, theirFollowing] = await Promise.all([
          userDataPromise,
          settingsService.getPrivacySettings(otherUserId),
          userService.getFollowing(user.userId),
          userService.getFollowing(otherUserId)
        ]);
        
        // Step 3: Quick checks without extra API calls
        const iFollow = myFollowing.includes(otherUserId);
        const theyFollowMe = theirFollowing.includes(user.userId);
        const mutualFollowers = iFollow && theyFollowMe;
        
        const messagePerm = privacy.whoCanMessage || 'everyone';
        const privacyAllowed = messagePerm === 'everyone' || (messagePerm === 'followers' && iFollow);
        
        // Both conditions must be met
        const allowed = privacyAllowed && mutualFollowers;
        setCanMessage(allowed);
        setRequestMode(!allowed);

        // Get or create conversation
        const convId = await messageService.getOrCreateDirectConversation(
          user.userId,
          otherUserId
        );
        setConversationId(convId);
        
        // Load conversation to check pin/mute status
        const conv = await messageService.getConversation(convId);
        if (conv && user) {
          setIsPinned(!!conv.pinnedBy?.[user.userId]?.isPinned);
          setIsMuted(!!conv.mutedBy?.[user.userId]?.isMuted);
        }
        
        // Note: Restriction happens when first message is sent
        // Not on chat open, to prevent sender seeing their own chat in requests
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        setLoadingUser(false);
      }
    };
    
    initializeChat();

    // Real-time listener for other user's online status
    const setupOnlineListener = async () => {
      if (!otherUserId) return;
      
      const userUnsubscribe = onSnapshot(doc(db, 'users', otherUserId), (userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setOtherUser(userData);
        }
      });

      // Only set up conversation listener if conversationId exists
      let conversationUnsubscribe = () => {};
      if (conversationId) {
        conversationUnsubscribe = onSnapshot(doc(db, 'conversations', conversationId), (convDoc) => {
        if (convDoc.exists()) {
          const convData = convDoc.data();
          const typingData = convData?.typing || {};
          const otherUserTypingTimestamp = typingData[otherUserId];
          
          // Check if other user is typing (within last 3 seconds)
          if (otherUserTypingTimestamp) {
            const now = Date.now();
            const typingTime = otherUserTypingTimestamp.toMillis ? otherUserTypingTimestamp.toMillis() : 0;
            setOtherUserTyping(now - typingTime < 3000);
          } else {
            setOtherUserTyping(false);
          }
        }
      });
      }

      return () => {
        userUnsubscribe();
        conversationUnsubscribe();
      };
    };
    
    let cleanup: (() => void) | undefined;
    setupOnlineListener().then(unsub => { cleanup = unsub; });

    return () => {
      if (cleanup) cleanup();
    };
  }, [otherUserId, user]);

  // Auto-scroll to bottom - instant on mount, smooth on new messages
  useEffect(() => {
    if (chatMessages.length > 0) {
      const isFirstLoad = chatMessages.length === 1;
      messagesEndRef.current?.scrollIntoView({ 
        behavior: isFirstLoad ? 'auto' : 'smooth' 
      });
    }
  }, [chatMessages]);

  // Initial scroll to bottom when conversation loads
  useEffect(() => {
    if (conversationId && chatMessages.length > 0 && !loading) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [conversationId, loading]);

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (chatMessages.length > 0 && conversationId && user) {
      const unreadMessages = chatMessages.filter(
        msg => msg.senderId !== user.userId && (!msg.readBy || !msg.readBy.includes(user.userId))
      );
      
      if (unreadMessages.length > 0) {
        markAsRead();
      }
    }
  }, [chatMessages, conversationId, user]);

  // Listen for typing indicator
  useEffect(() => {
    if (!conversationId || !otherUserId) return;

    const typingRef = doc(db, `conversations/${conversationId}/typing/${otherUserId}`);
    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setIsTyping(data.isTyping || false);
      } else {
        setIsTyping(false);
      }
    });

    return () => unsubscribe();
  }, [conversationId, otherUserId]);

  // Cleanup typing indicator on unmount
  useEffect(() => {
    return () => {
      if (conversationId && user && typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        userService.setTypingStatus(conversationId, user.userId, false);
      }
    };
  }, [conversationId, user]);

  // Handle typing indicator
  const handleTyping = (text: string) => {
    setMessageText(text);
    
    if (!conversationId || !user || !otherUserId) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set typing status
    if (text.trim()) {
      userService.setTypingStatus(conversationId, user.userId, true);
      
      // Clear typing after 2 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        userService.setTypingStatus(conversationId, user.userId, false);
      }, 2000);
    } else {
      userService.setTypingStatus(conversationId, user.userId, false);
    }
  };

  const handleSend = async () => {
    if (messageText.trim() && !sending) {
      setSending(true);
      
      // Clear typing indicator for DMs
      if (conversationId && user && !requestMode) {
        userService.setTypingStatus(conversationId, user.userId, false);
      }
      
      try {
        // Always use normal sendMessage - restrictedBy field handles request mode
        await sendMessage(
          messageText,
          undefined,
          replyingTo
            ? {
                messageId: replyingTo.messageId,
                text: replyingTo.text,
                senderId: replyingTo.senderId,
                senderUsername: replyingTo.senderUsername,
              }
            : undefined
        );
        setMessageText("");
        setReplyingTo(null);
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setSending(false);
      }
    }
  };

  const handleReply = (message: any) => {
    setReplyingTo(message);
    setSwipeDistance({});
  };

  const handleTypingIndicator = async (text: string) => {
    if (!conversationId || !user) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set typing to true if text exists
    if (text.trim()) {
      await messageService.setTyping(conversationId, user.userId, true);
      
      // Auto-clear typing after 3 seconds
      typingTimeoutRef.current = setTimeout(async () => {
        await messageService.setTyping(conversationId, user.userId, false);
      }, 3000);
    } else {
      await messageService.setTyping(conversationId, user.userId, false);
    }
  };

  const handleMessageLongPress = (messageId: string) => {
    setSelectionMode(true);
    setSelectedMessages(new Set([messageId]));
  };

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      if (newSet.size === 0) setSelectionMode(false);
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (!user || !conversationId) return;
    try {
      for (const msgId of selectedMessages) {
        await messageService.deleteMessage(conversationId, msgId, user.userId);
      }
      setSelectedMessages(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error('Failed to delete messages:', error);
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedMessages(new Set());
  };

  const handleUnsendMessage = async (message: any) => {
    if (!user || !conversationId) return;
    
    if (message.senderId !== user.userId) {
      toast({
        title: "Cannot unsend",
        description: "You can only unsend your own messages.",
        variant: "destructive"
      });
      return;
    }
    
    if (confirm('Unsend this message? It will be removed for everyone.')) {
      try {
        await messageService.unsendMessage(conversationId, message.messageId, user.userId);
        setShowMessageMenu(false);
        setLongPressedMessage(null);
        toast({
          title: "Message unsent",
          description: "This message has been removed for everyone.",
        });
      } catch (error) {
        console.error('Failed to unsend message:', error);
        toast({
          title: "Error",
          description: "Failed to unsend message.",
          variant: "destructive"
        });
      }
    }
  };

  // Request preview handlers
  const handleAcceptRequest = async () => {
    if (!user || !previewConversationId) return;
    try {
      // Unrestrict the conversation (remove user from restrictedBy)
      await messageService.unrestrictConversation(previewConversationId, user.userId);
      
      toast({
        title: "Request accepted",
        description: "You can now chat freely!",
      });
      
      // Reload the page without requestPreview param to show normal chat
      setTimeout(() => {
        window.location.href = `/chat/${otherUserId}`;
      }, 300);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async () => {
    if (!user || !previewConversationId) return;
    try {
      // Delete the conversation entirely
      await messageService.deleteConversation(previewConversationId, user.userId);
      
      toast({
        title: "Request declined",
        description: "This message request has been deleted",
      });
      navigate('/messages');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to decline request",
        variant: "destructive",
      });
    }
  };

  const handleViewProfile = () => {
    if (otherUserId) {
      navigate(`/profile/${otherUserId}`);
    }
  };

  const handleShowReactionPicker = (message: any, event: React.TouchEvent | React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setReactionPickerPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setReactingToMessage(message);
    setShowReactionPicker(true);
  };

  const handleAddReaction = async (emoji: string) => {
    if (!user || !conversationId || !reactingToMessage) return;
    
    try {
      await messageService.addReaction(
        conversationId,
        reactingToMessage.messageId,
        user.userId,
        emoji
      );
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleForward = async (toUserIds: string[]) => {
    if (!user || selectedMessages.size === 0) return;
    
    const messagesToForward = chatMessages.filter(m => selectedMessages.has(m.messageId));
    
    try {
      await messageService.forwardMessages(user.userId, toUserIds, messagesToForward as any);
      setSelectionMode(false);
      setSelectedMessages(new Set());
      toast({ title: "Messages forwarded", description: `Sent to ${toUserIds.length} ${toUserIds.length === 1 ? 'person' : 'people'}` });
    } catch (error) {
      console.error('Failed to forward:', error);
      toast({ title: "Forward failed", variant: "destructive" });
    }
  };

  if (loading || loadingUser) {
    return (
      <div className="flex flex-col h-screen">
        <div className="p-4 border-b">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-3/4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-primary/5">
      {/* Header with Gradient */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-b border-primary/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link
            to="/messages"
            className="p-2 hover:bg-accent/80 rounded-full transition-all active:scale-95"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          
          {loadingUser ? (
            <Skeleton className="h-11 w-11 rounded-full" />
          ) : (
            <div className="relative">
              <Avatar className="h-11 w-11 ring-2 ring-primary/30">
                <AvatarImage src={otherUser?.avatarURL} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-bold">
                  {otherUser?.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              {/* Hide online status if in request mode */}
              {!requestMode && otherUser?.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
          )}
          <button 
            onClick={() => setShowProfileDrawer(true)}
            className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
          >
            {loadingUser ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h2 className="font-semibold truncate">{otherUser?.displayName || otherUser?.username}</h2>
                    {otherUser?.verified && <VerifiedBadge size="sm" />}
                  </div>
                  {otherUserTyping && (
                    <p className="text-xs text-primary animate-pulse">typing...</p>
                  )}
                </div>
                {isTyping ? (
                  <div className="text-xs text-primary font-medium flex items-center gap-1">
                    <span className="animate-pulse">typing</span>
                    <span className="animate-bounce">...</span>
                  </div>
                ) : !requestMode ? (
                  // Only show active status if NOT in request mode
                  otherUser?.isOnline ? (
                    <span className="text-xs text-muted-foreground">Active now</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Offline</span>
                  )
                ) : null}
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-1">
        <button className="p-2.5 hover:bg-primary/10 rounded-full transition-all active:scale-95">
          <Phone className="h-5 w-5 text-primary" />
        </button>
        <button className="p-2.5 hover:bg-primary/10 rounded-full transition-all active:scale-95">
          <Video className="h-5 w-5 text-primary" />
        </button>
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="p-2.5 hover:bg-primary/10 rounded-full transition-all active:scale-95"
        >
          <MoreVertical className="h-5 w-5 text-primary" />
        </button>
      </div>
    </div>

    {/* Emoji Reaction Picker */}
    {showReactionPicker && (
      <EmojiReactionPicker
        position={reactionPickerPosition}
        onSelect={handleAddReaction}
        onClose={() => setShowReactionPicker(false)}
      />
    )}

    {/* Options Dropdown */}
    {showOptions && (
      <>
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOptions(false)}
        />
        <div className="absolute right-0 top-12 z-50 w-56 bg-card border rounded-lg shadow-lg overflow-hidden">
          <Link
            to={`/profile/${otherUserId}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
          >
            <UserIcon className="h-4 w-4" />
            <span className="text-sm">View Profile</span>
          </Link>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
            onClick={async () => {
              if (!otherUserId || !user) return;
              try {
                await userService.muteUser(user.userId, otherUserId);
                setShowOptions(false);
              } catch (error) {
                console.error('Failed to mute user:', error);
              }
            }}
          >
            <VolumeX className="h-4 w-4" />
            <span className="text-sm">Mute Chat</span>
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-destructive"
            onClick={async () => {
              if (!otherUserId || !user) return;
              if (confirm('Are you sure you want to block this user?')) {
                try {
                  await userService.blockUser(user.userId, otherUserId);
                  setShowOptions(false);
                  window.history.back();
                } catch (error) {
                  console.error('Failed to block user:', error);
                }
              }
            }}
          >
            <Ban className="h-4 w-4" />
            <span className="text-sm">Block User</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-destructive">
            <Flag className="h-4 w-4" />
            <span className="text-sm">Report User</span>
          </button>
          <div className="border-t" />
          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 transition-colors text-destructive"
            onClick={async () => {
              if (!conversationId || !user) return;
              if (confirm('Delete this chat? This cannot be undone.')) {
                try {
                  setShowOptions(false);
                  await messageService.deleteConversation(conversationId, user.userId);
                  toast({
                    title: "Chat deleted",
                    description: "This conversation has been removed.",
                  });
                  navigate('/messages');
                } catch (error) {
                  console.error('Failed to delete chat:', error);
                  toast({
                    title: "Error",
                    description: "Failed to delete chat. Please try again.",
                    variant: "destructive"
                  });
                }
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-sm">Delete Chat</span>
          </button>
        </div>
      </>
    )}

    {/* Messages */}
    <div 
      className="flex-1 overflow-y-auto p-4 pt-20 pb-24 space-y-3 min-h-0"
      style={{
        background: chatWallpaper === 'default' ? 'var(--background)' :
                   chatWallpaper === 'ocean' ? 'linear-gradient(to bottom right, rgb(96 165 250), rgb(103 232 249))' :
                   chatWallpaper === 'sunset' ? 'linear-gradient(to bottom right, rgb(251 146 60), rgb(244 114 182))' :
                   chatWallpaper === 'forest' ? 'linear-gradient(to bottom right, rgb(74 222 128), rgb(52 211 153))' :
                   chatWallpaper === 'purple' ? 'linear-gradient(to bottom right, rgb(192 132 252), rgb(244 114 182))' :
                   chatWallpaper === 'dark' ? 'linear-gradient(to bottom right, rgb(31 41 55), rgb(17 24 39))' :
                   chatWallpaper === 'custom' ? `url(${localStorage.getItem(`chat-custom-wallpaper-${otherUserId}`)})` :
                   'var(--background)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Request guard - Only show before first message is sent */}
      {requestMode && chatMessages.length === 0 && (
        <div className="mt-2 mb-2 p-3 rounded-xl border bg-amber-50 text-amber-900 border-amber-200">
          <div className="text-sm font-semibold mb-1">Send message request</div>
          <div className="text-xs text-amber-800">
            This account only allows messages from followers. Your message will be sent as a request. They can accept or decline it.
          </div>
        </div>
      )}
      {chatMessages.map((msg, index) => {
        const isMe = msg.senderId === user?.userId;
        const timestamp = msg.createdAt as any;
        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        // Check if we need a date separator
        const showDateSeparator = index === 0 || (() => {
          const prevMsg = chatMessages[index - 1];
          const prevTimestamp = prevMsg.createdAt as any;
          const prevDate = prevTimestamp?.toDate ? prevTimestamp.toDate() : new Date(prevTimestamp);
          return date.toDateString() !== prevDate.toDateString();
        })();
        
        const dateSeparatorText = (() => {
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (date.toDateString() === today.toDateString()) {
            return 'Today';
          } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
          } else {
            return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
          }
        })();
        
        return (
          <div key={msg.messageId}>
            {/* Date Separator */}
            {showDateSeparator && (
              <div className="flex items-center justify-center my-6">
                <div className="flex items-center gap-3 w-full max-w-xs">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{dateSeparatorText}</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>
              </div>
            )}
            
            <div
              className={`flex items-end gap-2 mb-3 px-3 ${
                isMe ? "flex-row-reverse" : "flex-row"
              } ${
                selectedMessages.has(msg.messageId) ? 'bg-primary/10' : ''
              } relative`}
            >
            {/* Reply Icon - Shows during swipe */}
            {swipedMessageId === msg.messageId && (swipeDistance[msg.messageId] || 0) > 20 && (
              <div className={`absolute top-1/2 -translate-y-1/2 ${
                isMe ? 'right-full mr-2' : 'left-full ml-2'
              }`} style={{ opacity: Math.min(1, (swipeDistance[msg.messageId] || 0) / 50) }}>
                <Reply className="h-5 w-5 text-primary" />
              </div>
            )}
            
            {/* Exact Timestamp - Shows on opposite swipe */}
            {swipedMessageId === msg.messageId && (swipeDistance[msg.messageId] || 0) < -20 && (
              <div className={`absolute top-1/2 -translate-y-1/2 ${
                isMe ? 'left-full ml-2' : 'right-full mr-2'
              }`} style={{ opacity: Math.min(1, Math.abs(swipeDistance[msg.messageId] || 0) / 50) }}>
                <div className="bg-muted/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                  <span className="text-xs font-medium whitespace-nowrap">
                    {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
              </div>
            )}
            <div
              className="flex items-end gap-2 max-w-[75%]"
              style={{
                transform: (swipeDistance[msg.messageId] || 0) > 0 ? (isMe ? `translateX(-${Math.min(swipeDistance[msg.messageId] || 0, 60)}px)` : `translateX(${Math.min(swipeDistance[msg.messageId] || 0, 60)}px)`) : 'none',
                transition: (swipeDistance[msg.messageId] || 0) === 0 ? 'transform 0.2s ease-out' : 'none'
              }}
              onTouchStart={(e) => {
                setSwipeStartX(e.touches[0].clientX);
                setSwipedMessageId(msg.messageId);
              }}
              onTouchMove={(e) => {
                const currentX = e.touches[0].clientX;
                const distance = isMe ? swipeStartX - currentX : currentX - swipeStartX;
                // Allow both directions: positive for reply, negative for timestamp
                if (Math.abs(distance) < 100) {
                  setSwipeDistance(prev => ({ ...prev, [msg.messageId]: distance }));
                }
              }}
              onTouchEnd={() => {
                const currentSwipe = swipeDistance[msg.messageId] || 0;
                if (currentSwipe > 50) {
                  handleReply(msg);
                }
                // Negative swipe just shows timestamp, no action needed
                setSwipeDistance(prev => ({ ...prev, [msg.messageId]: 0 }));
                setSwipedMessageId(null);
              }}
            >
              {!isMe && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={msg.senderAvatarURL} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-purple-500/30 text-sm font-semibold">
                    {msg.senderUsername[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={(() => {
                  // Check if message is media-only (no bubble needed)
                  const isGifOrSticker = msg.text && (msg.text.startsWith('STICKER:') || isGiphyUrl(msg.text));
                  const isSharedContent = msg.type === 'shared_post' || msg.type === 'shared_glimpse' || msg.type === 'shared_story';
                  const isMediaOnly = (msg.mediaURL && !msg.text) || isGifOrSticker || isSharedContent || msg.type === 'story_reply' || msg.type === 'glimpse_collab_request';
                  
                  if (isMediaOnly) {
                    // Transparent background for media-only messages
                    return "relative transition-transform";
                  }
                  
                  // Text messages get bubble background
                  return `relative ${
                    isMe
                      ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-tr-md"
                      : "bg-muted/80 text-foreground rounded-2xl rounded-tl-md"
                  } px-3 py-2 shadow-md transition-transform`;
                })()}
                style={{
                  transform: swipedMessageId === msg.messageId 
                    ? `translateX(${isMe ? -(swipeDistance[msg.messageId] || 0) : (swipeDistance[msg.messageId] || 0)}px)` 
                    : 'none'
                }}
                onTouchStart={(e) => {
                  if (!requestMode) {
                    const timer = setTimeout(() => {
                      setLongPressedMessage(msg);
                      setShowMessageMenu(true);
                    }, 500);
                    (e.currentTarget as any).longPressTimer = timer;
                  }
                }}
                onTouchEnd={(e) => {
                  const timer = (e.currentTarget as any).longPressTimer;
                  if (timer) clearTimeout(timer);
                }}
                onTouchMove={(e) => {
                  const timer = (e.currentTarget as any).longPressTimer;
                  if (timer) clearTimeout(timer);
                }}
              >
                {msg.replyTo && (
                  <div className={`mb-2 pb-2 border-l-2 pl-2 ${
                    isMe ? 'border-primary-foreground/30' : 'border-primary/30'
                  }`}>
                    <div className="text-[10px] font-semibold opacity-70 mb-0.5">
                      {msg.replyTo.senderUsername === user?.username ? 'You' : msg.replyTo.senderUsername}
                    </div>
                    <div className="text-xs opacity-70 line-clamp-2">
                      {msg.replyTo.text || 'Message'}
                    </div>
                  </div>
                )}
                
                {/* Message Content */}
                <div className="space-y-1">
                  {/* Story Reply */}
                  {msg.type === 'story_reply' && msg.storyReply ? (
                    <StoryReplyMessage
                      replyText={msg.text}
                      storyPreview={{
                        mediaURL: msg.storyReply.mediaURL,
                        authorUsername: msg.storyReply.authorUsername,
                        authorAvatar: msg.storyReply.authorAvatar,
                        authorVerified: msg.storyReply.authorVerified,
                      }}
                    />
                  ) : /* Collaboration Request */
                  msg.type === 'glimpse_collab_request' && msg.glimpseId ? (
                    <CollaborationRequestMessage
                      messageId={msg.messageId}
                      glimpseId={msg.glimpseId}
                      glimpseMediaURL={msg.glimpseMediaURL || ''}
                      senderUsername={msg.senderUsername}
                      onStatusChange={() => {}}
                      status={(msg.status as 'pending' | 'accepted' | 'rejected') || 'pending'}
                    />
                  ) : /* Shared Content (Post, Glimpse, Story) */
                  (msg.type === 'shared_post' || 
                    msg.type === 'shared_glimpse' || 
                    msg.type === 'shared_story') && msg.sharedContent ? (
                    (() => {
                      console.log('🎨 Rendering SharedContentMessage:', { type: msg.type, sharedContent: msg.sharedContent });
                      return <SharedContentMessage 
                        sharedContent={msg.sharedContent}
                        message={msg.text}
                      />;
                    })()
                  ) : (
                    <>
                      {msg.mediaURL && (
                        <div className="rounded-lg overflow-hidden max-w-sm">
                          {msg.mediaType === 'image' ? (
                            <img 
                              src={msg.mediaURL} 
                              alt="Shared media"
                              className="w-full h-auto"
                            />
                          ) : msg.mediaType === 'video' ? (
                            <video 
                              src={msg.mediaURL}
                              controls
                              className="w-full h-auto"
                            />
                          ) : null}
                        </div>
                      )}
                      {msg.text && (
                        (() => {
                          // Check if it's a sticker (has STICKER: prefix)
                          const isSticker = msg.text.startsWith('STICKER:');
                          const actualUrl = isSticker ? msg.text.replace('STICKER:', '') : msg.text;
                          
                          if (isSticker || isGiphyUrl(actualUrl)) {
                            return (
                              <div className="rounded-lg overflow-hidden max-w-xs">
                                <img 
                                  src={actualUrl} 
                                  alt={isSticker ? "Sticker" : "GIF"}
                                  className="w-full h-auto"
                                  loading="lazy"
                                />
                              </div>
                            );
                          }
                          
                          return (
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>
                          );
                        })()
                      )}
                    </>
                  )}
                </div>
                
                {/* Reactions */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {Object.entries(msg.reactions).map(([userId, emoji]) => (
                      <span
                        key={userId}
                        className="text-xs bg-accent rounded-full px-2 py-0.5 flex items-center gap-1"
                      >
                        {String(emoji)}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className={`flex items-center gap-1.5 mt-1.5 ${
                  isMe ? 'justify-end' : 'justify-start'
                }`}>
                  <span className={(() => {
                    // Check if message is media-only for timestamp color
                    const isGifOrSticker = msg.text && (msg.text.startsWith('STICKER:') || isGiphyUrl(msg.text));
                    const isSharedContent = msg.type === 'shared_post' || msg.type === 'shared_glimpse' || msg.type === 'shared_story';
                    const isMediaOnly = (msg.mediaURL && !msg.text) || isGifOrSticker || isSharedContent || msg.type === 'story_reply' || msg.type === 'glimpse_collab_request';
                    
                    // Media messages use muted color, text messages use foreground color
                    if (isMediaOnly) {
                      return 'text-[9px] font-medium text-muted-foreground/70';
                    }
                    return `text-[9px] font-medium ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground/70'}`;
                  })()}>{timeStr}</span>
                  {isMe && msg.readBy && msg.readBy.some(id => id !== user?.userId) && otherUser && (
                    <Avatar className="h-3 w-3">
                      <AvatarImage src={otherUser.avatarURL} />
                      <AvatarFallback className="text-[6px]">{otherUser.username?.[0]}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </div>
            </div>
          </div>
        );
      })}
      
      {/* Typing Indicator - Shows after all messages */}
      {otherUserTyping && (
        <div className="flex items-end gap-2 max-w-[75%] animate-fade-in px-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={otherUser?.avatarURL} />
            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-purple-500/30 text-sm font-semibold">
              {otherUser?.displayName?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="bg-muted/80 rounded-2xl rounded-bl-md px-4 py-3 shadow-md">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>

    {/* Reply Bar */}
    {replyingTo && (
      <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Reply className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">Replying to {replyingTo.senderUsername}</div>
            <div className="text-sm truncate">{replyingTo.text}</div>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => setReplyingTo(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )}

    {selectionMode && (
      <div className="fixed bottom-20 left-0 right-0 bg-background border-t p-3 flex items-center justify-between z-10">
        <span className="text-sm font-medium">{selectedMessages.size} selected</span>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowForwardDialog(true)}
            disabled={selectedMessages.size === 0}
            className="bg-primary"
          >
            Forward
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              setReactionPickerPosition({ x: e.clientX, y: e.clientY });
              setReactingToMessage(longPressedMessage);
              setShowReactionPicker(true);
              setShowMessageMenu(false);
            }}
          >
            <Smile className="h-4 w-4 mr-2" />
            React
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setReplyingTo(longPressedMessage);
              setShowMessageMenu(false);
            }}
          >
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowReactionPicker(true);
              setReactingToMessage(longPressedMessage);
              setShowMessageMenu(false);
            }}
          >
            <Smile className="h-4 w-4 mr-2" />
            React
          </Button>
        </div>
      </div>
    )}

    {showForwardDialog && (
        <UserSelectorDialog
          isOpen={showForwardDialog}
          onClose={() => {
            setShowForwardDialog(false);
            setSelectionMode(false);
            setSelectedMessages(new Set());
          }}
          onSelect={async (selectedUserId) => {
            if (!user || !conversationId || selectedMessages.size === 0) return;
            
            try {
              // Forward each selected message
              for (const msgId of selectedMessages) {
                const message = chatMessages.find(m => m.messageId === msgId);
                if (message) {
                  await messageService.forwardMessage(
                    conversationId,
                    message.messageId,
                    user.userId,
                    selectedUserId
                  );
                }
              }
              
              toast({ 
                title: 'Messages forwarded', 
                description: `Sent ${selectedMessages.size} message(s)` 
              });
              
              setShowForwardDialog(false);
              setSelectionMode(false);
              setSelectedMessages(new Set());
            } catch (error) {
              console.error('Forward failed:', error);
              toast({ 
                title: 'Forward failed', 
                description: 'Could not forward messages',
                variant: 'destructive' 
              });
            }
          }}
          title="Forward to"
        />
      )}

    {/* Input Area with Modern Design OR Request Actions */}
    <div className="border-t bg-background/95 backdrop-blur-sm">
      {requestPreview ? (
        /* Request Preview Actions */
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <MessageCircle className="h-4 w-4" />
            <span>This person wants to send you a message</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeclineRequest}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-1" />
              Decline
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewProfile}
              className="flex-1"
            >
              <UserIcon className="h-4 w-4 mr-1" />
              View Profile
            </Button>
            <Button
              size="sm"
              onClick={handleAcceptRequest}
              className="flex-1 bg-gradient-to-r from-primary to-purple-600"
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
          </div>
        </div>
      ) : (
        /* Normal Chat Input */
        <div className="flex items-center gap-2 p-3">
          {/* Left Side Icons */}
          <Button 
            size="icon" 
            variant="ghost" 
            className="flex-shrink-0 rounded-full hover:bg-accent"
            title="Camera/Gallery"
          >
            <Camera className="h-6 w-6" />
          </Button>
          
          <div className="relative">
            <Button 
              size="icon" 
              variant="ghost" 
              className="flex-shrink-0 rounded-full hover:bg-accent"
              title="Emoji picker"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-5 w-5" />
            </Button>
            
            {showEmojiPicker && (
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  setMessageText(prev => prev + emoji);
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>
          
          {/* GIF Button */}
          <Button 
            size="icon" 
            variant="ghost" 
            className="flex-shrink-0 rounded-full hover:bg-accent"
            title="Send GIF"
            onClick={() => setShowGifPicker(true)}
          >
            <FileImage className="h-5 w-5" />
          </Button>
          
          {/* Center - Wider Input Field */}
          <Input
            value={messageText}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message..."
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          />
          
          {/* Right Side - Send Button (always visible) */}
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={sending || !messageText.trim()}
            className={`flex-shrink-0 rounded-full shadow-lg transition-all ${
              messageText.trim() 
                ? 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 hover:scale-105' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            title="Send"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>

      {/* Chat Profile Drawer */}
      {otherUser && (
        <ChatProfileDrawer
          open={showProfileDrawer}
          onOpenChange={setShowProfileDrawer}
          otherUser={{
            userId: otherUser.userId,
            username: otherUser.username,
            displayName: otherUser.displayName,
            avatarURL: otherUser.avatarURL,
            verified: otherUser.verified,
            bio: otherUser.bio,
          }}
          onViewProfile={() => {
            setShowProfileDrawer(false);
            navigate(`/profile/${otherUser.username}`);
          }}
          onCreateGroup={() => {
            setShowProfileDrawer(false);
            navigate(`/messages/new-group?userId=${otherUser.userId}`);
          }}
          onMute={async () => {
            if (!user || !conversationId) return;
            try {
              if (isMuted) {
                await messageService.unmuteConversation(conversationId, user.userId);
                setIsMuted(false);
                toast({ title: "Unmuted", description: `Notifications enabled for ${otherUser.username}` });
              } else {
                await messageService.muteConversation(conversationId, user.userId);
                setIsMuted(true);
                toast({ title: "Muted", description: `Notifications muted for ${otherUser.username}` });
              }
            } catch (error) {
              console.error('Mute toggle error:', error);
              toast({ title: "Error", description: "Failed to toggle mute", variant: "destructive" });
            }
          }}
          onPin={async () => {
            if (!user || !conversationId) return;
            try {
              await messageService.pinConversation(conversationId, user.userId);
              setIsPinned(true);
              toast({ title: "Chat pinned", description: "This chat will stay at the top" });
            } catch (error) {
              console.error('Pin error:', error);
              toast({ title: "Error", description: "Failed to pin chat", variant: "destructive" });
            }
          }}
          onUnpin={async () => {
            if (!user || !conversationId) return;
            try {
              await messageService.pinConversation(conversationId, user.userId);
              setIsPinned(false);
              toast({ title: "Chat unpinned", description: "Chat moved to regular list" });
            } catch (error) {
              console.error('Unpin error:', error);
              toast({ title: "Error", description: "Failed to unpin chat", variant: "destructive" });
            }
          }}
          isPinned={isPinned}
          isMuted={isMuted}
          conversationId={conversationId}
          onBlock={async () => {
            if (!user || blockingUser) return;
            setBlockingUser(true);
            try {
              await userService.blockUser(user.userId, otherUser.userId);
              toast({ title: "User blocked", description: `${otherUser.username} has been blocked` });
              setShowProfileDrawer(false);
              setTimeout(() => navigate('/messages'), 300);
            } catch (error) {
              console.error('Block error:', error);
              toast({ title: "Error", description: "Failed to block user", variant: "destructive" });
            } finally {
              setBlockingUser(false);
            }
          }}
          onUnblock={async () => {
            if (!user || blockingUser) return;
            setBlockingUser(true);
            try {
              await userService.unblockUser(user.userId, otherUser.userId);
              toast({ title: "User unblocked", description: `${otherUser.username} has been unblocked` });
              setShowProfileDrawer(false);
            } catch (error) {
              console.error('Unblock error:', error);
              toast({ title: "Error", description: "Failed to unblock user", variant: "destructive" });
            } finally {
              setBlockingUser(false);
            }
          }}
          onReport={() => {
            toast({ title: "Report submitted", description: "Thank you for keeping our community safe" });
            setShowProfileDrawer(false);
          }}
          onDelete={async () => {
            if (!user || !conversationId) return;
            try {
              await messageService.deleteConversation(conversationId, user.userId);
              toast({ title: "Chat deleted", description: "Conversation has been deleted" });
              navigate('/messages');
            } catch (error) {
              toast({ title: "Error", description: "Failed to delete chat", variant: "destructive" });
            }
          }}
        />
      )}

      {/* GIF Picker Modal */}
      <GifPickerModal
        open={showGifPicker}
        onOpenChange={setShowGifPicker}
        onSelect={async (gifUrl, type) => {
          if (!sending) {
            setSending(true);
            try {
              // Add prefix for stickers to distinguish from GIFs
              const messageText = type === 'sticker' ? `STICKER:${gifUrl}` : gifUrl;
              
              // Always use normal sendMessage - restrictedBy field handles request mode
              await sendMessage(
                messageText,
                undefined,
                replyingTo
                  ? {
                      messageId: replyingTo.messageId,
                      text: replyingTo.text || '',
                      senderId: replyingTo.senderId,
                      senderUsername: replyingTo.senderUsername,
                    }
                  : undefined
              );
              setReplyingTo(null);
            } catch (error) {
              console.error('Failed to send GIF:', error);
              toast({
                title: 'Error',
                description: 'Failed to send GIF',
                variant: 'destructive',
              });
            } finally {
              setSending(false);
            }
          }
        }}
        title="Send GIF"
      />
    </div>
  );
}
