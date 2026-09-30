import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import { WidgetStyleOptions } from './widgets/styles';

// Extended interface with style options
interface InteractiveStickerPanelProps {
  onAddPoll: (question: string, options: string[], style?: WidgetStyleOptions) => void;
  onAddQuestion: (question: string, style?: WidgetStyleOptions) => void;
  onAddSlider: (question: string, emoji: string, style?: WidgetStyleOptions) => void;
  onAddQuiz: (question: string, options: string[], correctIndex: number, style?: WidgetStyleOptions) => void;
  onAddCountdown: (title: string, date: Date, style?: WidgetStyleOptions) => void;
  onAddLocation: (location: string) => void;
  onAddMention: (username: string) => void;
  onAddHashtag: (hashtag: string) => void;
  onAddMusic?: (song: string, artist: string) => void;
  onAddReshare?: (postId: string) => void;
  onClose: () => void;
}

type StickerType = 'poll' | 'question' | 'slider' | 'quiz' | 'countdown' | 'location' | 'mention' | 'hashtag' | 'music' | 'reshare';
type ThemeType = 'light' | 'dark' | 'glass' | 'gradient';

// Theme presets
const THEME_PRESETS: { id: ThemeType; label: string; colors: string[]; textColor: string }[] = [
  { id: 'light', label: 'Light', colors: ['#FFFFFF', '#F8F8F8'], textColor: '#111' },
  { id: 'dark', label: 'Dark', colors: ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.75)'], textColor: '#FFF' },
  { id: 'glass', label: 'Glass', colors: ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)'], textColor: '#FFF' },
  { id: 'gradient', label: 'Gradient', colors: ['#8B5CF6', '#EC4899'], textColor: '#FFF' },
];

// Style preset options
const STYLE_PRESETS = [
  { id: 'default', label: 'Default' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'bold', label: 'Bold' },
  { id: 'neon', label: 'Neon' },
];

export function InteractiveStickerPanel(props: InteractiveStickerPanelProps) {
  const [activeSticker, setActiveSticker] = useState<StickerType | null>(null);

  // Content state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [questionText, setQuestionText] = useState('');
  const [sliderQuestion, setSliderQuestion] = useState('');
  const [sliderEmoji, setSliderEmoji] = useState('❤️');
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [resharePostId, setResharePostId] = useState('');
  const [countdownTitle, setCountdownTitle] = useState('');
  const [countdownDate, setCountdownDate] = useState('');
  const [locationText, setLocationText] = useState('');
  const [mentionUsername, setMentionUsername] = useState('');
  const [hashtagText, setHashtagText] = useState('');

  // Style customization state
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('light');
  const [opacity, setOpacity] = useState(1);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hideBadge, setHideBadge] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('default');

  const stickerTypes = [
    { type: 'poll' as const, icon: 'bar-chart', label: 'Poll', color: '#8B5CF6' },
    { type: 'question' as const, icon: 'help-circle', label: 'Question', color: '#06B6D4' },
    { type: 'slider' as const, icon: 'speedometer', label: 'Slider', color: '#F59E0B' },
    { type: 'quiz' as const, icon: 'school', label: 'Quiz', color: '#10B981' },
    { type: 'reshare' as const, icon: 'share', label: 'Reshare', color: '#EC4899' },
    { type: 'location' as const, icon: 'location', label: 'Location', color: '#EF4444' },
    { type: 'mention' as const, icon: 'at', label: 'Mention', color: '#8B5CF6' },
    { type: 'hashtag' as const, icon: 'hash', label: 'Hashtag', color: '#06B6D4' },
    { type: 'music' as const, icon: 'musical-notes', label: 'Music', color: '#EC4899' },
  ];

  // Get current style options
  const getStyleOptions = (): WidgetStyleOptions => ({
    theme: selectedTheme,
    opacity,
    stylePreset: selectedPreset as any,
    isAnonymous,
    hideBadge,
  });

  // Reset style options
  const resetStyleOptions = () => {
    setSelectedTheme('light');
    setOpacity(1);
    setIsAnonymous(false);
    setHideBadge(false);
    setSelectedPreset('default');
  };

  const handleAddPoll = () => {
    if (pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2) {
      props.onAddPoll(pollQuestion, pollOptions.filter(o => o.trim()), getStyleOptions());
      setPollQuestion('');
      setPollOptions(['', '']);
      resetStyleOptions();
      setActiveSticker(null);
    } else {
      Alert.alert('Error', 'Please add a question and at least 2 options');
    }
  };

  const handleAddQuestion = () => {
    if (questionText.trim()) {
      props.onAddQuestion(questionText, getStyleOptions());
      setQuestionText('');
      resetStyleOptions();
      setActiveSticker(null);
    } else {
      Alert.alert('Error', 'Please enter a question');
    }
  };

  const handleAddSlider = () => {
    if (sliderQuestion.trim()) {
      props.onAddSlider(sliderQuestion, sliderEmoji, getStyleOptions());
      setSliderQuestion('');
      resetStyleOptions();
      setActiveSticker(null);
    } else {
      Alert.alert('Error', 'Please enter a question');
    }
  };

  const handleAddLocation = () => {
    if (locationText.trim()) {
      props.onAddLocation(locationText);
      setLocationText('');
      setActiveSticker(null);
    } else {
      Alert.alert('Error', 'Please enter a location');
    }
  };

  const handleAddMention = () => {
    if (mentionUsername.trim()) {
      props.onAddMention(mentionUsername.replace('@', ''));
      setMentionUsername('');
      setActiveSticker(null);
    } else {
      Alert.alert('Error', 'Please enter a username');
    }
  };

  const handleAddHashtag = () => {
    if (hashtagText.trim()) {
      props.onAddHashtag(hashtagText.replace('#', ''));
      setHashtagText('');
      setActiveSticker(null);
    } else {
      Alert.alert('Error', 'Please enter a hashtag');
    }
  };

  // Style customization component
  const StyleCustomization = ({ showAnonymous = false }: { showAnonymous?: boolean }) => (
    <View style={styles.styleSection}>
      <Text style={styles.sectionTitle}>🎨 Customize Style</Text>

      {/* Theme Selection */}
      <Text style={styles.label}>Theme</Text>
      <View style={styles.themeGrid}>
        {THEME_PRESETS.map((theme) => (
          <TouchableOpacity
            key={theme.id}
            style={[
              styles.themeButton,
              selectedTheme === theme.id && styles.themeButtonSelected
            ]}
            onPress={() => setSelectedTheme(theme.id)}
          >
            <LinearGradient
              colors={theme.colors as any}
              style={styles.themePreview}
            >
              <Text style={[styles.themePreviewText, { color: theme.textColor }]}>Aa</Text>
            </LinearGradient>
            <Text style={[
              styles.themeLabel,
              selectedTheme === theme.id && styles.themeLabelSelected
            ]}>{theme.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Opacity Slider */}
      <View style={styles.opacityRow}>
        <Text style={styles.label}>Opacity</Text>
        <View style={styles.opacityButtons}>
          {[0.5, 0.75, 1].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.opacityButton,
                opacity === val && styles.opacityButtonSelected
              ]}
              onPress={() => setOpacity(val)}
            >
              <Text style={[
                styles.opacityButtonText,
                opacity === val && styles.opacityButtonTextSelected
              ]}>{Math.round(val * 100)}%</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Style Presets */}
      <Text style={styles.label}>Style Preset</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
        {STYLE_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={[
              styles.presetButton,
              selectedPreset === preset.id && styles.presetButtonSelected
            ]}
            onPress={() => setSelectedPreset(preset.id)}
          >
            <Text style={[
              styles.presetButtonText,
              selectedPreset === preset.id && styles.presetButtonTextSelected
            ]}>{preset.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Toggle Options */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleItem}>
          <Text style={styles.toggleLabel}>Hide Badge</Text>
          <Switch
            value={hideBadge}
            onValueChange={setHideBadge}
            trackColor={{ false: '#767577', true: colors.accent.primary }}
            thumbColor={hideBadge ? '#fff' : '#f4f3f4'}
          />
        </View>
        {showAnonymous && (
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Anonymous</Text>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: '#767577', true: colors.accent.primary }}
              thumbColor={isAnonymous ? '#fff' : '#f4f3f4'}
            />
          </View>
        )}
      </View>
    </View>
  );

  // Widget Preview Component
  const WidgetPreview = ({ type }: { type: StickerType }) => {
    const themePreset = THEME_PRESETS.find(t => t.id === selectedTheme);
    const containerStyle = {
      backgroundColor: themePreset?.colors[0] || '#fff',
      borderRadius: 16,
      padding: 12,
      opacity,
      ...(selectedTheme === 'glass' ? { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' } : {}),
    };
    const textColor = themePreset?.textColor || '#111';

    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>Preview</Text>
        <View style={containerStyle}>
          <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>
            {type === 'poll' ? (pollQuestion || 'Your Question?') :
              type === 'slider' ? (sliderQuestion || 'Rate this...') :
                type === 'question' ? (questionText || 'Ask me anything') :
                  type === 'quiz' ? (quizQuestion || 'Quiz Question?') : 'Preview'}
          </Text>
          {type === 'poll' && (
            <View style={{ marginTop: 10, backgroundColor: selectedTheme === 'light' ? '#F3F4F6' : 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 }}>
              <Text style={{ color: textColor, opacity: 0.8 }}>Option 1</Text>
            </View>
          )}
          {type === 'slider' && (
            <View style={{ marginTop: 10, height: 40, backgroundColor: selectedTheme === 'light' ? '#F3F4F6' : 'rgba(255,255,255,0.15)', borderRadius: 20, justifyContent: 'center', paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 18 }}>{sliderEmoji}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!activeSticker) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✨ Interactive Stickers</Text>
          <TouchableOpacity onPress={props.onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.stickersGrid}>
            {stickerTypes.map((sticker) => (
              <TouchableOpacity
                key={sticker.type}
                style={[styles.stickerButton, { backgroundColor: sticker.color + '20' }]}
                onPress={() => setActiveSticker(sticker.type)}
                activeOpacity={0.8}
              >
                <View style={[styles.stickerIcon, { backgroundColor: sticker.color }]}>
                  <Ionicons name={sticker.icon as any} size={24} color="white" />
                </View>
                <Text style={styles.stickerLabel}>{sticker.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Poll creator with customization
  if (activeSticker === 'poll') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveSticker(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Poll</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.label}>Question</Text>
            <TextInput
              style={styles.input}
              placeholder="Ask a question..."
              placeholderTextColor={colors.text.secondary}
              value={pollQuestion}
              onChangeText={setPollQuestion}
              multiline
            />

            <Text style={styles.label}>Options</Text>
            {pollOptions.map((option, i) => (
              <TextInput
                key={i}
                style={styles.input}
                placeholder={`Option ${i + 1}`}
                placeholderTextColor={colors.text.secondary}
                value={option}
                onChangeText={(text) => {
                  const newOptions = [...pollOptions];
                  newOptions[i] = text;
                  setPollOptions(newOptions);
                }}
              />
            ))}

            {pollOptions.length < 4 && (
              <TouchableOpacity
                style={styles.addOptionButton}
                onPress={() => setPollOptions([...pollOptions, ''])}
              >
                <Ionicons name="add" size={20} color={colors.accent.primary} />
                <Text style={styles.addOptionText}>Add Option</Text>
              </TouchableOpacity>
            )}

            <StyleCustomization showAnonymous={false} />
            <WidgetPreview type="poll" />

            <TouchableOpacity style={styles.createButton} onPress={handleAddPoll}>
              <Text style={styles.createButtonText}>Create Poll</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Question creator with customization
  if (activeSticker === 'question') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveSticker(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ask Question</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.label}>Question</Text>
            <TextInput
              style={styles.input}
              placeholder="Ask your followers something..."
              placeholderTextColor={colors.text.secondary}
              value={questionText}
              onChangeText={setQuestionText}
              multiline
            />

            <StyleCustomization showAnonymous={true} />
            <WidgetPreview type="question" />

            <TouchableOpacity style={styles.createButton} onPress={handleAddQuestion}>
              <Text style={styles.createButtonText}>Add Question</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Slider creator with customization
  if (activeSticker === 'slider') {
    const emojis = ['❤️', '😍', '🔥', '👍', '⭐', '💯', '😂', '🥳'];

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveSticker(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Slider</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.label}>Question</Text>
            <TextInput
              style={styles.input}
              placeholder="Ask something to rate..."
              placeholderTextColor={colors.text.secondary}
              value={sliderQuestion}
              onChangeText={setSliderQuestion}
              multiline
            />

            <Text style={styles.label}>Choose Emoji</Text>
            <View style={styles.emojiGrid}>
              {emojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiButton,
                    sliderEmoji === emoji && styles.emojiButtonSelected
                  ]}
                  onPress={() => setSliderEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <StyleCustomization showAnonymous={false} />
            <WidgetPreview type="slider" />

            <TouchableOpacity style={styles.createButton} onPress={handleAddSlider}>
              <Text style={styles.createButtonText}>Create Slider</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Quiz creator with customization
  if (activeSticker === 'quiz') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveSticker(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Quiz</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.label}>Question</Text>
            <TextInput
              style={styles.input}
              placeholder="Ask a quiz question..."
              placeholderTextColor={colors.text.secondary}
              value={quizQuestion}
              onChangeText={setQuizQuestion}
              multiline
            />

            <Text style={styles.label}>Options (tap to mark correct)</Text>
            {quizOptions.map((opt, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <TouchableOpacity onPress={() => setCorrectAnswer(i)} style={{ padding: spacing.sm }}>
                  <Ionicons name={correctAnswer === i ? 'radio-button-on' : 'radio-button-off'} size={20} color={correctAnswer === i ? colors.accent.primary : colors.text.secondary} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={`Option ${i + 1}`}
                  placeholderTextColor={colors.text.secondary}
                  value={opt}
                  onChangeText={(t) => {
                    const cp = [...quizOptions];
                    cp[i] = t;
                    setQuizOptions(cp);
                  }}
                />
              </View>
            ))}

            <StyleCustomization showAnonymous={false} />
            <WidgetPreview type="quiz" />

            <TouchableOpacity style={styles.createButton} onPress={() => {
              const opts = quizOptions.map(o => o.trim()).filter(Boolean).slice(0, 4);
              if (!quizQuestion.trim() || opts.length < 2) return;
              props.onAddQuiz(quizQuestion.trim(), opts, Math.min(correctAnswer, opts.length - 1), getStyleOptions());
              setQuizQuestion(''); setQuizOptions(['', '', '', '']); setCorrectAnswer(0);
              resetStyleOptions();
              setActiveSticker(null);
            }}>
              <Text style={styles.createButtonText}>Add Quiz</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Reshare creator
  if (activeSticker === 'reshare') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveSticker(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reshare</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.label}>Post URL or ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Paste link or enter ID..."
              placeholderTextColor={colors.text.secondary}
              value={resharePostId}
              onChangeText={setResharePostId}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.createButton} onPress={() => {
              const pid = resharePostId.trim();
              if (!pid) return;
              props.onAddReshare?.(pid);
              setResharePostId('');
              setActiveSticker(null);
            }}>
              <Text style={styles.createButtonText}>Add Reshare</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Location creator
  if (activeSticker === 'location') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveSticker(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Location</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter location name..."
              placeholderTextColor={colors.text.secondary}
              value={locationText}
              onChangeText={setLocationText}
            />

            <TouchableOpacity style={styles.createButton} onPress={handleAddLocation}>
              <Text style={styles.createButtonText}>Add Location</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Mention creator
  if (activeSticker === 'mention') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveSticker(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mention User</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="@username"
              placeholderTextColor={colors.text.secondary}
              value={mentionUsername}
              onChangeText={setMentionUsername}
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.createButton} onPress={handleAddMention}>
              <Text style={styles.createButtonText}>Add Mention</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Hashtag creator
  if (activeSticker === 'hashtag') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveSticker(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Hashtag</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.label}>Hashtag</Text>
            <TextInput
              style={styles.input}
              placeholder="#hashtag"
              placeholderTextColor={colors.text.secondary}
              value={hashtagText}
              onChangeText={setHashtagText}
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.createButton} onPress={handleAddHashtag}>
              <Text style={styles.createButtonText}>Add Hashtag</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (activeSticker === 'music') {
    props.onAddMusic?.('', '');
    props.onClose();
    return null as any;
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  stickersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  stickerButton: {
    width: '47%',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  stickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stickerLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  form: {
    gap: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
  },
  addOptionText: {
    fontSize: typography.fontSize.base,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.semibold as any,
  },
  createButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  createButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.inverse,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emojiButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiButtonSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primary + '20',
  },
  emojiText: {
    fontSize: 24,
  },
  // Style customization styles
  styleSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  themeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  themeButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeButtonSelected: {
    borderColor: colors.accent.primary,
  },
  themePreview: {
    width: 50,
    height: 35,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  themePreviewText: {
    fontWeight: '700',
    fontSize: 14,
  },
  themeLabel: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  themeLabelSelected: {
    color: colors.accent.primary,
    fontWeight: '600',
  },
  opacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  opacityButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  opacityButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  opacityButtonSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  opacityButtonText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  opacityButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  presetScroll: {
    marginBottom: spacing.md,
  },
  presetButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  presetButtonSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  presetButtonText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  presetButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleLabel: {
    fontSize: 13,
    color: colors.text.primary,
  },
  previewContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
});
