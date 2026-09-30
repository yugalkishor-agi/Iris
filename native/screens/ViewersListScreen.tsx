import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { storyService } from '../services/story.service';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

export default function ViewersListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { storyId } = route.params as any;
  const [viewers, setViewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadViewers();
  }, [storyId]);

  const loadViewers = async () => {
    try {
      setLoading(true);
      const storyViewers = await storyService.getStoryViews(storyId);
      console.log('👀 Loaded viewers:', storyViewers.length);
      setViewers(storyViewers || []);
    } catch (error) {
      console.error('Failed to load viewers:', error);
      setViewers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Viewers</Text>
        <View style={{ width: 28 }} />
      </View>
      <FlashList estimatedItemSize={100}
        data={viewers}
        renderItem={({ item }) => (
          <View style={styles.viewer}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  viewer: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '600' },
  time: { fontSize: 13, color: '#6b7280', marginTop: 2 },
});
