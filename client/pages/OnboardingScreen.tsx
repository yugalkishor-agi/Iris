import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Camera, Users, Sparkles } from "lucide-react";

const slides = [
  {
    icon: Camera,
    title: "Share Glimpses",
    description: "Capture and share your moments with beautiful photos and videos",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Connect with World",
    description: "Follow friends, discover creators, and build your community",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Sparkles,
    title: "Express Yourself",
    description: "Be creative, be authentic, be you. Your story matters.",
    gradient: "from-violet-500 to-purple-500",
  },
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/login");
    }
  };

  const handleSkip = () => {
    navigate("/login");
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
          Skip
        </Button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 space-y-8 animate-fade-in">
        <div className={`relative p-8 rounded-full bg-gradient-to-br ${slide.gradient}`}>
          <Icon className="w-16 h-16 text-white" />
          <div className="absolute inset-0 -z-10 blur-2xl opacity-50 rounded-full" 
               style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">{slide.title}</h2>
          <p className="text-muted-foreground max-w-sm">{slide.description}</p>
        </div>

        {/* Dots indicator */}
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide ? "w-8 bg-primary" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Next button */}
      <div className="p-8">
        <Button onClick={handleNext} className="w-full" size="lg">
          {currentSlide < slides.length - 1 ? (
            <>
              Next <ChevronRight className="ml-2 h-5 w-5" />
            </>
          ) : (
            "Get Started"
          )}
        </Button>
      </div>
    </div>
  );
}
