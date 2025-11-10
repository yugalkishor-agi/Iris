import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Briefcase, TrendingUp, BarChart3, MessageSquare, Shield, Check, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfessionalAccount() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accountType, setAccountType] = useState<"creator" | "business" | null>(null);
  const [agreed, setAgreed] = useState(false);

  const handleSwitch = () => {
    if (!accountType || !agreed) {
      toast({
        title: "Please complete all steps",
        description: "Select account type and agree to terms",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Switched to professional",
      description: "You now have access to creator tools and insights",
    });
    navigate("/settings");
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Switch to Professional</h1>
        </div>
      </div>

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md mx-4">
          <div className="p-6 bg-primary/10 rounded-full inline-block mb-6">
            <Lock className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Coming Soon</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Professional account features are currently under development. Stay tuned!
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
            <Shield className="h-4 w-4" />
            Feature locked
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6 opacity-30 pointer-events-none">
        <div className="text-center py-6">
          <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
            <Briefcase className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Unlock Professional Tools</h2>
          <p className="text-muted-foreground">
            Get access to advanced analytics, insights, and business features
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Choose account type:</h3>
          
          <button
            onClick={() => setAccountType("creator")}
            className={`w-full p-4 border-2 rounded-xl transition-all text-left ${
              accountType === "creator" ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-semibold flex items-center gap-2">
                  Creator Account
                  {accountType === "creator" && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Perfect for influencers, content creators, and artists
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setAccountType("business")}
            className={`w-full p-4 border-2 rounded-xl transition-all text-left ${
              accountType === "business" ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-semibold flex items-center gap-2">
                  Business Account
                  {accountType === "business" && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  For brands, businesses, and organizations
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold">What you'll get:</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-sm">Advanced analytics & insights</span>
            </div>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="text-sm">Direct message filters</span>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm">Post performance tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm">Verified badge eligibility</span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 border rounded-lg">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <Label htmlFor="terms" className="cursor-pointer text-sm">
            I agree to the{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Professional Account Terms
            </Link>{" "}
            and understand that I can switch back anytime
          </Label>
        </div>

        <Button
          onClick={handleSwitch}
          disabled={!accountType || !agreed}
          className="w-full"
        >
          Switch to Professional
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          You can switch back to a personal account anytime from settings
        </p>
      </div>
    </div>
  );
}
