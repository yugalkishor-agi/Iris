import { Link } from "react-router-dom";
import { ChevronLeft, Image, Video, FileText, Music, Database } from "lucide-react";

const storageData = [
  { name: "Photos", size: 124, color: "bg-blue-500", icon: Image },
  { name: "Videos", size: 89, color: "bg-purple-500", icon: Video },
  { name: "Messages", size: 23, color: "bg-green-500", icon: FileText },
  { name: "Audio", size: 9, color: "bg-orange-500", icon: Music },
  { name: "Other", size: 0, color: "bg-gray-500", icon: Database },
];

export default function StorageUsage() {
  const totalSize = storageData.reduce((sum, item) => sum + item.size, 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Storage Usage</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="text-center py-8">
          <div className="text-5xl font-bold text-primary mb-2">{totalSize} MB</div>
          <p className="text-muted-foreground">Total storage used</p>
        </div>

        <div className="space-y-1">
          <div className="flex h-4 rounded-full overflow-hidden">
            {storageData.map((item) => (
              item.size > 0 && (
                <div
                  key={item.name}
                  className={item.color}
                  style={{ width: `${(item.size / totalSize) * 100}%` }}
                />
              )
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {storageData.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.color} bg-opacity-10`}>
                  <item.icon className="h-5 w-5" style={{ color: item.color.replace('bg-', '') }} />
                </div>
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {((item.size / totalSize) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="text-lg font-semibold">{item.size} MB</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
