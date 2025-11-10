import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function TagPrivacyScreen() {
  const navigation = useNavigation();
  const [setting, setSetting] = useState('everyone');

  const options = [
    { id: 'everyone', label: 'Everyone' },
    { id: 'following', label: 'People You Follow' },
    { id: 'nobody', label: 'No One' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Who Can Tag You</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.description}>
          Choose who can tag you in photos, videos, and posts
        </Text>
        {options.map(option => (
          <TouchableOpacity
            key={option.id}
            style={styles.option}
            onPress={() => setSetting(option.id)}
          >
            <Text style={styles.optionText}>{option.label}</Text>
            {setting === option.id && <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />}
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
  description: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 8 },
  optionText: { fontSize: 16, fontWeight: '500' },
});
