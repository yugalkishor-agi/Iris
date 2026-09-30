import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';

export type InteractiveSticker = {
  id: string;
  type: 'poll' | 'slider' | 'question' | 'quiz';
  content: any;
  options?: string[];
  emoji?: string;
};

export function EditInteractiveStickerModal({
  visible,
  sticker,
  onClose,
  onSave,
}: {
  visible: boolean;
  sticker: InteractiveSticker | null;
  onClose: () => void;
  onSave: (id: string, data: { question?: string; options?: string[]; emoji?: string; text?: string; correctIndex?: number }) => void;
}) {
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [sliderQuestion, setSliderQuestion] = useState('');
  const [sliderEmoji, setSliderEmoji] = useState('❤️');
  const [questionText, setQuestionText] = useState('');
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState<string[]>(['', '', '', '']);
  const [quizCorrectIndex, setQuizCorrectIndex] = useState<number>(0);

  useEffect(() => {
    if (!sticker) return;
    if (sticker.type === 'poll') {
      const c = sticker.content || {};
      const q = typeof c === 'object' && c?.question
        ? c.question
        : (sticker.content?.toString?.() || sticker.content || '').toString().replace(/^Poll:\s*/i, '');
      setPollQuestion(q);
      const opts = (typeof c === 'object' && Array.isArray(c?.options) && c.options.length >= 2)
        ? c.options
        : (sticker.options && sticker.options.length >= 2 ? sticker.options : ['Yes', 'No']);
      setPollOptions([...opts]);
    } else if (sticker.type === 'slider') {
      const c = sticker.content || {};
      const q = typeof c === 'object' && c?.question
        ? c.question
        : (sticker.content?.toString?.() || sticker.content || '').toString().replace(/^.*?\s/, '');
      setSliderQuestion(q);
      setSliderEmoji((typeof c === 'object' && c?.emoji) ? c.emoji : (sticker.emoji || '❤️'));
    } else if (sticker.type === 'question') {
      const c = sticker.content || {};
      const t = typeof c === 'object' && c?.text
        ? c.text
        : (sticker.content?.toString?.() || sticker.content || '').toString().replace(/^Q:\s*/i, '');
      setQuestionText(t);
    } else if (sticker.type === 'quiz') {
      const c = sticker.content || {};
      setQuizQuestion((typeof c === 'object' && c?.question) ? c.question : '');
      const opts = (typeof c === 'object' && Array.isArray(c?.options) && c.options.length)
        ? c.options
        : (sticker.options && sticker.options.length ? sticker.options : ['', '', '', '']);
      setQuizOptions([...(opts as string[])]);
      setQuizCorrectIndex(typeof c === 'object' && typeof c?.correctIndex === 'number' ? c.correctIndex : 0);
    }
  }, [sticker]);

  if (!sticker) return null as any;

  const close = () => {
    onClose();
  };

  const handleSave = () => {
    if (!sticker) return;
    if (sticker.type === 'poll') {
      const opts = pollOptions.map(o => o.trim()).filter(Boolean).slice(0, 4);
      if (!pollQuestion.trim() || opts.length < 2) return;
      onSave(sticker.id, { question: pollQuestion.trim(), options: opts });
    } else if (sticker.type === 'slider') {
      if (!sliderQuestion.trim()) return;
      onSave(sticker.id, { question: sliderQuestion.trim(), emoji: sliderEmoji });
    } else if (sticker.type === 'question') {
      if (!questionText.trim()) return;
      onSave(sticker.id, { text: questionText.trim() });
    } else if (sticker.type === 'quiz') {
      const q = quizQuestion.trim();
      const opts = quizOptions.map(o => o.trim()).filter(Boolean).slice(2, 6) as string[];
      // Ensure at least 2 options; keep up to 4
      const finalOpts = (quizOptions.map(o => o.trim()).filter(Boolean).slice(0, 4)) as string[];
      if (!q || finalOpts.length < 2) return;
      const ci = Math.min(Math.max(0, quizCorrectIndex), finalOpts.length - 1);
      onSave(sticker.id, { question: q, options: finalOpts, correctIndex: ci });
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.background.elevated, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '85%' }}>
          <View style={{ padding: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border.light }}>
            <TouchableOpacity onPress={close} style={{ padding: spacing.sm }}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={{ color: colors.text.primary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold }}>Edit Sticker</Text>
            <TouchableOpacity onPress={handleSave} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.accent.primary, borderRadius: borderRadius.md }}>
              <Text style={{ color: colors.text.inverse, fontWeight: typography.fontWeight.semibold }}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: spacing.lg }}>
            {sticker.type === 'poll' && (
              <View style={{ gap: spacing.md }}>
                <Text style={{ color: colors.text.primary, fontWeight: '700' }}>Question</Text>
                <TextInput
                  style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border.subtle }}
                  placeholder="Ask a question"
                  placeholderTextColor={colors.text.secondary}
                  value={pollQuestion}
                  onChangeText={setPollQuestion}
                  multiline
                />
                <Text style={{ color: colors.text.primary, fontWeight: '700' }}>Options</Text>
                {pollOptions.map((o, i) => (
                  <TextInput
                    key={i}
                    style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border.subtle, marginBottom: spacing.sm }}
                    placeholder={`Option ${i + 1}`}
                    placeholderTextColor={colors.text.secondary}
                    value={o}
                    onChangeText={(t) => {
                      const cp = [...pollOptions];
                      cp[i] = t;
                      setPollOptions(cp);
                    }}
                  />
                ))}
                {pollOptions.length < 4 && (
                  <TouchableOpacity onPress={() => setPollOptions(prev => [...prev, ''])} style={{ alignSelf: 'flex-start', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Ionicons name="add" size={18} color={colors.accent.primary} />
                    <Text style={{ color: colors.accent.primary, fontWeight: '600' }}>Add Option</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {sticker.type === 'slider' && (
              <View style={{ gap: spacing.md }}>
                <Text style={{ color: colors.text.primary, fontWeight: '700' }}>Question</Text>
                <TextInput
                  style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border.subtle }}
                  placeholder="Ask something to rate"
                  placeholderTextColor={colors.text.secondary}
                  value={sliderQuestion}
                  onChangeText={setSliderQuestion}
                  multiline
                />
                <Text style={{ color: colors.text.primary, fontWeight: '700' }}>Emoji</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {['❤️','😍','🔥','👍','⭐','💯','😂','🥳','😎','🎉','👏','🤩'].map(em => (
                    <TouchableOpacity key={em} onPress={() => setSliderEmoji(em)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: sliderEmoji === em ? colors.accent.primary : colors.background.secondary }}>
                      <Text style={{ color: sliderEmoji === em ? colors.text.inverse : colors.text.primary, fontSize: 18 }}>{em}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {sticker.type === 'question' && (
              <View style={{ gap: spacing.md }}>
                <Text style={{ color: colors.text.primary, fontWeight: '700' }}>Question</Text>
                <TextInput
                  style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border.subtle }}
                  placeholder="Ask a question"
                  placeholderTextColor={colors.text.secondary}
                  value={questionText}
                  onChangeText={setQuestionText}
                  multiline
                />
              </View>
            )}

            {sticker.type === 'quiz' && (
              <View style={{ gap: spacing.md }}>
                <Text style={{ color: colors.text.primary, fontWeight: '700' }}>Quiz Question</Text>
                <TextInput
                  style={{ backgroundColor: colors.background.secondary, color: colors.text.primary, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border.subtle }}
                  placeholder="Enter quiz question"
                  placeholderTextColor={colors.text.secondary}
                  value={quizQuestion}
                  onChangeText={setQuizQuestion}
                  multiline
                />
                <Text style={{ color: colors.text.primary, fontWeight: '700' }}>Options</Text>
                {quizOptions.map((o, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <TouchableOpacity onPress={() => setQuizCorrectIndex(i)} style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: quizCorrectIndex === i ? colors.accent.primary : colors.border.light, alignItems: 'center', justifyContent: 'center' }}>
                      {quizCorrectIndex === i && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent.primary }} />}
                    </TouchableOpacity>
                    <TextInput
                      style={{ flex: 1, backgroundColor: colors.background.secondary, color: colors.text.primary, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border.subtle }}
                      placeholder={`Option ${i + 1}`}
                      placeholderTextColor={colors.text.secondary}
                      value={o}
                      onChangeText={(t) => {
                        const cp = [...quizOptions];
                        cp[i] = t;
                        setQuizOptions(cp);
                      }}
                    />
                  </View>
                ))}
                {quizOptions.length < 4 && (
                  <TouchableOpacity onPress={() => setQuizOptions(prev => [...prev, ''])} style={{ alignSelf: 'flex-start', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Ionicons name="add" size={18} color={colors.accent.primary} />
                    <Text style={{ color: colors.accent.primary, fontWeight: '600' }}>Add Option</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
