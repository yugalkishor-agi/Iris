import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Download, FileText, Image, MessageCircle, Users, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { settingsService } from "../../src/services/settings.service";

interface DataType {
  id: string;
  name: string;
  description: string;
  size: string;
  icon: any;
}

const dataTypes: DataType[] = [
  {
    id: "posts",
    name: "Posts & Photos",
    description: "All your posts, captions, and photos",
    size: "~450 MB",
    icon: Image,
  },
  {
    id: "stories",
    name: "Stories & Glimpses",
    description: "Archive of your stories",
    size: "~230 MB",
    icon: FileText,
  },
  {
    id: "messages",
    name: "Messages",
    description: "All conversations and DMs",
    size: "~89 MB",
    icon: MessageCircle,
  },
  {
    id: "profile",
    name: "Profile Information",
    description: "Bio, followers, following",
    size: "~2 MB",
    icon: Users,
  },
];

export default function DownloadData() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [selectedData, setSelectedData] = useState<string[]>(dataTypes.map(d => d.id));
  const [isRequesting, setIsRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  const handleToggle = (id: string) => {
    if (selectedData.includes(id)) {
      setSelectedData(selectedData.filter(d => d !== id));
    } else {
      setSelectedData([...selectedData, id]);
    }
  };

  const handleRequest = async () => {
    if (!currentUser) return;

    if (selectedData.length === 0) {
      toast({
        title: "No data selected",
        description: "Please select at least one data type",
        variant: "destructive",
      });
      return;
    }

    setIsRequesting(true);

    try {
      await settingsService.requestDataExport(currentUser.userId);
      setRequested(true);

      toast({
        title: "Download requested",
        description: "We'll email you a link within 48 hours",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to request data export",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Download Your Data</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {requested ? (
          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-green-500/10 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Request Submitted!</h2>
              <p className="text-muted-foreground">
                We're preparing your data. You'll receive an email with a download link within 48 hours.
              </p>
            </div>
            <Button asChild>
              <Link to="/settings">Back to Settings</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h2 className="font-semibold mb-2">About data download</h2>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Select the data you want to download</li>
                <li>• We'll send you a download link via email</li>
                <li>• The link expires after 7 days</li>
                <li>• Your data will be in JSON format</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Select data to download:</h3>
              {dataTypes.map((dataType) => (
                <div
                  key={dataType.id}
                  className="border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id={dataType.id}
                      checked={selectedData.includes(dataType.id)}
                      onCheckedChange={() => handleToggle(dataType.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={dataType.id} className="cursor-pointer flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <dataType.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{dataType.name}</div>
                          <div className="text-sm text-muted-foreground">{dataType.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">{dataType.size}</div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Total Size</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedData.length} items selected
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary">
                  ~{selectedData.reduce((sum, id) => {
                    const item = dataTypes.find(d => d.id === id);
                    return sum + (item ? parseInt(item.size) : 0);
                  }, 0)} MB
                </div>
              </div>
            </div>

            <Button
              onClick={handleRequest}
              disabled={isRequesting || selectedData.length === 0}
              className="w-full"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Request Download
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
