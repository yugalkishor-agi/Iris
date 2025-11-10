import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Image as ImageIcon, Film, Radio, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface RadialCreateMenuProps {
  isOpen: boolean;
  onClose: () => void;
  buttonPosition?: { x: number; y: number };
}

export function RadialCreateMenu({ isOpen, onClose, buttonPosition }: RadialCreateMenuProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isClosing, setIsClosing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const menuOptions = [
    {
      id: "story",
      label: "Story",
      icon: Camera,
      gradient: "from-purple-500 to-fuchsia-500",
      glowColor: "rgba(168, 85, 247, 0.5)",
      route: "/story-create",
      angle: -60, // degrees from center
    },
    {
      id: "post",
      label: "Post",
      icon: ImageIcon,
      gradient: "from-cyan-500 to-blue-500",
      glowColor: "rgba(6, 182, 212, 0.5)",
      route: "/create-post",
      angle: -20,
    },
    {
      id: "glimpse",
      label: "Glimpse",
      icon: Film,
      gradient: "from-blue-500 to-indigo-600",
      glowColor: "rgba(59, 130, 246, 0.5)",
      route: "/glimpse-create",
      angle: 20,
    },
    {
      id: "live",
      label: "Live",
      icon: Radio,
      gradient: "from-slate-600 to-slate-700",
      glowColor: "rgba(100, 116, 139, 0.3)",
      route: "/live",
      angle: 60,
      comingSoon: false,
    },
  ];

  useEffect(() => {
    if (isOpen) {
      // Delay showing options for smooth animation
      setTimeout(() => setShowOptions(true), 150);
    } else {
      setShowOptions(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setShowOptions(false);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleOptionClick = (option: typeof menuOptions[0]) => {
    if (option.comingSoon) {
      toast({
        title: "Coming Soon!",
        description: `${option.label} feature will be available soon.`,
      });
      return;
    }

    // Collapse animation
    setShowOptions(false);
    setTimeout(() => {
      handleClose();
      setTimeout(() => {
        navigate(option.route);
      }, 100);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Frosted Glass Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition-all duration-300",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        style={{
          backgroundColor: "rgba(20, 20, 25, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onClick={handleClose}
      />

      {/* Radial Menu Container */}
      <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-center pb-24">
        {/* Center Point (where + button is) */}
        <div className="relative">
          {/* Expanding Circle Animation */}
          <div
            className={cn(
              "absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full bg-gradient-to-br from-primary via-cyan-500 to-blue-500 transition-all duration-500 ease-out",
              isClosing || !showOptions ? "w-14 h-14 opacity-0" : "w-48 h-48 opacity-20"
            )}
            style={{
              filter: "blur(20px)",
            }}
          />

          {/* Close Button (Center) */}
          <button
            onClick={handleClose}
            className={cn(
              "relative pointer-events-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary via-cyan-500 to-blue-500 flex items-center justify-center shadow-2xl transition-all duration-300",
              isClosing ? "scale-75 opacity-0" : "scale-100 opacity-100 hover:scale-110"
            )}
            style={{
              boxShadow: "0 0 24px rgba(6, 182, 212, 0.6)",
            }}
          >
            <X className="h-7 w-7 text-white" strokeWidth={3} />
          </button>

          {/* Radial Options */}
          {menuOptions.map((option, index) => {
            const Icon = option.icon;
            const radius = 120; // Distance from center
            const angleRad = (option.angle * Math.PI) / 180;
            const x = Math.sin(angleRad) * radius;
            const y = -Math.cos(angleRad) * radius;

            return (
              <div
                key={option.id}
                className={cn(
                  "absolute pointer-events-auto transition-all duration-500 ease-out",
                  showOptions && !isClosing
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                )}
                style={{
                  left: "50%",
                  bottom: "50%",
                  transform: `translate(calc(-50% + ${x}px), calc(50% + ${y}px))`,
                  transitionDelay: showOptions ? `${index * 80}ms` : "0ms",
                }}
              >
                <button
                  onClick={() => handleOptionClick(option)}
                  className={cn(
                    "group relative flex flex-col items-center gap-2 transition-all duration-300",
                    option.comingSoon && "opacity-60 cursor-not-allowed"
                  )}
                  disabled={option.comingSoon}
                >
                  {/* Glowing Button */}
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center transition-all duration-300",
                      option.gradient,
                      !option.comingSoon && "group-hover:scale-110 group-active:scale-95"
                    )}
                    style={{
                      boxShadow: `0 0 16px ${option.glowColor}`,
                    }}
                  >
                    <Icon className="h-7 w-7 text-white" strokeWidth={2.5} />

                    {/* Hover Glow Effect */}
                    {!option.comingSoon && (
                      <div
                        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          boxShadow: `0 0 24px ${option.glowColor}, 0 0 36px ${option.glowColor}`,
                        }}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className="text-sm font-medium text-gray-200 whitespace-nowrap"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontSize: "13px",
                    }}
                  >
                    {option.label}
                  </span>

                  {/* Coming Soon Badge */}
                  {option.comingSoon && (
                    <span className="absolute -top-1 -right-1 text-[9px] font-bold text-white bg-slate-600 px-1.5 py-0.5 rounded-full">
                      Soon
                    </span>
                  )}

                  {/* Pulse Animation for Live */}
                  {option.id === "live" && option.comingSoon && (
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-slate-500" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optional: Subtle Sparkle Particles */}
      {showOptions && !isClosing && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${30 + Math.random() * 40}%`,
                opacity: Math.random() * 0.5 + 0.3,
                animationDelay: `${i * 100}ms`,
                animationDuration: `${2000 + Math.random() * 1000}ms`,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
