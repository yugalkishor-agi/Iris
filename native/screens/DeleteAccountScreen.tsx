import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function DeleteAccountScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Call delete service
              Alert.alert('Deleted', 'Your account has been deleted');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Delete Account</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.danger}>
          <Ionicons name="trash-bin" size={48} color="#ef4444" />
          <Text style={styles.dangerTitle}>Permanent Deletion</Text>
          <Text style={styles.dangerText}>
            This action is PERMANENT and cannot be undone:{'\n\n'}
            • All your posts will be deleted{'\n'}
            • All your messages will be deleted{'\n'}
            • Your profile will be removed{'\n'}
            • You cannot recover your account
          </Text>
        </View>
        <Text style={styles.label}>Enter your password to confirm</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" />
        <TouchableOpacity style={styles.btn} onPress={handleDelete} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Deleting...' : 'Delete Account Forever'}</Text>
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
  danger: { backgroundColor: '#fee2e2', padding: 24, borderRadius: 12, alignItems: 'center' },
  dangerTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8, color: '#ef4444' },
  dangerText: { fontSize: 14, color: '#7f1d1d', textAlign: 'center', lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 15 },
  btn: { backgroundColor: '#ef4444', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
