import { useState } from "react";
import { Check, X, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface StoryQuizProps {
  question: string;
  options: QuizOption[];
  userAnswer?: string;
  onAnswer?: (optionId: string, isCorrect: boolean) => void;
  showResults?: boolean;
  accentColor?: string;
}

export function StoryQuiz({
  question,
  options,
  userAnswer,
  onAnswer,
  showResults = false,
  accentColor = "bg-primary",
}: StoryQuizProps) {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(userAnswer);
  const [hasAnswered, setHasAnswered] = useState(!!userAnswer);
  const [showCorrect, setShowCorrect] = useState(showResults);

  const handleAnswer = (optionId: string) => {
    if (hasAnswered) return;

    const option = options.find(o => o.id === optionId);
    if (!option) return;

    setSelectedOption(optionId);
    setHasAnswered(true);
    setShowCorrect(true);
    onAnswer?.(optionId, option.isCorrect);
  };

  const correctOption = options.find(o => o.isCorrect);
  const wasCorrect = selectedOption && options.find(o => o.id === selectedOption)?.isCorrect;

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20">
      {/* Question */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          accentColor
        )}>
          <Award className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-white font-bold text-lg flex-1">
          {question}
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedOption === option.id;
          const showAsCorrect = showCorrect && option.isCorrect;
          const showAsWrong = showCorrect && isSelected && !option.isCorrect;

          return (
            <button
              key={option.id}
              onClick={() => handleAnswer(option.id)}
              disabled={hasAnswered || showResults}
              className={cn(
                "relative w-full rounded-xl overflow-hidden transition-all",
                "border-2",
                showAsCorrect && "border-green-500 bg-green-500/30",
                showAsWrong && "border-red-500 bg-red-500/30",
                !showCorrect && "border-white/30 hover:border-white/50",
                hasAnswered || showResults ? "cursor-default" : "cursor-pointer active:scale-95"
              )}
            >
              <div className="relative px-4 py-3 flex items-center justify-between">
                <span className="text-white font-medium text-left">
                  {option.text}
                </span>

                {/* Show correct/wrong indicator */}
                {showCorrect && (
                  <>
                    {showAsCorrect && (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" strokeWidth={3} />
                      </div>
                    )}
                    {showAsWrong && (
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <X className="h-4 w-4 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Result Message */}
      {hasAnswered && showCorrect && (
        <div className={cn(
          "mt-4 p-3 rounded-xl text-center",
          wasCorrect ? "bg-green-500/20 border border-green-500/30" : "bg-red-500/20 border border-red-500/30"
        )}>
          <p className="text-white font-semibold text-sm">
            {wasCorrect ? (
              <>🎉 Correct! Great job!</>
            ) : (
              <>The correct answer is "{correctOption?.text}"</>
            )}
          </p>
        </div>
      )}

      {/* Tap to answer hint */}
      {!hasAnswered && !showResults && (
        <p className="text-white/50 text-xs text-center mt-4">
          Tap an option to answer
        </p>
      )}
    </div>
  );
}
