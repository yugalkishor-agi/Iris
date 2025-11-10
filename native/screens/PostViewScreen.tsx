import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/post.service';

const { width } = Dimensions.get('window');

export default function PostViewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const postId = (route.params as any)?.postId;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const data = await postService.getPost(postId);
      setPost(data);
      setLiked(data.likedBy?.includes(user?.userId));
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    setLiked(!liked);
    if (liked) {
      await postService.unlikePost(postId, user.userId);
    } else {
      await postService.likePost(postId, user.userId);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Post</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView>
        <TouchableOpacity style={styles.author} onPress={() => navigation.navigate('Profile' as never, { userId: post.authorId } as never)}>
          <Image source={{ uri: post?.authorAvatarURL }} style={styles.avatar} />
          <View>
            <Text style={styles.name}>{post?.authorUsername}</Text>
            <Text style={styles.time}>{post?.createdAt}</Text>
          </View>
        </TouchableOpacity>
        <Image source={{ uri: post?.mediaURLs?.[0] }} style={styles.media} />
        <View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={handleLike}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={28} color={liked ? '#ef4444' : '#000'} />
            <Text style={styles.count}>{post?.likesCount || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('Comments' as never, { postId } as never)}>
            <Ionicons name="chatbubble-outline" size={26} color="#000" />
            <Text style={styles.count}>{post?.commentsCount || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action}>
            <Ionicons name="paper-plane-outline" size={26} color="#000" />
          </TouchableOpacity>
        </View>
        {post?.caption && <Text style={styles.caption}>{post.caption}</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  author: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  name: { fontSize: 15, fontWeight: '600' },
  time: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  media: { width, height: width, backgroundColor: '#f3f4f6' },
  actions: { flexDirection: 'row', padding: 16, gap: 20 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  count: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 15, paddingHorizontal: 16, paddingBottom: 16, lineHeight: 22 },
});
