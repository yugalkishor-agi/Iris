import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Camera, Check, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "../../src/services/user.service";
import { mediaService } from "../../src/services/media.service";

export default function ProfileSettings() {
  const { toast } = useToast();
  const { user: currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    website: "",
    email: "",
    phone: "",
    gender: "prefer-not-to-say",
  });

  // Load user data
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const loadUserData = async () => {
      try {
        setLoading(true);
        const userData = await userService.getUser(currentUser.userId);
        
        if (userData) {
          setFormData({
            name: userData.displayName || "",
            username: userData.username || "",
            bio: userData.bio || "",
            website: userData.website || "",
            email: userData.email || "",
            phone: (userData as any).phoneNumber || "",
            gender: (userData as any).gender || "prefer-not-to-say",
          });
          setProfileImage(userData.avatarURL || null);
        }
      } catch (error: any) {
        console.error('Error loading user data:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser, navigate, toast]);

  const [errors, setErrors] = useState({
    name: "",
    username: "",
    email: "",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      username: "",
      email: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  const handleSave = async () => {
    if (!currentUser) return;

    if (!validateForm()) {
      toast({
        title: "Validation error",
        description: "Please fix the errors before saving",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      // Upload avatar if changed
      let avatarURL = profileImage;
      if (avatarFile) {
        setUploadingAvatar(true);
        avatarURL = await mediaService.uploadAvatar(currentUser.userId, avatarFile);
        setUploadingAvatar(false);
      }

      // Update user profile
      await userService.updateUser(currentUser.userId, {
        displayName: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        bio: formData.bio.trim(),
        website: formData.website.trim(),
        email: formData.email.trim(),
        avatarURL: avatarURL || undefined,
        // Note: phone and gender would need to be added to User type
      });

      // Refresh user in context
      await refreshUser();

      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully",
      });

      // Navigate back to profile
      setTimeout(() => navigate("/me"), 500);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to="/me" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold">Edit Profile</h1>
          </div>
          <Button onClick={handleSave} disabled={isSaving || uploadingAvatar} size="sm">
            {isSaving || uploadingAvatar ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadingAvatar ? "Uploading..." : "Saving..."}
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profileImage || undefined} />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="h-6 w-6 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="text-center">
            <Button variant="link" size="sm" asChild>
              <label className="cursor-pointer">
                Change profile photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </Button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? "border-red-500" : ""}
              placeholder="Your name"
            />
            {errors.name && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                className={`pl-7 ${errors.username ? "border-red-500" : ""}`}
                placeholder="username"
              />
            </div>
            {errors.username && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.username}
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Bio</Label>
              <Button variant="link" size="sm" asChild>
                <Link to="/edit-bio">Edit with tools</Link>
              </Button>
            </div>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, 150) })}
              placeholder="Tell us about yourself..."
              className="min-h-[100px] resize-none"
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground text-right">
              {150 - formData.bio.length} characters remaining
            </p>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://yourwebsite.com"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email">Email</Label>
              <Button variant="link" size="sm" asChild>
                <Link to="/settings/email-phone">Change</Link>
              </Button>
            </div>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={errors.email ? "border-red-500" : ""}
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="phone">Phone</Label>
              <Button variant="link" size="sm" asChild>
                <Link to="/settings/email-phone">Change</Link>
              </Button>
            </div>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 8900"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
              <option value="custom">Custom</option>
            </select>
            <p className="text-xs text-muted-foreground">
              This won't be part of your public profile
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" asChild>
            <Link to="/me">Cancel</Link>
          </Button>
          <Button onClick={handleSave} disabled={isSaving || uploadingAvatar} className="flex-1">
            {uploadingAvatar ? "Uploading..." : isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
