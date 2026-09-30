import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function InterestsScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState<string[]>(['Photography', 'Travel']);
  
  const interests = [
    'Photography', 'Travel', 'Food', 'Fitness', 'Art', 'Music',
    'Fashion', 'Technology', 'Gaming', 'Sports', 'Nature', 'Books'
  ];

  const toggleInterest = (interest: string) => {
    setSelected(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Interests</Text>
        <TouchableOpacity>
          <Text style={styles.save}>Save</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content as any}>
        <Text style={styles.description}>
          Select topics you're interested in to see more personalized content
        </Text>
        <View style={styles.grid}>
          {interests.map(interest => (
            <TouchableOpacity
              key={interest}
              style={[styles.chip, selected.includes(interest) && styles.chipSelected]}
              onPress={() => toggleInterest(interest)}
            >
              <Text style={[styles.chipText, selected.includes(interest) && styles.chipTextSelected]}>
                {interest}
              </Text>
            </TouchableOpacity>
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
  save: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  content: { padding: 16 },
  description: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  chipSelected: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  chipTextSelected: { color: '#fff' },
});
