import { useState } from "react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Shield, Mail, Smartphone, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SecurityAlerts() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState({
    unrecognizedLogin: true,
    newDevice: true,
    passwordChange: true,
    emailChange: true,
    twoFactorDisabled: true,
  });

  const handleToggle = (key: keyof typeof alerts, label: string) => {
    setAlerts({ ...alerts, [key]: !alerts[key] });
    toast({
      title: alerts[key] ? "Alert disabled" : "Alert enabled",
      description: `${label} notifications ${alerts[key] ? 'off' : 'on'}`,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Security Alerts</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
          <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-600 dark:text-blue-400">
            <p className="font-semibold mb-1">Stay protected</p>
            <p>Get notified of suspicious activity on your account via email and push notifications</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <div className="font-semibold">Unrecognized Login</div>
                  <div className="text-sm text-muted-foreground">Login from new location</div>
                </div>
              </div>
              <Switch
                checked={alerts.unrecognizedLogin}
                onCheckedChange={() => handleToggle("unrecognizedLogin", "Unrecognized login")}
              />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">New Device</div>
                  <div className="text-sm text-muted-foreground">Login from unrecognized device</div>
                </div>
              </div>
              <Switch
                checked={alerts.newDevice}
                onCheckedChange={() => handleToggle("newDevice", "New device")}
              />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Shield className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <div className="font-semibold">Password Change</div>
                  <div className="text-sm text-muted-foreground">When password is updated</div>
                </div>
              </div>
              <Switch
                checked={alerts.passwordChange}
                onCheckedChange={() => handleToggle("passwordChange", "Password change")}
              />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Mail className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="font-semibold">Email Change</div>
                  <div className="text-sm text-muted-foreground">When email is updated</div>
                </div>
              </div>
              <Switch
                checked={alerts.emailChange}
                onCheckedChange={() => handleToggle("emailChange", "Email change")}
              />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Shield className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="font-semibold">2FA Disabled</div>
                  <div className="text-sm text-muted-foreground">Two-factor auth turned off</div>
                </div>
              </div>
              <Switch
                checked={alerts.twoFactorDisabled}
                onCheckedChange={() => handleToggle("twoFactorDisabled", "2FA disabled")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
