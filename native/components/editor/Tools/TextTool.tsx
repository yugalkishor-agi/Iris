import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEditorStore } from '../../../stores/editorStore';

const FONTS = [
  'System',
  'Roboto',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier',
  'Verdana',
  'Georgia',
];

const COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#008000', '#FF69B4', '#FFD700', '#4DD0E1', '#EC4899',
];

export function TextTool() {
  const [inputText, setInputText] = useState('');
  const textColor = useEditorStore(state => state.textColor);
  const textSize = useEditorStore(state => state.textSize);
  const textFont = useEditorStore(state => state.textFont);
  const setTextColor = useEditorStore(state => state.setTextColor);
  const setTextSize = useEditorStore(state => state.setTextSize);
  const setTextFont = useEditorStore(state => state.setTextFont);
  const setActiveTool = useEditorStore(state => state.setActiveTool);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Text</Text>
        <TouchableOpacity onPress={() => setActiveTool('none')}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Text Input */}
      <TextInput
        style={[styles.textInput, { color: textColor, fontSize: textSize / 3 }]}
        value={inputText}
        onChangeText={setInputText}
        placeholder="Enter text..."
        placeholderTextColor="#666666"
        multiline
      />

      {/* Font Size Slider */}
      <View style={styles.section}>
        <Text style={styles.label}>Size: {textSize}</Text>
        <View style={styles.sizeButtons}>
          <TouchableOpacity
            style={styles.sizeButton}
            onPress={() => setTextSize(Math.max(20, textSize - 10))}
          >
            <Ionicons name="remove" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sizeButton}
            onPress={() => setTextSize(Math.min(200, textSize + 10))}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Font Selector */}
      <View style={styles.section}>
        <Text style={styles.label}>Font</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.fontList}>
            {FONTS.map(font => (
              <TouchableOpacity
                key={font}
                style={[
                  styles.fontButton,
                  textFont === font && styles.fontButtonActive,
                ]}
                onPress={() => setTextFont(font)}
              >
                <Text
                  style={[
                    styles.fontButtonText,
                    textFont === font && styles.fontButtonTextActive,
                  ]}
                >
                  {font}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Color Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colorGrid}>
          {COLORS.map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                textColor === color && styles.colorButtonActive,
              ]}
              onPress={() => setTextColor(color)}
            />
          ))}
        </View>
      </View>

      {/* Hint */}
      <Text style={styles.hint}>
        Tap on canvas to add text, then edit it here
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
  textInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
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
  sizeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sizeButton: {
    backgroundColor: '#2A2A2A',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontList: {
    flexDirection: 'row',
    gap: 8,
  },
  fontButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fontButtonActive: {
    borderColor: '#EC4899',
  },
  fontButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A0A0',
  },
  fontButtonTextActive: {
    color: '#FFFFFF',
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
