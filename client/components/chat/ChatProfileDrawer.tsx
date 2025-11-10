import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../../src/services/user.service';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  User,
  Palette,
  Timer,
  Users,
  Bell,
  BellOff,
  Ban,
  Flag,
  Trash2,
  Upload,
  Image as ImageIcon,
  Check,
  Loader2,
  Pin,
} from 'lucide-react';
import { pixabayService } from '../../../src/services/pixabay.service';

interface ChatProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUser: {
    userId: string;
    username: string;
    displayName?: string;
    avatarURL?: string;
    verified?: boolean;
    bio?: string;
  };
  onViewProfile: () => void;
  onCreateGroup: () => void;
  onMute: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onReport: () => void;
  onDelete: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  isPinned?: boolean;
  isMuted?: boolean;
  conversationId?: string;
}

const WALLPAPER_COLORS = [
  { name: 'Default', value: 'default', gradient: 'bg-background' },
  { name: 'Ocean', value: 'ocean', gradient: 'bg-gradient-to-br from-blue-400 to-cyan-300' },
  { name: 'Sunset', value: 'sunset', gradient: 'bg-gradient-to-br from-orange-400 to-pink-400' },
  { name: 'Forest', value: 'forest', gradient: 'bg-gradient-to-br from-green-400 to-emerald-300' },
  { name: 'Purple', value: 'purple', gradient: 'bg-gradient-to-br from-purple-400 to-pink-300' },
  { name: 'Dark', value: 'dark', gradient: 'bg-gradient-to-br from-gray-800 to-gray-900' },
];

const DISAPPEARING_TIMERS = [
  { label: 'Off', value: 'off' },
  { label: '24 hours', value: '24h' },
  { label: '7 days', value: '7d' },
  { label: '90 days', value: '90d' },
];


export function ChatProfileDrawer({
  open,
  onOpenChange,
  otherUser,
  onViewProfile,
  onCreateGroup,
  onMute,
  onBlock,
  onUnblock,
  onReport,
  onDelete,
  onPin,
  onUnpin,
  isPinned = false,
  isMuted = false,
  conversationId,
}: ChatProfileDrawerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showWallpaperDialog, setShowWallpaperDialog] = useState(false);
  const [showDisappearingDialog, setShowDisappearingDialog] = useState(false);
  const [selectedWallpaper, setSelectedWallpaper] = useState('default');
  const [customWallpaper, setCustomWallpaper] = useState<string | null>(null);
  const [disappearingTimer, setDisappearingTimer] = useState('off');
  const [wallpaperTab, setWallpaperTab] = useState<'colors' | 'images' | 'custom'>('colors');
  const [pixabayWallpapers, setPixabayWallpapers] = useState<any[]>([]);
  const [loadingWallpapers, setLoadingWallpapers] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Check if user is blocked
  useEffect(() => {
    const checkBlocked = async () => {
      if (!user || !open) return;
      try {
        const blocked = await userService.isBlocked(user.userId, otherUser.userId);
        setIsBlocked(blocked);
      } catch (error) {
        console.error('Failed to check blocked status:', error);
      }
    };
    checkBlocked();
  }, [user, otherUser.userId, open]);

  // Load Pixabay wallpapers when wallpaper dialog opens
  useEffect(() => {
    if (showWallpaperDialog && wallpaperTab === 'images' && pixabayWallpapers.length === 0) {
      loadPixabayWallpapers();
    }
  }, [showWallpaperDialog, wallpaperTab]);

  const loadPixabayWallpapers = async () => {
    setLoadingWallpapers(true);
    try {
      const wallpapers = await pixabayService.getCuratedWallpapers();
      setPixabayWallpapers(wallpapers);
    } catch (error) {
      console.error('Failed to load Pixabay wallpapers:', error);
    } finally {
      setLoadingWallpapers(false);
    }
  };

  const handleWallpaperSelect = (value: string) => {
    setSelectedWallpaper(value);
    setCustomWallpaper(null);
    localStorage.setItem(`chat-wallpaper-${otherUser.userId}`, value);
  };

  const handleCustomWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCustomWallpaper(result);
        setSelectedWallpaper('custom');
        localStorage.setItem(`chat-wallpaper-${otherUser.userId}`, 'custom');
        localStorage.setItem(`chat-custom-wallpaper-${otherUser.userId}`, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAPIWallpaperSelect = async (imageUrl: string, imageId: string) => {
    // Cache the image locally using Pixabay service
    try {
      const cachedImage = await pixabayService.getCachedImage(imageUrl, imageId);
      setCustomWallpaper(cachedImage);
      setSelectedWallpaper('custom');
      localStorage.setItem(`chat-wallpaper-${otherUser.userId}`, 'custom');
      localStorage.setItem(`chat-custom-wallpaper-${otherUser.userId}`, cachedImage);
      setShowWallpaperDialog(false);
    } catch (error) {
      console.error('Failed to cache wallpaper:', error);
    }
  };

  const handleDisappearingSelect = (value: string) => {
    setDisappearingTimer(value);
    localStorage.setItem(`chat-disappearing-${otherUser.userId}`, value);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Chat Info</SheetTitle>
            <SheetDescription>
              View profile, customize chat settings, and manage conversation
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {/* User Profile Section */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                <AvatarImage src={otherUser.avatarURL} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                  {otherUser.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <h3 className="font-semibold text-lg">{otherUser.displayName || otherUser.username}</h3>
                  {otherUser.verified && <VerifiedBadge />}
                </div>
                <p className="text-sm text-muted-foreground">@{otherUser.username}</p>
                {otherUser.bio && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs">{otherUser.bio}</p>
                )}
              </div>

              <Button 
                onClick={onViewProfile}
                className="w-full max-w-xs"
                variant="outline"
              >
                <User className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </div>

            <Separator />

            {/* Chat Settings */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Chat Settings
              </h4>

              {/* Wallpaper */}
              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-3"
                onClick={() => setShowWallpaperDialog(true)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Wallpaper & Theme</div>
                    <div className="text-xs text-muted-foreground">Customize chat background</div>
                  </div>
                </div>
              </Button>

              {/* Disappearing Messages */}
              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-3"
                onClick={() => setShowDisappearingDialog(true)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Timer className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Disappearing Messages</div>
                    <div className="text-xs text-muted-foreground">
                      {disappearingTimer === 'off' ? 'Off' : `${disappearingTimer}`}
                    </div>
                  </div>
                </div>
              </Button>

              {/* Create Group */}
              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-3"
                onClick={onCreateGroup}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Create Group with {otherUser.username}</div>
                    <div className="text-xs text-muted-foreground">Add more people to chat</div>
                  </div>
                </div>
              </Button>

              {/* Pin/Unpin Chat */}
              {isPinned ? (
                <button
                  onClick={onUnpin}
                  className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors"
                >
                  <Pin className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium">Unpin Chat</span>
                </button>
              ) : (
                <button
                  onClick={onPin}
                  className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors"
                >
                  <Pin className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Pin Chat</span>
                </button>
              )}

              {/* Mute/Unmute Notifications */}
              {isMuted ? (
                <button
                  onClick={onMute}
                  className="flex items-center gap-3 p-3 hover:bg-green-500/10 rounded-lg transition-colors bg-yellow-500/10 border border-yellow-500/30"
                >
                  <BellOff className="h-5 w-5 text-yellow-600" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-yellow-600">Currently Muted</div>
                    <div className="text-xs text-muted-foreground">Tap to unmute notifications</div>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">Muted</Badge>
                </button>
              ) : (
                <button
                  onClick={onMute}
                  className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors"
                >
                  <Bell className="h-5 w-5 text-blue-600" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">Notifications On</div>
                    <div className="text-xs text-muted-foreground">Tap to mute notifications</div>
                  </div>
                </button>
              )}

              {/* Block/Unblock User */}
              {isBlocked ? (
                <button
                  onClick={onUnblock}
                  className="flex items-center gap-3 p-3 hover:bg-green-500/10 rounded-lg transition-colors group"
                >
                  <Ban className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-green-600">Unblock User</span>
                </button>
              ) : (
                <button
                  onClick={onBlock}
                  className="flex items-center gap-3 p-3 hover:bg-destructive/10 rounded-lg transition-colors group"
                >
                  <Ban className="h-5 w-5 text-destructive group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-destructive">Block User</span>
                </button>
              )}

              {/* Mute */}
              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-3"
                onClick={onMute}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <BellOff className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Mute Notifications</div>
                    <div className="text-xs text-muted-foreground">Stop receiving alerts</div>
                  </div>
                </div>
              </Button>
            </div>

            <Separator />

            {/* Danger Zone */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Danger Zone
              </h4>

              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={onBlock}
              >
                <Ban className="h-5 w-5 mr-3" />
                <span>Block {otherUser.username}</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={onReport}
              >
                <Flag className="h-5 w-5 mr-3" />
                <span>Report</span>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start h-auto py-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={onDelete}
              >
                <Trash2 className="h-5 w-5 mr-3" />
                <span>Delete Chat</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Wallpaper Dialog */}
      <Dialog open={showWallpaperDialog} onOpenChange={setShowWallpaperDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Wallpaper</DialogTitle>
            <DialogDescription>Customize your chat background</DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setWallpaperTab('colors')}
              className={`px-4 py-2 font-medium transition-colors ${
                wallpaperTab === 'colors'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Colors
            </button>
            <button
              onClick={() => setWallpaperTab('images')}
              className={`px-4 py-2 font-medium transition-colors ${
                wallpaperTab === 'images'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Gallery
            </button>
            <button
              onClick={() => setWallpaperTab('custom')}
              className={`px-4 py-2 font-medium transition-colors ${
                wallpaperTab === 'custom'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Colors Tab */}
          {wallpaperTab === 'colors' && (
            <div className="grid grid-cols-2 gap-4 py-4">
              {WALLPAPER_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleWallpaperSelect(color.value)}
                  className="relative group"
                >
                  <div
                    className={`h-32 rounded-lg ${color.gradient} transition-all ${
                      selectedWallpaper === color.value && !customWallpaper
                        ? 'ring-2 ring-primary scale-105'
                        : 'hover:scale-105'
                    }`}
                  />
                  {selectedWallpaper === color.value && !customWallpaper && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  <p className="text-sm text-center mt-2 font-medium">{color.name}</p>
                </button>
              ))}
            </div>
          )}

          {/* Gallery Tab - Pixabay Images */}
          {wallpaperTab === 'images' && (
            <div className="py-4">
              {loadingWallpapers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Loading wallpapers...</span>
                </div>
              ) : pixabayWallpapers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No wallpapers available</p>
                  <Button
                    onClick={loadPixabayWallpapers}
                    variant="outline"
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {pixabayWallpapers.map((wallpaper) => (
                      <button
                        key={wallpaper.id}
                        onClick={() => handleAPIWallpaperSelect(wallpaper.webformatURL, wallpaper.id.toString())}
                        className="relative group"
                      >
                        <div className="h-40 rounded-lg overflow-hidden bg-muted">
                          <img
                            src={wallpaper.previewURL}
                            alt={wallpaper.tags}
                            className="w-full h-full object-cover transition-all group-hover:scale-110"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-medium">Select</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Images from <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer" className="underline">Pixabay</a>
                  </p>
                </>
              )}
            </div>
          )}

          {/* Custom Tab */}
          {wallpaperTab === 'custom' && (
            <div className="py-4 space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomWallpaperUpload}
                  className="hidden"
                  id="wallpaper-upload"
                />
                <label
                  htmlFor="wallpaper-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Upload Custom Wallpaper</p>
                    <p className="text-sm text-muted-foreground">
                      Choose an image from your device
                    </p>
                  </div>
                </label>
              </div>

              {customWallpaper && (
                <div className="relative">
                  <img
                    src={customWallpaper}
                    alt="Custom wallpaper"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disappearing Messages Dialog */}
      <Dialog open={showDisappearingDialog} onOpenChange={setShowDisappearingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disappearing Messages</DialogTitle>
            <DialogDescription>
              Choose how long messages should stay before they're automatically deleted
            </DialogDescription>
          </DialogHeader>

          <RadioGroup value={disappearingTimer} onValueChange={handleDisappearingSelect}>
            {DISAPPEARING_TIMERS.map((timer) => (
              <div key={timer.value} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
                <RadioGroupItem value={timer.value} id={timer.value} />
                <Label htmlFor={timer.value} className="flex-1 cursor-pointer">
                  {timer.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </DialogContent>
      </Dialog>
    </>
  );
}
