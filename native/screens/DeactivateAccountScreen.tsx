import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function DeactivateAccountScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Account',
      'Are you sure you want to deactivate your account? You can reactivate it anytime by logging back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Call deactivate service
              Alert.alert('Deactivated', 'Your account has been deactivated');
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
        <Text style={styles.title}>Deactivate Account</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.warning}>
          <Ionicons name="warning" size={48} color="#f59e0b" />
          <Text style={styles.warningTitle}>Temporary Deactivation</Text>
          <Text style={styles.warningText}>
            When you deactivate your account:{'\n\n'}
            • Your profile will be hidden{'\n'}
            • People won't be able to find you{'\n'}
            • Your posts will be hidden{'\n'}
            • You can reactivate anytime by logging back in
          </Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleDeactivate} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Deactivating...' : 'Deactivate Account'}</Text>
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
  warning: { backgroundColor: '#fef3c7', padding: 24, borderRadius: 12, alignItems: 'center' },
  warningTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  warningText: { fontSize: 14, color: '#78716c', textAlign: 'center', lineHeight: 22 },
  btn: { backgroundColor: '#f59e0b', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
