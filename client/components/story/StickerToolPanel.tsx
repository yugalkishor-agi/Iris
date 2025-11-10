import { useState, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Smile, Heart, Sparkles, Pizza, Plane, Gamepad2, Crown, MessageCircle, BarChart3, Music as MusicIcon, Loader2, AtSign } from 'lucide-react';

// Lazy load heavy components
const EmojiPicker = lazy(() => import('./EmojiPicker').then(m => ({ default: m.EmojiPicker })));
const PollStickerCreator = lazy(() => import('./PollSticker').then(m => ({ default: m.PollStickerCreator })));
const QuestionStickerCreator = lazy(() => import('./QuestionSticker').then(m => ({ default: m.QuestionStickerCreator })));
const SliderStickerCreator = lazy(() => import('./SliderSticker').then(m => ({ default: m.SliderStickerCreator })));
const MusicSelector = lazy(() => import('./MusicSticker').then(m => ({ default: m.MusicSelector })));
const MentionStickerCreator = lazy(() => import('./MentionSticker').then(m => ({ default: m.MentionStickerCreator })));

interface StickerToolPanelProps {
  onAddEmoji: (emoji: string) => void;
  onAddPoll: (question: string, options: string[]) => void;
  onAddQuestion: (question: string) => void;
  onAddSlider: (question: string, emoji: string) => void;
  onAddMusic: (song: string, artist: string) => void;
  onAddMention?: (userId: string, username: string, avatarURL: string, verified: boolean) => void;
}

type EmojiCategory = 'faces' | 'love' | 'nature' | 'food' | 'travel' | 'activities' | 'objects';

const EMOJI_CATEGORIES: Record<EmojiCategory, { icon: any; label: string; emojis: string[] }> = {
  faces: {
    icon: Smile,
    label: 'Faces',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥']
  },
  love: {
    icon: Heart,
    label: 'Love',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '😻', '🥰', '😘', '😍', '🤩', '💋', '💌', '💑', '💏', '👩‍❤️‍👨', '💐', '🌹', '🌺', '🌸', '🌼']
  },
  nature: {
    icon: Sparkles,
    label: 'Nature',
    emojis: ['🌟', '✨', '⭐', '🌈', '☀️', '🌙', '⚡', '🔥', '💧', '❄️', '☃️', '🌸', '🌺', '🌻', '🌷', '🌹', '🥀', '🌼', '🌴', '🌳', '🌲', '🌱', '🍀', '🌿', '🍃', '🌾', '🦋', '🐝', '🐞', '🌻', '🌞', '🌛', '🌜', '⭐', '🌟', '💫', '✨']
  },
  food: {
    icon: Pizza,
    label: 'Food',
    emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯', '🥖', '🧀', '🥗', '🥙', '🌮', '🌯', '🥪', '🍖', '🍗', '🥩', '🍤', '🍣', '🍱', '🥟', '🍜', '🍲', '🍛', '🍝', '🥘', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜']
  },
  travel: {
    icon: Plane,
    label: 'Travel',
    emojis: ['✈️', '🚀', '🛸', '🚁', '🛩️', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🏖️', '🏝️', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠']
  },
  activities: {
    icon: Gamepad2,
    label: 'Fun',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🎿', '🛷', '🥌', '🎯', '🪀', '🪁', '🎮', '🕹️', '🎰', '🎲', '🧩', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕']
  },
  objects: {
    icon: Crown,
    label: 'Objects',
    emojis: ['👑', '💎', '💍', '📱', '💻', '⌨️', '🖱️', '🖥️', '🖨️', '⏰', '⏱️', '⏲️', '🕰️', '⌚', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '🎁', '🎀', '🎊', '🎉', '🎈', '🎏', '🎎', '🎐', '🎑', '🧧']
  }
};

type StickerType = 'emoji' | 'poll' | 'question' | 'slider' | 'music' | 'mention';

export function StickerToolPanel({
  onAddEmoji,
  onAddPoll,
  onAddQuestion,
  onAddSlider,
  onAddMusic,
  onAddMention
}: StickerToolPanelProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'interactive'>('emoji');
  const [emojiCategory, setEmojiCategory] = useState<EmojiCategory>('faces');
  const [activeStickerType, setActiveStickerType] = useState<StickerType | null>(null);

  const stickerTypes = [
    { id: 'emoji', icon: Smile, label: 'Emoji', color: 'text-yellow-400' },
    { id: 'mention', icon: AtSign, label: 'Mention', color: 'text-purple-400' },
    { id: 'poll', icon: BarChart3, label: 'Poll', color: 'text-purple-400' },
    { id: 'question', icon: MessageCircle, label: 'Question', color: 'text-blue-400' },
    { id: 'slider', icon: BarChart3, label: 'Slider', color: 'text-orange-400' },
    { id: 'music', icon: MusicIcon, label: 'Music', color: 'text-pink-400' }
  ];

  return (
    <div className="space-y-4">
      {/* Sticker Type Selection */}
      {!activeStickerType && (
        <div className="grid grid-cols-2 gap-3">
          {stickerTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveStickerType(type.id as StickerType)}
              className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
            >
              <type.icon className={`h-8 w-8 ${type.color}`} />
              <span className="text-white text-sm font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Active Sticker Creator */}
      {activeStickerType && (
        <div className="space-y-3">
          {/* Back Button */}
          <button
            onClick={() => setActiveStickerType(null)}
            className="text-white/60 text-sm hover:text-white transition-colors"
          >
            ← Back to stickers
          </button>

          {/* Lazy-loaded components with loading fallback */}
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            }
          >
            {activeStickerType === 'emoji' && (
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  onAddEmoji(emoji);
                  setActiveStickerType(null);
                }}
                onClose={() => setActiveStickerType(null)}
              />
            )}

            {activeStickerType === 'poll' && (
              <PollStickerCreator
                onCreatePoll={(question, options) => {
                  onAddPoll(question, options);
                  setActiveStickerType(null);
                }}
              />
            )}

            {activeStickerType === 'question' && (
              <QuestionStickerCreator
                onCreateQuestion={(question) => {
                  onAddQuestion(question);
                  setActiveStickerType(null);
                }}
              />
            )}

            {activeStickerType === 'slider' && (
              <SliderStickerCreator
                onCreateSlider={(question, emoji) => {
                  onAddSlider(question, emoji);
                  setActiveStickerType(null);
                }}
              />
            )}

            {activeStickerType === 'music' && (
              <MusicSelector
                onSelectMusic={(song, artist) => {
                  onAddMusic(song, artist);
                  setActiveStickerType(null);
                }}
              />
            )}

            {activeStickerType === 'mention' && onAddMention && (
              <MentionStickerCreator
                onAdd={(userId, username, avatarURL, verified) => {
                  onAddMention(userId, username, avatarURL, verified);
                  setActiveStickerType(null);
                }}
                onClose={() => setActiveStickerType(null)}
              />
            )}
          </Suspense>
        </div>
      )}

      {/* Info */}
      {!activeStickerType && (
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="text-white/60 text-xs space-y-1">
            <p>✨ Add interactive elements to your story</p>
            <p>✨ Engage with your followers</p>
            <p>✨ See responses in real-time</p>
          </div>
        </div>
      )}
    </div>
  );
}
