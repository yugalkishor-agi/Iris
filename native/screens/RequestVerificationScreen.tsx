import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function RequestVerificationScreen() {
  const navigation = useNavigation();
  const [category, setCategory] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!category || !reason) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    Alert.alert('Submitted', 'Your verification request has been submitted. We will review it within 7 days.');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Request Verification</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.info}>
          <Ionicons name="checkmark-circle" size={48} color="#3b82f6" />
          <Text style={styles.infoTitle}>Get Verified</Text>
          <Text style={styles.infoText}>
            A verified badge confirms that an account of public interest is authentic.
          </Text>
        </View>
        <Text style={styles.label}>Category</Text>
        <TextInput style={styles.input} placeholder="e.g., Artist, Business, Creator" value={category} onChangeText={setCategory} />
        <Text style={styles.label}>Why do you deserve verification?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell us why your account should be verified..."
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={6}
        />
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit Request</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  content: { padding: 16 },
  info: { alignItems: 'center', padding: 24, backgroundColor: '#eff6ff', borderRadius: 12, marginBottom: 24 },
  infoTitle: { fontSize: 20, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  infoText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 15 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
