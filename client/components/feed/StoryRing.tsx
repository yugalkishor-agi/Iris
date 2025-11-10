import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StoryViewer } from "./StoryViewer";
import { StoryCreateMenu } from "./StoryCreateMenu";
import { Plus, Star } from "lucide-react";

type StoryStatus = 'new' | 'viewed' | 'close-friends' | 'own';

interface StoryRingProps {
  user: { id: number; name: string; avatar?: string; stories: any[]; isOwn?: boolean; isCloseFriend?: boolean };
  allUsers: any[];
  status?: StoryStatus;
}

export function StoryRing({ user, allUsers, status = 'new' }: StoryRingProps) {
  const [showViewer, setShowViewer] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Ring gradient based on story type
  const getRingStyle = () => {
    if (user.isOwn) {
      return "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500";
    }
    if (status === 'new') {
      return "bg-gradient-to-br from-pink-500 via-purple-500 to-violet-600";
    }
    if (status === 'close-friends') {
      return "bg-gradient-to-br from-emerald-400 via-green-500 to-lime-500";
    }
    return "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500";
  };

  // Glow effect based on status
  const getGlowClass = () => {
    if (user.isOwn) return "";
    if (status === 'new') return "shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse";
    if (status === 'close-friends') return "shadow-[0_0_20px_rgba(34,197,94,0.4)]";
    return "";
  };

  return (
    <>
      <button 
        onClick={() => user.isOwn ? setShowCreateMenu(true) : setShowViewer(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex flex-col items-center gap-2 min-w-[80px] group relative"
      >
        {/* Story Ring Container */}
        <div className="relative">
          {/* Outer Glow Layer */}
          <div className={`absolute inset-0 rounded-full ${getGlowClass()} transition-all duration-300`} />
          
          {/* Ring Layer */}
          <div 
            className={`relative rounded-full p-[3px] transition-all duration-300 ${
              getRingStyle()
            } ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
            style={{
              animation: status === 'new' ? 'subtle-pulse 2s ease-in-out infinite' : 'none'
            }}
          >
            {/* Inner Content - Profile Picture */}
            <div className="relative">
              <Avatar className="h-[72px] w-[72px] border-[3px] border-background rounded-full shadow-lg">
                <AvatarImage src={user.avatar} className="object-cover" />
                <AvatarFallback className="text-lg bg-gradient-to-br from-primary/30 to-primary/10">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
              
              {/* Add Story Button (Own Story) */}
              {user.isOwn && (
                <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 border-2 border-background shadow-lg">
                  <Plus className="h-4 w-4 text-white" strokeWidth={3} />
                </div>
              )}
              
              {/* Close Friend Indicator */}
              {status === 'close-friends' && (
                <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1 border-2 border-background shadow-lg">
                  <Star className="h-3 w-3 text-white fill-white" />
                </div>
              )}
            </div>
          </div>
          
          {/* Halo Effect on Hover */}
          {isHovered && status === 'new' && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-violet-600/20 blur-xl animate-pulse" />
          )}
        </div>
        
        {/* Username */}
        <p className="text-xs truncate w-full text-center font-medium group-hover:text-foreground transition-colors" style={{ maxWidth: '80px' }}>
          {user.name}
        </p>
      </button>

      <StoryViewer
        open={showViewer}
        onClose={() => setShowViewer(false)}
        initialUser={user}
        allUsers={allUsers}
      />

      <StoryCreateMenu
        open={showCreateMenu}
        onClose={() => setShowCreateMenu(false)}
      />
    </>
  );
}
