import { Link } from "react-router-dom";
import { ChevronLeft, Database } from "lucide-react";

export default function Subscriptions() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Subscriptions</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-12 text-center">
        <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold mb-2">No active subscriptions</h3>
        <p className="text-sm text-muted-foreground">Premium features coming soon!</p>
      </div>
    </div>
  );
}
