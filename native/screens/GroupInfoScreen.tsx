import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function GroupInfoScreen() {
  const navigation = useNavigation();
  const members = [
    { id: '1', name: 'John', avatar: 'https://via.placeholder.com/50' },
    { id: '2', name: 'Jane', avatar: 'https://via.placeholder.com/50' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.title}>Group Info</Text>
        <TouchableOpacity><Ionicons name="ellipsis-horizontal" size={24} color="#000" /></TouchableOpacity>
      </View>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          {members.map(m => (
            <View key={m.id} style={styles.member}>
              <Image source={{ uri: m.avatar }} style={styles.avatar} />
              <Text style={styles.name}>{m.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 12 },
  member: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  name: { fontSize: 15, fontWeight: '600' },
});
