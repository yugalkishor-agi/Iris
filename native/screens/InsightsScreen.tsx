import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function InsightsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Insights</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Accounts Reached</Text>
          <Text style={styles.bigNumber}>2,345</Text>
          <Text style={styles.change}>+12.5% from last week</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Content Interactions</Text>
          <Text style={styles.bigNumber}>892</Text>
          <Text style={styles.change}>+8.2% from last week</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Followers</Text>
          <Text style={styles.bigNumber}>1,245</Text>
          <Text style={styles.change}>+45 this week</Text>
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
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  bigNumber: { fontSize: 32, fontWeight: '700', color: '#000', marginBottom: 4 },
  change: { fontSize: 13, color: '#10b981' },
});
