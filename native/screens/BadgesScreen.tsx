import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export default function BadgesScreen() {
  const navigation = useNavigation();
  const badges = [
    { id: '1', name: 'Early Adopter', icon: 'star', color: '#f59e0b', earned: true },
    { id: '2', name: 'Verified', icon: 'checkmark-circle', color: '#3b82f6', earned: true },
    { id: '3', name: 'Top Creator', icon: 'trophy', color: '#ef4444', earned: false },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Badges</Text>
        <View style={{ width: 28 }} />
      </View>
      <FlatList
        data={badges}
        renderItem={({ item }) => (
          <View style={[styles.badge, !item.earned && styles.badgeLocked]}>
            <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={32} color={item.earned ? item.color : '#d1d5db'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.status}>{item.earned ? 'Earned' : 'Locked'}</Text>
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
  badge: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  badgeLocked: { opacity: 0.5 },
  iconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  status: { fontSize: 14, color: '#6b7280' },
});
