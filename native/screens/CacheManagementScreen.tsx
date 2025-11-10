import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function CacheManagementScreen() {
  const navigation = useNavigation();

  const handleClearCache = (type: string) => {
    Alert.alert('Clear Cache', `Clear ${type} cache?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: () => Alert.alert('Cleared', `${type} cache has been cleared`),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Cache Management</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Ionicons name="image" size={32} color="#3b82f6" />
          <Text style={styles.cardTitle}>Image Cache</Text>
          <Text style={styles.cardSize}>450 MB</Text>
          <TouchableOpacity style={styles.btn} onPress={() => handleClearCache('Image')}>
            <Text style={styles.btnText}>Clear</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <Ionicons name="videocam" size={32} color="#8b5cf6" />
          <Text style={styles.cardTitle}>Video Cache</Text>
          <Text style={styles.cardSize}>120 MB</Text>
          <TouchableOpacity style={styles.btn} onPress={() => handleClearCache('Video')}>
            <Text style={styles.btnText}>Clear</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <Ionicons name="document" size={32} color="#f59e0b" />
          <Text style={styles.cardTitle}>App Cache</Text>
          <Text style={styles.cardSize}>85 MB</Text>
          <TouchableOpacity style={styles.btn} onPress={() => handleClearCache('App')}>
            <Text style={styles.btnText}>Clear</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.clearAllBtn} onPress={() => handleClearCache('All')}>
          <Text style={styles.clearAllText}>Clear All Cache</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  cardSize: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  btn: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  clearAllBtn: { backgroundColor: '#ef4444', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  clearAllText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
