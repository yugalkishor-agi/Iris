import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function WelcomeScreen() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Max width container for mobile */}
      <div className="flex flex-col min-h-screen max-w-md mx-auto w-full">
        {/* Top Section - Logo and Branding */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-8">
          <div className="text-center space-y-6 sm:space-y-8 animate-fade-in">
            {/* Logo */}
            <div className="relative">
              <img 
                src="/Iris-logo-splesh-screen.png" 
                alt="Iris Logo" 
                className="w-60 h-60 sm:w-72 sm:h-72 mx-auto"
              />
            </div>
            
            {/* Tagline */}
            <p className="text-muted-foreground text-sm sm:text-base">
              Share your glimpses with the world
            </p>
          </div>
        </div>

        {/* Bottom Section - Auth Buttons */}
        <div className="px-6 sm:px-8 pb-8 sm:pb-12 space-y-3 sm:space-y-4 animate-slide-up">
          {/* Sign Up Button (Primary) */}
          <Button 
            asChild 
            className="w-full h-11 sm:h-12 text-base font-semibold rounded-lg"
            size="lg"
          >
            <Link to="/signup">Create new account</Link>
          </Button>

          {/* Log In Link */}
          <div className="text-center py-2">
            <span className="text-sm text-muted-foreground">
              Already have an account?{" "}
            </span>
            <Link 
              to="/login" 
              className="text-sm font-semibold text-primary hover:underline"
            >
              Log in
            </Link>
          </div>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
          </div>

          {/* Terms and Privacy */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed px-4">
              By continuing, you agree to our{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Terms
              </Link>
              {" "}and{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
