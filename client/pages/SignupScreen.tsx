import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, EyeOff, Camera, ChevronLeft, Upload, Loader2, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { userService } from "../../src/services/user.service";

export default function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [usernameValidation, setUsernameValidation] = useState<{ valid: boolean; error?: string; checking?: boolean }>({ valid: false });
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const navigate = useNavigate();
  const { signUp, loading } = useAuth();
  const { toast } = useToast();

  // Validate username format only (uniqueness checked on backend during signup)
  useEffect(() => {
    if (!formData.username) {
      setUsernameValidation({ valid: false });
      return;
    }

    if (formData.username.length < 3 || formData.username.length > 12) {
      setUsernameValidation({ valid: false, error: 'Username must be 3-12 characters' });
      return;
    }

    // Must contain at least one alphabet
    if (!/[a-zA-Z]/.test(formData.username)) {
      setUsernameValidation({ valid: false, error: 'Username must contain at least one letter' });
      return;
    }

    const validPattern = /^[a-zA-Z0-9_.]+$/;
    if (!validPattern.test(formData.username)) {
      setUsernameValidation({ valid: false, error: 'Only letters, numbers, _ and . allowed' });
      return;
    }

    if (formData.username.startsWith('_') || formData.username.startsWith('.') || formData.username.endsWith('_') || formData.username.endsWith('.')) {
      setUsernameValidation({ valid: false, error: 'Cannot start/end with special characters' });
      return;
    }

    if (/[_.]{2,}/.test(formData.username)) {
      setUsernameValidation({ valid: false, error: 'Cannot have consecutive special characters' });
      return;
    }

    // Check if using only one type of special character repeatedly
    const hasUnderscores = formData.username.includes('_');
    const hasDots = formData.username.includes('.');
    const specialCharCount = (formData.username.match(/[_.]/g) || []).length;
    
    if (specialCharCount > 1 && (hasUnderscores && !hasDots)) {
      setUsernameValidation({ valid: false, error: 'Cannot use only underscores as special chars' });
      return;
    }
    
    if (specialCharCount > 1 && (hasDots && !hasUnderscores)) {
      setUsernameValidation({ valid: false, error: 'Cannot use only dots as special chars' });
      return;
    }

    setUsernameValidation({ valid: true });
  }, [formData.username]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate username format
    if (!usernameValidation.valid) {
      toast({
        title: "Invalid username",
        description: usernameValidation.error || "Please choose a valid username",
        variant: "destructive",
      });
      return;
    }

    // Check username availability
    setCheckingAvailability(true);
    try {
      const isAvailable = await userService.isUsernameAvailable(formData.username);
      
      if (!isAvailable) {
        setCheckingAvailability(false);
        toast({
          title: "Username already taken",
          description: "This username is not available. Please choose a different one.",
          variant: "destructive",
        });
        return;
      }

      // Username is available, proceed with signup
      await signUp(
        formData.email,
        formData.password,
        formData.username,
        formData.name,
        avatarFile || undefined
      );
      
      toast({
        title: "Account created!",
        description: "Welcome to Iris. Let's get started!",
      });
      
      navigate("/");
    } catch (error: any) {
      setCheckingAvailability(false);
      toast({
        title: "Signup failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Max width container */}
      <div className="flex flex-col min-h-screen max-w-md mx-auto w-full">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between p-4">
          <Link to="/welcome" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <img 
            src="/Iris-logo.png" 
            alt="Iris Logo" 
            className="w-30 h-30 sm:w-36 sm:h-36"
          />
          <div className="w-6" /> {/* Spacer for centering */}
        </div>

        {/* Content */}
        <div className="flex-1 px-6 sm:px-8 py-4 space-y-6 animate-slide-up overflow-y-auto">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">Join Iris today</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Profile Picture Upload */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="w-24 h-24">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt="Profile" />
                ) : (
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary">
                    {formData.name ? formData.name[0].toUpperCase() : <Camera className="h-8 w-8" />}
                  </AvatarFallback>
                )}
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 cursor-pointer"
              >
                <Upload className="h-4 w-4" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                placeholder="@username"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value.toLowerCase())}
                className={`pr-10 ${
                  formData.username && !usernameValidation.checking
                    ? usernameValidation.valid
                      ? 'border-green-500 focus-visible:ring-green-500'
                      : 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }`}
                required
              />
              {formData.username && (
                <div className="absolute right-3 top-3">
                  {usernameValidation.checking ? (
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  ) : usernameValidation.valid ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {formData.username && !usernameValidation.checking && !usernameValidation.valid && usernameValidation.error && (
              <p className="text-xs text-red-500">{usernameValidation.error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              3-12 characters. Must have letters. Can mix _ and . but not same type only.
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Sign Up Button */}
          <Button type="submit" className="w-full" size="lg" disabled={loading || checkingAvailability}>
            {checkingAvailability ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking username...
              </>
            ) : loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>

        {/* Terms */}
        <p className="text-xs text-center text-muted-foreground">
          By signing up, you agree to our{" "}
          <Link to="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>

        {/* Login link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Login
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
