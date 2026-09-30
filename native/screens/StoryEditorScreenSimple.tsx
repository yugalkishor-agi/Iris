import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CameraView } from 'expo-camera';
import { canUseExpoCameraHardware } from '../utils/devicePerf';
import { StoryPostStyleEditor, StoryEditorDraft, StoryEditorSettings, StoryMediaInput } from '../components/story/StoryPostStyleEditor';
import { useStoryProcessing } from '../contexts/StoryProcessingContext';

const DEFAULT_STORY_SETTINGS: StoryEditorSettings = {
  allowReplies: true,
  allowSharing: true,
  audience: 'everyone',
  hiddenFrom: [],
  closeFriends: [],
};

export default function StoryEditorScreenSimple() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { startStoryProcessing } = useStoryProcessing();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<StoryMediaInput | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [canUseCamera, setCanUseCamera] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [storySettings, setStorySettings] = useState<StoryEditorSettings>(DEFAULT_STORY_SETTINGS);
  const cameraRef = useRef<CameraView | null>(null);
  const autoLaunchRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const hardwareAvailable = await canUseExpoCameraHardware();
        setCanUseCamera(hardwareAvailable);
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch {
        setCanUseCamera(false);
        setHasPermission(false);
      }
    })();
  }, []);

  const handleClose = () => {
    navigation.goBack();
  };

  const setMediaFromAsset = (asset: any) => {
    const type: 'image' | 'video' = asset?.type === 'video' ? 'video' : 'image';
    setSelectedMedia({
      uri: asset.uri,
      type,
      width: asset.width,
      height: asset.height,
    });
  };

  const handleGallerySelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setMediaFromAsset(result.assets[0]);
      }
    } catch (error) {
      console.error('Error selecting media:', error);
      Alert.alert('Error', 'Failed to select media from gallery');
    }
  };

  const handleCameraCapture = async () => {
    try {
      if (!cameraRef.current) {
        return handleGallerySelect();
      }
      const photo: any = await (cameraRef.current as any).takePictureAsync?.({
        quality: 1,
        base64: false,
        skipProcessing: false,
      });
      if (photo?.uri) {
        setSelectedMedia({
          uri: photo.uri,
          type: 'image',
          width: photo.width,
          height: photo.height,
        });
      } else {
        handleGallerySelect();
      }
    } catch (error) {
      console.error('Camera capture failed, opening gallery as fallback:', error);
      handleGallerySelect();
    }
  };

  const flipCamera = () => {
    setCameraFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const handleDraftReady = (draft: StoryEditorDraft) => {
    if (isSharing) return;
    try {
      setIsSharing(true);
      startStoryProcessing({
        mediaUri: draft.mediaUri,
        mediaType: draft.mediaType,
        mediaWidth: draft.mediaWidth,
        mediaHeight: draft.mediaHeight,
        canvasConfig: draft.canvasConfig,
        textElements: draft.textElements,
        stickers: draft.stickers,
        drawings: draft.drawings,
        audience: draft.audience,
        storySettings: draft.storySettings,
        trimStart: draft.trimStart,
        trimEnd: draft.trimEnd,
        filters: draft.filters,
        audioOverlay: draft.audioOverlay,
      });

      (navigation as any).reset({ index: 0, routes: [{ name: 'Main' as never }] });
    } catch (error) {
      console.error('Failed to start story processing:', error);
      Alert.alert('Error', 'Could not share story. Please try again.');
      setIsSharing(false);
    }
  };

  useEffect(() => {
    const params = route?.params || {};
    if (autoLaunchRef.current || hasPermission !== true) return;
    if (params?.openGallery) {
      autoLaunchRef.current = true;
      handleGallerySelect();
      return;
    }
    if (params?.openCamera) {
      autoLaunchRef.current = true;
    }
  }, [route, hasPermission]);

  if (selectedMedia) {
    return (
      <View style={styles.container}>
        <StoryPostStyleEditor
          visible={true}
          media={selectedMedia}
          settings={storySettings}
          onSettingsChange={setStorySettings}
          onClose={() => setSelectedMedia(null)}
          onSaveDraft={handleDraftReady}
        />
        {isSharing ? (
          <View style={styles.sharingOverlay}>
            <ActivityIndicator size="large" color="#4DD0E1" />
            <Text style={styles.sharingText}>Sharing story...</Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="camera-outline" size={64} color="#666666" />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity style={styles.galleryButton} onPress={handleGallerySelect}>
            <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Story</Text>
        <TouchableOpacity style={styles.headerButton} onPress={flipCamera}>
          <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        {canUseCamera ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraFacing}
            onMountError={() => setCanUseCamera(false)}
          />
        ) : (
          <View style={[styles.camera, styles.cameraFallback]}>
            <Text style={styles.fallbackText}>Camera not available on this device right now. Use Gallery.</Text>
          </View>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.galleryIconButton} onPress={handleGallerySelect}>
          <Ionicons name="images" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {canUseCamera ? (
          <TouchableOpacity style={styles.captureButton} onPress={handleCameraCapture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        ) : (
          <View style={styles.captureSpacer} />
        )}

        <TouchableOpacity style={styles.flipIconButton} onPress={flipCamera}>
          <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  galleryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    minWidth: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#AAAAAA',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
  },
  galleryIconButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  captureSpacer: {
    width: 80,
    height: 80,
  },
  flipIconButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 100,
  },
  sharingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});


