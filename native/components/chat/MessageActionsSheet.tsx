import React, { useEffect, useMemo, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, Dimensions, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
  isMe?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  reactions: string[];
  activeReaction: string;
  defaultReaction: string;
  onReactionPress: (emo: string) => void;
  onDefaultReactionChange: (emo: string) => void;
  onMoreReactions: () => void;
  canEdit?: boolean;
  canDeleteForEveryone?: boolean;
  anchor?: AnchorRect | null;
  stylesRef: any;
}

const MessageActionsSheet: React.FC<Props> = ({
  visible,
  onClose,
  onAction,
  reactions,
  activeReaction,
  defaultReaction,
  onReactionPress,
  onDefaultReactionChange,
  onMoreReactions,
  canEdit,
  canDeleteForEveryone,
  anchor,
  stylesRef,
}) => {
  const s = stylesRef;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const liftAnim = useRef(new Animated.Value(10)).current;
  const stableAnchorRef = useRef<AnchorRect | null>(null);

  const actions = [
    { key: 'reply', label: 'Reply', icon: 'return-up-back-outline' },
    { key: 'forward', label: 'Forward', icon: 'paper-plane-outline' },
    ...(canEdit ? [{ key: 'edit', label: 'Edit', icon: 'create-outline' } as const] : []),
    { key: 'delete_me', label: 'Delete for me', icon: 'trash-outline' },
    ...(canDeleteForEveryone ? [{ key: 'delete_all', label: 'Delete for everyone', icon: 'alert-circle-outline' } as const] : []),
    { key: 'pin', label: 'Pin/Unpin', icon: 'bookmark-outline' },
  ];

  useEffect(() => {
    if (!visible) {
      stableAnchorRef.current = null;
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
      liftAnim.stopAnimation();
      scaleAnim.setValue(0.97);
      opacityAnim.setValue(0);
      liftAnim.setValue(12);
      return;
    }

    stableAnchorRef.current = anchor ? { ...anchor } : null;
    scaleAnim.stopAnimation();
    opacityAnim.stopAnimation();
    liftAnim.stopAnimation();
    scaleAnim.setValue(0.97);
    opacityAnim.setValue(0);
    liftAnim.setValue(12);

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        speed: 18,
        bounciness: 5,
        useNativeDriver: true,
      }),
      Animated.spring(liftAnim, {
        toValue: 0,
        speed: 18,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [anchor, liftAnim, opacityAnim, scaleAnim, visible]);

  const popoverStyle = useMemo(() => {
    const window = Dimensions.get('window');
    const sheetWidth = Math.min(window.width - 34, 248);
    const sheetHeight = 54 + actions.length * 34;
    const effectiveAnchor = stableAnchorRef.current || anchor;
    if (!effectiveAnchor) {
      return { width: sheetWidth, left: 14, top: Math.max(18, window.height - sheetHeight - 28) };
    }

    const preferredLeft = effectiveAnchor.isMe ? effectiveAnchor.x - sheetWidth - 8 : effectiveAnchor.x + effectiveAnchor.width + 8;
    const centeredTop = effectiveAnchor.y + effectiveAnchor.height / 2 - sheetHeight / 2;
    return {
      width: sheetWidth,
      left: Math.min(Math.max(14, preferredLeft), window.width - sheetWidth - 14),
      top: Math.min(Math.max(18, centeredTop), window.height - sheetHeight - 18),
    };
  }, [actions.length, anchor]);

  const effectiveAnchor = stableAnchorRef.current || anchor;
  const openTranslateX = effectiveAnchor ? (effectiveAnchor.isMe ? 8 : -8) : 0;
  const translateX = liftAnim.interpolate({
    inputRange: [0, 10],
    outputRange: [0, openTranslateX],
  });
  const hasSelectedReaction = reactions.includes(activeReaction);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.actionOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View
          style={[
            localStyles.popoverWrap,
            popoverStyle,
            {
              opacity: opacityAnim,
              transform: [{ translateX }, { translateY: liftAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <BlurView intensity={58} tint="dark" style={localStyles.popover}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={localStyles.reactionRail}>
              {reactions.map((emo) => {
                const isSelected = emo === activeReaction;
                const isDefault = emo === defaultReaction;
                return (
                  <TouchableOpacity
                    key={emo}
                    style={[
                      localStyles.reactionChip,
                      isSelected && localStyles.reactionChipSelected,
                      !isSelected && hasSelectedReaction && localStyles.reactionChipMuted,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => onReactionPress(emo)}
                    onLongPress={() => onDefaultReactionChange(emo)}
                  >
                    {isDefault ? <View style={localStyles.defaultDot} /> : null}
                    <Text style={localStyles.reactionText}>{emo}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={[localStyles.reactionChip, localStyles.plusChip]} onPress={onMoreReactions} activeOpacity={0.85}>
                <Ionicons name="add" size={18} color="#f8fafc" />
              </TouchableOpacity>
            </ScrollView>

            <View style={localStyles.actionsWrap}>
              {actions.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={localStyles.actionRow}
                  onPress={() => {
                    onAction(a.key);
                    onClose();
                  }}
                  activeOpacity={0.86}
                >
                  <Ionicons name={a.icon as any} size={17} color={a.key === 'delete_all' ? '#f87171' : '#e2e8f0'} />
                  <Text style={[localStyles.actionLabel, a.key === 'delete_all' && localStyles.actionLabelDanger]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  popoverWrap: {
    position: 'absolute',
    shadowColor: '#020617',
    shadowOpacity: 0.34,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  popover: {
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(7, 12, 24, 0.74)',
  },
  reactionRail: {
    gap: 6,
    paddingRight: 4,
    marginBottom: 8,
  },
  reactionChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  reactionChipSelected: {
    borderColor: '#c084fc',
    backgroundColor: 'rgba(192,132,252,0.26)',
    transform: [{ scale: 1.04 }],
  },
  reactionChipMuted: {
    opacity: 0.32,
  },
  plusChip: {
    backgroundColor: 'rgba(168, 85, 247, 0.28)',
    borderColor: 'rgba(216, 180, 254, 0.68)',
  },
  reactionText: {
    fontSize: 18,
  },
  defaultDot: {
    position: 'absolute',
    top: 5,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f8fafc',
  },
  actionsWrap: {
    gap: 0,
  },
  actionRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 4,
  },
  actionLabel: {
    color: '#e2e8f0',
    fontSize: 13,
  },
  actionLabelDanger: {
    color: '#f87171',
  },
});

export default MessageActionsSheet;
