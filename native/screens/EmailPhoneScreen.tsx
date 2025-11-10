import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function EmailPhoneScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Email & Phone</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email</Text>
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.value}>{user?.email || 'Not set'}</Text>
              <Text style={styles.status}>Verified</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.action}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phone</Text>
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.value}>{user?.phone || 'Not set'}</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.action}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 },
  value: { fontSize: 16, fontWeight: '500', color: '#000', marginBottom: 4 },
  status: { fontSize: 13, color: '#10b981' },
  action: { fontSize: 15, fontWeight: '600', color: '#3b82f6' },
});
