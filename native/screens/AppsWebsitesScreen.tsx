import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function AppsWebsitesScreen() {
  const navigation = useNavigation();
  const apps = [
    { id: '1', name: 'Photo Editor Pro', permissions: 'Photos, Camera', connectedDate: '2 months ago' },
    { id: '2', name: 'Analytics Dashboard', permissions: 'Profile info', connectedDate: '3 weeks ago' },
  ];

  const handleRevoke = (appName: string) => {
    Alert.alert('Revoke Access', `Remove access for ${appName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive' },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Apps and Websites</Text>
        <View style={{ width: 28 }} />
      </View>
      <FlatList
        data={apps}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.iconBox}>
              <Ionicons name="apps" size={24} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.permissions}>{item.permissions}</Text>
              <Text style={styles.date}>Connected {item.connectedDate}</Text>
            </View>
            <TouchableOpacity onPress={() => handleRevoke(item.name)}>
              <Text style={styles.revoke}>Revoke</Text>
            </TouchableOpacity>
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
  name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  permissions: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
  date: { fontSize: 13, color: '#9ca3af' },
  revoke: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
});
