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
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { glimpseService } from '../services/glimpse.service';
import { mediaService } from '../services/media.service.native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GlimpseCreateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { videoUri } = route.params as any;
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const handlePublish = async () => {
    if (!user || !videoUri || uploading) return;

    setUploading(true);
    try {
      // Create glimpse with correct parameters (glimpse service uploads from URI/asset)
      await glimpseService.createGlimpse(
        user.userId,                      // authorId
        user.username || 'user',          // authorUsername
        user.avatarURL || '',             // authorAvatarURL
        user.verified || false,           // authorVerified
        videoUri,                         // mediaFile (service uploads it)
        'video',                          // mediaType
        15,                               // duration (default 15 seconds)
        caption || '',                    // caption
        [],                               // mentions
        [],                               // tags
        [],                               // taggedUsers
        [],                               // collaborators
        undefined,                        // backgroundMusic
        undefined,                        // coverImageBlob
        undefined,                        // taggedPeople
        {                                 // settings
          allowComments: true,
          allowDownload: false,
          hideLikes: false,
          showCaptions: true,
        }
      );

      // Show success and navigate
      Alert.alert('Success', 'Glimpse published!', [
        { text: 'OK', onPress: () => navigation.navigate('Home' as never) }
      ]);
    } catch (error) {
      console.error('Failed to publish glimpse:', error);
      Alert.alert('Error', 'Failed to publish glimpse. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Video
        source={{ uri: videoUri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
      />

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

        <View style={styles.captionContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="Add a caption..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={150}
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
  video: {
    width: '100%',
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
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
  captionContainer: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.lg,
    right: spacing.lg,
  },
  captionInput: {
    fontSize: typography.fontSize.base,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
});



