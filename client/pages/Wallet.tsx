import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Wallet as WalletIcon, Plus, Gift } from "lucide-react";

export default function Wallet() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Wallet & Coins</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="text-center py-8 border rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10">
          <WalletIcon className="h-12 w-12 text-primary mx-auto mb-4" />
          <div className="text-3xl font-bold mb-2">0 Coins</div>
          <p className="text-sm text-muted-foreground mb-4">Purchase coins to gift creators</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Buy Coins
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">What you can do with coins</h3>
          <div className="border rounded-lg p-4 flex items-start gap-3">
            <Gift className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Gift Creators</div>
              <div className="text-sm text-muted-foreground">Support your favorite creators</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
