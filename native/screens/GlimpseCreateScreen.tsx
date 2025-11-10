import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { glimpseService } from '../services/glimpse.service';

export default function GlimpseCreateScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [media, setMedia] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setMedia(result.assets[0].uri);
  };

  const handlePost = async () => {
    if (!media || !user) return;
    setUploading(true);
    try {
      await glimpseService.createGlimpse(user.userId, media, {});
      Alert.alert('Posted', 'Your glimpse has been shared!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to post glimpse');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>New Glimpse</Text>
        <TouchableOpacity onPress={handlePost} disabled={!media || uploading}>
          <Text style={[styles.post, (!media || uploading) && styles.postDisabled]}>
            {uploading ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>
      {media ? (
        <View style={styles.preview}>
          <Image source={{ uri: media }} style={styles.media} />
          <TouchableOpacity style={styles.change} onPress={pickMedia}>
            <Ionicons name="images" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.picker} onPress={pickMedia}>
          <Ionicons name="camera" size={64} color="#9ca3af" />
          <Text style={styles.pickerText}>Tap to select media</Text>
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
  postDisabled: { color: '#9ca3af' },
  picker: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pickerText: { fontSize: 16, color: '#6b7280', marginTop: 16 },
  preview: { flex: 1, position: 'relative' },
  media: { width: '100%', height: '100%', resizeMode: 'cover' },
  change: { position: 'absolute', bottom: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.7)', padding: 12, borderRadius: 30 },
});
