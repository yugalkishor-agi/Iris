import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function WebsiteEditorScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [website, setWebsite] = useState(user?.website || '');

  const handleSave = () => {
    if (website && !website.startsWith('http')) {
      Alert.alert('Error', 'Please enter a valid URL starting with http:// or https://');
      return;
    }
    Alert.alert('Saved', 'Website updated successfully!');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Website</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.save}>Save</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>Website URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.com"
          placeholderTextColor="#9ca3af"
          value={website}
          onChangeText={setWebsite}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
        <Text style={styles.hint}>
          Add a link to your website, blog, or portfolio
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
  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 },
  hint: { fontSize: 13, color: '#6b7280', marginTop: 8 },
});
