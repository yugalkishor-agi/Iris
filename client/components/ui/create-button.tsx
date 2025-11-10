import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, X, Film, Image, Camera, Radio } from "lucide-react";

interface CreateOption {
  id: string;
  label: string;
  description: string;
  icon: any;
  iconColor: string;
  to: string;
  available: boolean;
}

const createOptions: CreateOption[] = [
  {
    id: "glimpse",
    label: "Glimpse",
    description: "Short Video",
    icon: Film,
    iconColor: "text-purple-500",
    to: "/story/new",
    available: true,
  },
  {
    id: "post",
    label: "Post",
    description: "Photo/Carousel",
    icon: Image,
    iconColor: "text-blue-500",
    to: "/post/new",
    available: true,
  },
  {
    id: "story",
    label: "Story",
    description: "24-hr",
    icon: Camera,
    iconColor: "text-pink-500",
    to: "/story-create",
    available: true,
  },
  {
    id: "live",
    label: "Live",
    description: "Coming Soon",
    icon: Radio,
    iconColor: "text-red-500",
    to: "#",
    available: false,
  },
];

export function CreateButton() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevLocationRef = useRef(location.pathname);

  // Track route changes for animation
  useEffect(() => {
    if (prevLocationRef.current !== location.pathname) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      prevLocationRef.current = location.pathname;
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Options Menu */}
      {isOpen && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 min-w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">Create</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-accent rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-3">
              {createOptions.map((option, index) => {
                const Icon = option.icon;
                const delay = index * 50;

                return option.available ? (
                  <Link
                    key={option.id}
                    to={option.to}
                    onClick={() => setIsOpen(false)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-accent transition-all hover:scale-105 group"
                    style={{
                      animation: `bounce-in 0.4s ease-out ${delay}ms both`,
                    }}
                  >
                    <div
                      className={`p-3 bg-gradient-to-br ${
                        option.id === "glimpse"
                          ? "from-purple-500/20 to-purple-600/20"
                          : option.id === "post"
                          ? "from-blue-500/20 to-blue-600/20"
                          : option.id === "story"
                          ? "from-pink-500/20 to-pink-600/20"
                          : "from-red-500/20 to-red-600/20"
                      } rounded-2xl group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`h-6 w-6 ${option.iconColor}`} />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold">{option.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div
                    key={option.id}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl opacity-50 cursor-not-allowed"
                    style={{
                      animation: `bounce-in 0.4s ease-out ${delay}ms both`,
                    }}
                  >
                    <div className="p-3 bg-muted rounded-2xl">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold">{option.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Create Button with Docking Animation */}
      <Link
        to="/create-post"
        className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
          isHomePage ? 'bottom-24' : 'bottom-[26px]'
        }`}
        aria-label="Create new post"
        style={{
          transform: isHomePage 
            ? 'translateX(-50%) translateY(0) scale(1)' 
            : 'translateX(-50%) translateY(0) scale(0.75)'
        }}
      >
        {/* Conditional Glow Effect - Only on Home */}
        {isHomePage && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-primary via-cyan-400 to-blue-500 rounded-full blur-2xl transition-opacity duration-500"
            style={{
              opacity: isAnimating ? 0 : 0.5,
              animation: isHomePage ? 'pulse 2s ease-in-out infinite' : 'none'
            }}
          />
        )}
        
        {/* Main Button Circle */}
        <div 
          className={`relative rounded-full flex items-center justify-center transition-all duration-500 ease-out ${
            isHomePage 
              ? 'h-16 w-16 bg-primary shadow-2xl shadow-primary/50 border-4 border-background hover:scale-110' 
              : 'h-12 w-12 bg-primary shadow-lg shadow-primary/20 hover:scale-105'
          } active:scale-95`}
        >
          <Plus 
            className={`text-white transition-all duration-500 ${
              isHomePage ? 'h-8 w-8 stroke-[3]' : 'h-6 w-6 stroke-[2.5]'
            }`}
          />
        </div>
      </Link>
    </>
  );
}
