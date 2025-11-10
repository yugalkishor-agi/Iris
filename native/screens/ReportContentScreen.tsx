import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function ReportContentScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState('');
  
  const reasons = [
    'Spam',
    'Harassment or bullying',
    'Hate speech',
    'Violence or dangerous content',
    'False information',
    'Sexual content',
    'Scam or fraud',
    'Intellectual property violation',
  ];

  const handleReport = () => {
    if (!selected) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }
    Alert.alert('Reported', 'Thank you for your report. We will review it shortly.');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Report</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.question}>Why are you reporting this?</Text>
        {reasons.map((reason) => (
          <TouchableOpacity
            key={reason}
            style={[styles.option, selected === reason && styles.optionSelected]}
            onPress={() => setSelected(reason)}
          >
            <Text style={styles.optionText}>{reason}</Text>
            {selected === reason && <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleReport}>
          <Text style={styles.submitText}>Submit Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  question: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 8 },
  optionSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  optionText: { fontSize: 15 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  submitBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 8, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
