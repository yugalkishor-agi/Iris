import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart3, HelpCircle, Gauge, Music, MapPin, Hash, AtSign, Share2 } from 'lucide-react';

interface InteractiveStickerPanelProps {
  onAddPoll: (question: string, options: string[]) => void;
  onAddQuestion: (question: string) => void;
  onAddSlider: (question: string, emoji: string) => void;
  onAddQuiz: (question: string, options: string[], correctIndex: number) => void;
  onAddCountdown: (title: string, date: Date) => void;
  onAddLocation: (location: string) => void;
  onAddMention: (username: string) => void;
  onAddHashtag: (hashtag: string) => void;
  onAddMusic?: (song: string, artist: string) => void;
  onAddReshare?: (postId: string) => void;
}

type StickerType = 'poll' | 'question' | 'slider' | 'quiz' | 'countdown' | 'location' | 'mention' | 'hashtag' | 'music' | 'reshare';

export function InteractiveStickerPanel(props: InteractiveStickerPanelProps) {
  const [activeSticker, setActiveSticker] = useState<StickerType | null>(null);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [questionText, setQuestionText] = useState('');
  const [sliderQuestion, setSliderQuestion] = useState('');
  const [sliderEmoji, setSliderEmoji] = useState('❤️');
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [countdownTitle, setCountdownTitle] = useState('');
  const [countdownDate, setCountdownDate] = useState('');
  const [locationText, setLocationText] = useState('');
  const [mentionUsername, setMentionUsername] = useState('');
  const [hashtagText, setHashtagText] = useState('');

  const stickerTypes = [
    { type: 'poll' as const, icon: BarChart3, label: 'Poll', color: 'from-purple-500 to-pink-500' },
    { type: 'question' as const, icon: HelpCircle, label: 'Question', color: 'from-blue-500 to-cyan-500' },
    { type: 'slider' as const, icon: Gauge, label: 'Slider', color: 'from-orange-500 to-yellow-500' },
    { type: 'quiz' as const, icon: BarChart3, label: 'Quiz', color: 'from-green-500 to-emerald-500' },
    { type: 'reshare' as const, icon: Share2, label: 'Reshare', color: 'from-gradient-to-r from-pink-500 to-orange-500' },
    { type: 'location' as const, icon: MapPin, label: 'Location', color: 'from-red-500 to-rose-500' },
    { type: 'mention' as const, icon: AtSign, label: 'Mention', color: 'from-indigo-500 to-purple-500' },
    { type: 'hashtag' as const, icon: Hash, label: 'Hashtag', color: 'from-cyan-500 to-blue-500' },
    { type: 'music' as const, icon: Music, label: 'Music', color: 'from-purple-600 to-pink-600' },
  ];

  const handleAddPoll = () => {
    if (pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2) {
      props.onAddPoll(pollQuestion, pollOptions.filter(o => o.trim()));
      setPollQuestion('');
      setPollOptions(['', '']);
      setActiveSticker(null);
    }
  };

  const handleAddQuestion = () => {
    if (questionText.trim()) {
      props.onAddQuestion(questionText);
      setQuestionText('');
      setActiveSticker(null);
    }
  };

  const handleAddSlider = () => {
    if (sliderQuestion.trim()) {
      props.onAddSlider(sliderQuestion, sliderEmoji);
      setSliderQuestion('');
      setActiveSticker(null);
    }
  };

  const handleAddLocation = () => {
    if (locationText.trim()) {
      props.onAddLocation(locationText);
      setLocationText('');
      setActiveSticker(null);
    }
  };

  const handleAddMention = () => {
    if (mentionUsername.trim()) {
      props.onAddMention(mentionUsername);
      setMentionUsername('');
      setActiveSticker(null);
    }
  };

  const handleAddHashtag = () => {
    if (hashtagText.trim()) {
      props.onAddHashtag(hashtagText);
      setHashtagText('');
      setActiveSticker(null);
    }
  };

  if (!activeSticker) {
    return (
      <div className="space-y-3">
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-3 border border-purple-500/20">
          <p className="text-purple-300 text-xs font-medium">✨ Interactive Stickers</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {stickerTypes.map((sticker) => {
            const Icon = sticker.icon;
            return (
              <button
                key={sticker.type}
                onClick={() => setActiveSticker(sticker.type)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br ${sticker.color} hover:scale-105 transition-all`}
              >
                <Icon className="h-6 w-6 text-white" />
                <span className="text-white text-xs font-medium">{sticker.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Poll creator
  if (activeSticker === 'poll') {
    return (
      <div className="space-y-3 animate-slide-up">
        <button onClick={() => setActiveSticker(null)} className="text-white/70 text-sm">← Back</button>
        <Input
          placeholder="Ask a question..."
          value={pollQuestion}
          onChange={(e) => setPollQuestion(e.target.value)}
          className="bg-white/10 border-white/20 text-white"
        />
        {pollOptions.map((option, i) => (
          <Input
            key={i}
            placeholder={`Option ${i + 1}`}
            value={option}
            onChange={(e) => {
              const newOptions = [...pollOptions];
              newOptions[i] = e.target.value;
              setPollOptions(newOptions);
            }}
            className="bg-white/10 border-white/20 text-white"
          />
        ))}
        {pollOptions.length < 4 && (
          <Button
            onClick={() => setPollOptions([...pollOptions, ''])}
            variant="outline"
            className="w-full"
          >
            Add Option
          </Button>
        )}
        <Button onClick={handleAddPoll} className="w-full bg-primary">Add Poll</Button>
      </div>
    );
  }

  // Question creator
  if (activeSticker === 'question') {
    return (
      <div className="space-y-3 animate-slide-up">
        <button onClick={() => setActiveSticker(null)} className="text-white/70 text-sm">← Back</button>
        <Input
          placeholder="Ask a question..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className="bg-white/10 border-white/20 text-white"
        />
        <Button onClick={handleAddQuestion} className="w-full bg-primary">Add Question</Button>
      </div>
    );
  }

  // Slider creator
  if (activeSticker === 'slider') {
    return (
      <div className="space-y-3 animate-slide-up">
        <button onClick={() => setActiveSticker(null)} className="text-white/70 text-sm">← Back</button>
        <Input
          placeholder="Ask something..."
          value={sliderQuestion}
          onChange={(e) => setSliderQuestion(e.target.value)}
          className="bg-white/10 border-white/20 text-white"
        />
        <div>
          <label className="text-white text-sm mb-2 block">Emoji</label>
          <div className="flex gap-2">
            {['❤️', '😍', '🔥', '👍', '⭐'].map(emoji => (
              <button
                key={emoji}
                onClick={() => setSliderEmoji(emoji)}
                className={`text-2xl p-2 rounded-lg ${sliderEmoji === emoji ? 'bg-primary' : 'bg-white/10'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={handleAddSlider} className="w-full bg-primary">Add Slider</Button>
      </div>
    );
  }

  // Location creator
  if (activeSticker === 'location') {
    return (
      <div className="space-y-3 animate-slide-up">
        <button onClick={() => setActiveSticker(null)} className="text-white/70 text-sm">← Back</button>
        <Input
          placeholder="Location name..."
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          className="bg-white/10 border-white/20 text-white"
        />
        <Button onClick={handleAddLocation} className="w-full bg-primary">Add Location</Button>
      </div>
    );
  }

  // Mention creator
  if (activeSticker === 'mention') {
    return (
      <div className="space-y-3 animate-slide-up">
        <button onClick={() => setActiveSticker(null)} className="text-white/70 text-sm">← Back</button>
        <Input
          placeholder="@username"
          value={mentionUsername}
          onChange={(e) => setMentionUsername(e.target.value)}
          className="bg-white/10 border-white/20 text-white"
        />
        <Button onClick={handleAddMention} className="w-full bg-primary">Add Mention</Button>
      </div>
    );
  }

  // Hashtag creator
  if (activeSticker === 'hashtag') {
    return (
      <div className="space-y-3 animate-slide-up">
        <button onClick={() => setActiveSticker(null)} className="text-white/70 text-sm">← Back</button>
        <Input
          placeholder="#hashtag"
          value={hashtagText}
          onChange={(e) => setHashtagText(e.target.value)}
          className="bg-white/10 border-white/20 text-white"
        />
        <Button onClick={handleAddHashtag} className="w-full bg-primary">Add Hashtag</Button>
      </div>
    );
  }

  return null;
}
