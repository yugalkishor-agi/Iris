import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "../../src/services/user.service";

export default function EditProfile() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    bio: "",
    website: "",
    location: "",
  });

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;
      try {
        const userData = await userService.getUser(currentUser.userId);
        if (userData) {
          setFormData({
            displayName: userData.displayName || "",
            username: userData.username || "",
            bio: userData.bio || "",
            website: userData.website || "",
            location: userData.location || "",
          });
        }
      } catch (error) {
        console.error('Failed to load user data', error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    try {
      await userService.updateUser(currentUser.userId, formData);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      const profilePath = `/profile/${currentUser.username || currentUser.userId}`;
      navigate(profilePath);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState text="Loading profile..." />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to={currentUser ? `/profile/${currentUser.username || currentUser.userId}` : '/'} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Edit Profile</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-2xl mx-auto">
        <div className="grid gap-1">
          <label className="text-sm font-medium">Name</label>
          <Input
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            placeholder="Your name"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Username</label>
          <Input
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
            placeholder="username"
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">Username cannot be changed</p>
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Bio</label>
          <Textarea
            rows={3}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about yourself"
            maxLength={150}
          />
          <p className="text-xs text-muted-foreground">
            {formData.bio.length}/150 characters
          </p>
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Website</label>
          <Input
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Location</label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="City, Country"
          />
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
