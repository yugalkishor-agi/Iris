import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/post.service';
import { mediaService } from '../services/media.service.native';
import { colors, spacing, typography } from '../styles/theme';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');

export default function NewPostScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<'select' | 'compose'>('select');

  const pickImage = async (useCamera = false) => {
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            allowsMultipleSelection: true,
          });

      if (!result.canceled && result.assets) {
        setSelectedMedia(result.assets);
        setStep('compose');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handlePost = async () => {
    if (!user || selectedMedia.length === 0) return;

    setUploading(true);
    try {
      // Upload media files (RN-safe)
      const { mediaURLs } = await mediaService.uploadPostMedia(
        user.userId,
        `post_${Date.now()}`,
        selectedMedia
      );

      // Create post
      const postData = {
        authorId: user.userId,
        authorUsername: user.username,
        authorDisplayName: user.displayName,
        authorAvatarURL: user.avatarURL || '',
        authorVerified: user.verified || false,
        postType: selectedMedia.length > 1 ? 'carousel' : (selectedMedia[0].type === 'video' ? 'video' : 'image') as any,
        mediaType: (selectedMedia[0].type === 'video' ? 'video' : 'image') as 'video' | 'image',
        aspectRatio: 1,
        mediaURLs,
        caption: caption.trim(),
        location: location.trim(),
        tags: [],
        mentions: [],
        hashtags: extractHashtags(caption),
        visibility: 'public' as any,
        allowComments: true,
        allowLikes: true,
      };

      await postService.createPost(postData);
      Alert.alert('Success', 'Post created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const extractHashtags = (text: string): string[] => {
    const hashtags = text.match(/#\w+/g);
    return hashtags ? hashtags.map(tag => tag.slice(1)) : [];
  };

  if (step === 'select') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Create New Post</Text>
          
          <TouchableOpacity style={styles.option} onPress={() => pickImage(true)}>
            <Ionicons name="camera" size={32} color={colors.text.primary} />
            <Text style={styles.optionText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.option} onPress={() => pickImage(false)}>
            <Ionicons name="images" size={32} color={colors.text.primary} />
            <Text style={styles.optionText}>Choose from Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.option} onPress={() => pickImage(true)}>
            <Ionicons name="videocam" size={32} color={colors.text.primary} />
            <Text style={styles.optionText}>Record Video</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('select')}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity 
          onPress={handlePost}
          disabled={uploading || selectedMedia.length === 0}
          style={[styles.postButton, (uploading || selectedMedia.length === 0) && styles.postButtonDisabled]}
        >
          {uploading ? (
            <InlineLoadingSkeleton />
          ) : (
            <Text style={styles.postButtonText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.composeContent}>
        {/* Media Preview */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreview}>
          {selectedMedia.map((media, index) => (
            <View key={index} style={styles.mediaItem}>
              <Image source={{ uri: media.uri }} style={styles.mediaImage} />
              <TouchableOpacity 
                style={styles.removeMediaButton}
                onPress={() => {
                  const newMedia = selectedMedia.filter((_, i) => i !== index);
                  setSelectedMedia(newMedia);
                  if (newMedia.length === 0) setStep('select');
                }}
              >
                <Ionicons name="close" size={16} color={colors.text.inverse} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Caption Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor={colors.text.secondary}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2200}
          />
          <Text style={styles.characterCount}>{caption.length}/2200</Text>
        </View>

        {/* Location Input */}
        <View style={styles.inputSection}>
          <View style={styles.locationHeader}>
            <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.inputLabel}>Add Location</Text>
          </View>
          <TextInput
            style={styles.locationInput}
            placeholder="Where was this taken?"
            placeholderTextColor={colors.text.secondary}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Post Options */}
        <View style={styles.optionsSection}>
          <TouchableOpacity style={styles.optionRow}>
            <Ionicons name="people-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.optionLabel}>Tag People</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionRow}>
            <Ionicons name="settings-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.optionLabel}>Advanced Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  postButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  optionText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  composeContent: {
    flex: 1,
  },
  mediaPreview: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mediaItem: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  mediaImage: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  inputSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  captionInput: {
    color: colors.text.primary,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  inputLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  locationInput: {
    color: colors.text.primary,
    fontSize: 16,
    paddingVertical: spacing.xs,
  },
  optionsSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  optionLabel: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 16,
  },
});



