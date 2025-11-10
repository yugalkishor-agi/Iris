import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ChevronLeft, Smartphone, Monitor, Tablet, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { settingsService } from "../../src/services/settings.service";

export default function Devices() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDevices = async () => {
      if (!currentUser) return;
      try {
        const userDevices = await settingsService.getActiveSessions(currentUser.userId);
        setDevices(userDevices);
      } catch (error) {
        console.error('Failed to load devices', error);
      } finally {
        setLoading(false);
      }
    };
    loadDevices();
  }, [currentUser]);

  const handleLogout = async (sessionId: string) => {
    if (!currentUser) return;
    try {
      await settingsService.endSession(currentUser.userId, sessionId);
      setDevices(devices.filter(d => d.sessionId !== sessionId));
      toast({ title: "Device logged out", description: "Session ended successfully" });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to logout device",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <LoadingState text="Loading devices..." />;
  }

  if (devices.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-3 p-4">
            <Link to="/settings" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold">Login Devices</h1>
          </div>
        </div>
        <EmptyState
          icon={Smartphone}
          title="No devices found"
          description="You'll see your login devices here"
        />
      </div>
    );
  }

  const getIcon = (deviceType: string) => {
    if (deviceType?.toLowerCase().includes('phone') || deviceType?.toLowerCase().includes('mobile')) return Smartphone;
    if (deviceType?.toLowerCase().includes('tablet') || deviceType?.toLowerCase().includes('ipad')) return Tablet;
    return Monitor;
  };
  const fmt = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Login Devices</h1>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!currentUser) return;
                try {
                  await settingsService.endAllSessions(currentUser.userId);
                  setDevices((prev) => prev.filter((s: any) => s.current));
                  toast({ title: 'Logged out from other devices' });
                } catch (e: any) {
                  toast({ title: 'Error', description: e.message || 'Failed to end sessions', variant: 'destructive' });
                }
              }}
            >
              End all other sessions
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {devices.map((session) => {
          const Icon = getIcon(session.device || 'device');
          return (
            <div key={session.sessionId} className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{session.device || 'Device'}</h3>
                    {session.current && (
                      <span className="px-2 py-0.5 text-xs bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{session.location || 'Unknown location'}</p>
                  <p className="text-xs text-muted-foreground">Last active: {fmt(session.lastActive)}</p>
                  {!session.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLogout(session.sessionId)}
                      className="mt-3"
                    >
                      Log Out
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
