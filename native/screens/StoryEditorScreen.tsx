import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  // PanGestureHandler, PinchGestureHandler, State, // Commented out - not available
  TextInput,
  Modal,
  ScrollView,
  Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { PanGestureHandler, PinchGestureHandler } from 'react-native-gesture-handler';
import type { PanGestureHandlerGestureEvent, PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { styles } from './StoryEditorStyles';
import { useMediaProcessing } from '../hooks/useMediaProcessing';
import ProcessingIndicator from '../components/ProcessingIndicator/ProcessingIndicator';
import { canUseExpoCameraHardware } from '../utils/devicePerf';
import { Image } from 'expo-image';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  fontFamily: string;
  fontSize: number;
  backgroundColor?: string;
}

interface Sticker {
  id: string;
  type: 'emoji' | 'gif' | 'sticker';
  source: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export default function StoryEditorScreen() {
  const navigation = useNavigation();
  const cameraRef = useRef<any>(null);
  const [canUseCamera, setCanUseCamera] = useState(false);

  // State Management
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | null>(null);

  // Editor State
  const [editMode, setEditMode] = useState<'none' | 'text' | 'sticker' | 'draw' | 'filter'>('none');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textFont, setTextFont] = useState('System');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  // Animation values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  // Colors for text
  const textColors = [
    '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#32CD32'
  ];

  // Fonts available
  const fonts = [
    'System', 'Arial', 'Helvetica', 'Times New Roman', 'Courier',
    'Georgia', 'Verdana', 'Comic Sans MS', 'Impact', 'Trebuchet MS'
  ];

  // Filters
  const filters = [
    { name: 'None', value: null },
    { name: 'Vintage', value: 'vintage' },
    { name: 'Black & White', value: 'bw' },
    { name: 'Sepia', value: 'sepia' },
    { name: 'Warm', value: 'warm' },
    { name: 'Cool', value: 'cool' },
    { name: 'Bright', value: 'bright' },
    { name: 'Contrast', value: 'contrast' }
  ];

  // Stickers/Emojis
  const stickerCategories = {
    emojis: ['😀', '😂', '🥰', '😍', '🤩', '😎', '🔥', '💯', '❤️', '👍', '🎉', '✨'],
    stickers: ['🌟', '💫', '🌈', '🦄', '🎈', '🎊', '🎁', '🏆', '⚡', '💎', '🌸', '🍀']
  };

  useEffect(() => {
    (async () => {
      try {
        const hardwareAvailable = await canUseExpoCameraHardware();
        setCanUseCamera(hardwareAvailable);
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch {
        setHasPermission(false);
        setCanUseCamera(false);
      }
    })();
  }, []);

  // Camera Functions
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedMedia(photo.uri);
        setMediaType('photo');
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync({
          quality: '720p',
          maxDuration: 30,
        });
        setCapturedMedia(video.uri);
        setMediaType('video');
        setIsRecording(false);
      } catch (error) {
        console.error('Error recording video:', error);
        setIsRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCapturedMedia(result.assets[0].uri);
      setMediaType(result.assets[0].type === 'video' ? 'video' : 'photo');
    }
  };

  // Text Overlay Functions
  const addTextOverlay = () => {
    if (currentText.trim()) {
      const newText: TextOverlay = {
        id: Date.now().toString(),
        text: currentText,
        x: screenWidth / 2,
        y: screenHeight / 2,
        scale: 1,
        rotation: 0,
        color: textColor,
        fontFamily: textFont,
        fontSize: 24,
      };
      setTextOverlays([...textOverlays, newText]);
      setCurrentText('');
      setShowTextInput(false);
      setEditMode('none');
    }
  };

  const deleteTextOverlay = (id: string) => {
    setTextOverlays(textOverlays.filter(text => text.id !== id));
    setSelectedTextId(null);
  };

  // Sticker Functions
  const addSticker = (emoji: string) => {
    const newSticker: Sticker = {
      id: Date.now().toString(),
      type: 'emoji',
      source: emoji,
      x: screenWidth / 2,
      y: screenHeight / 2,
      scale: 1,
      rotation: 0,
    };
    setStickers([...stickers, newSticker]);
    setShowStickerPicker(false);
    setEditMode('none');
  };

  const deleteSticker = (id: string) => {
    setStickers(stickers.filter(sticker => sticker.id !== id));
  };

  // Gesture Handlers
  const panGestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { startX: number; startY: number }>({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
    },
  });

  const pinchGestureHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent, { startScale: number }>({
    onStart: (_, context: any) => {
      context.startScale = scale.value;
    },
    onActive: (event, context) => {
      scale.value = context.startScale * (event.scale || 1);
    },
  });

  const animatedStyle = useAnimatedStyle((): any => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    } as any;
  });

  // Publish Story
  const publishStory = async () => {
    if (!capturedMedia) return;

    try {
      // Here you would implement the actual story publishing logic
      // This would involve uploading the media and overlay data to your backend
      Alert.alert('Success', 'Story published successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error publishing story:', error);
      Alert.alert('Error', 'Failed to publish story');
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!capturedMedia ? (
        // Camera View
        <View style={styles.cameraContainer}>
          {canUseCamera ? (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={cameraType}
              flash={flashMode}
              onMountError={() => setCanUseCamera(false)}
            />
          ) : (
            <View style={[styles.camera, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={styles.errorText}>Camera not available on this device right now. Use Gallery.</Text>
            </View>
          )}

          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setFlashMode(
                flashMode === 'off' ? 'on' : 'off'
              )}
            >
              <Ionicons
                name={flashMode === 'off' ? "flash-off" : "flash"}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={pickFromGallery}
            >
              <Ionicons name="images" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {canUseCamera && (
              <TouchableOpacity
                style={[styles.captureButton, isRecording && styles.recordingButton]}
                onPress={takePicture}
                onLongPress={startRecording}
                onPressOut={stopRecording}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            )}

            {canUseCamera && (
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => setCameraType(
                  cameraType === 'back' ? 'front' : 'back'
                )}
              >
                <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        // Editor View
        <View style={styles.editorContainer}>
          {/* Media Background */}
          <View style={styles.mediaContainer}>
            {mediaType === 'photo' ? (
              <Animated.Image
                source={{ uri: capturedMedia }}
                style={[
                  styles.media,
                  selectedFilter ? (styles as any)[`filter_${selectedFilter}`] : null,
                ]}
                {...({ contentFit: 'cover' } as any)}
              />
            ) : (
              <Animated.View style={styles.media}>
                {/* Video player would go here */}
                <Text style={styles.videoPlaceholder}>Video Player</Text>
              </Animated.View>
            )}

            {/* Text Overlays */}
            {textOverlays.map((textOverlay) => (
              <PanGestureHandler key={textOverlay.id} onGestureEvent={panGestureHandler}>
                <PinchGestureHandler onGestureEvent={pinchGestureHandler}>
                  <Animated.View
                    style={[
                      styles.textOverlay,
                      {
                        left: textOverlay.x,
                        top: textOverlay.y,
                        transform: [
                          { scale: textOverlay.scale },
                          { rotate: `${textOverlay.rotation}deg` }
                        ]
                      },
                      selectedTextId === textOverlay.id && styles.selectedOverlay
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => setSelectedTextId(textOverlay.id)}
                      onLongPress={() => deleteTextOverlay(textOverlay.id)}
                    >
                      <Text
                        style={[
                          styles.overlayText,
                          {
                            color: textOverlay.color,
                            fontFamily: textOverlay.fontFamily,
                            fontSize: textOverlay.fontSize,
                            backgroundColor: textOverlay.backgroundColor,
                          }
                        ]}
                      >
                        {textOverlay.text}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                </PinchGestureHandler>
              </PanGestureHandler>
            ))}

            {/* Stickers */}
            {stickers.map((sticker) => (
              <PanGestureHandler key={sticker.id} onGestureEvent={panGestureHandler}>
                <PinchGestureHandler onGestureEvent={pinchGestureHandler}>
                  <Animated.View
                    style={[
                      styles.stickerOverlay,
                      {
                        left: sticker.x,
                        top: sticker.y,
                        transform: [
                          { scale: sticker.scale },
                          { rotate: `${sticker.rotation}deg` }
                        ]
                      }
                    ]}
                  >
                    <TouchableOpacity onLongPress={() => deleteSticker(sticker.id)}>
                      <Text style={styles.stickerText}>{sticker.source}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </PinchGestureHandler>
              </PanGestureHandler>
            ))}
          </View>

          {/* Top Editor Controls */}
          <View style={styles.editorTopControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setCapturedMedia(null)}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.editorActions}>
              <TouchableOpacity
                style={[styles.editorButton, editMode === 'text' && styles.activeEditorButton]}
                onPress={() => {
                  setEditMode('text');
                  setShowTextInput(true);
                }}
              >
                <Ionicons name="text" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.editorButton, editMode === 'sticker' && styles.activeEditorButton]}
                onPress={() => {
                  setEditMode('sticker');
                  setShowStickerPicker(true);
                }}
              >
                <Ionicons name="happy" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.editorButton, editMode === 'draw' && styles.activeEditorButton]}
                onPress={() => setEditMode('draw')}
              >
                <Ionicons name="brush" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.editorButton, editMode === 'filter' && styles.activeEditorButton]}
                onPress={() => {
                  setEditMode('filter');
                  setShowFilterPicker(true);
                }}
              >
                <Ionicons name="color-filter" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.publishButton}
              onPress={publishStory}
            >
              <Text style={styles.publishButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Text Input Modal */}
      <Modal visible={showTextInput} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.textInputContainer}>
            <TextInput
              style={[styles.textInput, { color: textColor }]}
              value={currentText}
              onChangeText={setCurrentText}
              placeholder="Type your text..."
              placeholderTextColor="#999"
              multiline
              autoFocus
            />

            <View style={styles.textControls}>
              <TouchableOpacity
                style={styles.textControlButton}
                onPress={() => setShowColorPicker(true)}
              >
                <View style={[styles.colorPreview, { backgroundColor: textColor }]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.textControlButton}
                onPress={() => setShowFontPicker(true)}
              >
                <Ionicons name="text" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowTextInput(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={addTextOverlay}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Color Picker Modal */}
      <Modal visible={showColorPicker} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.colorPickerContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {textColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    textColor === color && styles.selectedColor
                  ]}
                  onPress={() => {
                    setTextColor(color);
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Font Picker Modal */}
      <Modal visible={showFontPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.fontPickerContainer}>
            <ScrollView>
              {fonts.map((font) => (
                <TouchableOpacity
                  key={font}
                  style={[
                    styles.fontOption,
                    textFont === font && styles.selectedFont
                  ]}
                  onPress={() => {
                    setTextFont(font);
                    setShowFontPicker(false);
                  }}
                >
                  <Text style={[styles.fontOptionText, { fontFamily: font }]}>
                    {font}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sticker Picker Modal */}
      <Modal visible={showStickerPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.stickerPickerContainer}>
            <Text style={styles.stickerTitle}>Emojis</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {stickerCategories.emojis.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.stickerOption}
                  onPress={() => addSticker(emoji)}
                >
                  <Text style={styles.stickerEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.stickerTitle}>Stickers</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {stickerCategories.stickers.map((sticker, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.stickerOption}
                  onPress={() => addSticker(sticker)}
                >
                  <Text style={styles.stickerEmoji}>{sticker}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowStickerPicker(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Filter Picker Modal */}
      <Modal visible={showFilterPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.filterPickerContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.name}
                  style={[
                    styles.filterOption,
                    selectedFilter === filter.value && styles.selectedFilter
                  ]}
                  onPress={() => {
                    setSelectedFilter(filter.value);
                    setShowFilterPicker(false);
                  }}
                >
                  <Text style={styles.filterName}>{filter.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}



