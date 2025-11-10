import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function StorageUsageScreen() {
  const navigation = useNavigation();
  const totalUsed = 2.3;
  const totalAvailable = 5.0;
  const percentage = (totalUsed / totalAvailable) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Storage Usage</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Storage</Text>
          <Text style={styles.bigNumber}>{totalUsed} GB</Text>
          <Text style={styles.subtitle}>of {totalAvailable} GB used</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${percentage}%` }]} />
          </View>
        </View>
        <View style={styles.breakdown}>
          <Text style={styles.sectionTitle}>Breakdown</Text>
          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Ionicons name="image" size={24} color="#3b82f6" />
              <Text style={styles.itemName}>Photos</Text>
            </View>
            <Text style={styles.itemSize}>1.5 GB</Text>
          </View>
          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Ionicons name="videocam" size={24} color="#8b5cf6" />
              <Text style={styles.itemName}>Videos</Text>
            </View>
            <Text style={styles.itemSize}>650 MB</Text>
          </View>
          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Ionicons name="document" size={24} color="#f59e0b" />
              <Text style={styles.itemName}>Cache</Text>
            </View>
            <Text style={styles.itemSize}>150 MB</Text>
          </View>
        </View>
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
  cardTitle: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  bigNumber: { fontSize: 48, fontWeight: '700', color: '#3b82f6' },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  progressBar: { width: '100%', height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6' },
  breakdown: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemName: { fontSize: 15, fontWeight: '500' },
  itemSize: { fontSize: 15, color: '#6b7280' },
});
