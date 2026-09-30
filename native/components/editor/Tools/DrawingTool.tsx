import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEditorStore, BrushType } from '../../../stores/editorStore';

const BRUSH_TYPES: { id: BrushType; icon: string; label: string }[] = [
  { id: 'pen', icon: '✏️', label: 'Pen' },
  { id: 'marker', icon: '🖍️', label: 'Marker' },
  { id: 'neon', icon: '✨', label: 'Neon' },
  { id: 'pencil', icon: '✎', label: 'Pencil' },
  { id: 'eraser', icon: '🧹', label: 'Eraser' },
];

const COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#008000', '#FF69B4', '#FFD700', '#4DD0E1', '#EC4899',
];

export function DrawingTool() {
  const brushType = useEditorStore(state => state.brushType);
  const brushColor = useEditorStore(state => state.brushColor);
  const brushSize = useEditorStore(state => state.brushSize);
  const setBrushType = useEditorStore(state => state.setBrushType);
  const setBrushColor = useEditorStore(state => state.setBrushColor);
  const setBrushSize = useEditorStore(state => state.setBrushSize);
  const setActiveTool = useEditorStore(state => state.setActiveTool);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Drawing</Text>
        <TouchableOpacity onPress={() => setActiveTool('none')}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Brush Types */}
      <View style={styles.section}>
        <Text style={styles.label}>Brush Type</Text>
        <View style={styles.brushTypes}>
          {BRUSH_TYPES.map(brush => (
            <TouchableOpacity
              key={brush.id}
              style={[
                styles.brushButton,
                brushType === brush.id && styles.brushButtonActive,
              ]}
              onPress={() => setBrushType(brush.id)}
            >
              <Text style={styles.brushIcon}>{brush.icon}</Text>
              <Text
                style={[
                  styles.brushLabel,
                  brushType === brush.id && styles.brushLabelActive,
                ]}
              >
                {brush.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Brush Size */}
      <View style={styles.section}>
        <Text style={styles.label}>Size: {brushSize}px</Text>
        <View style={styles.sizeControls}>
          <TouchableOpacity
            style={styles.sizeButton}
            onPress={() => setBrushSize(Math.max(5, brushSize - 5))}
          >
            <Ionicons name="remove" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.sizePreview}>
            <View
              style={{
                width: brushSize,
                height: brushSize,
                borderRadius: brushSize / 2,
                backgroundColor: brushColor,
              }}
            />
          </View>
          
          <TouchableOpacity
            style={styles.sizeButton}
            onPress={() => setBrushSize(Math.min(50, brushSize + 5))}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Colors */}
      {brushType !== 'eraser' && (
        <View style={styles.section}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorGrid}>
            {COLORS.map(color => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  brushColor === color && styles.colorButtonActive,
                ]}
                onPress={() => setBrushColor(color)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Hint */}
      <Text style={styles.hint}>
        Draw on canvas. Use eraser to remove parts of your drawing.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A0A0',
    marginBottom: 8,
  },
  brushTypes: {
    flexDirection: 'row',
    gap: 8,
  },
  brushButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  brushButtonActive: {
    borderColor: '#EC4899',
    backgroundColor: '#332A2A',
  },
  brushIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  brushLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A0A0A0',
  },
  brushLabelActive: {
    color: '#FFFFFF',
  },
  sizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sizeButton: {
    backgroundColor: '#2A2A2A',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizePreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: '#FFFFFF',
  },
  hint: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
});
