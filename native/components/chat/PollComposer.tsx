import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../ui/LoadingSkeleton';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PollComposerProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { question: string; options: string[] }) => Promise<void> | void;
};

const PollComposer: React.FC<PollComposerProps> = ({ visible, onClose, onSubmit }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setQuestion('');
      setOptions(['', '']);
      setSubmitting(false);
    }
  }, [visible]);

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addOption = () => {
    if (options.length >= 4) return;
    setOptions((prev) => [...prev, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    const q = question.trim();
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!q || cleanOptions.length < 2) {
      Alert.alert('Error', 'Enter a question and at least 2 options.');
      return;
    }
    if (cleanOptions.length !== options.length) {
      Alert.alert('Error', 'Please fill all options.');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({ question: q, options: cleanOptions });
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to send poll.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <Ionicons name="close" size={20} color="#e2e8f0" />
            </TouchableOpacity>
            <Text style={styles.title}>Create Poll</Text>
            <View style={styles.iconBtn} />
          </View>

          <ScrollView contentContainerStyle={styles.content as any}>
            <Text style={styles.label}>Question</Text>
            <TextInput
              style={styles.input}
              placeholder="Ask a question..."
              placeholderTextColor="#64748b"
              value={question}
              onChangeText={setQuestion}
              multiline
            />

            <Text style={styles.label}>Options</Text>
            {options.map((opt, idx) => (
              <View key={`opt-${idx}`} style={styles.optionRow}>
                <TextInput
                  style={[styles.input, styles.optionInput]}
                  placeholder={`Option ${idx + 1}`}
                  placeholderTextColor="#64748b"
                  value={opt}
                  onChangeText={(text) => updateOption(idx, text)}
                />
                {options.length > 2 && (
                  <TouchableOpacity onPress={() => removeOption(idx)} style={styles.removeBtn}>
                    <Ionicons name="close-circle" size={18} color="#f97316" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {options.length < 4 && (
              <TouchableOpacity style={styles.addBtn} onPress={addOption}>
                <Ionicons name="add" size={18} color="#38bdf8" />
                <Text style={styles.addText}>Add option</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <InlineLoadingSkeleton />
            ) : (
              <Text style={styles.submitText}>Send Poll</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e2e8f0',
    fontSize: 14,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionInput: {
    flex: 1,
  },
  removeBtn: {
    padding: 6,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  addText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#38bdf8',
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#0b1220',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default PollComposer;

