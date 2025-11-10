import { cn } from "@/lib/utils";
import { BadgeCheck, ShieldCheck } from "lucide-react";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gradient" | "simple";
  showTooltip?: boolean;
}

export function VerifiedBadge({ 
  className, 
  size = "md", 
  variant = "gradient",
  showTooltip = true 
}: VerifiedBadgeProps) {
  // Professional sizing: sm=14px (for 14px text), md=16px (for 16px text), lg=20px (for headers)
  const sizeClasses = {
    sm: "h-[14px] w-[14px]",
    md: "h-[16px] w-[16px]",
    lg: "h-[20px] w-[20px]"
  };
  
  // Spacing: 4px for 14px, 6px for 16px+ (converted to Tailwind classes)
  const spacingClasses = {
    sm: "ml-1",      // 4px
    md: "ml-1.5",   // 6px
    lg: "ml-2"      // 8px
  };

  const variantClasses = {
    default: "text-blue-500",
    gradient: "text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600",
    simple: "text-primary"
  };

  if (variant === "gradient") {
    return (
      <span 
        className={cn(
          "inline-flex items-center justify-center flex-shrink-0",
          spacingClasses[size],
          "align-middle",
          "relative",
          className
        )}
        role="img"
        aria-label="Verified account"
        title={showTooltip ? "Verified Account" : undefined}
      >
        <div className="relative flex items-center justify-center">
          {/* Glow effect */}
          <div className="absolute inset-0 blur-sm">
            <BadgeCheck className={cn(sizeClasses[size], "text-blue-400")} />
          </div>
          {/* Main badge with gradient */}
          <BadgeCheck 
            className={cn(sizeClasses[size], "relative")} 
            style={{
              fill: "url(#verifiedGradient)",
              color: "url(#verifiedGradient)"
            }}
          />
        </div>
        {/* SVG gradient definition */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="verifiedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
        </svg>
      </span>
    );
  }

  return (
    <span 
      className={cn(
        "inline-flex items-center flex-shrink-0",
        spacingClasses[size],
        "align-middle",
        className
      )}
      role="img"
      aria-label="Verified account"
      title={showTooltip ? "Verified Account" : undefined}
    >
      <BadgeCheck className={cn(sizeClasses[size], variantClasses[variant])} />
    </span>
  );
}

// Premium/Official badge variant
export function OfficialBadge({ 
  className, 
  size = "md" 
}: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-[14px] w-[14px]",
    md: "h-[16px] w-[16px]",
    lg: "h-[20px] w-[20px]"
  };
  
  const spacingClasses = {
    sm: "ml-1",
    md: "ml-1.5",
    lg: "ml-2"
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center justify-center flex-shrink-0",
        spacingClasses[size],
        "align-middle",
        "relative",
        className
      )}
      role="img"
      aria-label="Official account"
      title="Official Account"
    >
      <div className="relative flex items-center justify-center">
        {/* Gold glow */}
        <div className="absolute inset-0 blur-sm">
          <ShieldCheck className={cn(sizeClasses[size], "text-yellow-400")} />
        </div>
        {/* Main badge */}
        <ShieldCheck 
          className={cn(sizeClasses[size], "relative text-yellow-500")} 
        />
      </div>
    </span>
  );
}
