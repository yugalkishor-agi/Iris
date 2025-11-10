import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { storyService } from "../../src/services/story.service";
import { glimpseService } from "../../src/services/glimpse.service";
import { messageService } from "../../src/services/message.service";

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [dataLoaded, setDataLoaded] = useState(false);

  // Mark that splash has been shown
  useEffect(() => {
    sessionStorage.setItem('splashShown', 'true');
  }, []);

  // Preload home data during splash screen
  useEffect(() => {
    if (!user || loading) return;

    const preloadData = async () => {
      try {
        // Preload stories and messages in parallel
        await Promise.all([
          storyService.getFollowingStories(user.userId),
          messageService.getUserConversations(user.userId),
        ]);
        setDataLoaded(true);
      } catch (error) {
        console.error('Failed to preload data:', error);
        setDataLoaded(true); // Continue anyway
      }
    };

    preloadData();
  }, [user, loading]);

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;
    
    // 3 second timer
    const timer = setTimeout(() => {
      if (user) {
        navigate("/", { replace: true }); // Go to home if logged in
      } else {
        navigate("/welcome", { replace: true }); // Go to welcome screen if not logged in
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, user, loading]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="text-center space-y-8 animate-fade-in">
        {/* Logo - Slightly above center */}
        <div className="relative -translate-y-8">
          <img 
            src="/Iris-logo-splesh-screen.png" 
            alt="Iris Logo" 
            className="w-40 h-40 mx-auto animate-float drop-shadow-2xl"
          />
          <div className="absolute inset-0 -z-10 blur-3xl bg-primary/30 rounded-full animate-pulse" />
        </div>

        {/* Slogan */}
        <p className="text-white/80 text-lg font-medium tracking-wide px-8">
          Made with Love, Shared with the World.
        </p>

        {/* Powered by India with Tricolor */}
        <div className="flex items-center justify-center gap-2 text-base font-semibold">
          <span className="text-white/60">Powered by</span>
          <span 
            className="font-bold text-xl"
            style={{
              background: 'linear-gradient(to bottom, #FF9933 0%, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%, #138808 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            India
          </span>
        </div>

        {/* Loading indicator */}
        {user && !dataLoaded && (
          <div className="flex items-center justify-center gap-2 text-white/40 text-xs mt-6">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
    </div>
  );
}
