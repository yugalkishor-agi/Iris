import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { ChevronLeft, Lock, Eye, Users, MessageCircle, Bell, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePrivacySettings } from "@/hooks/useSettings";
import { settingsService } from "../../src/services/settings.service";

export default function PrivacySettings() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { privacySettings, loading, updatePrivacySettings } = usePrivacySettings();
  const [settings, setSettings] = useState({
    privateAccount: false,
    hideLastSeen: false,
    hideOnlineStatus: false,
    readReceipts: true,
    profileVisibility: "everyone",
    storyVisibility: "followers",
    messagePermission: "everyone",
    tagPermission: "everyone",
    commentPermission: "everyone",
    shareLocation: false,
    activityStatus: true,
    hideLikeCounts: false,
  });

  // Load privacy settings from backend
  useEffect(() => {
    if (privacySettings) {
      setSettings({
        privateAccount: privacySettings.isPrivate || false,
        hideLastSeen: !privacySettings.showActivityStatus,
        hideOnlineStatus: !privacySettings.showActivityStatus,
        readReceipts: privacySettings.showReadReceipts !== false,
        profileVisibility: privacySettings.profileVisibility || "everyone",
        storyVisibility: privacySettings.whoCanSeeStories || "followers",
        messagePermission: privacySettings.whoCanMessage || "everyone",
        tagPermission: privacySettings.whoCanTag || "everyone",
        commentPermission: privacySettings.whoCanComment || "everyone",
        shareLocation: privacySettings.shareLocation || false,
        activityStatus: privacySettings.showActivityStatus !== false,
        hideLikeCounts: privacySettings.hideLikeCounts || false,
      });
    }
  }, [privacySettings]);

  const handleToggle = async (key: keyof typeof settings) => {
    if (!currentUser) return;

    const newValue = !settings[key];
    setSettings({ ...settings, [key]: newValue });

    try {
      // Map UI keys to backend fields
      const payload: any = {};
      switch (key) {
        case 'privateAccount':
          payload.isPrivate = newValue;
          break;
        case 'activityStatus':
          payload.showActivityStatus = newValue;
          break;
        case 'hideLastSeen':
          payload.hideLastSeen = newValue;
          break;
        case 'hideOnlineStatus':
          payload.hideOnlineStatus = newValue;
          break;
        case 'readReceipts':
          payload.showReadReceipts = newValue;
          break;
        case 'shareLocation':
          payload.shareLocation = newValue;
          break;
        case 'hideLikeCounts':
          payload.hideLikeCounts = newValue;
          break;
        default:
          break;
      }
      await updatePrivacySettings(payload);
      toast({
        title: "Setting updated",
        description: "Your privacy settings have been saved.",
      });
    } catch (error: any) {
      // Revert on error
      setSettings({ ...settings, [key]: !newValue });
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const handleSelectChange = async (key: keyof typeof settings, value: string) => {
    if (!currentUser) return;

    const oldValue = settings[key];
    setSettings({ ...settings, [key]: value });

    try {
      const payload: any = {};
      switch (key) {
        case 'profileVisibility':
          payload.profileVisibility = value;
          break;
        case 'storyVisibility':
          payload.whoCanSeeStories = value;
          break;
        case 'messagePermission':
          payload.whoCanMessage = value;
          break;
        case 'tagPermission':
          payload.whoCanTag = value;
          break;
        case 'commentPermission':
          payload.whoCanComment = value;
          break;
        default:
          break;
      }
      await updatePrivacySettings(payload);
      toast({
        title: "Setting updated",
        description: "Your privacy settings have been saved.",
      });
    } catch (error: any) {
      // Revert on error
      setSettings({ ...settings, [key]: oldValue });
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
            <h1 className="text-lg font-semibold">Privacy Settings</h1>
          </div>
        </div>
        <LoadingState text="Loading privacy settings..." />
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
          <h1 className="text-lg font-semibold">Privacy Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Account Privacy */}
        <div>
          <div className="px-4 py-3 border-b bg-muted/30">
            <h2 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4" />
              ACCOUNT PRIVACY
            </h2>
          </div>
          
          <div className="divide-y">
            <div className="px-4 py-4 flex items-center justify-between hover:bg-accent transition-colors">
              <div className="flex-1">
                <div className="font-medium">Private Account</div>
                <div className="text-sm text-muted-foreground">
                  Only approved followers can see your posts
                </div>
              </div>
              <Switch
                checked={settings.privateAccount}
                onCheckedChange={() => handleToggle("privateAccount")}
              />
            </div>

            <div className="px-4 py-4 flex items-center justify-between hover:bg-accent transition-colors">
              <div className="flex-1">
                <div className="font-medium">Activity Status</div>
                <div className="text-sm text-muted-foreground">
                  Show when you're active on Iris
                </div>
              </div>
              <Switch
                checked={settings.activityStatus}
                onCheckedChange={() => handleToggle("activityStatus")}
              />
            </div>
          </div>
        </div>

        {/* Online Status */}
        <div className="mt-6">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h2 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              ONLINE STATUS
            </h2>
          </div>
          
          <div className="divide-y">
            <div className="px-4 py-4 flex items-center justify-between hover:bg-accent transition-colors">
              <div className="flex-1">
                <div className="font-medium">Hide Last Seen</div>
                <div className="text-sm text-muted-foreground">
                  Don't show when you were last active
                </div>
              </div>
              <Switch
                checked={settings.hideLastSeen}
                onCheckedChange={() => handleToggle("hideLastSeen")}
              />
            </div>

            <div className="px-4 py-4 flex items-center justify-between hover:bg-accent transition-colors">
              <div className="flex-1">
                <div className="font-medium">Hide Online Status</div>
                <div className="text-sm text-muted-foreground">
                  Don't show when you're currently online
                </div>
              </div>
              <Switch
                checked={settings.hideOnlineStatus}
                onCheckedChange={() => handleToggle("hideOnlineStatus")}
              />
            </div>

            <div className="px-4 py-4 flex items-center justify-between hover:bg-accent transition-colors">
              <div className="flex-1">
                <div className="font-medium">Read Receipts</div>
                <div className="text-sm text-muted-foreground">
                  Show when you've read messages
                </div>
              </div>
              <Switch
                checked={settings.readReceipts}
                onCheckedChange={() => handleToggle("readReceipts")}
              />
            </div>
          </div>
        </div>

        {/* Content Visibility */}
        <div className="mt-6">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h2 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              CONTENT VISIBILITY
            </h2>
          </div>
          
          <div className="divide-y">
            <div className="px-4 py-4 hover:bg-accent transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Profile Visibility</div>
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                Who can view your profile
              </div>
              <Select
                value={settings.profileVisibility}
                onValueChange={(value) => handleSelectChange("profileVisibility", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="followers">Followers Only</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="px-4 py-4 hover:bg-accent transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Story Visibility</div>
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                Who can see your stories
              </div>
              <Select
                value={settings.storyVisibility}
                onValueChange={(value) => handleSelectChange("storyVisibility", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="followers">Followers Only</SelectItem>
                  <SelectItem value="close-friends">Close Friends</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Interactions */}
        <div className="mt-6">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h2 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              INTERACTIONS
            </h2>
          </div>
          
          <div className="divide-y">
            <div className="px-4 py-4 hover:bg-accent transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Message Requests</div>
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                Who can send you messages
              </div>
              <Select
                value={settings.messagePermission}
                onValueChange={(value) => handleSelectChange("messagePermission", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="followers">Followers Only</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="px-4 py-4 hover:bg-accent transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Tags & Mentions</div>
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                Who can tag you in posts
              </div>
              <Select
                value={settings.tagPermission}
                onValueChange={(value) => handleSelectChange("tagPermission", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="followers">Followers Only</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="px-4 py-4 hover:bg-accent transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Comments</div>
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                Who can comment on your posts
              </div>
              <Select
                value={settings.commentPermission}
                onValueChange={(value) => handleSelectChange("commentPermission", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="followers">Followers Only</SelectItem>
                  <SelectItem value="nobody">Turn Off Comments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="px-4 py-4 flex items-center justify-between hover:bg-accent transition-colors">
              <div className="flex-1">
                <div className="font-medium">Hide Like & View Counts</div>
                <div className="text-sm text-muted-foreground">
                  Only you will see like and view counts on your posts
                </div>
              </div>
              <Switch
                checked={settings.hideLikeCounts}
                onCheckedChange={() => handleToggle("hideLikeCounts")}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="mt-6 mb-6">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h2 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              LOCATION
            </h2>
          </div>
          
          <div className="divide-y">
            <div className="px-4 py-4 flex items-center justify-between hover:bg-accent transition-colors">
              <div className="flex-1">
                <div className="font-medium">Share Location</div>
                <div className="text-sm text-muted-foreground">
                  Allow Iris to access your location
                </div>
              </div>
              <Switch
                checked={settings.shareLocation}
                onCheckedChange={() => handleToggle("shareLocation")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
