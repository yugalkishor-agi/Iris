import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function CaptionEditorScreen() {
  const navigation = useNavigation();
  const [caption, setCaption] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.title}>Add Caption</Text>
        <TouchableOpacity><Text style={styles.done}>Done</Text></TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Write a caption..."
        placeholderTextColor="#9ca3af"
        value={caption}
        onChangeText={setCaption}
        multiline
        autoFocus
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  done: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  input: { flex: 1, padding: 16, fontSize: 16, textAlignVertical: 'top' },
});
