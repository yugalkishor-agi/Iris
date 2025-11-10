import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { signOut } from 'firebase/auth';
import { auth } from '../../src/config/firebase';
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User,
  Lock,
  Shield,
  Bell,
  Moon,
  Globe,
  HelpCircle,
  Flag,
  Info,
  LogOut,
  ChevronRight,
  Palette,
  Eye,
  EyeOff,
  Key,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  Briefcase,
  UserX,
  Trash2,
  Activity,
  MessageSquare,
  Share2,
  Ban,
  Volume2,
  VolumeX,
  Star,
  Smartphone,
  AlertTriangle,
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  Film,
  Vibrate,
  Sun,
  Monitor,
  Type,
  Layout,
  Sparkles,
  Languages,
  MapPin,
  Clock,
  Send,
  Check,
  Download,
  HardDrive,
  Database,
  Wifi,
  Signal,
  Zap,
  CreditCard,
  Wallet,
  Receipt,
  FileText,
  BarChart3,
  TrendingUp,
  Settings as SettingsIcon,
  RefreshCw,
  Code,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { settingsService } from "../../src/services/settings.service";
import { userService } from "../../src/services/user.service";
import { authService } from "../../src/services/auth.service";

interface SettingItem {
  label: string;
  to?: string;
  icon: any;
  description?: string;
  toggle?: boolean;
  checked?: boolean;
  danger?: boolean;
  badge?: string;
}

interface SettingSection {
  title: string;
  description?: string;
  items: SettingItem[];
}

export default function Settings() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [profileName, setProfileName] = useState<string>("Profile");
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>(undefined);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  // Notification States
  const [pushNotifications, setPushNotifications] = useState(true);
  const [likesNotif, setLikesNotif] = useState(true);
  const [commentsNotif, setCommentsNotif] = useState(true);
  const [followersNotif, setFollowersNotif] = useState(true);
  const [mentionsNotif, setMentionsNotif] = useState(true);
  
  // Privacy States
  const [privateAccount, setPrivateAccount] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [storySharing, setStorySharing] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  
  // Appearance States
  const [autoTheme, setAutoTheme] = useState(false);
  
  // Messages States
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicator, setTypingIndicator] = useState(true);
  const [vanishMode, setVanishMode] = useState(false);
  
  // Data States
  const [dataSaver, setDataSaver] = useState(false);
  const [autoSaveMedia, setAutoSaveMedia] = useState(true);

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Load initial settings and profile
  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        // Profile
        const u = await userService.getUser(currentUser.userId);
        if (u) {
          setProfileName(u.displayName || u.username);
          setProfileAvatar(u.avatarURL);
        }
        // Privacy
        const privacy = await settingsService.getPrivacySettings(currentUser.userId);
        setPrivateAccount(!!privacy.isPrivate);
        setActivityStatus(!!privacy.showActivityStatus);
        // Notifications
        const notif = await settingsService.getNotificationPreferences(currentUser.userId);
        setPushNotifications(
          notif.likes && notif.comments && notif.follows && notif.mentions && notif.messages && notif.messageRequests
        );
        setLikesNotif(!!notif.likes);
        setCommentsNotif(!!notif.comments);
        setFollowersNotif(!!notif.follows);
        setMentionsNotif(!!notif.mentions);
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };
    load();
  }, [currentUser]);

  // Handlers to persist toggles
  const getToggleHandler = (label: string) => async (checked: boolean) => {
    if (!currentUser) return;
    try {
      switch (label) {
        case 'Private Account':
          setPrivateAccount(checked);
          await settingsService.updatePrivacySettings(currentUser.userId, { isPrivate: checked });
          break;
        case 'Activity Status':
          setActivityStatus(checked);
          await settingsService.updatePrivacySettings(currentUser.userId, { 
            showActivityStatus: checked,
            hideOnlineStatus: !checked,
            hideLastSeen: !checked 
          });
          break;
        case 'Push Notifications':
          setPushNotifications(checked);
          setLikesNotif(checked);
          setCommentsNotif(checked);
          setFollowersNotif(checked);
          setMentionsNotif(checked);
          await settingsService.updateNotificationPreferences(currentUser.userId, {
            likes: checked,
            comments: checked,
            follows: checked,
            mentions: checked,
            messages: checked,
            messageRequests: checked,
          });
          break;
        case 'Likes':
          setLikesNotif(checked);
          await settingsService.updateNotificationPreferences(currentUser.userId, { likes: checked });
          break;
        case 'Comments':
          setCommentsNotif(checked);
          await settingsService.updateNotificationPreferences(currentUser.userId, { comments: checked });
          break;
        case 'New Followers':
          setFollowersNotif(checked);
          await settingsService.updateNotificationPreferences(currentUser.userId, { follows: checked });
          break;
        case 'Mentions & Tags':
          setMentionsNotif(checked);
          await settingsService.updateNotificationPreferences(currentUser.userId, { mentions: checked });
          break;
        case 'Two-Factor Authentication':
          setTwoFactorAuth(checked);
          if (checked) {
            await settingsService.enable2FA(currentUser.userId);
          } else {
            await settingsService.disable2FA(currentUser.userId);
          }
          break;
        default:
          // Local-only toggles for now
          break;
      }
    } catch (e) {
      console.error('Failed to update setting', label, e);
    }
  };

  const sections: SettingSection[] = [
    {
      title: "Account",
      description: "Manage your account settings and preferences",
      items: [
        {
          label: "Edit Profile",
          to: "/profile/edit",
          icon: User,
          description: "Name, username, bio, gender, link",
        },
        {
          label: "Change Password",
          to: "/change-password",
          icon: Key,
          description: "Update your password",
        },
        {
          label: "Personal Information",
          to: "/personal-info",
          icon: Mail,
          description: "Email, phone, birthday",
        },
        {
          label: "My Activity",
          to: "/my-activity",
          icon: Clock,
          description: "View your archived stories",
        },
        {
          label: "Account Status",
          to: "/account-status",
          icon: UserCheck,
          description: "Public account",
          badge: "Public",
        },
        {
          label: "Switch to Professional",
          to: "/professional",
          icon: Briefcase,
          description: "For creators & businesses",
        },
        {
          label: "Deactivate Account",
          to: "/deactivate",
          icon: UserX,
          description: "Temporarily disable profile",
        },
        {
          label: "Delete Account",
          to: "/delete-account",
          icon: Trash2,
          description: "Permanent deletion",
          danger: true,
        },
      ],
    },
    {
      title: "Privacy & Security",
      description: "Control who can see your content and contact you",
      items: [
        {
          label: "Close Friends",
          to: "/close-friends",
          icon: Star,
          description: "Manage your close friends list",
        },
        {
          label: "Activity Status",
          icon: Activity,
          description: "Show when you're active",
          toggle: true,
          checked: activityStatus,
        },
        {
          label: "Story Sharing",
          icon: Share2,
          description: "Allow followers to share glimpses",
          toggle: true,
          checked: storySharing,
        },
        {
          label: "Story Replies",
          to: "/story-replies",
          icon: MessageSquare,
          description: "Everyone",
        },
        {
          label: "Blocked Accounts",
          to: "/blocked",
          icon: Ban,
          description: "Manage blocked users",
          badge: "0",
        },
        {
          label: "Muted Accounts",
          to: "/muted",
          icon: VolumeX,
          description: "Manage muted users",
          badge: "0",
        },
        {
          label: "Hidden Words",
          to: "/hidden-words",
          icon: EyeOff,
          description: "Filter comments & DMs",
        },
        {
          label: "Two-Factor Authentication",
          icon: Shield,
          description: "Extra security for login",
          toggle: true,
          checked: twoFactorAuth,
        },
        {
          label: "Login Activity",
          to: "/login-activity",
          icon: Smartphone,
          description: "View recent sessions",
        },
        {
          label: "Security Alerts",
          to: "/security-alerts",
          icon: AlertTriangle,
          description: "Get notified of suspicious activity",
        },
      ],
    },
    {
      title: "Notifications",
      description: "Manage how you receive notifications",
      items: [
        {
          label: "Push Notifications",
          icon: Bell,
          description: "Global notification toggle",
          toggle: true,
          checked: pushNotifications,
        },
        {
          label: "Likes",
          icon: Heart,
          description: "When someone likes your post",
          toggle: true,
          checked: likesNotif,
        },
        {
          label: "Comments",
          icon: MessageCircle,
          description: "When someone comments",
          toggle: true,
          checked: commentsNotif,
        },
        {
          label: "New Followers",
          icon: UserPlus,
          description: "When someone follows you",
          toggle: true,
          checked: followersNotif,
        },
        {
          label: "Mentions & Tags",
          icon: AtSign,
          description: "When you're mentioned",
          toggle: true,
          checked: mentionsNotif,
        },
        {
          label: "Glimpse Updates",
          to: "/glimpse-notif",
          icon: Film,
          description: "From people you follow",
        },
        {
          label: "Sound & Vibration",
          to: "/notification-sound",
          icon: Vibrate,
          description: "Customize notification alerts",
        },
      ],
    },
    {
      title: "Appearance & Theme",
      description: "Customize how Iris looks",
      items: [
        {
          label: "Dark Mode",
          icon: Moon,
          description: "Switch between dark and light",
          toggle: true,
          checked: theme === 'dark',
        },
        {
          label: "Auto Theme",
          icon: Monitor,
          description: "Follow system settings",
          toggle: true,
          checked: autoTheme,
        },
        {
          label: "Accent Color",
          to: "/accent-color",
          icon: Palette,
          description: "Purple (default)",
        },
      ],
    },
    {
      title: "Language & Region",
      description: "Choose your language and regional preferences",
      items: [
        {
          label: "App Language",
          to: "/app-language",
          icon: Languages,
          description: "English (US)",
        },
        {
          label: "Region Preferences",
          to: "/region",
          icon: MapPin,
          description: "Show regional trends",
        },
        {
          label: "Content Translation",
          to: "/translation",
          icon: Globe,
          description: "Auto translate captions",
        },
        {
          label: "Date/Time Format",
          to: "/datetime-format",
          icon: Clock,
          description: "12-hour",
        },
      ],
    },
    {
      title: "Messages & Chats",
      description: "Control your messaging experience",
      items: [
        {
          label: "Message Requests",
          to: "/message-requests",
          icon: Send,
          description: "Approve new chat requests",
        },
        {
          label: "Read Receipts",
          icon: Check,
          description: "Show seen status",
          toggle: true,
          checked: readReceipts,
        },
        {
          label: "Typing Indicator",
          icon: MessageCircle,
          description: "Show when you're typing",
          toggle: true,
          checked: typingIndicator,
        },
        {
          label: "Vanish Mode",
          icon: Eye,
          description: "Auto delete after viewing",
          toggle: true,
          checked: vanishMode,
        },
        {
          label: "Save Chat Media",
          to: "/save-media",
          icon: Download,
          description: "Auto-save to gallery",
        },
        {
          label: "Muted Chats",
          to: "/muted-chats",
          icon: VolumeX,
          description: "View muted conversations",
          badge: "0",
        },
      ],
    },
    {
      title: "Data & Storage",
      description: "Manage data usage and storage",
      items: [
        {
          label: "Data Saver",
          icon: Signal,
          description: "Reduce data usage",
          toggle: true,
          checked: dataSaver,
        },
        {
          label: "Media Upload Quality",
          to: "/upload-quality",
          icon: Zap,
          description: "High quality",
        },
        {
          label: "Clear Cache",
          to: "/clear-cache",
          icon: Trash2,
          description: "Free up space",
        },
        {
          label: "Download Your Data",
          to: "/download-data",
          icon: Download,
          description: "Export posts & messages",
        },
        {
          label: "Storage Usage",
          to: "/storage-usage",
          icon: HardDrive,
          description: "245 MB used",
        },
      ],
    },
    {
      title: "Help & Support",
      description: "Get help when you need it",
      items: [
        {
          label: "Report a Problem",
          to: "/report",
          icon: Flag,
          description: "Send bug report or feedback",
        },
        {
          label: "Help Center",
          to: "/help",
          icon: HelpCircle,
          description: "FAQs and guides",
        },
        {
          label: "Privacy Policy",
          to: "/privacy-policy",
          icon: Shield,
          description: "How we protect your data",
        },
        {
          label: "Terms of Service",
          to: "/terms",
          icon: FileText,
          description: "User agreements",
        },
        {
          label: "Community Guidelines",
          to: "/guidelines",
          icon: Info,
          description: "Rules for users",
        },
      ],
    },
    // Advanced/Creator features hidden for now
    // {
    //   title: "Advanced",
    //   description: "For power users and creators",
    //   items: [
    //     {
    //       label: "Login Devices",
    //       to: "/devices",
    //       icon: Smartphone,
    //       description: "Manage active sessions",
    //       badge: "3",
    //     },
    //     {
    //       label: "Post Insights",
    //       to: "/post-insights",
    //       icon: BarChart3,
    //       description: "Likes, views, reach analytics",
    //     },
    //     {
    //       label: "Glimpse Performance",
    //       to: "/glimpse-analytics",
    //       icon: TrendingUp,
    //       description: "Watch-time and engagement",
    //     },
    //     {
    //       label: "Storage Optimization",
    //       to: "/storage-optimization",
    //       icon: Database,
    //       description: "Auto-delete old drafts",
    //     },
    //     {
    //       label: "Experimental Features",
    //       to: "/experimental",
    //       icon: Code,
    //       description: "Beta features and tools",
    //     },
    //   ],
    // },
  ];

  return (
    <div className="space-y-6 p-4 animate-fade-in">
      {/* Profile Summary */}
      <Card className="p-4">
        <Link to="/me" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={profileAvatar} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary text-xl font-bold">
              {profileName?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-bold text-lg truncate">{profileName}</div>
            <div className="text-sm text-muted-foreground">View your profile</div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </Card>

      {/* Settings Sections */}
      {sections.map((section, i) => (
        <div key={i}>
          <div className="mb-3 px-1">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </h2>
            {section.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
            )}
          </div>
          <Card className="divide-y">
            {section.items.map((item, j) => (
              <div key={j}>
                {item.toggle ? (
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={
                        item.label === "Dark Mode" ? theme === 'dark' :
                        item.label === "Private Account" ? privateAccount :
                        item.label === "Activity Status" ? activityStatus :
                        item.label === "Story Sharing" ? storySharing :
                        item.label === "Two-Factor Authentication" ? twoFactorAuth :
                        item.label === "Push Notifications" ? pushNotifications :
                        item.label === "Likes" ? likesNotif :
                        item.label === "Comments" ? commentsNotif :
                        item.label === "New Followers" ? followersNotif :
                        item.label === "Mentions & Tags" ? mentionsNotif :
                        item.label === "Auto Theme" ? autoTheme :
                        item.label === "Read Receipts" ? readReceipts :
                        item.label === "Typing Indicator" ? typingIndicator :
                        item.label === "Vanish Mode" ? vanishMode :
                        item.label === "Data Saver" ? dataSaver :
                        item.checked ?? false
                      }
                      onCheckedChange={async (checked) => {
                        if (item.label === 'Dark Mode') {
                          toggleTheme();
                          toast({
                            title: checked ? "Dark mode enabled" : "Light mode enabled",
                            description: "Theme updated successfully",
                          });
                        } else if (item.label === 'Auto Theme') {
                          setAutoTheme(checked);
                          toast({
                            title: checked ? "Auto theme enabled" : "Auto theme disabled",
                            description: "System theme will be followed",
                          });
                        } else if (item.label === 'Story Sharing') {
                          setStorySharing(checked);
                          if (currentUser) {
                            await settingsService.updatePrivacySettings(currentUser.userId, { allowStorySharing: checked } as any);
                            toast({
                              title: checked ? "Story sharing enabled" : "Story sharing disabled",
                              description: "Settings saved",
                            });
                          }
                        } else if (item.label === 'Read Receipts') {
                          setReadReceipts(checked);
                          if (currentUser) {
                            await settingsService.updateSettings(currentUser.userId, { readReceipts: checked } as any);
                            toast({
                              title: checked ? "Read receipts enabled" : "Read receipts disabled",
                              description: "Others can see when you read messages",
                            });
                          }
                        } else if (item.label === 'Typing Indicator') {
                          setTypingIndicator(checked);
                          if (currentUser) {
                            await settingsService.updateSettings(currentUser.userId, { typingIndicator: checked } as any);
                            toast({
                              title: checked ? "Typing indicator enabled" : "Typing indicator disabled",
                              description: "Settings saved",
                            });
                          }
                        } else if (item.label === 'Vanish Mode') {
                          setVanishMode(checked);
                          if (currentUser) {
                            await settingsService.updateSettings(currentUser.userId, { vanishMode: checked } as any);
                            toast({
                              title: checked ? "Vanish mode enabled" : "Vanish mode disabled",
                              description: "Messages will auto-delete after viewing",
                            });
                          }
                        } else if (item.label === 'Data Saver') {
                          setDataSaver(checked);
                          if (currentUser) {
                            await settingsService.updateSettings(currentUser.userId, { dataSaver: checked } as any);
                            toast({
                              title: checked ? "Data saver enabled" : "Data saver disabled",
                              description: "Media quality adjusted",
                            });
                          }
                        } else {
                          // Persist supported toggles via service
                          getToggleHandler(item.label)(checked);
                          toast({
                            title: "Settings updated",
                            description: `${item.label} ${checked ? 'enabled' : 'disabled'}`,
                          });
                        }
                      }}
                    />
                  </div>
                ) : item.to ? (
                  <Link
                    to={item.to}
                    className={`flex items-center justify-between p-4 hover:bg-accent transition-colors ${
                      item.danger ? 'hover:bg-destructive/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        item.danger ? 'bg-destructive/10' : 'bg-primary/10'
                      }`}>
                        <item.icon className={`h-5 w-5 ${
                          item.danger ? 'text-destructive' : 'text-primary'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${
                          item.danger ? 'text-destructive' : ''
                        }`}>{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Link>
                ) : null}
              </div>
            ))}
          </Card>
        </div>
      ))}

      {/* Logout Button */}
      <Card className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-auto p-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-semibold">Log Out</span>
        </Button>
      </Card>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of Iris?</AlertDialogTitle>
            <AlertDialogDescription>
              You can always log back in at any time. Are you sure you want to log out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* About Iris Section */}
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">I</span>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Iris
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Version 1.0.0</p>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Developed by <span className="font-semibold text-primary">@Utkarsh</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Made with ❤️ for sharing glimpses
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/acknowledgements">
                <Info className="h-3 w-3 mr-1" />
                Credits
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              Check Updates
            </Button>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pb-6 pt-2">
        <p>&copy; 2025 Iris. All rights reserved.</p>
      </div>
    </div>
  );
}
