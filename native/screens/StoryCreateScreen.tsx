import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function StoryCreateScreen() {
  const navigation = useNavigation();
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="close" size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.title}>New Story</Text>
        <TouchableOpacity disabled={!image}><Text style={styles.post}>Post</Text></TouchableOpacity>
      </View>
      {image ? <Image source={{ uri: image }} style={styles.preview} /> : (
        <TouchableOpacity style={styles.picker} onPress={pickImage}>
          <Ionicons name="camera" size={64} color="#9ca3af" />
          <Text style={styles.text}>Tap to add photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  post: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  picker: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, color: '#6b7280', marginTop: 16 },
  preview: { flex: 1 },
});
