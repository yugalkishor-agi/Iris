import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Smartphone, Monitor, MapPin, AlertCircle } from "lucide-react";

interface LoginSession {
  id: number;
  device: string;
  deviceType: "mobile" | "desktop";
  location: string;
  ipAddress: string;
  loginTime: string;
  isCurrent: boolean;
  suspicious?: boolean;
}

const mockSessions: LoginSession[] = [
  {
    id: 1,
    device: "iPhone 14 Pro • iOS 17.2",
    deviceType: "mobile",
    location: "Mumbai, India",
    ipAddress: "103.xxx.xxx.xx",
    loginTime: "Just now",
    isCurrent: true,
  },
  {
    id: 2,
    device: "Chrome on Windows • Windows 11",
    deviceType: "desktop",
    location: "Mumbai, India",
    ipAddress: "103.xxx.xxx.xx",
    loginTime: "2 hours ago",
    isCurrent: false,
  },
  {
    id: 3,
    device: "Safari on MacBook Pro • macOS 14",
    deviceType: "desktop",
    location: "Delhi, India",
    ipAddress: "49.xxx.xxx.xx",
    loginTime: "Yesterday",
    isCurrent: false,
    suspicious: true,
  },
];

export default function AccountActivity() {
  const [sessions, setSessions] = useState(mockSessions);

  const handleLogout = (sessionId: number) => {
    setSessions(sessions.filter(session => session.id !== sessionId));
  };

  const handleLogoutAll = () => {
    setSessions(sessions.filter(session => session.isCurrent));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings/security" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Login Activity</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Info Banner */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            This is a list of devices that have logged into your account. Remove any sessions that you don't recognize.
          </p>
        </div>

        {/* Logout All Button */}
        {sessions.filter(s => !s.isCurrent).length > 0 && (
          <Button variant="destructive" className="w-full" onClick={handleLogoutAll}>
            Log out of all other sessions
          </Button>
        )}

        {/* Active Sessions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">ACTIVE SESSIONS</h2>
          
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`border rounded-lg p-4 space-y-3 ${
                session.suspicious ? "border-destructive bg-destructive/5" : ""
              }`}
            >
              {/* Suspicious Warning */}
              {session.suspicious && (
                <div className="flex items-center gap-2 text-destructive text-sm font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  <span>Suspicious activity detected</span>
                </div>
              )}

              <div className="flex items-start gap-3">
                {/* Device Icon */}
                <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                  {session.deviceType === "mobile" ? (
                    <Smartphone className="h-6 w-6" />
                  ) : (
                    <Monitor className="h-6 w-6" />
                  )}
                </div>

                {/* Session Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold flex items-center gap-2">
                        {session.device}
                        {session.isCurrent && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </div>
                        <div className="mt-0.5">IP: {session.ipAddress}</div>
                        <div className="mt-0.5">{session.loginTime}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              {!session.isCurrent && (
                <Button
                  variant={session.suspicious ? "destructive" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => handleLogout(session.id)}
                >
                  Log out
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Security Tips */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Security Tips</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Always log out from shared or public devices</li>
            <li>• Enable two-factor authentication for extra security</li>
            <li>• Use a strong, unique password</li>
            <li>• Regularly review your login activity</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
