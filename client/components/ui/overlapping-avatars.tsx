import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";

interface LikerData {
  userId: string;
  username: string;
  avatarURL: string;
  verified?: boolean;
}

interface OverlappingAvatarsProps {
  likers: LikerData[];
  maxDisplay?: number;
}

export function OverlappingAvatars({ likers, maxDisplay = 3 }: OverlappingAvatarsProps) {
  const displayLikers = likers.slice(0, maxDisplay);

  return (
    <div className="relative flex items-center" style={{ width: displayLikers.length > 1 ? `${40 + (displayLikers.length - 1) * 24}px` : '48px' }}>
      {displayLikers.map((liker, index) => (
        <div
          key={liker.userId}
          className="absolute"
          style={{
            left: `${index * 24}px`,
            zIndex: maxDisplay - index,
          }}
        >
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-background">
              <AvatarImage src={liker.avatarURL} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary font-semibold">
                {liker.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {liker.verified && (
              <div className="absolute -bottom-0.5 -right-0.5">
                <VerifiedBadge size="sm" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
