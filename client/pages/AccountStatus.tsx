import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Globe, Lock, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { settingsService } from "../../src/services/settings.service";
import { LoadingState } from "@/components/ui/loading-state";

export default function AccountStatus() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current privacy status
  useEffect(() => {
    const loadPrivacyStatus = async () => {
      if (!currentUser) return;
      try {
        const privacy = await settingsService.getPrivacySettings(currentUser.userId);
        setIsPrivate(privacy.isPrivate || false);
      } catch (error) {
        console.error('Failed to load privacy status', error);
      } finally {
        setLoading(false);
      }
    };
    loadPrivacyStatus();
  }, [currentUser]);

  const handleToggle = async () => {
    if (!currentUser || saving) return;
    
    const newValue = !isPrivate;
    setSaving(true);
    
    try {
      await settingsService.updatePrivacySettings(currentUser.userId, { isPrivate: newValue });
      setIsPrivate(newValue);
      toast({
        title: newValue ? "Account is now private" : "Account is now public",
        description: newValue 
          ? "Only approved followers can see your posts"
          : "Anyone can see your posts and profile",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update account status",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState text="Loading account status..." />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Account Status</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="text-center py-6">
          <div className={`p-4 rounded-full inline-block mb-4 ${
            isPrivate ? 'bg-orange-500/10' : 'bg-green-500/10'
          }`}>
            {isPrivate ? (
              <Lock className="h-12 w-12 text-orange-500" />
            ) : (
              <Globe className="h-12 w-12 text-green-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {isPrivate ? "Private Account" : "Public Account"}
          </h2>
          <p className="text-muted-foreground">
            {isPrivate 
              ? "Only your followers can see your content"
              : "Anyone on Iris can see your content"}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleToggle}
            className={`w-full p-6 border-2 rounded-xl transition-all text-left ${
              !isPrivate ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Globe className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="font-semibold flex items-center gap-2">
                  Public Account
                  {!isPrivate && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Anyone can see your posts, followers, and following
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={handleToggle}
            className={`w-full p-6 border-2 rounded-xl transition-all text-left ${
              isPrivate ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Lock className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="font-semibold flex items-center gap-2">
                  Private Account
                  {isPrivate && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Only approved followers can see your posts
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold">
            {isPrivate ? "With a private account:" : "With a public account:"}
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {isPrivate ? (
              <>
                <li>• People must request to follow you</li>
                <li>• Only followers can see your posts</li>
                <li>• Your profile won't appear in search for non-followers</li>
                <li>• Tagged posts require your approval</li>
              </>
            ) : (
              <>
                <li>• Anyone can follow you</li>
                <li>• Anyone can see your posts</li>
                <li>• Your profile appears in search</li>
                <li>• Anyone can tag you in posts</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
