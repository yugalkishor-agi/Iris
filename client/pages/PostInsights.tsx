import { Link } from "react-router-dom";
import { ChevronLeft, Heart, Eye, TrendingUp, Users } from "lucide-react";

export default function PostInsights() {
  const stats = [
    { label: "Total Likes", value: "12.5K", icon: Heart, color: "text-red-500" },
    { label: "Total Views", value: "45.2K", icon: Eye, color: "text-blue-500" },
    { label: "Reach", value: "38.9K", icon: TrendingUp, color: "text-green-500" },
    { label: "Engagement", value: "28%", icon: Users, color: "text-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Post Insights</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="border rounded-lg p-4">
              <div className={`${stat.color} mb-2`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Recent Posts Performance</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="h-12 w-12 bg-muted rounded"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Post #{i}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.floor(Math.random() * 5000)} likes • {Math.floor(Math.random() * 100)} comments
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
