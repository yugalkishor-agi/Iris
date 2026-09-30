import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

type Option = { id: string; text: string; votes: number; voterIds?: string[] };

interface PollBubbleProps {
  question: string;
  options: Option[];
  totalVotes: number;
  selectedId?: string | null;
  canVote?: boolean;
  onVote?: (id: string) => void;
  stylesRef: any;
}

const PollBubble: React.FC<PollBubbleProps> = ({
  question,
  options,
  totalVotes,
  selectedId,
  canVote = true,
  onVote,
  stylesRef,
}) => {
  const s = stylesRef;
  const hasVoted = Boolean(selectedId);

  return (
    <View style={s.pollCard}>
      <View style={s.pollHeaderRow}>
        <Text style={s.pollQuestion}>{question}</Text>
        {hasVoted ? <Text style={s.pollVotedTag}>Voted</Text> : null}
      </View>
      {options.map((opt) => {
        const votes = opt.votes || 0;
        const pct = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
        const isSelected = selectedId === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[s.pollOption, isSelected && s.pollOptionSelected]}
            onPress={() => {
              if (!canVote || hasVoted) return;
              onVote?.(opt.id);
            }}
            activeOpacity={0.85}
            disabled={!canVote || hasVoted}
          >
            <View style={[s.pollBar, { width: `${Math.max(pct, 8)}%` }, isSelected && s.pollBarSelected]} />
            <View style={s.pollOptionContent}>
              <Text style={[s.pollOptionText, isSelected && s.pollOptionTextSelected]}>{opt.text}</Text>
              <Text style={[s.pollPct, isSelected && s.pollPctSelected]}>{pct}%</Text>
            </View>
            <Text style={s.pollVotes}>{votes} vote{votes === 1 ? '' : 's'}</Text>
          </TouchableOpacity>
        );
      })}
      <Text style={s.pollFooter}>{totalVotes} vote{totalVotes === 1 ? '' : 's'} total</Text>
    </View>
  );
};

export default PollBubble;
