import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

export default function RecentSearchesScreen() {
  const navigation = useNavigation();
  const searches = [
    { id: '1', query: 'photography', type: 'hashtag' },
    { id: '2', query: 'john_doe', type: 'user' },
    { id: '3', query: 'travel tips', type: 'text' },
  ];

  const handleClearAll = () => {
    Alert.alert('Clear All', 'Clear all recent searches?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', onPress: () => console.log('Cleared') },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Recent Searches</Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={styles.clear}>Clear All</Text>
        </TouchableOpacity>
      </View>
      <FlashList estimatedItemSize={100}
        data={searches}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.left}>
              <Ionicons
                name={item.type === 'hashtag' ? 'pricetag' : item.type === 'user' ? 'person' : 'search'}
                size={20}
                color="#6b7280"
              />
              <Text style={styles.query}>{item.query}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="close" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No recent searches</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  clear: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  query: { fontSize: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 60 },
  emptyText: { fontSize: 16, color: '#9ca3af', marginTop: 16 },
});
