import React, { useEffect, useRef, useState } from 'react';
import { Modal, TouchableOpacity, View, Text, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { EmojiKeyboard, type EmojiType } from 'rn-emoji-keyboard';

interface Props {
  visible: boolean;
  quickReactions: string[];
  activeReaction: string;
  defaultReaction: string;
  selectedQuickIndex: number | null;
  onSelectedQuickIndexChange: (index: number | null) => void;
  onDefaultReactionChange: (emo: string) => void;
  onQuickReactionReplace: (index: number, emo: string) => void;
  onSelect: (emo: string) => void;
  onClose: () => void;
  stylesRef: any;
}

const MoreReactionsPicker: React.FC<Props> = ({
  visible,
  quickReactions,
  activeReaction,
  defaultReaction,
  selectedQuickIndex,
  onSelectedQuickIndexChange,
  onDefaultReactionChange,
  onQuickReactionReplace,
  onSelect,
  onClose,
}) => {
  const [localSelectedIndex, setLocalSelectedIndex] = useState<number | null>(selectedQuickIndex);
  const hasFocusedQuick = localSelectedIndex !== null;
  const sheetTranslate = useRef(new Animated.Value(34)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const sheetScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    setLocalSelectedIndex(selectedQuickIndex);
  }, [selectedQuickIndex, visible]);

  useEffect(() => {
    if (!visible) {
      sheetTranslate.setValue(34);
      sheetOpacity.setValue(0);
      sheetScale.setValue(0.96);
      return;
    }

    Animated.parallel([
      Animated.timing(sheetOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(sheetTranslate, {
        toValue: 0,
        tension: 155,
        friction: 16,
        useNativeDriver: true,
      }),
      Animated.spring(sheetScale, {
        toValue: 1,
        tension: 165,
        friction: 14,
        useNativeDriver: true,
      }),
    ]).start();
  }, [sheetOpacity, sheetScale, sheetTranslate, visible]);

  const handleEmojiPick = (emo: string) => {
    onSelect(emo);
    if (localSelectedIndex !== null && localSelectedIndex >= 0) {
      onQuickReactionReplace(localSelectedIndex, emo);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={localStyles.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View
          style={[
            localStyles.sheetWrap,
            {
              opacity: sheetOpacity,
              transform: [{ translateY: sheetTranslate }, { scale: sheetScale }],
            },
          ]}
        >
          <BlurView intensity={60} tint="dark" style={localStyles.sheet}>
            <Text style={localStyles.title}>Reactions</Text>
            <Text style={localStyles.hint}>Tap a top slot to replace it. Hold a slot to make it your double-tap default.</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={localStyles.quickRail}>
              {quickReactions.map((emo, index) => {
                const isCurrentReaction = emo === activeReaction;
                const isDefault = emo === defaultReaction;
                const isEditing = index === localSelectedIndex;
                const shouldMute = hasFocusedQuick ? !isEditing : !!activeReaction && !isCurrentReaction;
                return (
                  <TouchableOpacity
                    key={`${emo}-${index}`}
                    style={[
                      localStyles.quickChip,
                      isCurrentReaction && localStyles.quickChipActive,
                      isEditing && localStyles.quickChipEditing,
                      shouldMute && localStyles.quickChipMuted,
                    ]}
                    activeOpacity={0.84}
                    onPress={() => {
                      setLocalSelectedIndex(index);
                      onSelectedQuickIndexChange(index);
                    }}
                    onLongPress={() => {
                      onDefaultReactionChange(emo);
                      setLocalSelectedIndex(index);
                      onSelectedQuickIndexChange(index);
                    }}
                  >
                    {isDefault ? <View style={localStyles.defaultDot} /> : null}
                    <Text style={localStyles.quickEmoji}>{emo}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={localStyles.keyboardWrap}>
              <EmojiKeyboard
                onEmojiSelected={(selected: EmojiType) => handleEmojiPick(selected.emoji)}
                enableSearchBar
                enableRecentlyUsed
                categoryPosition="top"
                expandable={false}
                defaultHeight={322}
                hideHeader
                disableSafeArea
                theme={{
                  backdrop: 'transparent',
                  knob: '#334155',
                  container: '#0a1224',
                  header: '#cbd5e1',
                  skinTonesContainer: '#111827',
                  category: {
                    icon: '#8b9bb7',
                    iconActive: '#f8fafc',
                    container: '#162033',
                    containerActive: '#4a2570',
                  },
                  search: {
                    background: '#141d2d',
                    text: '#f8fafc',
                    placeholder: '#64748b',
                    icon: '#94a3b8',
                  },
                  customButton: {
                    icon: '#f8fafc',
                    iconPressed: '#f8fafc',
                    background: '#162033',
                    backgroundPressed: '#2a3345',
                  },
                  emoji: {
                    selected: '#4a2570',
                  },
                }}
                styles={{
                  container: {
                    backgroundColor: '#0a1224',
                    borderRadius: 18,
                  },
                  header: {
                    color: '#cbd5e1',
                    fontSize: 12,
                    fontWeight: '700',
                  },
                  knob: {
                    backgroundColor: '#334155',
                  },
                  category: {
                    container: {
                      marginBottom: 10,
                    },
                    icon: {
                      fontSize: 14,
                    },
                  },
                  searchBar: {
                    container: {
                      marginHorizontal: 0,
                      marginBottom: 10,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.14)',
                    },
                    text: {
                      fontSize: 13,
                    },
                  },
                  emoji: {
                    selected: {
                      borderRadius: 16,
                    },
                  },
                }}
              />
            </View>
          </BlurView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.22)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    marginHorizontal: 10,
    marginBottom: 14,
    shadowColor: '#020617',
    shadowOpacity: 0.32,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  sheet: {
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: '#0a1224',
  },
  title: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  hint: {
    color: '#94a3b8',
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 10,
  },
  quickRail: {
    gap: 8,
    paddingRight: 4,
    marginBottom: 10,
  },
  quickChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: '#162033',
  },
  quickChipActive: {
    borderColor: '#c084fc',
    backgroundColor: '#40215c',
  },
  quickChipEditing: {
    borderColor: '#f8fafc',
    backgroundColor: '#2a3345',
    transform: [{ scale: 1.04 }],
  },
  quickChipMuted: {
    opacity: 0.28,
  },
  defaultDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f8fafc',
  },
  quickEmoji: {
    fontSize: 20,
  },
  keyboardWrap: {
    borderRadius: 18,
    overflow: 'hidden',
  },
});

export default MoreReactionsPicker;
