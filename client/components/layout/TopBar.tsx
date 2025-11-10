import { PropsWithChildren, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopBar({
  title,
  leftSlot,
  rightSlot,
  showLogo = false,
  showBackButton = false,
  backTo,
}: {
  title: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  showLogo?: boolean;
  showBackButton?: boolean;
  backTo?: string;
}) {
  const navigate = useNavigate();

  return (
    <header className="sticky z-40 w-full border-b bg-gradient-to-r from-background via-background to-primary/5 backdrop-blur supports-[backdrop-filter]:bg-background/75" style={{ top: 0 }}>
      <div className="flex h-14 items-center justify-between px-4" style={{ paddingLeft: 'max(1rem, var(--sal))', paddingRight: 'max(1rem, var(--sar))' }}>
        {showBackButton ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (backTo) {
                navigate(backTo);
              } else {
                navigate(-1);
              }
            }}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : showLogo ? (
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-wide">
            Iɾɨs
          </h1>
        ) : (
          leftSlot ?? <div />
        )}
        {showLogo ? (
          <div />
        ) : (
          <h1 className="text-lg font-semibold">{title}</h1>
        )}
        {rightSlot ?? <div />}
      </div>
    </header>
  );
}
