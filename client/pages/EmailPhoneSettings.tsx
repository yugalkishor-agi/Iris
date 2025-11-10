import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Mail, Smartphone, Check, AlertCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../src/config/firebase";

export default function EmailPhoneSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [verificationType, setVerificationType] = useState<"email" | "phone">("email");

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user]);

  const handleEmailUpdate = async () => {
    setVerificationType("email");
    setShowVerification(true);
    setIsEditingEmail(false);
  };

  const handlePhoneUpdate = async () => {
    setVerificationType("phone");
    setShowVerification(true);
    setIsEditingPhone(false);
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setIsVerifying(true);
    
    try {
      // Update in Firestore
      const userRef = doc(db, "users", user.userId);
      if (verificationType === "email") {
        await updateDoc(userRef, { email });
      } else {
        await updateDoc(userRef, { phone });
      }

      setShowVerification(false);
      setVerificationCode("");

      toast({
        title: "Verified successfully",
        description: `Your ${verificationType} has been updated and verified.`,
      });
    } catch (error) {
      console.error("Verification failed:", error);
      toast({
        title: "Verification failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({
      title: "Code sent",
      description: `A new verification code has been sent to your ${verificationType}.`,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Email & Phone</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
          <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-600 dark:text-blue-400">
            <p className="font-semibold mb-1">Keep your account secure</p>
            <p>We'll send a verification code when you update your email or phone number.</p>
          </div>
        </div>

        {/* Email Section */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Email Address</h3>
              <p className="text-sm text-muted-foreground">Used for login and notifications</p>
            </div>
          </div>

          {isEditingEmail ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">New Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter new email"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditingEmail(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleEmailUpdate} className="flex-1">
                  Update Email
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{email}</span>
                <Check className="h-4 w-4 text-green-500" />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsEditingEmail(true)}>
                Change
              </Button>
            </div>
          )}
        </div>

        {/* Phone Section */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Phone Number</h3>
              <p className="text-sm text-muted-foreground">For account recovery and 2FA</p>
            </div>
          </div>

          {isEditingPhone ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="phone">New Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditingPhone(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handlePhoneUpdate} className="flex-1">
                  Update Phone
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{phone}</span>
                <Check className="h-4 w-4 text-green-500" />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsEditingPhone(true)}>
                Change
              </Button>
            </div>
          )}
        </div>

        {/* Verification Modal */}
        {showVerification && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-background rounded-lg max-w-md w-full p-6 space-y-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Verify {verificationType === "email" ? "Email" : "Phone"}</h3>
                <button onClick={() => setShowVerification(false)} className="text-muted-foreground hover:text-foreground">
                  <AlertCircle className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground">
                We've sent a 6-digit code to your {verificationType === "email" ? "email" : "phone number"}.
                Please enter it below.
              </p>

              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowVerification(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleVerify} disabled={isVerifying || verificationCode.length !== 6} className="flex-1">
                  {isVerifying ? "Verifying..." : "Verify"}
                </Button>
              </div>

              <button onClick={handleResendCode} className="text-sm text-primary hover:underline w-full text-center">
                Didn't receive code? Resend
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
