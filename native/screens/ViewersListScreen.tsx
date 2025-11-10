import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function ViewersListScreen() {
  const navigation = useNavigation();
  const viewers = [
    { id: '1', name: 'John', avatar: 'https://via.placeholder.com/50', time: '2h ago' },
    { id: '2', name: 'Jane', avatar: 'https://via.placeholder.com/50', time: '5h ago' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Viewers</Text>
        <View style={{ width: 28 }} />
      </View>
      <FlatList
        data={viewers}
        renderItem={({ item }) => (
          <View style={styles.viewer}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
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
  viewer: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '600' },
  time: { fontSize: 13, color: '#6b7280', marginTop: 2 },
});
