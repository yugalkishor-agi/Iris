import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function ReportProblemScreen() {
  const navigation = useNavigation();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['Bug', 'Feature Request', 'Content Issue', 'Account Problem', 'Other'];

  const handleSubmit = async () => {
    if (!category || !description) {
      Alert.alert('Error', 'Please select a category and describe the problem');
      return;
    }
    setLoading(true);
    try {
      // Call report service
      Alert.alert('Submitted', 'Thank you! We will look into this issue.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Report a Problem</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.label}>Category</Text>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.option, category === cat && styles.optionSelected]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.optionText, category === cat && styles.optionTextSelected]}>{cat}</Text>
            {category === cat && <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />}
          </TouchableOpacity>
        ))}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the problem..."
          multiline
          numberOfLines={6}
        />
        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Submitting...' : 'Submit Report'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 16 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 8 },
  optionSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  optionText: { fontSize: 15, color: '#374151' },
  optionTextSelected: { color: '#3b82f6', fontWeight: '600' },
  textArea: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 15, minHeight: 120, textAlignVertical: 'top' },
  btn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
