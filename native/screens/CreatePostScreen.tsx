import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { postService } from '../services/post.service';
import { mediaService } from '../services/media.service.native';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Image } from 'expo-image';

export default function CreatePostScreen() {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedMedia(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedMedia(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!user || !selectedMedia || !caption.trim()) {
      Alert.alert('Missing Information', 'Please add a photo and caption');
      return;
    }

    setIsPosting(true);
    try {
const tempPostId = `post_${Date.now()}_${user.userId}`;

      // Upload media
      const { mediaURLs } = await mediaService.uploadPostMedia(
        user.userId,
        tempPostId,
        [selectedMedia]
      );

      // Create post
      await postService.createPost({
        authorId: user.userId,
        authorUsername: user.username,
        authorAvatarURL: user.avatarURL || '',
        caption: caption,
        mediaURLs: mediaURLs,
        mediaType: 'image',
        postType: 'image',
        aspectRatio: 1,
        location: location || undefined,
        tags: [],
        mentions: [],
      });

      Alert.alert('Success', 'Post shared successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to create post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={!selectedMedia || !caption.trim() || isPosting}
          style={[
            styles.shareButton,
            (!selectedMedia || !caption.trim() || isPosting) && styles.shareButtonDisabled
          ]}
        >
          <Text style={[
            styles.shareText,
            (!selectedMedia || !caption.trim() || isPosting) && styles.shareTextDisabled
          ]}>
            {isPosting ? 'Posting...' : 'Share'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.userInfo}>
          <Avatar source={user?.avatarURL} size={40} fallbackText={user?.username} />
          <Text style={styles.username}>{user?.username}</Text>
        </View>

        <TextInput
          style={styles.captionInput}
          placeholder="Write a caption..."
          placeholderTextColor={colors.text.secondary}
          multiline
          value={caption}
          onChangeText={setCaption}
          maxLength={2200}
        />

        {selectedMedia ? (
          <View style={styles.mediaContainer}>
            <Image source={{ uri: selectedMedia }} style={styles.mediaPreview} />
            <TouchableOpacity
              style={styles.removeMedia}
              onPress={() => setSelectedMedia(null)}
            >
              <Ionicons name="close-circle" size={24} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mediaSelector}>
            <TouchableOpacity style={styles.mediaOption} onPress={pickImage}>
              <Ionicons name="images" size={32} color={colors.accent.primary} />
              <Text style={styles.mediaOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaOption} onPress={takePhoto}>
              <Ionicons name="camera" size={32} color={colors.accent.primary} />
              <Text style={styles.mediaOptionText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.options}>
          <TouchableOpacity style={styles.option}>
            <Ionicons name="location-outline" size={20} color={colors.text.primary} />
            <TextInput
              style={styles.locationInput}
              placeholder="Add location"
              placeholderTextColor={colors.text.secondary}
              value={location}
              onChangeText={setLocation}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.option}>
            <Ionicons name="person-add-outline" size={20} color={colors.text.primary} />
            <Text style={styles.optionText}>Tag people</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  cancelText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  shareButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  shareButtonDisabled: {
    backgroundColor: colors.background.secondary,
  },
  shareText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold as any,
  },
  shareTextDisabled: {
    color: colors.text.secondary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  username: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  captionInput: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  mediaContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  mediaPreview: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  removeMedia: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  mediaSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    paddingVertical: spacing.xl,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
  },
  mediaOption: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  mediaOptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  options: {
    gap: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  optionText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  locationInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
});





