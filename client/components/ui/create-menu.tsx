import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Image as ImageIcon,
  Film,
  Radio,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CreateMenuProps {
  onClose?: () => void;
}

export function CreateMenu({ onClose }: CreateMenuProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isClosing, setIsClosing] = useState(false);

  const menuItems = [
    {
      id: "story",
      label: "Story",
      icon: Camera,
      gradient: "from-purple-500 via-pink-500 to-red-500",
      route: "/story-create",
    },
    {
      id: "post",
      label: "Post",
      icon: ImageIcon,
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      route: "/create-post",
    },
    {
      id: "glimpse",
      label: "Glimpse",
      icon: Film,
      gradient: "from-orange-500 via-red-500 to-pink-500",
      route: "/glimpse-create",
    },
    {
      id: "live",
      label: "Live",
      icon: Radio,
      gradient: "from-red-600 via-pink-600 to-purple-600",
      route: "/live",
      comingSoon: false,
    },
  ];

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 200);
  };

  const handleItemClick = (item: typeof menuItems[0]) => {
    if (item.comingSoon) {
      toast({
        title: "Coming Soon!",
        description: `${item.label} feature will be available soon.`,
      });
      return;
    }

    handleClose();
    setTimeout(() => {
      navigate(item.route);
    }, 250);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-200",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      {/* Menu Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            "pointer-events-auto transition-all duration-300",
            isClosing ? "scale-75 opacity-0" : "scale-100 opacity-100"
          )}
        >
          {/* Close Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleClose}
              className="group relative h-14 w-14 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-white/20 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
            >
              <X className="h-6 w-6 text-white" strokeWidth={2.5} />
              <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors" />
            </button>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-2 gap-4 w-[280px]">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "group relative rounded-2xl overflow-hidden transition-all duration-300",
                    "hover:scale-105 active:scale-95",
                    isClosing ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                  )}
                  style={{
                    transitionDelay: isClosing ? '0ms' : `${index * 50}ms`,
                  }}
                >
                  {/* Gradient Background */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br",
                    item.gradient,
                    "opacity-90 group-hover:opacity-100 transition-opacity"
                  )} />

                  {/* Glow Effect */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br",
                    item.gradient,
                    "opacity-0 group-hover:opacity-40 blur-xl transition-opacity"
                  )} />

                  {/* Content */}
                  <div className="relative p-6 flex flex-col items-center justify-center gap-3">
                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
                      <Icon className="h-7 w-7 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-white font-bold text-sm">
                      {item.label}
                    </span>
                    
                    {item.comingSoon && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold text-white/80 bg-black/30 px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    )}
                  </div>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>
              );
            })}
          </div>

          {/* Bottom Text */}
          <p className="text-center text-white/60 text-xs mt-6">
            What do you want to create?
          </p>
        </div>
      </div>
    </>
  );
}

// Floating Action Button Component
export function CreateButton() {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowMenu(true)}
        className="fixed bottom-24 right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-primary via-cyan-500 to-blue-500 shadow-2xl flex items-center justify-center group hover:scale-110 transition-all active:scale-95"
      >
        <Plus className="h-7 w-7 text-white" strokeWidth={3} />
        
        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-cyan-500 to-blue-500 opacity-0 group-hover:opacity-60 blur-xl transition-opacity" />
      </button>

      {showMenu && <CreateMenu onClose={() => setShowMenu(false)} />}
    </>
  );
}
