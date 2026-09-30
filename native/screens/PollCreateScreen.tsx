import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function PollCreateScreen() {
  const navigation = useNavigation();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState('1 day');

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  const handlePost = () => {
    if (!question || options.some(o => !o.trim())) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    Alert.alert('Posted', 'Poll created successfully!');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Poll</Text>
        <TouchableOpacity onPress={handlePost}>
          <Text style={styles.post}>Post</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content as any}>
        <Text style={styles.label}>Question</Text>
        <TextInput
          style={styles.input}
          placeholder="Ask a question..."
          value={question}
          onChangeText={setQuestion}
          multiline
        />
        <Text style={styles.label}>Options</Text>
        {options.map((opt, i) => (
          <TextInput
            key={i}
            style={styles.input}
            placeholder={`Option ${i + 1}`}
            value={opt}
            onChangeText={(text) => {
              const newOptions = [...options];
              newOptions[i] = text;
              setOptions(newOptions);
            }}
          />
        ))}
        {options.length < 4 && (
          <TouchableOpacity style={styles.addBtn} onPress={addOption}>
            <Ionicons name="add" size={20} color="#3b82f6" />
            <Text style={styles.addText}>Add Option</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.label}>Poll Duration</Text>
        <View style={styles.durationBtns}>
          {['1 day', '3 days', '7 days'].map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.durationBtn, duration === d && styles.durationBtnActive]}
              onPress={() => setDuration(d)}
            >
              <Text style={[styles.durationText, duration === d && styles.durationTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  post: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderWidth: 1, borderColor: '#3b82f6', borderRadius: 8, borderStyle: 'dashed' },
  addText: { fontSize: 15, fontWeight: '600', color: '#3b82f6' },
  durationBtns: { flexDirection: 'row', gap: 8 },
  durationBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  durationBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  durationText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  durationTextActive: { color: '#fff' },
});
