import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function AchievementsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content as any}>
        <View style={styles.card}>
          <Ionicons name="trophy" size={48} color="#f59e0b" />
          <Text style={styles.cardTitle}>100 Posts</Text>
          <Text style={styles.cardDesc}>Create 100 posts</Text>
          <View style={styles.progress}>
            <View style={[styles.progressBar, { width: '75%' }]} />
          </View>
          <Text style={styles.progressText}>75/100</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="people" size={48} color="#3b82f6" />
          <Text style={styles.cardTitle}>1K Followers</Text>
          <Text style={styles.cardDesc}>Reach 1000 followers</Text>
          <View style={styles.progress}>
            <View style={[styles.progressBar, { width: '50%' }]} />
          </View>
          <Text style={styles.progressText}>500/1000</Text>
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
  cardTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  cardDesc: { fontSize: 14, color: '#6b7280', marginTop: 4, marginBottom: 16 },
  progress: { width: '100%', height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#3b82f6' },
  progressText: { fontSize: 13, color: '#6b7280', marginTop: 8 },
});
