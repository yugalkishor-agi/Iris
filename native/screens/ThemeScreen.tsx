import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function ThemeScreen() {
  const navigation = useNavigation();
  const [theme, setTheme] = useState('light');

  const themes = [
    { id: 'light', name: 'Light', icon: 'sunny' },
    { id: 'dark', name: 'Dark', icon: 'moon' },
    { id: 'auto', name: 'System Default', icon: 'phone-portrait' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Theme</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.content}>
        {themes.map(t => (
          <TouchableOpacity
            key={t.id}
            style={styles.option}
            onPress={() => setTheme(t.id)}
          >
            <View style={styles.optionLeft}>
              <Ionicons name={t.icon as any} size={24} color="#3b82f6" />
              <Text style={styles.optionText}>{t.name}</Text>
            </View>
            {theme === t.id && <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />}
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
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 8, marginBottom: 8, backgroundColor: '#f9fafb' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionText: { fontSize: 16, fontWeight: '500' },
});
