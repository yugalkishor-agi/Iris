import { useState } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveAnimationProps {
  isSaved: boolean;
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
}

export function SaveAnimation({
  isSaved,
  onToggle,
  size = "md",
}: SaveAnimationProps) {
  const [fillProgress, setFillProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const sizes = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const handleClick = () => {
    if (!isSaved) {
      // Trigger fill animation
      setIsAnimating(true);
      
      // Animate fill from bottom to top
      const duration = 300;
      const steps = 20;
      const increment = 100 / steps;
      
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setFillProgress((currentStep / steps) * 100);
        
        if (currentStep >= steps) {
          clearInterval(interval);
          setTimeout(() => {
            setIsAnimating(false);
            setFillProgress(0);
          }, 100);
        }
      }, duration / steps);
    }
    
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative transition-all",
        isSaved && "animate-save-bounce"
      )}
    >
      {/* Bookmark Icon */}
      <div className="relative">
        <Bookmark
          className={cn(
            sizes[size],
            "transition-all duration-300",
            isSaved
              ? "text-primary fill-primary"
              : "text-foreground hover:text-primary/70 hover:scale-110"
          )}
          strokeWidth={2}
        />

        {/* Fill Animation Overlay */}
        {isAnimating && !isSaved && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
          >
            <div
              className="absolute inset-0 bg-primary transition-all duration-300 ease-out"
              style={{
                transform: `translateY(${100 - fillProgress}%)`,
              }}
            />
            <Bookmark
              className={cn(sizes[size], "absolute top-0 left-0 text-white")}
              strokeWidth={2}
              fill="white"
            />
          </div>
        )}
      </div>

      {/* Sparkle Effect on Save */}
      {isSaved && isAnimating && (
        <div className="absolute inset-0 pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute top-0 left-1/2 -translate-x-1/2"
              style={{
                animation: `sparkle 0.6s ease-out forwards`,
                animationDelay: `${i * 100}ms`,
              }}
            >
              <div
                className="h-1 w-1 bg-primary rounded-full"
                style={{
                  transform: `rotate(${i * 90}deg) translateY(-${12 + i * 4}px)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pulse Ring on Save */}
      {isAnimating && !isSaved && (
        <div className="absolute inset-0 rounded-md">
          <div className="absolute inset-0 border-2 border-primary rounded-md animate-ping opacity-75" />
        </div>
      )}

      <style>{`
        @keyframes sparkle {
          0% {
            opacity: 1;
            transform: scale(0) translateY(0);
          }
          50% {
            opacity: 1;
            transform: scale(1) translateY(-8px);
          }
          100% {
            opacity: 0;
            transform: scale(0) translateY(-16px);
          }
        }
        
        @keyframes save-bounce {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.2) rotate(-5deg);
          }
          50% {
            transform: scale(0.9) rotate(5deg);
          }
          75% {
            transform: scale(1.1) rotate(-3deg);
          }
        }
        
        .animate-save-bounce {
          animation: save-bounce 0.5s ease-in-out;
        }
      `}</style>
    </button>
  );
}
