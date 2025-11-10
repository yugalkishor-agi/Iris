import { useState } from 'react';
import { X, Users, Globe, Star, MessageCircleOff, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreUploadSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: {
    audience: 'public' | 'followers' | 'closeFriends';
    allowReplies: boolean;
    allowSharing: boolean;
  };
  onSettingsChange: (settings: {
    audience: 'public' | 'followers' | 'closeFriends';
    allowReplies: boolean;
    allowSharing: boolean;
  }) => void;
}

export default function PreUploadSettingsModal({
  isOpen,
  onClose,
  currentSettings,
  onSettingsChange,
}: PreUploadSettingsModalProps) {
  const [audience, setAudience] = useState(currentSettings.audience);
  const [allowReplies, setAllowReplies] = useState(currentSettings.allowReplies);
  const [allowSharing, setAllowSharing] = useState(currentSettings.allowSharing);

  const handleSave = () => {
    onSettingsChange({ audience, allowReplies, allowSharing });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-black/95 border border-white/10 rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-white text-lg font-semibold">Story Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Audience Selection */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Share with:</label>
            <div className="space-y-2">
              <button
                onClick={() => setAudience('followers')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  audience === 'followers'
                    ? 'bg-primary/20 border border-primary'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <Users className="h-5 w-5 text-white" />
                <div className="flex-1 text-left">
                  <p className="text-white text-sm font-medium">Followers</p>
                  <p className="text-white/50 text-xs">Only your followers can see</p>
                </div>
                {audience === 'followers' && (
                  <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  </div>
                )}
              </button>

              <button
                onClick={() => setAudience('closeFriends')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  audience === 'closeFriends'
                    ? 'bg-green-600/20 border border-green-500'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <Star className="h-5 w-5 text-green-500 fill-green-500" />
                <div className="flex-1 text-left">
                  <p className="text-white text-sm font-medium">Close Friends</p>
                  <p className="text-white/50 text-xs">Only close friends can see</p>
                </div>
                {audience === 'closeFriends' && (
                  <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  </div>
                )}
              </button>

              <button
                onClick={() => setAudience('public')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  audience === 'public'
                    ? 'bg-primary/20 border border-primary'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <Globe className="h-5 w-5 text-white" />
                <div className="flex-1 text-left">
                  <p className="text-white text-sm font-medium">Public</p>
                  <p className="text-white/50 text-xs">Everyone can see</p>
                </div>
                {audience === 'public' && (
                  <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Toggle Controls */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setAllowReplies(!allowReplies)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageCircleOff className="h-5 w-5 text-white" />
                <div className="text-left">
                  <p className="text-white text-sm font-medium">Replies</p>
                  <p className="text-white/50 text-xs">
                    {allowReplies ? 'Viewers can reply' : 'Replies disabled'}
                  </p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${allowReplies ? 'bg-green-500' : 'bg-white/20'}`}>
                <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${allowReplies ? 'ml-6' : 'ml-0.5'}`}></div>
              </div>
            </button>

            <button
              onClick={() => setAllowSharing(!allowSharing)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5 text-white" />
                <div className="text-left">
                  <p className="text-white text-sm font-medium">Sharing</p>
                  <p className="text-white/50 text-xs">
                    {allowSharing ? 'Viewers can share' : 'Sharing disabled'}
                  </p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${allowSharing ? 'bg-green-500' : 'bg-white/20'}`}>
                <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${allowSharing ? 'ml-6' : 'ml-0.5'}`}></div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 p-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
