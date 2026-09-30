import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { storyService } from '../services/story.service';
import { mediaService } from '../services/media.service.native';
import { Image } from 'expo-image';

export default function StoryCreateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { imageUri } = route.params as any;
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);

  const handlePublish = async () => {
    if (!user || !imageUri || uploading) return;

    setUploading(true);
    try {
      // Upload to Supabase
      const uploadResult = await mediaService.uploadStoryMedia(user.userId, imageUri);
      
      // Create story with correct object structure (native service uses objects)
      await storyService.createStory({
        authorId: user.userId,
        authorUsername: user.username || 'user',
        authorAvatarURL: user.avatarURL || '',
        mediaURL: uploadResult.mediaURL,
        thumbnailURL: uploadResult.thumbnailURL,
        mediaType: 'image',
        caption: text || '',
        audience: 'followers',
      });

      // Show success and navigate
      Alert.alert('Success', 'Story published!', [
        { text: 'OK', onPress: () => navigation.navigate('Home' as never) }
      ]);
    } catch (error) {
      console.error('Failed to publish story:', error);
      Alert.alert('Error', 'Failed to publish story. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.publishButton}
            onPress={handlePublish}
            disabled={uploading}
          >
            {uploading ? (
              <InlineLoadingSkeleton />
            ) : (
              <Text style={styles.publishText}>Publish</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.textContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Add text..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={100}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  publishButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  publishText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: '#fff',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  textInput: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold as any,
    color: '#fff',
    textAlign: 'center',
  },
});



