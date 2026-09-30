import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { storyService } from '../services/story.service';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

export default function StoryViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { userId } = route.params as any;
  
  const [stories, setStories] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likeUnsub, setLikeUnsub] = useState<() => void>();

  useEffect(() => {
    loadUserStories();
  }, [userId]);

  const loadUserStories = async () => {
    try {
      setLoading(true);
      const userStories = await storyService.getUserActiveStories(userId);
      console.log('📖 Loaded stories:', userStories.length);
      setStories(userStories || []);
      
      // Mark stories as viewed
      if (userStories && userStories.length > 0 && user) {
        for (const story of userStories) {
          await storyService.viewStory(story.storyId, user.userId);
        }
        // Preload liked state for current story
        try {
          const likes = await storyService.getStoryLikes(userStories[0].storyId);
          setLiked(likes.includes(user.userId));
          try { likeUnsub && likeUnsub(); } catch {}
          const unsub = storyService.listenUserLike(userStories[0].storyId, user.userId, (v) => setLiked(v));
          setLikeUnsub(() => unsub);
        } catch {}
      }
    } catch (error) {
      console.error('Failed to load stories:', error);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-subscribe when currentIndex changes
  useEffect(() => {
    if (!user || stories.length === 0) return;
    const story = stories[currentIndex];
    if (!story) return;
    try { likeUnsub && likeUnsub(); } catch {}
    try {
      const unsub = storyService.listenUserLike(story.storyId, user.userId, (v) => setLiked(v));
      setLikeUnsub(() => unsub);
    } catch {}
  }, [currentIndex, stories, user]);

  useEffect(() => {
    return () => {
      try { likeUnsub && likeUnsub(); } catch {}
    };
  }, [likeUnsub]);

  const handleToggleLike = async () => {
    if (!user || stories.length === 0 || likeBusy) return;
    setLikeBusy(true);
    const current = stories[currentIndex];
    const wasLiked = liked;
    setLiked(!liked);
    try {
      if (wasLiked) {
        await storyService.unlikeStory(current.storyId, user.userId);
      } else {
        await storyService.likeStory(current.storyId, user.userId);
      }
    } catch (e) {
      setLiked(wasLiked);
    } finally {
      setLikeBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (stories.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.noStoriesText}>No active stories</Text>
        <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  const currentStory = stories[currentIndex];

  return (
    <View style={styles.container}>
      <Image source={{ uri: currentStory?.mediaURL }} style={styles.story} />
      <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>
      {/* Like button */}
      <TouchableOpacity style={styles.like} onPress={handleToggleLike} disabled={likeBusy}>
        <Ionicons name={liked ? 'heart' : 'heart-outline'} size={28} color={liked ? '#ef4444' : '#fff'} />
      </TouchableOpacity>
      
      {/* Story progress indicators */}
      <View style={styles.progressContainer}>
        {stories.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressBar,
              { backgroundColor: index <= currentIndex ? '#fff' : 'rgba(255,255,255,0.3)' }
            ]}
          />
        ))}
      </View>
      
      {/* Story header */}
      <View style={styles.header}>
        <Image source={{ uri: currentStory?.authorAvatarURL }} style={styles.avatar} />
        <Text style={styles.username}>{currentStory?.authorUsername}</Text>
        <Text style={styles.time}>{formatTime(currentStory?.createdAt)}</Text>
      </View>
    </View>
  );
}

const formatTime = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) return 'now';
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  story: { width, height },
  close: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  like: { position: 'absolute', top: 50, right: 60, zIndex: 10 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  noStoriesText: { color: '#fff', fontSize: 18, textAlign: 'center' },
  progressContainer: { 
    position: 'absolute', 
    top: 60, 
    left: 20, 
    right: 20, 
    flexDirection: 'row', 
    gap: 4 
  },
  progressBar: { 
    flex: 1, 
    height: 3, 
    borderRadius: 2 
  },
  header: { 
    position: 'absolute', 
    top: 80, 
    left: 20, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  avatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    marginRight: 8, 
    borderWidth: 2, 
    borderColor: '#fff' 
  },
  username: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#fff', 
    marginRight: 8 
  },
  time: { 
    fontSize: 12, 
    color: '#d1d5db' 
  },
});
