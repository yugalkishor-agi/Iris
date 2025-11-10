import { Link } from "react-router-dom";
import { ChevronLeft, Info, Heart, Shield, Users, AlertTriangle } from "lucide-react";

export default function Guidelines() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Community Guidelines</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="text-center py-6">
          <Users className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Be Kind, Be Respectful</h2>
          <p className="text-muted-foreground">
            Let's make Iris a positive space for everyone
          </p>
        </div>

        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-3 mb-2">
              <Heart className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold mb-2">Be Respectful</h3>
                <p className="text-sm text-muted-foreground">
                  Treat others how you want to be treated. Respect different viewpoints and backgrounds.
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-3 mb-2">
              <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold mb-2">Stay Safe</h3>
                <p className="text-sm text-muted-foreground">
                  Don't share personal information publicly. Report suspicious activity.
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-3 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold mb-2">No Harmful Content</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• No hate speech or discrimination</li>
                  <li>• No harassment or bullying</li>
                  <li>• No violence or threats</li>
                  <li>• No self-harm content</li>
                  <li>• No adult content</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-3 mb-2">
              <Info className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold mb-2">Be Authentic</h3>
                <p className="text-sm text-muted-foreground">
                  Use your real identity. No fake accounts or impersonation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Violations may result in content removal, account suspension, or permanent ban.
          </p>
        </div>
      </div>
    </div>
  );
}
