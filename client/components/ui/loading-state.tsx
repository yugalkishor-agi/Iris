import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  variant?: "spinner" | "skeleton" | "dots" | "pulse";
  text?: string;
  skeletonCount?: number;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({
  variant = "spinner",
  text,
  skeletonCount = 3,
  size = "md",
}: LoadingStateProps) {
  const sizes = {
    sm: { spinner: "h-4 w-4", text: "text-xs", padding: "py-4" },
    md: { spinner: "h-8 w-8", text: "text-sm", padding: "py-8" },
    lg: { spinner: "h-12 w-12", text: "text-base", padding: "py-12" },
  };

  const sizeConfig = sizes[size];

  if (variant === "spinner") {
    return (
      <div className={`flex flex-col items-center justify-center ${sizeConfig.padding}`}>
        <Loader2 className={`${sizeConfig.spinner} animate-spin text-primary`} />
        {text && <p className={`mt-3 ${sizeConfig.text} text-muted-foreground`}>{text}</p>}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={`flex items-center justify-center gap-2 ${sizeConfig.padding}`}>
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={`flex items-center justify-center ${sizeConfig.padding}`}>
        <div className="relative">
          <div className="h-12 w-12 rounded-full bg-primary/20 animate-ping" />
          <div className="absolute inset-0 h-12 w-12 rounded-full bg-gradient-to-br from-primary to-cyan-500" />
        </div>
        {text && <p className={`mt-3 ${sizeConfig.text} text-muted-foreground`}>{text}</p>}
      </div>
    );
  }

  // skeleton variant
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
