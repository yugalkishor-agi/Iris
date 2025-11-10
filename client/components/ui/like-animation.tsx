import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeAnimationProps {
  isLiked: boolean;
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  count?: number;
}

export function LikeAnimation({
  isLiked,
  onToggle,
  size = "md",
  showCount = false,
  count = 0,
}: LikeAnimationProps) {
  const [burstActive, setBurstActive] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);

  const sizes = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const handleClick = () => {
    if (!isLiked) {
      // Trigger burst animation
      setBurstActive(true);
      setParticles(Array.from({ length: 8 }, (_, i) => i));
      
      setTimeout(() => {
        setBurstActive(false);
        setParticles([]);
      }, 600);
    }
    
    onToggle();
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Like Button */}
      <button
        onClick={handleClick}
        className={cn(
          "relative transition-all",
          isLiked && "animate-bounce-once"
        )}
      >
        <Heart
          className={cn(
            sizes[size],
            "transition-all duration-300",
            isLiked
              ? "text-red-500 fill-red-500 scale-110"
              : "text-foreground hover:text-red-400 hover:scale-110"
          )}
          strokeWidth={2}
        />

        {/* Burst Particles */}
        {burstActive && (
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((i) => {
              const angle = (360 / particles.length) * i;
              const distance = 40;
              const x = Math.cos((angle * Math.PI) / 180) * distance;
              const y = Math.sin((angle * Math.PI) / 180) * distance;

              return (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    animation: `particle-burst 0.6s ease-out forwards`,
                    animationDelay: `${i * 20}ms`,
                  }}
                >
                  <Heart
                    className="h-3 w-3 text-red-500 fill-red-500"
                    style={{
                      transform: `translate(${x}px, ${y}px) scale(0)`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Ring Effect */}
        {burstActive && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-75" />
            <div className="absolute inset-0 rounded-full border border-red-400 animate-ping opacity-50" style={{ animationDelay: '100ms' }} />
          </>
        )}
      </button>

      {/* Count */}
      {showCount && (
        <span
          className={cn(
            "text-sm font-medium transition-all",
            isLiked && burstActive && "scale-110 text-red-500"
          )}
        >
          {count.toLocaleString()}
        </span>
      )}

      <style>{`
        @keyframes particle-burst {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(0);
          }
          50% {
            opacity: 1;
            transform: translate(var(--x), var(--y)) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--x), var(--y)) scale(0);
          }
        }
        
        @keyframes bounce-once {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.3);
          }
          50% {
            transform: scale(0.9);
          }
          75% {
            transform: scale(1.1);
          }
        }
        
        .animate-bounce-once {
          animation: bounce-once 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
