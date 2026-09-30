import React from 'react';
import { Modal, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

interface QuickReactionPickerProps {
  visible: boolean;
  reactions: string[];
  selected: string;
  onSelect: (emo: string) => void;
  onClose: () => void;
  stylesRef: any;
}

const QuickReactionPicker: React.FC<QuickReactionPickerProps> = ({ visible, reactions, selected, onSelect, onClose, stylesRef }) => {
  const s = stylesRef;
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.container}>
          <BlurView intensity={80} tint="dark" style={styles.pickerContainer}>
            {reactions.map((emo, index) => (
              <TouchableOpacity
                key={`${emo}-${index}`}
                style={[
                  styles.emojiBtn,
                  selected === emo && styles.emojiSelected,
                ]}
                onPress={() => {
                  onSelect(emo);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiText}>{emo}</Text>
              </TouchableOpacity>
            ))}
          </BlurView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    alignItems: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    gap: 12,
  },
  emojiBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emojiSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38bdf8',
    borderWidth: 1,
  },
  emojiText: {
    fontSize: 24,
  },
});

export default QuickReactionPicker;
