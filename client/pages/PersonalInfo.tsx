import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/loading-state";
import { ChevronLeft, Mail, Phone, Calendar, Check, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "../../src/services/user.service";

export default function PersonalInfo() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    birthday: "",
  });

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const userData = await userService.getUser(currentUser.userId);
        
        if (userData) {
          // Normalize birthday to yyyy-mm-dd for input[type=date]
          let birthdayStr = "";
          const bday: any = (userData as any).birthday;
          if (bday) {
            const date = bday.toDate ? bday.toDate() : new Date(bday);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            birthdayStr = `${yyyy}-${mm}-${dd}`;
          }

          setFormData({
            email: userData.email || "",
            phone: (userData as any).phoneNumber || "",
            birthday: birthdayStr,
          });
        }
      } catch (error) {
        console.error('Failed to load user data', error);
        toast({
          title: "Error",
          description: "Failed to load your information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  const [errors, setErrors] = useState({
    email: "",
    phone: "",
  });

  const validateForm = () => {
    const newErrors = { email: "", phone: "" };

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  const handleSave = async () => {
    if (!validateForm() || !currentUser) return;

    try {
      setIsSaving(true);
      
      // Age validation
      let isUnder18 = false;
      if (formData.birthday) {
        const birthDate = new Date(formData.birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        isUnder18 = age < 18;
      }

      // Update user profile in Firestore
      await userService.updateUser(currentUser.userId, {
        email: formData.email,
        phoneNumber: formData.phone,
        birthday: formData.birthday ? new Date(formData.birthday) as any : undefined,
      } as any);

      if (isUnder18) {
        await userService.deactivateAccount(currentUser.userId, 'Underage');
        toast({
          title: "Account suspended",
          description: "You must be at least 18 years old to use Iris. Your account has been suspended.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      toast({
        title: "Information updated",
        description: "Your personal information has been saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
            <h1 className="text-lg font-semibold">Personal Information</h1>
          </div>
        </div>
        <LoadingState text="Loading your information..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to="/settings" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold">Personal Information</h1>
          </div>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
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
        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            This information is private and won't be shown on your profile
          </p>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </Label>
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
          <p className="text-xs text-muted-foreground">
            Used for login and account recovery
          </p>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={errors.phone ? "border-red-500" : ""}
            placeholder="+1 234 567 8900"
          />
          {errors.phone && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.phone}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Used for two-factor authentication
          </p>
        </div>

        {/* Birthday */}
        <div className="space-y-2">
          <Label htmlFor="birthday" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Birthday
          </Label>
          <Input
            id="birthday"
            type="date"
            value={formData.birthday}
            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Your age will be public. Birthday won't be shown.
          </p>
        </div>

        {/* Additional Info */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-sm">Why we need this</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Verify your identity</li>
            <li>• Secure your account</li>
            <li>• Send important notifications</li>
            <li>• Comply with legal requirements</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
