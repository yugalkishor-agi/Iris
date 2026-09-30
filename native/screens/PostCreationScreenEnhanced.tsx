import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Alert, Dimensions, Modal, ActivityIndicator, ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { postService } from '../services/post.service';
import { mediaService } from '../services/media.service.native';
import { userService } from '../services/user.service';
import { useAuth } from '../contexts/AuthContext';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');

export default function PostCreationScreenEnhanced() {
  const navigation = useNavigation();
  const { user } = useAuth();

  // Media State
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Caption State
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');

  // Hashtag & Mention State
  const [hashtagSuggestions, setHashtagSuggestions] = useState<any[]>([]);
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [currentHashtagQuery, setCurrentHashtagQuery] = useState('');
  const [currentMentionQuery, setCurrentMentionQuery] = useState('');

  // Tagged People State
  const [taggedUsers, setTaggedUsers] = useState<any[]>([]);
  const [showTagPeopleModal, setShowTagPeopleModal] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [tagSearchResults, setTagSearchResults] = useState<any[]>([]);

  // Collaboration State
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [showCollabModal, setShowCollabModal] = useState(false);

  // Advanced Settings
  const [allowComments, setAllowComments] = useState(true);
  const [allowLikes, setAllowLikes] = useState(true);
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'close_friends'>('public');

  // UI State
  const [isPosting, setIsPosting] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const captionInputRef = useRef<TextInput>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to select photos.');
    }
  };

  const selectImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets) {
        setSelectedImages(result.assets);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select images');
    }
  };

  // Hashtag Detection and Suggestions
  const handleCaptionChange = (text: string) => {
    setCaption(text);

    // Detect hashtag typing
    const hashtagMatch = text.match(/#(\w+)$/);
    if (hashtagMatch) {
      setCurrentHashtagQuery(hashtagMatch[1]);
      setShowHashtagSuggestions(true);
      setShowMentionSuggestions(false);
      searchHashtags(hashtagMatch[1]);
    }
    // Detect mention typing
    else if (text.match(/@(\w+)$/)) {
      const mentionMatch = text.match(/@(\w+)$/);
      if (mentionMatch) {
        setCurrentMentionQuery(mentionMatch[1]);
        setShowMentionSuggestions(true);
        setShowHashtagSuggestions(false);
        searchUsers(mentionMatch[1]);
      }
    } else {
      setShowHashtagSuggestions(false);
      setShowMentionSuggestions(false);
    }
  };

  const searchHashtags = async (query: string) => {
    if (query.length < 2) {
      setHashtagSuggestions([]);
      return;
    }

    try {
      // Mock hashtag suggestions - replace with actual service
      const suggestions = [
        { tag: query, count: 1234 },
        { tag: query + 'india', count: 567 },
        { tag: query + 'viral', count: 890 },
        { tag: 'trending' + query, count: 234 },
      ];
      setHashtagSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to search hashtags:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setMentionSuggestions([]);
      return;
    }

    try {
      const results = await userService.searchUsers(query);
      setMentionSuggestions(results.slice(0, 10));
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const insertHashtag = (tag: string) => {
    const newCaption = caption.replace(/#\w*$/, '#' + tag + ' ');
    setCaption(newCaption);
    setShowHashtagSuggestions(false);
  };

  const insertMention = (mentionUser: any) => {
    const newCaption = caption.replace(/@\w*$/, '@' + mentionUser.username + ' ');
    setCaption(newCaption);

    // Add to tagged users
    if (!taggedUsers.find(u => u.userId === mentionUser.userId)) {
      setTaggedUsers([...taggedUsers, mentionUser]);
    }

    setShowMentionSuggestions(false);
  };

  const searchTagUsers = async (query: string) => {
    setTagSearchQuery(query);
    if (query.length < 2) {
      setTagSearchResults([]);
      return;
    }

    try {
      const results = await userService.searchUsers(query);
      setTagSearchResults(results);
    } catch (error) {
      console.error('Failed to search users for tagging:', error);
    }
  };

  const toggleTagUser = (tagUser: any) => {
    const isTagged = taggedUsers.find(u => u.userId === tagUser.userId);
    if (isTagged) {
      setTaggedUsers(taggedUsers.filter(u => u.userId !== tagUser.userId));
    } else {
      setTaggedUsers([...taggedUsers, tagUser]);
    }
  };

  const handlePost = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('No images selected', 'Please select at least one image');
      return;
    }

    if (!user) {
      Alert.alert('Not authenticated', 'Please login to create a post');
      return;
    }

    setIsPosting(true);

    try {
      // Extract hashtags and mentions from caption
      const hashtags = caption.match(/#[\w]+/g)?.map(tag => tag.substring(1)) || [];
      const mentions = caption.match(/@[\w]+/g)?.map(mention => mention.substring(1)) || [];

      // For now, use a placeholder postId - in production this should be generated first
      const tempPostId = `post_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Upload media using story media upload as a workaround 
      // (since uploadPostMedia requires File[], we use uploadStoryMedia which accepts Blob)
      const mediaURLs: string[] = [];
      for (const image of selectedImages) {
        try {
          // Fetch the image and upload as story media (works for both platforms)
          const response = await fetch(image.uri);
          const blob = await response.blob();
          const result = await mediaService.uploadStoryMedia(user.userId, blob);
          mediaURLs.push(result.mediaURL);
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
        }
      }

      if (mediaURLs.length === 0) {
        throw new Error('Failed to upload any images');
      }

      // Create post with only supported fields
      await postService.createPost({
        authorId: user.userId,
        authorUsername: user.username,
        authorAvatarURL: user.avatarURL || '',
        postType: selectedImages.length > 1 ? 'carousel' : 'image',
        mediaType: 'image',
        mediaURLs,
        caption,
        location: location || undefined,
        tags: hashtags,
        mentions,
        aspectRatio: 1, // Default square aspect ratio
      });

      Alert.alert('Success!', 'Your post has been shared', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const renderHashtagSuggestion = ({ item }: any) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => insertHashtag(item.tag)}
    >
      <Text style={styles.suggestionText}>#{item.tag}</Text>
      <Text style={styles.suggestionCount}>{item.count} posts</Text>
    </TouchableOpacity>
  );

  const renderMentionSuggestion = ({ item }: any) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => insertMention(item)}
    >
      <Image source={{ uri: item.avatarURL }} style={styles.suggestionAvatar as ImageStyle} />
      <View style={styles.suggestionInfo}>
        <Text style={styles.suggestionText}>@{item.username}</Text>
        <Text style={styles.suggestionSubtext}>{item.displayName}</Text>
      </View>
      {item.verified ? (
        <VerifiedBadge size={16} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={isPosting || selectedImages.length === 0}
          style={[styles.postButton, (isPosting || selectedImages.length === 0) && styles.postButtonDisabled]}
        >
          {isPosting ? (
            <InlineLoadingSkeleton />
          ) : (
            <Text style={styles.postButtonText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Image Selection */}
        {selectedImages.length === 0 ? (
          <TouchableOpacity style={styles.imageSelector} onPress={selectImages}>
            <Ionicons name="images" size={48} color={colors.text.secondary} />
            <Text style={styles.imageSelectorText}>Select Photos</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImages[currentImageIndex]?.uri }} style={styles.previewImage as ImageStyle} />
            {selectedImages.length > 1 && (
              <View style={styles.imageIndicators}>
                {selectedImages.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.indicator, index === currentImageIndex && styles.activeIndicator]}
                    onPress={() => setCurrentImageIndex(index)}
                  />
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.changeImagesButton} onPress={selectImages}>
              <Ionicons name="images" size={20} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
        )}

        {/* Caption Input */}
        <View style={styles.captionSection}>
          <TextInput
            ref={captionInputRef}
            style={styles.captionInput}
            placeholder="Write a caption... Use # for hashtags, @ to tag people"
            placeholderTextColor={colors.text.secondary}
            value={caption}
            onChangeText={handleCaptionChange}
            multiline
            maxLength={2200}
          />
          <Text style={styles.characterCount}>{caption.length}/2200</Text>
        </View>

        {/* Hashtag Suggestions */}
        {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlashList estimatedItemSize={100}
              data={hashtagSuggestions}
              renderItem={renderHashtagSuggestion}
              keyExtractor={(item, index) => `hashtag-${index}`}
              style={styles.suggestionsList}
            />
          </View>
        )}

        {/* Mention Suggestions */}
        {showMentionSuggestions && mentionSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlashList estimatedItemSize={100}
              data={mentionSuggestions}
              renderItem={renderMentionSuggestion}
              keyExtractor={(item) => item.userId}
              style={styles.suggestionsList}
            />
          </View>
        )}

        {/* Tagged Users Display */}
        {taggedUsers.length > 0 && (
          <View style={styles.taggedUsersSection}>
            <Text style={styles.sectionTitle}>Tagged People</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {taggedUsers.map((taggedUser) => (
                <View key={taggedUser.userId} style={styles.taggedUser}>
                  <Image source={{ uri: taggedUser.avatarURL }} style={styles.taggedUserAvatar as ImageStyle} />
                  <Text style={styles.taggedUserName}>@{taggedUser.username}</Text>
                  <TouchableOpacity
                    onPress={() => setTaggedUsers(taggedUsers.filter(u => u.userId !== taggedUser.userId))}
                    style={styles.removeTagButton}
                  >
                    <Ionicons name="close" size={16} color={colors.text.inverse} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowTagPeopleModal(true)}>
            <Ionicons name="people" size={20} color={colors.accent.primary} />
            <Text style={styles.actionButtonText}>Tag People</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setShowCollabModal(true)}>
            <Ionicons name="people-circle" size={20} color={colors.accent.primary} />
            <Text style={styles.actionButtonText}>Add Collaborators</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setShowAdvancedSettings(true)}>
            <Ionicons name="settings" size={20} color={colors.accent.primary} />
            <Text style={styles.actionButtonText}>Advanced Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Location Input */}
        <View style={styles.locationSection}>
          <TextInput
            style={styles.locationInput}
            placeholder="Add location"
            placeholderTextColor={colors.text.secondary}
            value={location}
            onChangeText={setLocation}
          />
        </View>
      </ScrollView>

      {/* Tag People Modal */}
      <Modal visible={showTagPeopleModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTagPeopleModal(false)}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Tag People</Text>
            <TouchableOpacity onPress={() => setShowTagPeopleModal(false)}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search people..."
            value={tagSearchQuery}
            onChangeText={searchTagUsers}
          />

          <FlashList estimatedItemSize={100}
            data={tagSearchResults}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.userItem}
                onPress={() => toggleTagUser(item)}
              >
                <Image source={{ uri: item.avatarURL }} style={styles.userAvatar as ImageStyle} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.username}</Text>
                  <Text style={styles.userDisplayName}>{item.displayName}</Text>
                </View>
                {taggedUsers.find(u => u.userId === item.userId) && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.accent.primary} />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.userId}
          />
        </SafeAreaView>
      </Modal>
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
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  postButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  imageSelector: {
    height: 300,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageSelectorText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  imagePreview: {
    height: 300,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: colors.text.inverse,
  },
  changeImagesButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.sm,
    borderRadius: borderRadius.full,
  },
  captionSection: {
    margin: spacing.md,
  },
  captionInput: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: borderRadius.md,
  },
  characterCount: {
    textAlign: 'right',
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  suggestionsContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  suggestionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  suggestionSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  suggestionCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  taggedUsersSection: {
    margin: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  taggedUser: {
    alignItems: 'center',
    marginRight: spacing.md,
    position: 'relative',
  },
  taggedUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  taggedUserName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  removeTagButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.accent.error,
    borderRadius: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsSection: {
    margin: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  locationSection: {
    margin: spacing.md,
  },
  locationInput: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: borderRadius.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  doneButton: {
    fontSize: typography.fontSize.base,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  searchInput: {
    margin: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  userDisplayName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});


