import { Link } from "react-router-dom";
import { ChevronLeft, Eye, Clock, TrendingUp, Users } from "lucide-react";

export default function GlimpseAnalytics() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Glimpse Performance</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <Eye className="h-5 w-5 text-blue-500 mb-2" />
            <div className="text-2xl font-bold mb-1">89.5K</div>
            <div className="text-sm text-muted-foreground">Total Views</div>
          </div>
          <div className="border rounded-lg p-4">
            <Clock className="h-5 w-5 text-green-500 mb-2" />
            <div className="text-2xl font-bold mb-1">12.3s</div>
            <div className="text-sm text-muted-foreground">Avg Watch Time</div>
          </div>
          <div className="border rounded-lg p-4">
            <TrendingUp className="h-5 w-5 text-purple-500 mb-2" />
            <div className="text-2xl font-bold mb-1">67%</div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </div>
          <div className="border rounded-lg p-4">
            <Users className="h-5 w-5 text-orange-500 mb-2" />
            <div className="text-2xl font-bold mb-1">45K</div>
            <div className="text-sm text-muted-foreground">Unique Viewers</div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Top Performing Glimpses</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="h-16 w-12 bg-muted rounded"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Glimpse #{i}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.floor(Math.random() * 50000)} views • {Math.floor(Math.random() * 100)}% completion
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
