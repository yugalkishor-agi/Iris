import { useState } from "react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StorageOptimization() {
  const { toast } = useToast();
  const [autoDelete, setAutoDelete] = useState(true);
  const [deleteAfterDays, setDeleteAfterDays] = useState(30);

  const handleCleanDrafts = () => {
    toast({ title: "Drafts cleaned", description: "Old drafts have been removed" });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Storage Optimization</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Auto-Delete Old Drafts</h3>
              <p className="text-sm text-muted-foreground">Remove drafts after {deleteAfterDays} days</p>
            </div>
            <Switch checked={autoDelete} onCheckedChange={setAutoDelete} />
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Draft Posts</h3>
              <p className="text-sm text-muted-foreground">5 drafts • 23 MB</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleCleanDrafts} className="w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            Clean Old Drafts
          </Button>
        </div>
      </div>
    </div>
  );
}
