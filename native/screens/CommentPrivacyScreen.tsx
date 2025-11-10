import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function CommentPrivacyScreen() {
  const navigation = useNavigation();
  const [setting, setSetting] = useState('everyone');

  const options = [
    { id: 'everyone', label: 'Everyone' },
    { id: 'following', label: 'People You Follow' },
    { id: 'followers', label: 'Your Followers' },
    { id: 'nobody', label: 'No One' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Who Can Comment</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.content}>
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
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 8 },
  optionText: { fontSize: 16, fontWeight: '500' },
});
