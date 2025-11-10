import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  const leaders = [
    { id: '1', rank: 1, name: 'John', avatar: 'https://via.placeholder.com/50', points: 9850 },
    { id: '2', rank: 2, name: 'Jane', avatar: 'https://via.placeholder.com/50', points: 8920 },
    { id: '3', rank: 3, name: 'Mike', avatar: 'https://via.placeholder.com/50', points: 7650 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={{ width: 28 }} />
      </View>
      <FlatList
        data={leaders}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.rank}>#{item.rank}</Text>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.points}>{item.points}</Text>
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
  rank: { fontSize: 18, fontWeight: '700', color: '#3b82f6', width: 40 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  name: { flex: 1, fontSize: 16, fontWeight: '600' },
  points: { fontSize: 16, fontWeight: '600', color: '#10b981' },
});
