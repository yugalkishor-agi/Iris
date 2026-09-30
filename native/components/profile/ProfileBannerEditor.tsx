import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import { mediaService } from '../../services/media.service.native';
import { userService } from '../../services/user.service';
import { Image } from 'expo-image';

interface ProfileBannerEditorProps {
  profileUser: any;
  isOwnProfile: boolean;
  onBannerUpdate?: (bannerURL: string | null) => void;
  children?: React.ReactNode;
}

export function ProfileBannerEditor({
  profileUser,
  isOwnProfile,
  onBannerUpdate,
  children,
}: ProfileBannerEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const defaultGradients = [
    ['#667eea', '#764ba2', '#f093fb'],
    ['#4facfe', '#00f2fe'],
    ['#fa709a', '#fee140'],
    ['#a8edea', '#fed6e3'],
    ['#ff9a9e', '#fecfef'],
    ['#667eea', '#764ba2'],
  ];

  const handleBannerPress = () => {
    if (!isOwnProfile) return;
    setShowOptions(true);
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9], // Perfect banner ratio for mobile
        quality: 0.7, // Optimized for mobile
        // Add mobile-specific constraints
        allowsMultipleSelection: false,
        selectionLimit: 1,
        // Ensure proper mobile resolution
        exif: false,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Validate image dimensions for mobile optimization
        if (asset.width && asset.height) {
          const aspectRatio = asset.width / asset.height;
          if (aspectRatio < 1.5 || aspectRatio > 2.5) {
            Alert.alert(
              'Invalid Image Ratio',
              'Please select an image with a 16:9 aspect ratio for best mobile display. The image should be wider than it is tall.',
              [{ text: 'OK' }]
            );
            return;
          }
        }

        setUploading(true);
        setShowOptions(false);

        // Upload real banner to Supabase
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const uploadedURL = await mediaService.uploadBanner(profileUser.userId, blob as Blob);
        await userService.updateUser(profileUser.userId, {
          bannerURL: uploadedURL,
          bannerGradient: null,
        } as any);

        if (onBannerUpdate) {
          onBannerUpdate(uploadedURL);
        }

        Alert.alert('Success', 'Banner updated successfully!');
      }
    } catch (error) {
      console.error('Failed to upload banner:', error);
      Alert.alert('Error', 'Failed to upload banner. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveBanner = async () => {
    try {
      setUploading(true);
      setShowOptions(false);

      await userService.updateUser(profileUser.userId, {
        bannerURL: null,
        bannerGradient: null,
      } as any);

      if (onBannerUpdate) {
        onBannerUpdate(null);
      }

      Alert.alert('Success', 'Banner removed successfully!');
    } catch (error) {
      console.error('Failed to remove banner:', error);
      Alert.alert('Error', 'Failed to remove banner. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleGradientSelect = async (gradient: string[]) => {
    try {
      setUploading(true);
      setShowOptions(false);

      const gradientString = gradient.join(',');
      await userService.updateUser(profileUser.userId, {
        bannerURL: null,
        bannerGradient: gradientString
      } as any);

      if (onBannerUpdate) {
        onBannerUpdate(null);
      }

      Alert.alert('Success', 'Banner gradient updated!');
    } catch (error) {
      console.error('Failed to update gradient:', error);
      Alert.alert('Error', 'Failed to update gradient. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderBannerContent = () => {
    if (profileUser.bannerURL) {
      return (
        <Image
          source={{ uri: profileUser.bannerURL }}
          style={styles.bannerImage}
          contentFit="cover"
        />
      );
    } else {
      const gradientColors = profileUser.bannerGradient
        ? profileUser.bannerGradient.split(',')
        : ['#667eea', '#764ba2', '#f093fb'];

      return (
        <LinearGradient
          colors={gradientColors.length >= 2 ? gradientColors as [string, string, ...string[]] : ['#667eea', '#764ba2', '#f093fb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBanner}
        />
      );
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.bannerContainer}
        onPress={handleBannerPress}
        activeOpacity={isOwnProfile ? 0.8 : 1}
        disabled={!isOwnProfile}
      >
        {renderBannerContent()}

        {/* Overlay for children content */}
        <View style={styles.contentOverlay}>
          {children}
        </View>

        {/* Edit indicator for own profile */}
        {isOwnProfile && (
          <View style={styles.editOverlay}>
            <View style={styles.editIndicator}>
              <Ionicons name="camera" size={16} color="#fff" />
              <Text style={styles.editText}>Edit Banner</Text>
            </View>
          </View>
        )}

        {/* Loading overlay */}
        {uploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Updating banner...</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Banner Options Modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Banner</Text>
              <TouchableOpacity
                onPress={() => setShowOptions(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Upload Image Option */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleImagePicker}
            >
              <Ionicons name="image" size={24} color={colors.accent.primary} />
              <Text style={styles.optionText}>Upload Image</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>

            {/* Gradient Options */}
            <Text style={styles.sectionTitle}>Choose Gradient</Text>
            <View style={styles.gradientGrid}>
              {defaultGradients.map((gradient, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.gradientOption}
                  onPress={() => handleGradientSelect(gradient)}
                >
                  <LinearGradient
                    colors={gradient as [string, string, ...string[]]}
                    style={styles.gradientPreview}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Remove Banner Option */}
            {(profileUser.bannerURL || profileUser.bannerGradient) && (
              <TouchableOpacity
                style={[styles.optionButton, styles.removeButton]}
                onPress={handleRemoveBanner}
              >
                <Ionicons name="trash" size={24} color="#ff6b6b" />
                <Text style={[styles.optionText, styles.removeText]}>Remove Banner</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    height: 200, // Increased height for better mobile display
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // Ensure proper fitting
  },
  gradientBanner: {
    width: '100%',
    height: '100%',
  },
  contentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  editIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  editText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    marginLeft: spacing.xs,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  optionText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  removeButton: {
    borderBottomWidth: 0,
  },
  removeText: {
    color: '#ff6b6b',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  gradientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  gradientOption: {
    width: 80,
    height: 50,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border.subtle,
  },
  gradientPreview: {
    flex: 1,
  },
});
