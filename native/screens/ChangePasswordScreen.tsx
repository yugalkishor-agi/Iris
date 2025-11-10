import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!current || !newPass || !confirm) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (newPass !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPass.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      // Call password change service
      Alert.alert('Success', 'Password changed successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
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
        <Text style={styles.title}>Change Password</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Current Password</Text>
        <TextInput style={styles.input} value={current} onChangeText={setCurrent} secureTextEntry />
        <Text style={styles.label}>New Password</Text>
        <TextInput style={styles.input} value={newPass} onChangeText={setNewPass} secureTextEntry />
        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry />
        <TouchableOpacity style={styles.btn} onPress={handleChange} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Changing...' : 'Change Password'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 15 },
  btn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
