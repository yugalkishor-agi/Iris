import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X, Camera, Image as ImageIcon, Type, Wand2, Users } from "lucide-react";

interface StoryCreateMenuProps {
  open: boolean;
  onClose: () => void;
}

const createOptions = [
  { icon: Camera, label: "Camera", color: "from-blue-500 to-cyan-500", angle: -60 },
  { icon: ImageIcon, label: "Gallery", color: "from-purple-500 to-pink-500", angle: -30 },
  { icon: Type, label: "Text", color: "from-orange-500 to-yellow-500", angle: 0 },
  { icon: Wand2, label: "AI Create", color: "from-green-500 to-emerald-500", angle: 30 },
  { icon: Users, label: "Close Friends", color: "from-emerald-400 to-lime-500", angle: 60 },
];

export function StoryCreateMenu({ open, onClose }: StoryCreateMenuProps) {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    // Navigate to moment create page
    navigate('/moment-create');
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* Blurred Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-blue-900/40 backdrop-blur-2xl" />
      
      {/* Radial Menu Container */}
      <div 
        className="relative max-w-md w-full h-[80vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-8 right-8 p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all z-20 active:scale-90"
        >
          <X className="h-6 w-6 text-white" />
        </button>

        {/* Center Circle - Main Action */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-cyan-400 to-blue-500 rounded-full blur-3xl opacity-40 animate-pulse" 
            style={{ width: '200px', height: '200px' }}
          />
          
          {/* Main Button */}
          <button className="relative z-10 w-32 h-32 bg-gradient-to-br from-primary via-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group">
            <Camera className="h-12 w-12 text-white group-hover:rotate-12 transition-transform" strokeWidth={2} />
          </button>

          {/* Radial Options */}
          {createOptions.map((option, index) => {
            const radius = 140;
            const angleRad = (option.angle * Math.PI) / 180;
            const x = Math.sin(angleRad) * radius;
            const y = -Math.cos(angleRad) * radius;

            return (
              <div
                key={option.label}
                className="absolute"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  animation: `float-bounce ${2 + index * 0.2}s ease-in-out infinite`,
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {/* Option Button */}
                <button
                  onClick={() => handleOptionClick(option.label)}
                  className={`relative group/option ${
                    selectedOption === option.label ? 'scale-110' : 'scale-100'
                  } transition-all duration-300`}
                >
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${option.color} rounded-full blur-xl opacity-50 group-hover/option:opacity-70 transition-opacity`} />
                  
                  {/* Button */}
                  <div className={`relative w-16 h-16 bg-gradient-to-br ${option.color} rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all`}>
                    <option.icon className="h-7 w-7 text-white" strokeWidth={2.5} />
                  </div>
                  
                  {/* Label */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-xs font-semibold text-white/90 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                      {option.label}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="absolute bottom-12 left-0 right-0 text-center">
          <p className="text-white/70 text-sm font-medium">
            Tap to create your story
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
