import { Outlet, useLocation, Link } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";
import { MessageNotificationPopup } from '../chat/MessageNotificationPopup';
import { MessageCircle, Bell, Settings } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useConversations } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useBackButton } from "@/hooks/useBackButton";

export function AppShell() {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { conversations } = useConversations();
  
  // Initialize push notifications for native platforms
  usePushNotifications();
  
  // Handle Android hardware back button
  useBackButton();
  
  // Check if we're in a DM chat view
  const isDMChatView = /^\/chat\/[^/]+$/.test(location.pathname);
  
  // Check if we're on Messages or Notifications page
  const isMessagesPage = location.pathname === '/messages';
  const isNotificationsPage = location.pathname === '/notifications';
  
  // Check if viewing own profile
  const isOwnProfile = user && (location.pathname === '/me' || location.pathname === `/profile/${user.username}` || location.pathname === `/profile/${user.userId}`);
  
  // Check if we're in story/moment creation pages
  const isStoryCreation = location.pathname === '/moment-create' || 
                          location.pathname === '/story-create' || 
                          location.pathname === '/glimpse/create' ||
                          location.pathname === '/glimpse-create' ||
                          location.pathname === '/glimpse-create-new';
  
  // Check if we're viewing stories or glimpses
  const isStoryViewer = /^\/story\/[^/]+$/.test(location.pathname) || location.pathname === '/story-viewer';
  const isGlimpseViewer = /^\/glimpses\/[^/]+$/.test(location.pathname);
  const isGlimpsesPage = location.pathname === '/glimpses';
  
  // Check if we're on comments page
  const isCommentsPage = /^\/comments\/[^/]+$/.test(location.pathname);
  
  // Hide bottom nav on Messages, Notifications, DM chat, story creation, story viewer, glimpses page, glimpse viewer, and comments page
  const hideBottomNav = isDMChatView || isMessagesPage || isNotificationsPage || isStoryCreation || isStoryViewer || isGlimpseViewer || isGlimpsesPage || isCommentsPage;
  
  // Hide top bar completely in DM chat view, story creation, story viewer, glimpses page, glimpse viewer, and comments page
  const hideTopBar = isDMChatView || isStoryCreation || isStoryViewer || isGlimpseViewer || isGlimpsesPage || isCommentsPage;
  
  // Calculate unread messages count
  const unreadMessagesCount = conversations.reduce((total, conv) => {
    return total + (user ? (conv.unreadCounts[user.userId] || 0) : 0);
  }, 0);
  
  const titles: Record<string, string> = {
    "/": "Iris",
    "/search": "Explore",
    "/post/new": "Create",
    "/glimpses": "Glimpses",
    "/me": "Profile",
    "/messages": "Messages",
    "/chat/new": "New Chat",
    "/settings": "Settings",
    "/security": "Security",
    "/privacy": "Privacy",
    "/language": "Language",
    "/help": "Help Center",
    "/report": "Report",
    "/admin": "Admin",
    "/notifications": "Notifications",
  };
  const title = titles[location.pathname] ?? "Iris";
  const isHomePage = location.pathname === "/";

  return (
    <div className="mx-auto max-w-md min-h-dvh bg-background text-foreground">
      {!hideTopBar && (
        <TopBar 
          title={title} 
          showLogo={isHomePage}
          showBackButton={isMessagesPage || isNotificationsPage}
          backTo={isMessagesPage ? '/' : undefined}
          rightSlot={
            !isDMChatView && (
              <div className="flex items-center gap-3">
                {isOwnProfile ? (
                  // Show Settings icon on own profile
                  <Link to="/settings" aria-label="Settings" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Settings className="h-6 w-6" />
                  </Link>
                ) : (
                  // Show Messages and Notifications on other pages
                  <>
                    {!isMessagesPage && (
                      <Link to="/messages" aria-label="Messages" className="relative text-muted-foreground hover:text-foreground transition-colors">
                        <MessageCircle className="h-6 w-6" />
                        {unreadMessagesCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                          </span>
                        )}
                      </Link>
                    )}
                    {!isNotificationsPage && (
                      <Link to="/notifications" aria-label="Notifications" className="relative text-muted-foreground hover:text-foreground transition-colors">
                        <Bell className="h-6 w-6" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </Link>
                    )}
                  </>
                )}
              </div>
            )
          } 
        />
      )}
      <div 
        className="flex-1 overflow-y-auto" 
        style={{ paddingBottom: hideBottomNav ? '0' : '5rem' }}
      >
        <Outlet />
      </div>
      {!hideBottomNav && <BottomNav unreadMessagesCount={unreadMessagesCount} />}
    </div>
  );
}
