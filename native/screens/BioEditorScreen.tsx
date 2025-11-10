import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function BioEditorScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const maxLength = 150;

  const handleSave = () => {
    Alert.alert('Saved', 'Bio updated successfully!');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Bio</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.save}>Save</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Write something about yourself..."
          placeholderTextColor="#9ca3af"
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={maxLength}
          autoFocus
        />
        <Text style={styles.counter}>
          {bio.length}/{maxLength}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  save: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  content: { flex: 1, padding: 16 },
  input: { flex: 1, fontSize: 16, textAlignVertical: 'top' },
  counter: { fontSize: 14, color: '#6b7280', textAlign: 'right', marginTop: 8 },
});
