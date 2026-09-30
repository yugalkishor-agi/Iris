import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

interface EnhancedTextEditorProps {
  visible: boolean;
  onClose: () => void;
  onAddText: (textData: TextData) => void;
  initialText?: string;
  onPreviewChange?: (data: TextData | null) => void;
}

interface TextData {
  text: string;
  color: string;
  backgroundColor: string;
  fontSize: number;
  fontFamily: string;
  alignment: 'left' | 'center' | 'right';
  style: 'normal' | 'bold' | 'italic';
}

export function EnhancedTextEditor({ 
  visible, 
  onClose, 
  onAddText, 
  initialText = '',
  onPreviewChange,
}: EnhancedTextEditorProps) {
  const [text, setText] = useState(initialText);
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedBgColor, setSelectedBgColor] = useState('transparent');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('System');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [textStyle, setTextStyle] = useState<'normal' | 'bold' | 'italic'>('normal');

  const textColors = [
    '#FFFFFF', '#000000', '#FF4444', '#44FF44', '#4444FF', 
    '#FFFF44', '#FF44FF', '#44FFFF', '#FFA500', '#800080'
  ];

  const backgroundColors = [
    'transparent', '#000000', '#FFFFFF', '#FF4444', '#44FF44', 
    '#4444FF', '#FFFF44', '#FF44FF', '#44FFFF', '#FFA500'
  ];

  const fontFamilies = [
    { name: 'System', value: 'System' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Arial', value: 'Arial' },
    { name: 'Helvetica', value: 'Helvetica' },
    { name: 'Times', value: 'Times New Roman' },
    { name: 'Courier', value: 'Courier New' },
  ];

  const fontSizes = [16, 20, 24, 28, 32, 36, 40, 48, 56, 64];

  const emitPreview = (t: string) => {
    if (!onPreviewChange) return;
    const trimmed = t.trim();
    if (!trimmed) { onPreviewChange(null); return; }
    onPreviewChange({
      text: trimmed,
      color: selectedColor,
      backgroundColor: selectedBgColor,
      fontSize,
      fontFamily,
      alignment,
      style: textStyle,
    });
  };

  const handleAddText = () => {
    if (text.trim()) {
      const textData: TextData = {
        text: text.trim(),
        color: selectedColor,
        backgroundColor: selectedBgColor,
        fontSize,
        fontFamily,
        alignment,
        style: textStyle,
      };
      onAddText(textData);
      setText('');
      onPreviewChange && onPreviewChange(null);
      onClose();
    }
  };

  const getTextPreviewStyle = () => ({
    color: selectedColor,
    backgroundColor: selectedBgColor === 'transparent' ? undefined : selectedBgColor,
    fontSize,
    fontFamily,
    textAlign: alignment,
    fontWeight: textStyle === 'bold' ? 'bold' as const : 'normal' as const,
    fontStyle: textStyle === 'italic' ? 'italic' as const : 'normal' as const,
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0} style={{ width: '100%' }}>
          <View style={styles.modal}>
            <View style={styles.handle} />
          
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Add Text</Text>
            <TouchableOpacity 
              onPress={handleAddText} 
              style={[styles.headerButton, styles.doneButton]}
              disabled={!text.trim()}
            >
              <Text style={[styles.doneText, !text.trim() && styles.disabledText]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Text Input */}
            <View style={styles.textInputContainer}>
              <TextInput
                style={[styles.textInput, getTextPreviewStyle()]}
                placeholder="Type your text..."
                placeholderTextColor={colors.text.secondary}
                value={text}
                onChangeText={(v) => { setText(v); emitPreview(v); }}
                multiline
                autoFocus
                textAlignVertical="center"
              />
            </View>

            {/* Text Colors */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Text Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.colorRow}>
                  {textColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorButton,
                        { backgroundColor: color },
                        color === '#FFFFFF' && styles.whiteColorBorder,
                        selectedColor === color && styles.selectedColor,
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <Ionicons name="checkmark" size={16} color={color === '#FFFFFF' ? '#000' : '#FFF'} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Background Colors */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Background</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.colorRow}>
                  {backgroundColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorButton,
                        { backgroundColor: color === 'transparent' ? colors.background.secondary : color },
                        color === 'transparent' && styles.transparentBg,
                        color === '#FFFFFF' && styles.whiteColorBorder,
                        selectedBgColor === color && styles.selectedColor,
                      ]}
                      onPress={() => setSelectedBgColor(color)}
                    >
                      {color === 'transparent' && (
                        <Ionicons name="close" size={16} color={colors.text.secondary} />
                      )}
                      {selectedBgColor === color && color !== 'transparent' && (
                        <Ionicons name="checkmark" size={16} color={color === '#FFFFFF' ? '#000' : '#FFF'} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Font Size */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Font Size</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.sizeRow}>
                  {fontSizes.map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.sizeButton,
                        fontSize === size && styles.selectedSize,
                      ]}
                      onPress={() => setFontSize(size)}
                    >
                      <Text style={[
                        styles.sizeText,
                        fontSize === size && styles.selectedSizeText,
                      ]}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Font Family */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Font</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.fontRow}>
                  {fontFamilies.map((font) => (
                    <TouchableOpacity
                      key={font.value}
                      style={[
                        styles.fontButton,
                        fontFamily === font.value && styles.selectedFont,
                      ]}
                      onPress={() => setFontFamily(font.value)}
                    >
                      <Text style={[
                        styles.fontText,
                        { fontFamily: font.value },
                        fontFamily === font.value && styles.selectedFontText,
                      ]}>
                        {font.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Text Alignment */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alignment</Text>
              <View style={styles.alignmentRow}>
                {(['left', 'center', 'right'] as const).map((align) => (
                  <TouchableOpacity
                    key={align}
                    style={[
                      styles.alignmentButton,
                      alignment === align && styles.selectedAlignment,
                    ]}
                    onPress={() => setAlignment(align)}
                  >
                    <Ionicons 
                      name={
                        align === 'left' ? 'text-outline' : 
                        align === 'center' ? 'text' : 'text-outline'
                      } 
                      size={20} 
                      color={alignment === align ? colors.accent.primary : colors.text.secondary} 
                    />
                    <Text style={[
                      styles.alignmentText,
                      alignment === align && styles.selectedAlignmentText,
                    ]}>
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Text Style */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Style</Text>
              <View style={styles.styleRow}>
                {(['normal', 'bold', 'italic'] as const).map((style) => (
                  <TouchableOpacity
                    key={style}
                    style={[
                      styles.styleButton,
                      textStyle === style && styles.selectedStyle,
                    ]}
                    onPress={() => setTextStyle(style)}
                  >
                    <Text style={[
                      styles.styleText,
                      style === 'bold' && { fontWeight: 'bold' },
                      style === 'italic' && { fontStyle: 'italic' },
                      textStyle === style && styles.selectedStyleText,
                    ]}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: height * 0.9,
    minHeight: height * 0.65,
    alignSelf: 'stretch',
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.medium,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  doneButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  doneText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.semibold,
  },
  disabledText: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  textInputContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.lg,
    minHeight: 120,
  },
  textInput: {
    fontSize: 24,
    color: colors.text.primary,
    textAlign: 'center',
    minHeight: 80,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  whiteColorBorder: {
    borderColor: colors.border.medium,
  },
  selectedColor: {
    borderColor: colors.accent.primary,
    borderWidth: 3,
  },
  transparentBg: {
    borderWidth: 2,
    borderColor: colors.border.medium,
    borderStyle: 'dashed',
  },
  sizeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sizeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSize: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  sizeText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  selectedSizeText: {
    color: '#FFFFFF',
  },
  fontRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  fontButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFont: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  fontText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  selectedFontText: {
    color: '#FFFFFF',
  },
  alignmentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  alignmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    gap: spacing.xs,
  },
  selectedAlignment: {
    backgroundColor: colors.accent.primary,
  },
  alignmentText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  selectedAlignmentText: {
    color: '#FFFFFF',
  },
  styleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  styleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  selectedStyle: {
    backgroundColor: colors.accent.primary,
  },
  styleText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  selectedStyleText: {
    color: '#FFFFFF',
  },
});
