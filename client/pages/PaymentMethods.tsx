import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CreditCard, Plus } from "lucide-react";

export default function PaymentMethods() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Payment Methods</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <Button className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>

        <div className="text-center p-12">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No payment methods added</p>
        </div>
      </div>
    </div>
  );
}
