import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface StoryPollProps {
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVote?: string;
  onVote?: (optionId: string) => void;
  showResults?: boolean;
  accentColor?: string;
}

export function StoryPoll({
  question,
  options,
  totalVotes,
  userVote,
  onVote,
  showResults = false,
  accentColor = "bg-primary",
}: StoryPollProps) {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(userVote);
  const [hasVoted, setHasVoted] = useState(!!userVote);

  const handleVote = (optionId: string) => {
    if (hasVoted) return;
    
    setSelectedOption(optionId);
    setHasVoted(true);
    onVote?.(optionId);
  };

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const getMaxVotes = () => Math.max(...options.map(o => o.votes));

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20">
      {/* Question */}
      <h3 className="text-white font-bold text-lg mb-4 text-center">
        {question}
      </h3>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option) => {
          const percentage = getPercentage(option.votes);
          const isWinning = option.votes === getMaxVotes() && totalVotes > 0;
          const isSelected = selectedOption === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted || showResults}
              className={cn(
                "relative w-full rounded-xl overflow-hidden transition-all",
                "border-2 border-white/30 hover:border-white/50",
                hasVoted || showResults ? "cursor-default" : "cursor-pointer active:scale-95"
              )}
            >
              {/* Background Progress Bar */}
              {(hasVoted || showResults) && (
                <div
                  className={cn(
                    "absolute inset-0 transition-all duration-500",
                    isWinning ? accentColor : "bg-white/20"
                  )}
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              )}

              {/* Content */}
              <div className="relative px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Checkmark for selected option */}
                  {isSelected && (
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      accentColor
                    )}>
                      <Check className="h-4 w-4 text-white" strokeWidth={3} />
                    </div>
                  )}
                  
                  <span className="text-white font-medium text-left">
                    {option.text}
                  </span>
                </div>

                {/* Percentage (show after voting) */}
                {(hasVoted || showResults) && (
                  <span className="text-white font-bold text-sm">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Total Votes */}
      {(hasVoted || showResults) && totalVotes > 0 && (
        <p className="text-white/70 text-sm text-center mt-4">
          {totalVotes.toLocaleString()} {totalVotes === 1 ? 'vote' : 'votes'}
        </p>
      )}

      {/* Tap to vote hint */}
      {!hasVoted && !showResults && (
        <p className="text-white/50 text-xs text-center mt-4">
          Tap an option to vote
        </p>
      )}
    </div>
  );
}
