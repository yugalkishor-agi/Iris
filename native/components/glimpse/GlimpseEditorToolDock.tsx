import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing } from '../../styles/theme';

interface Tool {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

interface GlimpseEditorToolDockProps {
  composerVisible: boolean;
  activeTool: string | null;
  tools: Tool[];
  handleToolPress: (toolId: string) => void;
  selectedCanvasLayer: string | null;
  removeSelectedCanvasItem: () => void;
  setSelectedCanvasLayer: (id: string | null) => void;
  setSelectedOverlayId: (id: string | null) => void;
}

export function GlimpseEditorToolDock({
  composerVisible,
  activeTool,
  tools,
  handleToolPress,
  selectedCanvasLayer,
  removeSelectedCanvasItem,
  setSelectedCanvasLayer,
  setSelectedOverlayId,
}: GlimpseEditorToolDockProps) {
  if (composerVisible) return null;

  return (
    <View style={styles.container}>
      {selectedCanvasLayer ? (
        <View style={styles.selectionActions}>
          <TouchableOpacity style={styles.selectionActionButton} onPress={() => { setSelectedCanvasLayer(null); setSelectedOverlayId(null); }}>
            <Ionicons name="close-outline" size={16} color="#DDEAFE" />
            <Text style={styles.selectionActionText}>Deselect</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.selectionActionButton, styles.selectionActionDanger]} onPress={removeSelectedCanvasItem}>
            <Ionicons name="trash-outline" size={16} color="#FFB4B4" />
            <Text style={[styles.selectionActionText, styles.selectionActionDangerText]}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {activeTool !== 'voice' ? (
        <View style={styles.actionRail}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRailScroll as any}>
            {tools.map((tool) => {
              const active = activeTool === tool.id;
              return (
                <TouchableOpacity key={tool.id} style={[styles.toolChip, active && styles.toolChipActive]} onPress={() => handleToolPress(tool.id)}>
                  <View style={[styles.toolIconWrap, active && styles.toolIconWrapActive]}>
                    <Ionicons name={tool.icon} size={18} color={active ? '#08111F' : '#FFFFFF'} />
                  </View>
                  <Text style={[styles.toolText, active && styles.toolTextActive]}>{tool.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  selectionActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 16 },
  selectionActionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  selectionActionDanger: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.24)' },
  selectionActionText: { color: '#DDEAFE', fontSize: 13, fontWeight: typography.fontWeight.semibold as any },
  selectionActionDangerText: { color: '#FFB4B4' },
  actionRail: { paddingTop: spacing.md, paddingBottom: spacing.xl, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  actionRailScroll: { paddingHorizontal: spacing.lg, gap: 12, paddingBottom: spacing.lg },
  toolChip: { alignItems: 'center', gap: 6 },
  toolChipActive: { opacity: 1 },
  toolIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  toolIconWrapActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  toolText: { color: 'rgba(255,255,255,0.64)', fontSize: 11, fontWeight: typography.fontWeight.medium as any },
  toolTextActive: { color: '#FFFFFF', fontWeight: typography.fontWeight.bold as any },
});
