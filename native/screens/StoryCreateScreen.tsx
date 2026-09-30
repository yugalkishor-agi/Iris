import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  TextInput} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography } from '../styles/theme';
import { NativeStoryEditor } from '../components/editor/NativeStoryEditor';
import * as FileSystem from 'expo-file-system';
import { storyService } from '../services/story.service';
import { mediaService } from '../services/media.service.native';
import { useStoryProcessing } from '../contexts/StoryProcessingContext';
import { normalizeEditorExport } from '../utils/normalizeEditorExport';
import Constants from 'expo-constants';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

export default function StoryCreateScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { startStoryProcessing } = useStoryProcessing();
  
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [textOverlay, setTextOverlay] = useState('');
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<'select' | 'edit'>('select');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const autoLaunchedRef = useRef(false);

  const pickMedia = async (source: 'camera' | 'library', media: 'image' | 'video' | 'all' = 'all') => {
    try {
      // Use new mediaTypes array format instead of deprecated MediaTypeOptions
      const mediaTypes: ('images' | 'videos')[] = media === 'image'
        ? ['images']
        : media === 'video'
          ? ['videos']
          : ['images', 'videos'];

      const pickerOpts: ImagePicker.ImagePickerOptions = {
        mediaTypes,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      };

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(pickerOpts)
        : await ImagePicker.launchImageLibraryAsync(pickerOpts);

      if (!result.canceled && result.assets[0]) {
        setSelectedMedia(result.assets[0]);
        setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
        setStep('edit');
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  // Auto-open camera when navigated with openCamera flag (e.g., from own story ring)
  useEffect(() => {
    const params = (route as any)?.params || {};
    if (step === 'select' && params?.openCamera && !autoLaunchedRef.current) {
      autoLaunchedRef.current = true;
      pickMedia('camera', 'all');
    }
  }, [route, step]);

  const handlePost = async () => {
    if (!user || !selectedMedia) return;

    setUploading(true);
    try {

      const { mediaURL } = await mediaService.uploadStoryMedia(user.userId, selectedMedia);

      // Create story
      const storyData: any = {
        authorId: user.userId,
        authorUsername: user.username,
        authorAvatarURL: user.avatarURL || '',
        authorVerified: user.verified || false,
        mediaURL,
        mediaType: selectedMedia.type === 'video' ? 'video' : 'image' as 'video' | 'image',
        duration: 5000,
        audience: 'public' as const,
        allowReplies: true,
        allowSharing: true,
        hiddenFrom: [],
        viewsCount: 0,
        likesCount: 0,
        repliesCount: 0,
        isHighlighted: false
      };

      // Only add optional fields if they have values
      if (selectedMedia.type === 'video') {
        storyData.thumbnailURL = mediaURL;
      }

      if (textOverlay.trim()) {
        storyData.textOverlay = {
          text: textOverlay.trim(),
          position: { x: 0.5, y: 0.5 },
          fontSize: 24,
          color: '#ffffff'
        };
      }

      await storyService.createStory(storyData);
      Alert.alert('Success', 'Story posted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating story:', error);
      Alert.alert('Error', 'Failed to post story');
    } finally {
      setUploading(false);
    }
  };

  if (step === 'select') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.selectContent}>
          <Text style={styles.subtitle}>Share a moment that disappears in 24 hours</Text>

          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.option} onPress={() => pickMedia('camera', 'image')}>
              <View style={styles.optionIcon}>
                <Ionicons name="camera" size={32} color={colors.text.primary} />
              </View>
              <Text style={styles.optionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={() => pickMedia('library', 'all')}>
              <View style={styles.optionIcon}>
                <Ionicons name="images" size={32} color={colors.text.primary} />
              </View>
              <Text style={styles.optionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={() => pickMedia('camera', 'video')}>
              <View style={styles.optionIcon}>
                <Ionicons name="videocam" size={32} color={colors.text.primary} />
              </View>
              <Text style={styles.optionText}>Record Video</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Edit step
  if (step === 'edit' && selectedMedia) {
    return (
      <NativeStoryEditor
        visible={true}
        mediaUri={selectedMedia.uri}
        mediaType={mediaType}
        onCancel={() => {
          setStep('select');
          setSelectedMedia(null);
        }}
        onSave={async (payload: any) => {
          try {
            if (payload?.kind === 'image' && typeof payload?.dataUrl === 'string') {
              const hasMeta = !!payload?.meta;
              // Only write the flattened dataUrl if we don't have metadata
              let path = '';
              if (!hasMeta) {
                const b64 = (payload.dataUrl as string).split(',')[1] || '';
                path = `${FileSystem.documentDirectory}webedit_${Date.now()}.jpg`;
                await FileSystem.writeAsStringAsync(path, b64, { encoding: FileSystem.EncodingType.Base64 });
              }
              // Normalize editor export to persist widgets as metadata (component rendering at view-time)
              const ex = normalizeEditorExport(payload);
              // If metadata exists, upload the ORIGINAL selected media (no baked overlays). Otherwise, fall back to flattened image path.
              const backgroundUri = hasMeta ? selectedMedia.uri : path;
              if (!backgroundUri) {
                throw new Error('Missing exported image URI');
              }
              startStoryProcessing({
                mediaUri: backgroundUri,
                mediaType: 'image',
                // Do NOT set mediaWidth/mediaHeight here so viewer uses 'screen' positionSpace for normalized coords
                ...(hasMeta ? {} : { mediaWidth: ex.mediaWidth, mediaHeight: ex.mediaHeight }),
                canvasConfig: ex.canvasConfig,
                textElements: ex.textElements,
                stickers: ex.stickers,
                drawings: ex.drawings,
                audience: ex.audience,
                storySettings: ex.storySettings,
                filters: ex.filters,
                audioOverlay: ex.audioOverlay,
              });
              Alert.alert('Story upload started', 'Your story is processing in the background.');
              navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
              return;

            }
            if (payload?.kind === 'video') {
              const ex = normalizeEditorExport(payload);
              const ts = typeof payload.trimStart === 'number' ? Math.max(0, Math.floor(payload.trimStart)) : undefined;
              const te = typeof payload.trimEnd === 'number' ? Math.max(1, Math.floor(payload.trimEnd)) : undefined;
              const filters = payload?.filters && (payload.filters.brightness != null || payload.filters.contrast != null || payload.filters.saturation != null)
                ? { brightness: payload.filters.brightness, contrast: payload.filters.contrast, saturation: payload.filters.saturation }
                : undefined;
              startStoryProcessing({
                mediaUri: selectedMedia.uri,
                mediaType: 'video',
                canvasConfig: ex.canvasConfig,
                textElements: ex.textElements,
                stickers: ex.stickers,
                drawings: ex.drawings,
                audience: ex.audience,
                storySettings: ex.storySettings,
                trimStart: ts,
                trimEnd: te,
                filters: filters || ex.filters,
                audioOverlay: ex.audioOverlay,
              });
              Alert.alert('Story upload started', 'Your story is processing in the background.');
              navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
              return;
            }
          } catch (error) {
            console.error('Failed to export story from editor:', error);
          }
          navigation.goBack();
        }}
        giphyApiKey={((Constants as any)?.expoConfig?.extra?.giphyApiKey as string | undefined) || '2Tlxrk2CQw5u8QdezcfVkp32bwwNfiyp'}
      />
    );
  }

  // Fallback - should not reach here
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 18, fontWeight: '600' },
  post: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  picker: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, color: '#6b7280', marginTop: 16 },
  preview: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text.primary },
  selectContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  subtitle: { fontSize: 14, color: colors.text.secondary, textAlign: 'center', marginTop: 8 },
  optionsContainer: { width: '100%', gap: 16 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.background.secondary, borderRadius: 12 },
  optionIcon: { marginRight: 16 },
  optionText: { fontSize: 16, fontWeight: '500', color: colors.text.primary },
  postButton: { backgroundColor: colors.accent.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  postButtonDisabled: { opacity: 0.5 },
  postButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  characterCount: { fontSize: 12, color: colors.text.secondary, textAlign: 'right', marginTop: 4 },
  optionsSection: { gap: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.background.secondary, borderRadius: 8 },
  optionLabel: { flex: 1, marginLeft: 12, fontSize: 16, color: colors.text.primary },
  editContent: { flex: 1, position: 'relative' },
  storyPreview: { flex: 1, backgroundColor: '#000' },
  storyImage: { width: '100%', height: '100%' },
  textOverlayContainer: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -50 }, { translateY: -50 }] as const },
  textOverlay: { fontSize: 24, color: '#fff', textAlign: 'center', fontWeight: '600' },
  storyTools: { position: 'absolute', right: 16, top: '50%', transform: [{ translateY: -75 }] as const },
  toolButton: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 24, marginBottom: 16 },
  textInputContainer: { padding: 16, backgroundColor: colors.background.secondary },
  textInput: { fontSize: 16, color: colors.text.primary, minHeight: 40 },
});








