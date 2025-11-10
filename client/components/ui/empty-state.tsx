import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "minimal" | "colorful";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
}: EmptyStateProps) {
  const variants = {
    default: {
      container: "flex flex-col items-center justify-center py-12 px-4 text-center",
      iconWrapper: "p-6 bg-muted/50 rounded-full mb-4",
      icon: "h-12 w-12 text-muted-foreground",
      title: "text-lg font-semibold mb-2",
      description: "text-sm text-muted-foreground mb-4",
    },
    minimal: {
      container: "flex flex-col items-center justify-center py-8 px-4 text-center",
      iconWrapper: "p-4 bg-muted/30 rounded-full mb-3",
      icon: "h-8 w-8 text-muted-foreground/70",
      title: "text-base font-medium mb-1",
      description: "text-xs text-muted-foreground mb-3",
    },
    colorful: {
      container: "flex flex-col items-center justify-center py-16 px-4 text-center",
      iconWrapper: "p-8 bg-gradient-to-br from-primary/10 via-cyan-500/10 to-blue-500/10 rounded-full mb-6 shadow-lg",
      icon: "h-16 w-16 text-primary",
      title: "text-xl font-bold mb-3 bg-gradient-to-r from-primary via-cyan-500 to-blue-500 bg-clip-text text-transparent",
      description: "text-sm text-muted-foreground mb-6",
    },
  };

  const styles = variants[variant];

  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <Icon className={styles.icon} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <Button onClick={action.onClick} variant="default" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
