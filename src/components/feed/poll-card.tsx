"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { votePoll, type Poll } from "@/app/(dashboard)/actions/polls";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/utils";

type PollCardProps = {
  poll: Poll;
  className?: string;
};

export function PollCard({ poll, className }: PollCardProps) {
  const [voting, setVoting] = useState(false);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;
  const userVoted = poll.user_voted;

  function handleOptionClick(optionId: string) {
    if (userVoted || isExpired || voting) return;

    if (poll.multiple_choice) {
      setSelectedOptionIds((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptionIds([optionId]);
    }
  }

  async function handleVote() {
    if (voting || selectedOptionIds.length === 0) return;

    setVoting(true);
    const result = await votePoll(poll.id, selectedOptionIds);
    setVoting(false);

    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Vote recorded!");
      // The parent component will need to refresh the poll data
    }
  }

  const getPercentage = (voteCount: number) => {
    if (poll.total_votes === 0) return 0;
    return Math.round((voteCount / poll.total_votes) * 100);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between">
        <h4 className="font-semibold text-foreground">{poll.question}</h4>
        {isExpired && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="size-3" />
            Closed
          </span>
        )}
      </div>

      <ul className="space-y-2">
        {poll.options.map((option, index) => {
          const percentage = getPercentage(option.vote_count);
          const isSelected = selectedOptionIds.includes(option.id);
          const hasVoted = option.user_voted;

          return (
            <motion.li
              key={option.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                disabled={userVoted || isExpired}
                onClick={() => handleOptionClick(option.id)}
                className={cn(
                  "relative w-full text-left p-4 rounded-xl border transition-all",
                  "hover:border-primary/50 hover:bg-muted/50",
                  "disabled:cursor-not-allowed disabled:hover:bg-muted disabled:hover:border-border",
                  (userVoted || isExpired) && "bg-muted/30"
                )}
              >
                {/* Progress bar background */}
                <AnimatePresence>
                  {(userVoted || isExpired) && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-xl opacity-10",
                        hasVoted ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </AnimatePresence>

                <div className="relative flex items-center gap-3">
                  {/* Selection indicator */}
                  {userVoted || isExpired ? (
                    <CheckCircle2
                      className={cn(
                        "size-5 shrink-0",
                        hasVoted ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  ) : (
                    <Circle
                      className={cn(
                        "size-5 shrink-0",
                        isSelected && "text-primary fill-primary/20"
                      )}
                    />
                  )}

                  {/* Option text */}
                  <span className="flex-1 text-sm text-foreground">
                    {option.option_text}
                  </span>

                  {/* Percentage */}
                  <AnimatePresence>
                    {(userVoted || isExpired) && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm font-semibold text-foreground"
                      >
                        {percentage}%
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            </motion.li>
          );
        })}
      </ul>

      {/* Vote button */}
      {!userVoted && !isExpired && selectedOptionIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={handleVote}
            disabled={voting}
            className="w-full rounded-xl"
          >
            {voting ? "Voting..." : "Vote"}
          </Button>
        </motion.div>
      )}

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{poll.total_votes} {poll.total_votes === 1 ? "vote" : "votes"}</span>
        {poll.expires_at && !isExpired && (
          <span>Ends {relativeTime(poll.expires_at)}</span>
        )}
      </div>
    </div>
  );
}
