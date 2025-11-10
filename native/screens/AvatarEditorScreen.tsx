import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';

export default function AvatarEditorScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [image, setImage] = useState(user?.avatarURL || '');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    Alert.alert('Saved', 'Profile picture updated successfully!');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Change Profile Photo</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.save}>Save</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Image source={{ uri: image }} style={styles.avatar} />
        <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
          <Text style={styles.changeBtnText}>Choose Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>Remove Current Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  save: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  content: { flex: 1, alignItems: 'center', paddingTop: 40 },
  avatar: { width: 150, height: 150, borderRadius: 75, marginBottom: 32 },
  changeBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, marginBottom: 12 },
  changeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  removeBtn: { paddingVertical: 12 },
  removeBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
