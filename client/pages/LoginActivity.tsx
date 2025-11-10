import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { ChevronLeft, Smartphone, Monitor, MapPin, Clock, CheckCircle, AlertCircle, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { settingsService } from "../../src/services/settings.service";

export default function LoginActivity() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const activeSessions = await settingsService.getActiveSessions(currentUser.userId);
        setSessions(activeSessions);
      } catch (error) {
        console.error('Failed to load sessions', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [currentUser]);

  const handleLogout = async (sessionId: string) => {
    if (!currentUser) return;

    try {
      await settingsService.endSession(currentUser.userId, sessionId);
      setSessions(sessions.filter(s => s.sessionId !== sessionId));
      toast({
        title: "Session ended",
        description: "The device has been logged out",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to end session",
        variant: "destructive",
      });
    }
  };

  const handleLogoutAll = async () => {
    if (!currentUser) return;

    try {
      await settingsService.endAllSessions(currentUser.userId);
      setSessions(sessions.filter(s => s.isCurrent));
      toast({
        title: "All sessions ended",
        description: "All other devices have been logged out",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to end sessions",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <LoadingState text="Loading sessions..." />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Login Activity</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Active Sessions</h2>
              <p className="text-sm text-muted-foreground">{sessions.length} devices</p>
            </div>
            {sessions.filter(s => !s.isCurrent).length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleLogoutAll}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout All Others
              </Button>
            )}
          </div>
        </div>

        <div className="divide-y">
          {sessions.map((session) => (
            <div key={session.id} className="p-4 hover:bg-accent transition-colors">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg flex-shrink-0 ${
                  session.isSuspicious ? 'bg-destructive/10' : 'bg-primary/10'
                }`}>
                  {session.device.includes('Windows') || session.device.includes('PC') ? (
                    <Monitor className={`h-6 w-6 ${
                      session.isSuspicious ? 'text-destructive' : 'text-primary'
                    }`} />
                  ) : (
                    <Smartphone className={`h-6 w-6 ${
                      session.isSuspicious ? 'text-destructive' : 'text-primary'
                    }`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{session.device}</h3>
                    {session.isCurrent && (
                      <span className="px-2 py-0.5 text-xs bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Current
                      </span>
                    )}
                    {session.isSuspicious && (
                      <span className="px-2 py-0.5 text-xs bg-destructive/10 text-destructive rounded-full flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Suspicious
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{session.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>{session.time}</span>
                    </div>
                    <div className="text-xs">IP: {session.ip}</div>
                  </div>

                  {!session.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLogout(session.id)}
                      className="mt-3"
                    >
                      End Session
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
