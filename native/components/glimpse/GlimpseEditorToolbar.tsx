import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../styles/theme';

interface GlimpseEditorToolbarProps {
  composerVisible: boolean;
  onClose: () => void;
  canUndo: boolean;
  canRedo: boolean;
  handleUndo: () => void;
  handleRedo: () => void;
  downloading: boolean;
  handleSave: () => void;
}

export function GlimpseEditorToolbar({
  composerVisible,
  onClose,
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
  downloading,
  handleSave,
}: GlimpseEditorToolbarProps) {
  return (
    <View pointerEvents={composerVisible ? 'none' : 'auto'} style={[styles.header, composerVisible && styles.headerHidden]}>
      <TouchableOpacity style={styles.headerButton} onPress={onClose}>
        <Ionicons name="close" size={22} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Glimpse editor</Text>
        <View style={styles.headerHistory}>
          <TouchableOpacity style={[styles.historyButton, !canUndo && styles.historyButtonDisabled]} onPress={handleUndo} disabled={!canUndo}>
            <Ionicons name="arrow-undo-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.historyButton, !canRedo && styles.historyButtonDisabled]} onPress={handleRedo} disabled={!canRedo}>
            <Ionicons name="arrow-redo-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={[styles.saveButton, downloading && styles.saveButtonDisabled]} onPress={handleSave} disabled={downloading}>
        {downloading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Done</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, zIndex: 12 },
  headerHidden: { opacity: 0 },
  headerButton: { width: 44, height: 44, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.md },
  headerTitle: { color: '#FFFFFF', fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold as any },
  headerHistory: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  historyButtonDisabled: { opacity: 0.36 },
  saveButton: { minWidth: 78, height: 44, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', paddingHorizontal: spacing.md },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold as any },
});
