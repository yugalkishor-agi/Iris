import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function FontSizeScreen() {
  const navigation = useNavigation();
  const [size, setSize] = useState('medium');

  const sizes = [
    { id: 'small', name: 'Small', size: 14 },
    { id: 'medium', name: 'Medium', size: 16 },
    { id: 'large', name: 'Large', size: 18 },
    { id: 'xlarge', name: 'Extra Large', size: 20 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Font Size</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.preview}>
          <Text style={{ fontSize: sizes.find(s => s.id === size)?.size || 16 }}>
            This is how your text will look
          </Text>
        </View>
        {sizes.map(s => (
          <TouchableOpacity
            key={s.id}
            style={styles.option}
            onPress={() => setSize(s.id)}
          >
            <Text style={[styles.optionText, { fontSize: s.size }]}>{s.name}</Text>
            {size === s.id && <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  content: { padding: 16 },
  preview: { padding: 24, backgroundColor: '#f9fafb', borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 8, marginBottom: 8, backgroundColor: '#f9fafb' },
  optionText: { fontWeight: '500' },
});
