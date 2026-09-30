import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEditorStore, type WidgetType, type WidgetConfig } from '../../../stores/editorStore';
import { FlashList } from '@shopify/flash-list';

interface WidgetToolProps {
  onClose: () => void;
}

type WidgetOption = {
  type: WidgetType;
  icon: string;
  label: string;
  description: string;
};

const WIDGET_OPTIONS: WidgetOption[] = [
  {
    type: 'poll',
    icon: 'bar-chart',
    label: 'Poll',
    description: 'Ask your audience to vote',
  },
  {
    type: 'quiz',
    icon: 'help-circle',
    label: 'Quiz',
    description: 'Test your audience knowledge',
  },
  {
    type: 'slider',
    icon: 'options',
    label: 'Slider',
    description: 'Get a rating from your audience',
  },
  {
    type: 'question',
    icon: 'chatbubble',
    label: 'Question',
    description: 'Get questions from your audience',
  },
  {
    type: 'countdown',
    icon: 'time',
    label: 'Countdown',
    description: 'Add a countdown timer',
  },
  {
    type: 'mention',
    icon: 'at',
    label: 'Mention',
    description: 'Mention someone',
  },
  {
    type: 'hashtag',
    icon: 'pricetag',
    label: 'Hashtag',
    description: 'Add a hashtag',
  },
];

const WIDGET_THEMES = ['neon', 'pastel', 'dark', 'minimal'] as const;

export function WidgetTool({ onClose }: WidgetToolProps) {
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [theme, setTheme] = useState<'neon' | 'pastel' | 'dark' | 'minimal'>('neon');
  const [text, setText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [placeholder, setPlaceholder] = useState('');

  const addElement = useEditorStore(state => state.addElement);
  const canvasWidth = useEditorStore(state => state.canvasWidth);
  const canvasHeight = useEditorStore(state => state.canvasHeight);
  const elements = useEditorStore(state => state.elements);

  const addWidget = () => {
    if (!selectedType) return;

    let config: WidgetConfig = {
      theme,
    };

    // Configure based on widget type
    switch (selectedType) {
      case 'poll':
      case 'quiz':
        config.text = text || 'Your question here';
        config.options = options.filter(o => o.trim() !== '');
        if (selectedType === 'quiz') {
          config.correctIndex = correctIndex;
        }
        break;
      case 'slider':
        config.text = text || 'Rate this!';
        config.emojis = ['😢', '😐', '😊'];
        config.max = 10;
        break;
      case 'question':
        config.placeholder = placeholder || 'Ask me anything';
        break;
      case 'countdown':
        config.text = text || 'New Year 2027';
        break;
      case 'mention':
      case 'hashtag':
        config.text = text || '';
        break;
    }

    // Add widget to canvas
    addElement({
      id: `widget-${Date.now()}`,
      type: 'widget',
      widgetType: selectedType,
      config,
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      width: 300,
      height: 200,
      rotation: 0,
      scale: 1,
      zIndex: elements.length,
      opacity: 1,
      locked: false,
    });

    onClose();
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const renderWidgetOptions = () => {
    if (!selectedType) return null;

    switch (selectedType) {
      case 'poll':
      case 'quiz':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Question</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your question"
                placeholderTextColor="#666666"
                value={text}
                onChangeText={setText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Options</Text>
              {options.map((option, index) => (
                <View key={index} style={styles.optionRow}>
                  <TextInput
                    style={[styles.input, styles.optionInput]}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor="#666666"
                    value={option}
                    onChangeText={(value) => updateOption(index, value)}
                  />
                  {selectedType === 'quiz' && (
                    <TouchableOpacity
                      style={[
                        styles.correctButton,
                        correctIndex === index && styles.correctButtonActive,
                      ]}
                      onPress={() => setCorrectIndex(index)}
                    >
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={correctIndex === index ? '#FFFFFF' : '#666666'}
                      />
                    </TouchableOpacity>
                  )}
                  {options.length > 2 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeOption(index)}
                    >
                      <Ionicons name="close" size={20} color="#FF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {options.length < 4 && (
                <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
                  <Ionicons name="add" size={20} color="#4DD0E1" />
                  <Text style={styles.addOptionText}>Add option</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        );

      case 'slider':
        return (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Slider Text</Text>
            <TextInput
              style={styles.input}
              placeholder="What are they rating?"
              placeholderTextColor="#666666"
              value={text}
              onChangeText={setText}
            />
          </View>
        );

      case 'question':
        return (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Placeholder Text</Text>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything"
              placeholderTextColor="#666666"
              value={placeholder}
              onChangeText={setPlaceholder}
            />
          </View>
        );

      case 'countdown':
        return (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Name</Text>
            <TextInput
              style={styles.input}
              placeholder="What are you counting down to?"
              placeholderTextColor="#666666"
              value={text}
              onChangeText={setText}
            />
          </View>
        );

      case 'mention':
        return (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="username"
              placeholderTextColor="#666666"
              value={text}
              onChangeText={setText}
              autoCapitalize="none"
            />
          </View>
        );

      case 'hashtag':
        return (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hashtag</Text>
            <TextInput
              style={styles.input}
              placeholder="hashtag"
              placeholderTextColor="#666666"
              value={text}
              onChangeText={setText}
              autoCapitalize="none"
            />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Widget</Text>
        <TouchableOpacity
          onPress={addWidget}
          disabled={!selectedType}
          style={styles.addButton}
        >
          <Text
            style={[
              styles.addText,
              !selectedType && styles.addTextDisabled,
            ]}
          >
            Add
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Widget Type Selection */}
        {!selectedType ? (
          <>
            <Text style={styles.sectionTitle}>Choose a Widget</Text>
            <View style={styles.widgetGrid}>
              {WIDGET_OPTIONS.map((widget) => (
                <TouchableOpacity
                  key={widget.type}
                  style={styles.widgetCard}
                  onPress={() => setSelectedType(widget.type)}
                >
                  <View style={styles.widgetIcon}>
                    <Ionicons name={widget.icon as any} size={32} color="#4DD0E1" />
                  </View>
                  <Text style={styles.widgetLabel}>{widget.label}</Text>
                  <Text style={styles.widgetDescription}>{widget.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Back button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedType(null)}
            >
              <Ionicons name="arrow-back" size={24} color="#4DD0E1" />
              <Text style={styles.backText}>Choose another widget</Text>
            </TouchableOpacity>

            {/* Selected widget title */}
            <View style={styles.selectedWidget}>
              <Ionicons
                name={WIDGET_OPTIONS.find(w => w.type === selectedType)?.icon as any}
                size={40}
                color="#EC4899"
              />
              <Text style={styles.selectedWidgetText}>
                {WIDGET_OPTIONS.find(w => w.type === selectedType)?.label}
              </Text>
            </View>

            {/* Theme Selection */}
            <View style={styles.themeSection}>
              <Text style={styles.label}>Theme</Text>
              <View style={styles.themeRow}>
                {WIDGET_THEMES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.themeButton,
                      theme === t && styles.themeButtonActive,
                      { backgroundColor: getThemeColor(t) },
                    ]}
                    onPress={() => setTheme(t)}
                  >
                    <Text style={styles.themeText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Widget-specific options */}
            {renderWidgetOptions()}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function getThemeColor(theme: string): string {
  switch (theme) {
    case 'neon':
      return '#EC4899';
    case 'pastel':
      return '#FFB6D9';
    case 'dark':
      return '#1A1A1A';
    case 'minimal':
      return '#FFFFFF';
    default:
      return '#EC4899';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    padding: 8,
  },
  addText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EC4899',
  },
  addTextDisabled: {
    color: '#666666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  widgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  widgetCard: {
    width: '48%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  widgetIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(77,208,225,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  widgetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  widgetDescription: {
    fontSize: 12,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    fontSize: 14,
    color: '#4DD0E1',
    marginLeft: 8,
  },
  selectedWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  selectedWidgetText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 16,
  },
  themeSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  themeButtonActive: {
    borderWidth: 2,
    borderColor: '#4DD0E1',
  },
  themeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  inputGroup: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
  },
  correctButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#666666',
  },
  correctButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,68,68,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4DD0E1',
    marginTop: 8,
  },
  addOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4DD0E1',
    marginLeft: 8,
  },
});
