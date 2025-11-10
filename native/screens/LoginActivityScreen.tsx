import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/view-icons';

export default function LoginActivityScreen() {
  const navigation = useNavigation();
  const activities = [
    { id: '1', device: 'iPhone 13', location: 'New York, US', time: 'Active now', current: true },
    { id: '2', device: 'Chrome on Windows', location: 'New York, US', time: '2 hours ago', current: false },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Login Activity</Text>
        <View style={{ width: 28 }} />
      </View>
      <FlatList
        data={activities}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.iconBox}>
              <Ionicons name={item.device.includes('iPhone') ? 'phone-portrait' : 'desktop'} size={24} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Text style={styles.device}>{item.device}</Text>
                {item.current && <Text style={styles.badge}>Current</Text>}
              </View>
              <Text style={styles.location}>{item.location}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  iconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  device: { fontSize: 16, fontWeight: '600' },
  badge: { backgroundColor: '#10b981', color: '#fff', fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  location: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
  time: { fontSize: 13, color: '#9ca3af' },
});
