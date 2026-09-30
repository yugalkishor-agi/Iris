import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../ui/LoadingSkeleton';
import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

interface ProfileCoverImageProps {
  coverImageURL?: string;
  isOwnProfile: boolean;
  onUpload?: () => void;
  uploading?: boolean;
  userId?: string;
}

const DEFAULT_GRADIENTS: readonly [string, string][] = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#30cfd0', '#330867'],
] as const;

export function ProfileCoverImage({
  coverImageURL,
  isOwnProfile,
  onUpload,
  uploading = false,
  userId,
}: ProfileCoverImageProps) {
  // Pick gradient based on userId hash for consistent default covers
  const gradientIndex = userId 
    ? userId.charCodeAt(0) % DEFAULT_GRADIENTS.length 
    : 0;
  const gradient = DEFAULT_GRADIENTS[gradientIndex];

  return (
    <View style={styles.container}>
      {coverImageURL ? (
        <>
          <Image
            source={{ uri: coverImageURL }}
            style={styles.coverImage}
            contentFit="cover"
          />
          {/* Gradient overlay for better contrast */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.gradientOverlay}
          />
        </>
      ) : (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.defaultCover}
        />
      )}

      {/* Edit button for own profile */}
      {isOwnProfile && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={onUpload}
          disabled={uploading}
          activeOpacity={0.8}
        >
          {uploading ? (
            <InlineLoadingSkeleton />
          ) : (
            <>
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    position: 'relative',
    backgroundColor: '#1a1a1a',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  defaultCover: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  editButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

