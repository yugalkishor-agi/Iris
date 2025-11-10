import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "../../src/services/user.service";
import { authService } from "../../src/services/auth.service";

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [acknowledged, setAcknowledged] = useState({
    permanent: false,
    noRecovery: false,
    dataLoss: false,
  });

  const allAcknowledged = Object.values(acknowledged).every(v => v);

  const handleDelete = async () => {
    if (password.length < 6) {
      toast({
        title: "Invalid password",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    if (confirmText !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: 'Please type "DELETE" to confirm',
        variant: "destructive",
      });
      return;
    }

    if (!allAcknowledged) {
      toast({
        title: "Please acknowledge all warnings",
        description: "You must understand the consequences",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      if (!currentUser) throw new Error('Not authenticated');

      // Mark account for deletion with 7-day grace period
      await userService.deleteAccount(currentUser.userId);

      toast({
        title: "Account scheduled for deletion",
        description: "Your account will be permanently deleted in 7 days. Login within 7 days to cancel.",
      });

      // Logout and redirect
      await signOut();
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-destructive/20">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold text-destructive">Delete Account</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Critical Warning */}
        <div className="bg-destructive/10 border-2 border-destructive/50 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-destructive rounded-full">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-destructive">Warning!</h2>
              <p className="text-sm text-destructive/80">This action cannot be undone</p>
            </div>
          </div>
        </div>

        {/* What will be deleted */}
        <div className="space-y-4">
          <h3 className="font-semibold">What will be permanently deleted:</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border border-destructive/20 rounded-lg">
              <Trash2 className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">All your posts and glimpses</div>
                <div className="text-sm text-muted-foreground">Photos, videos, and stories</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border border-destructive/20 rounded-lg">
              <Trash2 className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Your profile information</div>
                <div className="text-sm text-muted-foreground">Username, bio, and settings</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border border-destructive/20 rounded-lg">
              <Trash2 className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Messages and conversations</div>
                <div className="text-sm text-muted-foreground">All chat history</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border border-destructive/20 rounded-lg">
              <Trash2 className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Followers and following</div>
                <div className="text-sm text-muted-foreground">All connections</div>
              </div>
            </div>
          </div>
        </div>

        {/* Acknowledgements */}
        <div className="space-y-3">
          <h3 className="font-semibold">I understand that:</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="permanent"
                checked={acknowledged.permanent}
                onCheckedChange={(checked) =>
                  setAcknowledged({ ...acknowledged, permanent: checked as boolean })
                }
              />
              <Label htmlFor="permanent" className="cursor-pointer text-sm">
                This action is <strong>permanent and irreversible</strong>
              </Label>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="noRecovery"
                checked={acknowledged.noRecovery}
                onCheckedChange={(checked) =>
                  setAcknowledged({ ...acknowledged, noRecovery: checked as boolean })
                }
              />
              <Label htmlFor="noRecovery" className="cursor-pointer text-sm">
                I <strong>cannot recover</strong> my account after deletion
              </Label>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="dataLoss"
                checked={acknowledged.dataLoss}
                onCheckedChange={(checked) =>
                  setAcknowledged({ ...acknowledged, dataLoss: checked as boolean })
                }
              />
              <Label htmlFor="dataLoss" className="cursor-pointer text-sm">
                All my data will be <strong>permanently lost</strong>
              </Label>
            </div>
          </div>
        </div>

        {/* Password Confirmation */}
        <div className="space-y-2">
          <Label htmlFor="password">Confirm your password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>

        {/* Final Confirmation */}
        <div className="space-y-2">
          <Label htmlFor="confirm">Type "DELETE" to confirm</Label>
          <Input
            id="confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            placeholder="DELETE"
            className="font-mono"
          />
        </div>

        {/* Grace Period Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
            <strong>7-Day Grace Period:</strong> Your account will be scheduled for deletion. If you login within 7 days, the deletion will be automatically cancelled.
          </p>
        </div>

        {/* Alternative Option */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm mb-2">
            <strong>Not sure?</strong> You can temporarily deactivate your account instead.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/deactivate">Deactivate Instead</Link>
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" asChild>
            <Link to="/settings">Cancel</Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !allAcknowledged || password.length < 6 || confirmText !== "DELETE"}
            className="flex-1"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Forever
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
