import { useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface StorySliderProps {
  question: string;
  emoji?: string;
  minLabel?: string;
  maxLabel?: string;
  userValue?: number;
  onSlide?: (value: number) => void;
  showResults?: boolean;
  averageValue?: number;
  accentColor?: string;
}

export function StorySlider({
  question,
  emoji = "😊",
  minLabel = "0",
  maxLabel = "100",
  userValue,
  onSlide,
  showResults = false,
  averageValue,
  accentColor = "bg-primary",
}: StorySliderProps) {
  const [value, setValue] = useState<number[]>([userValue ?? 50]);
  const [hasSubmitted, setHasSubmitted] = useState(!!userValue);
  const [isSliding, setIsSliding] = useState(false);

  const handleValueChange = (newValue: number[]) => {
    if (hasSubmitted) return;
    setValue(newValue);
    setIsSliding(true);
  };

  const handleValueCommit = (newValue: number[]) => {
    setIsSliding(false);
    if (!hasSubmitted) {
      setHasSubmitted(true);
      onSlide?.(newValue[0]);
    }
  };

  const currentValue = value[0];
  const displayAverage = averageValue ?? currentValue;

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20">
      {/* Question */}
      <h3 className="text-white font-bold text-lg mb-2 text-center">
        {question}
      </h3>

      {/* Emoji Display */}
      <div className="flex justify-center mb-6">
        <div className={cn(
          "text-6xl transition-transform duration-200",
          isSliding && "scale-110"
        )}>
          {emoji}
        </div>
      </div>

      {/* Value Display */}
      <div className="text-center mb-4">
        <div className={cn(
          "inline-flex items-center justify-center px-6 py-2 rounded-full",
          hasSubmitted ? "bg-white/20" : accentColor
        )}>
          <span className="text-white font-bold text-3xl">
            {hasSubmitted && showResults ? Math.round(displayAverage) : currentValue}
          </span>
        </div>
        {hasSubmitted && showResults && (
          <p className="text-white/70 text-xs mt-2">
            Average response
          </p>
        )}
      </div>

      {/* Slider */}
      <div className="px-2">
        <Slider
          value={value}
          onValueChange={handleValueChange}
          onValueCommit={handleValueCommit}
          min={0}
          max={100}
          step={1}
          disabled={hasSubmitted}
          className={cn(
            "w-full",
            hasSubmitted && "opacity-70"
          )}
        />

        {/* Min/Max Labels */}
        <div className="flex justify-between mt-2">
          <span className="text-white/60 text-xs">{minLabel}</span>
          <span className="text-white/60 text-xs">{maxLabel}</span>
        </div>
      </div>

      {/* Your Response (after submission) */}
      {hasSubmitted && averageValue !== undefined && (
        <div className="mt-4 p-3 bg-white/10 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm">Your response:</span>
            <span className="text-white font-bold">{currentValue}</span>
          </div>
        </div>
      )}

      {/* Instruction */}
      {!hasSubmitted && (
        <p className="text-white/50 text-xs text-center mt-4">
          Slide and release to submit
        </p>
      )}

      {hasSubmitted && (
        <p className="text-white/70 text-xs text-center mt-4">
          ✓ Response submitted
        </p>
      )}
    </div>
  );
}
