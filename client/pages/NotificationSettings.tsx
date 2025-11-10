import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingState } from "@/components/ui/loading-state";
import { ChevronLeft, Bell, BellOff, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationSettings } from "@/hooks/useSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NotificationSettings() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { notificationSettings, loading, updateNotificationSettings } = useNotificationSettings();
  const [muteAllNotifications, setMuteAllNotifications] = useState(false);
  const [notificationTypes, setNotificationTypes] = useState({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    messages: true,
    stories: false,
  });

  // Load notification preferences from backend
  useEffect(() => {
    if (notificationSettings) {
      setNotificationTypes({
        likes: notificationSettings.likes,
        comments: notificationSettings.comments,
        follows: notificationSettings.follows,
        mentions: notificationSettings.mentions,
        messages: notificationSettings.messages,
        stories: notificationSettings.stories,
      });
    }
  }, [notificationSettings]);

  const handleToggleMuteAll = async (checked: boolean) => {
    if (!currentUser) return;

    setMuteAllNotifications(checked);

    try {
      await updateNotificationSettings({ likes: !checked, comments: !checked, follows: !checked, mentions: !checked, messages: !checked });
      toast({
        title: checked ? "Notifications muted" : "Notifications enabled",
        description: checked ? "All notifications are now muted" : "You'll receive notifications again",
      });
    } catch (error: any) {
      setMuteAllNotifications(!checked);
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const handleToggleNotificationType = async (key: keyof typeof notificationTypes, checked: boolean) => {
    if (!currentUser) return;

    setNotificationTypes({ ...notificationTypes, [key]: checked });

    try {
      await updateNotificationSettings({ [key]: checked });
      toast({
        title: "Preference updated",
        description: `${key} notifications ${checked ? 'enabled' : 'disabled'}`,
      });
    } catch (error: any) {
      setNotificationTypes({ ...notificationTypes, [key]: !checked });
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-3 p-4">
            <Link to="/settings" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold">Notification Settings</h1>
          </div>
        </div>
        <LoadingState text="Loading notification settings..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Notification Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Global Mute */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BellOff className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold">Mute All Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Temporarily disable all notifications
                </div>
              </div>
            </div>
            <Switch
              checked={muteAllNotifications}
              onCheckedChange={handleToggleMuteAll}
            />
          </div>
        </div>

        {/* Muted Users & Posts - Link to MutedAccounts page */}
        <div>
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-sm text-muted-foreground">
              MUTED CONTENT
            </h2>
          </div>
          <Link to="/muted-accounts" className="block p-4 hover:bg-accent transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Muted Accounts</div>
                <div className="text-sm text-muted-foreground">
                  Manage muted users and their notifications
                </div>
              </div>
              <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180" />
            </div>
          </Link>
        </div>

        {/* Notification Types */}
        <div>
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-sm text-muted-foreground">
              NOTIFICATION TYPES
            </h2>
          </div>
          <div className="divide-y">
            <div className="px-4 py-3 flex items-center justify-between">
              <span>Likes</span>
              <Switch 
                checked={notificationTypes.likes}
                onCheckedChange={(checked) => handleToggleNotificationType('likes', checked)}
              />
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span>Comments</span>
              <Switch 
                checked={notificationTypes.comments}
                onCheckedChange={(checked) => handleToggleNotificationType('comments', checked)}
              />
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span>Followers</span>
              <Switch 
                checked={notificationTypes.follows}
                onCheckedChange={(checked) => handleToggleNotificationType('follows', checked)}
              />
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span>Mentions</span>
              <Switch 
                checked={notificationTypes.mentions}
                onCheckedChange={(checked) => handleToggleNotificationType('mentions', checked)}
              />
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span>Direct Messages</span>
              <Switch 
                checked={notificationTypes.messages}
                onCheckedChange={(checked) => handleToggleNotificationType('messages', checked)}
              />
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span>Story Views</span>
              <Switch 
                checked={notificationTypes.stories}
                onCheckedChange={(checked) => handleToggleNotificationType('stories', checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
