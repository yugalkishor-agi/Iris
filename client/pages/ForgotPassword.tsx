import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
      toast({
        title: "Email sent!",
        description: "Check your inbox for password reset instructions",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send email",
        description: error.message || "Please check your email and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Max width container */}
      <div className="flex flex-col min-h-screen max-w-md mx-auto w-full">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between p-4">
          <Link to="/login" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <img 
            src="/logo_bg-removed.png" 
            alt="Iris Logo" 
            className="w-10 h-10 sm:w-12 sm:h-12"
          />
          <div className="w-6" /> {/* Spacer for centering */}
        </div>

        {/* Content */}
        <div className="flex-1 px-6 sm:px-8 py-4 space-y-6 animate-slide-up">
          {!emailSent ? (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Forgot Password?</h1>
                <p className="text-muted-foreground">
                  Enter your email and we'll send you instructions to reset your password
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Send Reset Link Button */}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6 py-8">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-6">
                  <CheckCircle2 className="h-16 w-16 text-primary" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Check Your Email</h2>
                <p className="text-muted-foreground">
                  We've sent password reset instructions to
                </p>
                <p className="font-semibold text-foreground">{email}</p>
              </div>

              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Check your spam folder or
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                  className="w-full"
                >
                  Try Another Email
                </Button>
              </div>
            </div>
          )}

          {/* Back to Login */}
          <div className="text-center pt-4">
            <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
