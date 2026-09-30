import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '../components/ui/Avatar';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/post.service';
import { mediaService } from '../services/media.service.native';
import { Image } from 'expo-image';

export default function NewPostScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setImageFile(result.assets[0]);
    }
  };

  const handleCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setImageFile(result.assets[0]);
    }
  };

  const handleShare = async () => {
    if (!user || !imageFile || !caption.trim()) {
      return;
    }

    setIsPosting(true);
    try {
      const tempPostId = `post_${Date.now()}_${user.userId}`;
      // Upload to Supabase
      const { mediaURLs } = await mediaService.uploadPostMedia(
        user.userId,
        tempPostId,
        [imageFile]
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

      navigation.navigate('Home' as never);
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>New Post</Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={!selectedImage || !caption.trim() || isPosting}
          >
            {isPosting ? (
              <InlineLoadingSkeleton />
            ) : (
              <Text
                style={[
                  styles.shareButton,
                  (!selectedImage || !caption.trim()) && styles.shareButtonDisabled,
                ]}
              >
                Share
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* User Info */}
          <View style={styles.userInfo}>
            <Avatar
              source={user?.avatarURL}
              size={40}
              fallbackText={user?.username}
            />
            <Text style={styles.username}>{user?.username}</Text>
          </View>

          {/* Image Selection */}
          {!selectedImage ? (
            <View style={styles.imagePlaceholder}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={handleImagePicker}
              >
                <Ionicons name="images-outline" size={48} color={colors.accent.primary} />
                <Text style={styles.imageButtonText}>Select Photo</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.imageButton}
                onPress={handleCamera}
              >
                <Ionicons name="camera-outline" size={48} color={colors.accent.primary} />
                <Text style={styles.imageButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.selectedImage}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setSelectedImage(null);
                  setImageFile(null);
                }}
              >
                <Ionicons name="close-circle" size={28} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Caption */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Caption</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              placeholderTextColor={colors.text.secondary}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={2200}
            />
            <Text style={styles.charCount}>{caption.length}/2200</Text>
          </View>

          {/* Location */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Location (optional)</Text>
            <View style={styles.locationInput}>
              <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
              <TextInput
                style={styles.locationTextInput}
                placeholder="Add location"
                placeholderTextColor={colors.text.secondary}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* Options */}
          <View style={styles.options}>
            <TouchableOpacity style={styles.option}>
              <Ionicons name="people-outline" size={24} color={colors.text.primary} />
              <Text style={styles.optionText}>Tag People</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.option}>
              <Ionicons name="musical-notes-outline" size={24} color={colors.text.primary} />
              <Text style={styles.optionText}>Add Music</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.option}>
              <Ionicons name="settings-outline" size={24} color={colors.text.primary} />
              <Text style={styles.optionText}>Advanced Settings</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  shareButton: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.accent.primary,
  },
  shareButtonDisabled: {
    color: colors.text.muted,
  },
  content: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  username: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  imagePlaceholder: {
    margin: spacing.lg,
    padding: spacing.xxl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border.medium,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  imageButton: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  imageButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.accent.primary,
    marginTop: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  imageContainer: {
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    aspectRatio: 1,
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.full,
  },
  inputSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  captionInput: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
    padding: 0,
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  locationTextInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  options: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  optionText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
});




