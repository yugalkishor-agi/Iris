import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function FiltersScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState('normal');
  const filters = ['Normal', 'Vivid', 'B&W', 'Sepia', 'Vintage', 'Cool'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.title}>Filters</Text>
        <TouchableOpacity><Text style={styles.apply}>Apply</Text></TouchableOpacity>
      </View>
      <Image source={{ uri: 'https://via.placeholder.com/400' }} style={styles.preview} />
      <ScrollView horizontal style={styles.filters}>
        {filters.map(f => (
          <TouchableOpacity key={f} style={styles.filter} onPress={() => setSelected(f.toLowerCase())}>
            <View style={styles.filterPreview} />
            <Text style={styles.filterName}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  apply: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  preview: { width: '100%', height: 400 },
  filters: { padding: 16 },
  filter: { alignItems: 'center', marginRight: 16 },
  filterPreview: { width: 80, height: 80, backgroundColor: '#f3f4f6', borderRadius: 8, marginBottom: 8 },
  filterName: { fontSize: 12, color: '#6b7280' },
});
