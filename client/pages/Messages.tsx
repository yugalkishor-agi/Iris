import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Search, ArrowLeft, Plus, Pin, BellOff, VolumeX, Trash2, X, Edit, CheckCheck, MessageSquare, User as UserIcon } from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { messageService } from "../../src/services/message.service";
import { userService } from "../../src/services/user.service";
import { isGiphyUrl } from "@/utils/gifUtils";
import type { Conversation, User } from "../../src/types/database";
import { onSnapshot, doc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../src/config/firebase";

export default function Messages() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"chats" | "requests">("chats");
  const [swipedChat, setSwipedChat] = useState<string | null>(null);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [swipeDistance, setSwipeDistance] = useState<{[key: string]: number}>({});
  const swipeThreshold = 100;
  const maxSlideDistance = 160; // Increased to show all buttons
  const longPressTimer = useRef<number | null>(null);

  const handlePinConversation = async (conversationId: string) => {
    if (!currentUser) return;
    try {
      await messageService.pinConversation(conversationId, currentUser.userId);
      setSwipedChat(null);
      setSwipeDistance({});
    } catch (err) {
      console.error('Pin failed:', err);
    }
  };

  const handleMuteConversation = async (conversationId: string) => {
    if (!currentUser) return;
    try {
      await messageService.muteConversation(conversationId, currentUser.userId);
      setSwipedChat(null);
      setSwipeDistance({});
    } catch (err) {
      console.error('Mute failed:', err);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!currentUser) return;
    try {
      await messageService.deleteConversation(conversationId, currentUser.userId);
      setConversations(prev => prev.filter(c => c.conversationId !== conversationId));
      setSwipedChat(null);
      setSwipeDistance({});
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [conversationUsers, setConversationUsers] = useState<{ [key: string]: User }>({});
  const [requestConversations, setRequestConversations] = useState<Conversation[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const handleStartNewChat = (user: any) => {
    setSelectedUser(user);
    setShowNewMessageDialog(false);
    setUserSearchQuery('');
    setUserSearchResults([]);
    navigate(`/chat/${user.userId}`);
  };

  // Search users for new message
  useEffect(() => {
    const searchUsers = async () => {
      if (!userSearchQuery.trim() || !currentUser) {
        setUserSearchResults([]);
        return;
      }

      try {
        setSearchingUsers(true);
        const results = await userService.searchUsers(userSearchQuery);
        // Filter out current user
        const filtered = results.filter(u => u.userId !== currentUser.userId);
        setUserSearchResults(filtered);
      } catch (error) {
        console.error('Search failed:', error);
        setUserSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [userSearchQuery, currentUser]);

  // Load conversations with REAL-TIME updates
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    
    // Real-time Firestore listener
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participantIds', 'array-contains', currentUser.userId)
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const convos = snapshot.docs.map(doc => ({
          conversationId: doc.id,
          ...doc.data()
        })) as Conversation[];
        
        // Filter deleted and restricted conversations
        // Show in CHATS if:
        // 1. Not deleted by user
        // 2. User is NOT in restrictedBy array (or restrictedBy is empty/undefined)
        console.log('🔍 Filtering conversations for CHATS:', {
          totalConvos: convos.length,
          currentUserId: currentUser.userId
        });
        
        const activeConvos = convos.filter(c => {
          const isDeleted = c.deletedBy?.includes(currentUser.userId);
          const restrictedByArray = c.restrictedBy || [];
          const isRestricted = restrictedByArray.includes(currentUser.userId);
          const shouldShow = !isDeleted && !isRestricted;
          
          console.log(`  📨 Convo ${c.conversationId.substring(0, 8)}:`, {
            restrictedBy: restrictedByArray,
            restrictedByLength: restrictedByArray.length,
            isDeleted,
            isRestricted,
            shouldShow: shouldShow ? '✅ SHOW IN CHATS' : '❌ HIDE FROM CHATS'
          });
          
          return shouldShow;
        });
        
        // Sort by time (most recent first)
        activeConvos.sort((a, b) => {
          const aTime = a.lastMessageAt?.seconds || a.createdAt?.seconds || 0;
          const bTime = b.lastMessageAt?.seconds || b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        
        // Set conversations immediately for instant UI update
        setConversations([...activeConvos]);
        
        // Load other users' data for each conversation asynchronously
        const usersMap: { [key: string]: User } = {};
        for (const convo of activeConvos) {
          if (convo.type === 'direct') {
            const otherUserId = convo.participantIds.find(id => id !== currentUser.userId);
            if (otherUserId) {
              const userData = await userService.getUser(otherUserId);
              if (userData) {
                usersMap[convo.conversationId] = userData;
              }
            }
          }
        }
        // Update user data separately to avoid blocking conversation updates
        setConversationUsers(prev => ({ ...prev, ...usersMap }));
        setLoading(false);
        
        // Real-time active users
        const following = await userService.getFollowing(currentUser.userId);
        const limited = following.slice(0, 20);
        const unsubs: Array<() => void> = [];
        limited.forEach((uid) => {
          const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
            if (!snap.exists()) return;
            const data = snap.data() as any;
            const nextUser: User = {
              userId: uid,
              username: data.username,
              displayName: data.displayName,
              avatarURL: data.avatarURL,
              isOnline: data.isOnline === true,
              lastSeen: data.lastSeen,
            } as any;

            setActiveUsers((prev) => {
              const without = prev.filter(u => u.userId !== uid);
              if (nextUser.isOnline) {
                return [...without, nextUser];
              } else {
                return without;
              }
            });
          });
          unsubs.push(unsub);
        });

        return () => {
          unsubs.forEach((u) => u());
        };
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Load request conversations (conversations where current user is in restrictedBy)
  useEffect(() => {
    const loadRequests = async () => {
      if (!currentUser) return;
      try {
        setLoadingRequests(true);
        
        // Get conversations that are restricted for current user
        const q = query(
          collection(db, 'conversations'),
          where('participantIds', 'array-contains', currentUser.userId)
        );
        const snapshot = await getDocs(q);
        
        // Filter conversations where current user is in restrictedBy array
        // Show in REQUESTS only if user IS in restrictedBy array
        console.log('🔍 Filtering conversations for REQUESTS:', {
          currentUserId: currentUser.userId
        });
        
        const restrictedConvos = snapshot.docs
          .map(doc => ({ conversationId: doc.id, ...doc.data() } as Conversation))
          .filter(c => {
            const restrictedByArray = c.restrictedBy || [];
            const isRestricted = restrictedByArray.includes(currentUser.userId);
            
            console.log(`  📨 Convo ${c.conversationId.substring(0, 8)}:`, {
              restrictedBy: restrictedByArray,
              restrictedByLength: restrictedByArray.length,
              isRestricted,
              shouldShowInRequests: isRestricted ? '✅ SHOW IN REQUESTS' : '❌ ACCEPTED - MOVED TO CHATS'
            });
            
            return isRestricted;
          });
        
        // Sort by most recent
        restrictedConvos.sort((a, b) => {
          const aTime = a.lastMessageAt?.seconds || a.createdAt?.seconds || 0;
          const bTime = b.lastMessageAt?.seconds || b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        
        setRequestConversations(restrictedConvos);
        
        // Load user data for each request conversation
        for (const convo of restrictedConvos) {
          const otherUserId = convo.participantIds.find(id => id !== currentUser.userId);
          if (otherUserId && !conversationUsers[convo.conversationId]) {
            const userData = await userService.getUser(otherUserId);
            if (userData) {
              setConversationUsers(prev => ({
                ...prev,
                [convo.conversationId]: userData
              }));
            }
          }
        }
      } catch (e) {
        console.error('Failed to load request conversations', e);
      } finally {
        setLoadingRequests(false);
      }
    };
    loadRequests();
  }, [currentUser]);

  const filteredConversations = conversations
    .filter((convo) => {
      const otherUser = conversationUsers[convo.conversationId];
      const searchLower = searchQuery.toLowerCase();
      return (
        otherUser?.displayName?.toLowerCase().includes(searchLower) ||
        otherUser?.username?.toLowerCase().includes(searchLower) ||
        convo.lastMessage?.text?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Sort pinned chats to the top
      const aPinned = a.pinnedBy?.[currentUser?.userId || '']?.isPinned || false;
      const bPinned = b.pinnedBy?.[currentUser?.userId || '']?.isPinned || false;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      // Then sort by last message time
      const aTime = a.lastMessageAt?.seconds || 0;
      const bTime = b.lastMessageAt?.seconds || 0;
      return bTime - aTime;
    });

  if (loading) {
    return <LoadingState text="Loading messages..." />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-gradient-to-b from-background via-background to-primary/5 relative">
      {/* Header with Modern Design */}
      <div className="px-4 pt-6 pb-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-b border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
              Messages
            </h1>
            <p className="text-xs text-muted-foreground font-medium">Stay connected with friends</p>
          </div>
          <button
            onClick={() => setShowNewMessageDialog(true)}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <Edit className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-muted/50 border-0 rounded-full focus-visible:ring-2 focus-visible:ring-primary/50"
          />
        </div>
      </div>

      {/* Tabs with Modern Style */}
      <div className="flex gap-2 px-4 mb-2">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all ${
            activeTab === "chats"
              ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-md"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all flex items-center justify-center gap-2 ${
            activeTab === "requests"
              ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-md"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          Requests
          {requestConversations.length > 0 && (
            <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {requestConversations.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Active Users - Horizontal Scroll with Glow */}
      {activeUsers.length > 0 && (
        <div className="px-4 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-muted-foreground">Active Now</h3>
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {activeUsers.map((user) => (
              <Link
                key={user.userId}
                to={`/chat/${user.userId}`}
                className="flex flex-col items-center gap-2 min-w-[68px] group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity" />
                  <Avatar className="h-16 w-16 ring-2 ring-primary/30 group-hover:ring-primary transition-all relative">
                    <AvatarImage src={user.avatarURL} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-bold">
                      {user.displayName?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-3 border-background shadow-lg" />
                </div>
                <span className="text-xs font-medium truncate max-w-[68px] group-hover:text-primary transition-colors">
                  {user.displayName?.split(' ')[0] || user.username}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Chat List / Requests */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' ? (
          filteredConversations.length > 0 ? (
          <div>
            {filteredConversations.map((conversation, index) => {
              const unreadCount = currentUser ? conversation.unreadCounts[currentUser.userId] || 0 : 0;
              const isGroup = conversation.type === 'group';
              const otherUser = conversationUsers[conversation.conversationId];
              const isMuted = currentUser ? conversation.mutedBy?.[currentUser.userId]?.isMuted : false;
              
              // Get other user's ID for fallback
              const otherUserId = conversation.participantIds.find(id => id !== currentUser?.userId);
              
              const displayName = isGroup 
                ? conversation.groupName 
                : (otherUser?.displayName || otherUser?.username || `@${otherUserId?.substring(0, 8) || 'User'}`);
              const displayAvatar = isGroup ? conversation.groupAvatarURL : otherUser?.avatarURL;
              
              // Format last message time
              const getTimeAgo = (timestamp: any) => {
                if (!timestamp) return '';
                const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
                if (seconds < 60) return 'now';
                if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
                if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
                if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
                return `${Math.floor(seconds / 604800)}w ago`;
              };
              
              const timeAgo = getTimeAgo(conversation.lastMessageAt);
              const unreadDisplay = unreadCount > 5 ? '5+' : unreadCount > 0 ? unreadCount.toString() : '';
              
              // Smart message preview - show "GIF 🎬" or "Sticker 🎨"
              let lastMessagePreview = 'No messages yet';
              const lastMsg = conversation.lastMessage;
              
              if (lastMsg?.text) {
                // Check if it's a sticker (has STICKER: prefix)
                if (lastMsg.text.startsWith('STICKER:')) {
                  lastMessagePreview = 'Sticker 🎨';
                } else if (isGiphyUrl(lastMsg.text)) {
                  lastMessagePreview = 'GIF 🎬';
                } else {
                  lastMessagePreview = lastMsg.text.slice(0, 35);
                }
              }
              
              const currentSwipe = swipeDistance[conversation.conversationId] || 0;
              const isOpen = swipedChat === conversation.conversationId;
              
              return (
                <div 
                  key={conversation.conversationId}
                  className="relative overflow-hidden"
                  style={{ animation: `fade-in 0.3s ease-out ${index * 0.05}s both` }}
                >
                  {/* Swipe Action Buttons - Behind */}
                  <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 px-3 bg-gradient-to-l from-red-500/10 to-transparent z-10">
                    <button 
                      className="p-2.5 bg-primary/20 rounded-full hover:bg-primary/30 transition-colors active:scale-95 touch-manipulation"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await handlePinConversation(conversation.conversationId);
                      }}
                      title="Pin"
                    >
                      <Pin className="h-4 w-4 text-primary" />
                    </button>
                    <button 
                      className="p-2.5 bg-blue-500/20 rounded-full hover:bg-blue-500/30 transition-colors active:scale-95 touch-manipulation"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (currentUser && confirm('Move this chat to requests?')) {
                          try {
                            // Move conversation to requests (implementation needed in service)
                            await messageService.moveConversationToRequests(conversation.conversationId, currentUser.userId);
                            setConversations(prev => prev.filter(c => c.conversationId !== conversation.conversationId));
                          } catch (err) {
                            console.error('Move to requests failed:', err);
                          }
                        }
                        setSwipedChat(null);
                        setSwipeDistance({});
                      }}
                      title="Move to Requests"
                    >
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                    </button>
                    <button 
                      className="p-2.5 bg-yellow-500/20 rounded-full hover:bg-yellow-500/30 transition-colors active:scale-95 touch-manipulation"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          await handleMuteConversation(conversation.conversationId);
                        } catch (err) {
                          console.error('Mute failed:', err);
                        }
                      }}
                      title="Mute"
                    >
                      <VolumeX className="h-4 w-4 text-yellow-600" />
                    </button>
                    <button 
                      className="p-2.5 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors active:scale-95 touch-manipulation"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (currentUser && confirm('Delete this chat?')) {
                          try {
                            await messageService.deleteConversation(conversation.conversationId, currentUser.userId);
                            setConversations(prev => prev.filter(c => c.conversationId !== conversation.conversationId));
                          } catch (err) {
                            console.error('Delete failed:', err);
                          }
                        }
                        setSwipedChat(null);
                        setSwipeDistance({});
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                  
                  <Link
                    to={`/chat/${isGroup ? conversation.conversationId : (conversationUsers[conversation.conversationId]?.userId || conversation.conversationId)}`}
                    className={`flex items-center gap-3 p-4 hover:bg-gradient-to-r hover:from-primary/5 hover:to-purple-500/5 transition-all border-b hover:border-primary/30 active:scale-[0.98] relative z-20 group ${
                      isMuted 
                        ? 'bg-yellow-500/10 border-yellow-500/40 opacity-75' 
                        : 'bg-background border-border/50'
                    }`}
                    style={{
                      transform: isOpen ? `translateX(-${maxSlideDistance}px)` : `translateX(-${currentSwipe}px)`,
                      transition: isOpen || currentSwipe === 0 ? 'transform 0.3s ease-out' : 'none'
                    }}
                    onTouchStart={(e) => {
                      setSwipeStartX(e.touches[0].clientX);
                      // cancel any open row if touching a different row
                      if (swipedChat && swipedChat !== conversation.conversationId) setSwipedChat(null);
                    }}
                    onTouchMove={(e) => {
                      const distance = swipeStartX - e.touches[0].clientX;
                      if (distance > 0 && distance < 200) {
                        setSwipeDistance(prev => ({ ...prev, [conversation.conversationId]: distance }));
                      }
                    }}
                    onTouchEnd={() => {
                      if (currentSwipe >= swipeThreshold) {
                        setSwipedChat(conversation.conversationId);
                      }
                      setSwipeDistance(prev => ({ ...prev, [conversation.conversationId]: 0 }));
                    }}
                    onClick={(e) => {
                      // Prevent navigation when actions are open
                      if (isOpen) {
                        e.preventDefault();
                        // tapping the row closes it
                        setSwipedChat(null);
                      }
                    }}
                    onContextMenu={(e) => {
                      // long press/right click to open actions on desktop
                      e.preventDefault();
                      setSwipedChat(conversation.conversationId);
                    }}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-14 w-14 ring-2 ring-background shadow-md">
                          <AvatarImage src={displayAvatar} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                            {displayName?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online indicator: show only when the other user is actually online */}
                        {!isGroup && otherUser?.isOnline && (
                          <span
                            className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.25)]"
                            aria-label="Active now"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pt-1">
                        <div className="font-semibold text-sm truncate flex items-center gap-1">
                          {displayName}
                          {!isGroup && otherUser?.verified && <VerifiedBadge size="sm" />}
                          {conversation.pinnedBy?.includes(currentUser?.userId || '') && (
                            <Pin className="h-3.5 w-3.5 text-primary fill-primary" />
                          )}
                          {conversation.mutedBy?.includes(currentUser?.userId || '') && (
                            <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          {isMuted && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 gap-1 bg-yellow-500/30 text-yellow-700 dark:text-yellow-300 border border-yellow-500/40 flex-shrink-0">
                              <BellOff className="h-3 w-3" />
                              MUTED
                            </Badge>
                          )}
                          {conversation.lastMessage?.senderId === currentUser?.userId && (
                            <CheckCheck className="h-3 w-3 flex-shrink-0" />
                          )}
                          <span className="truncate">{lastMessagePreview}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-start gap-1 flex-shrink-0 pt-1">
                        {unreadDisplay && (
                          <div className="min-w-[20px] h-5 px-2 bg-gradient-to-r from-primary to-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(14,165,233,0.4)]">
                            <span className="text-xs font-bold text-white">{unreadDisplay}</span>
                          </div>
                        )}
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{timeAgo}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No messages yet"
              description="Start a conversation with someone!"
              variant="colorful"
            />
          )
        ) : (
          <div className="px-4 space-y-2">
            {loadingRequests ? (
              <LoadingState text="Loading requests..." />
            ) : requestConversations.length > 0 ? (
              requestConversations.map((convo) => {
                const otherUser = conversationUsers[convo.conversationId];
                const otherUserId = convo.participantIds.find(id => id !== currentUser?.userId);
                const unreadCount = convo.unreadCounts?.[currentUser?.userId || ''] || 0;
                
                return (
                <div key={convo.conversationId} className="border rounded-xl bg-background/60 overflow-hidden">
                  {/* User Info Section - Clickable to view messages */}
                  <div 
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => navigate(`/chat/${otherUserId}?requestPreview=true&conversationId=${convo.conversationId}`)}
                  >
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={otherUser?.avatarURL} />
                      <AvatarFallback>{(otherUser?.username?.[0] || '?').toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate flex items-center gap-1">
                        {otherUser?.displayName || otherUser?.username || 'Unknown'}
                        {otherUser?.verified && <VerifiedBadge size="sm" />}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {convo.lastMessage?.text?.startsWith('STICKER:') ? 'Sticker 🎨' : 
                         isGiphyUrl(convo.lastMessage?.text || '') ? 'GIF 🎬' : convo.lastMessage?.text || 'Message'}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Wants to send you a message • {unreadCount} {unreadCount === 1 ? 'message' : 'messages'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Not shown here, shown in chat preview */}
                </div>
                );
              })
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No requests"
                description="Message requests from people you don’t follow will appear here."
                variant="colorful"
              />
            )}
          </div>
        )}
      </div>

      {/* New Message Dialog */}
      {showNewMessageDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-background w-full sm:max-w-md sm:rounded-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">New Message</h2>
              <button
                onClick={() => {
                  setShowNewMessageDialog(false);
                  setUserSearchQuery('');
                  setUserSearchResults([]);
                }}
                className="p-2 hover:bg-accent rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search people..."
                  className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {searchingUsers ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : userSearchResults.length > 0 ? (
                <div className="divide-y">
                  {userSearchResults.map((user) => (
                    <button
                      key={user.userId}
                      onClick={() => handleStartNewChat(user)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-accent transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatarURL} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-bold">
                          {user.displayName?.[0] || user.username?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">
                            {user.displayName || user.username}
                          </span>
                          {user.verified && <VerifiedBadge size="sm" />}
                        </div>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : userSearchQuery.trim() ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Search for users to start a conversation
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
