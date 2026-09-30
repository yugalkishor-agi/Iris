import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEditorStore } from '../../../stores/editorStore';

interface EditorHeaderProps {
  onClose: () => void;
  onSave: () => void;
}

export function EditorHeader({ onClose, onSave }: EditorHeaderProps) {
  const canUndo = useEditorStore(state => state.canUndo());
  const canRedo = useEditorStore(state => state.canRedo());
  const undo = useEditorStore(state => state.undo);
  const redo = useEditorStore(state => state.redo);

  return (
    <View style={styles.header}>
      {/* Close Button */}
      <TouchableOpacity
        style={styles.headerButton}
        onPress={onClose}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>Story Editor</Text>

      {/* Right Actions */}
      <View style={styles.rightActions}>
        {/* Undo */}
        <TouchableOpacity
          style={[styles.iconButton, !canUndo && styles.iconButtonDisabled]}
          onPress={undo}
          disabled={!canUndo}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-undo"
            size={24}
            color={canUndo ? '#FFFFFF' : '#666666'}
          />
        </TouchableOpacity>

        {/* Redo */}
        <TouchableOpacity
          style={[styles.iconButton, !canRedo && styles.iconButtonDisabled]}
          onPress={redo}
          disabled={!canRedo}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-redo"
            size={24}
            color={canRedo ? '#FFFFFF' : '#666666'}
          />
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={onSave}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={24} color="#000000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  iconButtonDisabled: {
    opacity: 0.3,
  },
  saveButton: {
    backgroundColor: '#EC4899',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
