import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function DownloadDataScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Call download data service
      Alert.alert('Request Submitted', 'We will send you a link to download your data within 48 hours');
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
        <Text style={styles.title}>Download Your Data</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.info}>
          <Ionicons name="download" size={48} color="#3b82f6" />
          <Text style={styles.infoTitle}>Request Your Data</Text>
          <Text style={styles.infoText}>
            You can request a copy of all your data including:{'\n\n'}
            • Posts and media{'\n'}
            • Comments and likes{'\n'}
            • Messages{'\n'}
            • Profile information{'\n'}
            • Account activity
          </Text>
        </View>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            📧 We'll email you a download link within 48 hours. The link will be valid for 7 days.
          </Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleDownload} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Requesting...' : 'Request Data Download'}</Text>
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
  info: { backgroundColor: '#eff6ff', padding: 24, borderRadius: 12, alignItems: 'center' },
  infoTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  infoText: { fontSize: 14, color: '#1e3a8a', textAlign: 'center', lineHeight: 22 },
  notice: { backgroundColor: '#fef3c7', padding: 16, borderRadius: 8, marginTop: 16 },
  noticeText: { fontSize: 13, color: '#78716c', lineHeight: 20 },
  btn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
