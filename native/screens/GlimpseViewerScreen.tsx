import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { glimpseService } from '../services/glimpse.service';

const { width, height } = Dimensions.get('window');

export default function GlimpseViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const glimpseId = (route.params as any)?.glimpseId;
  const [glimpse, setGlimpse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGlimpse();
  }, [glimpseId]);

  const loadGlimpse = async () => {
    setLoading(true);
    try {
      const data = await glimpseService.getGlimpse(glimpseId);
      setGlimpse(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#fff" style={styles.loading} />;

  return (
    <View style={styles.container}>
      <Image source={{ uri: glimpse?.mediaURL }} style={styles.media} />
      <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>
      <View style={styles.header}>
        <Image source={{ uri: glimpse?.authorAvatarURL }} style={styles.avatar} />
        <Text style={styles.username}>{glimpse?.authorUsername}</Text>
        <Text style={styles.time}>{glimpse?.createdAt}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action}>
          <Ionicons name="heart-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.action}>
          <Ionicons name="chatbubble-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.action}>
          <Ionicons name="paper-plane-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loading: { flex: 1 },
  media: { width, height, resizeMode: 'cover' },
  close: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  header: { position: 'absolute', top: 50, left: 20, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, borderWidth: 2, borderColor: '#fff' },
  username: { fontSize: 14, fontWeight: '600', color: '#fff', marginRight: 8 },
  time: { fontSize: 12, color: '#d1d5db' },
  actions: { position: 'absolute', right: 20, bottom: 100, gap: 20 },
  action: { alignItems: 'center' },
});
