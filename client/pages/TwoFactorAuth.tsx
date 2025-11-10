import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Shield, Copy, Check, Smartphone } from "lucide-react";

export default function TwoFactorAuth() {
  const [step, setStep] = useState<"intro" | "setup" | "verify" | "backup">("intro");
  const [verificationCode, setVerificationCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const backupCodes = [
    "A1B2-C3D4-E5F6",
    "G7H8-I9J0-K1L2",
    "M3N4-O5P6-Q7R8",
    "S9T0-U1V2-W3X4",
    "Y5Z6-A7B8-C9D0",
    "E1F2-G3H4-I5J6",
  ];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings/security" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Two-Factor Authentication</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* Intro Step */}
        {step === "intro" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-center">
              <div className="p-6 bg-primary/10 rounded-full">
                <Shield className="h-16 w-16 text-primary" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Secure Your Account</h2>
              <p className="text-muted-foreground">
                Add an extra layer of security to your account with two-factor authentication
              </p>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  How it works
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2 ml-7">
                  <li>• Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>• Scan the QR code we provide</li>
                  <li>• Enter the 6-digit code from your app</li>
                  <li>• Save backup codes for account recovery</li>
                </ul>
              </div>

              <Button className="w-full" onClick={() => setStep("setup")}>
                Get Started
              </Button>
            </div>
          </div>
        )}

        {/* Setup Step - QR Code */}
        {step === "setup" && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Scan QR Code</h2>
              <p className="text-sm text-muted-foreground">
                Use your authenticator app to scan this code
              </p>
            </div>

            {/* QR Code Placeholder */}
            <div className="flex justify-center p-6 bg-muted rounded-lg">
              <div className="w-48 h-48 bg-background border-4 border-foreground flex items-center justify-center">
                <div className="text-center text-sm text-muted-foreground p-4">
                  QR Code<br />will appear here
                </div>
              </div>
            </div>

            {/* Manual Setup Key */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Can't scan? Enter this key manually:</p>
              <div className="flex items-center gap-2">
                <Input
                  value="JBSWY3DPEHPK3PXP"
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleCopyCode("JBSWY3DPEHPK3PXP")}
                >
                  {copiedCode === "JBSWY3DPEHPK3PXP" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("intro")}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep("verify")}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Verify Step */}
        {step === "verify" && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Enter Verification Code</h2>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl font-mono tracking-widest"
                maxLength={6}
              />

              <p className="text-xs text-muted-foreground text-center">
                The code changes every 30 seconds
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("setup")}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={() => setStep("backup")}
                disabled={verificationCode.length !== 6}
              >
                Verify
              </Button>
            </div>
          </div>
        )}

        {/* Backup Codes Step */}
        {step === "backup" && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-500/10 rounded-full">
                  <Check className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold">Save Backup Codes</h2>
              <p className="text-sm text-muted-foreground">
                Store these codes safely. Each can be used once if you lose access to your authenticator app.
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              {backupCodes.map((code, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-muted rounded"
                >
                  <span className="font-mono text-sm">{code}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleCopyCode(code)}
                  >
                    {copiedCode === code ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const codesText = backupCodes.join("\n");
                  navigator.clipboard.writeText(codesText);
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
              <Button className="flex-1" asChild>
                <Link to="/settings/security">Done</Link>
              </Button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-sm text-amber-600 dark:text-amber-500">
                <strong>⚠️ Important:</strong> Save these codes in a secure location. You won't be able to see them again.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
