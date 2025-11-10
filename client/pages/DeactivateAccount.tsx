import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft, AlertTriangle, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "../../src/services/auth.service";
import { userService } from "../../src/services/user.service";

const deactivationReasons = [
  "Taking a break from social media",
  "Privacy concerns",
  "Too many notifications",
  "Found another platform",
  "Just trying it out",
  "Other",
];

export default function DeactivateAccount() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, signOut } = useAuth();
  const [step, setStep] = useState<"reason" | "confirm" | "password">("reason");
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState({
    dataLoss: false,
    reversible: false,
    reactivation: false,
  });

  const handleReasonNext = () => {
    if (!selectedReason) {
      toast({
        title: "Please select a reason",
        description: "Help us understand why you're leaving",
        variant: "destructive",
      });
      return;
    }
    if (selectedReason === "Other" && !otherReason.trim()) {
      toast({
        title: "Please provide a reason",
        description: "Tell us more about why you're deactivating",
        variant: "destructive",
      });
      return;
    }
    setStep("confirm");
  };

  const handleConfirmNext = () => {
    if (!Object.values(acknowledgedWarnings).every(v => v)) {
      toast({
        title: "Please acknowledge all warnings",
        description: "Make sure you understand what will happen",
        variant: "destructive",
      });
      return;
    }
    setStep("password");
  };

  const handleDeactivate = async () => {
    if (!currentUser) return;

    if (password.length < 6) {
      toast({
        title: "Invalid password",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    if (confirmText !== "DEACTIVATE") {
      toast({
        title: "Confirmation text incorrect",
        description: 'Please type "DEACTIVATE" to confirm',
        variant: "destructive",
      });
      return;
    }

    setIsDeactivating(true);

    try {
      // Verify password first
      const isValid = await authService.verifyPassword(password);
      if (!isValid) {
        toast({
          title: "Incorrect password",
          description: "Please enter your correct password",
          variant: "destructive",
        });
        setIsDeactivating(false);
        return;
      }

      // Deactivate account
      await userService.deactivateAccount(currentUser.userId, selectedReason);

      toast({
        title: "Account deactivated",
        description: "Your account has been deactivated. We're sad to see you go.",
      });

      // Logout and redirect
      await signOut();
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate account",
        variant: "destructive",
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Deactivate Account</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Warning Banner */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm text-destructive">
            <p className="font-semibold mb-1">This action is serious!</p>
            <p>Your account will be deactivated and your profile will be hidden from other users.</p>
          </div>
        </div>

        {/* Step 1: Select Reason */}
        {step === "reason" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold mb-2">Why are you leaving?</h2>
              <p className="text-sm text-muted-foreground">
                Your feedback helps us improve Iris for everyone
              </p>
            </div>

            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              <div className="space-y-3">
                {deactivationReasons.map((reason) => (
                  <div key={reason} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <RadioGroupItem value={reason} id={reason} />
                    <Label htmlFor={reason} className="flex-1 cursor-pointer">
                      {reason}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            {selectedReason === "Other" && (
              <div className="space-y-2 animate-slide-down">
                <Label>Please tell us more</Label>
                <Input
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="What made you decide to leave?"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {200 - otherReason.length} characters remaining
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" asChild className="flex-1">
                <Link to="/settings">Cancel</Link>
              </Button>
              <Button variant="destructive" onClick={handleReasonNext} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Acknowledge Warnings */}
        {step === "confirm" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold mb-2">Before you go...</h2>
              <p className="text-sm text-muted-foreground">
                Please acknowledge the following:
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="dataLoss"
                  checked={acknowledgedWarnings.dataLoss}
                  onCheckedChange={(checked) =>
                    setAcknowledgedWarnings({ ...acknowledgedWarnings, dataLoss: checked as boolean })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="dataLoss" className="cursor-pointer font-medium">
                    Your profile will be hidden
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Other users won't be able to see your profile, posts, or stories
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="reversible"
                  checked={acknowledgedWarnings.reversible}
                  onCheckedChange={(checked) =>
                    setAcknowledgedWarnings({ ...acknowledgedWarnings, reversible: checked as boolean })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="reversible" className="cursor-pointer font-medium">
                    Your data will be preserved
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    All your data remains safe and can be restored when you return
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="reactivation"
                  checked={acknowledgedWarnings.reactivation}
                  onCheckedChange={(checked) =>
                    setAcknowledgedWarnings({ ...acknowledgedWarnings, reactivation: checked as boolean })
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="reactivation" className="cursor-pointer font-medium">
                    You can reactivate anytime
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Simply log back in to reactivate your account
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("reason")} className="flex-1">
                Back
              </Button>
              <Button variant="destructive" onClick={handleConfirmNext} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Password Confirmation */}
        {step === "password" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold mb-2">Final confirmation</h2>
              <p className="text-sm text-muted-foreground">
                Enter your password and type "DEACTIVATE" to confirm
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Type "DEACTIVATE" to confirm</Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="DEACTIVATE"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> After deactivation, you can log back in anytime to reactivate your account with all your data intact.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("confirm")} className="flex-1">
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeactivate}
                disabled={isDeactivating || password.length < 6 || confirmText !== "DEACTIVATE"}
                className="flex-1"
              >
                {isDeactivating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  "Deactivate Account"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
